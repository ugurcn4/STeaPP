import React, { useState, useEffect, useRef } from 'react';
import {
    Modal,
    View,
    Text,
    Image,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    Platform,
    FlatList,
    Dimensions,
    Alert,
    SafeAreaView,
    ActionSheetIOS,
    Share,
    Clipboard
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getCurrentUserUid, sendFriendRequest, acceptFriendRequest, removeFriend } from '../services/friendFunctions';
import { db } from '../../firebaseConfig';
import FastImage from 'react-native-fast-image';
import Activity from '../components/Activity';
import { toggleLikePost, addComment, deleteComment } from '../services/postService';
import { doc, getDoc, collection, query, where, getDocs, orderBy, updateDoc, arrayUnion, arrayRemove, addDoc } from 'firebase/firestore';
import PostDetailModal from './PostDetailModal';

const { width } = Dimensions.get('window');
const POST_SIZE = width / 3 - 2;

// Android için ActionSheet alternatifi
const ActionSheet = ({ options, cancelButtonIndex, destructiveButtonIndex, onPress, visible, onDismiss }) => {
    if (!visible) return null;

    return (
        <Modal
            transparent={true}
            visible={visible}
            animationType="slide"
            onRequestClose={onDismiss}
        >
            <TouchableOpacity
                style={styles.actionSheetOverlay}
                activeOpacity={1}
                onPress={onDismiss}
            >
                <View style={styles.actionSheetContainer}>
                    {options.map((option, index) => (
                        <TouchableOpacity
                            key={index}
                            style={[
                                styles.actionSheetItem,
                                index === destructiveButtonIndex && styles.actionSheetDestructive,
                                index === cancelButtonIndex && styles.actionSheetCancel
                            ]}
                            onPress={() => {
                                onDismiss();
                                onPress(index);
                            }}
                        >
                            <Text
                                style={[
                                    styles.actionSheetItemText,
                                    index === destructiveButtonIndex && styles.actionSheetDestructiveText
                                ]}
                            >
                                {option}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </TouchableOpacity>
        </Modal>
    );
};

const FriendProfileModal = ({ visible, onClose, friend, navigation }) => {
    const [friendshipStatus, setFriendshipStatus] = useState('none');
    const [loading, setLoading] = useState(false);
    const [posts, setPosts] = useState([]);
    const [loadingPosts, setLoadingPosts] = useState(false);
    const [selectedPost, setSelectedPost] = useState(null);
    const listRef = useRef(null);
    const [currentUserId, setCurrentUserId] = useState(null);
    const [isProfilePrivate, setIsProfilePrivate] = useState(false);
    const [activeTab, setActiveTab] = useState('posts');
    const [likedPosts, setLikedPosts] = useState([]);
    const [loadingLikedPosts, setLoadingLikedPosts] = useState(false);
    const [actionSheetVisible, setActionSheetVisible] = useState(false);
    const [isBlocked, setIsBlocked] = useState(false);
    const [notificationsEnabled, setNotificationsEnabled] = useState(true);
    const [isOwnProfile, setIsOwnProfile] = useState(false);

    useEffect(() => {
        if (friend && visible) {
            fetchFriendshipStatus();
            fetchFriendPosts();
            getCurrentUserUid().then(uid => {
                setCurrentUserId(uid);
                setIsOwnProfile(uid === friend.id);
                checkBlockStatus(uid);
                checkNotificationStatus(uid);
            });
            checkProfileVisibility();
        }
    }, [friend, visible]);

    useEffect(() => {
        if (friend && visible && activeTab === 'likes' && friendshipStatus === 'friend') {
            fetchLikedPosts();
        }
    }, [friend, visible, activeTab, friendshipStatus]);

    useEffect(() => {
        if (!visible) {
            setSelectedPost(null);
        }
    }, [visible]);

    const checkProfileVisibility = async () => {
        if (!friend?.id) return;

        try {
            const friendDoc = await getDoc(doc(db, 'users', friend.id));
            const friendData = friendDoc.data() || {};
            const visibility = friendData.settings?.visibility || 'public';

            const currentUserId = await getCurrentUserUid();
            const userDoc = await getDoc(doc(db, 'users', currentUserId));
            const userFriends = userDoc.data()?.friends || [];

            const isFriend = userFriends.includes(friend.id);

            // Profil gizli ve arkadaş değilse ve kendi profili değilse
            setIsProfilePrivate(visibility === 'private' && !isFriend && friend.id !== currentUserId);
        } catch (error) {
            console.error('Profil görünürlüğü kontrol hatası:', error);
        }
    };

    const checkFriendshipStatus = async (userId, otherUserId) => {
        try {
            const userRef = doc(db, 'users', userId);
            const userDoc = await getDoc(userRef);
            const userData = userDoc.data();

            if (userData.friends?.includes(otherUserId)) {
                return 'friend';
            }

            if (userData.friendRequests?.sent?.includes(otherUserId)) {
                return 'pending';
            }

            if (userData.friendRequests?.received?.includes(otherUserId)) {
                return 'received';
            }

            return 'none';
        } catch (error) {
            console.error('Arkadaşlık durumu kontrol hatası:', error);
            return 'none';
        }
    };

    const fetchFriendshipStatus = async () => {
        try {
            const currentUserId = await getCurrentUserUid();
            const status = await checkFriendshipStatus(currentUserId, friend.id);
            setFriendshipStatus(status);
        } catch (error) {
            console.error('Arkadaşlık durumu kontrol hatası:', error);
        }
    };

    const fetchFriendPosts = async () => {
        if (!friend?.id) return;

        setLoadingPosts(true);
        try {
            const currentUserId = await getCurrentUserUid();
            const postsRef = collection(db, 'posts');
            const q = query(
                postsRef,
                where('userId', '==', friend.id),
                orderBy('createdAt', 'desc')
            );

            const querySnapshot = await getDocs(q);
            const postsList = [];

            const userDoc = await getDoc(doc(db, 'users', currentUserId));
            const userFriends = userDoc.data()?.friends || [];

            const isFriend = userFriends.includes(friend.id);

            const friendDoc = await getDoc(doc(db, 'users', friend.id));
            const friendData = friendDoc.data() || {};
            const visibility = friendData.settings?.visibility || 'public';

            if (visibility === 'private' && !isFriend && friend.id !== currentUserId) {
                setPosts([]);
                setLoadingPosts(false);
                return;
            }

            querySnapshot.forEach((doc) => {
                const postData = doc.data();

                if (!postData.isPublic && !isFriend && friend.id !== currentUserId) {
                    return;
                }

                postsList.push({
                    id: doc.id,
                    ...postData,
                    createdAt: postData.createdAt?.toDate() || new Date(),
                    user: {
                        id: friend.id,
                        name: friend.name || friendData.informations?.name || 'İsimsiz Kullanıcı',
                        username: friend.informations?.username || friendData.informations?.username,
                        avatar: friend.profilePicture || friendData.profilePicture
                    }
                });
            });

            setPosts(postsList);
        } catch (error) {
            console.error('Arkadaş postları alınırken hata:', error);
        } finally {
            setLoadingPosts(false);
        }
    };

    const fetchLikedPosts = async () => {
        if (!friend?.id) return;

        setLoadingLikedPosts(true);
        try {
            const currentUserId = await getCurrentUserUid();
            const postsRef = collection(db, 'posts');

            // Tüm postları çekelim
            const q = query(postsRef, orderBy('createdAt', 'desc'));
            const querySnapshot = await getDocs(q);

            const allPosts = [];
            querySnapshot.forEach((doc) => {
                const postData = doc.data();
                if (postData.likedBy && postData.likedBy.includes(friend.id)) {
                    allPosts.push({
                        id: doc.id,
                        ...postData,
                        createdAt: postData.createdAt?.toDate() || new Date()
                    });
                }
            });

            // Kullanıcı bilgilerini ekleyelim
            const postsWithUserData = await Promise.all(
                allPosts.map(async (post) => {
                    const userDoc = await getDoc(doc(db, 'users', post.userId));
                    const userData = userDoc.data() || {};

                    return {
                        ...post,
                        user: {
                            id: post.userId,
                            name: userData.informations?.name || 'İsimsiz Kullanıcı',
                            username: userData.informations?.username,
                            avatar: userData.profilePicture
                        }
                    };
                })
            );

            setLikedPosts(postsWithUserData);
        } catch (error) {
            console.error('Beğenilen postları alırken hata:', error);
        } finally {
            setLoadingLikedPosts(false);
        }
    };

    const handleFriendAction = async () => {
        if (loading) return;

        if (friendshipStatus === 'friend') {
            Alert.alert(
                "Arkadaşlıktan Çıkar",
                `${friend.name || 'Bu kişi'} arkadaş listenizden çıkarılacak. Onaylıyor musunuz?`,
                [
                    {
                        text: "İptal",
                        style: "cancel"
                    },
                    {
                        text: "Evet, Çıkar",
                        onPress: () => removeFriendConfirmed(),
                        style: "destructive"
                    }
                ]
            );
            return;
        }

        setLoading(true);
        try {
            switch (friendshipStatus) {
                case 'none':
                    await sendFriendRequest(friend.id);
                    setFriendshipStatus('pending');
                    break;

                case 'received':
                    await acceptFriendRequest(friend.id);
                    setFriendshipStatus('friend');
                    break;
            }
        } catch (error) {
            console.error('Arkadaşlık aksiyonu hatası:', error);
        } finally {
            setLoading(false);
        }
    };

    const removeFriendConfirmed = async () => {
        setLoading(true);
        try {
            const currentUserId = await getCurrentUserUid();
            await removeFriend(currentUserId, friend.id);
            setFriendshipStatus('none');
        } catch (error) {
            console.error('Arkadaşlıktan çıkarma hatası:', error);
        } finally {
            setLoading(false);
        }
    };

    const getButtonConfig = () => {
        if (isOwnProfile) {
            return {
                primary: {
                    text: 'Profili Düzenle',
                    style: styles.editButton,
                    textStyle: styles.editButtonText,
                    onPress: handleEditProfile,
                    disabled: false
                },
                secondary: {
                    text: 'Profili Paylaş',
                    style: styles.shareButton,
                    textStyle: styles.shareButtonText,
                    onPress: handleShareProfile,
                    disabled: false
                }
            };
        }

        switch (friendshipStatus) {
            case 'friend':
                return {
                    primary: {
                        text: 'Arkadaşınız',
                        style: styles.friendButton,
                        textStyle: styles.friendButtonText,
                        onPress: handleFriendAction,
                        disabled: false
                    },
                    secondary: {
                        text: 'Mesaj',
                        style: styles.messageButton,
                        textStyle: styles.messageButtonText,
                        onPress: handleMessagePress,
                        disabled: false
                    }
                };
            case 'pending':
                return {
                    primary: {
                        text: 'İstek Gönderildi',
                        style: styles.pendingButton,
                        textStyle: styles.pendingButtonText,
                        onPress: handleFriendAction,
                        disabled: true
                    },
                    secondary: {
                        text: 'Mesaj',
                        style: styles.messageButton,
                        textStyle: styles.messageButtonText,
                        onPress: handleMessagePress,
                        disabled: false
                    }
                };
            case 'received':
                return {
                    primary: {
                        text: 'İsteği Kabul Et',
                        style: styles.acceptButton,
                        textStyle: styles.acceptButtonText,
                        onPress: handleFriendAction,
                        disabled: false
                    },
                    secondary: {
                        text: 'Mesaj',
                        style: styles.messageButton,
                        textStyle: styles.messageButtonText,
                        onPress: handleMessagePress,
                        disabled: false
                    }
                };
            default:
                return {
                    primary: {
                        text: 'Arkadaş Ekle',
                        style: styles.followButton,
                        textStyle: styles.followButtonText,
                        onPress: handleFriendAction,
                        disabled: false
                    },
                    secondary: {
                        text: 'Mesaj',
                        style: styles.messageButton,
                        textStyle: styles.messageButtonText,
                        onPress: handleMessagePress,
                        disabled: false
                    }
                };
        }
    };

    const buttonConfig = getButtonConfig();

    if (!friend) return null;

    const { informations } = friend;

    const handleLikePress = async (postId) => {
        if (!currentUserId) return;

        try {
            const isLiked = await toggleLikePost(postId, currentUserId);
            setPosts(currentPosts =>
                currentPosts.map(post => {
                    if (post.id === postId) {
                        const currentLikes = post.stats?.likes || 0;
                        const newLikes = isLiked ? currentLikes + 1 : Math.max(0, currentLikes - 1);

                        return {
                            ...post,
                            likedBy: isLiked
                                ? [...(post.likedBy || []), currentUserId]
                                : (post.likedBy || []).filter(id => id !== currentUserId),
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
        if (!currentUserId) return;

        try {
            if (comment === 'delete') {
                await deleteComment(postId, replyToId, currentUserId);
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
                const newComment = await addComment(postId, currentUserId, comment, replyToId);
                setPosts(currentPosts =>
                    currentPosts.map(post => {
                        if (post.id === postId) {
                            if (replyToId) {
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
        }
    };

    const handleMessagePress = () => {
        onClose();

        navigation.navigate('DirectMessages', {
            screen: 'Chat',
            params: {
                friend: {
                    id: friend.id,
                    name: informations?.name || friend.name,
                    profilePicture: friend.profilePicture,
                    informations: friend.informations
                }
            }
        });
    };

    const checkBlockStatus = async (uid) => {
        if (!friend?.id) return;

        try {
            const userDoc = await getDoc(doc(db, 'users', uid));
            const userData = userDoc.data();
            const blockedUsers = userData?.blockedUsers || [];
            setIsBlocked(blockedUsers.includes(friend.id));
        } catch (error) {
            console.error('Engelleme durumu kontrol hatası:', error);
        }
    };

    const checkNotificationStatus = async (uid) => {
        if (!friend?.id) return;

        try {
            const userDoc = await getDoc(doc(db, 'users', uid));
            const userData = userDoc.data();
            const mutedUsers = userData?.mutedUsers || [];
            setNotificationsEnabled(!mutedUsers.includes(friend.id));
        } catch (error) {
            console.error('Bildirim durumu kontrol hatası:', error);
        }
    };

    const handleMenuPress = () => {
        if (Platform.OS === 'ios') {
            showIOSActionSheet();
        } else {
            setActionSheetVisible(true);
        }
    };

    const showIOSActionSheet = () => {
        const options = getActionSheetOptions();

        ActionSheetIOS.showActionSheetWithOptions(
            {
                options: options.map(option => option.title),
                cancelButtonIndex: options.findIndex(option => option.id === 'cancel'),
                destructiveButtonIndex: options.findIndex(option => option.id === 'block' || option.id === 'report' || option.id === 'removeFriend'),
                userInterfaceStyle: 'light'
            },
            (buttonIndex) => {
                handleActionSheetPress(options[buttonIndex].id);
            }
        );
    };

    const getActionSheetOptions = () => {
        const isSelfProfile = currentUserId === friend?.id;
        const options = [];

        if (!isSelfProfile) {
            options.push({ id: 'share', title: 'Profili Paylaş' });
            options.push({ id: 'copy', title: 'Profil Bağlantısını Kopyala' });

            if (friendshipStatus === 'friend') {
                options.push({ id: 'removeFriend', title: 'Arkadaşlıktan Çıkar' });
            }

            options.push({
                id: 'notifications',
                title: notificationsEnabled ? 'Bildirimleri Kapat' : 'Bildirimleri Aç'
            });

            options.push({ id: 'report', title: 'Profili Şikayet Et' });

            options.push({
                id: 'block',
                title: isBlocked ? 'Engeli Kaldır' : 'Kullanıcıyı Engelle'
            });
        } else {
            options.push({ id: 'share', title: 'Profilimi Paylaş' });
            options.push({ id: 'copy', title: 'Profil Bağlantımı Kopyala' });
            options.push({ id: 'privacy', title: 'Gizlilik Ayarları' });
        }

        options.push({ id: 'cancel', title: 'İptal' });

        return options;
    };

    const handleActionSheetPress = async (actionId) => {
        if (!friend?.id || !currentUserId) return;

        switch (actionId) {
            case 'share':
                handleShareProfile();
                break;

            case 'copy':
                handleCopyProfileLink();
                break;

            case 'removeFriend':
                Alert.alert(
                    "Arkadaşlıktan Çıkar",
                    `${friend.name || 'Bu kişi'} arkadaş listenizden çıkarılacak. Onaylıyor musunuz?`,
                    [
                        { text: "İptal", style: "cancel" },
                        { text: "Evet, Çıkar", onPress: removeFriendConfirmed, style: "destructive" }
                    ]
                );
                break;

            case 'notifications':
                toggleNotifications();
                break;

            case 'report':
                handleReportProfile();
                break;

            case 'block':
                handleBlockUser();
                break;

            case 'privacy':
                navigation.navigate('PrivacySettings');
                onClose();
                break;

            case 'cancel':
                break;
        }
    };

    const handleShareProfile = async () => {
        try {
            const result = await Share.share({
                message: `${friend.name || 'Kullanıcı'} profilini görüntüle!`,
                url: `app://profile/${friend.id}`,
                title: `${friend.name || 'Kullanıcı'} Profili`
            });
        } catch (error) {
            console.error('Profil paylaşma hatası:', error);
        }
    };

    const handleCopyProfileLink = () => {
        Clipboard.setString(`app://profile/${friend.id}`);
        Alert.alert('Başarılı', 'Profil bağlantısı panoya kopyalandı.');
    };

    const toggleNotifications = async () => {
        try {
            const userRef = doc(db, 'users', currentUserId);

            if (notificationsEnabled) {
                await updateDoc(userRef, {
                    mutedUsers: arrayUnion(friend.id)
                });
                setNotificationsEnabled(false);
                Alert.alert('Bildirimler Kapatıldı', `${friend.name || 'Bu kullanıcı'} için bildirimler kapatıldı.`);
            } else {
                await updateDoc(userRef, {
                    mutedUsers: arrayRemove(friend.id)
                });
                setNotificationsEnabled(true);
                Alert.alert('Bildirimler Açıldı', `${friend.name || 'Bu kullanıcı'} için bildirimler açıldı.`);
            }
        } catch (error) {
            console.error('Bildirim durumu değiştirme hatası:', error);
            Alert.alert('Hata', 'Bildirim ayarları değiştirilirken bir hata oluştu.');
        }
    };

    const handleReportProfile = () => {
        Alert.alert(
            "Profili Şikayet Et",
            "Bu profili şikayet etme nedeniniz nedir?",
            [
                { text: "İptal", style: "cancel" },
                { text: "Sahte Profil", onPress: () => submitReport("fake_profile") },
                { text: "Uygunsuz İçerik", onPress: () => submitReport("inappropriate_content") },
                { text: "Taciz veya Zorbalık", onPress: () => submitReport("harassment") },
                { text: "Diğer", onPress: () => submitReport("other") }
            ]
        );
    };

    const submitReport = async (reason) => {
        try {
            const reportData = {
                reportedUserId: friend.id,
                reportedBy: currentUserId,
                reason: reason,
                timestamp: new Date(),
                status: 'pending',
                reportedUserName: friend.informations?.name || friend.name,
            };

            const reportsRef = collection(db, 'reports');
            await addDoc(reportsRef, reportData);

            Alert.alert(
                "Şikayet Alındı",
                "Şikayetiniz alındı. En kısa sürede incelenecektir.",
                [{ text: "Tamam" }],
                { cancelable: true, onDismiss: () => showBlockOption() }
            );

            setTimeout(() => {
                showBlockOption();
            }, 500);
        } catch (error) {
            console.error('Şikayet gönderme hatası:', error);
            Alert.alert('Hata', 'Şikayet gönderilirken bir hata oluştu.');
        }
    };

    const showBlockOption = () => {
        if (isBlocked) return;

        Alert.alert(
            "Kullanıcıyı Engelle",
            `${friend.informations?.name || friend.name} adlı kullanıcıyı engellemek ister misiniz?`,
            [
                { text: "Hayır", style: "cancel" },
                { text: "Evet, Engelle", onPress: blockUser, style: "destructive" }
            ]
        );
    };

    const handleBlockUser = async () => {
        if (isBlocked) {
            Alert.alert(
                "Engeli Kaldır",
                `${friend.name || 'Bu kullanıcı'} için engeli kaldırmak istediğinize emin misiniz?`,
                [
                    { text: "İptal", style: "cancel" },
                    { text: "Evet, Kaldır", onPress: unblockUser }
                ]
            );
        } else {
            Alert.alert(
                "Kullanıcıyı Engelle",
                `${friend.name || 'Bu kullanıcı'} engellenecek. Bu kişi artık sizinle iletişim kuramayacak ve içeriklerinizi göremeyecek.`,
                [
                    { text: "İptal", style: "cancel" },
                    { text: "Engelle", onPress: blockUser, style: "destructive" }
                ]
            );
        }
    };

    const blockUser = async () => {
        try {
            const userRef = doc(db, 'users', currentUserId);

            await updateDoc(userRef, {
                blockedUsers: arrayUnion(friend.id)
            });

            if (friendshipStatus === 'friend') {
                await removeFriend(currentUserId, friend.id);
                setFriendshipStatus('none');
            }

            setIsBlocked(true);
            Alert.alert('Kullanıcı Engellendi', `${friend.name || 'Bu kullanıcı'} engellendi.`);

            onClose();
        } catch (error) {
            console.error('Kullanıcı engelleme hatası:', error);
            Alert.alert('Hata', 'Kullanıcı engellenirken bir hata oluştu.');
        }
    };

    const unblockUser = async () => {
        try {
            const userRef = doc(db, 'users', currentUserId);

            await updateDoc(userRef, {
                blockedUsers: arrayRemove(friend.id)
            });

            setIsBlocked(false);
            Alert.alert('Engel Kaldırıldı', `${friend.name || 'Bu kullanıcı'} için engel kaldırıldı.`);
        } catch (error) {
            console.error('Kullanıcı engel kaldırma hatası:', error);
            Alert.alert('Hata', 'Kullanıcının engeli kaldırılırken bir hata oluştu.');
        }
    };

    const handleEditProfile = () => {
        onClose();
        navigation.navigate('ProfileModal', { modalVisible: true });
    };

    const getProfileImageSource = (user) => {
        if (user.profilePicture) {
            return {
                uri: user.profilePicture,
                priority: FastImage.priority.normal,
                cache: FastImage.cacheControl.immutable
            };
        } else {
            // Kullanıcının adının ilk iki harfini al
            const initials = (user.informations?.name || user.name || "")
                .split(' ')
                .map(n => n[0])
                .join('')
                .substring(0, 2)
                .toUpperCase();

            // UI Avatars API'sini kullanarak isim baş harfleri ile avatar oluştur
            return {
                uri: `https://ui-avatars.com/api/?name=${initials}&background=random&color=fff&size=256&bold=true`,
                priority: FastImage.priority.normal,
                cache: FastImage.cacheControl.web
            };
        }
    };

    const renderPostItem = ({ item }) => {
        return (
            <TouchableOpacity
                style={styles.postItem}
                onPress={() => {
                    setSelectedPost(item);
                }}
            >
                <FastImage
                    source={{
                        uri: item.imageUrl,
                        priority: FastImage.priority.normal,
                        cache: FastImage.cacheControl.immutable
                    }}
                    style={styles.postImage}
                    resizeMode={FastImage.resizeMode.cover}
                />
            </TouchableOpacity>
        );
    };

    const renderDetailModal = () => {
        // Aktif sekmeye göre doğru veri kaynağını seçelim
        const currentPosts = activeTab === 'posts' ? posts : likedPosts;

        return (
            <PostDetailModal
                visible={selectedPost !== null}
                onClose={() => setSelectedPost(null)}
                selectedPost={selectedPost}
                currentPosts={currentPosts}
                currentUserId={currentUserId}
                onLikePress={handleLikePress}
                onCommentPress={handleCommentSubmit}
                onPostUpdate={(updatedPost) => {
                    if (updatedPost.id !== selectedPost.id) {
                        setSelectedPost(updatedPost);
                    }
                }}
                navigation={navigation}
            />
        );
    };

    return (
        <Modal
            visible={visible}
            transparent={false}
            animationType="slide"
            onRequestClose={onClose}
            statusBarTranslucent={true}
        >
            <View style={styles.modalContainer}>
                <View style={styles.headerSection}>
                    <TouchableOpacity style={styles.backButton} onPress={onClose}>
                        <Ionicons name="arrow-back" size={24} color="#333" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>{informations?.username || friend.name}</Text>
                    <TouchableOpacity style={styles.menuButton} onPress={handleMenuPress}>
                        <Ionicons name="ellipsis-horizontal" size={24} color="#333" />
                    </TouchableOpacity>
                </View>

                {isProfilePrivate ? (
                    <View style={styles.privateProfileContainer}>
                        <View style={styles.profileTopSection}>
                            <View style={styles.profileImageContainer}>
                                <FastImage
                                    source={getProfileImageSource(friend)}
                                    style={styles.profileImage}
                                    resizeMode={FastImage.resizeMode.cover}
                                />
                            </View>

                            <View style={styles.statsContainer}>
                                <View style={styles.statCard}>
                                    <Text style={styles.statNumber}>{friend.friends?.length || 0}</Text>
                                    <Text style={styles.statLabel}>Arkadaş</Text>
                                </View>
                                <View style={styles.statCard}>
                                    <Text style={styles.statNumber}>-</Text>
                                    <Text style={styles.statLabel}>Paylaşım</Text>
                                </View>
                            </View>
                        </View>

                        <View style={styles.profileInfo}>
                            <Text style={styles.name}>{informations?.name || friend.name}</Text>
                        </View>

                        <View style={styles.actionButtonsRow}>
                            <TouchableOpacity
                                style={buttonConfig.primary.style}
                                onPress={buttonConfig.primary.onPress}
                                disabled={buttonConfig.primary.disabled || loading}
                            >
                                <Text style={buttonConfig.primary.textStyle}>
                                    {loading ? 'İşleniyor...' : buttonConfig.primary.text}
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={buttonConfig.secondary.style}
                                onPress={buttonConfig.secondary.onPress}
                                disabled={buttonConfig.secondary.disabled}
                            >
                                <Text style={buttonConfig.secondary.textStyle}>
                                    {buttonConfig.secondary.text}
                                </Text>
                            </TouchableOpacity>
                        </View>

                        <View style={styles.privateProfileContent}>
                            <View style={styles.lockIconContainer}>
                                <Ionicons name="lock-closed" size={64} color="#ccc" />
                            </View>
                            <Text style={styles.privateProfileTitle}>Bu Hesap Gizli</Text>
                            <Text style={styles.privateProfileText}>
                                Fotoğraf ve videolarını görmek için bu hesabı takip et.
                            </Text>
                        </View>
                    </View>
                ) : (
                    <ScrollView
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={styles.scrollContent}
                    >
                        <View style={styles.profileHeader}>
                            <View style={styles.profileTopSection}>
                                <View style={styles.profileImageContainer}>
                                    <FastImage
                                        source={getProfileImageSource(friend)}
                                        style={styles.profileImage}
                                        resizeMode={FastImage.resizeMode.cover}
                                    />
                                </View>

                                <View style={styles.statsContainer}>
                                    <View style={styles.statCard}>
                                        <Text style={styles.statNumber}>{friend.friends?.length || 0}</Text>
                                        <Text style={styles.statLabel}>Arkadaş</Text>
                                    </View>
                                    <View style={styles.statCard}>
                                        <Text style={styles.statNumber}>{posts.length}</Text>
                                        <Text style={styles.statLabel}>Paylaşım</Text>
                                    </View>
                                </View>
                            </View>

                            <View style={styles.profileInfo}>
                                <Text style={styles.name}>{informations?.name || friend.name}</Text>
                                {friend.bio && friend.bio !== "undefined" && (
                                    <Text style={styles.bioText}>{friend.bio}</Text>
                                )}
                            </View>

                            <View style={styles.actionButtonsRow}>
                                <TouchableOpacity
                                    style={buttonConfig.primary.style}
                                    onPress={buttonConfig.primary.onPress}
                                    disabled={buttonConfig.primary.disabled || loading}
                                >
                                    <Text style={buttonConfig.primary.textStyle}>
                                        {loading ? 'İşleniyor...' : buttonConfig.primary.text}
                                    </Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={buttonConfig.secondary.style}
                                    onPress={buttonConfig.secondary.onPress}
                                    disabled={buttonConfig.secondary.disabled}
                                >
                                    <Text style={buttonConfig.secondary.textStyle}>
                                        {buttonConfig.secondary.text}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        <View style={styles.postsContainer}>
                            <View style={styles.postsHeader}>
                                <TouchableOpacity
                                    style={[
                                        styles.tabButton,
                                        activeTab === 'posts' && styles.activeTabButton
                                    ]}
                                    onPress={() => setActiveTab('posts')}
                                >
                                    <Ionicons
                                        name="grid-outline"
                                        size={24}
                                        color={activeTab === 'posts' ? "#25D220" : "#333"}
                                    />
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[
                                        styles.tabButton,
                                        activeTab === 'likes' && styles.activeTabButton
                                    ]}
                                    onPress={() => {
                                        setActiveTab('likes');
                                        if (friendshipStatus !== 'friend' && friend.id !== currentUserId) {
                                            Alert.alert(
                                                "Sınırlı Erişim",
                                                "Beğenilen gönderileri görmek için arkadaş olmanız gerekiyor.",
                                                [{ text: "Tamam", onPress: () => setActiveTab('posts') }]
                                            );
                                        }
                                    }}
                                >
                                    <Ionicons
                                        name="heart-outline"
                                        size={24}
                                        color={activeTab === 'likes' ? "#25D220" : "#333"}
                                    />
                                </TouchableOpacity>
                            </View>

                            {activeTab === 'posts' ? (
                                loadingPosts ? (
                                    <View style={styles.loadingContainer}>
                                        <Text style={styles.loadingText}>Paylaşımlar yükleniyor...</Text>
                                    </View>
                                ) : posts.length > 0 ? (
                                    <FlatList
                                        data={posts}
                                        renderItem={({ item }) => renderPostItem({ item })}
                                        keyExtractor={item => item.id}
                                        numColumns={3}
                                        scrollEnabled={false}
                                        contentContainerStyle={styles.postsGrid}
                                    />
                                ) : (
                                    <View style={styles.emptyContainer}>
                                        <Ionicons name="images-outline" size={48} color="#ccc" />
                                        <Text style={styles.emptyText}>Henüz paylaşım yok</Text>
                                    </View>
                                )
                            ) : (
                                friendshipStatus === 'friend' || friend.id === currentUserId ? (
                                    loadingLikedPosts ? (
                                        <View style={styles.loadingContainer}>
                                            <Text style={styles.loadingText}>Beğenilen paylaşımlar yükleniyor...</Text>
                                        </View>
                                    ) : likedPosts.length > 0 ? (
                                        <FlatList
                                            data={likedPosts}
                                            renderItem={({ item }) => renderPostItem({ item })}
                                            keyExtractor={item => item.id}
                                            numColumns={3}
                                            scrollEnabled={false}
                                            contentContainerStyle={styles.postsGrid}
                                        />
                                    ) : (
                                        <View style={styles.emptyContainer}>
                                            <Ionicons name="heart-outline" size={48} color="#ccc" />
                                            <Text style={styles.emptyText}>Henüz beğenilen paylaşım yok</Text>
                                        </View>
                                    )
                                ) : (
                                    <View style={styles.emptyContainer}>
                                        <Ionicons name="lock-closed-outline" size={48} color="#ccc" />
                                        <Text style={styles.emptyText}>Beğenilen paylaşımları görmek için arkadaş olmanız gerekiyor</Text>
                                    </View>
                                )
                            )}
                        </View>
                    </ScrollView>
                )}
            </View>

            {Platform.OS === 'android' && (
                <ActionSheet
                    options={getActionSheetOptions().map(option => option.title)}
                    cancelButtonIndex={getActionSheetOptions().findIndex(option => option.id === 'cancel')}
                    destructiveButtonIndex={getActionSheetOptions().findIndex(option =>
                        option.id === 'block' || option.id === 'report' || option.id === 'removeFriend'
                    )}
                    onPress={(index) => handleActionSheetPress(getActionSheetOptions()[index].id)}
                    visible={actionSheetVisible}
                    onDismiss={() => setActionSheetVisible(false)}
                />
            )}

            {selectedPost && renderDetailModal()}
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalContainer: {
        flex: 1,
        backgroundColor: '#FFF',
    },
    headerSection: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingTop: Platform.OS === 'ios' ? 50 : 20,
        paddingHorizontal: 16,
        paddingBottom: 10,
    },
    backButton: {
        padding: 8,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#333',
        flex: 1,
        marginLeft: 8,
    },
    menuButton: {
        padding: 8,
    },
    scrollContent: {
        paddingBottom: 20,
    },
    profileHeader: {
        padding: 16,
    },
    profileTopSection: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    profileImageContainer: {
        marginRight: 20,
    },
    profileImage: {
        width: 100,
        height: 100,
        borderRadius: 50,
        borderWidth: 2,
        borderColor: '#25D220',
    },
    statsContainer: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'space-around',
    },
    statCard: {
        alignItems: 'center',
    },
    statNumber: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    statLabel: {
        fontSize: 12,
        color: '#666',
    },
    profileInfo: {
        marginBottom: 16,
    },
    name: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 4,
    },
    username: {
        fontSize: 14,
        color: '#666',
        marginBottom: 4,
    },
    bioText: {
        fontSize: 14,
        color: '#8E8E8E',
        lineHeight: 20,
        marginTop: 4,
    },
    actionButtonsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    followButton: {
        flex: 1,
        backgroundColor: '#25D220',
        borderRadius: 8,
        paddingVertical: 10,
        alignItems: 'center',
        marginRight: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    followButtonText: {
        color: '#FFF',
        fontWeight: '600',
    },
    messageButton: {
        flex: 1,
        backgroundColor: '#F0F0F0',
        borderRadius: 8,
        paddingVertical: 10,
        alignItems: 'center',
        marginLeft: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    messageButtonText: {
        color: '#333',
        fontWeight: '600',
    },
    friendButton: {
        flex: 1,
        backgroundColor: '#4CAF50',
        borderRadius: 8,
        paddingVertical: 10,
        alignItems: 'center',
        marginRight: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    friendButtonText: {
        color: '#FFF',
        fontWeight: '600',
    },
    pendingButton: {
        flex: 1,
        backgroundColor: '#FFA000',
        borderRadius: 8,
        paddingVertical: 10,
        alignItems: 'center',
        marginRight: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    pendingButtonText: {
        color: '#FFF',
        fontWeight: '600',
    },
    acceptButton: {
        flex: 1,
        backgroundColor: '#25D220',
        borderRadius: 8,
        paddingVertical: 10,
        alignItems: 'center',
        marginRight: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    acceptButtonText: {
        color: '#FFF',
        fontWeight: '600',
    },
    postsContainer: {
        marginTop: 16,
    },
    postsHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-around',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderTopWidth: 0,
        borderBottomWidth: 1,
        borderColor: '#EFEFEF',
        marginLeft: 0,
    },
    postsHeaderText: {
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 8,
    },
    postsGrid: {
        paddingTop: 2,
    },
    postItem: {
        width: POST_SIZE,
        height: POST_SIZE,
        margin: 1,
    },
    postImage: {
        width: '100%',
        height: '100%',
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 40,
    },
    emptyText: {
        fontSize: 16,
        color: '#666',
        marginTop: 12,
    },
    loadingContainer: {
        padding: 40,
        alignItems: 'center',
    },
    loadingText: {
        fontSize: 16,
        color: '#666',
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        backgroundColor: '#fff',
        zIndex: 1,
    },
    modalContent: {
        paddingBottom: 20,
    },
    privateProfileContainer: {
        flex: 1,
        padding: 16,
    },
    privateProfileContent: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 32,
        marginTop: 40,
    },
    lockIconContainer: {
        marginBottom: 20,
    },
    privateProfileTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 12,
        textAlign: 'center',
    },
    privateProfileText: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        lineHeight: 24,
    },
    tabButton: {
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderBottomWidth: 2,
        borderBottomColor: 'transparent',
    },
    activeTabButton: {
        borderBottomColor: '#25D220',
    },
    actionSheetOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        justifyContent: 'flex-end',
    },
    actionSheetContainer: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        paddingBottom: Platform.OS === 'ios' ? 40 : 16,
    },
    actionSheetItem: {
        paddingVertical: 16,
        paddingHorizontal: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    actionSheetItemText: {
        fontSize: 16,
        color: '#333',
        textAlign: 'center',
    },
    actionSheetDestructive: {
        backgroundColor: '#FFF0F0',
    },
    actionSheetDestructiveText: {
        color: '#FF3B30',
    },
    actionSheetCancel: {
        marginTop: 8,
    },
    editButton: {
        flex: 1,
        backgroundColor: '#25D220',
        borderRadius: 8,
        paddingVertical: 10,
        alignItems: 'center',
        marginRight: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    editButtonText: {
        color: '#FFF',
        fontWeight: '600',
    },
    shareButton: {
        flex: 1,
        backgroundColor: '#F0F0F0',
        borderRadius: 8,
        paddingVertical: 10,
        alignItems: 'center',
        marginLeft: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    shareButtonText: {
        color: '#333',
        fontWeight: '600',
    },
});

export default FriendProfileModal;