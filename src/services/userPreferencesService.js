import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../firebaseConfig';

export const getUserPreferences = async (userId) => {
    try {
        const userDoc = doc(db, 'users', userId);
        const docSnap = await getDoc(userDoc);

        if (docSnap.exists()) {
            return docSnap.data().preferences || {};
        }
        return {};
    } catch (error) {
        console.error('Kullanıcı tercihleri alınamadı:', error);
        return {};
    }
};

export const updateUserPreferences = async (userId, preferences) => {
    try {
        const userDoc = doc(db, 'users', userId);
        await setDoc(userDoc, { preferences }, { merge: true });
    } catch (error) {
        console.error('Kullanıcı tercihleri güncellenemedi:', error);
    }
}; 