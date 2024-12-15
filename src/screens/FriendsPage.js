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
    ActivityIndicator,
    ScrollView
} from 'react-native';
import {
    searchUsers,
    sendFriendRequest,
    getFriendRequests,
    acceptFriendRequest,
    rejectFriendRequest,
    getCurrentUserUid,
} from '../services/friendFunctions';
import FriendRequestModal from '../modals/FriendRequestModal';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { Ionicons } from '@expo/vector-icons';
import {
    shareLocation,
    getCurrentLocation,
    shareLiveLocation,
    getShares,
    stopShare,
    deleteShare,
} from '../helpers/firebaseHelpers';
import Toast from 'react-native-toast-message';

const showToast = (type, text1, text2) => {
    Toast.show({
        type: type,
        text1: text1,
        text2: text2
    });
};

const FriendsPage = () => {
    const [currentUserId, setCurrentUserId] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [requestStatus, setRequestStatus] = useState({});
    const [friendRequests, setFriendRequests] = useState([]);
    const [friends, setFriends] = useState([]);
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [activeTab, setActiveTab] = useState('Arkadaşlar');
    const [selectedFriends, setSelectedFriends] = useState([]);
    const [shares, setShares] = useState([]);

    useEffect(() => {
        const fetchCurrentUserUid = async () => {
            try {
                const uid = await getCurrentUserUid();
                setCurrentUserId(uid);
                fetchFriends(uid);
            } catch (error) {
                console.error('Kullanıcı UID alma hatası:', error);
            }
        };

        fetchCurrentUserUid();
    }, []);

    useEffect(() => {
        const fetchFriendRequests = async () => {
            try {
                const requests = await getFriendRequests();
                setFriendRequests(requests);
            } catch (error) {
                console.error('Arkadaşlık isteklerini alma hatası:', error);
            }
        };

        fetchFriendRequests();
    }, []);

    useEffect(() => {
        if (activeTab === 'Paylaşımlar') {
            fetchShares();
        }
    }, [activeTab]);

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
                                    name: friendData.informations.name,
                                    profilePicture: friendData.profilePicture || null,
                                };
                            }
                            return { id: friendId, name: 'Bilinmeyen Kullanıcı', profilePicture: null };
                        })
                    );
                    setFriends(friendsData);
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

    const handleSearchChange = async (text) => {
        setSearchQuery(text);

        if (text.trim() === '') {
            setSearchResults([]);
            return;
        }

        setLoading(true);
        try {
            const users = await searchUsers(text.trim().toLowerCase());
            setSearchResults(users);
        } catch (error) {
            console.error('Arama hatası:', error);
            showToast('error', 'Hata', 'Arama yapılırken bir sorun oluştu.');
        } finally {
            setLoading(false);
        }
    };

    const handleSendFriendRequest = async (friendId) => {
        try {
            const response = await sendFriendRequest(friendId);
            if (response.success) {
                showToast('success', 'Başarılı', response.message);
            } else {
                showToast('error', 'Hata', response.message);
            }
        } catch (error) {
            console.error('Arkadaşlık isteği gönderme hatası:', error);
            showToast('error', 'Hata', 'Arkadaşlık isteği gönderilirken bir sorun oluştu.');
        }
    };

    const getButtonText = (friendId) => {
        if (friends.some((friend) => friend.id === friendId)) {
            return 'Arkadaşınız';
        } else if (requestStatus[friendId] === 'İstek Gönderildi') {
            return 'İstek Gönderildi';
        } else if (requestStatus[friendId] === 'Reddedildi') {
            return 'Ekle';
        } else {
            return 'Ekle';
        }
    };

    const TabButton = ({ title }) => (
        <TouchableOpacity
            style={[styles.tabButton, activeTab === title && styles.activeTabButton]}
            onPress={() => setActiveTab(title)}
        >
            <Text style={activeTab === title ? styles.activeTabText : styles.tabText}>
                {title}
            </Text>
        </TouchableOpacity>
    );

    const handleStartSharing = async () => {
        if (selectedFriends.length === 0) {
            showToast('error', 'Hata', 'Lütfen en az bir arkadaş seçin.');
            return;
        }

        try {
            const location = await getCurrentLocation();

            await Promise.all(
                selectedFriends.map((friendId) =>
                    shareLocation(currentUserId, friendId, location)
                )
            );

            showToast('success', 'Başarılı', 'Konum paylaşımı başlatıldı.');
        } catch (error) {
            console.error('Konum paylaşımı başlatılırken hata oluştu:', error);
            showToast('error', 'Hata', 'Konum paylaşımı başlatılırken bir sorun oluştu.');
        }
    };

    const handleShareLiveLocation = async () => {
        if (selectedFriends.length === 0) {
            showToast('error', 'Hata', 'Lütfen en az bir arkadaş seçin.');
            return;
        }

        try {
            await Promise.all(
                selectedFriends.map((friendId) =>
                    shareLiveLocation(currentUserId, friendId)
                )
            );

            showToast('success', 'Başarılı', 'Canlı konum paylaşımı başlatıldı.');
        } catch (error) {
            console.error('Canlı konum paylaşımı başlatılırken hata oluştu:', error);
            showToast('error', 'Hata', 'Canlı konum paylaşımı başlatılırken bir sorun oluştu.');
        }
    };

    const fetchShares = async () => {
        try {
            const sharesData = await getShares(currentUserId);
            setShares(sharesData);
        } catch (error) {
            console.error('Paylaşımları alma hatası:', error);
        }
    };

    const handleStopShare = async (shareId, shareType) => {
        try {
            const response = await stopShare(shareId, currentUserId, shareType);
            if (response.success) {
                showToast('success', 'Başarılı', 'Paylaşım durduruldu.');
                fetchShares();
            } else {
                showToast('error', 'Hata', response.message);
            }
        } catch (error) {
            console.error('Paylaşımı durdurma hatası:', error);
        }
    };

    const handleDeleteShare = async (shareId, shareType) => {
        try {
            const response = await deleteShare(shareId, currentUserId, shareType);
            if (response.success) {
                showToast('success', 'Başarılı', 'Paylaşım silindi.');
                fetchShares();
            } else {
                showToast('error', 'Hata', response.message);
            }
        } catch (error) {
            console.error('Paylaşımı silme hatası:', error);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <Text style={styles.header}>Arkadaşlar</Text>
            <View style={styles.tabContainer}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <TabButton title="Arkadaşlar" />
                    <TabButton title="İstekler" />
                    <TabButton title="Kullanıcı Ara" />
                    <TabButton title="Konum Paylaşımı" />
                    <TabButton title="Canlı Konum Paylaşımı" />
                    <TabButton title="Paylaşımlar" />
                    {/* Daha fazla sekme eklemek isterseniz buraya ekleyebilirsiniz */}
                </ScrollView>
            </View>

            {activeTab === 'Arkadaşlar' && (
                <>
                    <Text style={styles.sectionHeader}>Arkadaşlar</Text>
                    <FlatList
                        data={friends}
                        keyExtractor={(item) => item.id}
                        renderItem={({ item }) => (
                            <View style={styles.friendCard}>
                                <Image
                                    source={item.profilePicture ? { uri: item.profilePicture }
                                        : { uri: `https://ui-avatars.com/api/?name=${item.name.slice(0, 2)}&background=4CAF50&color=fff&size=128` }}
                                    style={styles.profileImage}
                                />
                                <View style={styles.friendDetails}>
                                    <Text style={styles.friendName}>{item.name}</Text>
                                </View>
                            </View>
                        )}
                    />
                </>
            )}
            {activeTab === 'İstekler' && (
                <>
                    <Text style={styles.sectionHeader}>Gelen Arkadaşlık İstekleri</Text>
                    {friendRequests.length > 0 ? (
                        friendRequests.map((request) => (
                            <TouchableOpacity
                                key={request.id}
                                style={styles.requestCard}
                                onPress={() => {
                                    setSelectedRequest({ id: request.id, senderName: request.name });
                                    setModalVisible(true)
                                }}
                            >
                                <View style={styles.requestCardContent}>
                                    <Image
                                        source={request.profilePicture ? { uri: request.profilePicture }
                                            : { uri: `https://ui-avatars.com/api/?name=${request.name.slice(0, 2)}&background=4CAF50&color=fff&size=128` }}
                                        style={styles.profileImage}
                                    />
                                    <Text style={styles.requestText}>{request.name}</Text>
                                </View>
                                <TouchableOpacity
                                    style={styles.viewDetailsButton}
                                    onPress={() => {
                                        setSelectedRequest({ id: request.id, senderName: request.name });
                                        setModalVisible(true);
                                    }}
                                >
                                    <Text style={styles.viewDetailsButtonText}>Detayları Gör</Text>
                                </TouchableOpacity>
                            </TouchableOpacity>
                        ))
                    ) : (
                        <Text style={styles.noRequests}>Bekleyen arkadaşlık isteğiniz yok.</Text>
                    )}
                </>
            )}
            {activeTab === 'Kullanıcı Ara' && (
                <>
                    <TextInput
                        style={styles.searchBar}
                        placeholder="Kullanıcı Ara"
                        value={searchQuery}
                        onChangeText={handleSearchChange}
                    />
                    {loading ? (
                        <ActivityIndicator size="large" color="#4CAF50" />
                    ) : (
                        <FlatList
                            data={searchResults}
                            renderItem={({ item }) => (
                                <View style={styles.friendCard}>
                                    <Image
                                        source={item.profilePicture ? { uri: item.profilePicture }
                                            : { uri: `https://ui-avatars.com/api/?name=${item.informations.name.slice(0, 2)}&background=4CAF50&color=fff&size=128` }}
                                        style={styles.profileImage}
                                    />
                                    <View style={styles.friendDetails}>
                                        <Text style={styles.friendName}>{item.informations.name}</Text>
                                        <Text style={styles.friendEmail}>{item.informations.email}</Text>
                                    </View>
                                    <TouchableOpacity
                                        style={styles.addButton}
                                        onPress={() => handleSendFriendRequest(item.id)}
                                        disabled={friends.some((friend) => friend.id === item.id)}
                                    >
                                        <Text style={styles.addButtonText}>
                                            {getButtonText(item.id)}
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            )}
                            keyExtractor={(item) => item.id}
                        />
                    )}
                </>
            )}

            {activeTab === 'Konum Paylaşımı' && (
                <>
                    <Text style={styles.sectionHeader}>Anlık Konum Paylaşımı</Text>
                    <FlatList
                        data={friends}
                        keyExtractor={(item) => item.id}
                        renderItem={({ item }) => (
                            <View style={styles.friendCard}>
                                <Image
                                    source={item.profilePicture ? { uri: item.profilePicture }
                                        : { uri: `https://ui-avatars.com/api/?name=${item.name.slice(0, 2)}&background=4CAF50&color=fff&size=128` }}
                                    style={styles.profileImage}
                                />
                                <View style={styles.friendDetails}>
                                    <Text style={styles.friendName}>{item.name}</Text>
                                </View>
                                <TouchableOpacity
                                    style={[styles.checkbox, selectedFriends.includes(item.id) && styles.checkedCheckbox]}
                                    onPress={() => {
                                        if (selectedFriends.includes(item.id)) {
                                            setSelectedFriends(selectedFriends.filter((id) => id !== item.id));
                                        } else {
                                            setSelectedFriends([...selectedFriends, item.id]);
                                        }
                                    }}
                                >
                                    {selectedFriends.includes(item.id) && (
                                        <Ionicons name="checkmark" size={20} color="#fff" />
                                    )}
                                </TouchableOpacity>
                            </View>
                        )}
                    />
                    <TouchableOpacity
                        style={styles.startSharingButton}
                        onPress={handleStartSharing}
                    >
                        <Text style={styles.startSharingButtonText}>Paylaşımı Başlat</Text>
                    </TouchableOpacity>
                </>
            )}

            {activeTab === 'Canlı Konum Paylaşımı' && (
                <>
                    <Text style={styles.sectionHeader}>Canlı Konum Paylaşımı</Text>
                    <FlatList
                        data={friends}
                        keyExtractor={(item) => item.id}
                        renderItem={({ item }) => (
                            <View style={styles.friendCard}>
                                <Image
                                    source={item.profilePicture ? { uri: item.profilePicture }
                                        : { uri: `https://ui-avatars.com/api/?name=${item.name.slice(0, 2)}&background=4CAF50&color=fff&size=128` }}
                                    style={styles.profileImage}
                                />
                                <View style={styles.friendDetails}>
                                    <Text style={styles.friendName}>{item.name}</Text>
                                </View>
                                <TouchableOpacity
                                    style={[styles.checkbox, selectedFriends.includes(item.id) && styles.checkedCheckbox]}
                                    onPress={() => {
                                        if (selectedFriends.includes(item.id)) {
                                            setSelectedFriends(selectedFriends.filter((id) => id !== item.id));
                                        } else {
                                            setSelectedFriends([...selectedFriends, item.id]);
                                        }
                                    }}
                                >
                                    {selectedFriends.includes(item.id) && (
                                        <Ionicons name="checkmark" size={20} color="#fff" />
                                    )}
                                </TouchableOpacity>
                            </View>
                        )}
                    />
                    <TouchableOpacity
                        style={styles.startSharingButton}
                        onPress={handleShareLiveLocation}
                    >
                        <Text style={styles.startSharingButtonText}>Paylaşımı Başlat</Text>
                    </TouchableOpacity>
                </>
            )}

            {activeTab === 'Paylaşımlar' && (
                <>
                    <Text style={styles.sectionHeader}>Paylaşımlar</Text>
                    <FlatList
                        data={shares}
                        keyExtractor={(item) => item.id + (item.shareType === 'live' ? '_live' : '_current')}
                        renderItem={({ item }) => (
                            <View style={styles.shareCard}>
                                <Text style={styles.shareText}>{item.name}</Text>
                                <Text style={styles.shareTypeText}>
                                    {item.shareType === 'live' ? 'Canlı Konum' : 'Anlık Konum'}
                                </Text>
                                <View style={styles.shareActions}>
                                    <TouchableOpacity
                                        style={styles.stopButton}
                                        onPress={() => handleStopShare(item.id, item.shareType)}
                                    >
                                        <Text style={styles.stopButtonText}>Durdur</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={styles.deleteButton}
                                        onPress={() => handleDeleteShare(item.id, item.shareType)}
                                    >
                                        <Text style={styles.deleteButtonText}>Sil</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        )}
                        ListEmptyComponent={() => (
                            <View style={styles.emptyContainer}>
                                <Text style={styles.emptyText}>Henüz paylaşım yok.</Text>
                            </View>
                        )}
                    />
                </>
            )}

            {modalVisible && (
                <FriendRequestModal
                    visible={modalVisible}
                    onClose={() => setModalVisible(false)}
                    request={selectedRequest}
                    onAccept={handleAccept}
                    onReject={handleReject}
                />
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        paddingHorizontal: 16,
        paddingTop: 16,
    },
    header: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#4CAF50',
        marginBottom: 16,
    },
    tabContainer: {
        flexDirection: 'row',
        marginBottom: 16,
        paddingVertical: 8, // Yukarıdan ve aşağıdan boşluk
    },
    tabButton: {
        flex: 1,
        padding: 10,
        backgroundColor: '#f0f0f0',
        borderRadius: 5,
        margin: 5,
        alignItems: 'center',
    },
    activeTabButton: {
        backgroundColor: '#4CAF50',
    },
    tabText: {
        fontSize: 16,
        color: '#000',
    },
    activeTabText: {
        color: '#fff',
    },
    sectionHeader: {
        fontSize: 18,
        fontWeight: 'bold',
        marginVertical: 8,
    },
    friendCard: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
        backgroundColor: '#f9f9f9',
        padding: 16,
        borderRadius: 8,
        elevation: 2,
    },
    friendDetails: {
        marginLeft: 16,
        flex: 1,
    },
    profileImage: {
        width: 48,
        height: 48,
        borderRadius: 24,
    },
    friendName: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    friendEmail: {
        fontSize: 14,
        color: '#777',
    },
    addButton: {
        backgroundColor: '#4CAF50',
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 5,
    },
    addButtonText: {
        color: '#fff',
        fontSize: 14,
    },
    requestCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        backgroundColor: '#f9f9f9',
        padding: 16,
        borderRadius: 8,
        marginBottom: 16,
        elevation: 2,
    },
    requestCardContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    requestText: {
        fontSize: 16,
        fontWeight: 'bold',
        marginLeft: 16,
    },
    viewDetailsButton: {
        backgroundColor: '#4CAF50',
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 5,
    },
    viewDetailsButtonText: {
        color: '#fff',
        fontSize: 12,
        textAlign: 'center',  // Yazıyı ortalamak için eklendi
        lineHeight: 25,  // Yüksekliği ortalamak için eklendi
    },
    noRequests: {
        fontSize: 16,
        color: '#777',
    },
    searchBar: {
        width: '80%',  // Genişliği istediğiniz gibi ayarlayabilirsiniz
        height: 40,
        paddingHorizontal: 20,  // Yanlardan boşluk
        borderRadius: 25,
        backgroundColor: '#f1f1f1',  // Açık gri arka plan
        borderWidth: 1,
        borderColor: '#ccc',
        fontSize: 16,
        color: '#333',
        marginVertical: 10,
        alignItems: 'center',
        marginLeft: 40,  // Arama çubuğunu sağa kaydırmak için
    },
    checkbox: {
        width: 24,
        height: 24,
        borderWidth: 2,
        borderColor: '#4CAF50',
        borderRadius: 4,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    checkedCheckbox: {
        backgroundColor: '#4CAF50',
    },
    startSharingButton: {
        backgroundColor: '#4CAF50',
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 5,
        alignSelf: 'center',
        marginTop: 16,
    },
    startSharingButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    shareCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        backgroundColor: '#f9f9f9',
        padding: 16,
        borderRadius: 8,
        marginBottom: 16,
        elevation: 2,
    },
    shareText: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    shareActions: {
        flexDirection: 'row',
    },
    stopButton: {
        backgroundColor: '#FFA500',
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 5,
        marginRight: 8,
    },
    stopButtonText: {
        color: '#fff',
        fontSize: 14,
    },
    deleteButton: {
        backgroundColor: '#FF0000',
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 5,
    },
    deleteButtonText: {
        color: '#fff',
        fontSize: 14,
    },
    shareTypeText: {
        fontSize: 14,
        color: '#777',
        marginTop: 4,
    },
    emptyContainer: {
        flex: 1,
    },
    emptyText: {
        fontSize: 16,
        color: '#777',
    },
});

export default FriendsPage;