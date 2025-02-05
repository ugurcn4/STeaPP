import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import {
    updateNotificationSetting,
    setNotificationSettings,
    setLoading,
    setError
} from './slices/notificationSlice';

const NOTIFICATION_SETTINGS_KEY = '@notification_settings';

export const useNotifications = () => {
    const dispatch = useDispatch();
    const settings = useSelector(state => state.notifications.settings);
    const loading = useSelector(state => state.notifications.loading);
    const error = useSelector(state => state.notifications.error);

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
            if (key === 'allNotifications' && value) {
                await updateNotificationPermissions();
            }

            dispatch(updateNotificationSetting({ key, value }));
            await saveNotificationSettings({
                ...settings,
                [key]: value
            });
        } catch (error) {
            console.error('Bildirim ayarı değiştirme hatası:', error);
        }
    };

    return {
        settings,
        loading,
        error,
        toggleNotificationSetting,
        loadNotificationSettings
    };
};
