import React, { useEffect, useState, useRef } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Toast from 'react-native-toast-message';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Provider } from 'react-redux';
import { store } from './src/redux/store';
import RootPage from './src/navigations/RootPage';
import { AppState, Platform, Animated } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { auth } from './firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';
import { updateOnlineStatus } from './src/services/onlineStatusService';
import * as SplashScreen from 'expo-splash-screen';
import * as Updates from 'expo-updates';
import CustomSplashScreen from './src/components/CustomSplashScreen';

// Splash ekranının otomatik olarak gizlenmesini engelle
SplashScreen.preventAutoHideAsync();

// Global bir değişken ile güncelleme durumunu takip edelim
global.updateDownloaded = false;

const Stack = createNativeStackNavigator();
const navigationRef = React.createRef();

const App = () => {
  const [appState, setAppState] = useState(AppState.currentState);
  const [isConnected, setIsConnected] = useState(true);
  const [previousUser, setPreviousUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const currentUserRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const netInfoUnsubscribeRef = useRef(null);
  const appStateUnsubscribeRef = useRef(null);
  const [isAppReady, setIsAppReady] = useState(false);
  const [updateReady, setUpdateReady] = useState(false);
  const [isSplashAnimationComplete, setIsSplashAnimationComplete] = useState(false);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  // Online durumu güncelleme fonksiyonu
  const updateUserOnlineStatus = async (uid, status) => {
    // Sadece giriş yapmış ve aktif kullanıcı için güncelle
    try {
      if (uid && isAuthenticated && uid === currentUserRef.current) {
        await updateOnlineStatus(uid, status);
      }
    } catch (error) {
      // Sessizce hatayı ele al ve uygulama akışını bozmayalım
      console.warn('Kullanıcı durumu güncellenirken hata:', error.message);
    }
  };

  // Splash screen'i gizle
  const hideSplashScreen = async () => {
    if (isAppReady) {
      // Fade-out animasyonu başlat
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }).start(async () => {
        setIsSplashAnimationComplete(true);

        // Eğer güncelleme yüklendiyse ve uygulama hazırsa, yeniden başlat
        if (global.updateDownloaded && updateReady) {
          try {
            await Updates.reloadAsync();
          } catch (error) {
            console.error('Güncelleme yüklenirken hata:', error);
            // Güncelleme başarısız olursa, splashscreen'i gizle
            setTimeout(async () => {
              await SplashScreen.hideAsync();
            }, 500); // 0.5 saniye beklet
          }
        } else {
          // Güncelleme yoksa normal bir şekilde splashscreen'i gizle
          setTimeout(async () => {
            await SplashScreen.hideAsync();
          }, 500); // 0.5 saniye beklet
        }
      });
    }
  };

  // Splash screen'den güncelleme durumunu kontrol et
  const checkUpdateStatus = () => {
    setUpdateReady(global.updateDownloaded);
  };

  useEffect(() => {
    // Uygulama hazır olduğunda splash screen'i gizle
    if (isAppReady) {
      checkUpdateStatus();
      hideSplashScreen();
    }
  }, [isAppReady, updateReady]);

  // Event listener'ları temizle
  const cleanupListeners = async () => {
    if (netInfoUnsubscribeRef.current) {
      netInfoUnsubscribeRef.current();
      netInfoUnsubscribeRef.current = null;
    }
    if (appStateUnsubscribeRef.current) {
      appStateUnsubscribeRef.current.remove();
      appStateUnsubscribeRef.current = null;
    }


    // Eğer aktif kullanıcı varsa, offline yap
    if (currentUserRef.current) {
      try {
        await updateOnlineStatus(currentUserRef.current, false);
      } catch (error) {
        console.warn('Kullanıcı offline durumuna getirilirken hata:', error.message);
      }
    }
  };

  // AppState değişikliklerini işle
  const handleAppStateChange = async (nextAppState) => {
    // Eğer kullanıcı giriş yapmamışsa, hiçbir şey yapma
    if (!isAuthenticated || !currentUserRef.current) {
      return;
    }

    setAppState(nextAppState);
    const isActive = nextAppState === 'active';

    // Uygulama arka plana geçtiğinde veya aktif olmadığında
    if (!isActive) {
      try {
        await updateOnlineStatus(currentUserRef.current, false);
      } catch (error) {
        console.warn('Uygulama arka plandayken kullanıcı offline durumuna getirilirken hata:', error.message);
      }
      return;
    }

    // Uygulama aktif ve kullanıcı giriş yapmışsa
    if (isActive && isAuthenticated && currentUserRef.current) {
      try {
        await updateUserOnlineStatus(currentUserRef.current, isConnected);
      } catch (error) {
        console.warn('Uygulama aktifken kullanıcı durumu güncellenirken hata:', error.message);
      }
    }
  };

  useEffect(() => {
    // Kullanıcı oturum durumunu dinle
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      try {
        // Önce eski kullanıcıyı offline yap ve listener'ları temizle
        if (currentUserRef.current && currentUserRef.current !== user?.uid) {
          await cleanupListeners();
        }

        if (user) {
          // Kullanıcı giriş yapmışsa online tracking'i başlat
          currentUserRef.current = user.uid;
          setPreviousUser(user.uid);
          setIsAuthenticated(true);


          // İnternet bağlantısını dinle
          netInfoUnsubscribeRef.current = NetInfo.addEventListener(async state => {
            setIsConnected(state.isConnected);
            if (appState === 'active' && isAuthenticated) {
              await updateUserOnlineStatus(user.uid, state.isConnected);
            }
          });

          // Uygulama durumunu dinle
          appStateUnsubscribeRef.current = AppState.addEventListener('change', handleAppStateChange);

          // Sadece uygulama aktif ve internet varsa online yap
          const shouldBeOnline = appState === 'active' && isConnected;
          try {
            await updateOnlineStatus(user.uid, shouldBeOnline);
          } catch (error) {
            console.warn('Kullanıcı giriş durumu güncellenirken hata:', error.message);
          }

          // Global değişkeni ayarla
          global.currentUser = { uid: user.uid };
        } else {
          // Kullanıcı çıkış yaptıysa
          if (previousUser) {
            await cleanupListeners();
            currentUserRef.current = null;
            setPreviousUser(null);
          }
          setIsAuthenticated(false);
          global.currentUser = null;
        }
      } catch (error) {
        console.error('Auth kontrolü hatası:', error);
      } finally {
        setLoading(false);
        // Yükleme tamamlandığında uygulama hazır durumuna geçir
        setIsAppReady(true);
      }
    });

    // Cleanup fonksiyonu
    return () => {
      cleanupListeners().then(() => {
        unsubscribeAuth();
      });
    };
  }, [isAuthenticated]);

  if (!isAppReady || !isSplashAnimationComplete) {
    return (
      <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
        <CustomSplashScreen />
      </Animated.View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Provider store={store}>
        <NavigationContainer ref={navigationRef}>
          <Stack.Navigator>
            <Stack.Screen
              name="RootPage"
              component={RootPage}
              options={{
                headerShown: false,
                presentation: 'fullScreenModal'
              }}
            />
          </Stack.Navigator>
        </NavigationContainer>
        <Toast />
      </Provider>
    </GestureHandlerRootView>
  );
};

export default App;