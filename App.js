import React, { useEffect, useState } from 'react';
import RootPage from './src/navigations/RootPage';
import { Provider } from 'react-redux';
import { store } from './src/redux/store';
import Toast from 'react-native-toast-message';
import * as Updates from 'expo-updates';
import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { NavigationContainer } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

const isExpoGo = Constants.appOwnership === 'expo';

// Bildirim davranışını yapılandır
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

const App = () => {


  // Güncelleme denetimi sadece production build'de çalışsın
  useEffect(() => {
    const checkForUpdates = async () => {
      // Expo Go'da güncelleme kontrolü yapma
      if (isExpoGo) {
        return;
      }

      setIsCheckingForUpdate(true);
      try {
        const update = await Updates.checkForUpdateAsync();
        if (update.isAvailable) {
          setIsUpdateAvailable(true);
        }
      } catch (e) {
        console.error('Güncelleme kontrolü sırasında hata oluştu:', e);
      } finally {
        setIsCheckingForUpdate(false);
      }
    };

    checkForUpdates();
  }, []);

  useEffect(() => {
    // Bildirim izinlerini kontrol et
    const checkNotificationPermissions = async () => {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        return;
      }
    };

    checkNotificationPermissions();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Provider store={store}>
        <NavigationContainer>
          <RootPage />
        </NavigationContainer>
        <Toast />
      </Provider>
    </GestureHandlerRootView>
  );
};

export default App;