import { collection, query, where, getDocs, doc, setDoc, getDoc, updateDoc, arrayUnion, arrayRemove, deleteDoc, onSnapshot, addDoc, serverTimestamp, writeBatch } from 'firebase/firestore';
import { db } from '../../firebaseConfig'; // Firebase ayar dosyasını buraya ekle
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { Alert } from 'react-native';
import * as Location from 'expo-location';
import { getDatabase, ref, set, onValue } from 'firebase/database';
import { getFriendDetails } from '../helpers/friendHelpers';

/**
 * Kullanıcıları ada göre arar.
 * @param {string} searchQuery - Arama yapılacak kullanıcı adı.
 * @returns {Promise<Array>} - Bulunan kullanıcıların listesi.
 */
export const searchUsers = async (searchQuery) => {
    try {
        const usersRef = collection(db, 'users');

        // Tüm kullanıcıları çek
        const querySnapshot = await getDocs(usersRef);

        // JavaScript tarafında filtreleme yap
        const users = querySnapshot.docs
            .map(doc => ({
                id: doc.id,
                ...doc.data(),
            }))
            .filter(user =>
                user.informations?.name
                    ?.toLowerCase()
                    .includes(searchQuery.toLowerCase())
            );
        return users;
    } catch (error) {
        console.error('Kullanıcı arama hatası:', error);
        throw error;
    }
};

/**
 * Giriş yapan kullanıcının UID'sini alır.
 * @returns {Promise<string | null>} - Kullanıcı UID'si veya null.
 */
export const getCurrentUserUid = () => {
    return new Promise((resolve, reject) => {
        const auth = getAuth();
        onAuthStateChanged(auth, (user) => {
            if (user) {
                resolve(user.uid);
            } else {
                resolve(null);
            }
        }, reject);
    });
};

/**
 * Arkadaşlık isteği gönderir.
 * @param {string} friendId - İstek gönderilecek arkadaşın UID'si.
 * @returns {Promise<Object>} - İşlem sonucu.
 */
export const sendFriendRequest = async (friendId) => {
    try {
        const currentUserId = await getCurrentUserUid();
        if (!currentUserId) {
            throw new Error('Giriş yapan kullanıcı bulunamadı.');
        }

        // Kullanıcı referanslarını oluştur
        const currentUserRef = doc(db, 'users', currentUserId);
        const friendUserRef = doc(db, 'users', friendId);

        // Kullanıcı belgelerini getir
        const currentUserSnapshot = await getDoc(currentUserRef);
        const friendUserSnapshot = await getDoc(friendUserRef);

        if (!currentUserSnapshot.exists() || !friendUserSnapshot.exists()) {
            throw new Error('Kullanıcı belgeleri bulunamadı.');
        }

        const currentUserData = currentUserSnapshot.data();
        const friendUserData = friendUserSnapshot.data();

        // Eğer friendRequests alanı eksikse varsayılan bir değer ayarla
        if (!currentUserData.friendRequests) {
            currentUserData.friendRequests = { sent: [], received: [] };
        }

        if (!friendUserData.friendRequests) {
            friendUserData.friendRequests = { sent: [], received: [] };
        }

        // Kullanıcı kendini arkadaş olarak ekleyemez 
        if (currentUserId === friendId) {
            return { success: false, message: 'Kendinize arkadaşlık isteği gönderemezsiniz.' };
        }

        // Zaten arkadaş olma durumu
        if (currentUserData.friends && currentUserData.friends.includes(friendId)) {
            return { success: false, message: 'Bu kullanıcı zaten arkadaşınız.' };
        }

        // Zaten gönderilmiş istek durumu
        if (currentUserData.friendRequests.sent.includes(friendId)) {
            return { success: false, message: 'Bu kullanıcıya zaten arkadaşlık isteği gönderdiniz.' };
        }

        // Zaten alınmış istek durumu
        if (currentUserData.friendRequests.received.includes(friendId)) {
            return { success: false, message: 'Bu kullanıcıdan zaten arkadaşlık isteği aldınız.' };
        }

        // Arkadaşlık isteği gönder
        await updateDoc(friendUserRef, {
            'friendRequests.received': arrayUnion(currentUserId),
        });

        await updateDoc(currentUserRef, {
            'friendRequests.sent': arrayUnion(friendId),
        });

        return { success: true, message: 'Arkadaşlık isteği gönderildi.' };
    } catch (error) {
        console.error('Arkadaşlık isteği gönderme hatası:', error.message);
        console.error('Hata detayı:', error);
        throw error;
    }
};

/**
 * Arkadaşlık isteğini kabul eder.
 * @param {string} friendId - İstek kabul edilecek arkadaşın UID'si.
 * @returns {Promise<Object>} - İşlem sonucu.
 */
export const acceptFriendRequest = async (friendId) => {
    try {
        const currentUserId = await getCurrentUserUid();
        if (!currentUserId) {
            throw new Error('Giriş yapan kullanıcı bulunamadı.');
        }

        const currentUserRef = doc(db, 'users', currentUserId);
        const friendUserRef = doc(db, 'users', friendId);

        // Kullanıcı belgelerini getir
        const currentUserSnapshot = await getDoc(currentUserRef);
        const friendUserSnapshot = await getDoc(friendUserRef);

        if (!currentUserSnapshot.exists() || !friendUserSnapshot.exists()) {
            throw new Error('Kullanıcı belgeleri bulunamadı.');
        }

        const currentUserData = currentUserSnapshot.data();

        // Sadece kendisine gönderilen istekleri kabul edebilir
        if (!currentUserData.friendRequests.received.includes(friendId)) {
            Alert.alert('Hata', 'Bu kullanıcıdan arkadaşlık isteği almadınız.');
            return { success: false, message: 'Bu kullanıcıdan arkadaşlık isteği almadınız.' };
        }

        // Arkadaş ilişkisini iki yönlü olarak kaydet
        await updateDoc(currentUserRef, {
            'friends': arrayUnion(friendId),
            'friendRequests.received': arrayRemove(friendId),
        });

        await updateDoc(friendUserRef, {
            'friends': arrayUnion(currentUserId),
            'friendRequests.sent': arrayRemove(currentUserId),
        });

        return { success: true, message: 'Arkadaşlık isteği kabul edildi.' };
    } catch (error) {
        console.error('Arkadaşlık isteği kabul etme hatası:', error);
        throw error;
    }
};

/**
 * Arkadaşlık isteğini reddeder.
 * @param {string} friendId - İstek reddedilecek arkadaşın UID'si.
 * @returns {Promise<Object>} - İşlem sonucu.
 */
export const rejectFriendRequest = async (friendId) => {
    try {
        const currentUserId = await getCurrentUserUid();
        if (!currentUserId) {
            throw new Error('Giriş yapan kullanıcı bulunamadı.');
        }

        const currentUserRef = doc(db, 'users', currentUserId);
        const friendUserRef = doc(db, 'users', friendId);

        // Kullanıcı belgelerini getir
        const currentUserSnapshot = await getDoc(currentUserRef);
        const friendUserSnapshot = await getDoc(friendUserRef);

        if (!currentUserSnapshot.exists() || !friendUserSnapshot.exists()) {
            throw new Error('Kullanıcı belgeleri bulunamadı.');
        }

        const currentUserData = currentUserSnapshot.data();

        // Sadece kendisine gönderilen istekleri reddedebilir
        if (!currentUserData.friendRequests.received.includes(friendId)) {
            Alert.alert('Hata', 'Bu kullanıcıdan arkadaşlık isteği almadınız.');
            return { success: false, message: 'Bu kullanıcıdan arkadaşlık isteği almadınız.' };
        }

        // Arkadaşlık isteğini reddet
        await updateDoc(currentUserRef, {
            'friendRequests.received': arrayRemove(friendId),
        });

        await updateDoc(friendUserRef, {
            'friendRequests.sent': arrayRemove(currentUserId),
        });

        return { success: true, message: 'Arkadaşlık isteği reddedildi.' };
    } catch (error) {
        console.error('Arkadaşlık isteği reddetme hatası:', error);
        throw error;
    }
};

// Bekleyen Arkadaşlık isteklerini alma
export const getFriendRequests = async () => {
    try {
        const currentUserId = await getCurrentUserUid();
        if (!currentUserId) throw new Error('Giriş yapan kullanıcı bulunamadı.');

        const userRef = doc(db, 'users', currentUserId);
        const userSnapshot = await getDoc(userRef);

        if (!userSnapshot.exists()) throw new Error('Kullanıcı belgesi bulunamadı.');

        const userData = userSnapshot.data();
        const receivedRequests = userData.friendRequests?.received || [];

        // Arkadaşlık isteklerini işlemeye başla
        const friendRequests = await Promise.all(
            receivedRequests.map(async (friendId) => {
                const friendRef = doc(db, 'users', friendId);
                const friendSnapshot = await getDoc(friendRef);

                if (friendSnapshot.exists()) {
                    const friendData = friendSnapshot.data();
                    return {
                        id: friendId,
                        name: friendData.informations.name || 'Bilinmeyen Kullanıcı',
                        profilePicture: friendData.profilePicture || null,
                    };
                }

                return {
                    id: friendId,
                    name: 'Bilinmeyen Kullanıcı',
                    profilePicture: null,
                };
            })
        );

        return friendRequests;
    } catch (error) {
        console.error('Arkadaşlık isteklerini alma hatası:', error);
        throw error;
    }
};

// Paylaşımları dinle ve arkadaş bilgilerini de getir
export const listenToShares = (userId, callback) => {
    const sharesRef = collection(db, 'shares');
    const sharesQuery = query(
        sharesRef,
        where('userId', '==', userId)
    );

    return onSnapshot(sharesQuery, async (snapshot) => {
        try {
            const sharesData = await Promise.all(
                snapshot.docs.map(async (doc) => {
                    const shareData = doc.data();
                    // Arkadaş bilgilerini getir
                    const friendDoc = await getDoc(doc(db, 'users', shareData.friendId));
                    const friendData = friendDoc.exists() ? friendDoc.data() : null;

                    return {
                        id: doc.id,
                        ...shareData,
                        startTime: shareData.startTime?.toDate(),
                        lastUpdate: shareData.lastUpdate?.toDate(),
                        friendName: friendData?.informations?.name || 'Bilinmeyen Kullanıcı',
                        friendProfilePicture: friendData?.profilePicture || null,
                    };
                })
            );
            callback(sharesData);
        } catch (error) {
            console.error('Paylaşım bilgileri alınırken hata:', error);
            callback([]);
        }
    });
};

// Paylaşımı durdur - güncellendi
export const stopShare = async (shareId) => {
    try {
        const shareRef = doc(db, 'shares', shareId);
        const shareDoc = await getDoc(shareRef);

        if (!shareDoc.exists()) {
            return {
                success: false,
                error: 'Paylaşım bulunamadı'
            };
        }

        await deleteDoc(shareRef);
        return {
            success: true,
            message: 'Paylaşım başarıyla durduruldu'
        };
    } catch (error) {
        console.error('Paylaşım durdurma hatası:', error);
        return {
            success: false,
            error: error.message || 'Paylaşım durdurulurken bir hata oluştu'
        };
    }
};

// Paylaşım başlat - güncellendi
export const shareLocation = async (userId, friendId, location) => {
    try {
        // Önce arkadaş bilgilerini kontrol et
        const friendDoc = await getDoc(doc(db, 'users', friendId));
        if (!friendDoc.exists()) {
            return {
                success: false,
                error: 'Arkadaş bulunamadı'
            };
        }

        const shareRef = await addDoc(collection(db, 'shares'), {
            userId,
            friendId,
            location,
            type: 'instant',
            startTime: serverTimestamp(),
            lastUpdate: serverTimestamp(),
            status: 'active'
        });

        return {
            success: true,
            shareId: shareRef.id,
            message: 'Konum paylaşımı başlatıldı'
        };
    } catch (error) {
        console.error('Konum paylaşım hatası:', error);
        return {
            success: false,
            error: error.message || 'Paylaşım başlatılırken bir hata oluştu'
        };
    }
};

// Canlı konum paylaşımı - güncellendi
export const shareLiveLocation = async (userId, friendId) => {
    try {
        // Önce arkadaş bilgilerini kontrol et
        const friendDoc = await getDoc(doc(db, 'users', friendId));
        if (!friendDoc.exists()) {
            return {
                success: false,
                error: 'Arkadaş bulunamadı'
            };
        }

        const shareRef = await addDoc(collection(db, 'shares'), {
            userId,
            friendId,
            type: 'live',
            startTime: serverTimestamp(),
            lastUpdate: serverTimestamp(),
            status: 'active',
            isActive: true
        });

        return {
            success: true,
            shareId: shareRef.id,
            message: 'Canlı konum paylaşımı başlatıldı'
        };
    } catch (error) {
        console.error('Canlı konum paylaşım hatası:', error);
        return {
            success: false,
            error: error.message || 'Paylaşım başlatılırken bir hata oluştu'
        };
    }
};

// Konum güncelleme (canlı konum için)
export const updateShareLocation = async (shareId, location) => {
    try {
        await updateDoc(doc(db, 'shares', shareId), {
            location,
            lastUpdate: serverTimestamp()
        });
        return { success: true };
    } catch (error) {
        console.error('Konum güncelleme hatası:', error);
        return { success: false, error: error.message };
    }
};

export const handleStartSharing = async (userId, friendId) => {
    try {
        // Konum izni kontrolü
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
            throw new Error('Konum izni reddedildi');
        }

        // Realtime Database referansı
        const db = getDatabase();
        const locationRef = ref(db, `locations/${userId}`);

        // Konum takibini başlat
        const locationSubscription = await Location.watchPositionAsync(
            {
                accuracy: Location.Accuracy.High,
                timeInterval: 5000,
                distanceInterval: 10,
            },
            (location) => {
                // Konumu veritabanına kaydet
                set(locationRef, {
                    latitude: location.coords.latitude,
                    longitude: location.coords.longitude,
                    timestamp: new Date().toISOString(),
                    sharingWith: friendId,
                    isSharing: true
                });
            }
        );

        return locationSubscription;

    } catch (error) {
        console.error('Konum paylaşma hatası:', error);
        throw error;
    }
};

export const handleStopSharing = async (userId) => {
    try {
        const db = getDatabase();
        const locationRef = ref(db, `locations/${userId}`);

        // Konum paylaşımını durdur
        await set(locationRef, {
            isSharing: false,
            sharingWith: null,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Konum paylaşımı durdurma hatası:', error);
        throw error;
    }
};

export const checkSharingStatus = (userId, callback) => {
    const db = getDatabase();
    const locationRef = ref(db, `locations/${userId}`);

    // Paylaşım durumunu dinle
    return onValue(locationRef, (snapshot) => {
        const data = snapshot.val();
        callback(data?.isSharing || false);
    });
};

// Arkadaşın paylaştığı konumu dinle
export const listenToFriendLocation = (friendId, callback) => {
    const db = getDatabase();
    const locationRef = ref(db, `locations/${friendId}`);

    return onValue(locationRef, (snapshot) => {
        const locationData = snapshot.val();
        if (locationData && locationData.isSharing) {
            callback({
                latitude: locationData.latitude,
                longitude: locationData.longitude,
                timestamp: new Date(locationData.timestamp),
                isSharing: true
            });
        } else {
            callback(null);
        }
    });
};

// Paylaşılan konumları kontrol et
export const checkSharedLocations = async (userId) => {
    const db = getDatabase();
    const locationsRef = ref(db, 'locations');

    return onValue(locationsRef, (snapshot) => {
        const locations = snapshot.val();
        if (!locations) return [];

        return Object.entries(locations)
            .filter(([key, value]) => value.sharingWith === userId)
            .map(([key, value]) => ({
                userId: key,
                ...value
            }));
    });
};

export const removeFriend = async (userId, friendId) => {
    try {
        const batch = writeBatch(db);

        // Her iki kullanıcının ana dokümanlarından friends array'ini güncelle
        const userRef = doc(db, 'users', userId);
        const friendRef = doc(db, 'users', friendId);

        // Kullanıcının friends array'inden arkadaşı çıkar
        await updateDoc(userRef, {
            friends: arrayRemove(friendId)
        });

        // Arkadaşın friends array'inden kullanıcıyı çıkar
        await updateDoc(friendRef, {
            friends: arrayRemove(userId)
        });

        // Aktif paylaşımları kontrol et ve sil
        const userSharesRef = collection(db, `users/${userId}/shares`);
        const friendSharesRef = collection(db, `users/${friendId}/shares`);

        // Kullanıcının bu arkadaşla olan paylaşımlarını bul
        const userSharesQuery = query(userSharesRef, where('friendId', '==', friendId));
        const userShares = await getDocs(userSharesQuery);

        // Arkadaşın bu kullanıcıyla olan paylaşımlarını bul
        const friendSharesQuery = query(friendSharesRef, where('friendId', '==', userId));
        const friendShares = await getDocs(friendSharesQuery);

        // Paylaşımları sil
        userShares.forEach((doc) => {
            batch.delete(doc.ref);
        });

        friendShares.forEach((doc) => {
            batch.delete(doc.ref);
        });

        // Gelen paylaşımları da sil
        const userReceivedSharesRef = collection(db, `users/${userId}/receivedShares`);
        const friendReceivedSharesRef = collection(db, `users/${friendId}/receivedShares`);

        const userReceivedQuery = query(userReceivedSharesRef, where('fromUserId', '==', friendId));
        const friendReceivedQuery = query(friendReceivedSharesRef, where('fromUserId', '==', userId));

        const userReceived = await getDocs(userReceivedQuery);
        const friendReceived = await getDocs(friendReceivedQuery);

        userReceived.forEach((doc) => {
            batch.delete(doc.ref);
        });

        friendReceived.forEach((doc) => {
            batch.delete(doc.ref);
        });

        // Tüm değişiklikleri uygula
        await batch.commit();

        return { success: true };
    } catch (error) {
        console.error('Arkadaş silme hatası:', error);
        throw error;
    }
};

export const getSentFriendRequests = async () => {
    try {
        const currentUserId = await getCurrentUserUid();
        if (!currentUserId) {
            throw new Error('Kullanıcı bulunamadı');
        }

        const userRef = doc(db, 'users', currentUserId);
        const userDoc = await getDoc(userRef);
        const userData = userDoc.data();

        if (!userData.friendRequests?.sent) {
            return [];
        }

        // Gönderilen isteklerin detaylarını al
        const requestPromises = userData.friendRequests.sent.map(async (userId) => {
            try {
                const friendData = await getFriendDetails(userId);
                if (friendData) {
                    return {
                        id: userId,
                        name: friendData.informations?.name || 'İsimsiz Kullanıcı',
                        profilePicture: friendData.informations?.profileImage,
                        username: friendData.informations?.username,
                        email: friendData.informations?.email
                    };
                }
                return null;
            } catch (error) {
                console.error(`${userId} için detaylar alınamadı:`, error);
                return null;
            }
        });

        const requests = await Promise.all(requestPromises);
        return requests.filter(request => request !== null);
    } catch (error) {
        console.error('Gönderilen istekleri alma hatası:', error);
        throw error;
    }
};

export const cancelFriendRequest = async (targetUserId) => {
    try {
        const currentUserId = await getCurrentUserUid();
        if (!currentUserId) {
            throw new Error('Kullanıcı bulunamadı');
        }

        const batch = writeBatch(db);

        // Gönderen kullanıcının sent listesinden sil
        const senderRef = doc(db, 'users', currentUserId);
        await updateDoc(senderRef, {
            'friendRequests.sent': arrayRemove(targetUserId)
        });

        // Alıcı kullanıcının received listesinden sil
        const receiverRef = doc(db, 'users', targetUserId);
        await updateDoc(receiverRef, {
            'friendRequests.received': arrayRemove(currentUserId)
        });

        // İsteğe bağlı: İstek geçmişini saklamak isterseniz
        const requestHistoryRef = doc(db, `users/${currentUserId}/requestHistory/${targetUserId}`);
        batch.set(requestHistoryRef, {
            type: 'cancelled',
            timestamp: serverTimestamp(),
            targetUserId: targetUserId
        });

        await batch.commit();

        return { success: true, message: 'Arkadaşlık isteği iptal edildi' };
    } catch (error) {
        console.error('İstek iptal hatası:', error);
        throw error;
    }
};

