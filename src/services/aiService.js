import { getPlaceFromCoordinates } from '../helpers/locationHelpers';
import { getWeatherInfo } from './weatherService';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { getAuth } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebaseConfig';

// API anahtarını direkt tanımlayalım
const genAI = new GoogleGenerativeAI("AIzaSyC_AUToC4TeClkw8amFNLsK63lInLOn4QU");

// Kullanıcı profilini getiren yardımcı fonksiyon
const getUserProfileData = async () => {
    try {
        const auth = getAuth();
        const user = auth.currentUser;

        if (!user) {
            console.log('Kullanıcı oturumu bulunamadı');
            return null;
        }

        const userDoc = doc(db, 'users', user.uid);
        const userSnapshot = await getDoc(userDoc);

        if (userSnapshot.exists()) {
            const userData = userSnapshot.data();
            console.log('Kullanıcı verileri başarıyla alındı:', userData);
            return userData;
        }

        console.log('Kullanıcı verileri bulunamadı');
        return null;
    } catch (error) {
        console.error('Kullanıcı profili alınırken hata:', error);
        return null;
    }
};

export const getAIResponse = async (message, coords, messageHistory = []) => {
    try {
        const locationInfo = await getPlaceFromCoordinates(coords.latitude, coords.longitude);
        const weatherResponse = await getWeatherInfo(coords);

        // Kullanıcı profil bilgilerini alalım
        const userProfileData = await getUserProfileData();
        console.log('AI için kullanıcı profil verileri:', userProfileData);

        const currentHour = new Date().getHours();
        const timeOfDay = currentHour >= 5 && currentHour < 12 ? 'sabah' :
            currentHour >= 12 && currentHour < 17 ? 'öğleden sonra' :
                currentHour >= 17 && currentHour < 22 ? 'akşam' : 'gece';

        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-001" });

        // Sohbet geçmişini formatlayalım
        const formattedHistory = messageHistory.map(msg => ({
            role: msg.isUser ? "user" : "model",
            parts: [{ text: msg.text }]
        }));

        // Kullanıcı bilgilerini veritabanı yapısına göre doğru şekilde çıkaralım
        const username = userProfileData?.informations?.name || 'Misafir';
        const userBio = userProfileData?.bio || 'Henüz belirtilmemiş';
        const instaAccount = userProfileData?.insta ? `@${userProfileData.insta}` : 'Henüz belirtilmemiş';
        const postsCount = userProfileData?.posts?.length || 0;

        // Arkadaş sayısını doğru şekilde alalım
        const friendsCount = userProfileData?.friends?.length || 0;

        // Seyahat tercihleri ve favori aktiviteler için veritabanı yapınıza göre değerler
        const interests = userProfileData?.informations?.interests?.join(', ') || 'Henüz belirtilmemiş';
        const visitedPlacesCount = userProfileData?.visitedPlaces?.length || 0;

        // Streak bilgisi
        const currentStreak = userProfileData?.currentStreak || 0;

        // Çıkarılan kullanıcı bilgilerini logla
        console.log('AI prompt için hazırlanan kullanıcı bilgileri:', {
            username,
            userBio,
            instaAccount,
            postsCount,
            friendsCount,
            interests,
            visitedPlacesCount,
            currentStreak
        });

        const prompt = `Sen STeaPPY adında bir seyahat ve uygulama asistanısın. Enerjik, samimi ve esprili bir kişiliğin var.

        UYGULAMA ÖZELLİKLERİ VE YARDIM KONULARI:
        - Arkadaş Ekleme:  Arkadaşlar > Sağ üstte arama ikonu > Arkadaşını arat > Arkadaş Ekle menüsünden yapılır
        - Rota Paylaşma: Herhangi bir rotaya uzun basıp "Paylaş" seçeneğini kullan
        - Favori Mekanlar: Mekan kartının sağ üstündeki yıldız ikonuna tıkla
        - Profil Düzenleme: Profil > Düzenle menüsünden yapılır
        - Bildirimler: Ayarlar > Bildirimler menüsünden özelleştirilebilir
        - Çevrimdışı Haritalar: Ayarlar > Çevrimdışı Haritalar menüsünden indirilir
        - Gizlilik: Profil > Gizlilik menüsünden yönetilir
        - Dil Değiştirme: Ayarlar > Dil menüsünden yapılır
        - Rota Oluşturma: Ana Sayfa > Rota Oluştur butonuna tıklayarak başlayabilirsin
        - Etkinlik Oluşturma: Etkinlikler > + butonuna tıklayarak yeni etkinlik oluşturabilirsin
        - Grup Sohbetleri: Mesajlar > Yeni Grup Sohbeti seçeneğiyle arkadaşlarınla grup oluşturabilirsin

        KULLANICI PROFİLİ:
        - Kullanıcı Adı: ${username}
        - Biyografi: ${userBio}
        - Instagram: ${instaAccount}
        - Arkadaş Sayısı: ${friendsCount}
        - İlgi Alanları: ${interests}
        - Paylaşım Sayısı: ${postsCount}
        - Günlük Seri: ${currentStreak} gün
        
        MEVCUT DURUM:
        🕐 Zaman: ${timeOfDay} (saat: ${currentHour}:00)
        📍 Konum: ${locationInfo.district}, ${locationInfo.city}
        🌤️ Hava: ${weatherResponse.condition}, ${weatherResponse.temperature}°C

        KULLANICI SORUSU: ${message}

        YANITLAMA KURALLARI:
        1. Önce sorunun türünü belirle:
           - Uygulama yardımı mı?
           - Gezi/mekan önerisi mi?
           - Genel bilgi mi?
           - Rota planlaması mı?
           - Etkinlik önerisi mi?
        2. Uygulama yardımı için:
           - Net adımlar ver
           - Ekran görüntüleriyle destekle
           - İlgili menü yolunu belirt
        3. Gezi önerileri için:
           - Saate uygun öneriler ver
           - Mesafe ve süre bilgisi ekle
           - Hava durumuna göre alternatifler sun
           - Doğru ve gerçek mekan isimleri kullan
           - Kullanıcının tercihlerine göre özelleştir
        4. Rota planlaması için:
           - Kullanıcının tercihlerine göre rotalar öner
           - Hava durumuna uygun rotalar seç
           - Zaman ve mesafe bilgisi ekle
           - Ulaşım seçeneklerini belirt
        5. Etkinlik önerileri için:
           - Yakındaki popüler etkinlikleri öner
           - Kullanıcının ilgi alanlarına göre özelleştir
           - Tarih ve saat bilgisi ekle
        6. Her türlü yanıt için:
           - Samimi ve enerjik ol
           - Espirili ve samimi dil kullan
           - Emoji kullan
           - Önemli noktaları vurgula
           - Maksimum 3-4 öneri/adım ver
        7. Kişisel sorular için:
           - Kişisel bilgileri koru
           - Kişisel bilgileri soruşturma

        YANIT FORMATI:
        - Kısa bir selamlama ile başla
        - Ana içeriği 2-3 paragrafta sun
        - Gerekirse madde işaretleri kullan
        - Sonunda kısa bir kapanış cümlesi ekle

        Lütfen kısa, öz ve kullanışlı bir yanıt ver.`;

        // Yeniden deneme mantığı ekleyelim
        let attempts = 0;
        const maxAttempts = 3;

        while (attempts < maxAttempts) {
            try {
                const result = await model.generateContent([
                    ...formattedHistory.map(msg => msg.parts[0].text),
                    prompt,
                    message
                ]);

                const response = await result.response;
                return response.text();
            } catch (error) {
                attempts++;
                if (attempts === maxAttempts || !error.message.includes('503')) {
                    throw error;
                }
                // 503 hatası için 2 saniye bekleyelim ve tekrar deneyelim
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
        }
    } catch (error) {
        console.error('AI yanıt hatası:', error);

        // Daha açıklayıcı hata mesajı
        if (error.message.includes('503')) {
            return '🌟 STeaPPY: Şu anda sistemimiz çok yoğun. Lütfen birkaç saniye sonra tekrar deneyin.';
        }

        return '🌟 STeaPPY: Üzgünüm, şu anda yanıt veremiyorum. Lütfen tekrar deneyin.';
    }
};