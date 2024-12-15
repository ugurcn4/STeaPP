import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, Animated } from 'react-native';
import { FontAwesome, MaterialIcons, Ionicons } from '@expo/vector-icons';
import ProfileModal from '../modals/ProfileModal';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import ProgressBar from 'react-native-progress/Bar';
import * as Location from 'expo-location';


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
            }
        });

        return () => unsubscribe();
    }, []);

    useEffect(() => {
        fetchWeather();
    }, []);



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
                    rainProbability: data.rain ? data.rain['1h'] || 0 : 0, // Yağmur olasılığını kontrol edin
                    backgroundColor: 'white',
                });
            } else {
                console.error("API response does not contain expected data");
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

        setTodayStats({ places: todayPlaces, distance: (todayDistance).toFixed(2) });
        setTotalStats({ places: totalPlaces, distance: (totalDistance).toFixed(2) });

        const dailyGoalPercentage = Math.min((todayDistance / DAILY_GOAL_KM) * 100, 100).toFixed(2);
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

    return (
        <ScrollView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerText}>Gezi Geçmişin</Text>
                <Image source={require('../../assets/images/map_background.jpg')} style={styles.backgroundImage} />
            </View>
            <View style={styles.content}>
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Bugün Gezilen Yerler</Text>
                    <View style={styles.cardRow}>
                        <Ionicons name="location-outline" size={24} color="#FF6347" />
                        <Text style={styles.cardContent}>{todayStats.places} yer işaretlendi, {todayStats.distance} km yol kat edildi!</Text>
                    </View>
                </View>

                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Toplam İstatistikler</Text>
                    <View style={styles.cardRow}>
                        <FontAwesome name="map-marker" size={24} color="#32CD32" />
                        <Text style={styles.cardContent}>{totalStats.places} yer işaretlendi, {totalStats.distance} km yol kat edildi!</Text>
                    </View>
                </View>

                {weather && (
                    <View style={[styles.card, { backgroundColor: weather.backgroundColor }]}>
                        <Text style={styles.cardTitle}>Hava Durumu</Text>
                        <View style={styles.cardRow}>
                            <Image
                                source={{ uri: `http://openweathermap.org/img/w/${weather.icon}.png` }}
                                style={styles.weatherIcon}
                            />
                            <View style={styles.weatherDetails}>
                                <Text style={styles.cardContent}>{capitalizeFirstLetter(weather.description)}</Text>
                                <Text style={styles.cardContent}>Rüzgar Hızı: {weather.windSpeed} m/s</Text>
                                <Text style={styles.cardContent}>Nem: {weather.humidity}%</Text>
                                <Text style={styles.cardContent}>Yağmur Olasılığı: {weather.rainProbability} mm</Text>
                            </View>
                            <Text style={styles.temperature}>{weather.temperature}°C</Text>
                        </View>
                    </View>
                )}


                <Animated.View style={[styles.buttonContainer, animatedStyle]}>
                    <TouchableOpacity
                        onPressIn={handlePressIn}
                        onPressOut={handlePressOut}
                        onPress={() => navigation.navigate('Harita')}
                        style={styles.button}
                    >
                        <Text style={styles.buttonText}>Haritayı Aç</Text>
                        <MaterialIcons name="map" size={24} color="#fff" style={{ marginLeft: 10 }} />
                    </TouchableOpacity>
                </Animated.View>
            </View>

            <TouchableOpacity style={styles.profileButton} onPress={() => setModalVisible(true)}>
                <FontAwesome name="user" size={24} color="#fff" />
            </TouchableOpacity>

            <ProfileModal modalVisible={modalVisible} setModalVisible={setModalVisible} navigation={navigation} />

            <View style={styles.goalContainer}>
                <Text style={styles.goalTitle}>Günlük Hedef</Text>
                <ProgressBar
                    progress={dailyGoalPercentage / 100}
                    width={200}
                    color="#FF4500"
                    unfilledColor="#D3D3D3"
                    borderWidth={0}
                    height={10}
                    borderRadius={5}
                />
                <Text style={styles.goalProgress}>%{dailyGoalPercentage} Tamamlandı</Text>
            </View>
            <Animated.View style={{ ...styles.motivationContainer, opacity: fadeAnim }}>
                <Text style={styles.motivationText}>
                    {motivationMessages[currentMessageIndex]}
                </Text>
            </Animated.View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FDD329',
    },
    header: {
        backgroundColor: '#FF4500',
        padding: 20,
        borderBottomLeftRadius: 20,
        borderBottomRightRadius: 20,
        alignItems: 'center',
        position: 'relative',
    },
    headerText: {
        marginTop: 40,
        color: '#fff',
        fontSize: 28,
        fontWeight: 'bold',
        zIndex: 10,
    },
    backgroundImage: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        opacity: 0.2,
        resizeMode: 'cover',
    },
    content: {
        padding: 20,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 20,
        marginVertical: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 5,
    },
    cardTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 10,
        color: '#333',
    },
    cardRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    cardContent: {
        fontSize: 16,
        color: 'black',
        marginLeft: 10,
    },
    buttonContainer: {
        marginTop: 20,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    button: {
        backgroundColor: '#FF4500',
        padding: 15,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 6,
    },
    buttonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '600',
    },
    profileButton: {
        position: 'absolute',
        top: 40,
        right: 20,
        backgroundColor: '#FDD329',
        padding: 18,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    bottomSection: {
        backgroundColor: '#E5E5E5',
        padding: 20,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        alignItems: 'center',
        marginTop: 20,
    },
    bottomText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
    },
    motivationText: {
        marginTop: 5,
        fontSize: 16,
        color: '#555',
    },
    goalContainer: {
        marginBottom: 20,
        alignItems: 'center',
    },
    goalTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 10,
    },
    goalProgress: {
        fontSize: 18,
        color: '#666',
        marginTop: 10,
    },
    motivationContainer: {
        marginTop: 20,
        padding: 20,
        backgroundColor: '#FF4500',
        borderRadius: 10,
        alignItems: 'center',
        width: '90%',
        alignSelf: 'center',
    },
    motivationText: {
        fontSize: 18,
        color: '#fff',
        textAlign: 'center',
    },
    weatherIcon: {
        width: 60,
        height: 60,
        marginRight: 15,
    },
    weatherDetails: {
        flex: 1,
        justifyContent: 'center',
    },
    temperature: {
        fontSize: 25,
        fontWeight: 'bold',
        color: 'black',
        position: 'absolute',
        top: -40,
        right: 2,
    },
});

export default HomePage;