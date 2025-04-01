import * as TaskManager from 'expo-task-manager';
import * as Location from 'expo-location';
import { rtdb, db } from '../../firebaseConfig';
import { ref, set, get, serverTimestamp as rtdbServerTimestamp } from 'firebase/database';
import { doc, updateDoc, collection, getDocs, query, where, addDoc, serverTimestamp } from 'firebase/firestore';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
    shouldCollectPoint,
    isGPSUsable,
    evaluateGPSQuality
} from '../helpers/pathTracking';
import { getPlaceFromCoordinates } from '../helpers/locationHelpers';

const BACKGROUND_LOCATION_TASK = 'background-location-task';
const BACKGROUND_DRAWING_TASK = 'background-drawing-task';

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

// Arka plan konum izlemeyi başlat - iyileştirilmiş versiyon
export const startBackgroundLocationUpdates = async (userId, isDrawing = false) => {
    try {
        // Kullanıcı ID'sini kaydet
        await AsyncStorage.setItem('userId', userId);

        // Arka plan konum takibi için ayarlar - daha sık güncelleme
        const locationOptions = {
            accuracy: Location.Accuracy.BestForNavigation, // En yüksek doğruluk
            timeInterval: isDrawing ? 2000 : 30000,  // Çizim için daha sık güncelleme (2 saniye)
            distanceInterval: isDrawing ? 2 : 50,    // Çizim için daha hassas mesafe (2 metre)
            foregroundService: {
                notificationTitle: isDrawing ? "Arka Planda Çizim" : "Konum Paylaşımı",
                notificationBody: isDrawing ?
                    "Arka planda yol çizimi devam ediyor" :
                    "Konumunuz arka planda paylaşılıyor",
                notificationColor: "#4CAF50"
            },
            pausesUpdatesAutomatically: false, // Otomatik duraklatmayı kapat
            showsBackgroundLocationIndicator: true, // iOS için gösterge
            // Android için ek ayarlar
            foregroundService: {
                notificationTitle: isDrawing ? "Arka Planda Çizim" : "Konum Paylaşımı",
                notificationBody: isDrawing ?
                    "Arka planda yol çizimi devam ediyor" :
                    "Konumunuz arka planda paylaşılıyor",
                notificationColor: "#4CAF50",
                notificationId: isDrawing ? 123 : 456, // Benzersiz bildirim ID'si
                enableVibration: false, // Titreşimi kapat
                enableWakeLock: true // Cihazı uyanık tut
            }
        };

        // Uygun task'ı başlat
        const taskName = isDrawing ? BACKGROUND_DRAWING_TASK : BACKGROUND_LOCATION_TASK;

        // Önceki task'ı durdur (varsa)
        try {
            const isTaskDefined = await TaskManager.isTaskDefined(taskName);

            if (isTaskDefined) {
                const isTaskRegistered = await TaskManager.isTaskRegisteredAsync(taskName);

                if (isTaskRegistered) {
                    await Location.stopLocationUpdatesAsync(taskName);
                }
            }
        } catch (stopError) {
            console.error(`Önceki task durdurulurken hata: ${stopError.message}`);
            // Hata olsa bile devam et
        }
        await Location.startLocationUpdatesAsync(taskName, locationOptions);

        // Çizim için ek ayarlar
        if (isDrawing) {
            await AsyncStorage.setItem('backgroundDrawingEnabled', 'true');
            await AsyncStorage.setItem('lastBackgroundLocation', '');
            await AsyncStorage.setItem('tempBackgroundPoints', JSON.stringify([]));

            // Task'ın çalıştığından emin olmak için test verisi
            const testPoint = {
                latitude: 0,
                longitude: 0,
                timestamp: new Date().toISOString(),
                accuracy: 0,
                quality: 'TEST',
                speed: 0
            };

            await AsyncStorage.setItem('testBackgroundPoint', JSON.stringify(testPoint));
        }
        return true;
    } catch (error) {
        console.error(`Arka plan konum takibi başlatılamadı: ${error.message}`);
        console.error(error.stack);
        Alert.alert('Hata', `Arka plan konum takibi başlatılamadı: ${error.message}`);
        return false;
    }
};

// Arka plan konum izlemeyi durdur
export const stopBackgroundLocationUpdates = async () => {
    try {
        // Her iki task'ı da kontrol et ve durdur
        const tasks = [BACKGROUND_LOCATION_TASK, BACKGROUND_DRAWING_TASK];

        for (const taskName of tasks) {
            const isTaskDefined = await TaskManager.isTaskDefined(taskName);
            if (isTaskDefined) {
                const isTaskRegistered = await TaskManager.isTaskRegisteredAsync(taskName);
                if (isTaskRegistered) {
                    await Location.stopLocationUpdatesAsync(taskName);
                }
            }
        }

        // Arka plan çizimi için ayarları temizle
        await AsyncStorage.setItem('backgroundDrawingEnabled', 'false');

        // Geçici noktaları kaydet (eğer varsa)
        const tempPointsStr = await AsyncStorage.getItem('tempBackgroundPoints');
        const tempPoints = tempPointsStr ? JSON.parse(tempPointsStr) : [];

        if (tempPoints.length > 0) {
            const userId = await AsyncStorage.getItem('userId');
            if (userId) {
                // Yolun başlangıç noktasından şehir bilgisini al
                const startPoint = tempPoints[0];
                let locationInfo = { city: 'Bilinmeyen', district: 'Bilinmeyen' };

                try {
                    locationInfo = await getPlaceFromCoordinates(
                        startPoint.latitude,
                        startPoint.longitude
                    );
                } catch (error) {
                    console.error('Konum bilgisi alınamadı:', error);
                }

                // Firestore'a yolu kaydet
                const pathRef = collection(db, `users/${userId}/paths`);
                await addDoc(pathRef, {
                    points: tempPoints,
                    firstDiscovery: serverTimestamp(),
                    visitCount: 1,
                    type: 'discovered',
                    city: locationInfo.city || 'Bilinmeyen',
                    district: locationInfo.district || 'Bilinmeyen',
                    createdInBackground: true
                });

                // Geçici noktaları temizle
                await AsyncStorage.setItem('tempBackgroundPoints', JSON.stringify([]));
            }
        }

        return true;
    } catch (error) {
        console.error('Arka plan konum takibi durdurulamadı:', error);
        return false;
    }
};

// Arka plan çizim takibi için task tanımı - iyileştirilmiş versiyon
TaskManager.defineTask(BACKGROUND_DRAWING_TASK, async ({ data, error }) => {

    if (error) {
        console.error('Arka plan çizim hatası:', error);
        return;
    }

    if (!data) {
        console.error('Arka plan çizim verisi yok');
        return;
    }

    try {
        const { locations } = data;
        if (!locations || locations.length === 0) {
            console.error('Konum verisi yok');
            return;
        }

        const location = locations[0];

        // Arka plan çizimi aktif mi kontrol et
        const isEnabled = await AsyncStorage.getItem('backgroundDrawingEnabled');

        // Süre kontrolü
        const endTimeStr = await AsyncStorage.getItem('backgroundDrawingEndTime');
        if (endTimeStr) {
            const endTime = new Date(endTimeStr);
            const now = new Date();

            if (now > endTime) {
                await AsyncStorage.setItem('backgroundDrawingEnabled', 'false');
                await Location.stopLocationUpdatesAsync(BACKGROUND_DRAWING_TASK);
                return;
            }
        }

        // Kullanıcı ID'sini al
        const userId = await AsyncStorage.getItem('userId');
        if (!userId) {
            console.error('Kullanıcı ID bulunamadı');
            return;
        }

        // GPS kalitesi kontrolü
        const accuracy = location.coords.accuracy || 0;

        // Son konum bilgisini al
        const lastLocationStr = await AsyncStorage.getItem('lastBackgroundLocation');
        const lastLocation = lastLocationStr ? JSON.parse(lastLocationStr) : null;

        // Hız kontrolü (isteğe bağlı)
        const speed = location.coords.speed || 0;
        const speedKmh = speed * 3.6;

        // Yeni noktayı kaydet
        const newPoint = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            timestamp: new Date().toISOString(),
            accuracy: accuracy,
            speed: speed
        };


        // Son konumu güncelle
        await AsyncStorage.setItem('lastBackgroundLocation', JSON.stringify(newPoint));

        // Geçici noktaları al
        const tempPointsStr = await AsyncStorage.getItem('tempBackgroundPoints');
        let tempPoints = [];

        try {
            tempPoints = tempPointsStr ? JSON.parse(tempPointsStr) : [];
        } catch (parseError) {
            console.error('Geçici noktalar parse edilemedi:', parseError);
            tempPoints = [];
        }

        // Yeni noktayı ekle
        tempPoints.push(newPoint);
        await AsyncStorage.setItem('tempBackgroundPoints', JSON.stringify(tempPoints));

        // Belirli sayıda nokta biriktiğinde Firestore'a kaydet
        if (tempPoints.length >= 10) { // 5'ten 10'a çıkardık

            try {
                // Kesikli çizim sorununu çözmek için, son 2 noktayı bir sonraki gruba aktaracağız
                const pointsToSave = tempPoints.slice(0, -2); // Son iki nokta hariç tümünü kaydet
                const pointsToKeep = tempPoints.slice(-2); // Son iki noktayı sakla

                const pathRef = collection(db, `users/${userId}/paths`);
                await addDoc(pathRef, {
                    points: pointsToSave,
                    firstDiscovery: serverTimestamp(),
                    visitCount: 1,
                    type: 'discovered',
                    city: 'Arka Planda Çizildi',
                    district: 'Bilinmeyen',
                    createdInBackground: true,
                    backgroundDrawingSession: await AsyncStorage.getItem('backgroundDrawingSessionId') || new Date().toISOString()
                });

                // Geçici noktaları güncelle - sadece son iki noktayı tut
                await AsyncStorage.setItem('tempBackgroundPoints', JSON.stringify(pointsToKeep));

                // Başarılı kayıt bilgisini sakla
                const savedPathsCount = parseInt(await AsyncStorage.getItem('backgroundSavedPathsCount') || '0');
                await AsyncStorage.setItem('backgroundSavedPathsCount', (savedPathsCount + 1).toString());

            } catch (saveError) {
                console.error('Yol kaydedilemedi:', saveError);
            }
        }
    } catch (error) {
        console.error('Arka plan çizim işlemi hatası:', error);
    }
}); 