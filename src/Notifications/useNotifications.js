import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import {
    updateNotificationSetting,
    setNotificationSettings,
    setLoading,
    setError
} from './slices/notificationSlice';
import { registerForPushNotifications, setupNotificationListeners } from './notificationConfig';
import NotificationService from '../services/notificationService';

const NOTIFICATION_SETTINGS_KEY = '@notification_settings';

export const useNotifications = (navigation) => {
    const dispatch = useDispatch();
    const settings = useSelector(state => state.notifications.settings);
    const loading = useSelector(state => state.notifications.loading);
    const error = useSelector(state => state.notifications.error);
    const [pushToken, setPushToken] = useState(null);

    // Auth state'ini güvenli bir şekilde al
    const auth = useSelector(state => state.auth);
    const user = auth?.user;

    useEffect(() => {
        loadNotificationSettings();
        if (settings?.allNotifications) {
            initializePushNotifications();
        }
        const cleanup = setupNotificationListeners(navigation);
        return cleanup;
    }, [navigation]);

    const initializePushNotifications = async () => {
        try {
            const token = await registerForPushNotifications();
            setPushToken(token);

            // User kontrolünü güvenli bir şekilde yap
            if (token && user?.id) {
                try {
                    await NotificationService.registerDeviceToken(user.id, token);
                } catch (error) {
                    console.warn('Token kaydedilemedi:', error);
                }
            }
        } catch (error) {
            console.error('Push notification başlatma hatası:', error);
            dispatch(setError('Push bildirimleri başlatılamadı'));
        }
    };

    // Bildirim ayarlarını yükle
    const loadNotificationSettings = async () => {
        try {
            dispatch(setLoading(true));
            const savedSettings = await AsyncStorage.getItem(NOTIFICATION_SETTINGS_KEY);

            if (savedSettings) {
                dispatch(setNotificationSettings(JSON.parse(savedSettings)));
            }
        } catch (error) {
            dispatch(setError('Bildirim ayarları yüklenemedi'));
            console.error('Bildirim ayarları yükleme hatası:', error);
        } finally {
            dispatch(setLoading(false));
        }
    };

    // Bildirim ayarlarını kaydet
    const saveNotificationSettings = async (newSettings) => {
        try {
            await AsyncStorage.setItem(
                NOTIFICATION_SETTINGS_KEY,
                JSON.stringify(newSettings)
            );
        } catch (error) {
            console.error('Bildirim ayarları kaydetme hatası:', error);
        }
    };

    // Bildirim iznini kontrol et ve güncelle
    const updateNotificationPermissions = async () => {
        try {
            const { status: existingStatus } = await Notifications.getPermissionsAsync();
            let finalStatus = existingStatus;

            if (existingStatus !== 'granted') {
                const { status } = await Notifications.requestPermissionsAsync();
                finalStatus = status;
            }

            if (finalStatus !== 'granted') {
                dispatch(updateNotificationSetting({
                    key: 'allNotifications',
                    value: false
                }));
                throw new Error('Bildirim izni verilmedi');
            }
        } catch (error) {
            console.error('Bildirim izni hatası:', error);
        }
    };

    // Bildirim ayarını değiştir
    const toggleNotificationSetting = async (key, value) => {
        try {
            if (key === 'allNotifications') {
                if (value) {
                    await initializePushNotifications();
                } else {
                    // User ve token kontrolünü güvenli bir şekilde yap
                    if (pushToken && user?.id) {
                        try {
                            await NotificationService.unregisterDeviceToken(user.id, pushToken);
                        } catch (error) {
                            console.warn('Token silinemedi:', error);
                        }
                    }
                    setPushToken(null);
                }
            }

            dispatch(updateNotificationSetting({ key, value }));
            await saveNotificationSettings({
                ...settings,
                [key]: value
            });
        } catch (error) {
            console.error('Bildirim ayarı değiştirme hatası:', error);
            dispatch(setError('Bildirim ayarı değiştirilemedi'));
        }
    };

    return {
        settings,
        loading,
        error,
        pushToken,
        toggleNotificationSetting,
        loadNotificationSettings
    };
};
