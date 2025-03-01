import React, { useState, useEffect } from 'react';
import {
    View,
    ScrollView,
    StyleSheet,
    RefreshControl,
    SafeAreaView,
    Text,
    StatusBar,
    Platform,
    TouchableOpacity,
    Animated,
    ActivityIndicator
} from 'react-native';
import { GestureHandlerRootView, PanGestureHandler, State } from 'react-native-gesture-handler';
import Stories from '../components/Stories';
import { getCurrentUserUid } from '../services/friendFunctions';
import { getFriends } from '../services/friendService';
import { Ionicons } from '@expo/vector-icons';
import { checkAndDeleteExpiredStories } from '../services/storyService';
import Activity from '../components/Activity';
import { getRecentChats, getUnreadMessageCount } from '../services/messageService';
import { useSelector, useDispatch } from 'react-redux';
import { fetchNotifications, markNotificationAsRead } from '../redux/slices/notificationSlice';
import NotificationItem from '../components/NotificationItem';
import FastImage from 'react-native-fast-image';
import { fetchPosts, toggleLikePost, addComment, deleteComment } from '../services/postService';
import { getAuth } from 'firebase/auth';

const ActivitiesScreen = ({ navigation }) => {
    const [refreshing, setRefreshing] = useState(false);
    const [friends, setFriends] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [activeTab, setActiveTab] = useState('activities'); // 'activities' veya 'notifications'
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const auth = getAuth();
    const currentUser = auth.currentUser; // Firebase'den current user'ı alalım

    const dispatch = useDispatch();
    const {
        notifications,
        loading: notificationsLoading,
        error: notificationsError
    } = useSelector(state => state.notifications);
    const userId = useSelector(state => state.auth.user?.id);

    const [isSubmittingComment, setIsSubmittingComment] = useState(false);

    useEffect(() => {
        const initializeData = async () => {
            try {
                const currentUid = await getCurrentUserUid();

                if (currentUid) {
                    dispatch(fetchNotifications(currentUid));
                }
            } catch (error) {
                // Hata durumunda sessizce devam et
            }
        };

        initializeData();
        fetchFriends();
        checkAndDeleteExpiredStories();

        const interval = setInterval(checkAndDeleteExpiredStories, 60 * 60 * 1000);

        const loadUnreadCount = async () => {
            try {
                const uid = await getCurrentUserUid();
                if (uid) {
                    const count = await getUnreadMessageCount(uid);
                    setUnreadCount(count);
                }
            } catch (error) {
                // Hata durumunda sessizce devam et
            }
        };

        loadUnreadCount();
        const unreadInterval = setInterval(loadUnreadCount, 30000);

        navigation.setOptions({
            cardStyle: { backgroundColor: '#fff' },
            cardStyleInterpolator: ({ current: { progress } }) => ({
                cardStyle: {
                    opacity: progress,
                },
            }),
        });

        return () => {
            clearInterval(interval);
            clearInterval(unreadInterval);
        };
    }, [navigation, userId, dispatch]);

    useEffect(() => {
        loadPosts();
    }, []);

    const loadPosts = async () => {
        try {
            setLoading(true);
            if (!currentUser?.uid) return;

            const fetchedPosts = await fetchPosts(currentUser.uid);
            setPosts(fetchedPosts);
        } catch (error) {
            console.error('Gönderiler yüklenirken hata:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleLikePress = async (postId) => {
        if (!currentUser?.uid) {
            return;
        }

        try {
            const isLiked = await toggleLikePost(postId, currentUser.uid);
            setPosts(currentPosts =>
                currentPosts.map(post => {
                    if (post.id === postId) {
                        // Mevcut beğeni sayısını al
                        const currentLikes = post.stats?.likes || 0;
                        // Beğeni durumuna göre sayıyı güncelle (0'dan küçük olamaz)
                        const newLikes = Math.max(0, currentLikes + (isLiked ? 1 : -1));

                        return {
                            ...post,
                            likedBy: isLiked
                                ? [...(post.likedBy || []), currentUser.uid]
                                : (post.likedBy || []).filter(id => id !== currentUser.uid),
                            stats: {
                                ...post.stats,
                                likes: newLikes
                            }
                        };
                    }
                    return post;
                })
            );
        } catch (error) {
            console.error('Beğeni hatası:', error);
        }
    };

    const handleCommentSubmit = async (postId, comment, replyToId = null) => {
        // Boş yorum kontrolü
        if (!comment || comment.trim() === '') {
            return;
        }

        // İşlem devam ederken yeni yorum eklemeyi engelle
        if (isSubmittingComment) {
            return;
        }

        try {
            setIsSubmittingComment(true); // İşlem başladı

            if (comment === 'delete') {
                // Yorum silme işlemi
                await deleteComment(postId, replyToId, currentUser.uid);
                // Yorumları güncelle
                setPosts(currentPosts =>
                    currentPosts.map(post => {
                        if (post.id === postId) {
                            return {
                                ...post,
                                comments: post.comments.filter(c => c.id !== replyToId),
                                stats: {
                                    ...post.stats,
                                    comments: (post.stats?.comments || 1) - 1
                                }
                            };
                        }
                        return post;
                    })
                );
            } else {
                // Normal yorum ekleme işlemi
                const newComment = await addComment(postId, currentUser.uid, comment, replyToId);
                setPosts(currentPosts =>
                    currentPosts.map(post => {
                        if (post.id === postId) {
                            if (replyToId) {
                                // Yanıt ekleme durumu
                                const updatedComments = post.comments.map(c => {
                                    if (c.id === replyToId) {
                                        return {
                                            ...c,
                                            replies: [...(c.replies || []), newComment]
                                        };
                                    }
                                    return c;
                                });
                                return {
                                    ...post,
                                    comments: updatedComments,
                                    stats: {
                                        ...post.stats,
                                        comments: (post.stats?.comments || 0) + 1
                                    }
                                };
                            } else {
                                // Yeni yorum ekleme durumu
                                return {
                                    ...post,
                                    comments: [...(post.comments || []), newComment],
                                    stats: {
                                        ...post.stats,
                                        comments: (post.stats?.comments || 0) + 1
                                    }
                                };
                            }
                        }
                        return post;
                    })
                );
            }
        } catch (error) {
            console.error('Yorum işlemi hatası:', error);
        } finally {
            setIsSubmittingComment(false); // İşlem bitti
        }
    };

    const fetchFriends = async () => {
        try {
            const uid = await getCurrentUserUid();
            if (uid) {
                const friendsList = await getFriends(uid);
                setFriends(friendsList);
            }
        } catch (error) {
            console.error('Arkadaşları getirme hatası:', error);
        }
    };

    const onRefresh = React.useCallback(async () => {
        setRefreshing(true);
        try {
            await fetchFriends();
            if (userId && activeTab === 'notifications') {
                await dispatch(fetchNotifications(userId));
            }
        } catch (error) {
            console.error('Yenileme hatası:', error);
        } finally {
            setRefreshing(false);
        }
    }, [activeTab, userId, dispatch]);

    // Tab değiştiğinde bildirimleri yükle
    useEffect(() => {
        if (activeTab === 'notifications' && userId) {
            dispatch(fetchNotifications(userId));
        }
    }, [activeTab, userId, dispatch]);

    const onGestureEvent = ({ nativeEvent }) => {
        if (nativeEvent.state === State.END) {
            if (nativeEvent.translationX < -50) {
                navigation.navigate('DirectMessages');
            }
        }
    };


    const handleNotificationPress = async (notification) => {

        if (notification.status === 'unread') {
            dispatch(markNotificationAsRead(notification.id));
        }

        // Bildirim tipine göre yönlendirme
        switch (notification.type) {
            case 'friendRequest':
                navigation.navigate('FriendRequests', {
                    userId: notification.data?.senderId
                });
                break;
            case 'message':
                navigation.navigate('DirectMessages', {
                    screen: 'Chat',
                    params: {
                        conversationId: notification.data?.chatId || notification.chatId,
                        otherUserId: notification.data?.senderId || notification.senderId
                    }
                });
                break;
            case 'activity':
                // İlgili aktiviteye yönlendir
                break;
            default:
        }
    };

    const handlePostUpdate = (updatedPost) => {
        setPosts(currentPosts =>
            currentPosts.map(post =>
                post.id === updatedPost.id ? updatedPost : post
            )
        );
    };

    const handlePostDelete = (postId) => {
        setPosts(currentPosts =>
            currentPosts.filter(post => post.id !== postId)
        );
    };

    const renderHeader = () => (
        <View style={styles.header}>
            <View style={styles.headerTabs}>
                <TouchableOpacity
                    onPress={() => setActiveTab('activities')}
                    style={styles.headerTab}
                >
                    <Text style={[
                        styles.headerTabText,
                        activeTab === 'activities' && styles.activeHeaderTabText
                    ]}>
                        Keşfet
                    </Text>
                </TouchableOpacity>
                <Text style={styles.headerTabDivider}>|</Text>
                <TouchableOpacity
                    onPress={() => setActiveTab('notifications')}
                    style={styles.headerTab}
                >
                    <Text style={[
                        styles.headerTabText,
                        activeTab === 'notifications' && styles.activeHeaderTabText
                    ]}>
                        Bildirimler
                    </Text>
                </TouchableOpacity>
            </View>
            <View style={styles.headerRight}>
                <TouchableOpacity
                    onPress={() => navigation.navigate('CreatePost')}
                    style={styles.headerIcon}
                >
                    <Ionicons name="add-circle-outline" size={24} color="#000" />
                </TouchableOpacity>
                <TouchableOpacity
                    onPress={() => navigation.navigate('LikedPosts')}
                    style={styles.headerIcon}
                >
                    <Ionicons name="heart-outline" size={24} color="#000" />
                </TouchableOpacity>
                <TouchableOpacity
                    onPress={() => navigation.navigate('DirectMessages')}
                    style={styles.messageIconContainer}
                >
                    <Ionicons name="chatbubble-outline" size={24} color="#000" />
                    {unreadCount > 0 && (
                        <View style={styles.unreadBadge}>
                            <Text style={styles.unreadCount}>
                                {unreadCount > 99 ? '99+' : unreadCount}
                            </Text>
                        </View>
                    )}
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <PanGestureHandler
                onHandlerStateChange={onGestureEvent}
                activeOffsetX={[-20, 20]}
            >
                <SafeAreaView style={styles.container}>
                    <StatusBar barStyle="dark-content" />

                    {renderHeader()}

                    <ScrollView
                        style={styles.content}
                        contentContainerStyle={styles.scrollContent}
                        refreshControl={
                            <RefreshControl
                                refreshing={refreshing}
                                onRefresh={onRefresh}
                                colors={['#2196F3']}
                                tintColor="#2196F3"
                            />
                        }
                    >
                        {activeTab === 'activities' ? (
                            <>
                                <Stories friends={friends} navigation={navigation} />
                                <View style={styles.separator} />
                                {/* Aktiviteler Listesi */}
                                {posts.map(post => (
                                    <Activity
                                        key={post.id}
                                        activity={post}
                                        onLikePress={() => handleLikePress(post.id)}
                                        onCommentPress={(comment, replyToId) => {
                                            handleCommentSubmit(post.id, comment, replyToId);
                                        }}
                                        isLiked={post.likedBy?.includes(currentUser?.uid)}
                                        currentUserId={currentUser?.uid}
                                        onUpdate={handlePostUpdate}
                                        onDelete={handlePostDelete}
                                        navigation={navigation}
                                    />
                                ))}
                            </>
                        ) : (
                            <>
                                {notificationsLoading ? (
                                    <View style={styles.centerContainer}>
                                        <ActivityIndicator size="large" color="#25D220" />
                                    </View>
                                ) : notifications && notifications.length > 0 ? (
                                    notifications.map(notification => (
                                        <NotificationItem
                                            key={notification.id}
                                            notification={{
                                                ...notification,
                                                title: notification.title || 'Yeni Bildirim',
                                                body: notification.body || '',
                                                type: notification.type || 'message'
                                            }}
                                            onPress={() => handleNotificationPress(notification)}
                                        />
                                    ))
                                ) : (
                                    <View style={styles.emptyContainer}>
                                        <Text style={styles.emptyText}>
                                            Henüz bildiriminiz bulunmuyor
                                        </Text>
                                    </View>
                                )}
                            </>
                        )}
                    </ScrollView>
                </SafeAreaView>
            </PanGestureHandler>
        </GestureHandlerRootView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
        paddingBottom: 10,
        borderBottomWidth: 0.5,
        borderBottomColor: '#DBDBDB',
    },
    headerTabs: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    headerTab: {
        paddingVertical: 4,
        paddingHorizontal: 4,
    },
    headerTabText: {
        fontSize: 24,
        fontWeight: '600',
        color: '#8E8E8E',
    },
    activeHeaderTabText: {
        color: '#262626',
    },
    headerTabDivider: {
        fontSize: 24,
        fontWeight: '300',
        color: '#8E8E8E',
        marginHorizontal: 8,
    },
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    headerIcon: {
        marginRight: 16,
    },
    content: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: 80,
    },
    separator: {
        height: 0.5,
        backgroundColor: '#DBDBDB',
        marginBottom: 0,
        marginTop: 0,
    },
    activityPlaceholder: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 40,
        paddingHorizontal: 20,
    },
    placeholderText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#262626',
        marginBottom: 8,
    },
    placeholderSubText: {
        fontSize: 14,
        color: '#8E8E8E',
        textAlign: 'center',
    },
    messageIconContainer: {
        position: 'relative',
        width: 24,
        height: 24,
    },
    unreadBadge: {
        position: 'absolute',
        top: -6,
        right: -10,
        backgroundColor: '#FF3B30',
        borderRadius: 10,
        minWidth: 18,
        height: 18,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 4,
        borderWidth: 1.5,
        borderColor: '#fff',
        zIndex: 1,
    },
    unreadCount: {
        color: '#fff',
        fontSize: 10,
        fontWeight: '700',
        textAlign: 'center',
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 20,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    emptyText: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
    },
    activityCard: {
        backgroundColor: '#fff',
        borderRadius: 15,
        marginHorizontal: 12,
        marginVertical: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        overflow: 'hidden',
    },
    activityHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 12,
    },
    userInfoContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatarImage: {
        width: 40,
        height: 40,
        borderRadius: 20,
        borderWidth: 2,
        borderColor: '#E91E63',
    },
    userTextContainer: {
        marginLeft: 10,
    },
    username: {
        fontSize: 15,
        fontWeight: '600',
        color: '#333',
    },
    timestamp: {
        fontSize: 12,
        color: '#666',
        marginTop: 2,
    },
    moreButton: {
        padding: 5,
    },
    contentContainer: {
        position: 'relative',
    },
    activityImage: {
        width: '100%',
        height: 300,
        borderRadius: 8,
    },
    contentOverlay: {
        backgroundColor: 'rgba(0,0,0,0.03)',
        padding: 12,
        borderBottomLeftRadius: 8,
        borderBottomRightRadius: 8,
    },
    contentText: {
        fontSize: 14,
        color: '#333',
        lineHeight: 20,
    },
    activityFooter: {
        padding: 12,
    },
    interactionContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    interactionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 8,
    },
    interactionCount: {
        marginLeft: 5,
        fontSize: 14,
        color: '#666',
        fontWeight: '500',
    },
});

export default ActivitiesScreen; 