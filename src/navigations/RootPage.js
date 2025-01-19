// Tanım: isLogged değerine göre Auth veya Logged'ı görüntüleyen kod
import React from 'react'
import Auth from './Auth'
import MainStack from './MainStack'
import { NavigationContainer } from '@react-navigation/native';
import { useSelector } from 'react-redux';

const RootPage = () => {
    const { isAuth } = useSelector((state) => state.user)

    return (
        <NavigationContainer
            ScreenOptions={{ headerShown: false }}>
            {
                !isAuth ? <Auth /> : <MainStack />
            }
        </NavigationContainer>
    )
}

export default RootPage
