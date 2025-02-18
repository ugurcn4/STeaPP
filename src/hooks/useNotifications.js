import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import {
    updateNotificationSettings,
    setFCMToken,
    setError,
    addNotification
} from '../redux/slices/notificationSlice';

export const useNotifications = () => {
    const dispatch = useDispatch();
    const {
        settings,
        fcmToken,
        loading,
        error,
        notifications,
        unreadCount
    } = useSelector(state => state.notifications);
    const user = useSelector(state => state.auth.user);

    useEffect(() => {
        if (settings?.allNotifications && user?.id) {
            registerForPushNotifications();
        }
    }, [settings?.allNotifications, user?.id]);

    const registerForPushNotifications = async () => {
        try {
            if (!Device.isDevice) {
                throw new Error('Bildirimler yalnızca fiziksel cihazlarda çalışır');
            }

            const { status: existingStatus } = await Notifications.getPermissionsAsync();
            let finalStatus = existingStatus;

            if (existingStatus !== 'granted') {
                const { status } = await Notifications.requestPermissionsAsync();
                finalStatus = status;
            }

            if (finalStatus !== 'granted') {
                throw new Error('Bildirim izni verilmedi');
            }

            // FCM token al
            const token = await Notifications.getExpoPushTokenAsync({
                projectId: Constants.expoConfig.extra.eas.projectId,
            });

            // Cihaz bilgilerini topla
            const deviceInfo = {
                platform: Platform.OS,
                deviceId: Device.deviceName,
                deviceName: Device.modelName,
                lastUsed: new Date()
            };

            // Token'ı Firestore'a kaydet
            if (user?.id) {
                const userRef = doc(db, 'users', user.id);
                await updateDoc(userRef, {
                    [`fcmTokens.${deviceInfo.deviceId}`]: {
                        token: token.data,
                        ...deviceInfo
                    }
                });
            }

            dispatch(setFCMToken(token.data));

            // Android için bildirim kanalı oluştur
            if (Platform.OS === 'android') {
                await Notifications.setNotificationChannelAsync('default', {
                    name: 'Varsayılan',
                    importance: Notifications.AndroidImportance.MAX,
                    vibrationPattern: [0, 250, 250, 250],
                    lightColor: '#FF231F7C',
                });
            }

            // Bildirim dinleyicisini ayarla
            const subscription = Notifications.addNotificationReceivedListener(notification => {
                dispatch(addNotification(notification.request.content.data));
            });

            return () => subscription.remove();
        } catch (error) {
            console.error('Push notification kaydı hatası:', error);
            dispatch(setError(error.message));
        }
    };

    const toggleNotificationSetting = async (key, value) => {
        try {
            if (key === 'allNotifications' && value && !fcmToken) {
                await registerForPushNotifications();
            }

            if (user?.id) {
                dispatch(updateNotificationSettings({
                    userId: user.id,
                    settings: {
                        ...settings,
                        [key]: value
                    }
                }));
            }
        } catch (error) {
            console.error('Bildirim ayarı değiştirme hatası:', error);
            dispatch(setError(error.message));
        }
    };

    return {
        settings,
        loading,
        error,
        fcmToken,
        notifications,
        unreadCount,
        toggleNotificationSetting,
        registerForPushNotifications
    };
};

// Bildirim yapılandırması
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
    }),
}); 