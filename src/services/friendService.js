import { db } from '../../firebaseConfig';
import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';
import { getCurrentUserUid } from './friendFunctions';

// Arkadaşları getir
export const getFriends = async (userId) => {
    try {
        const userRef = doc(db, 'users', userId);
        const userDoc = await getDoc(userRef);
        const userData = userDoc.data();

        if (!userData.friends) {
            return [];
        }

        // Arkadaşların detaylı bilgilerini al
        const friendPromises = userData.friends.map(async (friendId) => {
            try {
                const friendDoc = await getDoc(doc(db, 'users', friendId));
                if (friendDoc.exists()) {
                    return {
                        id: friendId,
                        ...friendDoc.data(),
                        name: friendDoc.data().informations?.name || 'İsimsiz Kullanıcı',
                        profilePicture: friendDoc.data().informations?.profileImage,
                        username: friendDoc.data().informations?.username,
                        email: friendDoc.data().informations?.email
                    };
                }
                return null;
            } catch (error) {
                console.error(`${friendId} için detaylar alınamadı:`, error);
                return null;
            }
        });

        const friends = await Promise.all(friendPromises);
        return friends.filter(friend => friend !== null);
    } catch (error) {
        console.error('Arkadaşları getirme hatası:', error);
        throw error;
    }
};

// Arkadaş detaylarını getir
export const getFriendDetails = async (friendId) => {
    try {
        const friendDoc = await getDoc(doc(db, 'users', friendId));
        if (!friendDoc.exists()) {
            return null;
        }
        return {
            id: friendId,
            ...friendDoc.data()
        };
    } catch (error) {
        console.error('Arkadaş detayları alınırken hata:', error);
        return null;
    }
};

// Kullanıcı detaylarını getir
export const getUserDetails = async (userId) => {
    try {
        const userDoc = await getDoc(doc(db, 'users', userId));
        if (!userDoc.exists()) {
            return null;
        }
        return {
            id: userId,
            ...userDoc.data()
        };
    } catch (error) {
        console.error('Kullanıcı detayları alınırken hata:', error);
        return null;
    }
};

// Arkadaş aramalarını getir
export const searchFriends = async (searchQuery) => {
    try {
        const usersRef = collection(db, 'users');
        const q = query(
            usersRef,
            where('informations.name', '>=', searchQuery),
            where('informations.name', '<=', searchQuery + '\uf8ff')
        );

        const querySnapshot = await getDocs(q);
        const currentUserId = await getCurrentUserUid();

        return querySnapshot.docs
            .map(doc => ({
                id: doc.id,
                ...doc.data(),
                name: doc.data().informations?.name || 'İsimsiz Kullanıcı',
                profilePicture: doc.data().informations?.profileImage
            }))
            .filter(user => user.id !== currentUserId);
    } catch (error) {
        console.error('Arkadaş arama hatası:', error);
        throw error;
    }
}; 