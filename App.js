import React, { useEffect, useState } from 'react';
import RootPage from './src/navigations/RootPage';
import { Provider } from 'react-redux';
import { store } from './src/redux/store';
import Toast from 'react-native-toast-message';
import { View, Text, Button, StyleSheet, ActivityIndicator } from 'react-native';
import * as Updates from 'expo-updates';
import { startBackgroundLocationTask } from './src/services/BackgroundLocationTask'; // Arka plan izleme fonksiyonunu içe aktarın

const App = () => {
  const [isCheckingForUpdate, setIsCheckingForUpdate] = useState(false);
  const [isUpdateAvailable, setIsUpdateAvailable] = useState(false);
  const [isUpdateDownloading, setIsUpdateDownloading] = useState(false);

  // Uygulama yüklendiğinde arka plan konum izlemeyi başlat
  useEffect(() => {
    const initializeBackgroundTasks = async () => {
      try {
        console.log('Arka plan konum izleme başlatılıyor...');
        await startBackgroundLocationTask(); // Arka plan konum izleme başlatılır
      } catch (err) {
        console.error('Arka plan konum izleme başlatılamadı:', err);
      }
    };

    initializeBackgroundTasks();
  }, []);

  // Güncelleme denetimi
  useEffect(() => {
    const checkForUpdates = async () => {
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

  const handleUpdate = async () => {
    setIsUpdateDownloading(true);
    try {
      await Updates.fetchUpdateAsync();
      await Updates.reloadAsync();
    } catch (e) {
      console.error('Güncelleme yüklenirken hata oluştu:', e);
    } finally {
      setIsUpdateDownloading(false);
    }
  };

  return (
      <Provider store={store}>
        <>
          {isCheckingForUpdate && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#0000ff" />
                <Text>Güncellemeler kontrol ediliyor...</Text>
              </View>
          )}
          {!isCheckingForUpdate && isUpdateAvailable && (
              <View style={styles.updateContainer}>
                <Text>Bir güncelleme mevcut!</Text>
                <Button title="Şimdi Güncelle" onPress={handleUpdate} />
              </View>
          )}
          {!isCheckingForUpdate && !isUpdateAvailable && (
              <>
                <RootPage />
                <Toast />
              </>
          )}
          {isUpdateDownloading && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#0000ff" />
                <Text>Güncelleme indiriliyor...</Text>
              </View>
          )}
        </>
      </Provider>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  updateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default App;