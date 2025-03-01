import { rtdb } from '../../firebaseConfig';
import { ref, onValue, set, onDisconnect, serverTimestamp, off, get } from 'firebase/database';
import NetInfo from '@react-native-community/netinfo';
import { AppState } from 'react-native';
import { goOffline, goOnline } from 'firebase/database';

// Kullanıcının çevrimiçi durumunu günceller
export const updateOnlineStatus = async (userId, isOnline = true) => {
    try {
        if (!userId) return;

        const userStatusRef = ref(rtdb, `users/${userId}/status`);

        // Önce mevcut durumu kontrol et
        const snapshot = await get(userStatusRef);
        const currentStatus = snapshot.val();

        // Eğer kullanıcı zaten offline ise ve offline yapmaya çalışıyorsak, işlemi atla
        if (!isOnline && currentStatus?.state === 'offline') {
            return;
        }

        const status = {
            state: isOnline ? 'online' : 'offline',
            lastSeen: serverTimestamp(),
        };

        // Önce disconnect handler'ı temizle
        await onDisconnect(userStatusRef).cancel();

        // Durumu güncelle
        await set(userStatusRef, status);

        // Eğer online yapılıyorsa, disconnect handler'ı ayarla
        if (isOnline) {
            await onDisconnect(userStatusRef).set({
                state: 'offline',
                lastSeen: serverTimestamp(),
            });
        }
    } catch (error) {
        console.error('Çevrimiçi durumu güncellenirken hata:', error);
    }
};

// Belirli bir kullanıcının durumunu dinler
export const subscribeToUserStatus = (userId, callback) => {
    if (!userId) return () => { };

    const userStatusRef = ref(rtdb, `users/${userId}/status`);

    return onValue(userStatusRef, (snapshot) => {
        const status = snapshot.val() || { state: 'offline', lastSeen: null };
        callback({
            isOnline: status.state === 'online',
            lastSeen: status.lastSeen,
        });
    });
};

// Bağlantı durumunu izler ve gerekli güncellemeleri yapar
export const initializeOnlineStatusTracking = (userId) => {
    if (!userId) return;

    // İnternet bağlantısını izle
    NetInfo.addEventListener(state => {
        if (state.isConnected) {
            updateOnlineStatus(userId, true);
        } else {
            updateOnlineStatus(userId, false);
        }
    });

    // Uygulama durumunu izle
    AppState.addEventListener('change', (nextAppState) => {
        if (nextAppState === 'active') {
            updateOnlineStatus(userId, true);
        } else if (nextAppState === 'background' || nextAppState === 'inactive') {
            updateOnlineStatus(userId, false);
        }
    });
};

// Son görülme zamanını günceller
export const updateLastSeen = async (userId) => {
    try {
        if (!userId) return;

        const userStatusRef = ref(rtdb, `users/${userId}/status`);
        await set(userStatusRef, {
            state: 'offline',
            lastSeen: serverTimestamp(),
        });
    } catch (error) {
        console.error('Son görülme zamanı güncellenirken hata:', error);
    }
};

// Çıkış yapıldığında çevrimdışı duruma geçiş
export const setOfflineOnLogout = async (userId) => {
    try {
        if (!userId) return;

        const userStatusRef = ref(rtdb, `users/${userId}/status`);
        const statusRef = ref(rtdb, `users/${userId}`);

        // Tüm event listener'ları temizle
        off(statusRef);

        // Disconnect handler'ı temizle
        await onDisconnect(userStatusRef).cancel();

        // Offline durumuna geç
        await set(userStatusRef, {
            state: 'offline',
            lastSeen: serverTimestamp(),
        });

        // Tüm bağlantıları kapat
        goOffline(rtdb);
        await goOnline(rtdb);

    } catch (error) {
        console.error('Çıkış yapılırken çevrimdışı duruma geçilemedi:', error);
    }
};