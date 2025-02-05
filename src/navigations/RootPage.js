// Tanım: isLogged değerine göre Auth veya Logged'ı görüntüleyen kod
import React from 'react';
import { useSelector } from 'react-redux';
import Auth from './Auth';
import MainStack from './MainStack';
import { createStackNavigator } from '@react-navigation/stack';

const Stack = createStackNavigator();

const RootPage = () => {
    const { isAuth } = useSelector((state) => state.user);

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
