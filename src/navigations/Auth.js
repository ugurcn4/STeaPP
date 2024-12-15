import React from 'react'
import { SignupPage, LoginPage } from '../screens/index.js'
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ForgotPassword from '../screens/forgotPassword.js';

const Stack = createNativeStackNavigator();

const Auth = () => {
    return (
        <Stack.Navigator
            initialRouteName="Giriş Yap"
            ScreenOptions={{ headerShown: false }}>
            <Stack.Screen name="Giriş Yap" component={LoginPage} />
            <Stack.Screen name="Kayıt Ol" component={SignupPage} />
            <Stack.Screen name="ForgotPassword" component={ForgotPassword} options={{ title: 'Şifremi Unuttum' }} />

        </Stack.Navigator>
    )
}

export default Auth

