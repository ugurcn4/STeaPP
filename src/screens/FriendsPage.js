import React, { useState, useEffect } from 'react';
import {
    SafeAreaView,
    View,
    Text,
    TextInput,
    TouchableOpacity,
    FlatList,
    Alert,
    ScrollView,
    RefreshControl,
    ActivityIndicator,
    StatusBar,
    Platform
} from 'react-native';
import {
    searchUsers,
    sendFriendRequest,
    getFriendRequests,
    acceptFriendRequest,
    rejectFriendRequest,
    getCurrentUserUid,
    removeFriend,
    getSentFriendRequests,
    cancelFriendRequest
} from '../services/friendFunctions';
import FriendRequestModal from '../modals/FriendRequestModal';
import { doc, getDoc, updateDoc, getDocs, query, where, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, rtdb } from '../../firebaseConfig';
import { MaterialIcons } from '@expo/vector-icons';
import {
    shareLocation,
    getCurrentLocation,
    getShares,
    shareInstantLocation,
    listenToActiveShares,
    getReceivedShares,
    checkActiveShare
} from '../helpers/locationHelpers';
import Toast from 'react-native-toast-message';
import FriendProfileModal from '../modals/friendProfileModal';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import FastImage from 'react-native-fast-image';
import { ref, set, remove } from 'firebase/database';
import { startBackgroundLocationUpdates, stopBackgroundLocationUpdates } from '../services/LocationBackgroundService';
import * as Location from 'expo-location';
import VerificationBadge from '../components/VerificationBadge';
import { checkUserVerification } from '../utils/verificationUtils';
// Stil dosyasını içe aktar
import styles from '../styles/FriendsPageStyles';

// Status bar yüksekliğini hesaplamak için
const STATUSBAR_HEIGHT = Platform.OS === 'ios' ? 44 : StatusBar.currentHeight;

const showToast = (type, text1, text2) => {
    Toast.show({
        type: type,
        text1: text1,
        text2: text2
    });
};

const FriendsPage = ({ navigation }) => {
    const [currentUserId, setCurrentUserId] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [friendRequests, setFriendRequests] = useState([]);
    const [sentRequests, setSentRequests] = useState([]);
    const [friends, setFriends] = useState([]);
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [activeTab, setActiveTab] = useState('Arkadaşlar');
    const [selectedFriends, setSelectedFriends] = useState([]);
    const [shares, setShares] = useState([]);
    const [selectedFriend, setSelectedFriend] = useState(null);
    const [friendProfileVisible, setFriendProfileVisible] = useState(false);
    const [locationSubscriptions, setLocationSubscriptions] = useState({});
    const [receivedShares, setReceivedShares] = useState([]);
    const [refreshing, setRefreshing] = useState(false);
    const [friendshipStatus, setFriendshipStatus] = useState({});

    useEffect(() => {
        const fetchCurrentUserUid = async () => {
            try {
                const uid = await getCurrentUserUid();
                setCurrentUserId(uid);
                fetchFriends(uid);
                fetchShares(uid);
            } catch (error) {
                console.error('Kullanıcı UID alma hatası:', error);
            }
        };

        fetchCurrentUserUid();
    }, []);

    useEffect(() => {
        const fetchAllRequests = async () => {
            try {
                const requests = await getFriendRequests();
                const sent = await getSentFriendRequests();
                setFriendRequests(requests);
                setSentRequests(sent);
            } catch (error) {
                console.error('İstekleri alma hatası:', error);
            }
        };

        fetchAllRequests();
    }, []);

    useEffect(() => {
        if (activeTab === 'Paylaşımlar') {
            fetchShares(currentUserId);
        }
    }, [activeTab, currentUserId]);

    useEffect(() => {
        if (currentUserId) {
            const unsubscribe = listenToActiveShares(currentUserId, (activeShares) => {
                setShares(activeShares);
            });

            return () => unsubscribe();
        }
    }, [currentUserId]);

    useEffect(() => {
        if (currentUserId && activeTab === 'Paylaşımlar') {
            const fetchReceivedShares = async () => {
                const shares = await getReceivedShares(currentUserId);
                setReceivedShares(shares);
            };
            fetchReceivedShares();
        }
    }, [currentUserId, activeTab]);

    const fetchShares = async (uid) => {
        try {
            const userShares = await getShares(uid);

            // Her paylaşım için konum bilgilerini kontrol et ve eksikse ekle
            const updatedShares = await Promise.all(userShares.map(async (share) => {
                // Eğer locationInfo yoksa ve konum bilgisi varsa
                if (!share.locationInfo && share.location) {
                    try {
                        const locationInfo = await getLocationInfo(
                            share.location.latitude,
                            share.location.longitude
                        );

                        if (locationInfo) {
                            // Firestore'daki paylaşımı güncelle
                            const shareRef = doc(db, `users/${uid}/shares/${share.id}`);
                            await updateDoc(shareRef, { locationInfo });

                            // Güncellenmiş paylaşımı döndür
                            return { ...share, locationInfo };
                        }
                    } catch (error) {
                        console.error('Konum bilgisi güncelleme hatası:', error);
                    }
                }
                return share;
            }));

            setShares(updatedShares);
        } catch (error) {
            console.error('Paylaşımları alma hatası:', error);
            showToast('error', 'Hata', 'Paylaşımlar alınırken bir sorun oluştu');
        }
    };

    const fetchFriends = async (uid) => {
        try {
            const userRef = doc(db, 'users', uid);
            const userSnapshot = await getDoc(userRef);
            if (userSnapshot.exists()) {
                const userData = userSnapshot.data();
                if (userData.friends) {
                    const friendsData = await Promise.all(
                        userData.friends.map(async (friendId) => {
                            const friendRef = doc(db, 'users', friendId);
                            const friendSnapshot = await getDoc(friendRef);
                            if (friendSnapshot.exists()) {
                                const friendData = friendSnapshot.data();

                                // Doğrulama durumunu kontrol et
                                let verificationStatus = { hasBlueTick: false, hasGreenTick: false };
                                try {
                                    verificationStatus = await checkUserVerification(friendId);
                                } catch (error) {
                                    console.error('Kullanıcı doğrulama durumu kontrolünde hata:', error);
                                    // Hata durumunda varsayılan değerleri kullan
                                }

                                return {
                                    id: friendId,
                                    name: friendData.informations?.name || 'İsimsiz',
                                    profilePicture: friendData.profilePicture,
                                    friends: friendData.friends || [],
                                    informations: {
                                        name: friendData.informations?.name,
                                        email: friendData.informations?.email,
                                        phone: friendData.informations?.phone,
                                        bio: friendData.informations?.bio,
                                        username: friendData.informations?.username,
                                        instagram: friendData.informations?.instagram,
                                        location: friendData.informations?.location,
                                        interests: friendData.informations?.interests || [],
                                        settings: friendData.informations?.settings
                                    },
                                    verification: verificationStatus
                                };
                            }
                            return null;
                        })
                    );
                    setFriends(friendsData.filter(friend => friend !== null));
                }
            }
        } catch (error) {
            console.error('Arkadaşları alma hatası:', error);
        }
    };

    const handleAccept = async (requestId) => {
        try {
            const response = await acceptFriendRequest(requestId);
            if (response.success) {
                showToast('success', 'Başarılı', 'Arkadaşlık isteği kabul edildi.');
                setFriendRequests(friendRequests.filter((request) => request.id !== requestId));
                fetchFriends(currentUserId); // Arkadaşlarni güncelle
            } else {
                showToast('error', 'Hata', response.message);
            }
        } catch (error) {
            console.error('Arkadaşlık isteğini kabul etme hatası:', error);
        }
    };

    const handleReject = async (requestId) => {
        try {
            const response = await rejectFriendRequest(requestId);
            if (response.success) {
                showToast('success', 'Başarılı', 'Arkadaşlık isteği reddedildi.');
                setFriendRequests(friendRequests.filter((request) => request.id !== requestId));
            } else {
                showToast('error', 'Hata', response.message);
            }
        } catch (error) {
            console.error('Arkadaşlık isteğini reddetme hatası:', error);
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

    const handleSearchChange = async (text) => {
        setSearchQuery(text);

        if (text.trim() === '') {
            setSearchResults([]);
            return;
        }

        setLoading(true);
        try {
            const currentUserId = await getCurrentUserUid();
            const users = await searchUsers(text.trim().toLowerCase());

            // Kendi profilini sonuçlardan çıkar
            const filteredUsers = users.filter(user => user.id !== currentUserId);

            // Gizlilik ayarlarını kontrol et - aramada görünürlük ayarı kapalı olanları filtrele
            const visibleUsers = await Promise.all(
                filteredUsers.map(async (user) => {
                    try {
                        const userRef = doc(db, 'users', user.id);
                        const userDoc = await getDoc(userRef);
                        const userData = userDoc.data();

                        // Kullanıcının gizlilik ayarlarını kontrol et
                        const privacySettings = userData?.settings?.privacySettings || {};

                        // Eğer searchable ayarı false ise kullanıcıyı gösterme
                        if (privacySettings.searchable === false) {
                            return null;
                        }

                        // Doğrulama durumunu kontrol et
                        const verificationStatus = await checkUserVerification(user.id);
                        user.verification = verificationStatus;

                        return user;
                    } catch (error) {
                        console.error('Kullanıcı gizlilik ayarları kontrol hatası:', error);
                        return user; // Hata durumunda kullanıcıyı göster
                    }
                })
            );

            // null olmayan kullanıcıları filtrele
            const filteredVisibleUsers = visibleUsers.filter(user => user !== null);

            // Her kullanıcı için arkadaşlık durumunu kontrol et
            const statusPromises = filteredVisibleUsers.map(async user => {
                const status = await checkFriendshipStatus(currentUserId, user.id);
                return { ...user, friendshipStatus: status };
            });

            const usersWithStatus = await Promise.all(statusPromises);
            setSearchResults(usersWithStatus);

            // Durumları state'e kaydet
            const statusMap = {};
            usersWithStatus.forEach(user => {
                statusMap[user.id] = user.friendshipStatus;
            });
            setFriendshipStatus(statusMap);
        } catch (error) {
            console.error('Arama hatası:', error);
            showToast('error', 'Hata', 'Arama yapılırken bir sorun oluştu.');
        } finally {
            setLoading(false);
        }
    };

    const getButtonConfig = (userId) => {
        const status = friendshipStatus[userId];
        switch (status) {
            case 'friend':
                return {
                    text: 'Arkadaşınız',
                    disabled: true,
                    style: styles.friendButton
                };
            case 'pending':
                return {
                    text: 'İstek Gönderildi',
                    disabled: true,
                    style: styles.pendingButton
                };
            case 'received':
                return {
                    text: 'İsteği Kabul Et',
                    disabled: false,
                    style: styles.acceptButton
                };
            default:
                return {
                    text: 'Arkadaş Ekle',
                    disabled: false,
                    style: styles.addButton
                };
        }
    };

    const renderSearchResultCard = (user) => {
        const buttonConfig = getButtonConfig(user.id);

        return (
            <TouchableOpacity
                key={user.id}
                style={styles.searchResultCard}
                onPress={() => handleSearchResultPress(user)}
            >
                <FastImage
                    source={
                        user.profilePicture
                            ? {
                                uri: user.profilePicture,
                                priority: FastImage.priority.normal,
                                cache: FastImage.cacheControl.immutable
                            }
                            : {
                                uri: `https://ui-avatars.com/api/?name=${user.informations?.name || 'Unknown'}&background=random`,
                                priority: FastImage.priority.normal,
                                cache: FastImage.cacheControl.web
                            }
                    }
                    style={styles.searchResultImage}
                    resizeMode={FastImage.resizeMode.cover}
                />
                <View style={styles.searchResultInfo}>
                    <View style={styles.searchResultNameContainer}>
                        <Text style={styles.searchResultName}>
                            {user.informations?.name || 'İsimsiz Kullanıcı'}
                        </Text>
                        {user.verification && (
                            <VerificationBadge
                                hasBlueTick={user.verification.hasBlueTick}
                                hasGreenTick={user.verification.hasGreenTick}
                                size={16}
                                style={styles.searchVerificationBadge}
                                showTooltip={false}
                            />
                        )}
                    </View>
                    {user.informations?.username && (
                        <Text style={styles.searchResultEmail}>
                            @{user.informations.username}
                        </Text>
                    )}
                </View>
                <TouchableOpacity
                    style={[styles.searchActionButton, buttonConfig.style]}
                    onPress={() => handleFriendAction(user.id)}
                    disabled={buttonConfig.disabled}
                >
                    <Text style={[styles.searchActionButtonText, buttonConfig.disabled && { opacity: 0.7 }]}>
                        {buttonConfig.text}
                    </Text>
                </TouchableOpacity>
            </TouchableOpacity>
        );
    };

    const handleSearchResultPress = async (user) => {
        try {
            // Kullanıcı bilgilerini güncel olarak al
            const userDoc = await getDoc(doc(db, 'users', user.id));
            if (userDoc.exists()) {
                const userData = userDoc.data();
                // Kullanıcı bilgilerini düzenle
                const updatedUser = {
                    ...user,
                    bio: userData.bio,
                    friends: userData.friends || [],
                    informations: {
                        ...user.informations,
                        ...userData.informations
                    }
                };
                setSelectedFriend(updatedUser);
                setFriendProfileVisible(true);
            } else {
                setSelectedFriend(user);
                setFriendProfileVisible(true);
            }
        } catch (error) {
            console.error('Kullanıcı bilgileri alınırken hata:', error);
            setSelectedFriend(user);
            setFriendProfileVisible(true);
        }
    };

    const handleFriendAction = async (targetUserId) => {
        try {
            const status = friendshipStatus[targetUserId];

            switch (status) {
                case 'received':
                    const acceptResponse = await acceptFriendRequest(targetUserId);
                    if (acceptResponse.success) {
                        setFriendshipStatus(prev => ({
                            ...prev,
                            [targetUserId]: 'friend'
                        }));
                        showToast('success', 'Başarılı', 'Arkadaşlık isteği kabul edildi');
                    }
                    break;

                case 'none':
                    const sendResponse = await sendFriendRequest(targetUserId);
                    if (sendResponse.success) {
                        setFriendshipStatus(prev => ({
                            ...prev,
                            [targetUserId]: 'pending'
                        }));
                        showToast('success', 'Başarılı', 'Arkadaşlık isteği gönderildi');
                    }
                    break;
            }
        } catch (error) {
            console.error('Arkadaşlık aksiyonu hatası:', error);
            showToast('error', 'Hata', 'İşlem gerçekleştirilemedi');
        }
    };

    const handleLocationShare = async (friendId) => {
        try {
            const location = await getCurrentLocation();
            const result = await shareLocation(currentUserId, friendId, {
                latitude: location.latitude,
                longitude: location.longitude
            });

            if (result.success) {
                showToast('success', 'Başarılı', 'Konum paylaşımı başlatıldı');
            } else {
                showToast('error', 'Hata', result.error);
            }
        } catch (error) {
            console.error('Konum paylaşımı hatası:', error);
            showToast('error', 'Hata', 'Konum paylaşılamadı');
        }
    };

    const handleStartSharing = async (friendIds) => {
        try {
            // Arkadaş seçilip seçilmediğini kontrol et
            if (!friendIds || friendIds.length === 0) {
                showToast('error', 'Hata', 'Lütfen en az bir arkadaş seçin');
                return;
            }

            // Önce konum izinlerini kontrol et
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                showToast('error', 'İzin Hatası', 'Konum izni verilmedi');
                return;
            }

            // Mevcut konumu al
            const currentLocation = await getCurrentLocation();

            // Aktif paylaşımları kontrol et
            const activeSharePromises = friendIds.map(async (friendId) => {
                const hasActiveShare = await checkActiveShare(currentUserId, friendId, 'instant');
                return { friendId, hasActiveShare };
            });

            const activeShareResults = await Promise.all(activeSharePromises);
            const friendsWithActiveShares = activeShareResults.filter(result => result.hasActiveShare);

            if (friendsWithActiveShares.length > 0) {
                // Aktif paylaşımı olan arkadaşları listeden çıkar
                const friendsToShare = friendIds.filter(friendId =>
                    !friendsWithActiveShares.some(result => result.friendId === friendId)
                );

                if (friendsToShare.length === 0) {
                    showToast('error', 'Hata', 'Seçilen tüm arkadaşlarla zaten aktif anlık konum paylaşımınız bulunmakta');
                    return;
                }

                // Aktif paylaşımı olan arkadaşlar için uyarı göster
                if (friendsWithActiveShares.length === 1) {
                    const friendName = friends.find(f => f.id === friendsWithActiveShares[0].friendId)?.name || 'Bir arkadaşınız';
                    showToast('info', 'Bilgi', `${friendName} ile zaten aktif bir anlık konum paylaşımınız var`);
                } else {
                    showToast('info', 'Bilgi', `${friendsWithActiveShares.length} arkadaşınızla zaten aktif anlık konum paylaşımınız var`);
                }

                // Sadece aktif paylaşımı olmayan arkadaşlarla devam et
                friendIds = friendsToShare;
            }

            // Konum bilgilerini al ve Promise'in çözümlenmesini bekle
            const locationInfo = await getLocationInfo(
                currentLocation.latitude,
                currentLocation.longitude
            );

            // locationInfo null olabilir, bu durumda boş bir nesne kullan
            const locationData = locationInfo || {
                city: 'Bilinmiyor',
                district: 'Bilinmiyor',
                street: '',
                country: ''
            };

            // Kullanıcı bilgilerini al
            const userDoc = await getDoc(doc(db, 'users', currentUserId));
            const userData = userDoc.exists() ? userDoc.data() : {};

            // Kullanıcı bilgilerini güvenli bir şekilde hazırla
            const userName = userData?.informations?.name || 'İsimsiz';
            const userUsername = userData?.informations?.username || '';
            const userPhoto = userData?.profilePicture || '';

            // Her bir arkadaş için konum paylaşımı yap
            const sharePromises = friendIds.map(async (friendId) => {
                // Seçilen arkadaşın bilgilerini al
                const selectedFriend = friends.find(friend => friend.id === friendId);
                if (!selectedFriend) {
                    return { success: false, error: 'Arkadaş bilgileri alınamadı', friendId };
                }

                // Arkadaş bilgilerini güvenli bir şekilde hazırla
                const friendName = selectedFriend.name || selectedFriend.informations?.name || 'İsimsiz';
                const friendUsername = selectedFriend.informations?.username || '';
                const friendPhoto = selectedFriend.profilePicture || '';

                // Arkadaş bilgilerini ekleyerek çözümlenmiş veriyi gönder
                return shareInstantLocation(
                    currentUserId,
                    friendId,
                    locationData,
                    {
                        name: friendName,
                        username: friendUsername,
                        profilePicture: friendPhoto,
                        senderName: userName,
                        senderUsername: userUsername,
                        senderPhoto: userPhoto,
                        // Konum bilgilerini ekle
                        location: {
                            latitude: currentLocation.latitude,
                            longitude: currentLocation.longitude
                        }
                    }
                );
            });

            // Tüm paylaşım işlemlerini bekle
            const results = await Promise.all(sharePromises);

            // Başarılı ve başarısız paylaşımları say
            const successCount = results.filter(r => r.success).length;
            const failCount = results.filter(r => !r.success).length;

            // Konum takip aboneliklerini sakla
            results.forEach(result => {
                if (result.success && result.shareId) {
                    setLocationSubscriptions(prev => ({
                        ...prev,
                        [result.shareId]: result.locationSubscription
                    }));
                }
            });

            // Sonuçları kullanıcıya bildir
            if (successCount > 0) {
                if (failCount > 0) {
                    showToast('info', 'Bilgi', `${successCount} arkadaş ile konum paylaşıldı, ${failCount} arkadaş ile paylaşılamadı`);
                } else {
                    showToast('success', 'Başarılı', `${successCount} arkadaş ile konum paylaşımı başlatıldı`);
                }
            } else {
                showToast('error', 'Hata', 'Konum paylaşılamadı');
            }
        } catch (error) {
            console.error('Konum paylaşımı hatası:', error);
            showToast('error', 'Hata', 'Konum paylaşılamadı');
        }
    };

    const handleShareLiveLocation = async (friendIds) => {
        try {
            // Arkadaş seçilip seçilmediğini kontrol et
            if (!friendIds || friendIds.length === 0) {
                showToast('error', 'Hata', 'Lütfen en az bir arkadaş seçin');
                return;
            }

            // Önce konum izinlerini kontrol et
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                showToast('error', 'İzin Hatası', 'Konum izni verilmedi');
                return;
            }

            // Arka plan konum izinlerini kontrol et
            const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();
            if (backgroundStatus !== 'granted') {
                showToast('error', 'İzin Hatası', 'Arka plan konum izni verilmedi');
                return;
            }

            // Mevcut konumu al
            const currentLocation = await getCurrentLocation();

            // Aktif paylaşımları kontrol et
            const activeSharePromises = friendIds.map(async (friendId) => {
                const hasActiveShare = await checkActiveShare(currentUserId, friendId, 'live');
                return { friendId, hasActiveShare };
            });

            const activeShareResults = await Promise.all(activeSharePromises);
            const friendsWithActiveShares = activeShareResults.filter(result => result.hasActiveShare);

            if (friendsWithActiveShares.length > 0) {
                // Aktif paylaşımı olan arkadaşları listeden çıkar
                const friendsToShare = friendIds.filter(friendId =>
                    !friendsWithActiveShares.some(result => result.friendId === friendId)
                );

                if (friendsToShare.length === 0) {
                    showToast('error', 'Hata', 'Seçilen tüm arkadaşlarla zaten aktif canlı konum paylaşımınız bulunmakta');
                    return;
                }

                // Aktif paylaşımı olan arkadaşlar için uyarı göster
                if (friendsWithActiveShares.length === 1) {
                    const friendName = friends.find(f => f.id === friendsWithActiveShares[0].friendId)?.name || 'Bir arkadaşınız';
                    showToast('info', 'Bilgi', `${friendName} ile zaten aktif bir canlı konum paylaşımınız var`);
                } else {
                    showToast('info', 'Bilgi', `${friendsWithActiveShares.length} arkadaşınızla zaten aktif canlı konum paylaşımınız var`);
                }

                // Sadece aktif paylaşımı olmayan arkadaşlarla devam et
                friendIds = friendsToShare;
            }

            // Konum bilgilerini al ve Promise'in çözümlenmesini bekle
            const locationInfo = await getLocationInfo(
                currentLocation.latitude,
                currentLocation.longitude
            );

            // locationInfo null olabilir, bu durumda boş bir nesne kullan
            const locationData = locationInfo || {
                city: 'Bilinmiyor',
                district: 'Bilinmiyor',
                street: '',
                country: ''
            };

            // Kullanıcı bilgilerini al
            const userDoc = await getDoc(doc(db, 'users', currentUserId));
            const userData = userDoc.exists() ? userDoc.data() : {};

            // Kullanıcı bilgilerini güvenli bir şekilde hazırla
            const userName = userData?.informations?.name || 'İsimsiz';
            const userUsername = userData?.informations?.username || '';
            const userPhoto = userData?.profilePicture || '';

            // Her bir arkadaş için canlı konum paylaşımı yap
            const sharePromises = friendIds.map(async (friendId) => {
                try {
                    // Seçilen arkadaşın bilgilerini al
                    const selectedFriend = friends.find(friend => friend.id === friendId);
                    if (!selectedFriend) {
                        return { success: false, error: 'Arkadaş bilgileri alınamadı', friendId };
                    }

                    // Arkadaş bilgilerini güvenli bir şekilde hazırla
                    const friendName = selectedFriend.name || selectedFriend.informations?.name || 'İsimsiz';
                    const friendUsername = selectedFriend.informations?.username || '';
                    const friendPhoto = selectedFriend.profilePicture || '';

                    // 1. Firestore'da paylaşım kaydı oluştur
                    const shareRef = await addDoc(collection(db, `users/${currentUserId}/shares`), {
                        type: 'live',
                        friendId: friendId,
                        status: 'active',
                        startTime: serverTimestamp(),
                        lastUpdate: serverTimestamp(),
                        locationInfo: locationData,
                        friendName: friendName,
                        friendUsername: friendUsername,
                        friendPhoto: friendPhoto
                    });

                    // 2. Karşı tarafa paylaşımı ekle
                    await addDoc(collection(db, `users/${friendId}/receivedShares`), {
                        type: 'live',
                        fromUserId: currentUserId,
                        shareId: shareRef.id,
                        status: 'active',
                        startTime: serverTimestamp(),
                        lastUpdate: serverTimestamp(),
                        locationInfo: locationData,
                        senderName: userName,
                        senderUsername: userUsername,
                        senderPhoto: userPhoto
                    });

                    // 3. RTDB'de başlangıç konumu oluştur
                    const locationRef = ref(rtdb, `locations/${shareRef.id}`);
                    await set(locationRef, {
                        latitude: currentLocation.latitude,
                        longitude: currentLocation.longitude,
                        accuracy: 0,
                        heading: 0,
                        speed: 0,
                        timestamp: serverTimestamp()
                    });

                    return { success: true, shareId: shareRef.id, friendId };
                } catch (error) {
                    console.error(`${friendId} ile canlı konum paylaşım hatası:`, error);
                    return { success: false, error: error.message, friendId };
                }
            });

            // Tüm paylaşım işlemlerini bekle
            const results = await Promise.all(sharePromises);

            // Başarılı ve başarısız paylaşımları say
            const successCount = results.filter(r => r.success).length;
            const failCount = results.filter(r => !r.success).length;

            // Konum güncellemesi için kullanılacak bilgileri hazırla
            // Bu bilgileri global bir değişkene atayalım ki arka plan servisi kullanabilsin
            if (successCount > 0) {
                // Başarılı olan ilk paylaşımı kullan
                const firstSuccess = results.find(r => r.success);
                if (firstSuccess) {
                    global.shareLocationInfo = {
                        shareId: firstSuccess.shareId,
                        userId: currentUserId,
                        friendId: firstSuccess.friendId,
                        // Konum bilgilerini string olarak saklayalım
                        locationInfo: JSON.stringify(locationData)
                    };

                    // 4. Arka plan konum takibini başlat
                    const started = await startBackgroundLocationUpdates(currentUserId);
                    if (!started) {
                        console.error('Arka plan konum takibi başlatılamadı');
                    }
                }
            }

            // Konum takip aboneliklerini sakla
            results.forEach(result => {
                if (result.success && result.shareId) {
                    setLocationSubscriptions(prev => ({
                        ...prev,
                        [result.shareId]: true
                    }));
                }
            });

            // Sonuçları kullanıcıya bildir
            if (successCount > 0) {
                if (failCount > 0) {
                    showToast('info', 'Bilgi', `${successCount} arkadaş ile canlı konum paylaşıldı, ${failCount} arkadaş ile paylaşılamadı`);
                } else {
                    showToast('success', 'Başarılı', `${successCount} arkadaş ile canlı konum paylaşımı başlatıldı`);
                }
            } else {
                showToast('error', 'Hata', 'Canlı konum paylaşılamadı');
            }
        } catch (error) {
            console.error('Canlı konum paylaşım hatası:', error);
            showToast('error', 'Hata', 'Canlı konum paylaşılamadı');
        }
    };

    const handleStopShare = async (shareId) => {
        try {
            // 1. Firestore'da paylaşımı yapan kullanıcının shares koleksiyonunu güncelle
            await updateDoc(doc(db, `users/${currentUserId}/shares/${shareId}`), {
                status: 'ended',
                endTime: serverTimestamp()
            });

            // 2. Karşı tarafın receivedShares koleksiyonunu güncelle
            const shareDoc = await getDoc(doc(db, `users/${currentUserId}/shares/${shareId}`));
            const friendId = shareDoc.data().friendId;

            const receivedSharesQuery = query(
                collection(db, `users/${friendId}/receivedShares`),
                where('fromUserId', '==', currentUserId),
                where('status', '==', 'active')
            );
            const querySnapshot = await getDocs(receivedSharesQuery);
            querySnapshot.forEach(async (doc) => {
                await updateDoc(doc.ref, {
                    status: 'ended',
                    endTime: serverTimestamp()
                });
            });

            // 3. RTDB'den konum verilerini temizle
            const locationRef = ref(rtdb, `locations/${shareId}`);
            await remove(locationRef);

            // 4. Konum takibini durdur
            if (locationSubscriptions[shareId]) {
                // Aboneliği kontrol et ve varsa kaldır
                const subscription = locationSubscriptions[shareId];
                if (subscription && typeof subscription.remove === 'function') {
                    subscription.remove();
                }

                // Aboneliği state'den kaldır
                setLocationSubscriptions(prev => {
                    const newSubscriptions = { ...prev };
                    delete newSubscriptions[shareId];
                    return newSubscriptions;
                });

                // Eğer başka aktif paylaşım yoksa arka plan takibi durdur
                if (Object.keys(locationSubscriptions).length === 1) { // Sadece bu paylaşım varsa
                    await stopBackgroundLocationUpdates();
                }
            }

            showToast('success', 'Başarılı', 'Paylaşım durduruldu');
        } catch (error) {
            console.error('Paylaşım durdurma hatası:', error);
            showToast('error', 'Hata', 'Paylaşım durdurulamadı');
        }
    };

    const handleFriendPress = async (friend) => {
        try {
            // Kullanıcı bilgilerini güncel olarak al
            const userDoc = await getDoc(doc(db, 'users', friend.id));
            if (userDoc.exists()) {
                const userData = userDoc.data();
                // Bio'yu da ekleyelim
                const updatedFriend = {
                    ...friend,
                    bio: userData.bio // Bio'yu doğrudan kök seviyeden al
                };
                setSelectedFriend(updatedFriend);
                setFriendProfileVisible(true);
            } else {
                setSelectedFriend(friend);
                setFriendProfileVisible(true);
            }
        } catch (error) {
            console.error('Kullanıcı bilgileri alınırken hata:', error);
            setSelectedFriend(friend);
            setFriendProfileVisible(true);
        }
    };


    const handleMessagePress = (friend) => {
        const chatFriend = {
            id: friend.id,
            name: friend.name || friend.informations?.name,
            profilePicture: friend.profilePicture || friend.informations?.profilePicture,
            informations: friend.informations,
            isOnline: friend.isOnline || false,
            lastSeen: friend.lastSeen
        };

        navigation.navigate('DirectMessages', {
            screen: 'MessagesHome',
            params: {
                initialChat: chatFriend
            }
        });
    };

    const handleRemoveFriend = (friend) => {
        Alert.alert(
            "Arkadaşı Çıkar",
            `${friend.name} adlı kişiyi arkadaş listenizden çıkarmak istediğinize emin misiniz?`,
            [
                {
                    text: "İptal",
                    style: "cancel"
                },
                {
                    text: "Çıkar",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            // Arkadaşı çıkarma işlemi
                            await removeFriend(currentUserId, friend.id);
                            // Arkadaş listesini güncelle
                            const updatedFriends = friends.filter(f => f.id !== friend.id);
                            setFriends(updatedFriends);
                            showToast('success', 'Başarılı', 'Arkadaş listenizden çıkarıldı');
                        } catch (error) {
                            console.error('Arkadaş çıkarma hatası:', error);
                            showToast('error', 'Hata', 'Arkadaş çıkarılırken bir sorun oluştu');
                        }
                    }
                }
            ]
        );
    };

    const handleCancelRequest = async (targetUserId) => {
        try {
            const response = await cancelFriendRequest(targetUserId);
            if (response.success) {
                // Gönderilen istekler listesini güncelle
                setSentRequests(sentRequests.filter(request => request.id !== targetUserId));
                showToast('success', 'Başarılı', 'Arkadaşlık isteği iptal edildi');
            }
        } catch (error) {
            console.error('İstek iptal hatası:', error);
            showToast('error', 'Hata', 'İstek iptal edilirken bir sorun oluştu');
        }
    };

    const renderHeader = () => (
        <View style={styles.header}>
            {activeTab !== 'Arkadaşlar' && (
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => setActiveTab('Arkadaşlar')}
                >
                    <MaterialIcons name="arrow-back-ios" size={22} color="#1A1A1A" />
                </TouchableOpacity>
            )}

            <Text style={[
                styles.headerTitle,
                activeTab !== 'Arkadaşlar' ? styles.headerTitleWithBack : null
            ]}>
                {activeTab}
            </Text>

            {activeTab === 'Arkadaşlar' && (
                <View style={styles.headerActions}>
                    <TouchableOpacity
                        style={styles.headerButton}
                        onPress={() => setActiveTab('Paylaşımlar')}
                    >
                        <MaterialIcons name="share-location" size={22} color="#2C3E50" />
                        {shares.length > 0 && (
                            <View style={styles.badge}>
                                <Text style={styles.badgeText}>{shares.length}</Text>
                            </View>
                        )}
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.headerButton}
                        onPress={() => setActiveTab('İstekler')}
                    >
                        <MaterialIcons name="person-add" size={22} color="#2C3E50" />
                        {friendRequests.length > 0 && (
                            <View style={styles.badge}>
                                <Text style={styles.badgeText}>{friendRequests.length}</Text>
                            </View>
                        )}
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.headerButton}
                        onPress={() => setActiveTab('Ara')}
                    >
                        <MaterialIcons name="search" size={22} color="#2C3E50" />
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );

    const renderFriendCard = ({ item: friend }) => (
        <TouchableOpacity
            style={styles.friendCard}
            onPress={() => handleFriendPress(friend)}
            onLongPress={() => handleRemoveFriend(friend)}
            delayLongPress={500}
        >
            <View style={styles.friendMainInfo}>
                <FastImage
                    source={
                        friend.profilePicture
                            ? {
                                uri: friend.profilePicture,
                                priority: FastImage.priority.normal,
                                cache: FastImage.cacheControl.immutable
                            }
                            : {
                                uri: `https://ui-avatars.com/api/?name=${encodeURIComponent(friend.name)}&background=random`,
                                priority: FastImage.priority.normal,
                                cache: FastImage.cacheControl.web
                            }
                    }
                    style={styles.profileImage}
                    resizeMode={FastImage.resizeMode.cover}
                />
                <View style={styles.friendInfo}>
                    <View style={styles.friendNameContainer}>
                        <Text style={styles.friendName}>{friend.name || 'İsimsiz'}</Text>
                        {friend.verification && (
                            <VerificationBadge
                                hasBlueTick={friend.verification.hasBlueTick}
                                hasGreenTick={friend.verification.hasGreenTick}
                                size={16}
                                style={styles.friendVerificationBadge}
                                showTooltip={false}
                            />
                        )}
                    </View>
                    {shares.some(share => share.friendId === friend.id) && (
                        <View style={styles.activeShareContainer}>
                            <MaterialIcons
                                name="location-on"
                                size={16}
                                color="#4CAF50"
                            />
                            <Text style={styles.activeShareText}>
                                {shares.find(share => share.friendId === friend.id)?.type === 'live'
                                    ? 'Canlı Konum Paylaşımı'
                                    : 'Anlık Konum Paylaşımı'}
                            </Text>
                        </View>
                    )}
                </View>
            </View>

            <View style={styles.actionButtons}>
                <TouchableOpacity
                    style={[styles.actionButton, styles.messageButton]}
                    onPress={() => handleMessagePress(friend)}
                >
                    <LinearGradient
                        colors={['#2196F3', '#1976D2']}
                        style={styles.actionButtonGradient}
                    >
                        <Ionicons name="chatbubble-outline" size={20} color="#FFF" />
                    </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.actionButton, styles.locationButton]}
                    onPress={() => handleLocationShare(friend.id)}
                >
                    <LinearGradient
                        colors={['#4CAF50', '#388E3C']}
                        style={styles.actionButtonGradient}
                    >
                        <Ionicons name="location-outline" size={20} color="#FFF" />
                    </LinearGradient>
                </TouchableOpacity>
            </View>
        </TouchableOpacity>
    );

    const renderSearchSection = () => (
        <View style={styles.searchSection}>
            <View style={styles.searchContainer}>
                <MaterialIcons name="search" size={24} color="#666" />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Kullanıcı ara..."
                    value={searchQuery}
                    onChangeText={handleSearchChange}
                    autoCapitalize="none"
                />
            </View>

            {loading ? (
                <ActivityIndicator size="large" color="#2196F3" style={styles.loader} />
            ) : (
                <ScrollView
                    contentContainerStyle={styles.searchResultsContainer}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={() => {
                                if (searchQuery.trim() !== '') {
                                    setRefreshing(true);
                                    handleSearchChange(searchQuery);
                                }
                            }}
                            colors={['#2196F3']} // Android için
                            tintColor="#2196F3" // iOS için
                            title="Yenileniyor..." // iOS için
                        />
                    }
                >
                    {searchResults.map((user) => renderSearchResultCard(user))}
                </ScrollView>
            )}
        </View>
    );

    const renderLocationSharingOptions = () => (
        <View style={styles.sharingOptionsContainer}>
            <Text style={styles.sectionTitle}>Konum Paylaşımı</Text>
            <View style={styles.friendChips}>
                {friends.map(friend => (
                    <TouchableOpacity
                        key={friend.id}
                        style={[
                            styles.friendChip,
                            selectedFriends.includes(friend.id) && styles.selectedChip
                        ]}
                        onPress={() => {
                            setSelectedFriends(prev =>
                                prev.includes(friend.id)
                                    ? prev.filter(id => id !== friend.id)
                                    : [...prev, friend.id]
                            );
                        }}
                    >
                        <FastImage
                            source={friend.profilePicture
                                ? {
                                    uri: friend.profilePicture,
                                    priority: FastImage.priority.normal,
                                    cache: FastImage.cacheControl.immutable
                                }
                                : {
                                    uri: `https://ui-avatars.com/api/?name=${friend.name}&background=random`,
                                    priority: FastImage.priority.normal,
                                    cache: FastImage.cacheControl.web
                                }
                            }
                            style={styles.chipImage}
                            resizeMode={FastImage.resizeMode.cover}
                        />
                        <Text style={styles.chipText}>{friend.name}</Text>
                    </TouchableOpacity>
                ))}
            </View>
            <View style={styles.sharingButtons}>
                <TouchableOpacity
                    style={[styles.sharingButton, styles.instantShareButton]}
                    onPress={() => handleStartSharing(selectedFriends)}
                >
                    <MaterialIcons name="my-location" size={24} color="#FFF" />
                    <Text style={styles.sharingButtonText}>Anlık Konum</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.sharingButton, styles.liveShareButton]}
                    onPress={() => handleShareLiveLocation(selectedFriends)}
                >
                    <MaterialIcons name="location-on" size={24} color="#FFF" />
                    <Text style={styles.sharingButtonText}>Canlı Konum</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    const renderActiveShares = () => (
        <View style={styles.activeSharesSection}>
            <Text style={styles.sectionTitle}>Aktif Paylaşımlar</Text>
            {shares.map(share => (
                <View
                    key={`${share.friendId}_${share.type}`}
                    style={styles.shareCard}
                >
                    <View style={styles.shareHeader}>
                        <FastImage
                            source={
                                share.friendPhoto
                                    ? {
                                        uri: share.friendPhoto,
                                        priority: FastImage.priority.normal,
                                        cache: FastImage.cacheControl.immutable
                                    }
                                    : {
                                        uri: `https://ui-avatars.com/api/?name=${share.friendName}&background=random`,
                                        priority: FastImage.priority.normal,
                                        cache: FastImage.cacheControl.web
                                    }
                            }
                            style={styles.friendAvatar}
                            resizeMode={FastImage.resizeMode.cover}
                        />
                        <View style={styles.shareInfo}>
                            <Text style={styles.friendName}>{share.friendName}</Text>
                            {share.friendUsername && (
                                <Text style={styles.username}>@{share.friendUsername}</Text>
                            )}
                        </View>
                        <TouchableOpacity
                            style={styles.stopShareButton}
                            onPress={() => handleStopShare(share.id)}
                        >
                            <MaterialIcons name="close" size={24} color="#FF3B30" />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.shareDetails}>
                        <View style={styles.shareTypeContainer}>
                            <MaterialIcons
                                name={share.type === 'live' ? 'location-on' : 'my-location'}
                                size={20}
                                color={share.type === 'live' ? '#2196F3' : '#4CAF50'}
                            />
                            <Text style={[
                                styles.shareTypeText,
                                { color: share.type === 'live' ? '#2196F3' : '#4CAF50' }
                            ]}>
                                {share.type === 'live' ? 'Canlı Konum' : 'Anlık Konum'}
                            </Text>
                        </View>

                        {share.locationInfo && (
                            <View style={styles.locationInfo}>
                                <MaterialIcons name="place" size={16} color="#666" />
                                <Text style={styles.locationText}>
                                    {share.locationInfo.district || 'Bilinmeyen Bölge'}, {share.locationInfo.city || 'Bilinmeyen Şehir'}
                                </Text>
                            </View>
                        )}

                        <View style={styles.timeInfo}>
                            <View style={styles.timeRow}>
                                <MaterialIcons name="access-time" size={16} color="#666" />
                                <Text style={styles.timeText}>
                                    Başlangıç: {getTimeAgo(share.startTime)}
                                </Text>
                            </View>
                            {share.type === 'live' && share.lastUpdate && (
                                <View style={styles.timeRow}>
                                    <MaterialIcons name="update" size={16} color="#666" />
                                    <Text style={styles.timeText}>
                                        Son güncelleme: {getTimeAgo(share.lastUpdate)}
                                    </Text>
                                </View>
                            )}
                        </View>
                    </View>
                </View>
            ))}
        </View>
    );

    const onRefreshShares = React.useCallback(async () => {
        setRefreshing(true);
        try {
            // Paylaşımları yenile
            if (currentUserId) {
                const shares = await getShares(currentUserId);
                setShares(shares);

                // Gelen paylaşımları yenile
                const receivedShares = await getReceivedShares(currentUserId);
                setReceivedShares(receivedShares);
            }
        } catch (error) {
            console.error('Yenileme hatası:', error);
            showToast('error', 'Hata', 'Paylaşımlar güncellenirken bir sorun oluştu');
        } finally {
            setRefreshing(false);
        }
    }, [currentUserId]);

    const renderSharesTab = () => {
        return (
            <ScrollView
                style={styles.sharesContainer}
                contentContainerStyle={styles.sharesContentContainer}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefreshShares}
                        colors={['#2196F3']} // Android için
                        tintColor="#2196F3" // iOS için
                    />
                }
            >
                {/* Gelen Paylaşımlar Bölümü */}
                {receivedShares.length > 0 && (
                    <View style={styles.sharesSection}>
                        <Text style={styles.sectionTitle}>Gelen Paylaşımlar</Text>
                        <View>
                            {/* Canlı Konum Paylaşımları */}
                            {receivedShares.filter(share => share.type === 'live').length > 0 && (
                                <View style={styles.shareTypeSection} key="live-shares">
                                    <Text style={styles.shareTypeTitle}>Canlı Konumlar</Text>
                                    {receivedShares
                                        .filter(share => share.type === 'live')
                                        .map(share => (
                                            <React.Fragment key={share.id || `live-${share.fromUserId}-${share.startTime}`}>
                                                {renderReceivedShareCard(share)}
                                            </React.Fragment>
                                        ))}
                                </View>
                            )}

                            {/* Anlık Konum Paylaşımları */}
                            {receivedShares.filter(share => share.type === 'instant').length > 0 && (
                                <View style={styles.shareTypeSection} key="instant-shares">
                                    <Text style={styles.shareTypeTitle}>Anlık Konumlar</Text>
                                    {receivedShares
                                        .filter(share => share.type === 'instant')
                                        .map(share => (
                                            <React.Fragment key={share.id || `instant-${share.fromUserId}-${share.startTime}`}>
                                                {renderReceivedShareCard(share)}
                                            </React.Fragment>
                                        ))}
                                </View>
                            )}
                        </View>
                    </View>
                )}

                {/* Aktif Paylaşımlar Bölümü */}
                <View style={styles.sharesSection}>
                    <Text style={styles.sectionTitle}>Paylaştığınız Konumlar</Text>
                    {shares.length > 0 ? (
                        <View>
                            {/* Canlı Konum Paylaşımları */}
                            {shares.filter(share => share.type === 'live').length > 0 && (
                                <View style={styles.shareTypeSection} key="my-live-shares">
                                    <Text style={styles.shareTypeTitle}>Canlı Konumlar</Text>
                                    {shares
                                        .filter(share => share.type === 'live')
                                        .map(share => (
                                            <React.Fragment key={share.id || `my-live-${share.friendId}-${share.startTime}`}>
                                                {renderShareCard(share)}
                                            </React.Fragment>
                                        ))}
                                </View>
                            )}

                            {/* Anlık Konum Paylaşımları */}
                            {shares.filter(share => share.type === 'instant').length > 0 && (
                                <View style={styles.shareTypeSection} key="my-instant-shares">
                                    <Text style={styles.shareTypeTitle}>Anlık Konumlar</Text>
                                    {shares
                                        .filter(share => share.type === 'instant')
                                        .map(share => (
                                            <React.Fragment key={share.id || `my-instant-${share.friendId}-${share.startTime}`}>
                                                {renderShareCard(share)}
                                            </React.Fragment>
                                        ))}
                                </View>
                            )}
                        </View>
                    ) : (
                        <View style={styles.emptySharesContainer}>
                            <Ionicons name="location-outline" size={48} color="#666" />
                            <Text style={styles.emptySharesText}>Aktif paylaşımınız bulunmuyor</Text>
                            <Text style={styles.emptySharesSubText}>
                                Arkadaşlarınızla konum paylaşmaya başlayın
                            </Text>
                        </View>
                    )}
                </View>

                {/* Hızlı Paylaşım Seçenekleri */}
                <View style={styles.quickShareSection}>
                    <Text style={styles.sectionTitle}>Hızlı Paylaşım</Text>

                    {/* Arkadaş Seçimi */}
                    <View style={styles.friendSelectContainer}>
                        <Text style={styles.subsectionTitle}>Arkadaş Seçin</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                            {friends.map(friend => (
                                <TouchableOpacity
                                    key={friend.id}
                                    style={[
                                        styles.friendSelectItem,
                                        selectedFriends.includes(friend.id) && styles.selectedFriendItem
                                    ]}
                                    onPress={() => handleFriendSelect(friend.id)}
                                >
                                    <FastImage
                                        source={
                                            friend.profilePicture
                                                ? {
                                                    uri: friend.profilePicture,
                                                    priority: FastImage.priority.normal,
                                                    cache: FastImage.cacheControl.immutable
                                                }
                                                : {
                                                    uri: `https://ui-avatars.com/api/?name=${friend.name}&background=random`,
                                                    priority: FastImage.priority.normal,
                                                    cache: FastImage.cacheControl.web
                                                }
                                        }
                                        style={styles.friendSelectImage}
                                        resizeMode={FastImage.resizeMode.cover}
                                    />
                                    <Text style={styles.friendSelectName}>{friend.name}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>

                    {/* Paylaşım Seçenekleri */}
                    <View style={styles.shareOptionsContainer}>
                        <TouchableOpacity
                            style={[styles.shareOption, { backgroundColor: '#E8F5E9' }]}
                            onPress={() => handleStartSharing(selectedFriends)}
                            disabled={selectedFriends.length === 0}
                        >
                            <Ionicons name="location" size={24} color="#4CAF50" />
                            <View style={styles.shareOptionInfo}>
                                <Text style={styles.shareOptionTitle}>Anlık Konum</Text>
                                <Text style={styles.shareOptionDescription}>
                                    Mevcut konumunuzu paylaşın
                                </Text>
                            </View>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.shareOption, { backgroundColor: '#E3F2FD' }]}
                            onPress={() => handleShareLiveLocation(selectedFriends)}
                            disabled={selectedFriends.length === 0}
                        >
                            <Ionicons name="navigate" size={24} color="#2196F3" />
                            <View style={styles.shareOptionInfo}>
                                <Text style={styles.shareOptionTitle}>Canlı Konum</Text>
                                <Text style={styles.shareOptionDescription}>
                                    Gerçek zamanlı konum takibi
                                </Text>
                            </View>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>
        );
    };

    const getTimeAgo = (timestamp) => {
        if (!timestamp) return 'Bilinmiyor';

        try {
            // timestamp bir Firestore Timestamp nesnesi mi kontrol et
            const date = timestamp.toDate ? timestamp.toDate() :
                // timestamp bir Date nesnesi mi kontrol et
                timestamp instanceof Date ? timestamp :
                    // timestamp bir sayı mı kontrol et
                    typeof timestamp === 'number' ? new Date(timestamp) :
                        // hiçbiri değilse şu anki zamanı kullan
                        new Date();

            const now = new Date();
            const diffInMinutes = Math.floor((now - date) / (1000 * 60));

            if (diffInMinutes < 1) return 'Şimdi';
            if (diffInMinutes < 60) return `${diffInMinutes} dakika önce`;
            if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} saat önce`;
            return `${Math.floor(diffInMinutes / 1440)} gün önce`;
        } catch (error) {
            console.error('Zaman hesaplama hatası:', error);
            return 'Bilinmiyor';
        }
    };

    const renderShareCard = (share) => {
        // Konum bilgilerini kontrol et
        const hasLocationInfo = share.locationInfo &&
            (share.locationInfo.city || share.locationInfo.district);

        // Konum koordinatlarını kontrol et
        const hasValidLocation = share.location &&
            typeof share.location.latitude === 'number' &&
            typeof share.location.longitude === 'number';

        return (
            <View style={styles.shareCardNew}>
                <LinearGradient
                    colors={share.type === 'live' ? ['#E3F2FD', '#BBDEFB'] : ['#E8F5E9', '#C8E6C9']}
                    style={styles.shareCardGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                >
                    <View style={styles.shareHeaderNew}>
                        <View style={styles.shareUserInfo}>
                            <FastImage
                                source={
                                    share.friendPhoto
                                        ? {
                                            uri: share.friendPhoto,
                                            priority: FastImage.priority.normal,
                                            cache: FastImage.cacheControl.immutable
                                        }
                                        : {
                                            uri: `https://ui-avatars.com/api/?name=${share.friendName}&background=random`,
                                            priority: FastImage.priority.normal,
                                            cache: FastImage.cacheControl.web
                                        }
                                }
                                style={styles.friendAvatarNew}
                                resizeMode={FastImage.resizeMode.cover}
                            />
                            <View style={styles.shareInfoNew}>
                                <Text style={styles.friendNameNew}>{share.friendName}</Text>
                                {share.friendUsername && (
                                    <Text style={styles.usernameNew}>@{share.friendUsername}</Text>
                                )}
                            </View>
                        </View>

                        <View style={styles.shareTypeContainerNew}>
                            <MaterialIcons
                                name={share.type === 'live' ? 'location-on' : 'my-location'}
                                size={18}
                                color={share.type === 'live' ? '#2196F3' : '#4CAF50'}
                            />
                            <Text style={[
                                styles.shareTypeTextNew,
                                { color: share.type === 'live' ? '#2196F3' : '#4CAF50' }
                            ]}>
                                {share.type === 'live' ? 'Canlı Konum' : 'Anlık Konum'}
                            </Text>
                        </View>
                    </View>

                    <View style={styles.shareDetailsNew}>
                        {hasLocationInfo &&
                            share.locationInfo.city && share.locationInfo.city !== 'Bilinmiyor' &&
                            share.locationInfo.district && share.locationInfo.district !== 'Bilinmiyor' ? (
                            <View style={styles.locationInfoNew}>
                                <View style={styles.locationIconContainer}>
                                    <MaterialIcons name="place" size={20} color="#555" />
                                </View>
                                <Text style={styles.locationTextNew}>
                                    {share.locationInfo.district}, {share.locationInfo.city}
                                </Text>
                            </View>
                        ) : (
                            <TouchableOpacity
                                style={styles.locationInfoNew}
                                onPress={async () => {
                                    // Konum bilgilerini al ve güncelle
                                    try {
                                        if (!hasValidLocation) {
                                            showToast('error', 'Hata', 'Geçerli konum bilgisi bulunamadı');
                                            return;
                                        }

                                        showToast('info', 'Bilgi', 'Konum bilgileri yükleniyor...');
                                        const locationInfo = await getLocationInfo(
                                            share.location.latitude,
                                            share.location.longitude
                                        );
                                        if (locationInfo) {
                                            // Paylaşımı güncelle
                                            const shareRef = doc(db, `users/${currentUserId}/shares/${share.id}`);
                                            await updateDoc(shareRef, { locationInfo });

                                            // Paylaşımları yenile
                                            fetchShares(currentUserId);
                                            showToast('success', 'Başarılı', 'Konum bilgileri güncellendi');
                                        } else {
                                            showToast('error', 'Hata', 'Konum bilgileri alınamadı');
                                        }
                                    } catch (error) {
                                        console.error('Konum bilgisi güncelleme hatası:', error);
                                        showToast('error', 'Hata', 'Konum bilgileri güncellenirken bir sorun oluştu');
                                    }
                                }}
                            >
                                <View style={styles.locationIconContainer}>
                                    <MaterialIcons name="refresh" size={20} color="#555" />
                                </View>
                                <Text style={styles.locationTextNew}>
                                    {hasLocationInfo ? 'Konum bilgilerini yenilemek için dokunun' : 'Konum bilgilerini yüklemek için dokunun'}
                                </Text>
                            </TouchableOpacity>
                        )}

                        <View style={styles.timeInfoNew}>
                            <View style={styles.timeRowNew}>
                                <View style={styles.timeIconContainer}>
                                    <MaterialIcons name="access-time" size={18} color="#666" />
                                </View>
                                <Text style={styles.timeTextNew}>
                                    Başlangıç: {getTimeAgo(share.startTime)}
                                </Text>
                            </View>
                            {share.type === 'live' && share.lastUpdate && (
                                <View style={styles.timeRowNew}>
                                    <View style={styles.timeIconContainer}>
                                        <MaterialIcons name="update" size={18} color="#666" />
                                    </View>
                                    <Text style={styles.timeTextNew}>
                                        Son güncelleme: {getTimeAgo(share.lastUpdate)}
                                    </Text>
                                </View>
                            )}
                        </View>
                    </View>

                    <TouchableOpacity
                        style={styles.stopShareButtonNew}
                        onPress={() => handleStopShare(share.id)}
                    >
                        <LinearGradient
                            colors={['#FF5252', '#FF1744']}
                            style={styles.stopButtonGradient}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                        >
                            <MaterialIcons name="stop" size={16} color="#FFF" />
                            <Text style={styles.stopButtonText}>Paylaşımı Durdur</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                </LinearGradient>
            </View>
        );
    };

    // Eksik olan renderReceivedShareCard fonksiyonunu ekleyelim
    const renderReceivedShareCard = (share) => {
        // Konum bilgilerini kontrol et
        const hasLocationInfo = share.locationInfo &&
            (share.locationInfo.city || share.locationInfo.district);

        // Konum koordinatlarını kontrol et
        const hasValidLocation = share.location &&
            typeof share.location.latitude === 'number' &&
            typeof share.location.longitude === 'number';

        return (
            <TouchableOpacity
                style={styles.shareCardNew}
                onPress={() => viewLocationDetail(share)}
            >
                <LinearGradient
                    colors={share.type === 'live' ? ['#E3F2FD', '#BBDEFB'] : ['#E8F5E9', '#C8E6C9']}
                    style={styles.shareCardGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                >
                    <View style={styles.shareHeaderNew}>
                        <View style={styles.shareUserInfo}>
                            <FastImage
                                source={
                                    share.senderPhoto
                                        ? {
                                            uri: share.senderPhoto,
                                            priority: FastImage.priority.normal,
                                            cache: FastImage.cacheControl.immutable
                                        }
                                        : {
                                            uri: `https://ui-avatars.com/api/?name=${share.senderName || 'Unknown'}&background=random`,
                                            priority: FastImage.priority.normal,
                                            cache: FastImage.cacheControl.web
                                        }
                                }
                                style={styles.friendAvatarNew}
                                resizeMode={FastImage.resizeMode.cover}
                            />
                            <View style={styles.shareInfoNew}>
                                <Text style={styles.friendNameNew}>{share.senderName || 'İsimsiz'}</Text>
                                {share.senderUsername && (
                                    <Text style={styles.usernameNew}>@{share.senderUsername}</Text>
                                )}
                            </View>
                        </View>

                        <View style={styles.shareTypeContainerNew}>
                            <MaterialIcons
                                name={share.type === 'live' ? 'location-on' : 'my-location'}
                                size={18}
                                color={share.type === 'live' ? '#2196F3' : '#4CAF50'}
                            />
                            <Text style={[
                                styles.shareTypeTextNew,
                                { color: share.type === 'live' ? '#2196F3' : '#4CAF50' }
                            ]}>
                                {share.type === 'live' ? 'Canlı Konum' : 'Anlık Konum'}
                            </Text>
                        </View>
                    </View>

                    <View style={styles.shareDetailsNew}>
                        {hasLocationInfo &&
                            share.locationInfo.city && share.locationInfo.city !== 'Bilinmiyor' &&
                            share.locationInfo.district && share.locationInfo.district !== 'Bilinmiyor' ? (
                            <View style={styles.locationInfoNew}>
                                <View style={styles.locationIconContainer}>
                                    <MaterialIcons name="place" size={20} color="#555" />
                                </View>
                                <Text style={styles.locationTextNew}>
                                    {share.locationInfo.district}, {share.locationInfo.city}
                                </Text>
                            </View>
                        ) : (
                            <View style={styles.locationInfoNew}>
                                <View style={styles.locationIconContainer}>
                                    <MaterialIcons name="place" size={20} color="#555" />
                                </View>
                                <Text style={styles.locationTextNew}>
                                    Konum bilgisi yükleniyor...
                                </Text>
                            </View>
                        )}

                        <View style={styles.timeInfoNew}>
                            <View style={styles.timeRowNew}>
                                <View style={styles.timeIconContainer}>
                                    <MaterialIcons name="access-time" size={18} color="#666" />
                                </View>
                                <Text style={styles.timeTextNew}>
                                    Başlangıç: {getTimeAgo(share.startTime)}
                                </Text>
                            </View>
                            {share.type === 'live' && share.lastUpdate && (
                                <View style={styles.timeRowNew}>
                                    <View style={styles.timeIconContainer}>
                                        <MaterialIcons name="update" size={18} color="#666" />
                                    </View>
                                    <Text style={styles.timeTextNew}>
                                        Son güncelleme: {getTimeAgo(share.lastUpdate)}
                                    </Text>
                                </View>
                            )}
                        </View>
                    </View>

                    <View style={styles.viewLocationButtonContainer}>
                        <LinearGradient
                            colors={['#2196F3', '#1976D2']}
                            style={styles.viewLocationButton}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                        >
                            <MaterialIcons name="map" size={16} color="#FFF" />
                            <Text style={styles.viewLocationButtonText}>Konumu Görüntüle</Text>
                        </LinearGradient>
                    </View>
                </LinearGradient>
            </TouchableOpacity>
        );
    };

    // Arkadaş seçimi için yardımcı fonksiyon - birden fazla arkadaş seçimine izin ver
    const handleFriendSelect = (friendId) => {
        setSelectedFriends(prev => {
            if (prev.includes(friendId)) {
                return prev.filter(id => id !== friendId);
            }
            // Birden fazla arkadaş seçimine izin ver
            return [...prev, friendId];
        });
    };

    // Component unmount olduğunda tüm konum takiplerini temizle
    useEffect(() => {
        return () => {
            // Tüm abonelikleri temizle
            Object.entries(locationSubscriptions).forEach(([shareId, subscription]) => {
                try {
                    // Aboneliği kontrol et ve varsa kaldır
                    if (subscription && typeof subscription.remove === 'function') {
                        subscription.remove();
                    }
                } catch (error) {
                    console.error('Abonelik kaldırma hatası:', error);
                }
            });
        };
    }, [locationSubscriptions]);

    // İstekler sekmesi render fonksiyonu
    const renderRequestsTab = () => {
        return (
            <ScrollView
                style={styles.requestsContainer}
                contentContainerStyle={styles.requestsContentContainer}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefreshRequests}
                        colors={['#2196F3']}
                        tintColor="#2196F3"
                    />
                }
            >
                {/* Gelen İstekler */}
                {friendRequests.length > 0 && (
                    <View style={styles.requestsSection}>
                        <Text style={styles.sectionTitle}>Gelen İstekler</Text>
                        {friendRequests.map((request) => (
                            <View key={request.id} style={styles.requestCard}>
                                <FastImage
                                    source={
                                        request.profilePicture
                                            ? {
                                                uri: request.profilePicture,
                                                priority: FastImage.priority.normal,
                                                cache: FastImage.cacheControl.immutable
                                            }
                                            : {
                                                uri: `https://ui-avatars.com/api/?name=${encodeURIComponent(request.name)}&background=random`,
                                                priority: FastImage.priority.normal,
                                                cache: FastImage.cacheControl.web
                                            }
                                    }
                                    style={styles.requestImage}
                                    resizeMode={FastImage.resizeMode.cover}
                                />
                                <View style={styles.requestInfo}>
                                    <Text style={styles.requestName}>{request.name}</Text>
                                    <View style={styles.requestButtons}>
                                        <TouchableOpacity
                                            style={[styles.requestButton, styles.acceptButton]}
                                            onPress={() => handleAccept(request.id)}
                                        >
                                            <Text style={styles.acceptButtonText}>Kabul Et</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={[styles.requestButton, styles.rejectButton]}
                                            onPress={() => handleReject(request.id)}
                                        >
                                            <Text style={styles.rejectButtonText}>Reddet</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </View>
                        ))}
                    </View>
                )}

                {/* Gönderilen İstekler */}
                {sentRequests.length > 0 && (
                    <View style={styles.requestsSection}>
                        <Text style={styles.sectionTitle}>Gönderilen İstekler</Text>
                        {sentRequests.map((request) => (
                            <View key={request.id} style={styles.requestCard}>
                                <FastImage
                                    source={
                                        request.profilePicture
                                            ? {
                                                uri: request.profilePicture,
                                                priority: FastImage.priority.normal,
                                                cache: FastImage.cacheControl.immutable
                                            }
                                            : {
                                                uri: `https://ui-avatars.com/api/?name=${encodeURIComponent(request.name)}&background=random`,
                                                priority: FastImage.priority.normal,
                                                cache: FastImage.cacheControl.web
                                            }
                                    }
                                    style={styles.requestImage}
                                    resizeMode={FastImage.resizeMode.cover}
                                />
                                <View style={styles.requestInfo}>
                                    <Text style={styles.requestName}>{request.name}</Text>
                                    {request.username && (
                                        <Text style={styles.requestUsername}>@{request.username}</Text>
                                    )}
                                    <TouchableOpacity
                                        style={[styles.requestButton, styles.cancelButton]}
                                        onPress={() => handleCancelRequest(request.id)}
                                    >
                                        <Text style={styles.cancelButtonText}>İptal Et</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        ))}
                    </View>
                )}

                {friendRequests.length === 0 && sentRequests.length === 0 && (
                    <View style={styles.emptyRequestsContainer}>
                        <Ionicons name="notifications-off-outline" size={48} color="#666" />
                        <Text style={styles.emptyRequestsText}>Bekleyen istek bulunmuyor</Text>
                    </View>
                )}
            </ScrollView>
        );
    };

    // Yenileme fonksiyonu ekleyelim
    const onRefreshRequests = React.useCallback(async () => {
        setRefreshing(true);
        try {
            const requests = await getFriendRequests();
            const sent = await getSentFriendRequests();
            setFriendRequests(requests);
            setSentRequests(sent);
        } catch (error) {
            console.error('İstekleri yenileme hatası:', error);
            showToast('error', 'Hata', 'İstekler güncellenirken bir sorun oluştu');
        } finally {
            setRefreshing(false);
        }
    }, []);

    const onRefresh = React.useCallback(async () => {
        setRefreshing(true);
        try {
            // Arkadaşları yeniden yükle
            const uid = await getCurrentUserUid();
            await fetchFriends(uid);
            // Paylaşımları yeniden yükle
            await fetchShares(uid);
            // İstekleri yeniden yükle
            const requests = await getFriendRequests();
            const sent = await getSentFriendRequests();
            setFriendRequests(requests);
            setSentRequests(sent);
        } catch (error) {
            console.error('Yenileme hatası:', error);
            showToast('error', 'Hata', 'Veriler yenilenirken bir sorun oluştu');
        } finally {
            setRefreshing(false);
        }
    }, []);

    const renderFriendsTab = () => {
        return (
            <View style={styles.tabContent}>
                <FlatList
                    data={friends}
                    renderItem={renderFriendCard}
                    keyExtractor={(item) => item.id}
                    ListHeaderComponent={
                        <>
                            {renderLocationSharingOptions()}
                            <View style={styles.divider} /> {/* Ayırıcı çizgi ekleyin */}
                        </>
                    }
                    contentContainerStyle={styles.friendsListContainer}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            colors={['#2196F3']} // Android için
                            tintColor="#2196F3" // iOS için
                            title="Yenileniyor..." // iOS için
                        />
                    }
                />
            </View>
        );
    };

    const viewLocationDetail = (share) => {
        if (share) {
            navigation.navigate('Harita', {
                initialRegion: {
                    latitude: share.location?.latitude || 0,
                    longitude: share.location?.longitude || 0,
                    latitudeDelta: 0.01,
                    longitudeDelta: 0.01
                },
                shareData: {
                    ...share,
                    type: 'received',
                }
            });
        }
    };

    // Konum bilgilerini almak için yardımcı fonksiyon
    const getLocationInfo = async (latitude, longitude) => {
        try {
            // Latitude ve longitude değerlerinin geçerli sayılar olduğunu kontrol et
            if (!latitude || !longitude || isNaN(latitude) || isNaN(longitude)) {
                console.warn('Geçersiz konum bilgileri:', { latitude, longitude });
                return null;
            }

            // Sayısal değerlere dönüştür
            const lat = parseFloat(latitude);
            const lng = parseFloat(longitude);

            // Google Maps Geocoding API veya başka bir servis kullanabilirsiniz
            // Örnek olarak, Expo Location'ın reverseGeocodeAsync fonksiyonu:
            const response = await Location.reverseGeocodeAsync({
                latitude: lat,
                longitude: lng
            });

            if (response && response.length > 0) {
                const address = response[0];
                return {
                    city: address.city || address.region,
                    district: address.district || address.subregion,
                    street: address.street,
                    country: address.country
                };
            }
            return null;
        } catch (error) {
            console.error('Konum bilgisi alma hatası:', error);
            return null;
        }
    };

    return (
        <>
            <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />
            <View style={[styles.container, { paddingTop: 0 }]}>
                {renderHeader()}

                <View style={styles.content}>
                    {activeTab === 'Arkadaşlar' && renderFriendsTab()}
                    {activeTab === 'Ara' && renderSearchSection()}
                    {activeTab === 'İstekler' && renderRequestsTab()}
                    {activeTab === 'Paylaşımlar' && renderSharesTab()}
                </View>

                {modalVisible && (
                    <FriendRequestModal
                        visible={modalVisible}
                        onClose={() => setModalVisible(false)}
                        request={selectedRequest}
                        onAccept={handleAccept}
                        onReject={handleReject}
                    />
                )}

                <FriendProfileModal
                    visible={friendProfileVisible}
                    onClose={() => setFriendProfileVisible(false)}
                    friend={selectedFriend}
                    navigation={navigation}
                />
            </View>
        </>
    );
};

export default FriendsPage;