import { db, storage } from '../../firebaseConfig';
import {
    collection,
    addDoc,
    getDocs,
    getDoc,
    doc,
    query,
    where,
    orderBy,
    limit,
    startAfter,
    updateDoc,
    arrayUnion,
    arrayRemove,
    increment,
    serverTimestamp,
    deleteDoc
} from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';

// Shorts koleksiyonundan videoları getir
export const fetchShorts = async (lastVisible = null, limitCount = 5) => {
    try {
        const shortsRef = collection(db, 'shorts');
        let shortsQuery;

        if (lastVisible) {
            shortsQuery = query(
                shortsRef,
                orderBy('createdAt', 'desc'),
                startAfter(lastVisible),
                limit(limitCount)
            );
        } else {
            shortsQuery = query(
                shortsRef,
                orderBy('createdAt', 'desc'),
                limit(limitCount)
            );
        }

        const shortsSnapshot = await getDocs(shortsQuery);

        if (shortsSnapshot.empty) {
            return { shorts: [], lastVisible: null, hasMore: false };
        }

        const lastDoc = shortsSnapshot.docs[shortsSnapshot.docs.length - 1];

        const shortsData = await Promise.all(
            shortsSnapshot.docs.map(async (doc) => {
                const shortData = {
                    id: doc.id,
                    ...doc.data()
                };

                // Kullanıcı bilgilerini getir
                if (shortData.userId) {
                    try {
                        const userDoc = await getDoc(doc.ref.firestore.doc(`users/${shortData.userId}`));
                        if (userDoc.exists()) {
                            const userData = userDoc.data();
                            shortData.username = userData.informations?.name || 'Kullanıcı';
                            shortData.userProfilePic = userData.profilePicture || null;
                        }
                    } catch (error) {
                        console.error('Kullanıcı bilgileri alınamadı:', error);
                    }
                }

                return shortData;
            })
        );

        return {
            shorts: shortsData,
            lastVisible: lastDoc,
            hasMore: shortsData.length === limitCount
        };
    } catch (error) {
        console.error('Shorts getirme hatası:', error);
        throw error;
    }
};

// Kullanıcının kendi videolarını getir
export const fetchUserShorts = async (userId, lastVisible = null, limitCount = 10) => {
    try {
        const shortsRef = collection(db, 'shorts');
        let shortsQuery;

        if (lastVisible) {
            shortsQuery = query(
                shortsRef,
                where('userId', '==', userId),
                orderBy('createdAt', 'desc'),
                startAfter(lastVisible),
                limit(limitCount)
            );
        } else {
            shortsQuery = query(
                shortsRef,
                where('userId', '==', userId),
                orderBy('createdAt', 'desc'),
                limit(limitCount)
            );
        }

        const shortsSnapshot = await getDocs(shortsQuery);

        if (shortsSnapshot.empty) {
            return { shorts: [], lastVisible: null, hasMore: false };
        }

        const lastDoc = shortsSnapshot.docs[shortsSnapshot.docs.length - 1];

        const shortsData = shortsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        return {
            shorts: shortsData,
            lastVisible: lastDoc,
            hasMore: shortsData.length === limitCount
        };
    } catch (error) {
        console.error('Kullanıcı shorts getirme hatası:', error);
        throw error;
    }
};

// Video beğenme/beğenmekten vazgeçme
export const toggleLikeShort = async (shortId, userId) => {
    try {
        const shortRef = doc(db, 'shorts', shortId);
        const shortDoc = await getDoc(shortRef);

        if (!shortDoc.exists()) {
            throw new Error('Video bulunamadı');
        }

        const shortData = shortDoc.data();
        const isLiked = shortData.likedBy && shortData.likedBy.includes(userId);

        if (isLiked) {
            // Beğeniyi kaldır
            await updateDoc(shortRef, {
                likedBy: arrayRemove(userId),
                'stats.likes': increment(-1)
            });
            return { isLiked: false };
        } else {
            // Beğeni ekle
            await updateDoc(shortRef, {
                likedBy: arrayUnion(userId),
                'stats.likes': increment(1)
            });
            return { isLiked: true };
        }
    } catch (error) {
        console.error('Video beğenme hatası:', error);
        throw error;
    }
};

// Video izlenme sayısını artır
export const incrementViewCount = async (shortId) => {
    try {
        const shortRef = doc(db, 'shorts', shortId);
        await updateDoc(shortRef, {
            'stats.views': increment(1)
        });
    } catch (error) {
        console.error('İzlenme sayısı artırma hatası:', error);
    }
};

// Video paylaşım sayısını artır
export const incrementShareCount = async (shortId) => {
    try {
        const shortRef = doc(db, 'shorts', shortId);
        await updateDoc(shortRef, {
            'stats.shares': increment(1)
        });
    } catch (error) {
        console.error('Paylaşım sayısı artırma hatası:', error);
    }
};

// Video silme
export const deleteShort = async (shortId, userId) => {
    try {
        const shortRef = doc(db, 'shorts', shortId);
        const shortDoc = await getDoc(shortRef);

        if (!shortDoc.exists()) {
            throw new Error('Video bulunamadı');
        }

        const shortData = shortDoc.data();

        // Sadece video sahibi silebilir
        if (shortData.userId !== userId) {
            throw new Error('Bu videoyu silme yetkiniz yok');
        }

        // Önce storage'dan videoyu sil
        if (shortData.videoUrl) {
            const videoPath = shortData.videoUrl.split('shorts/')[1];
            const videoRef = ref(storage, `shorts/${videoPath}`);
            await deleteObject(videoRef);
        }

        // Thumbnail varsa sil
        if (shortData.thumbnailUrl) {
            const thumbnailPath = shortData.thumbnailUrl.split('thumbnails/')[1];
            const thumbnailRef = ref(storage, `shorts/thumbnails/${thumbnailPath}`);
            await deleteObject(thumbnailRef);
        }

        // Firestore'dan videoyu sil
        await deleteDoc(shortRef);

        return { success: true };
    } catch (error) {
        console.error('Video silme hatası:', error);
        throw error;
    }
};

// Yorum ekleme
export const addComment = async (shortId, userId, comment) => {
    try {
        const shortRef = doc(db, 'shorts', shortId);

        const commentData = {
            userId,
            text: comment,
            createdAt: serverTimestamp()
        };

        await updateDoc(shortRef, {
            comments: arrayUnion(commentData