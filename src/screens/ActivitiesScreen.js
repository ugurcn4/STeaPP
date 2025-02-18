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
    Animated
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

const ActivitiesScreen = ({ navigation }) => {
    const [refreshing, setRefreshing] = useState(false);
    const [friends, setFriends] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [activeTab, setActiveTab] = useState('activities'); // 'activities' veya 'notifications'

    const dispatch = useDispatch();
    const {
        notifications,
        loading: notificationsLoading,
        error: notificationsError
    } = useSelector(state => state.notifications);
    const userId = useSelector(state => state.auth.user?.id);

    useEffect(() => {
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
                console.error('Okunmamış mesaj sayısı alınamadı:', error);
            }
        };

        loadUnreadCount();
        const unreadInterval = setInterval(loadUnreadCount, 30000);

        // Bildirimleri yükle
        if (userId) {
            dispatch(fetchNotifications(userId));
        }

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

    // Örnek aktiviteler
    const sampleActivities = [
        {
            id: 1,
            type: 'location',
            userName: 'Ahmet Yılmaz',
            userAvatar: 'https://randomuser.me/api/portraits/men/1.jpg',
            timestamp: '2 saat önce',
            locationName: 'Starbucks Coffee',
            address: 'Bağdat Caddesi No:123',
            locationImage: 'https://images.unsplash.com/photo-1453614512568-c4024d13c247',
            participantCount: 4,
            likes: 12,
            comments: 3
        },
        {
            id: 2,
            type: 'event',
            userName: 'Ayşe Demir',
            userAvatar: 'https://randomuser.me/api/portraits/women/1.jpg',
            timestamp: '3 saat önce',
            eventName: 'Yoga in the Park',
            date: 'Yarın, 09:00',
            eventImage: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b',
            participants: [
                { avatar: 'https://randomuser.me/api/portraits/women/2.jpg' },
                { avatar: 'https://randomuser.me/api/portraits/men/2.jpg' },
                { avatar: 'https://randomuser.me/api/portraits/women/3.jpg' }
            ],
            participantCount: 15,
            likes: 24,
            comments: 5
        },
        {
            id: 3,
            type: 'achievement',
            userName: 'Mehmet Kaya',
            userAvatar: 'https://randomuser.me/api/portraits/men/3.jpg',
            timestamp: '5 saat önce',
            icon: 'trophy',
            title: 'Koşu Rekoru!',
            description: '10 km koşuyu 45 dakikada tamamladı',
            likes: 45,
            comments: 8
        },
        {
            id: 4,
            type: 'location',
            userName: 'Zeynep Şahin',
            userAvatar: 'https://randomuser.me/api/portraits/women/4.jpg',
            timestamp: '6 saat önce',
            locationName: 'Fitness Time Gym',
            address: 'Ataşehir',
            locationImage: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48',
            participantCount: 12,
            likes: 18,
            comments: 4
        },
        {
            id: 5,
            type: 'event',
            userName: 'Can Yılmaz',
            userAvatar: 'https://randomuser.me/api/portraits/men/5.jpg',
            timestamp: '8 saat önce',
            eventName: 'Bisiklet Turu',
            date: 'Cumartesi, 10:00',
            eventImage: 'https://images.unsplash.com/photo-1541625602330-2277a4c46182',
            participants: [
                { avatar: 'https://randomuser.me/api/portraits/men/6.jpg' },
                { avatar: 'https://randomuser.me/api/portraits/women/6.jpg' },
                { avatar: 'https://randomuser.me/api/portraits/men/7.jpg' }
            ],
            participantCount: 25,
            likes: 32,
            comments: 7
        },
        {
            id: 6,
            type: 'achievement',
            userName: 'Elif Demir',
            userAvatar: 'https://randomuser.me/api/portraits/women/7.jpg',
            timestamp: '10 saat önce',
            icon: 'fitness',
            title: 'Yeni Seviye!',
            description: 'Fitness hedefine ulaştı - 30 gün kesintisiz antrenman',
            likes: 56,
            comments: 12
        },
        {
            id: 7,
            type: 'location',
            userName: 'Burak Şahin',
            userAvatar: 'https://randomuser.me/api/portraits/men/8.jpg',
            timestamp: '12 saat önce',
            locationName: 'Sunset Beach Club',
            address: 'Çeşme Marina',
            locationImage: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e',
            participantCount: 8,
            likes: 42,
            comments: 6
        },
        {
            id: 8,
            type: 'event',
            userName: 'Deniz Yıldız',
            userAvatar: 'https://randomuser.me/api/portraits/women/9.jpg',
            timestamp: '1 gün önce',
            eventName: 'Kitap Kulübü Buluşması',
            date: 'Pazar, 15:00',
            eventImage: 'https://images.unsplash.com/photo-1526243741027-444d633d7365',
            participants: [
                { avatar: 'https://randomuser.me/api/portraits/women/10.jpg' },
                { avatar: 'https://randomuser.me/api/portraits/men/10.jpg' },
                { avatar: 'https://randomuser.me/api/portraits/women/11.jpg' }
            ],
            participantCount: 12,
            likes: 28,
            comments: 15
        },
        {
            id: 9,
            type: 'achievement',
            userName: 'Ali Kara',
            userAvatar: 'https://randomuser.me/api/portraits/men/11.jpg',
            timestamp: '1 gün önce',
            icon: 'medal',
            title: 'Maraton Tamamlandı!',
            description: 'İlk yarı maratonunu 1 saat 45 dakikada tamamladı',
            likes: 89,
            comments: 23
        },
        {
            id: 10,
            type: 'location',
            userName: 'Selin Ak',
            userAvatar: 'https://randomuser.me/api/portraits/women/12.jpg',
            timestamp: '1 gün önce',
            locationName: 'Summit Cafe & Restaurant',
            address: 'Nişantaşı',
            locationImage: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4',
            participantCount: 6,
            likes: 34,
            comments: 8
        }
    ];

    const handleNotificationPress = async (notification) => {
        if (notification.status === 'unread') {
            dispatch(markNotificationAsRead(notification._id));
        }

        // Bildirim tipine göre yönlendirme
        switch (notification.type) {
            case 'friendRequest':
                navigation.navigate('FriendRequests', {
                    userId: notification.data.senderId
                });
                break;
            case 'message':
                navigation.navigate('DirectMessages', {
                    screen: 'Chat',
                    params: { conversationId: notification.data.conversationId }
                });
                break;
            case 'activity':
                // İlgili aktiviteye yönlendir
                break;
        }
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
                <Ionicons name="add-circle-outline" size={24} color="#000" style={styles.headerIcon} />
                <Ionicons name="heart-outline" size={24} color="#000" style={styles.headerIcon} />
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
                                {/* Stories */}
                                <Stories friends={friends} navigation={navigation} />

                                {/* Separator */}
                                <View style={styles.separator} />

                                {/* Activities */}
                                {sampleActivities.map(activity => (
                                    <Activity key={activity.id} activity={activity} />
                                ))}
                            </>
                        ) : (
                            <>
                                {notificationsLoading ? (
                                    <View style={styles.centerContainer}>
                                        <ActivityIndicator size="large" color="#2196F3" />
                                    </View>
                                ) : notifications && notifications.length > 0 ? (
                                    notifications.map(notification => (
                                        <NotificationItem
                                            key={notification.id}
                                            notification={notification}
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
    separator: {
        height: 0.5,
        backgroundColor: '#DBDBDB',
        marginVertical: 10,
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
});

export default ActivitiesScreen; 