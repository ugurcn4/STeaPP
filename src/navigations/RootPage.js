// Tanım: isLogged değerine göre Auth veya Logged'ı görüntüleyen kod
import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { autoLogin } from '../redux/userSlice';
import { loadLanguage } from '../redux/slices/languageSlice';
import Auth from './Auth';
import MainStack from './MainStack';
import { createStackNavigator } from '@react-navigation/stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { loadI18nLanguage } from '../i18n/i18n';

const Stack = createStackNavigator();

const RootPage = () => {
    const [loading, setLoading] = useState(true);
    const { isAuth } = useSelector((state) => state.user);
    const language = useSelector((state) => state.language.language);
    const dispatch = useDispatch();

    // Dil değiştiğinde i18n'i güncelle
    useEffect(() => {
        if (language) {
            loadI18nLanguage(language);
        }
    }, [language]);

    useEffect(() => {
        const auth = getAuth();
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            try {
                // Dil ayarlarını yükle
                dispatch(loadLanguage());

                if (user) {
                    const userData = await AsyncStorage.getItem('userData');
                    const userToken = await AsyncStorage.getItem('userToken');

                    if (userData && userToken) {
                        try {
                            await dispatch(autoLogin()).unwrap();
                        } catch (error) {
                            console.error('AutoLogin hatası:', error);
                        }
                    }
                }
            } catch (error) {
                console.error('Oturum kontrolü hatası:', error);
            } finally {
                // Her durumda loading'i false yap
                setLoading(false);
            }
        });

        // Timeout ekleyelim
        const timeoutId = setTimeout(() => {
            setLoading(false);
        }, 5000); // 5 saniye sonra loading'i zorla kapat

        return () => {
            unsubscribe();
            clearTimeout(timeoutId);
        };
    }, [dispatch]);

    if (loading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
                <ActivityIndicator size="large" color="#2196F3" />
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
