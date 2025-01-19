import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, Animated, ActivityIndicator, Easing } from 'react-native';
import { FontAwesome, MaterialIcons, Ionicons } from '@expo/vector-icons';
import ProfileModal from '../modals/ProfileModal';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { collection, query, onSnapshot, orderBy, doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import ProgressBar from 'react-native-progress/Bar';
import * as Location from 'expo-location';
import { LinearGradient } from 'expo-linear-gradient';

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

const motivationMessages = [
    "STeaPP ile yürüyüşlerinizi kaydedin, anılarınızı paylaşın!",
    "Her adım, sağlığınıza bir adım daha yaklaşmanızı sağlar. Hedefinize doğru yürümeye devam edin!",
    "Her gün en az 10.000 adım atmaya çalışın. Sağlığınız için küçük adımlar, büyük farklar yaratır.",
    "Yeni yerler keşfetmek, ruhunuzu besler. Bugün bir adım atın ve keşfe çıkın!",
    "Dünya, keşfedilmeyi bekleyen güzelliklerle dolu.",
    "Dışarıda harika bir gün! Steapp ile yerlerinizi işaretleyin ve hatıralarınızı oluşturun."
];

const HomePage = ({ navigation }) => {
    const [modalVisible, setModalVisible] = useState(false);
    const buttonAnimation = new Animated.Value(1);

    const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
    const fadeAnim = new Animated.Value(0);

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
        const interval = setInterval(() => {
            setCurrentMessageIndex((prevIndex) => (prevIndex + 1) % motivationMessages.length);
        }, 5000); // Her 5 saniyede bir mesaj değişir

        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        Animated.sequence([
            Animated.timing(fadeAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
            Animated.timing(fadeAnim, { toValue: 0, duration: 1000, delay: 4000, useNativeDriver: true })
        ]).start();
    }, [currentMessageIndex]);

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
            console.error("Kullanıcı bilgileri alınırken hata:", error);
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
                console.error('Konum izni verilmedi');
                return;
            }

            // Kullanıcının konumunu alın
            let location = await Location.getCurrentPositionAsync({});
            const { latitude, longitude } = location.coords;

            // Ters geokodlama işlemi ile il ve ilçe bilgilerini alın
            const reverseGeocode = await Location.reverseGeocodeAsync({ latitude, longitude });
            const { city, district } = reverseGeocode[0];

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
            console.error(error);
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

    const handlePressIn = () => {
        Animated.spring(buttonAnimation, {
            toValue: 0.95,
            useNativeDriver: true,
        }).start();
    };

    const handlePressOut = () => {
        Animated.spring(buttonAnimation, {
            toValue: 1,
            friction: 3,
            tension: 40,
            useNativeDriver: true,
        }).start();
    };

    // İlk harfleri büyük yapar
    const capitalizeFirstLetter = (str) => {
        return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
    };

    const animatedStyle = {
        transform: [{ scale: buttonAnimation }],
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
                                    <Text style={styles.welcomeText}>Merhaba, </Text>
                                    <Text style={styles.welcomeText}>
                                        {userName ? userName.charAt(0) + userName.slice(1) : ''}
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
                {weather && (
                    <TouchableOpacity style={styles.weatherCard}>
                        <LinearGradient
                            colors={['#4c669f', '#3b5998', '#192f6a']}
                            style={styles.weatherGradient}
                        >
                            <View style={styles.weatherHeader}>
                                <View>
                                    <Text style={styles.weatherLocation}>
                                        {weather.district}, {weather.city}
                                    </Text>
                                    <Text style={styles.weatherTemp}>
                                        {weather.temperature.toFixed(1)}°C
                                    </Text>
                                </View>
                                <Image
                                    source={{ uri: `http://openweathermap.org/img/w/${weather.icon}.png` }}
                                    style={styles.weatherIcon}
                                />
                            </View>
                            <View style={styles.weatherDetails}>
                                <View style={styles.weatherDetail}>
                                    <Ionicons name="water" size={20} color="#fff" />
                                    <Text style={styles.weatherDetailText}>
                                        {weather.humidity}%
                                    </Text>
                                </View>
                                <View style={styles.weatherDetail}>
                                    <Ionicons name="cloud-outline" size={20} color="#fff" />
                                    <Text style={styles.weatherDetailText}>
                                        {weather.windSpeed} m/s
                                    </Text>
                                </View>
                            </View>
                        </LinearGradient>
                    </TouchableOpacity>
                )}

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
                </View>

                <Animated.View style={[styles.motivationCard, { opacity: fadeAnim }]}>
                    <Text style={styles.motivationText}>
                        {motivationMessages[currentMessageIndex]}
                    </Text>
                </Animated.View>
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
        color: '#fff',
        textAlign: 'center',
        lineHeight: 24,
        fontWeight: '600',
    },
    weatherIcon: {
        width: 50,
        height: 50,
        marginRight: 15,
    },
    weatherDetails: {
        flex: 1,
        justifyContent: 'center',
    },
    temperature: {
        fontSize: 28,
        fontWeight: '800',
        color: '#2C3E50',
        position: 'absolute',
        top: -35,
        right: 5,
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
    weatherCard: {
        borderRadius: 25,
        overflow: 'hidden',
        marginBottom: 20,
    },
    weatherGradient: {
        padding: 20,
    },
    weatherHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    weatherLocation: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    weatherTemp: {
        color: '#fff',
        fontSize: 32,
        fontWeight: 'bold',
        marginTop: 5,
    },
    weatherDetails: {
        flexDirection: 'row',
        marginTop: 20,
    },
    weatherDetail: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 20,
    },
    weatherDetailText: {
        color: '#fff',
        marginLeft: 8,
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
        marginBottom: 20,
    },
    quickAccessCard: {
        backgroundColor: '#fff',
        padding: 15,
        borderRadius: 20,
        width: '30%',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
        marginBottom: 15,
    },
    quickAccessIcon: {
        padding: 12,
        borderRadius: 15,
        marginBottom: 8,
    },
    quickAccessTitle: {
        fontSize: 12,
        color: '#2C3E50',
        textAlign: 'center',
    },
    motivationCard: {
        backgroundColor: '#3498DB',
        padding: 20,
        borderRadius: 25,
        marginBottom: 20,
    },
    motivationText: {
        color: '#fff',
        fontSize: 16,
        textAlign: 'center',
        lineHeight: 24,
    },
});

export default HomePage;