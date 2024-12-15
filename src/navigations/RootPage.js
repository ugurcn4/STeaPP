// Tanım: isLogged değerine göre Auth veya Logged'ı görüntüleyen kod
import React from 'react'
import Auth from './Auth'
import { NavigationContainer } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import CustomNavBar from '../components/CustomNavBar';
import app from '../../firebaseConfig';



const RootPage = () => {

    const { isAuth } = useSelector((state) => state.user)

    return (
        <NavigationContainer
            ScreenOptions={{ headerShown: false }}>
            {
                !isAuth ? <Auth /> : <CustomNavBar />
            }
        </NavigationContainer>
    )
}

export default RootPage
