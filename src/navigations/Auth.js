import React from 'react'
import { SignupPage, LoginPage } from '../screens/index.js'
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
    return (
        <Stack.Navigator
            initialRouteName="Giriş Yap"
            ScreenOptions={{ headerShown: false }}>
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

