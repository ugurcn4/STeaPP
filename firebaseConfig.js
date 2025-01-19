// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';
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

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = initializeAuth(app, {
    persistence: getReactNativePersistence(ReactNativeAsyncStorage)
});


const storage = getStorage(app);

const db = getFirestore(app);

export { auth, db, storage };
export default app;