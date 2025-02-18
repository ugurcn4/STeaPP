/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

const { onDocumentCreated, onDocumentUpdated } = require("firebase-functions/v2/firestore");
const { initializeApp } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
const axios = require("axios");

// Create and deploy your first functions
// https://firebase.google.com/docs/functions/get-started

// exports.helloWorld = onRequest((request, response) => {
//   logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });

// Firebase Admin başlatma
initializeApp();

// Firestore referansı
const db = getFirestore();

// Expo Push Notification endpoint'i
const EXPO_PUSH_ENDPOINT = "https://exp.host/--/api/v2/push/send";

// Expo Push Notification gönderme fonksiyonu
const sendExpoPushNotification = async (token, title, body, data) => {
    try {
        console.log("Bildirim gönderiliyor:", { token, title, body, data });

        const message = {
            to: token,
            title,
            body,
            data,
            sound: "default",
            priority: "high",
            channelId: "default",
        };

        console.log("Hazırlanan bildirim mesajı:", message);

        const response = await axios.post(EXPO_PUSH_ENDPOINT, message, {
            headers: {
                "Accept": "application/json",
                "Accept-encoding": "gzip, deflate",
                "Content-Type": "application/json",
            },
        });

        console.log("Expo API yanıtı:", response.data);
        return response.data;
    } catch (error) {
        console.error("Bildirim gönderme hatası detayları:", {
            token,
            title,
            body,
            error: error.response ? {
                status: error.response.status,
                data: error.response.data
            } : error.message
        });
        throw error;
    }
};

// Arkadaşlık isteği bildirimi
exports.onFriendRequestUpdate = onDocumentUpdated("users/{userId}", async (event) => {
    const before = event.data.before.data();
    const after = event.data.after.data();

    // Yeni gelen arkadaşlık isteklerini kontrol et
    const newReceivedRequests = (after.friendRequests && after.friendRequests.received) || [];
    const oldReceivedRequests = (before.friendRequests && before.friendRequests.received) || [];

    // Yeni eklenen istekleri bul
    const newRequests = newReceivedRequests.filter(id => !oldReceivedRequests.includes(id));

    if (newRequests.length > 0) {
        const toUserId = event.params.userId;

        try {
            // Her yeni istek için bildirim gönder
            for (const fromUserId of newRequests) {
                // Gönderen kullanıcının bilgilerini al
                const fromUserDoc = await db.collection("users").doc(fromUserId).get();
                const fromUser = fromUserDoc.data();

                // Bildirim oluştur
                const notification = {
                    recipientId: toUserId,
                    senderId: fromUserId,
                    type: "friendRequest",
                    title: "Yeni Arkadaşlık İsteği",
                    body: `${fromUser.displayName || "Bir kullanıcı"} size arkadaşlık isteği gönderdi`,
                    status: "unread",
                    createdAt: new Date(),
                    data: {
                        type: "friendRequest",
                        senderId: fromUserId,
                    },
                };

                // Bildirimi Firestore'a kaydet
                await db.collection("notifications").add(notification);

                // Kullanıcının Expo Push Token'larını al
                const userDoc = await db.collection("users").doc(toUserId).get();
                const user = userDoc.data();
                const tokens = Object.values(user.fcmTokens || {}).map((t) => t.token).filter(Boolean);

                // Her token için bildirim gönder
                for (const token of tokens) {
                    if (token.startsWith("ExponentPushToken[")) {
                        await sendExpoPushNotification(
                            token,
                            notification.title,
                            notification.body,
                            notification.data
                        );
                    }
                }
            }
        } catch (error) {
            console.error("Arkadaşlık isteği bildirimi hatası:", error);
        }
    }
});

// Yeni mesaj bildirimi
exports.onNewMessage = onDocumentCreated("messages/{messageId}", async (event) => {
    const message = event.data.data();
    console.log("Yeni mesaj alındı:", message);

    if (!message) {
        console.log("Mesaj verisi boş, işlem sonlandırılıyor");
        return;
    }

    const { receiverId, senderId, chatId, message: text, mediaType } = message;

    // receiverId kontrolü ekle
    if (!receiverId) {
        console.error("Alıcı ID'si bulunamadı:", message);
        return;
    }

    // Kendi mesajlarımız için bildirim gönderme
    if (senderId === receiverId) {
        console.log("Kendi mesajı olduğu için bildirim gönderilmiyor");
        return;
    }

    try {
        // Gönderen kullanıcının bilgilerini al
        console.log("Gönderen kullanıcı bilgileri alınıyor:", senderId);
        const senderDoc = await db.collection("users").doc(senderId).get();
        const sender = senderDoc.data();

        if (!sender) {
            console.error("Gönderen kullanıcı bulunamadı:", senderId);
            return;
        }

        console.log("Gönderen kullanıcı bilgileri:", sender);

        // Bildirim oluştur
        const notification = {
            recipientId: receiverId,  // receiverId kullan
            senderId: senderId,
            type: "message",
            title: "Yeni Mesaj",
            body: `${(sender.informations && sender.informations.name) || sender.displayName || "Bilinmeyen Kullanıcı"}: ${text ? text.substring(0, 50) + (text.length > 50 ? "..." : "") : ""}`,
            status: "unread",
            createdAt: new Date(),
            data: {
                type: "message",
                messageId: event.data.id,
                chatId: chatId,
                senderId: senderId
            }
        };

        console.log("Oluşturulan bildirim:", notification);

        // Bildirimi Firestore'a kaydet
        await db.collection("notifications").add(notification);
        console.log("Bildirim Firestore'a kaydedildi");

        // Kullanıcının Expo Push Token'larını al
        console.log("Alıcı kullanıcının token bilgileri alınıyor:", receiverId);
        const userDoc = await db.collection("users").doc(receiverId).get();
        const user = userDoc.data();

        if (!user) {
            console.error("Alıcı kullanıcı bulunamadı:", receiverId);
            return;
        }

        const tokens = Object.values(user.fcmTokens || {}).map((t) => t.token).filter(Boolean);
        console.log("Bulunan token sayısı:", tokens.length);

        // Her token için bildirim gönder
        for (const token of tokens) {
            if (token.startsWith("ExponentPushToken[")) {
                console.log("Token geçerli, bildirim gönderiliyor:", token);
                await sendExpoPushNotification(
                    token,
                    notification.title,
                    notification.body,
                    notification.data
                );
            } else {
                console.log("Geçersiz token formatı:", token);
            }
        }
    } catch (error) {
        console.error("Mesaj bildirimi hatası:", error);
        console.error("Hata detayları:", {
            messageId: event.data.id,
            receiverId,
            senderId,
            error: error.stack
        });
    }
});

// Aktivite bildirimi
exports.onNewActivity = onDocumentCreated("activities/{activityId}", async (event) => {
    const activity = event.data.data();
    const { createdBy, participants, title } = activity;

    try {
        // Aktiviteyi oluşturan kullanıcının bilgilerini al
        const creatorDoc = await db.collection("users").doc(createdBy).get();
        const creator = creatorDoc.data();

        // Katılımcılara bildirim gönder
        for (const participantId of participants) {
            // Kendimize bildirim gönderme
            if (participantId === createdBy) continue;

            // Bildirim oluştur
            const notification = {
                recipientId: participantId,
                senderId: createdBy,
                type: "activity",
                title: "Yeni Aktivite",
                body: `${creator.displayName} sizi "${title}" aktivitesine davet etti`,
                status: "unread",
                createdAt: new Date(),
                data: {
                    type: "activity",
                    activityId: event.data.id,
                    createdBy,
                },
            };

            // Bildirimi Firestore'a kaydet
            await db.collection("notifications").add(notification);

            // Kullanıcının Expo Push Token'larını al
            const userDoc = await db.collection("users").doc(participantId).get();
            const user = userDoc.data();
            const tokens = Object.values(user.fcmTokens || {}).map((t) => t.token).filter(Boolean);

            // Her token için bildirim gönder
            for (const token of tokens) {
                if (token.startsWith("ExponentPushToken[")) {
                    await sendExpoPushNotification(
                        token,
                        notification.title,
                        notification.body,
                        notification.data
                    );
                }
            }
        }
    } catch (error) {
        console.error("Aktivite bildirimi hatası:", error);
    }
});
