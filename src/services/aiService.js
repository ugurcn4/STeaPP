import axios from 'axios';
import { getPlaceFromCoordinates } from '../helpers/locationHelpers';
import { HfInference } from '@huggingface/inference';
import { getWeatherInfo } from './weatherService';

const API_KEY = process.env.REACT_APP_HUGGING_FACE_API_KEY;

// API anahtarını kontrol eden yardımcı fonksiyon
const checkAPIKey = () => {
    if (!API_KEY) {
        throw new Error('HuggingFace API anahtarı bulunamadı');
    }
    return true;
};

const getWeatherPrompt = (weather) => {
    const weatherConditions = {
        'clear': 'güneşli',
        'clouds': 'bulutlu',
        'rain': 'yağmurlu',
        'snow': 'karlı',
        'thunderstorm': 'fırtınalı'
    };

    return weatherConditions[weather.toLowerCase()] || 'normal';
};

// Cache sistemi ekleyelim
const recommendationCache = new Map();
const CACHE_DURATION = 30 * 60 * 1000; // 30 dakika

const hf = new HfInference(API_KEY);

export const getAIRecommendations = async (latitude, longitude, userPreferences = {}) => {
    try {
        const locationInfo = await getPlaceFromCoordinates(latitude, longitude);
        const weatherDesc = getWeatherPrompt(userPreferences.weather);

        // Daha basit bir prompt kullanalım
        const prompt = `${locationInfo.district}, ${locationInfo.city} şehrinde ${weatherDesc} havada gezilebilecek yerler nelerdir? Lütfen tarihi yerler, parklar ve restoranlar olmak üzere 3 kategori için öneriler ver. Her öneri için başlık, açıklama, süre ve mesafe bilgisi ekle.`;

        try {
            const response = await hf.textGeneration({
                model: 'facebook/m2m100_418M',
                inputs: prompt,
                parameters: {
                    max_new_tokens: 1500, // Daha uzun yanıtlar için arttırdık
                    temperature: 0.8, // Daha yaratıcı yanıtlar için
                    top_p: 0.9,
                    do_sample: true,
                    return_full_text: false,
                    repetition_penalty: 1.2
                }
            });

            // Yanıt boş değilse parse et
            if (response.generated_text && response.generated_text.trim()) {
                const recommendations = parseAIResponse(response.generated_text);

                if (recommendations && recommendations.length > 0) {
                    // Cache'e kaydet
                    recommendationCache.set(cacheKey, {
                        data: recommendations,
                        timestamp: Date.now()
                    });

                    return recommendations;
                }
            }

            throw new Error('Geçerli AI yanıtı alınamadı');

        } catch (aiError) {
            console.error('AI yanıt hatası:', aiError);
            throw aiError;
        }

    } catch (error) {
        console.error('Genel hata:', error);
        // Hata durumunda mock data yerine daha dinamik öneriler üretelim
        return generateDynamicRecommendations(locationInfo, weatherDesc);
    }
};

// Daha dinamik öneriler üreten fonksiyon
const generateDynamicRecommendations = (locationInfo, weatherDesc) => {
    const timeOfDay = new Date().getHours();
    const isEvening = timeOfDay >= 18;

    return [
        {
            id: 1,
            title: `${locationInfo.district} Tarihi Keşif`,
            description: `${weatherDesc} havada ${locationInfo.district}'in tarihi dokusunu keşfedin`,
            duration: isEvening ? '1.5 saat' : '2.5 saat',
            distance: '2.8 km',
            places: [
                `${locationInfo.district} Tarihi Çarşı`,
                `${locationInfo.city} Kent Müzesi`,
                'Tarihi Camiler'
            ],
            image: 'https://picsum.photos/seed/historical/400/200',
            type: 'historical'
        },
        {
            id: 2,
            title: `${locationInfo.district} Doğa Rotası`,
            description: `${weatherDesc} havada ideal park ve bahçe turu`,
            duration: isEvening ? '1 saat' : '2 saat',
            distance: '2.2 km',
            places: [
                `${locationInfo.district} Şehir Parkı`,
                'Botanik Bahçesi',
                'Sahil Yürüyüş Yolu'
            ],
            image: 'https://picsum.photos/seed/nature/400/200',
            type: 'nature'
        },
        {
            id: 3,
            title: `${locationInfo.district} Lezzet Durağı`,
            description: `${weatherDesc} havada yerel lezzetler`,
            duration: '1.5 saat',
            distance: '1.5 km',
            places: [
                'Yerel Kahvaltı Mekanı',
                `${locationInfo.district} Meşhur Lokantası`,
                'Tatlıcılar Çarşısı'
            ],
            image: 'https://picsum.photos/seed/food/400/200',
            type: 'food'
        }
    ];
};

// Parse fonksiyonunu güncelle
const parseAIResponse = (aiResponse) => {
    try {
        // Yanıtı satırlara böl
        const lines = aiResponse.split('\n').filter(line => line.trim());
        const recommendations = [];
        let currentRec = null;

        for (const line of lines) {
            if (line.includes('TARİHİ') || line.includes('DOĞA') || line.includes('YEME')) {
                if (currentRec) recommendations.push(currentRec);
                currentRec = {
                    id: recommendations.length + 1,
                    title: '',
                    description: '',
                    duration: '',
                    distance: '',
                    places: [],
                    type: line.includes('TARİHİ') ? 'historical' :
                        line.includes('DOĞA') ? 'nature' : 'food'
                };
            }

            if (currentRec) {
                if (line.includes('Başlık:')) currentRec.title = line.split('Başlık:')[1].trim();
                if (line.includes('Açıklama:')) currentRec.description = line.split('Açıklama:')[1].trim();
                if (line.includes('Süre:')) currentRec.duration = line.split('Süre:')[1].trim();
                if (line.includes('Mesafe:')) currentRec.distance = line.split('Mesafe:')[1].trim();
                if (line.trim().startsWith('-')) currentRec.places.push(line.replace('-', '').trim());
            }
        }

        if (currentRec) recommendations.push(currentRec);

        return recommendations.map(rec => ({
            ...rec,
            image: getRouteImage(rec.type)
        }));
    } catch (error) {
        console.error('Parse hatası:', error);
        return [];
    }
};

// Rota tipine göre resim URL'si döndür
const getRouteImage = (index) => {
    const images = {
        0: 'https://picsum.photos/seed/historical/400/200',  // Her seferinde aynı resmi almak için seed kullanıyoruz
        1: 'https://picsum.photos/seed/nature/400/200',
        2: 'https://picsum.photos/seed/food/400/200'
    };
    return images[index] || images[0];
};

// İki nokta arası mesafe hesapla (km)
const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Dünya yarıçapı (km)
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};

const toRad = (value) => value * Math.PI / 180;

export const getAIResponse = async (message, coords) => {
    try {
        // Önce API anahtarını kontrol edelim
        checkAPIKey();

        const locationInfo = await getPlaceFromCoordinates(coords.latitude, coords.longitude);
        const weatherResponse = await getWeatherInfo(coords);
        const weatherDesc = getWeatherPrompt(weatherResponse.condition);

        // API anahtarını açıkça belirtelim
        const hf = new HfInference(API_KEY);

        const prompt = `Sen bir seyahat asistanısın. Şu anda ${locationInfo.district}, ${locationInfo.city}'de ${weatherDesc} bir hava var ve sıcaklık ${weatherResponse.temperature}°C. Kullanıcı şunu sordu: "${message}". Lütfen bu bilgileri kullanarak detaylı ve yardımcı bir yanıt ver.`;

        const response = await hf.textGeneration({
            model: 'facebook/m2m100_418M',
            inputs: prompt,
            parameters: {
                max_new_tokens: 1000,
                temperature: 0.7,
                top_p: 0.9,
                do_sample: true,
                return_full_text: false,
                repetition_penalty: 1.2
            }
        });

        if (response.generated_text && response.generated_text.trim()) {
            return response.generated_text.trim();
        }

        throw new Error('AI yanıtı alınamadı');

    } catch (error) {
        console.error('AI yanıt hatası:', error);

        // Daha detaylı hata mesajları
        if (error.message.includes('API anahtarı')) {
            return 'API anahtarı eksik veya geçersiz. Lütfen sistem yöneticinize başvurun.';
        } else if (error.message.includes('Invalid username or password')) {
            return 'HuggingFace API kimlik doğrulaması başarısız. Lütfen API anahtarınızı kontrol edin.';
        }

        return 'Üzgünüm, şu anda AI yanıtı oluşturulamıyor. Lütfen daha sonra tekrar deneyin.';
    }
};


// Akıllı yanıt oluşturucuyu geliştirelim
const generateSmartResponse = (message, locationInfo, weatherDesc, temperature) => {
    const timeOfDay = new Date().getHours();
    const isEvening = timeOfDay >= 18 || timeOfDay < 6;
    const isHot = temperature > 25;
    const isCold = temperature < 15;
    const isWeekend = [0, 6].includes(new Date().getDay());

    const messageLC = message.toLowerCase();
    let response = '';

    // Yemek ile ilgili sorular
    if (messageLC.includes('yemek') || messageLC.includes('restoran') || messageLC.includes('kafe')) {
        response = `${locationInfo.district}'de tam size göre mekanlar var! ${isEvening ? 'Bu akşam' : 'Bugün'} şunları deneyebilirsiniz:

${isHot ? '🌡️ Sıcak havada serinlemek için:' : isCold ? '🌡️ Soğuk havada ısınmak için:' : '👨‍🍳 Önerilen mekanlar:'}
1. ${locationInfo.district} Lezzet Evi - ${isEvening ? 'Akşam menüsü' : 'Günün menüsü'} çok özel
2. Keyif Cafe & Restaurant - ${isHot ? 'Ferah bahçesi' : 'Şömineli salonu'} ile ünlü
3. Geleneksel Kebapçı - Bölgenin meşhur lezzetleri

${weatherDesc} havada ${isHot ? 'klimalı' : isCold ? 'sıcak ve samimi' : 'rahat'} ortamda yemek yiyebilirsiniz.
${isWeekend ? '⚠️ Hafta sonu olduğu için rezervasyon yapmanızı öneririm.' : '💡 Öğle saatlerinde yoğunluk olabilir.'}`;

        // Gezi ve tur soruları
    } else if (messageLC.includes('gez') || messageLC.includes('tur') || messageLC.includes('keşif')) {
        response = `${locationInfo.district}'i keşfetmek için ${weatherDesc} bir gün! İşte size özel rota önerim:

🏛️ Görülmesi Gereken Yerler:
1. Tarihi ${locationInfo.district} Çarşısı - ${isHot ? 'Gölgeli sokakları' : 'Tarihi dokusu'} ile ünlü
2. Kent Müzesi - ${isHot || isCold ? 'İdeal iç mekan aktivitesi' : 'Zengin koleksiyonu'} ile dikkat çekiyor
3. Eski Mahalle Sokakları - ${isEvening ? 'Akşam ışıklandırması' : 'Nostaljik atmosferi'} muhteşem

⏰ Önerilen Süre: 2-3 saat
🌡️ Hava ${weatherDesc} ve ${temperature}°C
🎯 İpucu: ${isHot ? 'Yanınıza su ve şapka almayı unutmayın' : isCold ? 'Kalın giyinmenizi öneririm' : 'Rahat ayakkabılar giymenizi öneririm'}
${isWeekend ? '👥 Hafta sonu kalabalık olabilir, erken saatleri tercih edin' : '🎫 Müze giriş ücretleri hafta içi daha uygun'}`;

        // Doğa ve park soruları
    } else if (messageLC.includes('park') || messageLC.includes('doğa') || messageLC.includes('yürüyüş')) {
        response = `${locationInfo.district}'de doğayla iç içe olabileceğiniz harika yerler var:

🌳 Önerilen Rotalar:
1. Şehir Parkı - ${isHot ? 'Gölgeli banklar' : 'Güzel manzara'} mevcut
2. Botanik Bahçesi - ${isEvening ? 'Akşam ışıklandırması' : 'Rengarenk çiçekler'}
3. Göl Kenarı Yürüyüş Yolu - ${isWeekend ? 'Hafta sonu kahvaltı mekanları' : 'Sakin ortam'}

⛅ Hava Durumu: ${weatherDesc}, ${temperature}°C
🎯 Öneri: ${isHot ? 'Güneş kremi ve bol su alın' : isCold ? 'Sıcak içecek termosu işinize yarayabilir' : 'Fotoğraf makinenizi unutmayın'}
⏰ En iyi zaman: ${isHot ? 'Sabah erken saatler' : isCold ? 'Öğlen saatleri' : 'Tüm gün uygun'}`;

        // Tarih ve kültür soruları
        if (messageLC.includes('tarih') || messageLC.includes('müze') || messageLC.includes('kültür')) {
            response = `${locationInfo.district}'deki tarihi ve kültürel mekanlar için önerilerim:

🏛️ Görülmesi Gereken Yerler:
1. ${locationInfo.district} Kent Müzesi - Bölgenin tarihini ve kültürünü yakından tanıyın
2. Tarihi ${locationInfo.district} Çarşısı - Yerel el sanatları ve antika dükkanları
3. Eski Cami ve Külliyesi - Osmanlı mimarisi örneği

⏰ En İyi Ziyaret Saati: ${isHot ? 'Sabah 10:00-12:00 arası' : 'Öğleden sonra 14:00-16:00 arası'}
🎫 Giriş Ücretleri: Müze kartı geçerli, öğrenci indirimi mevcut
🌡️ Hava Durumu: ${weatherDesc}, ${temperature}°C

💡 İpucu: ${isHot ?
                    'Sıcak havada müze ziyaretini öne alın, çarşı gezisini akşamüstüne bırakın.' :
                    isCold ?
                        'Soğuk havada kapalı mekanları tercih edin, müze ideal bir seçenek.' :
                        'Hava çok güzel, açık ve kapalı mekanları birleştiren bir rota izleyebilirsiniz.'}

${isWeekend ?
                    '⚠️ Hafta sonu kalabalık olabilir, sabah erken saatleri tercih edin.' :
                    '🎯 Hafta içi daha sakin bir gezi yapabilirsiniz.'}`;
        }

        // Genel sorular
    } else {
        response = `Merhaba! ${locationInfo.district}'de bugün yapabileceğiniz harika aktiviteler var.

${weatherDesc} havada size özel önerilerim:
1. ${isHot ? 'Kapalı AVM ziyareti' : isCold ? 'Sıcak salonlu kafe keyfi' : 'Şehir merkezi turu'}
2. ${locationInfo.district} Müzesi - ${isHot || isCold ? 'İdeal iç mekan aktivitesi' : 'Kültür turu'}
3. Yerel Lezzetler Sokağı - ${isEvening ? 'Akşam atmosferi harika' : 'Öğlen menüleri çok lezzetli'}

🌡️ Sıcaklık: ${temperature}°C
🌞 Şu an: ${isEvening ? 'Akşam saatleri' : 'Gündüz vakti'}
${isWeekend ? '📅 Hafta sonu programı için erken davranmanızı öneririm' : '🎫 Hafta içi avantajlı biletler mevcut'}

Daha detaylı öneriler için ilgi alanınızı belirtebilirsiniz (örn: yemek, gezi, alışveriş, kültür).`;
    }

    return response;
}; 