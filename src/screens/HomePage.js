import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { collection, doc, getDoc, onSnapshot, orderBy, query, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';
import LottieView from 'lottie-react-native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Animated, Easing, RefreshControl, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import FastImage from 'react-native-fast-image';
import ProgressBar from 'react-native-progress/Bar';
import { db } from '../../firebaseConfig';
import { haversine } from '../helpers/locationUtils';
import { translate } from '../i18n/i18n';
import ProfileModal from '../modals/ProfileModal';
import styles from '../styles/HomePageStyles';
import CityExplorerCard from './HomePageCards/CityExplorerCard';
import WeatherCard from './HomePageCards/WeatherCard';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AIRecommendationsCard from './HomePageCards/AIRecommendationsCard';

// motivationMessages'ı component dışında tanımlayalım
const motivationMessages = [
    "motivation_message_1",
    "motivation_message_2",
    "motivation_message_3",
    "motivation_message_4",
    "motivation_message_5",
    "motivation_message_6",
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
    const [showConfetti, setShowConfetti] = useState(false);
    const [currentStreak, setCurrentStreak] = useState(0);
    const [, setLastCompletionDate] = useState(null);
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

        // İlk açılışta animasyonu daha geç başlat
        if (!isLoading) {
            const initialDelay = setTimeout(() => {
                startMessageCycle();
            }, 2000); // UI yüklendikten 2 saniye sonra animasyonu başlat
            
            return () => {
                clearTimeout(initialDelay);
                if (timeoutId) {
                    clearTimeout(timeoutId);
                }
            };
        }
        
        return () => {
            if (timeoutId) {
                clearTimeout(timeoutId);
            }
        };
    }, [isAnimating, isLoading]);

    useEffect(() => {
        const auth = getAuth();
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                setUserId(user.uid);
                
                // Önce önbellekten verileri yüklemeyi dene
                const cachedDataLoaded = await loadCachedUserData();
                
                try {
                    // Arka planda verileri güncelleyecek, yükleme göstergesini etkilemeyecek
                    fetchUserData(user);
                    
                    // Eğer önbellekten veriler yüklendiyse, konum izinlerini arka planda iste
                    if (cachedDataLoaded) {
                        // Konum ve bildirim izinlerini 1 saniye sonra iste (UI yüklendikten sonra)
                        setTimeout(() => {
                            requestPermissions();
                        }, 1000);
                    } else {
                        // Önbellekten veri yüklenemezse, normal şekilde iste
                        requestPermissions(); 
                    }
                } catch (error) {
                    console.error('Veri yükleme hatası:', error);
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
                    translate('location_permission_title'),
                    translate('location_permission_message'),
                    [{ text: translate('ok') }]
                );
            }

            // Bildirim izni iste
            const { status: notificationStatus } = await Notifications.getPermissionsAsync();
            if (notificationStatus !== 'granted') {
                const { status: newStatus } = await Notifications.requestPermissionsAsync();
                if (newStatus !== 'granted') {
                    Alert.alert(
                        translate('notification_permission_title'),
                        translate('notification_permission_message'),
                        [{ text: translate('ok') }]
                    );
                }
            }
        } catch (error) {
            console.error(translate('permission_request_error'), error);
        }
    };

    useEffect(() => {
        fetchWeather();
    }, []);

    const fetchUserData = async (user) => {
        try {
            const docRef = doc(db, 'users', user.uid);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                const data = docSnap.data();
                setUserData(data);
                const name = data.informations?.name || user.displayName || user.email.split('@')[0];
                setUserName(name);
                setUserEmail(user.email);

                // Kullanıcı verilerini önbelleğe kaydet
                cacheUserData(data, user.email, name);

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
            console.error(translate('user_data_fetch_error'), error);
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
            console.error(translate('weather_data_fetch_error'), error);
        }
    };

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

    // Yeni hali - useCallback ile memoize edilmiş ve öncelik yükseltilmiş:
    const getProfileImageUri = useCallback(() => {
        if (userData?.profilePicture) {
            return {
                uri: userData.profilePicture,
                priority: FastImage.priority.high, // Önceliği yükselt
                cache: FastImage.cacheControl.immutable
            };
        } else {
            const initials = userName?.slice(0, 2).toUpperCase() || "PP";
            return {
                uri: `https://ui-avatars.com/api/?name=${initials}&background=4CAF50&color=fff&size=128`,
                priority: FastImage.priority.high, // Önceliği yükselt 
                cache: FastImage.cacheControl.immutable // web yerine immutable kullanarak daha iyi önbellekleme
            };
        }
    }, [userData, userName]); // Sadece bu değerler değiştiğinde fonksiyon yeniden oluşturulacak

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
                <Text style={styles.quickAccessTitle}>{translate('toilets')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
                style={styles.quickAccessCard}
                onPress={() => navigation.navigate('GasStations')}
            >
                <View style={[styles.quickAccessIcon, { backgroundColor: '#E8F5E9' }]}>
                    <MaterialIcons name="local-gas-station" size={24} color="#4CAF50" />
                </View>
                <Text style={styles.quickAccessTitle}>{translate('gas_stations')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
                style={styles.quickAccessCard}
                onPress={() => navigation.navigate('Pharmacies')}
            >
                <View style={[styles.quickAccessIcon, { backgroundColor: '#FBE9E7' }]}>
                    <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#D84315' }}>E</Text>
                </View>
                <Text style={styles.quickAccessTitle}>{translate('pharmacies')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
                style={styles.quickAccessCard}
                onPress={() => navigation.navigate('NearbyRestaurants')}
            >
                <View style={[styles.quickAccessIcon, { backgroundColor: '#FFEBEE' }]}>
                    <MaterialIcons name="restaurant" size={24} color="#FF5252" />
                </View>
                <Text style={styles.quickAccessTitle}>{translate('restaurants')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
                style={styles.quickAccessCard}
                onPress={() => navigation.navigate('NearbyHotels')}
            >
                <View style={[styles.quickAccessIcon, { backgroundColor: '#E8EAF6' }]}>
                    <MaterialIcons name="hotel" size={24} color="#3F51B5" />
                </View>
                <Text style={styles.quickAccessTitle}>{translate('hotels')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
                style={styles.quickAccessCard}
                onPress={() => navigation.navigate('NearbyAttractions')}
            >
                <View style={[styles.quickAccessIcon, { backgroundColor: '#E0F2F1' }]}>
                    <MaterialIcons name="place" size={24} color="#009688" />
                </View>
                <Text style={styles.quickAccessTitle}>{translate('attractions')}</Text>
            </TouchableOpacity>
        </View>
    );

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
                {translate(motivationMessages[currentMessageIndex])}
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
                    <Text style={styles.goalTitle}>{translate('daily_goal')}</Text>
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
                                        <Text style={styles.tooltipTitle}>{translate('how_calculated')}</Text>
                                        <TouchableOpacity
                                            onPress={() => setShowInfoTooltip(false)}
                                            style={styles.closeButton}
                                        >
                                            <MaterialIcons name="close" size={20} color="#95A5A6" />
                                        </TouchableOpacity>
                                    </View>
                                    <View style={styles.tooltipSection}>
                                        <Text style={styles.tooltipSubtitle}>{translate('daily_goal_info')}</Text>
                                        <Text style={styles.tooltipText}>{translate('daily_goal_value', { goal: DAILY_GOAL_KM })}</Text>
                                        <Text style={styles.tooltipText}>{translate('distance_mark_requirement')}</Text>
                                        <Text style={styles.tooltipText}>{translate('daily_minimum', { goal: DAILY_GOAL_KM })}</Text>
                                        <Text style={styles.tooltipText}>{translate('progress_bar_info')}</Text>
                                    </View>
                                    <View style={styles.tooltipSection}>
                                        <Text style={styles.tooltipSubtitle}>{translate('streak_system')}</Text>
                                        <Text style={styles.tooltipText}>{translate('streak_explanation')}</Text>
                                        <Text style={styles.tooltipText}>{translate('streak_reset')}</Text>
                                        <Text style={styles.tooltipText}>{translate('streak_info')}</Text>
                                    </View>
                                </View>
                            </View>
                        </TouchableOpacity>
                    )}
                </View>
                <View style={styles.streakContainer}>
                    <Ionicons name="flame" size={20} color="#FF6B6B" />
                    <Text style={styles.streakText}>{currentStreak} {translate('day')}</Text>
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
                    <Text style={styles.goalStatLabel}>{translate('today')}</Text>
                </View>
                <View style={styles.goalStat}>
                    <Text style={styles.goalStatValue}>{DAILY_GOAL_KM}km</Text>
                    <Text style={styles.goalStatLabel}>{translate('goal')}</Text>
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
            console.error(translate('streak_update_error'), error);
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
            console.error(translate('refresh_error'), error);
        } finally {
            setRefreshing(false);
        }
    }, []);

    // Önbellekten kullanıcı verilerini yükleyen fonksiyon
    const loadCachedUserData = async () => {
        try {
            const cachedData = await AsyncStorage.getItem('cached_user_data');
            if (cachedData) {
                const { userData, userEmail, userName, timestamp, todayStatsCache, totalStatsCache } = JSON.parse(cachedData);
                
                // Önbelleğin 24 saatten eski olup olmadığını kontrol et
                const isExpired = Date.now() - timestamp > 24 * 60 * 60 * 1000;
                
                if (!isExpired) {
                    setUserData(userData);
                    setUserEmail(userEmail);
                    setUserName(userName);
                    
                    // Önbellekten istatistik verilerini de yükle
                    if (todayStatsCache) setTodayStats(todayStatsCache);
                    if (totalStatsCache) setTotalStats(totalStatsCache);
                    
                    // Yükleme durumunun sona erdiğini göster (bu sayede UI hemen görüntülenecek)
                    setIsLoading(false);
                    return true; // Önbellekten veri yüklendi
                }
            }
            return false; // Önbellekten veri yüklenemedi veya süresi doldu
        } catch (error) {
            console.error(translate('cache_load_error'), error);
            return false;
        }
    };

    // Kullanıcı verilerini önbelleğe kaydeden fonksiyon
    const cacheUserData = async (userData, userEmail, userName) => {
        try {
            const cacheData = {
                userData,
                userEmail,
                userName,
                todayStatsCache: todayStats,
                totalStatsCache: totalStats,
                timestamp: Date.now()
            };
            await AsyncStorage.setItem('cached_user_data', JSON.stringify(cacheData));
        } catch (error) {
            console.error(translate('cache_error'), error);
        }
    };

    // Hava durumu verilerini yükle - arka planda çalışacak ve UI'ı bloke etmeyecek
    const fetchWeatherInBackground = () => {
        // Arka planda çalışacak wrapper fonksiyon
        setTimeout(async () => {
            try {
                await fetchWeather();
            } catch (error) {
                console.error('Hava durumu verisi yüklenemedi:', error);
            }
        }, 500); // UI yüklendikten 500ms sonra başlat
    };

    useEffect(() => {
        // İlk yüklemede arka planda hava durumu verilerini getir
        if (!isLoading) {
            fetchWeatherInBackground();
        }
    }, [isLoading]);

    // UI kullanılabilir olduktan sonra gereksiz verileri yükleyen fonksiyon
    const loadNonEssentialData = useCallback(() => {
        if (!isLoading && userId) {
            // Sadece UI hazır olduğunda ve kullanıcı kimliği varsa ağır işlemleri yap
            setTimeout(async () => {
                try {
                    // Firebase veri dinlemelerini başlat (paths collection)
                    setupFirebaseListeners();
                    
                    // İstatistikleri güncelle
                    await updateStats();
                    
                } catch (error) {
                    console.error('Arka plan veri yükleme hatası:', error);
                }
            }, 2500); // UI tam olarak yüklendikten 2.5 saniye sonra
        }
    }, [isLoading, userId, setupFirebaseListeners]);

    // UI yüklendikten sonra gereksiz verileri yükle
    useEffect(() => {
        loadNonEssentialData();
    }, [isLoading, loadNonEssentialData]);

    // Veri dinleyicilerini ayrı bir fonksiyon olarak ayır
    const setupFirebaseListeners = useCallback(() => {
        if (!userId) return;
        
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
        
        // Cleanup fonksiyonunu doğrudan döndürmek yerine bir temizleme işlemi yapabiliriz
        return unsubscribe;
    }, [userId]);

    // İstatistikleri güncelleyecek fonksiyon
    const updateStats = async () => {
        // Burada istatistikleri güncelleyecek ek işlemler yapılabilir
        return Promise.resolve();
    };

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
                                    <Text style={[styles.welcomeText, { color: '#666' }]}>{translate('welcome_message')}</Text>
                                    <Text style={styles.welcomeText} numberOfLines={1} ellipsizeMode="tail">
                                        {userName ? formatUserName(userName) : ''}
                                    </Text>
                                    <Text style={[styles.welcomeText, { marginLeft: 4 }]}>👋</Text>
                                </View>
                                <Text style={styles.emailText}>{userEmail}</Text>
                            </View>
                        )}
                        <TouchableOpacity
                            style={styles.profileButton}
                            onPress={() => setModalVisible(true)}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
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
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={styles.statsContainer}>
                    <View style={styles.statCard}>
                        <View style={styles.statIconContainer}>
                            <Ionicons name="location" size={24} color="#FF6347" />
                        </View>
                        <Text style={styles.statNumber}>{todayStats.places}</Text>
                        <Text style={styles.statLabel}>{translate('today')}</Text>
                    </View>
                    <View style={styles.statCard}>
                        <View style={styles.statIconContainer}>
                            <Ionicons name="walk" size={24} color="#4CAF50" />
                        </View>
                        <Text style={styles.statNumber}>{todayStats.distance}km</Text>
                        <Text style={styles.statLabel}>{translate('distance')}</Text>
                    </View>
                    <View style={styles.statCard}>
                        <View style={styles.statIconContainer}>
                            <Ionicons name="trophy" size={24} color="#FFD700" />
                        </View>
                        <Text style={styles.statNumber}>{totalStats.places}</Text>
                        <Text style={styles.statLabel}>{translate('total')}</Text>
                    </View>
                </View>
            </View>

            <View style={styles.content}>
                <CityExplorerCard navigation={navigation} />

                {weather && <WeatherCard weather={weather} />}

                {renderGoalCard()}

                {quickAccessContainer}

                <AIRecommendationsCard 
                    navigation={navigation} 
                />
                
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