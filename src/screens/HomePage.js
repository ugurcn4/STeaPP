import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, Animated, ActivityIndicator, Easing, Platform } from 'react-native';
import { FontAwesome, MaterialIcons, Ionicons } from '@expo/vector-icons';
import ProfileModal from '../modals/ProfileModal';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { collection, query, onSnapshot, orderBy, doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import ProgressBar from 'react-native-progress/Bar';
import * as Location from 'expo-location';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import WeatherCard from './HomePageCards/WeatherCard';

const haversine = (lat1, lon1, lat2, lon2) => {
    const toRad = (x) => x * Math.PI / 180;
    const R = 6371; // Dünya'nın yarıçapı (km)
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon1 - lon2);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Mesafe (km)
};

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
    const [locations, setLocations] = useState([]);
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
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                setUserId(user.uid);
                fetchUserData(user);
            } else {
                setIsLoading(false);
            }
        });

        return () => unsubscribe();
    }, []);

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
            } else {
                setUserName(user.displayName || user.email.split('@')[0]);
                setUserEmail(user.email);
            }
        } catch (error) {
            setUserName(user.displayName || user.email.split('@')[0]);
            setUserEmail(user.email);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchWeather = async () => {
        try {
            // Konum izni isteyin
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
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
        }
    };

    useEffect(() => {
        if (userId) {
            const q = query(
                collection(db, `users/${userId}/locations`),
                orderBy('timestamp', 'desc')
            );

            const unsubscribe = onSnapshot(q, (querySnapshot) => {
                const fetchedLocations = querySnapshot.docs.map(doc => {
                    const data = doc.data();
                    return {
                        ...data,
                        id: doc.id,
                        timestamp: data.timestamp ? data.timestamp.toDate() : new Date(),
                    };
                });

                setLocations(fetchedLocations);
                calculateStats(fetchedLocations);
            });

            return () => unsubscribe();
        }
    }, [userId]);

    const calculateStats = (locations) => {
        const today = new Date();
        const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const todayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

        let todayPlaces = 0;
        let todayDistance = 0;
        let totalPlaces = locations.length;
        let totalDistance = 0;

        for (let i = 0; i < locations.length - 1; i++) {
            const start = locations[i];
            const end = locations[i + 1];

            const startLat = parseFloat(start.enlem);
            const startLon = parseFloat(start.boylam);
            const endLat = parseFloat(end.enlem);
            const endLon = parseFloat(end.boylam);

            const distance = haversine(startLat, startLon, endLat, endLon);

            totalDistance += distance;

            const startDate = start.timestamp.toDate ? start.timestamp.toDate() : start.timestamp;
            if (startDate >= todayStart && startDate < todayEnd) {
                todayPlaces++;
                todayDistance += distance;
            }
        }

        setTodayStats({ places: todayPlaces, distance: (todayDistance).toFixed(1) });
        setTotalStats({ places: totalPlaces, distance: (totalDistance).toFixed(1) });

        const dailyGoalPercentage = Math.min((todayDistance / DAILY_GOAL_KM) * 100, 100).toFixed(1);
        setDailyGoalPercentage(dailyGoalPercentage);
    };

    const getProfileImageUri = () => {
        if (userData?.profilePicture) {
            return { uri: userData.profilePicture };
        } else {
            const initials = userName?.slice(0, 2).toUpperCase() || "PP";
            return {
                uri: `https://ui-avatars.com/api/?name=${initials}&background=4CAF50&color=fff&size=128`,
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
                onPress={() => navigation.navigate('Harita')}
            >
                <View style={[styles.quickAccessIcon, { backgroundColor: '#E3F2FD' }]}>
                    <MaterialIcons name="map" size={24} color="#2196F3" />
                </View>
                <Text style={styles.quickAccessTitle}>Haritayı Aç</Text>
            </TouchableOpacity>

            <TouchableOpacity
                style={styles.quickAccessCard}
                onPress={() => navigation.navigate('Arkadaşlar')}
            >
                <View style={[styles.quickAccessIcon, { backgroundColor: '#E8F5E9' }]}>
                    <MaterialIcons name="group" size={24} color="#4CAF50" />
                </View>
                <Text style={styles.quickAccessTitle}>Arkadaşlar</Text>
            </TouchableOpacity>

            <TouchableOpacity
                style={styles.quickAccessCard}
                onPress={() => navigation.navigate('Fotoğraflar')}
            >
                <View style={[styles.quickAccessIcon, { backgroundColor: '#FFF3E0' }]}>
                    <MaterialIcons name="photo-library" size={24} color="#FF9800" />
                </View>
                <Text style={styles.quickAccessTitle}>Fotoğraflar</Text>
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
                                <Text style={styles.aiCardTitle}>AI Asistan</Text>
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

    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={{ paddingBottom: 80 }}
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
                                        <ActivityIndicator size="small" color="#4CAF50" />
                                    ) : (
                                        <Image
                                            source={getProfileImageUri()}
                                            style={styles.avatarImage}
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
                {weather && <WeatherCard weather={weather} />}

                <View style={styles.goalCard}>
                    <Text style={styles.goalTitle}>Günlük Hedef</Text>
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
                </View>

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

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F6FA',
    },
    header: {
        backgroundColor: '#fff',
        padding: 24,
        paddingTop: 60,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 5,
    },
    profileSection: {
        marginBottom: 10,
    },
    greetingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    welcomeTextContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
        maxWidth: '80%', // Container'ın maksimum genişliğini sınırla
    },
    welcomeText: {
        fontSize: 24,
        fontWeight: '600',
        color: '#1a1a1a',
        letterSpacing: 0.5,
    },
    emailText: {
        fontSize: 13,
        color: '#666',
        marginTop: 4,
        letterSpacing: 0.2,
    },
    profileButton: {
        padding: 2,
    },
    avatarOuterContainer: {
        width: 60,
        height: 60,
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
    },
    waveContainer: {
        position: 'absolute',
        width: '150%',
        height: '150%',
        borderRadius: 35,
        overflow: 'hidden',
    },
    wave: {
        position: 'absolute',
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(76, 175, 80, 0.15)',
        borderRadius: 35,
        transform: [{ scale: 1.3 }],
    },
    wave2: {
        backgroundColor: 'rgba(76, 175, 80, 0.1)',
        transform: [{ scale: 1.2 }, { rotate: '45deg' }],
    },
    avatarContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        overflow: 'hidden',
        borderWidth: 2,
        borderColor: '#fff',
        zIndex: 1,
    },
    avatarImage: {
        width: '100%',
        height: '100%',
        borderRadius: 24,
    },
    backgroundImage: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        opacity: 0.1,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
    },
    content: {
        padding: 20,
        paddingBottom: 80,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 25,
        padding: 20,
        marginVertical: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 5,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.05)',
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: '800',
        marginBottom: 15,
        color: '#2C3E50',
        letterSpacing: 0.5,
    },
    cardRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f8f9fa',
        padding: 12,
        borderRadius: 15,
    },
    cardContent: {
        fontSize: 15,
        color: '#34495E',
        marginLeft: 10,
        flex: 1,
    },
    button: {
        backgroundColor: '#3498DB', // Modern mavi ton
        padding: 18,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        shadowColor: '#3498DB',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 8,
        width: '100%',
    },
    buttonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    goalContainer: {
        backgroundColor: '#fff',
        padding: 20,
        borderRadius: 25,
        alignItems: 'center',
        marginHorizontal: 20,
        marginVertical: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 5,
    },
    goalTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: '#2C3E50',
        marginBottom: 15,
        letterSpacing: 0.5,
    },
    goalProgress: {
        fontSize: 16,
        color: '#34495E',
        marginTop: 10,
        fontWeight: '600',
    },
    motivationContainer: {
        margin: 20,
        padding: 20,
        backgroundColor: '#3498DB',
        borderRadius: 25,
        alignItems: 'center',
        shadowColor: '#3498DB',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 5,
    },
    motivationText: {
        fontSize: 16,
        color: '#2C3E50',
        textAlign: 'center',
        lineHeight: 22,
        fontWeight: '500',
        opacity: 1
    },
    weatherCard: {
        borderRadius: 25,
        overflow: 'hidden',
        marginBottom: 20,
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    weatherGradient: {
        padding: 20,
    },
    weatherContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    weatherMainInfo: {
        flex: 1,
    },
    weatherLocationContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    locationIcon: {
        marginRight: 5,
    },
    weatherLocation: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    weatherTemp: {
        color: '#fff',
        fontSize: 48,
        fontWeight: 'bold',
        marginVertical: 5,
    },
    weatherDescription: {
        color: '#fff',
        fontSize: 16,
        textTransform: 'capitalize',
        opacity: 0.9,
    },
    weatherIconContainer: {
        padding: 10,
    },
    weatherMainIcon: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
    },
    weatherDetailsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 20,
        paddingTop: 20,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.2)',
    },
    weatherDetailItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    weatherDetailText: {
        color: '#fff',
        marginLeft: 8,
        fontSize: 14,
        opacity: 0.9,
    },
    statsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 20,
    },
    statCard: {
        backgroundColor: '#fff',
        padding: 15,
        borderRadius: 20,
        alignItems: 'center',
        width: '30%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    statIconContainer: {
        padding: 10,
        borderRadius: 15,
        backgroundColor: '#F5F6FA',
        marginBottom: 8,
    },
    statNumber: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#2C3E50',
    },
    statLabel: {
        fontSize: 12,
        color: '#95A5A6',
        marginTop: 4,
    },
    goalCard: {
        backgroundColor: '#fff',
        padding: 20,
        borderRadius: 25,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    quickAccessContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        marginBottom: 20,
    },
    quickAccessCard: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 12,
        marginBottom: 16,
        width: '31%',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    quickAccessIcon: {
        width: 40,
        height: 40,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    quickAccessTitle: {
        fontSize: 12,
        fontWeight: '600',
        color: '#2C3E50',
        textAlign: 'center',
    },
    motivationCard: {
        backgroundColor: '#fff',
        borderRadius: 15,
        padding: 20,
        marginVertical: 10,
        marginHorizontal: 20,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 3.84,
        elevation: 5,
        minHeight: 80,
        justifyContent: 'center',
        alignItems: 'center'
    },
    aiRecommendCard: {
        marginVertical: 16,
        borderRadius: 20,
        overflow: 'hidden',
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        height: 100,
    },
    aiCardGradient: {
        flex: 1,
        padding: 16,
    },
    aiCardContent: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    aiCardLeft: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
    },
    aiCardTextContainer: {
        flex: 1,
        marginLeft: 12,
        justifyContent: 'center',
    },
    aiCardTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#FFF',
        marginBottom: 4,
    },
    messageContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        height: 40,
    },
    aiCardSubtitle: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.9)',
        fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
        flex: 1,
    },
    aiIconContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        minWidth: 50,
    },
    pulseCircle: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#4CAF50',
        marginLeft: 8,
        shadowColor: '#4CAF50',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 4,
        elevation: 5,
    },
    cursor: {
        color: '#FFF',
        fontSize: 14,
        marginLeft: 2,
        marginTop: -2,
    },
    aiCardIcon: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 12,
    },
});

export default HomePage;