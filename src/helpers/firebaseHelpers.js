// firebaseHelpers.js
import * as Location from 'expo-location';
import { db } from '../../firebaseConfig'; // Firebase Firestore modülünü firebaseConfig dosyasından import edin
import {
    collection,
    doc,
    addDoc,
    setDoc,
    getDocs,
    onSnapshot,
    query,
    where,
    updateDoc,
    arrayUnion,
    getDoc,
    orderBy,
    deleteDoc,
    limit,
    writeBatch,
} from 'firebase/firestore';
import { haversine } from './locationUtils';

// Önbellek için basit bir mekanizma ekleyelim
const cache = {
    friends: new Map(),
    lastUpdate: null,
    CACHE_DURATION: 5 * 60 * 1000, // 5 dakika
};

/**
 * Kullanıcının belirli bir arkadaşıyla konum paylaşmasını sağlar.
 * @param {string} userId - Kullanıcı ID'si
 * @param {string} friendId - Arkadaş ID'si
 * @param {Object} locationData - Paylaşılan konum bilgisi
 */

// Anlık konum paylaşımı
export const shareLocation = async (userId, friendId, locationData) => {
    try {
        // 1. Kullanıcının sharedWith alanına paylaşım bilgisini ekle
        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, {
            sharedWith: arrayUnion({
                friendId: friendId,
                type: 'current',
                timestamp: new Date().toISOString()
            })
        });

        // 2. Arkadaşın sharedLocations koleksiyonuna konumu ekle
        const sharedLocationRef = doc(db, 'users', friendId, 'sharedLocations', userId);
        await setDoc(sharedLocationRef, {
            latitude: locationData.latitude,
            longitude: locationData.longitude,
            sharedBy: userId,
            type: 'current',
            timestamp: new Date().toISOString()
        });
        return { success: true };
    } catch (error) {
        console.error('Konum paylaşılırken hata:', error);
        return { success: false, error: error.message };
    }
};

// Canlı konum paylaşımı
export const shareLiveLocation = async (userId, friendId) => {
    try {
        // 1. Konum izni kontrolü
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
            throw new Error('Konum izni verilmedi');
        }

        // 2. Kullanıcının sharedWith alanına paylaşım bilgisini ekle
        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, {
            sharedWith: arrayUnion({
                friendId: friendId,
                type: 'live',
                timestamp: new Date().toISOString()
            })
        });

        // 3. Canlı konum takibi başlat
        const subscription = await Location.watchPositionAsync(
            {
                accuracy: Location.Accuracy.High,
                timeInterval: 5000,
                distanceInterval: 10,
            },
            async (newLocation) => {
                const locationData = {
                    latitude: newLocation.coords.latitude,
                    longitude: newLocation.coords.longitude,
                    sharedBy: userId,
                    type: 'live',
                    timestamp: new Date().toISOString()
                };

                // Arkadaşın liveLocations koleksiyonuna konumu güncelle
                const liveLocationRef = doc(db, 'users', friendId, 'liveLocations', userId);
                await setDoc(liveLocationRef, locationData);
            }
        );
        return { success: true, subscription };
    } catch (error) {
        console.error('Canlı konum paylaşımı başlatılırken hata:', error);
        return { success: false, error: error.message };
    }
};

// Paylaşılan konumları dinleme
export const listenToSharedLocations = (userId, callback) => {

    // 1. Anlık paylaşılan konumları dinle
    const sharedLocationsRef = collection(db, 'users', userId, 'sharedLocations');
    const unsubscribeShared = onSnapshot(sharedLocationsRef, (snapshot) => {
        const locations = [];
        snapshot.forEach((doc) => {
            locations.push({
                id: doc.id,
                ...doc.data()
            });
        });
        callback('shared', locations);
    }, (error) => {
        console.error('Anlık konum dinleme hatası:', error);
    });

    // 2. Canlı konumları dinle
    const liveLocationsRef = collection(db, 'users', userId, 'liveLocations');
    const unsubscribeLive = onSnapshot(liveLocationsRef, (snapshot) => {
        const locations = [];
        snapshot.forEach((doc) => {
            locations.push({
                id: doc.id,
                ...doc.data()
            });
        });
        callback('live', locations);
    }, (error) => {
        console.error('Canlı konum dinleme hatası:', error);
    });

    return () => {
        unsubscribeShared();
        unsubscribeLive();
    };
};

// Paylaşımı durdurma
export const stopSharing = async (userId, friendId, type) => {
    try {
        // 1. sharedWith'den paylaşımı kaldır
        const userRef = doc(db, `users/${userId}`);
        const userDoc = await getDoc(userRef);

        if (userDoc.exists()) {
            const userData = userDoc.data();
            const sharedWith = userData.sharedWith || [];

            const updatedSharedWith = sharedWith.filter(share =>
                !(share.friendId === friendId && share.type === type)
            );

            await updateDoc(userRef, {
                sharedWith: updatedSharedWith
            });

            // 2. İlgili konum koleksiyonundan belgeyi sil
            const collectionName = type === 'live' ? 'liveLocations' : 'sharedLocations';
            await deleteDoc(doc(db, `users/${friendId}/${collectionName}/${userId}`));

            return { success: true };
        }
        return { success: false, message: 'Kullanıcı bulunamadı' };
    } catch (error) {
        console.error('Paylaşım durdurulurken hata:', error);
        return { success: false, error: error.message };
    }
};

// Seçilen markerları paylaşma - db ye ekleme
export const shareSelectedLocations = async (userId, locations) => {
    try {
        const sharedLocationsRef = collection(db, `users/${userId}/sharedRoutes`);
        await Promise.all(locations.map(async (location) => {
            await addDoc(sharedLocationsRef, {
                ...location,
                sharedBy: userId,
                timestamp: new Date().toISOString(),
            });
        }));
    } catch (error) {
        console.error('Konumlar paylaşılırken hata oluştu:', error);
    }
};

// Seçilen markerları paylaşma - db den çekme 
export const getSharedLocations = async (userId) => {
    const q = query(
        collection(db, `users/${userId}/sharedRoutes`),
        orderBy('timestamp', 'desc')
    );
    const querySnapshot = await getDocs(q);
    const locations = querySnapshot.docs.map(doc => doc.data());
    return locations;
};

export const fetchFriends = async (userId) => {
    try {
        // Önbellekteki verileri kontrol et
        const now = Date.now();
        if (cache.lastUpdate && (now - cache.lastUpdate < cache.CACHE_DURATION)) {
            const cachedFriends = cache.friends.get(userId);
            if (cachedFriends) {
                return cachedFriends;
            }
        }

        const userRef = doc(db, 'users', userId);
        const userSnapshot = await getDoc(userRef);

        if (userSnapshot.exists()) {
            const userData = userSnapshot.data();
            if (userData.friends) {
                const friendsData = await Promise.all(
                    userData.friends.map(async (friendId) => {
                        // Önbellekte var mı kontrol et
                        const cachedFriend = cache.friends.get(friendId);
                        if (cachedFriend) return cachedFriend;

                        const friendRef = doc(db, 'users', friendId);
                        const friendSnapshot = await getDoc(friendRef);
                        if (friendSnapshot.exists()) {
                            const friendData = {
                                id: friendId,
                                ...friendSnapshot.data(),
                                name: friendSnapshot.data().informations?.name || 'İsimsiz',
                            };
                            // Arkadaşı önbelleğe al
                            cache.friends.set(friendId, friendData);
                            return friendData;
                        }
                        return null;
                    })
                );

                const validFriends = friendsData.filter(friend => friend !== null);
                cache.friends.set(userId, validFriends);
                cache.lastUpdate = now;

                return validFriends;
            }
        }
        return [];
    } catch (error) {
        console.error('Arkadaşları alma hatası:', error);
        return [];
    }
};

/**
 * Kullanıcının canlı konumunu belirli aralıklarla günceller.
 * @param {string} userId - Kullanıcı ID'si
 */
export const startLiveLocationSharing = async (userId) => {
    try {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
            throw new Error('Konum izni verilmedi.');
        }

        await Location.watchPositionAsync(
            {
                accuracy: Location.Accuracy.High,
                timeInterval: 5000,
                distanceInterval: 10,
            },
            async (newLocation) => {
                const locationData = {
                    latitude: newLocation.coords.latitude,
                    longitude: newLocation.coords.longitude,
                    timestamp: new Date().toISOString(),
                };

                const liveLocationRef = doc(db, 'users', userId, 'liveLocation', 'current');
                await setDoc(liveLocationRef, locationData);
            }
        );
    } catch (error) {
        console.error('Canlı konum paylaşımı başlatılırken hata oluştu:', error);
    }
};

/**
 * Kullanıcının konumunu locations koleksiyonuna ekler.
 * @param {string} userId - Kullanıcı ID'si
 * @param {Object} location - Konum bilgisi (latitude, longitude, timestamp)
 */
export const addLocation = async (userId, location) => {
    try {
        await db
            .collection('users')
            .doc(userId)
            .collection('locations')
            .add(location);
    } catch (error) {
        console.error('Konum eklenirken hata oluştu:', error);
    }
};

/**
 * Kullanıcıya başkaları tarafından paylaşılan konumları getirir.
 * @param {string} userId - Kullanıcı ID'si
 * @returns {Promise<Array>} - Paylaşılan konumlar listesi
 */
export const getSharedWithMe = async (userId) => {
    const q = query(
        collection(db, `users/${userId}/sharedLocations`),
        orderBy('timestamp', 'desc')
    );
    const querySnapshot = await getDocs(q);
    const locations = querySnapshot.docs.map(doc => doc.data());
    return locations;
};

// Paylaşımları dinleme fonksiyonları
export const listenToShares = (userId, callback) => {
    if (!userId) return () => { };

    const activeSharesRef = collection(db, `users/${userId}/activeShares`);
    const sharedWithMeRef = collection(db, `users/${userId}/sharedWithMe`);

    const unsubscribeActive = onSnapshot(activeSharesRef, (snapshot) => {
        const shares = [];
        snapshot.forEach((doc) => {
            if (doc.exists()) {
                shares.push({
                    id: doc.id,
                    ...doc.data()
                });
            }
        });
        callback('active', shares);
    });

    const unsubscribeShared = onSnapshot(sharedWithMeRef, (snapshot) => {
        const shares = [];
        snapshot.forEach((doc) => {
            if (doc.exists()) {
                shares.push({
                    id: doc.id,
                    ...doc.data()
                });
            }
        });
        callback('shared', shares);
    });

    return () => {
        unsubscribeActive();
        unsubscribeShared();
    };
};

/**
 * Kullanıcının mevcut konumunu alır.
 * @returns {Object} - Konum bilgisi (latitude, longitude, timestamp)
 */
export const getCurrentLocation = async () => {
    try {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
            throw new Error('Konum izni verilmedi.');
        }

        let location = await Location.getCurrentPositionAsync({});
        return {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            timestamp: new Date().toISOString(),
        };
    } catch (error) {
        console.error('Konum alınırken hata:', error);
        throw error;
    }
};

export const getShares = async (userId) => {
    try {
        const userRef = doc(db, 'users', userId);
        const userDoc = await getDoc(userRef);

        if (userDoc.exists()) {
            const userData = userDoc.data();
            return Array.isArray(userData.sharedWith) ? userData.sharedWith : [];
        }
        return [];
    } catch (error) {
        console.error('Paylaşımlar alınırken hata:', error);
        return [];
    }
};

// Tüm paylaşımları durdurma (isteğe bağlı kullanılabilir)
export const stopAllShares = async (userId) => {
    try {
        // 1. Kullanıcının tüm paylaşımlarını al
        const userRef = doc(db, 'users', userId);
        const userDoc = await getDoc(userRef);

        if (userDoc.exists()) {
            const userData = userDoc.data();
            const sharedWith = userData.sharedWith || [];

            // 2. Her bir paylaşımı durdur
            const stopPromises = sharedWith.map(share =>
                stopSharing(userId, share.friendId, share.type)
            );

            await Promise.all(stopPromises);

            // 3. sharedWith dizisini temizle
            await updateDoc(userRef, {
                sharedWith: []
            });

            return {
                success: true,
                message: 'Tüm paylaşımlar durduruldu'
            };
        }

        return {
            success: false,
            message: 'Kullanıcı bulunamadı'
        };

    } catch (error) {
        console.error('Tüm paylaşımları durdururken hata:', error);
        return {
            success: false,
            message: error.message || 'Paylaşımlar durdurulamadı'
        };
    }
};

/**
 * Belirli bir paylaşımı siler.
 * @param {string} shareId - Paylaşım ID'si
 * @param {string} userId - Kullanıcı ID'si
 * @param {string} shareType - Paylaşım tipi ('current' veya 'live')
 * @returns {Promise<Object>} - İşlem sonucu
 */
export const deleteShare = async (shareId, userId, shareType) => {
    try {
        const userRef = doc(db, 'users', userId);
        const userSnapshot = await getDoc(userRef);
        if (userSnapshot.exists()) {
            const userData = userSnapshot.data();
            const updatedSharedWith = userData.sharedWith.filter(
                share => !(share.friendId === shareId && share.type === shareType)
            );
            await updateDoc(userRef, { sharedWith: updatedSharedWith });

            // İlgili koleksiyondan belgeyi sil
            const collectionName = shareType === 'live' ? 'liveLocations' : 'sharedLocations';
            const locationRef = doc(db, `users/${shareId}/${collectionName}`, userId);
            await deleteDoc(locationRef);

            return { success: true };
        }
        return { success: false, message: 'Kullanıcı bulunamadı' };
    } catch (error) {
        console.error('Paylaşımı silme hatası:', error);
        return { success: false, message: 'Paylaşım silinemedi' };
    }
};

// trackLiveLocations fonksiyonunu yeniden tanımlayalım
export const trackLiveLocations = (userId, callback) => {
    if (!userId || !callback) {
        return () => { };
    }

    try {
        const liveLocationsRef = collection(db, 'users', userId, 'liveLocations');

        return onSnapshot(liveLocationsRef,
            (snapshot) => {
                const locations = [];
                snapshot.forEach((doc) => {
                    const data = doc.data();
                    locations.push({
                        id: doc.id,
                        ...data,
                        timestamp: data.timestamp ? data.timestamp : new Date().toISOString()
                    });
                });
                callback(locations);
            },
            (error) => {
                console.error('Canlı konum dinleme hatası:', error);
                callback([]);
            }
        );
    } catch (error) {
        console.error('trackLiveLocations hata:', error);
        return () => { };
    }
};

// SMS doğrulama için gerekli fonksiyonlar
export const sendVerificationSMS = async (phoneNumber) => {
    try {
        // Burada bir SMS servisi kullanarak doğrulama kodu gönderme işlemi yapılacak
        // Örnek olarak Firebase Authentication Phone veya başka bir SMS servisi kullanılabilir
        const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

        // Kodu veritabanında saklayalım (gerçek uygulamada daha güvenli bir yöntem kullanılmalı)
        const verificationRef = doc(db, 'verifications', phoneNumber);
        await setDoc(verificationRef, {
            code: verificationCode,
            timestamp: new Date().toISOString(),
            attempts: 0
        });

        // SMS gönderme işlemi burada yapılacak
        // Şimdilik simüle ediyoruz

        return { success: true };
    } catch (error) {
        console.error('SMS gönderme hatası:', error);
        return { success: false, message: error.message };
    }
};

export const verifyPhoneNumber = async (phoneNumber, code) => {
    try {
        const verificationRef = doc(db, 'verifications', phoneNumber);
        const verificationDoc = await getDoc(verificationRef);

        if (!verificationDoc.exists()) {
            return { success: false, message: 'Doğrulama kodu bulunamadı' };
        }

        const verification = verificationDoc.data();
        const timestamp = new Date(verification.timestamp);
        const now = new Date();
        const timeDiff = (now - timestamp) / 1000 / 60; // dakika cinsinden

        if (timeDiff > 5) {
            await deleteDoc(verificationRef);
            return { success: false, message: 'Doğrulama kodunun süresi dolmuş' };
        }

        if (verification.attempts >= 3) {
            await deleteDoc(verificationRef);
            return { success: false, message: 'Çok fazla başarısız deneme' };
        }

        if (verification.code !== code) {
            await updateDoc(verificationRef, {
                attempts: verification.attempts + 1
            });
            return { success: false, message: 'Yanlış doğrulama kodu' };
        }

        await deleteDoc(verificationRef);
        return { success: true };
    } catch (error) {
        console.error('Doğrulama hatası:', error);
        return { success: false, message: error.message };
    }
};

export const removeFriend = async (userId, friendId) => {
    try {
        // Her iki kullanıcının arkadaş listesinden silme
        const userRef = doc(db, 'users', userId);
        const friendRef = doc(db, 'users', friendId);

        // Batch işlemi başlat
        const batch = writeBatch(db);

        // Kullanıcının arkadaş listesinden sil
        const userFriendRef = doc(db, `users/${userId}/friends/${friendId}`);
        batch.delete(userFriendRef);

        // Arkadaşın listesinden de sil
        const friendUserRef = doc(db, `users/${friendId}/friends/${userId}`);
        batch.delete(friendUserRef);

        // Batch işlemini uygula
        await batch.commit();

        return { success: true };
    } catch (error) {
        console.error('Arkadaş silme hatası:', error);
        throw error;
    }
};