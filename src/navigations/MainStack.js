import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import CustomNavBar from '../components/CustomNavBar';
import NotificationPage from '../screens/SettingsPageScreens/NotificationPage';
import PermissionsPage from '../screens/SettingsPageScreens/PermissionsPage';
import PrivacyPage from '../screens/SettingsPageScreens/PrivacyPage';
import HelpSupportPage from '../screens/SettingsPageScreens/HelpSupportPage';
import AboutPage from '../screens/SettingsPageScreens/AboutPage';
import InviteFriendsPage from '../screens/SettingsPageScreens/InviteFriendsPage';
import { useSelector } from 'react-redux';

const Stack = createNativeStackNavigator();

const MainStack = () => {
    const theme = useSelector((state) => state.theme.theme);

    return (
        <Stack.Navigator
            screenOptions={{
                headerShown: false // Tüm header'ı gizle
            }}
        >
            <Stack.Screen
                name="MainTabs"
                component={CustomNavBar}
            />
            <Stack.Screen
                name="Bildirimler"
                component={NotificationPage}
            />
            <Stack.Screen
                name="Izinler"
                component={PermissionsPage}
            />
            <Stack.Screen
                name="Gizlilik"
                component={PrivacyPage}
            />
            <Stack.Screen
                name="YardimDestek"
                component={HelpSupportPage}
            />
            <Stack.Screen
                name="Hakkinda"
                component={AboutPage}
            />
            <Stack.Screen
                name="Arkadaşlarımı Davet Et"
                component={InviteFriendsPage}
            />
        </Stack.Navigator>
    );
};

export default MainStack; 