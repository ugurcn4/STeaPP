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
} from 'firebase/firestore';



/**
 * Kullanıcının belirli bir arkadaşıyla konum paylaşmasını sağlar.
 * @param {string} userId - Kullanıcı ID'si
 * @param {string} friendId - Arkadaş ID'si
 * @param {Object} location - Paylaşılan konum bilgisi
 */

// Anlık konum paylaşımı
export const shareLocation = async (userId, friendId, locationData) => {
    try {
        // Konum bilgisini hedef kullanıcının sharedLocations koleksiyonuna ekleyin
        const sharedLocationRef = doc(db, `users/${friendId}/sharedLocations`, userId); // friendId'ye ait sharedLocations koleksiyonu
        await setDoc(sharedLocationRef, {
            ...locationData,
            sharedBy: userId,  // Konumu paylaşan kullanıcı
            timestamp: new Date().toISOString(),
        });
        // Konum paylaşımı yapan kişinin `sharedWith` alanını güncelleyin
        const userRef = doc(db, `users/${userId}`);
        await updateDoc(userRef, {
            sharedWith: arrayUnion({ friendId, type: 'current' })  // Arkadaşı paylaşılanlar listesine ekle
        });

    } catch (error) {
        console.error('Konum paylaşılırken hata oluştu:', error);
    }
};

// Canlı konum paylaşımı
/**
 * Kullanıcının belirli bir arkadaşıyla canlı konum paylaşmasını sağlar.
 * @param {string} userId - Kullanıcı ID'si
 * @param {string} friendId - Arkadaş ID'si
 */
export const shareLiveLocation = async (userId, friendId) => {
    try {
        // Konum izni isteyin
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
            throw new Error('Konum izni verilmedi.');
        }

        // Canlı konum izlemeyi başlatın
        await Location.watchPositionAsync(
            {
                accuracy: Location.Accuracy.High,
                timeInterval: 5000,   // Her 5 saniyede bir
                distanceInterval: 10, // 10 metre hareket edince
            },
            async (newLocation) => {
                const locationData = {
                    latitude: newLocation.coords.latitude,
                    longitude: newLocation.coords.longitude,
                    timestamp: new Date().toISOString(),
                };

                try {
                    // Arkadaşın liveLocations koleksiyonuna konumu ekleyin
                    const liveLocationRef = doc(db, `users/${friendId}/liveLocations`, userId);
                    await setDoc(liveLocationRef, {
                        ...locationData,
                        sharedBy: userId,
                    });

                    // Kullanıcının sharedWith alanını güncelleyin
                    const userRef = doc(db, `users/${userId}`);
                    await updateDoc(userRef, {
                        sharedWith: arrayUnion({ friendId, type: 'live' })
                    });
                } catch (error) {
                    console.error('Canlı konum paylaşılırken hata oluştu:', error);
                }
            }
        );
    } catch (error) {
        console.error('Canlı konum paylaşımı başlatılırken hata oluştu:', error);
    }
};

// Canlı konum paylaşımını takip etme
/**
 * Kullanıcıya başkaları tarafından paylaşılan canlı konumları getirir.
 * @param {string} userId - Kullanıcı ID'si
 * @param {function} callback - Konum güncellemelerini işlemek için geri çağırma fonksiyonu
 */
export const trackLiveLocations = (userId, callback) => {
    const q = query(collection(db, `users/${userId}/liveLocations`));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const locations = [];
        querySnapshot.forEach((doc) => {
            locations.push({ id: doc.id, ...doc.data() });
        });
        callback(locations);
    }, (error) => {
        console.error('Canlı konumlar alınırken hata oluştu:', error);
    });

    return unsubscribe; // Dinlemeyi durdurmak için bu fonksiyonu çağırabilirsiniz
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

export const fetchFriendsLocations = async (userId) => {
    try {
        const userRef = doc(db, 'users', userId);
        const userSnapshot = await getDoc(userRef);
        if (userSnapshot.exists()) {
            const userData = userSnapshot.data();
            if (userData.friends) {
                const friendsLocations = await Promise.all(
                    userData.friends.map(async (friendId) => {
                        const friendRef = doc(db, 'users', friendId);
                        const friendSnapshot = await getDoc(friendRef);
                        if (friendSnapshot.exists()) {
                            const friendData = friendSnapshot.data();
                            return {
                                id: friendId,
                                name: friendData.informations.name,
                                latitude: friendData.location.latitude,
                                longitude: friendData.location.longitude,
                            };
                        }
                        return null;
                    })
                );
                return friendsLocations.filter(location => location !== null);
            }
        }
        return [];
    } catch (error) {
        console.error('Arkadaşların konumlarını alma hatası:', error);
        throw error;
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
        } shareLiveLocation('userId1', 'friendId1');

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



/**
 * Kullanıcının paylaştığı konumları dinler.
 * @param {string} userId - Kullanıcı ID'si
 * @param {Function} callback - Değişiklikleri dinlemek için callback
 */
export const listenToSharedLocations = (userId, callback) => {
    return db
        .collection('users')
        .doc(userId)
        .collection('sharedLocations')
        .onSnapshot((snapshot) => {
            const sharedLocations = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            }));
            callback(sharedLocations);
        }, (error) => {
            console.error('Paylaşılan konumlar dinlenirken hata oluştu:', error);
        });
};

/**
 * Kullanıcıya başkaları tarafından paylaşılan konumları dinler.
 * @param {string} userId - Kullanıcı ID'si
 * @param {Function} callback - Değişiklikleri dinlemek için callback
 */
export const listenToSharedWithMe = (userId, callback) => {
    const sharedWithMeRef = collection(db, 'users', userId, 'sharedLocations');
    return onSnapshot(sharedWithMeRef, (snapshot) => {
        const sharedLocations = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
        }));
        callback(sharedLocations);
    }, (error) => {
        console.error('Başkaları tarafından paylaşılan konumlar dinlenirken hata oluştu:', error);
    });
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
        console.error('Konum alınırken hata oluştu:', error);
        throw error;
    }
};

/**
 * Kullanıcının paylaşımlarını getirir.
 * @param {string} userId - Kullanıcı ID'si
 * @returns {Promise<Array>} - Paylaşımlar listesi
 */
/**
 * Kullanıcının paylaşımlarını getirir.
 * @param {string} userId - Kullanıcı ID'si
 * @returns {Promise<Array>} - Paylaşımlar listesi
 */
export const getShares = async (userId) => {
    try {
        const userRef = doc(db, 'users', userId);
        const userSnapshot = await getDoc(userRef);
        if (userSnapshot.exists()) {
            const userData = userSnapshot.data();
            if (userData.sharedWith) {
                const sharesList = await Promise.all(
                    userData.sharedWith.map(async (share) => {
                        const { friendId, type: shareType } = share;
                        const sharedUserRef = doc(db, 'users', friendId);
                        const sharedUserSnapshot = await getDoc(sharedUserRef);
                        if (sharedUserSnapshot.exists()) {
                            const sharedUserData = sharedUserSnapshot.data();
                            return {
                                id: friendId,
                                name: sharedUserData.informations.name,
                                shareType: shareType,
                                liveLocation: shareType === 'live' ? sharedUserData.liveLocations || [] : [],
                                sharedLocation: shareType === 'current' ? sharedUserData.sharedLocations || [] : [],
                            };
                        }
                        return null;
                    })
                );
                return sharesList.filter(share => share !== null);
            }
        }
        return [];
    } catch (error) {
        console.error('Paylaşımları alma hatası:', error);
        throw new Error('Could not fetch shares');
    }
};

/**
 * Belirli bir paylaşımı durdurur.
 * @param {string} shareId - Paylaşım ID'si
 * @param {string} userId - Kullanıcı ID'si
 * @returns {Promise<Object>} - İşlem sonucu
 */
export const stopShare = async (shareId, userId, shareType) => {
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
        return { success: false, message: 'User not found' };
    } catch (error) {
        console.error('Paylaşımı durdurma hatası:', error);
        return { success: false, message: 'Could not stop share' };
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