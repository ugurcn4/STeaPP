import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, Animated, ActivityIndicator, Easing, Platform, RefreshControl, Alert } from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import ProfileModal from '../modals/ProfileModal';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { collection, query, onSnapshot, orderBy, doc, getDoc, where, updateDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import ProgressBar from 'react-native-progress/Bar';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import { LinearGradient } from 'expo-linear-gradient';
import WeatherCard from './HomePageCards/WeatherCard';
import { haversine } from '../helpers/locationUtils';
import LottieView from 'lottie-react-native';
import CityExplorerCard from './HomePageCards/CityExplorerCard';
import FastImage from 'react-native-fast-image';
import styles from '../styles/HomePageStyles';

// motivationMessages'ı component dışında tanımlayalım
const motivationMessages = [
    "STeaPP ile yürüyüşlerinizi kaydedin, anılarınızı paylaşın!",
    "Her adım, sağlığınıza bir adım daha yaklaşmanızı sağlar. Hedefinize doğru yürümeye devam edin!",
    "Her gün en az 10.000 adım atmaya çalışın. Sağlığınız için küçük adımlar, büyük farklar yaratır.",
    "Yeni yerler keşfetmek, ruhunuzu besler. Bugün bir adım atın ve keşfe çıkın!",
    "Dünya, keşfedilmeyi bekleyen güzelliklerle dolu.",
    "Dışarıda harika bir gün! Steapp ile yerlerinizi işaretleyin ve hatıralarınızı oluşturun.",
];

const HomePage = ({ navigation }) => {
    const [modalVisible, setModalVisible] = useState(false);
    const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
    const fadeAnim = useRef(new Animated.Value(1)).current;
    const [isAnimating, setIsAnimating] = useState(false);

    const [userId, setUserId] = useState(null);
    const [todayStats, setTodayStats] = useState({ places: 0, distance: 0 });
    const [totalStats, setTotalStats] = useState({ places: 0, distance: 0 });
    const DAILY_GOAL_KM = 7;
    const [dailyGoalPercentage, setDailyGoalPercentage] = useState(0);
    const [weather, setWeather] = useState(null);
    const [userName, setUserName] = useState('');
    const [userEmail, setUserEmail] = useState('');
    const [userData, setUserData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [waveAnimation] = useState(new Animated.Value(0));
    const [handAnimation] = useState(new Animated.Value(0));
    const [showConfetti, setShowConfetti] = useState(false);
    const [currentStreak, setCurrentStreak] = useState(0);
    const [lastCompletionDate, setLastCompletionDate] = useState(null);
    const [refreshing, setRefreshing] = useState(false);
    const [showInfoTooltip, setShowInfoTooltip] = useState(false);

    useEffect(() => {
        let timeoutId;

        const animateMessage = () => {
            setIsAnimating(true);

            Animated.sequence([
                Animated.timing(fadeAnim, {
                    toValue: 0,
                    duration: 500,
                    useNativeDriver: true,
                    easing: Easing.out(Easing.ease)
                }),
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 500,
                    useNativeDriver: true,
                    easing: Easing.in(Easing.ease)
                })
            ]).start(() => {
                setIsAnimating(false);
            });

            setCurrentMessageIndex(prev => (prev + 1) % motivationMessages.length);
        };

        const startMessageCycle = () => {
            timeoutId = setTimeout(() => {
                if (!isAnimating) {
                    animateMessage();
                }
                startMessageCycle();
            }, 5000);
        };

        startMessageCycle();

        return () => {
            if (timeoutId) {
                clearTimeout(timeoutId);
            }
        };
    }, [isAnimating]);

    useEffect(() => {
        const auth = getAuth();
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                setUserId(user.uid);
                // Firebase'in başlatılmasını bekle
                try {
                    if (!db) {
                        await initializeFirebase();
                        db = getFirebaseDb();
                    }
                    fetchUserData(user);

                    // Uygulama açıldığında hemen konum ve bildirim izinlerini talep et
                    requestPermissions();
                } catch (error) {
                    console.error('Firebase başlatma hatası:', error);
                    setIsLoading(false);
                }
            } else {
                setIsLoading(false);
            }
        });

        return () => unsubscribe();
    }, []);

    // İzinleri talep etme fonksiyonu
    const requestPermissions = async () => {
        try {
            // Konum izni iste
            const { status: locationStatus } = await Location.requestForegroundPermissionsAsync();
            if (locationStatus !== 'granted') {
                Alert.alert(
                    "Konum İzni Gerekli",
                    "Harita özellikleri ve konum tabanlı hizmetler için konum izni gereklidir.",
                    [{ text: "Tamam" }]
                );
            }

            // Bildirim izni iste
            const { status: notificationStatus } = await Notifications.getPermissionsAsync();
            if (notificationStatus !== 'granted') {
                const { status: newStatus } = await Notifications.requestPermissionsAsync();
                if (newStatus !== 'granted') {
                    Alert.alert(
                        "Bildirim İzni",
                        "Etkinlik bildirimleri ve yeni mesajlar için bildirim izni gereklidir.",
                        [{ text: "Tamam" }]
                    );
                }
            }
        } catch (error) {
            console.error('İzin isteme hatası:', error);
        }
    };

    useEffect(() => {
        fetchWeather();
    }, []);

    useEffect(() => {
        const startAnimation = () => {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(waveAnimation, {
                        toValue: 1,
                        duration: 1500,
                        easing: Easing.linear,
                        useNativeDriver: true
                    }),
                    Animated.timing(waveAnimation, {
                        toValue: 0,
                        duration: 1500,
                        easing: Easing.linear,
                        useNativeDriver: true
                    })
                ])
            ).start();
        };

        startAnimation();
        return () => waveAnimation.setValue(0);
    }, []);

    useEffect(() => {
        const waveHand = () => {
            Animated.sequence([
                Animated.timing(handAnimation, {
                    toValue: 1,
                    duration: 400,
                    easing: Easing.linear,
                    useNativeDriver: true
                }),
                Animated.timing(handAnimation, {
                    toValue: -1,
                    duration: 400,
                    easing: Easing.linear,
                    useNativeDriver: true
                }),
                Animated.timing(handAnimation, {
                    toValue: 1,
                    duration: 400,
                    easing: Easing.linear,
                    useNativeDriver: true
                }),
                Animated.timing(handAnimation, {
                    toValue: 0,
                    duration: 400,
                    easing: Easing.linear,
                    useNativeDriver: true
                })
            ]).start(() => {
                // 2 saniye bekle ve tekrar başlat
                setTimeout(waveHand, 2000);
            });
        };

        waveHand();
        return () => handAnimation.setValue(0);
    }, []);

    const rotate = waveAnimation.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg']
    });

    const scale = waveAnimation.interpolate({
        inputRange: [0, 0.5, 1],
        outputRange: [1, 1.2, 1]
    });

    const handRotate = handAnimation.interpolate({
        inputRange: [-1, 0, 1],
        outputRange: ['-20deg', '0deg', '20deg']
    });

    const fetchUserData = async (user) => {
        try {
            const docRef = doc(db, 'users', user.uid);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                const data = docSnap.data();
                setUserData(data);
                setUserName(data.informations?.name || user.displayName || user.email.split('@')[0]);
                setUserEmail(user.email);

                // Streak verilerini doğru şekilde al
                const streak = data.currentStreak || 0;
                const lastDate = data.lastCompletionDate?.toDate();

                // Eğer son tamamlama tarihi varsa ve bir günden fazla geçmişse streak'i sıfırla
                const today = new Date();
                today.setHours(0, 0, 0, 0);

                if (lastDate) {
                    const daysDifference = Math.floor(
                        (today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24)
                    );

                    if (daysDifference > 1) {
                        // Bir günden fazla geçmişse streak'i sıfırla
                        setCurrentStreak(0);
                        await updateDoc(docRef, { currentStreak: 0 });
                    } else {
                        setCurrentStreak(streak);
                    }
                } else {
                    setCurrentStreak(0);
                }

                setLastCompletionDate(lastDate || null);
            } else {
                setUserName(user.displayName || user.email.split('@')[0]);
                setUserEmail(user.email);
                await setDoc(docRef, {
                    currentStreak: 0,
                    lastCompletionDate: null,
                    streakHistory: {}
                });
            }
        } catch (error) {
            console.error('Kullanıcı verileri çekilirken hata:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchWeather = async () => {
        try {
            // Konum izninin verilip verilmediğini kontrol et
            const { status } = await Location.getForegroundPermissionsAsync();
            if (status !== 'granted') {
                // İzin yoksa hava durumu verisi çekilmez
                return;
            }

            // Kullanıcının konumunu alın
            let location = await Location.getCurrentPositionAsync({});
            const { latitude, longitude } = location.coords;

            // Ters geokodlama işlemi ile il ve ilçe bilgilerini alın
            const reverseGeocode = await Location.reverseGeocodeAsync({ latitude, longitude });
            const locationInfo = reverseGeocode[0];

            // Şehir bilgisi için region (il) kullan, ilçe bilgisi için subregion kullan
            const city = locationInfo.region; // İl bilgisi 
            const district = locationInfo.subregion; // İlçe bilgisi 

            // Hava durumu verilerini çekin
            const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=c48c01ab4475dd8589ace2105704e4b8&units=metric&lang=tr`);
            const data = await response.json();
            if (data.main && data.weather && data.wind) {
                const weatherDescription = data.weather[0].description;

                setWeather({
                    temperature: data.main.temp,
                    description: weatherDescription,
                    icon: data.weather[0].icon,
                    windSpeed: data.wind.speed,
                    humidity: data.main.humidity,
                    rainProbability: data.rain ? data.rain['1h'] || 0 : 0,
                    backgroundColor: 'white',
                    city: city, // İl bilgisi
                    district: district // İlçe bilgisi
                });
            }
        } catch (error) {
            console.error('Hava durumu verileri alınırken hata:', error);
        }
    };

    useEffect(() => {
        if (userId) {
            const pathsRef = collection(db, `users/${userId}/paths`);
            const userPathsQuery = query(
                pathsRef,
                orderBy('firstDiscovery', 'desc')
            );

            const unsubscribe = onSnapshot(userPathsQuery, (snapshot) => {
                const today = new Date();
                today.setHours(0, 0, 0, 0);

                let todayTotalDistance = 0;
                let todayPlacesCount = 0;
                let allTimeDistance = 0;
                let allTimePlacesCount = 0;

                snapshot.docs.forEach(doc => {
                    const path = doc.data();
                    let discoveryTime;

                    // firstDiscovery'nin türünü kontrol et ve uygun şekilde işle
                    if (path.firstDiscovery) {
                        if (typeof path.firstDiscovery.toDate === 'function') {
                            // Firestore Timestamp nesnesi
                            discoveryTime = path.firstDiscovery.toDate();
                        } else if (path.firstDiscovery instanceof Date) {
                            // Zaten Date nesnesi
                            discoveryTime = path.firstDiscovery;
                        } else if (typeof path.firstDiscovery === 'string') {
                            // ISO string
                            discoveryTime = new Date(path.firstDiscovery);
                        } else {
                            // Diğer durumlar için güvenli bir varsayılan
                            discoveryTime = new Date();
                        }
                    } else {
                        // firstDiscovery yoksa şimdiki zamanı kullan
                        discoveryTime = new Date();
                    }

                    const points = path.points || [];

                    if (points.length >= 2) {
                        // Mesafeyi metre cinsinden hesapla ve kilometreye çevir
                        const pathDistance = calculatePathDistance(points) / 1000; // km'ye çevir

                        // Her path bir yer olarak sayılır
                        if (discoveryTime && discoveryTime >= today) {
                            todayTotalDistance += pathDistance;
                            todayPlacesCount += 1; // Bugün keşfedilen yer sayısı
                        }

                        allTimeDistance += pathDistance;
                        allTimePlacesCount += 1; // Toplam keşfedilen yer sayısı
                    }
                });

                setTodayStats({
                    places: todayPlacesCount,
                    distance: Math.round(todayTotalDistance)
                });

                setTotalStats({
                    places: allTimePlacesCount,
                    distance: Math.round(allTimeDistance)
                });

                const percentage = Math.min((todayTotalDistance / DAILY_GOAL_KM) * 100, 100);
                setDailyGoalPercentage(Math.round(percentage));

                // Hedef tamamlandığında streak'i güncelle
                if (percentage >= 100) {
                    updateStreak();
                }
            });

            return () => unsubscribe();
        }
    }, [userId]);

    const calculatePathDistance = (points) => {
        if (!points || points.length < 2) return 0;

        let total = 0;
        for (let i = 1; i < points.length; i++) {
            const prevPoint = points[i - 1];
            const currentPoint = points[i];

            if (prevPoint.latitude && prevPoint.longitude &&
                currentPoint.latitude && currentPoint.longitude) {
                total += haversine(
                    prevPoint.latitude,
                    prevPoint.longitude,
                    currentPoint.latitude,
                    currentPoint.longitude
                );
            }
        }

        return total;
    };

    const getProfileImageUri = () => {
        if (userData?.profilePicture) {
            return {
                uri: userData.profilePicture,
                priority: FastImage.priority.normal,
                cache: FastImage.cacheControl.immutable
            };
        } else {
            const initials = userName?.slice(0, 2).toUpperCase() || "PP";
            return {
                uri: `https://ui-avatars.com/api/?name=${initials}&background=4CAF50&color=fff&size=128`,
                priority: FastImage.priority.normal,
                cache: FastImage.cacheControl.web
            };
        }
    };

    const formatUserName = (name) => {
        if (!name) return '';
        // İsim 15 karakterden uzunsa, kısalt ve "..." ekle
        return name.length > 15 ? `${name.slice(0, 15)}...` : name;
    };

    const quickAccessContainer = (
        <View style={styles.quickAccessContainer}>
            <TouchableOpacity
                style={styles.quickAccessCard}
                onPress={() => navigation.navigate('NearbyToilets')}
            >
                <View style={[styles.quickAccessIcon, { backgroundColor: '#E1F5FE' }]}>
                    <MaterialIcons name="wc" size={24} color="#0288D1" />
                </View>
                <Text style={styles.quickAccessTitle}>Tuvaletler</Text>
            </TouchableOpacity>

            <TouchableOpacity
                style={styles.quickAccessCard}
                onPress={() => navigation.navigate('GasStations')}
            >
                <View style={[styles.quickAccessIcon, { backgroundColor: '#E8F5E9' }]}>
                    <MaterialIcons name="local-gas-station" size={24} color="#4CAF50" />
                </View>
                <Text style={styles.quickAccessTitle}>Yakıt İstasyonları</Text>
            </TouchableOpacity>

            <TouchableOpacity
                style={styles.quickAccessCard}
                onPress={() => navigation.navigate('Pharmacies')}
            >
                <View style={[styles.quickAccessIcon, { backgroundColor: '#FBE9E7' }]}>
                    <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#D84315' }}>E</Text>
                </View>
                <Text style={styles.quickAccessTitle}>Eczaneler</Text>
            </TouchableOpacity>

            <TouchableOpacity
                style={styles.quickAccessCard}
                onPress={() => navigation.navigate('NearbyRestaurants')}
            >
                <View style={[styles.quickAccessIcon, { backgroundColor: '#FFEBEE' }]}>
                    <MaterialIcons name="restaurant" size={24} color="#FF5252" />
                </View>
                <Text style={styles.quickAccessTitle}>Restoranlar</Text>
            </TouchableOpacity>

            <TouchableOpacity
                style={styles.quickAccessCard}
                onPress={() => navigation.navigate('NearbyHotels')}
            >
                <View style={[styles.quickAccessIcon, { backgroundColor: '#E8EAF6' }]}>
                    <MaterialIcons name="hotel" size={24} color="#3F51B5" />
                </View>
                <Text style={styles.quickAccessTitle}>Oteller</Text>
            </TouchableOpacity>

            <TouchableOpacity
                style={styles.quickAccessCard}
                onPress={() => navigation.navigate('NearbyAttractions')}
            >
                <View style={[styles.quickAccessIcon, { backgroundColor: '#E0F2F1' }]}>
                    <MaterialIcons name="place" size={24} color="#009688" />
                </View>
                <Text style={styles.quickAccessTitle}>Gezilecek Yerler</Text>
            </TouchableOpacity>
        </View>
    );

    const renderAIRecommendationsCard = () => {
        const [currentMessage, setCurrentMessage] = useState(0);
        const [displayedText, setDisplayedText] = useState('');
        const [isTyping, setIsTyping] = useState(true);

        const messages = [
            "Size nasıl yardımcı olabilirim?",
            "Yeni yerler keşfetmek ister misiniz?",
            "Bugün nereyi gezmek istersiniz?",
            "Birlikte yeni rotalar oluşturalım!",
            "Sizin için özel önerilerim var!"
        ];

        // Yazma animasyonu için
        useEffect(() => {
            let currentIndex = 0;
            let currentText = messages[currentMessage];
            setIsTyping(true);

            // Karakterleri tek tek yazma
            const typingInterval = setInterval(() => {
                if (currentIndex <= currentText.length) {
                    setDisplayedText(currentText.slice(0, currentIndex));
                    currentIndex++;
                } else {
                    clearInterval(typingInterval);
                    setIsTyping(false);

                    // Silme işlemi için zamanlayıcı
                    setTimeout(() => {
                        const deletingInterval = setInterval(() => {
                            setDisplayedText(prev => {
                                if (prev.length > 0) {
                                    return prev.slice(0, -1);
                                } else {
                                    clearInterval(deletingInterval);
                                    setCurrentMessage((prev) => (prev + 1) % messages.length);
                                    return '';
                                }
                            });
                        }, 50); // Silme hızı
                    }, 2000); // Mesajın ekranda kalma süresi
                }
            }, 100); // Yazma hızı

            return () => {
                clearInterval(typingInterval);
            };
        }, [currentMessage]);

        // Yanıp sönen imleç için animasyon
        const cursorAnim = useRef(new Animated.Value(0)).current;

        useEffect(() => {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(cursorAnim, {
                        toValue: 1,
                        duration: 500,
                        useNativeDriver: true,
                    }),
                    Animated.timing(cursorAnim, {
                        toValue: 0,
                        duration: 500,
                        useNativeDriver: true,
                    }),
                ])
            ).start();
        }, []);

        return (
            <TouchableOpacity
                style={styles.aiRecommendCard}
                onPress={() => navigation.navigate('AIChat')}
            >
                <LinearGradient
                    colors={['#6C3EE8', '#4527A0']}
                    style={styles.aiCardGradient}
                >
                    <View style={styles.aiCardContent}>
                        <View style={styles.aiCardLeft}>
                            <View style={styles.aiIconContainer}>
                                <MaterialIcons name="psychology" size={32} color="#FFF" />
                                <Animated.View
                                    style={[
                                        styles.pulseCircle,
                                        { opacity: isTyping ? 1 : 0.3 }
                                    ]}
                                />
                            </View>
                            <View style={styles.aiCardTextContainer}>
                                <Text style={styles.aiCardTitle}>STeaPPY AI</Text>
                                <View style={styles.messageContainer}>
                                    <Text
                                        style={styles.aiCardSubtitle}
                                        numberOfLines={2}
                                    >
                                        {displayedText}
                                    </Text>
                                    <Animated.Text
                                        style={[
                                            styles.cursor,
                                            { opacity: cursorAnim }
                                        ]}
                                    >
                                        |
                                    </Animated.Text>
                                </View>
                            </View>
                        </View>
                        <Animated.View
                            style={[
                                styles.aiCardIcon,
                                { transform: [{ rotate: rotate }, { scale: scale }] }
                            ]}
                        >
                            <MaterialIcons name="arrow-forward" size={24} color="#FFF" />
                        </Animated.View>
                    </View>
                </LinearGradient>
            </TouchableOpacity>
        );
    };

    const renderMotivationCard = () => (
        <Animated.View
            style={[
                styles.motivationCard,
                {
                    opacity: fadeAnim,
                    transform: [{
                        translateY: fadeAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [20, 0]
                        })
                    }]
                }
            ]}
        >
            <Text style={styles.motivationText}>
                {motivationMessages[currentMessageIndex]}
            </Text>
        </Animated.View>
    );

    const renderGoalCard = () => (
        <TouchableOpacity
            style={styles.goalCard}
            activeOpacity={1}
        >
            <View style={styles.goalHeader}>
                <View style={styles.goalTitleContainer}>
                    <Text style={styles.goalTitle}>Günlük Hedef</Text>
                    <TouchableOpacity
                        onPress={() => setShowInfoTooltip(!showInfoTooltip)}
                        style={styles.infoButton}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                        <MaterialIcons name="info-outline" size={20} color="#95A5A6" />
                    </TouchableOpacity>
                    {showInfoTooltip && (
                        <TouchableOpacity
                            style={styles.tooltipOverlay}
                            activeOpacity={1}
                            onPress={() => setShowInfoTooltip(false)}
                        >
                            <View style={styles.tooltipContainer}>
                                <View style={styles.tooltipArrow} />
                                <View style={styles.tooltipContent}>
                                    <View style={styles.tooltipHeader}>
                                        <Text style={styles.tooltipTitle}>Nasıl Hesaplanır?</Text>
                                        <TouchableOpacity
                                            onPress={() => setShowInfoTooltip(false)}
                                            style={styles.closeButton}
                                        >
                                            <MaterialIcons name="close" size={20} color="#95A5A6" />
                                        </TouchableOpacity>
                                    </View>
                                    <View style={styles.tooltipSection}>
                                        <Text style={styles.tooltipSubtitle}>Günlük Hedef:</Text>
                                        <Text style={styles.tooltipText}>• Günlük hedef {DAILY_GOAL_KM}km'dir</Text>
                                        <Text style={styles.tooltipText}>• Katedilen mesafenin sayılması için haritada işaretlenmesi gerekmektedir</Text>
                                        <Text style={styles.tooltipText}>• Her gün en az {DAILY_GOAL_KM}km yol kat etmelisiniz</Text>
                                        <Text style={styles.tooltipText}>• İlerleme çubuğu gün içinde kat ettiğiniz mesafeyi gösterir</Text>
                                    </View>
                                    <View style={styles.tooltipSection}>
                                        <Text style={styles.tooltipSubtitle}>Streak Sistemi:</Text>
                                        <Text style={styles.tooltipText}>• Her gün hedefinizi tamamladığınızda streak'iniz 1 artar</Text>
                                        <Text style={styles.tooltipText}>• Bir gün kaçırırsanız streak sıfırlanır</Text>
                                        <Text style={styles.tooltipText}>• Streak'iniz başarı serinizi gösterir</Text>
                                    </View>
                                </View>
                            </View>
                        </TouchableOpacity>
                    )}
                </View>
                <View style={styles.streakContainer}>
                    <Ionicons name="flame" size={20} color="#FF6B6B" />
                    <Text style={styles.streakText}>{currentStreak} gün</Text>
                </View>
            </View>

            <View style={styles.goalProgress}>
                <ProgressBar
                    progress={dailyGoalPercentage / 100}
                    width={null}
                    color="#FF4500"
                    unfilledColor="#D3D3D3"
                    borderWidth={0}
                    height={12}
                    borderRadius={6}
                />
                <Text style={styles.goalPercentage}>%{dailyGoalPercentage}</Text>
            </View>

            <View style={styles.goalStats}>
                <View style={styles.goalStat}>
                    <Text style={styles.goalStatValue}>{todayStats.distance}km</Text>
                    <Text style={styles.goalStatLabel}>Bugün</Text>
                </View>
                <View style={styles.goalStat}>
                    <Text style={styles.goalStatValue}>{DAILY_GOAL_KM}km</Text>
                    <Text style={styles.goalStatLabel}>Hedef</Text>
                </View>
            </View>

            {showConfetti && (
                <View style={styles.confettiContainer}>
                    <LottieView
                        source={require('../../assets/animations/confetti.json')}
                        autoPlay
                        loop={false}
                        style={styles.confetti}
                        onAnimationFinish={() => setShowConfetti(false)}
                    />
                </View>
            )}
        </TouchableOpacity>
    );

    // Streak'i güncelleme fonksiyonu
    const updateStreak = async () => {
        if (!userId) return;

        try {
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const userRef = doc(db, 'users', userId);
            const userDoc = await getDoc(userRef);
            const userData = userDoc.data();

            let newStreak = 1; // Varsayılan olarak 1'den başlat

            const lastDate = userData.lastCompletionDate?.toDate();

            if (lastDate) {
                const lastDateNormalized = new Date(lastDate);
                lastDateNormalized.setHours(0, 0, 0, 0);

                // Bugünün tarihinden bir önceki günü hesapla
                const yesterday = new Date(today);
                yesterday.setDate(yesterday.getDate() - 1);
                yesterday.setHours(0, 0, 0, 0);

                if (lastDateNormalized.getTime() === yesterday.getTime()) {
                    // Dün tamamlanmış, streak'i artır
                    newStreak = (userData.currentStreak || 0) + 1;
                } else if (lastDateNormalized.getTime() === today.getTime()) {
                    // Bugün zaten tamamlanmış, mevcut streak'i koru
                    newStreak = userData.currentStreak || 1;
                } else {
                    // Son tamamlama tarihi dün veya bugün değilse, streak sıfırlanır
                    newStreak = 1;
                }
            }

            // Firebase'i güncelle
            await updateDoc(userRef, {
                currentStreak: newStreak,
                lastCompletionDate: serverTimestamp(),
                [`streakHistory.${today.toISOString().split('T')[0]}`]: {
                    streak: newStreak,
                    completionTime: serverTimestamp()
                }
            });

            // Local state'i güncelle
            setCurrentStreak(newStreak);
            setLastCompletionDate(today);

            // Hedef tamamlandığında konfeti göster
            if (!showConfetti) {
                setShowConfetti(true);
            }
        } catch (error) {
            console.error('Streak güncellenirken hata:', error);
        }
    };

    // Yenileme fonksiyonu
    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        try {
            // Yenilenecek verileri burada çağıralım
            await Promise.all([
                fetchWeather(),
                fetchUserData(getAuth().currentUser),
                // Diğer yenilenecek veriler...
            ]);
        } catch (error) {
            console.error('Yenileme sırasında hata:', error);
        } finally {
            setRefreshing(false);
        }
    }, []);

    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={{ paddingBottom: 80 }}
            refreshControl={
                <RefreshControl
                    refreshing={refreshing}
                    onRefresh={onRefresh}
                    tintColor="#4CAF50"
                    colors={["#4CAF50"]}
                />
            }
        >
            <View style={styles.header}>
                <View style={styles.profileSection}>
                    <View style={styles.greetingContainer}>
                        {isLoading ? (
                            <ActivityIndicator size="small" color="#4CAF50" />
                        ) : (
                            <View>
                                <View style={styles.welcomeTextContainer}>
                                    <Text style={[styles.welcomeText, { color: '#666' }]}>Merhaba, </Text>
                                    <Text style={styles.welcomeText} numberOfLines={1} ellipsizeMode="tail">
                                        {userName ? formatUserName(userName) : ''}
                                    </Text>
                                    <Animated.Text
                                        style={[
                                            styles.welcomeText,
                                            {
                                                transform: [{ rotate: handRotate }],
                                                marginLeft: 4
                                            }
                                        ]}
                                    >
                                        👋
                                    </Animated.Text>
                                </View>
                                <Text style={styles.emailText}>{userEmail}</Text>
                            </View>
                        )}
                        <TouchableOpacity
                            style={styles.profileButton}
                            onPress={() => setModalVisible(true)}
                        >
                            <View style={styles.avatarOuterContainer}>
                                <Animated.View
                                    style={[
                                        styles.waveContainer,
                                        {
                                            transform: [
                                                { rotate },
                                                { scale }
                                            ]
                                        }
                                    ]}
                                >
                                    <View style={styles.wave} />
                                    <View style={[styles.wave, styles.wave2]} />
                                </Animated.View>
                                <View style={styles.avatarContainer}>
                                    {isLoading ? (
                                        <ActivityIndicator size="small" color="#25D220" />
                                    ) : (
                                        <FastImage
                                            source={getProfileImageUri()}
                                            style={styles.avatarImage}
                                            resizeMode={FastImage.resizeMode.cover}
                                            onError={() => {
                                                const initials = userName?.slice(0, 2).toUpperCase() || "PP";
                                                setUserData(prev => ({
                                                    ...prev,
                                                    profilePicture: `https://ui-avatars.com/api/?name=${initials}&background=4CAF50&color=fff&size=128`
                                                }));
                                            }}
                                        />
                                    )}
                                </View>
                            </View>
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={styles.statsContainer}>
                    <View style={styles.statCard}>
                        <View style={styles.statIconContainer}>
                            <Ionicons name="location" size={24} color="#FF6347" />
                        </View>
                        <Text style={styles.statNumber}>{todayStats.places}</Text>
                        <Text style={styles.statLabel}>Bugün</Text>
                    </View>
                    <View style={styles.statCard}>
                        <View style={styles.statIconContainer}>
                            <Ionicons name="walk" size={24} color="#4CAF50" />
                        </View>
                        <Text style={styles.statNumber}>{todayStats.distance}km</Text>
                        <Text style={styles.statLabel}>Mesafe</Text>
                    </View>
                    <View style={styles.statCard}>
                        <View style={styles.statIconContainer}>
                            <Ionicons name="trophy" size={24} color="#FFD700" />
                        </View>
                        <Text style={styles.statNumber}>{totalStats.places}</Text>
                        <Text style={styles.statLabel}>Toplam</Text>
                    </View>
                </View>
            </View>

            <View style={styles.content}>
                <CityExplorerCard navigation={navigation} />

                {weather && <WeatherCard weather={weather} />}

                {renderGoalCard()}

                {quickAccessContainer}

                {renderAIRecommendationsCard()}
                {renderMotivationCard()}
            </View>

            <ProfileModal
                modalVisible={modalVisible}
                setModalVisible={setModalVisible}
                navigation={navigation}
            />
        </ScrollView>
    );
};

export default HomePage;