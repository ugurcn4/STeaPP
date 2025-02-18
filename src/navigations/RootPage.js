// Tanım: isLogged değerine göre Auth veya Logged'ı görüntüleyen kod
import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { autoLogin } from '../redux/userSlice';
import Auth from './Auth';
import MainStack from './MainStack';
import { createStackNavigator } from '@react-navigation/stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getAuth, onAuthStateChanged } from 'firebase/auth';

const Stack = createStackNavigator();

const RootPage = () => {
    const [loading, setLoading] = useState(true);
    const { isAuth } = useSelector((state) => state.user);
    const dispatch = useDispatch();

    useEffect(() => {
        const auth = getAuth();
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            try {
                if (user) {
                    const userData = await AsyncStorage.getItem('userData');
                    const userToken = await AsyncStorage.getItem('userToken');

                    if (userData && userToken) {
                        await dispatch(autoLogin()).unwrap();
                        // Kullanıcı giriş yaptığında token kaydını yap
                        const { registerForPushNotifications } = await import('../Notifications/notificationConfig');
                        await registerForPushNotifications();
                    }
                } else {
                    // Kullanıcı oturumu kapanmışsa local storage'ı temizle
                    await AsyncStorage.multiRemove(['userToken', 'userData', 'pushToken']);
                }
            } catch (error) {
                console.error('Auth kontrolü hatası:', error);
            } finally {
                setLoading(false);
            }
        });

        return () => unsubscribe();
    }, [dispatch]);

    if (loading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color="#0000ff" />
            </View>
        );
    }

    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            {!isAuth ? (
                <Stack.Screen name="Auth" component={Auth} />
            ) : (
                <Stack.Screen
                    name="MainStack"
                    component={MainStack}
                />
            )}
        </Stack.Navigator>
    );
};

export default RootPage;
