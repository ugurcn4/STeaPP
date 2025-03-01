import React, { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SignupPage, LoginPage, OnboardingScreen } from '../screens/index.js'
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ForgotPassword from '../screens/forgotPassword.js';
import PermissionsPage from '../screens/SettingsPageScreens/PermissionsPage';
import PrivacyPage from '../screens/SettingsPageScreens/PrivacyPage';
import HelpSupportPage from '../screens/SettingsPageScreens/HelpSupportPage';
import AboutPage from '../screens/SettingsPageScreens/AboutPage';
import InviteFriendsPage from '../screens/SettingsPageScreens/InviteFriendsPage';
import NearbyRestaurants from '../screens/HomePageCards/NearbyRestaurants';

const Stack = createNativeStackNavigator();

const Auth = () => {
    const [isFirstLaunch, setIsFirstLaunch] = useState(false);

    useEffect(() => {
        checkIfFirstLaunch();
    }, []);

    const checkIfFirstLaunch = async () => {
        try {
            const hasLaunched = await AsyncStorage.getItem('hasLaunched');
            if (hasLaunched === null) {
                await AsyncStorage.setItem('hasLaunched', 'true');
                setIsFirstLaunch(true);
            } else {
                setIsFirstLaunch(false);
            }
        } catch (error) {
            console.error('İlk başlatma kontrolü hatası:', error);
            setIsFirstLaunch(false);
        }
    };

    return (
        <Stack.Navigator
            initialRouteName={isFirstLaunch ? "Onboarding" : "Giriş Yap"}
            screenOptions={{ headerShown: false }}>
            <Stack.Screen name="Onboarding" component={OnboardingScreen} />
            <Stack.Screen name="Giriş Yap" component={LoginPage} />
            <Stack.Screen name="Kayıt Ol" component={SignupPage} />
            <Stack.Screen name="ForgotPassword" component={ForgotPassword} options={{ title: 'Şifremi Unuttum' }} />
            <Stack.Screen
                name="Izinler"
                component={PermissionsPage}
                options={{
                    headerShown: false,
                }}
            />
            <Stack.Screen
                name="Gizlilik"
                component={PrivacyPage}
                options={{
                    headerShown: false,
                }}
            />
            <Stack.Screen
                name="YardimDestek"
                component={HelpSupportPage}
                options={{
                    headerShown: false,
                }}
            />
            <Stack.Screen
                name="Hakkinda"
                component={AboutPage}
                options={{
                    headerShown: false,
                }}
            />
            <Stack.Screen
                name="Arkadaşlarımı Davet Et"
                component={InviteFriendsPage}
                options={{
                    headerShown: false,
                }}
            />
            <Stack.Screen
                name="NearbyRestaurants"
                component={NearbyRestaurants}
                options={{
                    title: 'Yakındaki Restoranlar',
                    headerStyle: {
                        backgroundColor: '#fff',
                    },
                    headerTintColor: '#2C3E50',
                    headerTitleStyle: {
                        fontWeight: 'bold',
                    },
                }}
            />
        </Stack.Navigator>
    )
}

export default Auth

