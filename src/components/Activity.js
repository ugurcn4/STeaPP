import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, ScrollView, TouchableWithoutFeedback, Animated, Alert, Modal, TextInput, Platform } from 'react-native';
import FastImage from 'react-native-fast-image';
import { Ionicons } from '@expo/vector-icons';
import { formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';
import { LinearGradient } from 'expo-linear-gradient';
import CommentsModal from './CommentsModal';
import { subscribeToPost, deletePost, toggleArchivePost, createArchiveGroup, updatePostArchiveGroups, fetchArchiveGroups, quickSavePost } from '../services/postService';
import ArchiveGroupModal from '../modals/ArchiveGroupModal';
import Toast from 'react-native-toast-message';
import FriendProfileModal from '../modals/friendProfileModal';
import { getDoc, doc } from 'firebase/firestore';
import { db } from '../../firebaseConfig';

const { width } = Dimensions.get('window');

const Activity = ({ activity, onLikePress, onCommentPress, isLiked, currentUserId, onUpdate, onDelete, navigation }) => {
    const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
    const [isCommentsModalVisible, setIsCommentsModalVisible] = useState(false);
    const maxLength = 100; // Maksimum karakter sayısı
    const [localLiked, setLocalLiked] = useState(isLiked);
    const [showHeartAnimation, setShowHeartAnimation] = useState(false);
    const [heartPosition, setHeartPosition] = useState({ x: 0, y: 0 });
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(0)).current;
    const [lastTap, setLastTap] = useState(null);
    const DOUBLE_TAP_DELAY = 300; // milisaniye cinsinden çift tıklama aralığı
    const [showOptions, setShowOptions] = useState(false);
    const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
    const isOwner = activity.userId === currentUserId;
    const [isArchived, setIsArchived] = useState(activity.archivedBy?.includes(currentUserId));
    const [showArchiveModal, setShowArchiveModal] = useState(false);
    const [archiveGroups, setArchiveGroups] = useState([]);
    const [selectedGroups, setSelectedGroups] = useState(activity.archiveGroups || []);
    const [isSaving, setIsSaving] = useState(false);
    const [selectedFriend, setSelectedFriend] = useState(null);
    const [friendModalVisible, setFriendModalVisible] = useState(false);

    useEffect(() => {
        setLocalLiked(isLiked);
    }, [isLiked]);

    useEffect(() => {
        // Post'u gerçek zamanlı dinle
        const unsubscribe = subscribeToPost(activity.id, (updatedPost) => {
            if (onUpdate) {
                onUpdate(updatedPost);
            }
        });

        return () => unsubscribe();
    }, [activity.id]);

    useEffect(() => {
        if (showArchiveModal) {
            loadArchiveGroups();
        }
    }, [showArchiveModal]);

    const handleLikePress = useCallback(() => {
        setLocalLiked(!localLiked);
        onLikePress();
    }, [localLiked, onLikePress]);

    const handleUserPress = useCallback(() => {
        if (activity.user) {
            // Kullanıcı verisini daha kapsamlı hazırlayalım
            const completeUserData = {
                ...activity.user,
                id: activity.userId || activity.user.id,
                name: activity.user.name || 'İsimsiz Kullanıcı',
                profilePicture: activity.user.profilePicture || activity.user.avatar || null,
                bio: activity.user.bio || activity.user.informations?.bio || '',
                friends: activity.user.friends || [],
                informations: {
                    ...(activity.user.informations || {}),
                    name: activity.user.name || activity.user.informations?.name || 'İsimsiz Kullanıcı',
                    username: activity.user.username ||
                        activity.user.informations?.username ||
                        (activity.user.name || activity.user.informations?.name || 'Kullanıcı').toLowerCase().replace(/\s+/g, '_'),
                    bio: activity.user.bio || activity.user.informations?.bio || ''
                }
            };

            // Kullanıcının tam bilgilerini Firestore'dan alalım
            fetchCompleteUserData(completeUserData);
        }
    }, [activity.user, activity.userId]);

    const handleCommentUserPress = (user) => {
        if (user) {
            const completeUserData = {
                ...user,
                id: user.id,
                name: user.name || 'İsimsiz Kullanıcı',
                profilePicture: user.profilePicture || user.avatar || null,
                bio: user.bio || user.informations?.bio || '',
                friends: user.friends || [],
                informations: {
                    ...(user.informations || {}),
                    name: user.name || user.informations?.name || 'İsimsiz Kullanıcı',
                    username: user.username ||
                        user.informations?.username ||
                        (user.name || user.informations?.name || 'Kullanıcı').toLowerCase().replace(/\s+/g, '_'),
                    bio: user.bio || user.informations?.bio || ''
                }
            };

            // Kullanıcının tam bilgilerini Firestore'dan alalım
            fetchCompleteUserData(completeUserData);
        }
    };

    // Kullanıcının tam bilgilerini Firestore'dan alan yeni fonksiyon
    const fetchCompleteUserData = async (userData) => {
        try {
            if (!userData.id) {
                setSelectedFriend(userData);
                setFriendModalVisible(true);
                return;
            }

            const userDoc = await getDoc(doc(db, 'users', userData.id));
            if (userDoc.exists()) {
                const firebaseUserData = userDoc.data();

                // Mevcut verilerle Firestore verilerini birleştir
                const mergedUserData = {
                    ...userData,
                    profilePicture: userData.profilePicture || firebaseUserData.profilePicture || null,
                    bio: userData.bio || firebaseUserData.bio || firebaseUserData.informations?.bio || '',
                    friends: firebaseUserData.friends || [],
                    informations: {
                        ...(userData.informations || {}),
                        ...(firebaseUserData.informations || {}),
                        name: userData.name || firebaseUserData.informations?.name || 'İsimsiz Kullanıcı',
                        username: userData.informations?.username ||
                            firebaseUserData.informations?.username ||
                            (userData.name || firebaseUserData.informations?.name || 'Kullanıcı').toLowerCase().replace(/\s+/g, '_'),
                        bio: userData.bio || firebaseUserData.bio || firebaseUserData.informations?.bio || ''
                    }
                };

                setSelectedFriend(mergedUserData);
            } else {
                // Firestore'da kullanıcı bulunamadıysa mevcut verileri kullan
                setSelectedFriend(userData);
            }

            setFriendModalVisible(true);
        } catch (error) {
            console.error('Kullanıcı bilgileri alınırken hata:', error);
            // Hata durumunda mevcut verileri kullan
            setSelectedFriend(userData);
            setFriendModalVisible(true);
        }
    };

    const fetchUserInfo = async (userId) => {
        try {
            const userDoc = await getDoc(doc(db, 'users', userId));
            if (userDoc.exists()) {
                const userData = userDoc.data();
                const user = {
                    id: userId,
                    name: userData.informations?.name || 'İsimsiz Kullanıcı',
                    profilePicture: userData.profilePicture || userData.avatar || null,
                    bio: userData.bio || userData.informations?.bio || '',
                    friends: userData.friends || [],
                    informations: {
                        ...(userData.informations || {}),
                        name: userData.informations?.name || 'İsimsiz Kullanıcı',
                        username: userData.informations?.username ||
                            userData.username ||
                            (userData.informations?.name || 'Kullanıcı').toLowerCase().replace(/\s+/g, '_'),
                        bio: userData.bio || userData.informations?.bio || ''
                    }
                };
                setSelectedFriend(user);
                setFriendModalVisible(true);
            }
        } catch (error) {
            console.error('Kullanıcı bilgileri alınırken hata:', error);
        }
    };

    const renderDescription = () => {
        if (!activity.description) return null;

        if (activity.description.length <= maxLength || isDescriptionExpanded) {
            return (
                <Text style={styles.description}>
                    <Text style={styles.username}>{activity.user.name}</Text>
                    {" "}{activity.description}
                </Text>
            );
        }

        return (
            <View>
                <Text style={styles.description}>
                    <Text style={styles.username}>{activity.user.name}</Text>
                    {" "}{activity.description.slice(0, maxLength)}...{" "}
                    <Text
                        style={styles.seeMore}
                        onPress={() => setIsDescriptionExpanded(true)}
                    >
                        devamını gör
                    </Text>
                </Text>
            </View>
        );
    };

    const renderComments = () => {
        if (!activity.comments || activity.comments.length === 0) return null;

        return (
            <View style={styles.commentsContainer}>
                {activity.comments.slice(0, 2).map((comment, index) => (
                    <View key={comment.id} style={styles.commentItem}>
                        <Text style={styles.commentText}>
                            <Text
                                style={styles.commentUsername}
                                onPress={() => handleCommentUserPress(comment.user)}
                            >
                                {comment.user?.name || 'Kullanıcı'}
                            </Text>
                            {" "}{comment.text}
                        </Text>
                    </View>
                ))}
                {activity.comments.length > 2 && (
                    <TouchableOpacity onPress={handleCommentPress}>
                        <Text style={styles.viewAllComments}>
                            {activity.comments.length} yorumun tümünü gör
                        </Text>
                    </TouchableOpacity>
                )}
            </View>
        );
    };

    const handleCommentPress = () => {
        setIsCommentsModalVisible(true);
    };

    const handleCloseComments = () => {
        setIsCommentsModalVisible(false);
    };

    const handleAddComment = (comment, replyToId) => {
        onCommentPress(comment, replyToId);
    };

    const handleDeleteComment = async (commentId) => {
        try {
            // Silme işlemini parent komponente ilet
            await onCommentPress('delete', commentId);
        } catch (error) {
            console.error('Yorum silme hatası:', error);
        }
    };

    const handleImagePress = (event) => {
        const now = Date.now();

        if (lastTap && (now - lastTap) < DOUBLE_TAP_DELAY) {
            // Çift tıklama algılandı
            setLastTap(null); // Reset

            // Tıklama pozisyonunu kaydet
            setHeartPosition({
                x: event.nativeEvent.locationX,
                y: event.nativeEvent.locationY
            });

            // Kalp animasyonunu göster
            setShowHeartAnimation(true);

            // Opaklık ve ölçek animasyonlarını başlat
            Animated.parallel([
                Animated.sequence([
                    Animated.timing(fadeAnim, {
                        toValue: 1,
                        duration: 200,
                        useNativeDriver: true,
                    }),
                    Animated.timing(fadeAnim, {
                        toValue: 0,
                        duration: 200,
                        delay: 500,
                        useNativeDriver: true,
                    }),
                ]),
                Animated.sequence([
                    Animated.spring(scaleAnim, {
                        toValue: 1,
                        friction: 3,
                        useNativeDriver: true,
                    }),
                    Animated.timing(scaleAnim, {
                        toValue: 0,
                        duration: 200,
                        delay: 500,
                        useNativeDriver: true,
                    }),
                ]),
            ]).start(() => {
                setShowHeartAnimation(false);
                scaleAnim.setValue(0);
            });

            // Beğenilmemişse beğeni işlemini gerçekleştir
            if (!localLiked) {
                handleLikePress();
            }
        } else {
            setLastTap(now);
        }
    };

    const handleOptionsPress = (event) => {
        // Butonun konumunu al
        const { pageX, pageY } = event.nativeEvent;
        setMenuPosition({ x: pageX, y: pageY });
        setShowOptions(true);
    };

    const handleDeletePress = () => {
        setShowOptions(false);
        Alert.alert(
            'Gönderiyi Sil',
            'Bu gönderiyi silmek istediğinizden emin misiniz?',
            [
                {
                    text: 'İptal',
                    style: 'cancel'
                },
                {
                    text: 'Sil',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await deletePost(activity.id);
                            if (onDelete) {
                                onDelete(activity.id);
                            }
                        } catch (error) {
                            Alert.alert('Hata', error.message);
                        }
                    }
                }
            ]
        );
    };

    const handleArchivePress = async () => {
        if (isSaving) return; // Çift tıklamayı önle

        try {
            setIsSaving(true);
            
            // Eğer zaten arşivlenmişse, arşivden kaldır
            if (isArchived) {
                // Arşivden kaldırma işlemi
                await toggleArchivePost(activity.id, currentUserId);
                
                // UI'ı güncelle
                setIsArchived(false);
                setSelectedGroups([]);
                
                // Başarılı kaldırma bildirimi göster
                Toast.show({
                    type: 'success',
                    text1: 'Kaydedilenlerden Kaldırıldı',
                    position: 'bottom',
                    visibilityTime: 2000,
                });
            } else {
                // Yeni kaydetme işlemi
                const defaultCollection = await quickSavePost(activity.id, currentUserId);
                
                // UI'ı güncelle
                setIsArchived(true);
                setSelectedGroups([defaultCollection.id]);
                
                // Başarılı kaydetme bildirimi göster
                Toast.show({
                    type: 'success',
                    text1: 'Kaydedildi',
                    text2: `"${defaultCollection.name}" koleksiyonuna eklendi`,
                    position: 'bottom',
                    visibilityTime: 2000,
                });
            }
        } catch (error) {
            console.error('Kaydetme/kaldırma hatası:', error);
            Toast.show({
                type: 'error',
                text1: 'Hata',
                text2: 'İşlem sırasında bir hata oluştu',
                position: 'bottom',
            });
        } finally {
            setIsSaving(false);
        }
    };

    const handleArchiveLongPress = () => {
        setShowArchiveModal(true);
    };

    const loadArchiveGroups = async () => {
        try {
            const groups = await fetchArchiveGroups(currentUserId);
            setArchiveGroups(groups);
            setSelectedGroups(activity.archiveGroups || []);
        } catch (error) {
            console.error('Arşiv grupları yüklenirken hata:', error);
        }
    };

    const handleCreateGroup = async (groupData) => {
        try {
            const newGroup = await createArchiveGroup(currentUserId, groupData);
            // Yeni grubu state'e ekle
            setArchiveGroups(prev => [...prev, newGroup]);
            return newGroup; // Oluşturulan grubu dön
        } catch (error) {
            console.error('Grup oluşturma hatası:', error);
            throw error; // Hatayı yukarı ilet
        }
    };

    const handleSaveArchiveGroups = async (groupIds) => {
        try {
            if (!Array.isArray(groupIds)) {
                console.error('Geçersiz grup ID listesi');
                return;
            }

            // 1. Grup bilgisini güncelle
            await updatePostArchiveGroups(activity.id, currentUserId, groupIds);

            // 2. UI'ı güncelle
            setIsArchived(true);
            setSelectedGroups(groupIds);

            // 3. Modal'ı kapat
            setShowArchiveModal(false);
        } catch (error) {
            console.error('Arşivleme hatası:', error);
            Alert.alert('Hata', 'Koleksiyon kaydedilirken bir hata oluştu');
        }
    };

    const fetchGroups = async () => {
        try {
            const groups = await fetchArchiveGroups(currentUserId);
            setArchiveGroups(groups);
        } catch (error) {
            console.error('Grupları getirme hatası:', error);
        }
    };

    useEffect(() => {
        fetchGroups();
    }, []);

    return (
        <View style={styles.activityCard}>
            <View style={styles.activityHeader}>
                <View style={styles.userInfoContainer}>
                    <TouchableOpacity style={styles.userInfo} onPress={handleUserPress}>
                        <FastImage
                            source={{
                                uri: activity.user?.avatar || 'https://via.placeholder.com/40',
                                priority: FastImage.priority.normal,
                            }}
                            style={styles.avatarImage}
                        />
                        <View style={styles.userTextContainer}>
                            <Text style={styles.username}>{activity.user?.name || 'İsimsiz Kullanıcı'}</Text>
                            <Text style={styles.timestamp}>
                                {formatDistanceToNow(activity.createdAt, { addSuffix: true, locale: tr })}
                            </Text>
                        </View>
                    </TouchableOpacity>
                </View>
            </View>

            <TouchableWithoutFeedback onPress={handleImagePress}>
                <View style={styles.imageContainer}>
                    <FastImage
                        source={{ uri: activity.imageUrl }}
                        style={styles.activityImage}
                        resizeMode={FastImage.resizeMode.cover}
                    />
                    <LinearGradient
                        colors={['transparent', 'rgba(0,0,0,0.3)']}
                        style={styles.imageGradient}
                    />
                    {showHeartAnimation && (
                        <Animated.View
                            style={[
                                styles.heartAnimation,
                                {
                                    left: heartPosition.x - 50,
                                    top: heartPosition.y - 50,
                                    opacity: fadeAnim,
                                    transform: [
                                        { scale: scaleAnim }
                                    ]
                                }
                            ]}
                        >
                            <Ionicons name="heart" size={100} color="#fff" />
                        </Animated.View>
                    )}
                </View>
            </TouchableWithoutFeedback>

            <View style={styles.contentContainer}>
                <View style={styles.interactionContainer}>
                    <View style={styles.leftInteractions}>
                        <View style={styles.likeContainer}>
                            <TouchableOpacity
                                style={[styles.likeButton, localLiked && styles.likeButtonActive]}
                                onPress={handleLikePress}
                            >
                                <Ionicons
                                    name={localLiked ? "heart" : "heart-outline"}
                                    size={24}
                                    color={localLiked ? "#E91E63" : "#666"}
                                />
                            </TouchableOpacity>

                            <View style={styles.likeDivider} />

                            <TouchableOpacity
                                style={styles.likeCountButton}
                                onPress={() => navigation.navigate('LikedBy', {
                                    postId: activity.id,
                                    likedBy: activity.likedBy || []
                                })}
                            >
                                <Text style={[
                                    styles.interactionCount,
                                    localLiked && styles.interactionCountActive
                                ]}>
                                    {activity.stats?.likes || 0}
                                </Text>
                            </TouchableOpacity>
                        </View>

                        <View style={styles.commentContainer}>
                            <TouchableOpacity
                                style={styles.commentButton}
                                onPress={() => setIsCommentsModalVisible(true)}
                            >
                                <Ionicons
                                    name="chatbubble-outline"
                                    size={22}
                                    color="#2196F3"
                                />
                            </TouchableOpacity>

                            <View style={styles.commentDivider} />

                            <TouchableOpacity
                                style={styles.commentCountButton}
                                onPress={() => setIsCommentsModalVisible(true)}
                            >
                                <Text style={styles.interactionCount}>
                                    {activity.stats?.comments || 0}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                    <TouchableOpacity
                        style={styles.bookmarkButton}
                        onPress={handleArchivePress}
                        onLongPress={handleArchiveLongPress}
                        delayLongPress={500}
                        disabled={isSaving}
                    >
                        <Ionicons
                            name={isArchived ? "bookmark" : "bookmark-outline"}
                            size={22}
                            color={isArchived ? "#2196F3" : "#666"}
                        />
                    </TouchableOpacity>
                </View>

                {/* Yeni beğeni özeti bölümü */}
                {activity.likedBy && activity.likedBy.length > 0 && (
                    <View style={styles.likeSummaryContainer}>
                        <TouchableOpacity
                            onPress={() => navigation.navigate('LikedBy', {
                                postId: activity.id,
                                likedBy: activity.likedBy || []
                            })}
                        >
                            <Text style={styles.likeSummaryTextLight}>
                                {(() => {
                                    // Tek beğeni varsa
                                    if (activity.likedBy.length === 1) {
                                        if (activity.likedBy[0] === currentUserId) {
                                            return (
                                                <Text>
                                                    <Text style={styles.likeSummaryTextBold}>Siz</Text>
                                                    <Text style={styles.likeSummaryTextLight}> beğendiniz</Text>
                                                </Text>
                                            );
                                        }

                                        // Burada düzeltme yapalım
                                        return (
                                            <Text>
                                                <Text
                                                    style={styles.likeSummaryTextBold}
                                                    onPress={(e) => {
                                                        e.stopPropagation(); // Üst TouchableOpacity'nin tetiklenmesini engelle
                                                        handleCommentUserPress(activity.user);
                                                    }}
                                                >
                                                    {activity.user?.name || 'Kullanıcı'}
                                                </Text>
                                                <Text style={styles.likeSummaryTextLight}> beğendi</Text>
                                            </Text>
                                        );
                                    }

                                    // Birden fazla beğeni varsa
                                    const isCurrentUserFirst = activity.likedBy[0] === currentUserId;
                                    const firstLiker = isCurrentUserFirst ? 'Siz' : (activity.firstLikerName || activity.user?.name || 'Kullanıcı');
                                    const otherCount = activity.likedBy.length - 1;

                                    return (
                                        <Text>
                                            {isCurrentUserFirst ? (
                                                <Text style={styles.likeSummaryTextBold}>{firstLiker}</Text>
                                            ) : (
                                                <Text
                                                    style={styles.likeSummaryTextBold}
                                                    onPress={(e) => {
                                                        e.stopPropagation(); // Üst TouchableOpacity'nin tetiklenmesini engelle
                                                        if (activity.likedBy && activity.likedBy.length > 0) {
                                                            const firstLikerId = activity.likedBy[0];
                                                            fetchUserInfo(firstLikerId);
                                                        }
                                                    }}
                                                >
                                                    {firstLiker}
                                                </Text>
                                            )}
                                            <Text style={styles.likeSummaryTextLight}> ve </Text>
                                            <Text style={styles.likeSummaryTextBold}>{otherCount}</Text>
                                            <Text style={styles.likeSummaryTextLight}> kişi beğendi</Text>
                                        </Text>
                                    );
                                })()}
                            </Text>
                        </TouchableOpacity>
                    </View>
                )}

                <View style={styles.descriptionContainer}>
                    {renderDescription()}
                </View>

                {activity.tags && activity.tags.length > 0 && (
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        style={styles.tagsContainer}
                    >
                        {activity.tags.map((tag, index) => (
                            <View key={index} style={styles.tagContainer}>
                                <Text style={styles.tag}>#{tag}</Text>
                            </View>
                        ))}
                    </ScrollView>
                )}

                {/* Yorumlar bölümü */}
                {renderComments()}
            </View>

            <CommentsModal
                visible={isCommentsModalVisible}
                onClose={handleCloseComments}
                comments={activity.comments || []}
                onAddComment={handleAddComment}
                currentUserId={currentUserId}
                postUserId={activity.userId}
                onDelete={handleDeleteComment}
            />

            {/* Options Button */}
            <TouchableOpacity
                style={styles.optionsButton}
                onPress={handleOptionsPress}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
                <Ionicons name="ellipsis-horizontal" size={20} color="#000" />
            </TouchableOpacity>

            {/* Context Menu Modal */}
            <Modal
                visible={showOptions}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setShowOptions(false)}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setShowOptions(false)}
                >
                    <View style={[
                        styles.contextMenu,
                        {
                            position: 'absolute',
                            right: width - menuPosition.x + 10,
                            top: menuPosition.y - 20,
                        }
                    ]}>
                        {isOwner && (
                            <TouchableOpacity
                                style={styles.contextMenuItem}
                                onPress={handleDeletePress}
                            >
                                <Ionicons name="trash-outline" size={20} color="#FF3B30" />
                                <Text style={styles.contextMenuTextDelete}>Sil</Text>
                            </TouchableOpacity>
                        )}
                        <TouchableOpacity
                            style={styles.contextMenuItem}
                            onPress={() => setShowOptions(false)}
                        >
                            <Ionicons name="close-outline" size={20} color="#666" />
                            <Text style={styles.contextMenuTextCancel}>Kapat</Text>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </Modal>
            <ArchiveGroupModal
                visible={showArchiveModal}
                onClose={() => setShowArchiveModal(false)}
                archiveGroups={archiveGroups}
                selectedGroups={selectedGroups}
                onSelectGroups={setSelectedGroups}
                onCreateGroup={handleCreateGroup}
                onSave={handleSaveArchiveGroups}
                userId={currentUserId}
                onGroupsUpdated={fetchGroups}
            />
            <FriendProfileModal
                visible={friendModalVisible}
                onClose={() => setFriendModalVisible(false)}
                friend={selectedFriend}
                navigation={navigation}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    activityCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 0,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 3.84,
        elevation: 5,
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
        marginRight: 12,
        borderWidth: 2,
        borderColor: '#E91E63',
    },
    userTextContainer: {
        flexDirection: 'column',
    },
    username: {
        fontWeight: '700',
        fontSize: 15,
        color: '#262626',
    },
    timestamp: {
        fontSize: 12,
        color: '#8E8E8E',
        marginTop: 2,
    },
    imageContainer: {
        position: 'relative',
        overflow: 'hidden',
    },
    activityImage: {
        width: width,
        height: width,
    },
    imageGradient: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 100,
    },
    contentContainer: {
        padding: 16,
    },
    interactionContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    leftInteractions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    interactionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F5F5F5',
        padding: 8,
        paddingHorizontal: 12,
        borderRadius: 20,
        gap: 6,
    },
    interactionCount: {
        fontSize: 14,
        color: '#666',
        fontWeight: '500',
        marginLeft: 4,
    },
    interactionCountActive: {
        color: '#E91E63',
    },
    description: {
        fontSize: 14,
        color: '#262626',
        lineHeight: 20,
    },
    seeMore: {
        color: '#8E8E8E',
        fontWeight: '600',
    },
    descriptionContainer: {
        marginVertical: 12,
        paddingHorizontal: 4,
    },
    tagsContainer: {
        flexDirection: 'row',
        marginTop: 8,
    },
    tagContainer: {
        backgroundColor: '#F5F5F5',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        marginRight: 8,
    },
    tag: {
        fontSize: 13,
        color: '#2196F3',
        fontWeight: '500',
    },
    bookmarkButton: {
        padding: 4,
    },
    commentsContainer: {
        marginTop: 8,
        paddingHorizontal: 4,
    },
    commentItem: {
        marginVertical: 2,
    },
    commentText: {
        fontSize: 14,
        color: '#262626',
        lineHeight: 18,
    },
    commentUsername: {
        fontWeight: '600',
        color: '#262626',
    },
    viewAllComments: {
        color: '#8E8E8E',
        fontSize: 14,
        marginTop: 4,
    },
    heartAnimation: {
        position: 'absolute',
        width: 100,
        height: 100,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 999,
    },
    optionsButton: {
        padding: 8,
        position: 'absolute',
        right: 8,
        top: 8,
        zIndex: 1,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    contextMenu: {
        backgroundColor: 'white',
        borderRadius: 8,
        padding: 4,
        minWidth: 120,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
        maxWidth: width - 32,
    },
    contextMenuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 6,
    },
    contextMenuTextDelete: {
        color: '#FF3B30',
        fontSize: 15,
        marginLeft: 8,
        fontWeight: '500',
    },
    contextMenuTextCancel: {
        color: '#666',
        fontSize: 15,
        marginLeft: 8,
        fontWeight: '500',
    },
    likeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F5F5F5',
        borderRadius: 20,
        padding: 4,
    },
    likeButton: {
        padding: 8,
        borderRadius: 16,
    },
    likeButtonActive: {
        backgroundColor: '#FFE8EC',
    },
    likeDivider: {
        width: 1,
        height: 20,
        backgroundColor: '#ddd',
        marginHorizontal: 4,
    },
    likeCountButton: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 16,
    },
    commentContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F5F5F5',
        borderRadius: 20,
        padding: 4,
    },
    commentButton: {
        padding: 8,
        borderRadius: 16,
    },
    commentDivider: {
        width: 1,
        height: 20,
        backgroundColor: '#ddd',
        marginHorizontal: 4,
    },
    commentCountButton: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 16,
    },
    likeSummaryContainer: {
        paddingVertical: 6,
        paddingHorizontal: 4,
        marginTop: -4,
    },
    likeSummaryTextLight: {
        fontSize: 14,
        color: '#666',
        fontWeight: '400',
    },
    likeSummaryTextBold: {
        fontSize: 14,
        color: '#262626',
        fontWeight: '600',
    },
    userInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
});

export default React.memo(Activity, (prevProps, nextProps) => {
    // Özel memoization karşılaştırması (gereksiz render'ları önlemek için)
    return (
        prevProps.activity.id === nextProps.activity.id &&
        prevProps.isLiked === nextProps.isLiked &&
        prevProps.currentUserId === nextProps.currentUserId &&
        // Yorumlar ve beğeniler değiştiyse render edilmeli
        prevProps.activity.stats?.likes === nextProps.activity.stats?.likes &&
        prevProps.activity.stats?.comments === nextProps.activity.stats?.comments &&
        prevProps.activity.comments?.length === nextProps.activity.comments?.length
    );
});