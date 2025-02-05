// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { initializeAuth, getReactNativePersistence, getAuth } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
    apiKey: "AIzaSyBdzXdPV3b0eSxTlCwnPrmiJ1qqqfScF5Q",
    authDomain: "steapp-f9fe2.firebaseapp.com",
    projectId: "steapp-f9fe2",
    storageBucket: "steapp-f9fe2.appspot.com",
    messagingSenderId: "54620040129",
    appId: "1:54620040129:web:79be3774262e51ccf55d40"
};

let app;
let auth;

// Firebase app'i bir kere başlat
if (getApps().length === 0) {
    app = initializeApp(firebaseConfig);
    // Auth'u AsyncStorage ile başlat
    auth = initializeAuth(app, {
        persistence: getReactNativePersistence(AsyncStorage)
    });
} else {
    app = getApp();
    auth = getAuth(app);
}

// Diğer servisleri başlat
const db = getFirestore(app);
const storage = getStorage(app);

console.log('Firebase servisleri başlatıldı:', {
    appInitialized: !!app,
    authInitialized: !!auth,
    dbInitialized: !!db,
    storageInitialized: !!storage
});

// Exports
export { auth, db, storage };
export default app;