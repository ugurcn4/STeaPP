import React, { useState, useEffect } from 'react';
import {
    SafeAreaView,
    View,
    Text,
    TextInput,
    TouchableOpacity,
    FlatList,
    StyleSheet,
    Image,
    Dimensions,
    Alert,
    ScrollView,
    RefreshControl,
    ActivityIndicator
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
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { MaterialIcons } from '@expo/vector-icons';
import {
    shareLocation,
    getCurrentLocation,
    shareLiveLocation,
    getShares,
    stopShare,
    deleteShare,
    shareInstantLocation,
    startLiveLocation,
    stopSharing,
    listenToActiveShares,
    getReceivedShares,
} from '../helpers/locationHelpers';
import Toast from 'react-native-toast-message';
import FriendProfileModal from '../modals/friendProfileModal';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { getFriendDetails } from '../helpers/friendHelpers';
import { LocationTypes } from '../types/locationTypes';
import Stories from '../components/Stories';

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
    const [requestStatus, setRequestStatus] = useState({});
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
            setShares(userShares);
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
                                    }
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

            // Her kullanıcı için arkadaşlık durumunu kontrol et
            const statusPromises = filteredUsers.map(async user => {
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
            <View key={user.id} style={styles.searchResultCard}>
                <Image
                    source={
                        user.profilePicture
                            ? { uri: user.profilePicture }
                            : { uri: `https://ui-avatars.com/api/?name=${user.informations?.name || 'Unknown'}&background=random` }
                    }
                    style={styles.searchResultImage}
                />
                <View style={styles.searchResultInfo}>
                    <Text style={styles.searchResultName}>
                        {user.informations?.name || 'İsimsiz Kullanıcı'}
                    </Text>
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
                    <Text style={styles.searchActionButtonText}>
                        {buttonConfig.text}
                    </Text>
                </TouchableOpacity>
            </View>
        );
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

    const handleStartSharing = async (friendId) => {
        try {
            const result = await shareInstantLocation(currentUserId, friendId);
            if (result.success) {
                // Konum takip aboneliğini sakla
                setLocationSubscriptions(prev => ({
                    ...prev,
                    [result.shareId]: result.locationSubscription
                }));
                showToast('success', 'Başarılı', 'Konum paylaşımı başlatıldı');
            } else {
                showToast('error', 'Hata', result.error);
            }
        } catch (error) {
            showToast('error', 'Hata', 'Konum paylaşılamadı');
        }
    };

    const handleShareLiveLocation = async (friendId) => {
        try {
            const result = await startLiveLocation(currentUserId, friendId);
            if (result.success) {
                // Konum takip aboneliğini sakla
                setLocationSubscriptions(prev => ({
                    ...prev,
                    [result.shareId]: result.locationSubscription
                }));
                showToast('success', 'Başarılı', 'Canlı konum paylaşımı başlatıldı');
            } else {
                showToast('error', 'Hata', result.error);
            }
        } catch (error) {
            showToast('error', 'Hata', 'Canlı konum paylaşılamadı');
        }
    };

    const handleStopShare = async (shareId, type) => {
        try {
            const result = await stopSharing(currentUserId, shareId, type);
            if (result.success) {
                // Konum takibini durdur
                if (type === 'live' && locationSubscriptions[shareId]) {
                    locationSubscriptions[shareId].remove();
                    setLocationSubscriptions(prev => {
                        const newSubs = { ...prev };
                        delete newSubs[shareId];
                        return newSubs;
                    });
                }
                showToast('success', 'Başarılı', 'Paylaşım durduruldu');
            } else {
                showToast('error', 'Hata', result.error);
            }
        } catch (error) {
            showToast('error', 'Hata', 'Paylaşım durdurulamadı');
        }
    };

    const handleFriendPress = (friend) => {
        setSelectedFriend(friend);
        setFriendProfileVisible(true);
    };

    const handleVideoCall = (friend) => {
        Alert.alert(
            "Görüntülü Arama",
            `${friend.name} ile görüntülü arama başlatılıyor...`,
            [
                {
                    text: "İptal",
                    style: "cancel"
                }
            ]
        );
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
                    <MaterialIcons name="arrow-back-ios" size={24} color="#2C3E50" />
                </TouchableOpacity>
            )}

            <Text style={[
                styles.headerTitle,
                activeTab !== 'Arkadaşlar' && styles.headerTitleWithBack
            ]}>
                {activeTab}
            </Text>

            {activeTab === 'Arkadaşlar' && (
                <View style={styles.headerActions}>
                    <TouchableOpacity
                        style={styles.headerButton}
                        onPress={() => setActiveTab('Paylaşımlar')}
                    >
                        <MaterialIcons name="share-location" size={24} color="#2C3E50" />
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
                        <MaterialIcons name="person-add" size={24} color="#2C3E50" />
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
                        <MaterialIcons name="search" size={24} color="#2C3E50" />
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
                <Image
                    source={
                        friend.profilePicture
                            ? { uri: friend.profilePicture }
                            : { uri: `https://ui-avatars.com/api/?name=${encodeURIComponent(friend.name)}&background=random` }
                    }
                    style={styles.profileImage}
                />
                <View style={styles.friendInfo}>
                    <Text style={styles.friendName}>{friend.name || 'İsimsiz'}</Text>
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
                    <Ionicons name="chatbubble-outline" size={20} color="#FFF" />
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.actionButton, styles.locationButton]}
                    onPress={() => handleLocationShare(friend.id)}
                >
                    <Ionicons name="location-outline" size={20} color="#FFF" />
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.actionButton, styles.videoButton]}
                    onPress={() => handleVideoCall(friend)}
                >
                    <Ionicons name="videocam-outline" size={20} color="#FFF" />
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
                <ScrollView>
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
                        <Image
                            source={friend.profilePicture
                                ? { uri: friend.profilePicture }
                                : { uri: `https://ui-avatars.com/api/?name=${friend.name}&background=random` }
                            }
                            style={styles.chipImage}
                        />
                        <Text style={styles.chipText}>{friend.name}</Text>
                    </TouchableOpacity>
                ))}
            </View>
            <View style={styles.sharingButtons}>
                <TouchableOpacity
                    style={[styles.sharingButton, styles.instantShareButton]}
                    onPress={() => handleStartSharing(selectedFriends[0])}
                >
                    <MaterialIcons name="my-location" size={24} color="#FFF" />
                    <Text style={styles.sharingButtonText}>Anlık Konum</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.sharingButton, styles.liveShareButton]}
                    onPress={() => handleShareLiveLocation(selectedFriends[0])}
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
                        <Image
                            source={
                                share.friendPhoto
                                    ? { uri: share.friendPhoto }
                                    : { uri: `https://ui-avatars.com/api/?name=${share.friendName}&background=random` }
                            }
                            style={styles.friendAvatar}
                        />
                        <View style={styles.shareInfo}>
                            <Text style={styles.friendName}>{share.friendName}</Text>
                            {share.friendUsername && (
                                <Text style={styles.username}>@{share.friendUsername}</Text>
                            )}
                        </View>
                        <TouchableOpacity
                            style={styles.stopShareButton}
                            onPress={() => handleStopShare(share.id, share.type)}
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
                                        .map(share => renderReceivedShareCard(share))}
                                </View>
                            )}

                            {/* Anlık Konum Paylaşımları */}
                            {receivedShares.filter(share => share.type === 'instant').length > 0 && (
                                <View style={styles.shareTypeSection} key="instant-shares">
                                    <Text style={styles.shareTypeTitle}>Anlık Konumlar</Text>
                                    {receivedShares
                                        .filter(share => share.type === 'instant')
                                        .map(share => renderReceivedShareCard(share))}
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
                                        .map(share => renderShareCard(share))}
                                </View>
                            )}

                            {/* Anlık Konum Paylaşımları */}
                            {shares.filter(share => share.type === 'instant').length > 0 && (
                                <View style={styles.shareTypeSection} key="my-instant-shares">
                                    <Text style={styles.shareTypeTitle}>Anlık Konumlar</Text>
                                    {shares
                                        .filter(share => share.type === 'instant')
                                        .map(share => renderShareCard(share))}
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
                                    <Image
                                        source={
                                            friend.profilePicture
                                                ? { uri: friend.profilePicture }
                                                : { uri: `https://ui-avatars.com/api/?name=${friend.name}&background=random` }
                                        }
                                        style={styles.friendSelectImage}
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
                            onPress={() => handleStartSharing(selectedFriends[0])}
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
                            onPress={() => handleShareLiveLocation(selectedFriends[0])}
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
        if (!timestamp) return '';
        const now = new Date();
        const shareTime = timestamp.toDate();
        const diffInMinutes = Math.floor((now - shareTime) / (1000 * 60));

        if (diffInMinutes < 1) return 'Şimdi';
        if (diffInMinutes < 60) return `${diffInMinutes} dakika önce`;
        if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} saat önce`;
        return `${Math.floor(diffInMinutes / 1440)} gün önce`;
    };

    const renderShareCard = (share) => {
        return (
            <View style={styles.shareCard}>
                <View style={styles.shareHeader}>
                    <Image
                        source={
                            share.friendPhoto
                                ? { uri: share.friendPhoto }
                                : { uri: `https://ui-avatars.com/api/?name=${share.friendName}&background=random` }
                        }
                        style={styles.friendAvatar}
                    />
                    <View style={styles.shareInfo}>
                        <Text style={styles.friendName}>{share.friendName}</Text>
                        {share.friendUsername && (
                            <Text style={styles.username}>@{share.friendUsername}</Text>
                        )}
                    </View>
                    <TouchableOpacity
                        style={styles.stopShareButton}
                        onPress={() => handleStopShare(share.id, share.type)}
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
        );
    };

    const renderReceivedShareCard = (share) => {
        return (
            <View style={styles.shareCard} key={share.id}>
                <View style={styles.shareHeader}>
                    <Image
                        source={
                            share.senderPhoto
                                ? { uri: share.senderPhoto }
                                : { uri: `https://ui-avatars.com/api/?name=${share.senderName}&background=random` }
                        }
                        style={styles.friendAvatar}
                    />
                    <View style={styles.shareInfo}>
                        <Text style={styles.friendName}>{share.senderName}</Text>
                        {share.senderUsername && (
                            <Text style={styles.username}>@{share.senderUsername}</Text>
                        )}
                    </View>
                    <TouchableOpacity
                        style={styles.viewLocationButton}
                        onPress={() => navigation.navigate('LocationDetail', { share })}
                    >
                        <MaterialIcons name="map" size={24} color="#4CAF50" />
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
        );
    };

    // Arkadaş seçimi için yardımcı fonksiyon
    const handleFriendSelect = (friendId) => {
        setSelectedFriends(prev => {
            if (prev.includes(friendId)) {
                return prev.filter(id => id !== friendId);
            }
            return [friendId]; // Tek arkadaş seçimi için
        });
    };

    // Component unmount olduğunda tüm konum takiplerini temizle
    useEffect(() => {
        return () => {
            Object.values(locationSubscriptions).forEach(subscription => {
                if (subscription) subscription.remove();
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
                                <Image
                                    source={request.profilePicture
                                        ? { uri: request.profilePicture }
                                        : { uri: `https://ui-avatars.com/api/?name=${request.name}&background=random` }
                                    }
                                    style={styles.requestImage}
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
                                <Image
                                    source={
                                        request.profilePicture
                                            ? { uri: request.profilePicture }
                                            : { uri: `https://ui-avatars.com/api/?name=${encodeURIComponent(request.name)}&background=random` }
                                    }
                                    style={styles.requestImage}
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

                {/* Arkadaş Ekleme Seçenekleri */}
                <View style={styles.addFriendsSection}>
                    <Text style={styles.sectionTitle}>Arkadaş Ekle</Text>

                    {/* QR Kod ile Ekle */}
                    <TouchableOpacity
                        style={styles.addOptionCard}
                        onPress={() => navigation.navigate('QRCode')}
                    >
                        <View style={styles.addOptionIcon}>
                            <Ionicons name="qr-code" size={24} color="#4CAF50" />
                        </View>
                        <View style={styles.addOptionInfo}>
                            <Text style={styles.addOptionTitle}>QR Kod ile Ekle</Text>
                            <Text style={styles.addOptionDescription}>
                                QR kodunu tarayarak hızlıca arkadaş ekle
                            </Text>
                        </View>
                        <Ionicons name="chevron-forward" size={24} color="#666" />
                    </TouchableOpacity>

                    {/* Kişilerden Bul */}
                    <TouchableOpacity
                        style={styles.addOptionCard}
                        onPress={() => navigation.navigate('Contacts')}
                    >
                        <View style={styles.addOptionIcon}>
                            <Ionicons name="people" size={24} color="#2196F3" />
                        </View>
                        <View style={styles.addOptionInfo}>
                            <Text style={styles.addOptionTitle}>Kişilerden Bul</Text>
                            <Text style={styles.addOptionDescription}>
                                Rehberindeki arkadaşlarını bul
                            </Text>
                        </View>
                        <Ionicons name="chevron-forward" size={24} color="#666" />
                    </TouchableOpacity>

                    {/* Yakındakileri Bul */}
                    <TouchableOpacity
                        style={styles.addOptionCard}
                        onPress={() => navigation.navigate('NearbyFriends')}
                    >
                        <View style={styles.addOptionIcon}>
                            <Ionicons name="location" size={24} color="#FF9800" />
                        </View>
                        <View style={styles.addOptionInfo}>
                            <Text style={styles.addOptionTitle}>Yakındakileri Bul</Text>
                            <Text style={styles.addOptionDescription}>
                                Yakınındaki kullanıcıları keşfet
                            </Text>
                        </View>
                        <Ionicons name="chevron-forward" size={24} color="#666" />
                    </TouchableOpacity>
                </View>
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
                            {shares.length > 0 && renderActiveShares()}
                            <Text style={styles.tipText}>
                                İpucu: Arkadaşı çıkarmak için kartın üzerine uzun basın
                            </Text>
                        </>
                    }
                    contentContainerStyle={styles.friendsListContainer}
                    showsVerticalScrollIndicator={false}
                />
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
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
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
        backgroundColor: '#FFF',
    },
    backButton: {
        padding: 8,
        marginRight: 8,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#2C3E50',
        flex: 1,
    },
    headerTitleWithBack: {
        fontSize: 20,
        textAlign: 'center',
        marginRight: 48, // Sağ tarafta boşluk bırakarak ortalamak için
    },
    headerActions: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    headerButton: {
        padding: 8,
        marginLeft: 16,
        position: 'relative',
    },
    badge: {
        position: 'absolute',
        top: 0,
        right: 0,
        backgroundColor: '#FF3B30',
        borderRadius: 10,
        minWidth: 20,
        height: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    badgeText: {
        color: '#FFF',
        fontSize: 12,
        fontWeight: 'bold',
    },
    content: {
        flex: 1,
    },
    friendsListContainer: {
        padding: 16,
        paddingBottom: 100, // Alt kısımda ekstra boşluk
    },
    listContainer: {
        flexGrow: 1, // İçeriğin tam görünmesi için
    },
    friendCard: {
        backgroundColor: '#FFF',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 5,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    friendMainInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    profileImage: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#F0F0F0',
    },
    friendInfo: {
        marginLeft: 16,
        flex: 1,
    },
    friendName: {
        fontSize: 18,
        fontWeight: '600',
        color: '#2C3E50',
        marginBottom: 4,
    },
    activeShareContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#E8F5E9',
        paddingVertical: 4,
        paddingHorizontal: 8,
        borderRadius: 8,
        alignSelf: 'flex-start',
    },
    activeShareText: {
        fontSize: 12,
        color: '#4CAF50',
        marginLeft: 4,
        fontWeight: '500',
    },
    actionButtons: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    actionButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 3,
    },
    messageButton: {
        backgroundColor: '#2196F3',
    },
    locationButton: {
        backgroundColor: '#4CAF50',
    },
    videoButton: {
        backgroundColor: '#9C27B0',
    },
    searchSection: {
        flex: 1,
        padding: 16,
        backgroundColor: '#FFF',
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F5F6FA',
        paddingHorizontal: 16,
        borderRadius: 12,
        marginBottom: 16,
    },
    searchInput: {
        flex: 1,
        paddingVertical: 12,
        marginLeft: 8,
        fontSize: 16,
        color: '#2C3E50',
    },
    searchResultCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF',
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    searchResultImage: {
        width: 48,
        height: 48,
        borderRadius: 24,
    },
    searchResultInfo: {
        flex: 1,
        marginLeft: 16,
    },
    searchResultName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#2C3E50',
        marginBottom: 4,
    },
    searchResultEmail: {
        fontSize: 14,
        color: '#666',
    },
    searchActionButton: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 8,
        minWidth: 110,
        alignItems: 'center',
        justifyContent: 'center',
    },
    searchActionButtonText: {
        color: '#FFF',
        fontSize: 14,
        fontWeight: '600',
    },
    loader: {
        marginTop: 16,
    },
    requestsContainer: {
        flex: 1,
        backgroundColor: '#FFF',
    },
    requestsContentContainer: {
        padding: 16,
    },
    requestsSection: {
        marginBottom: 24,
    },
    requestCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF',
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    requestImage: {
        width: 56,
        height: 56,
        borderRadius: 28,
    },
    requestInfo: {
        flex: 1,
        marginLeft: 16,
    },
    requestName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#2C3E50',
        marginBottom: 8,
    },
    requestButtons: {
        flexDirection: 'row',
        gap: 8,
    },
    requestButton: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 8,
    },
    emptyRequestsContainer: {
        alignItems: 'center',
        padding: 32,
        backgroundColor: '#FFF',
        borderRadius: 12,
    },
    emptyRequestsText: {
        fontSize: 16,
        color: '#666',
        marginTop: 12,
        textAlign: 'center',
    },
    sharingOptionsContainer: {
        padding: 16,
        backgroundColor: '#FFF',
        marginHorizontal: 16,
        marginTop: 16,
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#2C3E50',
        marginBottom: 12,
    },
    friendChips: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginBottom: 16,
    },
    friendChip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F5F6FA',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        marginRight: 8,
        marginBottom: 8,
    },
    selectedChip: {
        backgroundColor: '#E8F5E9',
        borderColor: '#4CAF50',
        borderWidth: 1,
    },
    chipImage: {
        width: 24,
        height: 24,
        borderRadius: 12,
        marginRight: 8,
    },
    chipText: {
        color: '#2C3E50',
        fontSize: 14,
    },
    sharingButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    sharingButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 12,
        borderRadius: 12,
        marginHorizontal: 4,
    },
    instantShareButton: {
        backgroundColor: '#4CAF50',
    },
    liveShareButton: {
        backgroundColor: '#2196F3',
    },
    sharingButtonText: {
        color: '#FFF',
        fontWeight: '600',
        marginLeft: 8,
    },
    activeSharesSection: {
        padding: 16,
        backgroundColor: '#FFF',
        marginHorizontal: 16,
        marginTop: 16,
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    shareCard: {
        backgroundColor: '#FFF',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    shareHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    friendAvatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
    },
    shareInfo: {
        flex: 1,
        marginLeft: 12,
    },
    username: {
        fontSize: 14,
        color: '#7F8C8D',
    },
    shareDetails: {
        marginTop: 8,
    },
    shareTypeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    shareTypeText: {
        marginLeft: 4,
        fontSize: 14,
        fontWeight: '500',
    },
    locationInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    locationText: {
        marginLeft: 4,
        fontSize: 14,
        color: '#666',
    },
    timeInfo: {
        marginTop: 8,
    },
    timeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    timeText: {
        marginLeft: 8,
        fontSize: 12,
        color: '#666',
    },
    stopShareButton: {
        padding: 8,
    },
    sharesContainer: {
        flex: 1,
    },
    sharesContentContainer: {
        padding: 16,
        paddingBottom: 100, // Alt kısımda ekstra boşluk
    },
    sharesSection: {
        marginBottom: 24,
    },
    quickShareSection: {
        marginBottom: 24, // Alt kısımda ek boşluk
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 32,
    },
    emptyText: {
        fontSize: 16,
        color: '#666',
    },
    shareName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#2C3E50',
    },
    shareType: {
        fontSize: 14,
        color: '#7F8C8D',
    },
    emptyState: {
        alignItems: 'center',
        padding: 24,
    },
    emptyStateText: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
    },
    emptySharesContainer: {
        alignItems: 'center',
        padding: 32,
        backgroundColor: '#FFF',
        borderRadius: 12,
        marginHorizontal: 16,
        marginTop: 8,
    },
    emptySharesText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#2C3E50',
        marginTop: 12,
    },
    emptySharesSubText: {
        fontSize: 14,
        color: '#666',
        marginTop: 4,
        textAlign: 'center',
    },
    quickShareCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF',
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 3.84,
        elevation: 3,
    },
    quickShareIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    quickShareInfo: {
        flex: 1,
    },
    quickShareTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#2C3E50',
        marginBottom: 4,
    },
    quickShareDescription: {
        fontSize: 13,
        color: '#666',
    },
    friendSelectContainer: {
        marginVertical: 16,
    },
    subsectionTitle: {
        fontSize: 16,
        fontWeight: '500',
        color: '#666',
        marginBottom: 12,
    },
    friendSelectItem: {
        alignItems: 'center',
        marginRight: 16,
        opacity: 0.7,
    },
    selectedFriendItem: {
        opacity: 1,
    },
    friendSelectImage: {
        width: 56,
        height: 56,
        borderRadius: 28,
        marginBottom: 8,
        borderWidth: 2,
        borderColor: 'transparent',
    },
    friendSelectName: {
        fontSize: 14,
        color: '#2C3E50',
        textAlign: 'center',
    },
    shareOptionsContainer: {
        marginTop: 16,
    },
    shareOption: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
    },
    shareOptionInfo: {
        marginLeft: 16,
    },
    shareOptionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#2C3E50',
    },
    shareOptionDescription: {
        fontSize: 14,
        color: '#666',
        marginTop: 4,
    },
    sharesSection: {
        marginBottom: 24,
    },
    shareTypeSection: {
        marginBottom: 16,
    },
    shareTypeTitle: {
        fontSize: 16,
        fontWeight: '500',
        color: '#666',
        marginBottom: 12,
        marginTop: 16,
    },
    viewLocationButton: {
        padding: 8,
    },
    noSharesText: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        marginTop: 12,
    },
    addFriendsSection: {
        marginTop: 24,
    },
    addOptionCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF',
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    addOptionIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#F5F6FA',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    addOptionInfo: {
        flex: 1,
    },
    addOptionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#2C3E50',
        marginBottom: 4,
    },
    addOptionDescription: {
        fontSize: 14,
        color: '#666',
    },
    tipText: {
        fontSize: 13,
        color: '#666',
        fontStyle: 'italic',
        textAlign: 'center',
        marginTop: 8,
        marginBottom: 16,
    },
    cancelButton: {
        backgroundColor: '#FFF',
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#FF3B30',
    },
    cancelButtonText: {
        color: '#FF3B30',
        fontSize: 14,
        fontWeight: '600',
    },
    requestUsername: {
        fontSize: 14,
        color: '#666',
        marginBottom: 8,
    },
    welcomeText: {
        fontSize: 24,
        fontWeight: '600',
        color: '#666666', // Daha soluk bir gri renk
        marginBottom: 20,
        textAlign: 'center',
    },
    tabContent: {
        flex: 1,
    },
    friendsList: {
        padding: 16,
    },
});

export default FriendsPage;