import * as TaskManager from 'expo-task-manager';
import * as Location from 'expo-location';
import { collection, addDoc } from 'firebase/firestore';
import { getAuth, onAuthStateChanged } from 'firebase/auth'; // Firebase Authentication'dan ek import
import { db } from '../../firebaseConfig';

const BACKGROUND_LOCATION_TASK = "BACKGROUND_LOCATION_TASK";
let currentUserId = null; // Kullanıcı UID'sini saklamak için global bir değişken

// Oturum açan kullanıcıyı dinleyin ve UID'yi alın
const auth = getAuth();
onAuthStateChanged(auth, (user) => {
    if (user) {
        currentUserId = user.uid; // Kullanıcı oturumu açtıysa UID'yi kaydet
        console.log('Kullanıcı oturum açtı, UID:', currentUserId);
    } else {
        currentUserId = null; // Kullanıcı çıktıysa UID'yi null yap
        console.warn('Kullanıcı oturumu kapattı veya oturum açmamış.');
    }
});

// Arka plan görevini tanımlayın
TaskManager.defineTask(BACKGROUND_LOCATION_TASK, async ({ data, error }) => {
    if (error) {
        console.error('Arka plan konum takibi hatası:', error);
        return;
    }

    if (data) {
        const { locations } = data;

        // Alınan konum
        const location = locations[0];

        // Eğer kullanıcı oturumu yoksa konum kaydedilmesin
        if (!currentUserId) {
            console.warn('Kullanıcı oturumu açık değil. Konum kaydedilemiyor.');
            return;
        }

        if (location) {
            try {
                // Firestore'a konum verilerini yazın
                await addDoc(collection(db, `users/${currentUserId}/locations`), {
                    enlem: location.coords.latitude,
                    boylam: location.coords.longitude,
                    timestamp: new Date(),
                });
                console.log("Konum Firestore'a başarıyla yazıldı.");
            } catch (err) {
                console.error("Konum Firestore'a yazılamadı:", err);
            }
        }
    }
});

// Arka plan izlemeyi başlatma fonksiyonu
export const startBackgroundLocationTask = async () => {
    try {
        // İzin talep et
        const { status } = await Location.requestBackgroundPermissionsAsync();
        if (status !== 'granted') {
            console.warn("Arka plan konum izni reddedildi!");
            return;
        }

        // Konum izlemeyi başlat
        await Location.startLocationUpdatesAsync(BACKGROUND_LOCATION_TASK, {
            accuracy: Location.Accuracy.High,
            timeInterval: 5000, // Her 5 saniyede bir konum al
            distanceInterval: 10, // 10 metre hareket olduğunda konum al
            showsBackgroundLocationIndicator: true, // Kullanıcıya arka planda çalışıldığı belirtilsin
        });

        console.log("Arka plan konum izleme başlatıldı.");
    } catch (error) {
        console.error("Arka plan konum izleme başlatılamadı:", error);
    }
};

// Arka plan izlemeyi durdurma fonksiyonu
export const stopBackgroundLocationTask = async () => {
    try {
        // Arka plan konum izlemeyi durdur
        await Location.stopLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
        console.log("Arka plan konum izleme durduruldu.");
    } catch (error) {
        console.error("Arka plan izleme durdurulamadı:", error);
    }
};