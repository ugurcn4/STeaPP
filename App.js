import React, { useEffect, useState, useRef } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Toast from 'react-native-toast-message';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Provider } from 'react-redux';
import { store } from './src/redux/store';
import RootPage from './src/navigations/RootPage';
import { AppState, Platform } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { auth } from './firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';
import { updateOnlineStatus } from './src/services/onlineStatusService';

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

  // Online durumu güncelleme fonksiyonu
  const updateUserOnlineStatus = async (uid, status) => {
    // Sadece giriş yapmış ve aktif kullanıcı için güncelle
    if (uid && isAuthenticated && uid === currentUserRef.current) {
      await updateOnlineStatus(uid, status);
    }
  };

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
      await updateOnlineStatus(currentUserRef.current, false);
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
      await updateOnlineStatus(currentUserRef.current, false);
      return;
    }

    // Uygulama aktif ve kullanıcı giriş yapmışsa
    if (isActive && isAuthenticated && currentUserRef.current) {
      await updateUserOnlineStatus(currentUserRef.current, isConnected);
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
          await updateOnlineStatus(user.uid, shouldBeOnline);

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
      }
    });

    // Cleanup fonksiyonu
    return () => {
      cleanupListeners().then(() => {
        unsubscribeAuth();
      });
    };
  }, [isAuthenticated]);


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