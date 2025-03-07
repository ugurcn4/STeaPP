import { db, storage } from '../../firebaseConfig';
import {
    collection,
    addDoc,
    updateDoc,
    doc,
    serverTimestamp,
    arrayUnion,
    query,
    where,
    orderBy,
    limit,
    getDocs,
    startAfter,
    arrayRemove,
    getDoc,
    Timestamp,
    onSnapshot,
    deleteDoc,
    writeBatch
} from 'firebase/firestore';
import {
    ref,
    uploadBytes,
    getDownloadURL,
    deleteObject
} from 'firebase/storage';

export const createPost = async (postData, imageUri) => {
    try {
        // 1. Görseli Storage'a yükle
        const imageRef = ref(storage, `posts/${Date.now()}_${imageUri.split('/').pop()}`);
        const response = await fetch(imageUri);
        if (!response.ok) {
            throw new Error('Görsel yüklenirken hata: ' + response.statusText);
        }

        const blob = await response.blob();
        await uploadBytes(imageRef, blob);
        const imageUrl = await getDownloadURL(imageRef);

        // 2. Post verilerini hazırla
        const post = {
            userId: postData.userId,
            imageUrl: imageUrl,
            description: postData.description || '',
            tags: postData.tags || [],
            location: postData.location || null,
            isPublic: postData.isPublic ?? true,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            stats: {
                likes: 0,
                comments: 0
            }
        };

        // 3. Firestore'a post ekle
        const postRef = await addDoc(collection(db, 'posts'), post);
        return postRef.id;
    } catch (error) {
        console.error('Post oluşturma hatası:', error);
        throw error;
    }
};

// Gönderileri getir
export const fetchPosts = async (currentUserId) => {
    try {
        const postsRef = collection(db, 'posts');
        const q = query(
            postsRef,
            orderBy('createdAt', 'desc')
        );

        const querySnapshot = await getDocs(q);
        const posts = [];

        // Kullanıcının arkadaş listesini al
        const userDoc = await getDoc(doc(db, 'users', currentUserId));
        const userFriends = userDoc.data()?.friends || [];

        for (const docSnapshot of querySnapshot.docs) {
            const postData = docSnapshot.data();

            try {
                // Post sahibinin gizlilik ayarlarını kontrol et
                const postOwnerRef = doc(db, 'users', postData.userId);
                const postOwnerDoc = await getDoc(postOwnerRef);
                const postOwnerData = postOwnerDoc.data() || {};

                // Gizlilik ayarlarını kontrol et
                const privacySettings = postOwnerData.settings?.privacySettings || {};
                const visibility = postOwnerData.settings?.visibility || 'public';

                // Kullanıcı kendisi değilse ve profil görünürlüğü private ise ve arkadaş değilse, postu gösterme
                if (postData.userId !== currentUserId &&
                    visibility === 'private' &&
                    !userFriends.includes(postData.userId)) {
                    continue;
                }

                // Post görünürlük kontrolü
                // Eğer post public değilse ve kullanıcı arkadaş listesinde değilse, postu gösterme
                if (!postData.isPublic && !userFriends.includes(postData.userId) && postData.userId !== currentUserId) {
                    continue;
                }

                const userDocRef = doc(db, 'users', postData.userId);
                const userDocSnapshot = await getDoc(userDocRef);
                const userData = userDocSnapshot.data() || {};

                posts.push({
                    id: docSnapshot.id,
                    ...postData,
                    user: {
                        id: postData.userId,
                        name: userData.informations?.name || 'İsimsiz Kullanıcı',
                        username: userData.informations?.username,
                        avatar: userData.profilePicture || null
                    },
                    likedBy: postData.likedBy || [],
                    comments: postData.comments || [],
                    createdAt: postData.createdAt?.toDate() || new Date(),
                    imageUrl: postData.imageUrl,
                    description: postData.description || '',
                    tags: postData.tags || [],
                    stats: postData.stats || { likes: 0, comments: 0 }
                });
            } catch (userError) {
                console.error('Kullanıcı bilgileri alınırken hata:', userError);
            }
        }

        const postsWithUserData = await Promise.all(
            posts.map(async (post) => {
                // İlk beğenen kişinin bilgisini al
                let firstLikerName = '';
                if (post.likedBy && post.likedBy.length > 0) {
                    const firstLikerId = post.likedBy[0];
                    try {
                        const firstLikerDoc = await getDoc(doc(db, 'users', firstLikerId));

                        if (firstLikerDoc.exists()) {
                            const userData = firstLikerDoc.data();
                            // Sırayla kontrol edelim
                            if (userData.informations?.name) {
                                firstLikerName = userData.informations.name;
                            } else if (userData.informations?.username) {
                                firstLikerName = userData.informations.username;
                            } else if (userData.name) {
                                firstLikerName = userData.name;
                            } else {
                                firstLikerName = 'İsimsiz Kullanıcı';
                            }
                        }
                    } catch (error) {
                        console.error('Beğenen kullanıcı bilgisi alınırken hata:', error);
                        firstLikerName = 'İsimsiz Kullanıcı';
                    }
                }
                return {
                    ...post,
                    firstLikerName
                };
            })
        );

        return postsWithUserData;
    } catch (error) {
        console.error('Gönderiler alınırken hata:', error);
        throw error;
    }
};

// Beğeni işlemi
export const toggleLikePost = async (postId, userId) => {
    if (!postId || !userId) {
        throw new Error('Post ID ve User ID gerekli');
    }

    try {
        const postRef = doc(db, 'posts', postId);
        const postDoc = await getDoc(postRef);

        if (!postDoc.exists()) {
            throw new Error('Post bulunamadı');
        }

        const postData = postDoc.data();
        const currentLikes = postData.stats?.likes || 0;
        const likedBy = postData.likedBy || [];
        const isLiked = likedBy.includes(userId);

        await updateDoc(postRef, {
            'stats.likes': isLiked ? currentLikes - 1 : currentLikes + 1,
            likedBy: isLiked ? arrayRemove(userId) : arrayUnion(userId)
        });

        return !isLiked; // true: beğenildi, false: beğeni kaldırıldı
    } catch (error) {
        console.error('Beğeni işlemi hatası:', error);
        throw error;
    }
};

// Yorum ve yanıt ekleme fonksiyonunu güncelleyelim
export const addComment = async (postId, userId, comment, replyToId = null) => {
    // Parametreleri detaylı kontrol edelim
    if (!postId) {
        throw new Error('Post ID gerekli');
    }
    if (!userId) {
        throw new Error('User ID gerekli');
    }
    if (!comment || comment.trim() === '') {
        throw new Error('Yorum metni gerekli');
    }

    try {
        const userRef = doc(db, 'users', userId);
        const userDoc = await getDoc(userRef);
        const userData = userDoc.data();

        if (!userDoc.exists()) {
            throw new Error('Kullanıcı bulunamadı');
        }

        const postRef = doc(db, 'posts', postId);
        const postDoc = await getDoc(postRef);

        if (!postDoc.exists()) {
            throw new Error('Post bulunamadı');
        }

        const postData = postDoc.data();
        const currentComments = postData.comments || [];
        const currentStats = postData.stats || { comments: 0 };

        // Tüm alanların tanımlı olduğundan emin olalım
        const newComment = {
            id: Date.now().toString(),
            userId: userId || '',
            text: comment.trim(),
            createdAt: new Date().toISOString(),
            user: {
                name: userData.informations?.name || 'İsimsiz Kullanıcı',
                username: userData.informations?.username || '',
                avatar: userData.profilePicture || null
            },
            replies: []
        };

        // Her alanın undefined olmadığından emin olalım
        Object.keys(newComment).forEach(key => {
            if (newComment[key] === undefined) {
                newComment[key] = null;
            }
        });

        if (replyToId) {
            // Yanıt ekleme
            const updatedComments = currentComments.map(c => {
                if (c.id === replyToId) {
                    return {
                        ...c,
                        replies: [...(c.replies || []), newComment]
                    };
                }
                return c;
            });

            await updateDoc(postRef, {
                comments: updatedComments,
                'stats.comments': currentStats.comments + 1
            });
        } else {
            // Yeni yorum ekleme
            await updateDoc(postRef, {
                comments: arrayUnion(newComment),
                'stats.comments': currentStats.comments + 1
            });
        }

        return newComment;
    } catch (error) {
        console.error('Yorum ekleme hatası:', error);
        throw error;
    }
};

// Yorum silme fonksiyonu
export const deleteComment = async (postId, commentId, userId) => {
    try {
        const postRef = doc(db, 'posts', postId);
        const postDoc = await getDoc(postRef);

        if (!postDoc.exists()) {
            throw new Error('Post bulunamadı');
        }

        const postData = postDoc.data();
        const currentComments = postData.comments || [];
        const currentStats = postData.stats || { comments: 0 };

        // Yorumu bul ve yetki kontrolü yap
        const comment = currentComments.find(c => c.id === commentId);
        if (!comment) {
            throw new Error('Yorum bulunamadı');
        }

        // Yorum sahibi veya post sahibi silebilir
        if (comment.userId !== userId && postData.userId !== userId) {
            throw new Error('Bu yorumu silme yetkiniz yok');
        }

        // Yorumu filtrele ve güncelle
        const updatedComments = currentComments.filter(c => c.id !== commentId);

        await updateDoc(postRef, {
            comments: updatedComments,
            'stats.comments': currentStats.comments - 1
        });

        return true;
    } catch (error) {
        console.error('Yorum silme hatası:', error);
        throw error;
    }
};

// Gerçek zamanlı post dinleyicisi
export const subscribeToPost = (postId, callback) => {
    const postRef = doc(db, 'posts', postId);
    return onSnapshot(postRef, async (docSnapshot) => {
        if (docSnapshot.exists()) {
            const postData = docSnapshot.data();
            try {
                const userDocRef = doc(db, 'users', postData.userId);
                const userDocSnapshot = await getDoc(userDocRef);
                const userData = userDocSnapshot.data() || {};

                const formattedPost = {
                    id: docSnapshot.id,
                    ...postData,
                    user: {
                        id: postData.userId,
                        name: userData.informations?.name || 'İsimsiz Kullanıcı',
                        username: userData.informations?.username,
                        avatar: userData.profilePicture || null
                    },
                    likedBy: postData.likedBy || [],
                    comments: postData.comments || [],
                    createdAt: postData.createdAt?.toDate() || new Date(),
                    imageUrl: postData.imageUrl,
                    description: postData.description || '',
                    tags: postData.tags || [],
                    stats: postData.stats || { likes: 0, comments: 0 }
                };
                callback(formattedPost);
            } catch (error) {
                console.error('Post verisi formatlanırken hata:', error);
            }
        }
    });
};

// Beğenilen gönderileri getir
export const fetchLikedPosts = async (currentUserId, limitCount = 21, lastVisible = null) => {
    try {
        let postsRef = collection(db, 'posts');
        let queryConstraints = [
            where('likedBy', 'array-contains', currentUserId),
            orderBy('createdAt', 'desc')
        ];

        if (limitCount) {
            queryConstraints.push(limit(limitCount));
        }

        if (lastVisible) {
            queryConstraints.push(startAfter(lastVisible));
        }

        let q = query(postsRef, ...queryConstraints);
        const querySnapshot = await getDocs(q);
        const posts = [];
        const lastDoc = querySnapshot.docs[querySnapshot.docs.length - 1] || null;

        for (const docSnapshot of querySnapshot.docs) {
            const postData = docSnapshot.data();
            try {
                const userDocRef = doc(db, 'users', postData.userId);
                const userDocSnapshot = await getDoc(userDocRef);
                const userData = userDocSnapshot.data() || {};

                posts.push({
                    id: docSnapshot.id,
                    ...postData,
                    user: {
                        id: postData.userId,
                        name: userData.informations?.name || 'İsimsiz Kullanıcı',
                        username: userData.informations?.username,
                        avatar: userData.profilePicture || null
                    },
                    likedBy: postData.likedBy || [],
                    comments: postData.comments || [],
                    createdAt: postData.createdAt?.toDate() || new Date(),
                    imageUrl: postData.imageUrl,
                    description: postData.description || '',
                    tags: postData.tags || [],
                    stats: postData.stats || { likes: 0, comments: 0 }
                });
            } catch (error) {
                console.error('Kullanıcı bilgileri alınırken hata:', error);
            }
        }

        return {
            posts,
            lastVisible: lastDoc
        };
    } catch (error) {
        console.error('Beğenilen gönderiler alınırken hata:', error);
        throw error;
    }
};

// Post silme fonksiyonu
export const deletePost = async (postId) => {
    try {
        const postRef = doc(db, 'posts', postId);

        // Önce postu getir
        const postDoc = await getDoc(postRef);
        if (!postDoc.exists()) {
            throw new Error('Gönderi bulunamadı');
        }

        const postData = postDoc.data();

        // Görseli Storage'dan sil
        if (postData.imageUrl) {
            try {
                const imageRef = ref(storage, postData.imageUrl);
                await deleteObject(imageRef);
            } catch (error) {
                console.error('Görsel silinirken hata:', error);
                // Görsel silinmese bile post silinmesine devam et
            }
        }

        // Postu Firestore'dan sil
        await deleteDoc(postRef);

        return true;
    } catch (error) {
        console.error('Post silme hatası:', error);
        throw new Error('Gönderi silinirken bir hata oluştu');
    }
};

// Gönderiyi arşivle/arşivden çıkar
export const toggleArchivePost = async (postId, userId) => {
    if (!postId || !userId) {
        throw new Error('Post ID ve User ID gerekli');
    }

    try {
        const postRef = doc(db, 'posts', postId);
        const postDoc = await getDoc(postRef);

        if (!postDoc.exists()) {
            throw new Error('Post bulunamadı');
        }

        const postData = postDoc.data();
        const archivedBy = postData.archivedBy || [];
        const isArchived = archivedBy.includes(userId);

        await updateDoc(postRef, {
            archivedBy: isArchived ? arrayRemove(userId) : arrayUnion(userId)
        });

        return !isArchived; // true: arşivlendi, false: arşivden çıkarıldı
    } catch (error) {
        console.error('Arşivleme işlemi hatası:', error);
        throw error;
    }
};

// Arşivlenen gönderileri getir
export const fetchArchivedPosts = async (userId) => {
    try {
        const postsRef = collection(db, 'posts');
        const q = query(
            postsRef,
            where('archivedBy', 'array-contains', userId),
            orderBy('createdAt', 'desc')
        );

        const querySnapshot = await getDocs(q);
        const posts = [];

        for (const docSnapshot of querySnapshot.docs) {
            const postData = docSnapshot.data();
            try {
                const userDocRef = doc(db, 'users', postData.userId);
                const userDocSnapshot = await getDoc(userDocRef);
                const userData = userDocSnapshot.data() || {};

                posts.push({
                    id: docSnapshot.id,
                    ...postData,
                    user: {
                        id: postData.userId,
                        name: userData.informations?.name || 'İsimsiz Kullanıcı',
                        username: userData.informations?.username,
                        avatar: userData.profilePicture || null
                    },
                    likedBy: postData.likedBy || [],
                    archivedBy: postData.archivedBy || [],
                    comments: postData.comments || [],
                    createdAt: postData.createdAt?.toDate() || new Date(),
                    imageUrl: postData.imageUrl,
                    description: postData.description || '',
                    tags: postData.tags || [],
                    stats: postData.stats || { likes: 0, comments: 0 }
                });
            } catch (error) {
                console.error('Kullanıcı bilgileri alınırken hata:', error);
            }
        }

        return posts;
    } catch (error) {
        console.error('Arşivlenen gönderiler alınırken hata:', error);
        throw error;
    }
};

// Arşiv grubu oluştur
export const createArchiveGroup = async (userId, groupData) => {
    try {
        const userRef = doc(db, 'users', userId);
        const userDoc = await getDoc(userRef);

        if (!userDoc.exists()) {
            throw new Error('Kullanıcı bulunamadı');
        }

        const archiveGroups = userDoc.data().archiveGroups || [];
        const newGroup = {
            id: Date.now().toString(),
            name: groupData.name,
            description: groupData.description || '',
            emoji: groupData.emoji || '📁',
            createdAt: new Date().toISOString(),
            postCount: 0
        };

        // Mevcut grupları al ve yeni grubu ekle
        const updatedGroups = [...archiveGroups, newGroup];

        // Tüm grupları güncelle
        await updateDoc(userRef, {
            archiveGroups: updatedGroups
        });

        return newGroup;
    } catch (error) {
        console.error('Arşiv grubu oluşturma hatası:', error);
        throw error;
    }
};

// Postu gruba ekle/çıkar
export const updatePostArchiveGroups = async (postId, userId, groupIds) => {
    try {
        const postRef = doc(db, 'posts', postId);

        // Tek bir updateDoc işlemi ile tüm güncellemeleri yap
        await updateDoc(postRef, {
            archiveGroups: groupIds,
            archivedBy: arrayUnion(userId)
        });

        return true;
    } catch (error) {
        console.error('Post arşiv grubu güncelleme hatası:', error);
        throw error;
    }
};

// Arşiv gruplarını getir
export const fetchArchiveGroups = async (userId) => {
    try {
        const userRef = doc(db, 'users', userId);
        const userDoc = await getDoc(userRef);

        if (!userDoc.exists()) {
            return [];
        }

        return userDoc.data().archiveGroups || [];
    } catch (error) {
        console.error('Arşiv grupları getirme hatası:', error);
        throw error;
    }
};

// Arşiv grubunu sil
export const deleteArchiveGroup = async (userId, groupId) => {
    try {
        const userRef = doc(db, 'users', userId);
        const userDoc = await getDoc(userRef);

        if (!userDoc.exists()) {
            throw new Error('Kullanıcı bulunamadı');
        }

        const archiveGroups = userDoc.data().archiveGroups || [];
        const updatedGroups = archiveGroups.filter(group => group.id !== groupId);

        // Önce kullanıcının gruplarını güncelle
        await updateDoc(userRef, {
            archiveGroups: updatedGroups
        });

        // Tüm postları kontrol et ve güncelle
        const postsRef = collection(db, 'posts');
        const q = query(postsRef);  // Tüm postları al
        const querySnapshot = await getDocs(q);

        if (querySnapshot.size > 0) {
            const batch = writeBatch(db);
            let hasUpdates = false;

            querySnapshot.docs.forEach(docSnapshot => {
                const postData = docSnapshot.data();
                if (postData.archiveGroups && Array.isArray(postData.archiveGroups)) {
                    if (postData.archiveGroups.includes(groupId)) {
                        hasUpdates = true;
                        batch.update(docSnapshot.ref, {
                            archiveGroups: postData.archiveGroups.filter(id => id !== groupId)
                        });
                    }
                }
            });

            // Sadece güncelleme varsa batch'i commit et
            if (hasUpdates) {
                await batch.commit();
            }
        }

        return true;
    } catch (error) {
        console.error('Arşiv grubu silme hatası:', error);
        throw error;
    }
};

// Varsayılan koleksiyon oluştur veya getir
export const getOrCreateDefaultCollection = async (userId) => {
    try {
        const userRef = doc(db, 'users', userId);
        const userDoc = await getDoc(userRef);

        if (!userDoc.exists()) {
            throw new Error('Kullanıcı bulunamadı');
        }

        const archiveGroups = userDoc.data().archiveGroups || [];
        const defaultCollection = archiveGroups.find(group => group.isDefault);

        if (defaultCollection) {
            return defaultCollection;
        }

        // Varsayılan koleksiyon yoksa oluştur
        const newDefaultCollection = {
            id: Date.now().toString(),
            name: 'Kaydedilenler',
            description: 'Otomatik kaydedilen gönderiler',
            emoji: '📌',
            createdAt: new Date().toISOString(),
            isDefault: true,
            postCount: 0
        };

        const updatedGroups = [...archiveGroups, newDefaultCollection];
        await updateDoc(userRef, {
            archiveGroups: updatedGroups
        });

        return newDefaultCollection;
    } catch (error) {
        console.error('Varsayılan koleksiyon hatası:', error);
        throw error;
    }
};

// Hızlı kaydetme fonksiyonu
export const quickSavePost = async (postId, userId) => {
    try {
        const defaultCollection = await getOrCreateDefaultCollection(userId);
        await updatePostArchiveGroups(postId, userId, [defaultCollection.id]);
        return defaultCollection;
    } catch (error) {
        console.error('Hızlı kaydetme hatası:', error);
        throw error;
    }
}; 