import { db } from '../../firebaseConfig';
import {
    collection,
    addDoc,
    query,
    where,
    orderBy,
    onSnapshot,
    Timestamp,
    doc,
    getDoc,
    updateDoc,
    getDocs,
    limit,
    setDoc,
    increment
} from 'firebase/firestore';
import { storage } from '../../firebaseConfig';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Platform } from 'react-native';

// Yeni mesaj gönderme
export const sendMessage = async (senderId, receiverId, message) => {
    try {
        const chatId = [senderId, receiverId].sort().join('_');

        // Chat dokümanını kontrol et ve oluştur
        const chatRef = doc(db, 'chats', chatId);
        const chatDoc = await getDoc(chatRef);

        const timestamp = Timestamp.now();

        if (!chatDoc.exists()) {
            // Chat yoksa oluştur
            await setDoc(chatRef, {
                participants: [senderId, receiverId],
                lastMessage: { message },
                lastMessageTime: timestamp,
                unreadCount: {
                    [senderId]: 0,
                    [receiverId]: 1
                }
            });
        } else {
            // Varsa güncelle
            await updateDoc(chatRef, {
                lastMessage: { message },
                lastMessageTime: timestamp,
                [`unreadCount.${receiverId}`]: increment(1)
            });
        }

        // Mesajı ekle
        await addDoc(collection(db, 'messages'), {
            chatId,
            senderId,
            receiverId,
            message,
            timestamp,
            read: false
        });

        return { success: true };
    } catch (error) {
        console.error('Mesaj gönderme hatası:', error);
        return { success: false, error };
    }
};

// Mesajları dinleme
export const subscribeToMessages = (userId1, userId2, callback) => {
    const chatId = [userId1, userId2].sort().join('_');

    const q = query(
        collection(db, 'messages'),
        where('chatId', '==', chatId),
        orderBy('timestamp', 'asc')
    );

    return onSnapshot(q, (snapshot) => {
        const messages = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        callback(messages);
    });
};

// Mesajı okundu olarak işaretle
export const markMessageAsRead = async (messageId) => {
    try {
        await updateDoc(doc(db, 'messages', messageId), { read: true });
        return { success: true };
    } catch (error) {
        console.error('Mesaj okundu işaretlenemedi:', error);
        return { success: false, error };
    }
};

// Mesajı okundu olarak işaretle
export const markChatAsRead = async (chatId, receiverId) => {
    try {
        const q = query(
            collection(db, 'messages'),
            where('chatId', '==', chatId),
            where('receiverId', '==', receiverId),
            where('read', '==', false)
        );

        const snapshot = await getDocs(q);
        const updatePromises = snapshot.docs.map(doc =>
            updateDoc(doc.ref, { read: true })
        );

        await Promise.all(updatePromises);
        return { success: true };
    } catch (error) {
        console.error('Mesajlar okundu olarak işaretlenemedi:', error);
        return { success: false, error };
    }
};

// Kullanıcının online durumunu güncelle
export const updateOnlineStatus = async (userId, isOnline) => {
    try {
        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, {
            isOnline,
            lastSeen: Timestamp.now()
        });
        return { success: true };
    } catch (error) {
        console.error('Online durum güncellenemedi:', error);
        return { success: false, error };
    }
};

// Kullanıcının online durumunu dinle
export const subscribeToUserOnlineStatus = (userId, callback) => {
    const userRef = doc(db, 'users', userId);
    return onSnapshot(userRef, (doc) => {
        if (doc.exists()) {
            const userData = doc.data();
            callback({
                isOnline: userData.isOnline || false,
                lastSeen: userData.lastSeen
            });
        }
    });
};

// Medya mesajı gönderme
export const sendMediaMessage = async (senderId, receiverId, mediaFile, type = 'image') => {
    try {
        const chatId = [senderId, receiverId].sort().join('_');
        const timestamp = Timestamp.now();

        // Storage'a medya yükleme
        const storageRef = ref(storage, `chat_media/${chatId}/${timestamp.toMillis()}`);
        await uploadBytes(storageRef, mediaFile);
        const mediaUrl = await getDownloadURL(storageRef);

        // Mesajı veritabanına kaydetme
        await addDoc(collection(db, 'messages'), {
            chatId,
            senderId,
            receiverId,
            mediaUrl,
            mediaType: type,
            timestamp,
            read: false
        });

        // Chat dokümanını güncelle
        const chatRef = doc(db, 'chats', chatId);
        const chatDoc = await getDoc(chatRef);

        if (!chatDoc.exists()) {
            await setDoc(chatRef, {
                participants: [senderId, receiverId],
                lastMessage: { mediaType: type },
                lastMessageTime: timestamp,
                unreadCount: {
                    [senderId]: 0,
                    [receiverId]: 1
                }
            });
        } else {
            await updateDoc(chatRef, {
                lastMessage: { mediaType: type },
                lastMessageTime: timestamp,
                [`unreadCount.${receiverId}`]: increment(1)
            });
        }

        return { success: true };
    } catch (error) {
        console.error('Medya gönderme hatası:', error);
        return { success: false, error };
    }
};

// Sesli mesaj gönderme
export const sendVoiceMessage = async (senderId, receiverId, audioBlob) => {
    try {
        const chatId = [senderId, receiverId].sort().join('_');
        const timestamp = Timestamp.now();

        const extension = Platform.OS === 'ios' ? '.m4a' : '.mp4';
        const fileName = `voice_${timestamp.toMillis()}${extension}`;

        const metadata = {
            contentType: 'audio/mp4',
        };

        const storageRef = ref(storage, `chat_media/${chatId}/${fileName}`);
        await uploadBytes(storageRef, audioBlob, metadata);
        const audioUrl = await getDownloadURL(storageRef);

        await addDoc(collection(db, 'messages'), {
            chatId,
            senderId,
            receiverId,
            audioUrl,
            mediaType: 'voice',
            duration: audioBlob.duration || 0,
            timestamp,
            read: false,
            fileName,
            platform: Platform.OS
        });

        // Chat dokümanını güncelle
        const chatRef = doc(db, 'chats', chatId);
        const chatDoc = await getDoc(chatRef);

        if (!chatDoc.exists()) {
            await setDoc(chatRef, {
                participants: [senderId, receiverId],
                lastMessage: { mediaType: 'voice' },
                lastMessageTime: timestamp,
                unreadCount: {
                    [senderId]: 0,
                    [receiverId]: 1
                }
            });
        } else {
            await updateDoc(chatRef, {
                lastMessage: { mediaType: 'voice' },
                lastMessageTime: timestamp,
                [`unreadCount.${receiverId}`]: increment(1)
            });
        }

        return { success: true };
    } catch (error) {
        console.error('Ses mesajı gönderme hatası:', error);
        return { success: false, error };
    }
};

// Son sohbetleri getir
export const getRecentChats = (userId, callback) => {
    const messagesRef = collection(db, 'messages');

    // Gönderilen mesajlar için sorgu
    const sentQuery = query(
        messagesRef,
        where('senderId', '==', userId),
        orderBy('timestamp', 'desc')
    );

    // Alınan mesajlar için sorgu
    const receivedQuery = query(
        messagesRef,
        where('receiverId', '==', userId),
        orderBy('timestamp', 'desc')
    );

    // Her iki sorguyu da dinle
    const unsubscribeSent = onSnapshot(sentQuery, async (sentSnapshot) => {
        const unsubscribeReceived = onSnapshot(receivedQuery, async (receivedSnapshot) => {
            try {
                const uniqueChats = new Map();
                const allMessages = [...sentSnapshot.docs, ...receivedSnapshot.docs];

                // Her mesajı işle
                allMessages.forEach(doc => {
                    const message = doc.data();
                    const otherUserId = message.senderId === userId ? message.receiverId : message.senderId;

                    // Her sohbet için sadece en son mesajı al
                    if (!uniqueChats.has(otherUserId) ||
                        message.timestamp.toMillis() > uniqueChats.get(otherUserId).timestamp.toMillis()) {
                        uniqueChats.set(otherUserId, {
                            chatId: message.chatId,
                            lastMessage: {
                                message: message.message,
                                mediaType: message.mediaType,
                                timestamp: message.timestamp
                            },
                            timestamp: message.timestamp,
                            unreadCount: message.receiverId === userId && !message.read ? 1 : 0,
                            otherUserId
                        });
                    } else if (message.receiverId === userId && !message.read) {
                        // Okunmamış mesaj sayısını güncelle
                        const chat = uniqueChats.get(otherUserId);
                        chat.unreadCount += 1;
                    }
                });

                // Kullanıcı bilgilerini al
                const chatsWithUserInfo = await Promise.all(
                    Array.from(uniqueChats.values()).map(async (chat) => {
                        const userDoc = await getDoc(doc(db, 'users', chat.otherUserId));
                        const userData = userDoc.data() || {};
                        const userInfo = userData.informations || {};

                        // Profil fotoğrafı için tüm olası alanları kontrol et
                        const profilePicture =
                            userInfo.profileImage ||
                            userInfo.profilePicture ||
                            userData.profilePicture ||
                            userData.profileImage ||
                            `https://ui-avatars.com/api/?name=${encodeURIComponent(userInfo.name || 'User')}&background=random`;

                        return {
                            ...chat,
                            user: {
                                id: chat.otherUserId,
                                name: userInfo.name || userData.name || 'İsimsiz',
                                profilePicture: profilePicture,
                                isOnline: userData.isOnline || false,
                            }
                        };
                    })
                );

                // Son mesaj tarihine göre sırala
                const sortedChats = chatsWithUserInfo.sort(
                    (a, b) => b.timestamp.toMillis() - a.timestamp.toMillis()
                );

                callback(sortedChats);
            } catch (error) {
                console.error('Sohbet verilerini işlerken hata:', error);
                callback([]);
            }
        });

        return () => unsubscribeReceived();
    });

    return () => unsubscribeSent();
};

export const getUnreadMessageCount = async (userId) => {
    try {
        const messagesRef = collection(db, 'messages');
        const q = query(
            messagesRef,
            where('receiverId', '==', userId),
            where('read', '==', false)
        );

        const querySnapshot = await getDocs(q);
        return querySnapshot.size; // Okunmamış mesaj sayısı

    } catch (error) {
        console.error('Okunmamış mesaj sayısı alınırken hata:', error);
        return 0;
    }
}; 