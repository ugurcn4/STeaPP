import { initializeApp } from "firebase/app";
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
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

// Firebase uygulamasını başlat
const app = initializeApp(firebaseConfig);

// Auth servisini başlat
const auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage)
});

// Firestore ve Storage servislerini başlat
const db = getFirestore(app);
const storage = getStorage(app);

// Servisleri dışa aktar
export { app, auth, db, storage };

// Eski getter fonksiyonlarını geriye dönük uyumluluk için tut
export const getFirebaseApp = () => app;
export const getFirebaseAuth = () => auth;
export const getFirebaseDb = () => db;
export const getFirebaseStorage = () => storage;