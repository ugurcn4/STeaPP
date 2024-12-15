import React from 'react'
import {
    HomePage,
    MapPage,
    FriendsPage,
    LoginPage,
    SignupPage,
    Hakkinda,
    Bildirimler
} from '../screens'
import { createNativeStackNavigator } from '@react-navigation/native-stack';

const Stack = createNativeStackNavigator();

const Logged = () => {
    return (
        <Stack.Navigator
            initialRouteName='Ana Sayfa'
            screenOptions={{
                headerShown: false, // Tüm ekranlar için header'ı gizlemek için
            }}
        >
            <Stack.Screen
                name="Giriş Yap"
                component={LoginPage}
                options={{ headerShown: false }}
            />
            <Stack.Screen
                name="Kayıt Ol"
                component={SignupPage}
                options={{ headerShown: false }}
            />
            <Stack.Screen
                name="Ana Sayfa"
                component={HomePage}
                options={{ headerShown: false }}
            />
            <Stack.Screen
                name="Harita"
                component={MapPage}
                options={{ headerShown: false }}
            />
            <Stack.Screen
                name="Arkadaşlar"
                component={FriendsPage}
                options={{ headerShown: false }}
            />
            <Stack.Screen
                name="Hakkinda"
                component={Hakkinda}
                options={{ headerShown: false }}
            />
            <Stack.Screen
                name="Bildirimler"
                component={Bildirimler}
                options={{ headerShown: false }}
            />
        </Stack.Navigator>
    )
}

export default Logged
