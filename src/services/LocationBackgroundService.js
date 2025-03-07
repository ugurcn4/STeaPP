import * as TaskManager from 'expo-task-manager';
import * as Location from 'expo-location';
import { rtdb, db } from '../../firebaseConfig';
import { ref, set, get, serverTimestamp } from 'firebase/database';
import { doc, updateDoc, collection, getDocs, query, where } from 'firebase/firestore';

const BACKGROUND_LOCATION_TASK = 'background-location-task';
const LOCATION_TRACKING_TASK = 'location-tracking';

// Konum bilgilerini almak için yardımcı fonksiyon
const getLocationInfo = async (latitude, longitude) => {
    try {
        const response = await Location.reverseGeocodeAsync({
            latitude,
            longitude
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

// Konum güncellemesi yapan fonksiyon
const updateLocation = async (location, userId) => {
    try {
        // Global değişkenden paylaşım bilgilerini al
        const shareInfo = global.shareLocationInfo;
        if (!shareInfo || !shareInfo.shareId) {
            console.error('Paylaşım bilgileri bulunamadı');
            return;
        }

        const { shareId, friendId } = shareInfo;

        // Konum bilgilerini string'den parse et
        let locationInfo = null;
        try {
            if (shareInfo.locationInfo) {
                locationInfo = JSON.parse(shareInfo.locationInfo);
            }
        } catch (e) {
            console.error('Konum bilgileri parse edilemedi:', e);
        }

        // Konum bilgilerini güncelle
        const normalizedLocation = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude
        };

        // RTDB'yi güncelle
        const locationRef = ref(rtdb, `locations/${shareId}`);
        await set(locationRef, {
            latitude: normalizedLocation.latitude,
            longitude: normalizedLocation.longitude,
            accuracy: location.coords.accuracy || 0,
            heading: location.coords.heading || 0,
            speed: location.coords.speed || 0,
            timestamp: serverTimestamp()
        });

        // Firestore'u güncelle - locationInfo'yu doğrudan kullanma
        const shareRef = doc(db, `users/${userId}/shares/${shareId}`);
        await updateDoc(shareRef, {
            lastUpdate: serverTimestamp(),
            location: normalizedLocation
            // locationInfo alanını güncelleme, bu Promise hatası veriyor
        });

        // Karşı taraftaki paylaşımı da güncelle
        const receivedSharesRef = collection(db, `users/${friendId}/receivedShares`);
        const q = query(receivedSharesRef,
            where('fromUserId', '==', userId),
            where('status', '==', 'active')
        );
        const querySnapshot = await getDocs(q);
        querySnapshot.forEach(async (doc) => {
            await updateDoc(doc.ref, {
                lastUpdate: serverTimestamp(),
                location: normalizedLocation
                // locationInfo alanını güncelleme, bu Promise hatası veriyor
            });
        });
    } catch (error) {
        console.error('Konum güncelleme hatası:', error);
    }
};

// Arka plan görevi tanımlama
TaskManager.defineTask(BACKGROUND_LOCATION_TASK, async ({ data: { locations }, error }) => {
    const [location] = locations;

    try {
        // global.currentUser olmadığında hata veriyor, kontrol edelim
        if (!global.currentUser || !global.currentUser.uid) {
            console.error('Kullanıcı bilgisi bulunamadı, konum güncellenemiyor');
            return;
        }

        // Firestore'dan aktif paylaşımları al
        const activeSharesSnapshot = await getDocs(query(
            collection(db, `users/${global.currentUser.uid}/shares`),
            where('status', '==', 'active'),
            where('type', '==', 'live')
        ));

        // Her aktif paylaşım için konum güncelle
        for (const shareDoc of activeSharesSnapshot.docs) {
            const shareId = shareDoc.id;
            const shareData = shareDoc.data();
            const friendId = shareData.friendId;

            // Konum bilgilerini normalize et
            const normalizedLocation = {
                latitude: location.coords.latitude,
                longitude: location.coords.longitude
            };

            // RTDB'de konumu güncelle
            const locationRef = ref(rtdb, `locations/${shareId}`);
            await set(locationRef, {
                latitude: normalizedLocation.latitude,
                longitude: normalizedLocation.longitude,
                accuracy: location.coords.accuracy || 0,
                heading: location.coords.heading || 0,
                speed: location.coords.speed || 0,
                timestamp: serverTimestamp()
            });

            // Firestore'da son güncelleme zamanını güncelle - locationInfo olmadan
            await updateDoc(shareDoc.ref, {
                lastUpdate: serverTimestamp(),
                location: normalizedLocation
                // locationInfo alanını güncelleme, bu Promise hatası veriyor
            });

            // Karşı taraftaki paylaşımı da güncelle
            const receivedSharesRef = collection(db, `users/${friendId}/receivedShares`);
            const q = query(receivedSharesRef,
                where('fromUserId', '==', global.currentUser.uid),
                where('status', '==', 'active')
            );
            const querySnapshot = await getDocs(q);
            
            for (const doc of querySnapshot.docs) {
                await updateDoc(doc.ref, {
                    lastUpdate: serverTimestamp(),
                    location: normalizedLocation
                    // locationInfo alanını güncelleme, bu Promise hatası veriyor
                });
            }
        }
    } catch (error) {
        console.error('Location update failed:', error);
    }
});

// Arka plan konum izlemeyi başlat
export const startBackgroundLocationUpdates = async (userId) => {
    try {
        // Konum izinlerini kontrol et
        const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
        const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();

        if (foregroundStatus !== 'granted' || backgroundStatus !== 'granted') {
            throw new Error('Konum izinleri gerekli');
        }

        // Global değişkene kullanıcı ID'sini ata
        if (!global.currentUser) {
            global.currentUser = { uid: userId };
        }

        // Arka plan konumu başlat
        await Location.startLocationUpdatesAsync(BACKGROUND_LOCATION_TASK, {
            accuracy: Location.Accuracy.Balanced,
            timeInterval: 10000, // 10 saniyede bir güncelle
            distanceInterval: 10, // 10 metrede bir güncelle
            foregroundService: {
                notificationTitle: "Konum paylaşılıyor",
                notificationBody: "Konumunuz arkadaşlarınızla paylaşılıyor",
                notificationColor: "#FFD700"
            },
            // Pil optimizasyonu
            pausesUpdatesAutomatically: true,
            activityType: Location.ActivityType.Fitness,
            showsBackgroundLocationIndicator: true
        });
        return true;
    } catch (error) {
        console.error('Arka plan konum başlatma hatası:', error);
        return false;
    }
};

// Arka plan konum izlemeyi durdur
export const stopBackgroundLocationUpdates = async () => {
    try {
        const hasStarted = await Location.hasStartedLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
        if (hasStarted) {
            await Location.stopLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
        } else {
        }
    } catch (error) {
        console.error('Arka plan konum durdurma hatası:', error);
    }
}; 