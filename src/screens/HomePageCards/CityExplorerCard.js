import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, Animated, Easing } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import { getAuth, onAuthStateChanged } from 'firebase/auth';

// Bölge isimlerini düzgün formata çeviren fonksiyon
const formatRegionName = (region) => {
    if (!region) return 'Keşfedilmeyi Bekliyor';

    const regionMap = {
        'ic_anadolu': 'İç Anadolu',
        'dogu_anadolu': 'Doğu Anadolu',
        'guneydogu_anadolu': 'Güneydoğu Anadolu',
        'akdeniz': 'Akdeniz',
        'ege': 'Ege',
        'marmara': 'Marmara',
        'karadeniz': 'Karadeniz'
    };

    return regionMap[region] || region;
};

const CityExplorerCard = ({ navigation }) => {
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);
    const [cities, setCities] = useState([]);
    const scrollX = useRef(new Animated.Value(0)).current;
    const animationRef = useRef(null);
    const lastLoadedIndex = useRef(0);
    const allCitiesRef = useRef([]);
    const loadingMoreRef = useRef(false);

    // İlleri sırayla yükle
    const loadMoreCities = useCallback(async () => {
        if (loadingMoreRef.current) return;
        loadingMoreRef.current = true;

        try {
            const startIndex = lastLoadedIndex.current;
            const endIndex = Math.min(startIndex + 5, allCitiesRef.current.length);

            if (startIndex >= allCitiesRef.current.length) {
                loadingMoreRef.current = false;
                return;
            }

            const newCities = allCitiesRef.current.slice(startIndex, endIndex);
            lastLoadedIndex.current = endIndex;

            setCities(prevCities => [...prevCities, ...newCities]);
        } finally {
            loadingMoreRef.current = false;
        }
    }, []);

    // Periyodik olarak yeni şehirleri yükle
    useEffect(() => {
        let interval;
        if (allCitiesRef.current.length > 0) {
            interval = setInterval(() => {
                loadMoreCities();
            }, 2000); // Her 2 saniyede bir 5 şehir ekle
        }

        return () => {
            if (interval) clearInterval(interval);
        };
    }, [loadMoreCities]);

    // Kullanıcı oturumunu dinle
    useEffect(() => {
        const auth = getAuth();
        const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            setLoading(false);
        });

        return () => {
            unsubscribeAuth();
            if (animationRef.current) {
                animationRef.current.stop();
            }
        };
    }, []);

    // Şehirleri Firebase'den çek
    useEffect(() => {
        const fetchCities = async () => {
            try {
                const db = getFirestore();
                const citiesRef = collection(db, 'cities');
                const snapshot = await getDocs(citiesRef);

                // Tüm şehirleri referansta sakla
                allCitiesRef.current = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                    image: doc.data().imageUrl
                }));

                // İlk 10 şehri hemen yükle
                const initialCities = allCitiesRef.current.slice(0, 10);
                lastLoadedIndex.current = 10;
                setCities(initialCities);

                // Otomatik kaydırma başlat
                startContinuousScroll(initialCities.length);
                setLoading(false);
            } catch (error) {
                console.error('Şehirler yüklenirken hata:', error);
                setLoading(false);
            }
        };

        fetchCities();

        return () => {
            if (animationRef.current) {
                animationRef.current.stop();
            }
        };
    }, []);

    // Sürekli kaydırma animasyonu
    const startContinuousScroll = useCallback((totalCities) => {
        const cardWidth = 140;
        const totalWidth = cardWidth * totalCities;

        // Mevcut animasyonu temizle
        if (animationRef.current) {
            animationRef.current.stop();
        }

        // Yeni animasyonu başlat
        const animation = Animated.loop(
            Animated.timing(scrollX, {
                toValue: totalWidth,
                duration: 30000,
                easing: Easing.linear,
                useNativeDriver: true,
            })
        );

        animationRef.current = animation;
        animation.start();
    }, []);

    // Cities verisi değiştiğinde animasyonu güncelle
    useEffect(() => {
        if (cities.length > 0) {
            startContinuousScroll(cities.length);
        }
    }, [cities, startContinuousScroll]);


    const handleCardPress = () => {
        if (!user) {
            navigation.navigate('Auth');
            return;
        }
        navigation.navigate('CityExplorer');
    };

    // Loading durumunda farklı bir görünüm
    if (loading) {
        return (
            <View style={styles.container}>
                <LinearGradient
                    colors={['#3494E6', '#EC6EAD']}
                    style={[styles.card, styles.loadingCard]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                >
                    <View style={styles.loadingContent}>
                        <MaterialIcons name="location-city" size={24} color="#FFF" />
                        <Text style={styles.loadingText}>Yükleniyor...</Text>
                    </View>
                </LinearGradient>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={['#3494E6', '#EC6EAD']}
                style={[styles.card, styles.emptyStateCard]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            >
                <View style={styles.emptyStateContent}>
                    <MaterialIcons name="explore" size={40} color="#FFF" style={styles.emptyStateIcon} />
                    <Text style={styles.emptyStateTitle}>
                        Maceraya Hazır Mısın?
                    </Text>
                    <Text style={styles.emptyStateDescription}>
                        İlk şehrini keşfetmeye başla ve rozetleri topla!
                    </Text>

                    {/* Şehirler Kaydırması */}
                    <View style={styles.suggestedCities}>
                        <Animated.View
                            style={[
                                styles.suggestedCitiesInner,
                                {
                                    transform: [{
                                        translateX: scrollX.interpolate({
                                            inputRange: [0, 140 * cities.length],
                                            outputRange: [0, -140 * cities.length],
                                        })
                                    }]
                                }
                            ]}
                        >
                            {/* Şehirleri 3 kez tekrarla */}
                            {[...Array(3)].map((_, setIndex) => (
                                <View key={`set-${setIndex}`} style={styles.citySet}>
                                    {cities.map((city, index) => (
                                        <View
                                            key={`${city.id}-${setIndex}-${index}`}
                                            style={styles.suggestedCityCard}
                                        >
                                            <Image
                                                source={{ uri: city.image }}
                                                style={styles.cityImage}
                                            />
                                            <Text style={styles.cityTitle}>{city.name}</Text>
                                            <Text style={styles.cityDescription}>
                                                {formatRegionName(city.region)}
                                            </Text>
                                        </View>
                                    ))}
                                </View>
                            ))}
                        </Animated.View>
                    </View>

                    {/* Gamification Elementleri */}
                    <View style={styles.rewardsPreview}>
                        <Text style={styles.rewardsTitle}>Seni Neler Bekliyor?</Text>
                        <View style={styles.rewardsList}>
                            <View style={styles.rewardItem}>
                                <MaterialIcons name="emoji-events" size={24} color="#FFD700" />
                                <Text style={styles.rewardText}>Özel Rozetler</Text>
                            </View>
                            <View style={styles.rewardItem}>
                                <MaterialIcons name="local-activity" size={24} color="#FFD700" />
                                <Text style={styles.rewardText}>Şehir Puanları</Text>
                            </View>
                            <View style={styles.rewardItem}>
                                <MaterialIcons name="leaderboard" size={24} color="#FFD700" />
                                <Text style={styles.rewardText}>Sıralama</Text>
                            </View>
                        </View>
                    </View>

                    <TouchableOpacity
                        style={styles.startButton}
                        onPress={handleCardPress}
                    >
                        <Text style={styles.startButtonText}>
                            {user ? 'Keşfetmeye Başla' : 'Giriş Yap'}
                        </Text>
                        <MaterialIcons name="arrow-forward" size={20} color="#FFF" />
                    </TouchableOpacity>
                </View>
            </LinearGradient>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: 20,
        borderRadius: 25,
        overflow: 'hidden',
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    card: {
        padding: 16,
        borderRadius: 20,
    },
    loadingCard: {
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: 150,
    },
    loadingContent: {
        alignItems: 'center',
    },
    loadingText: {
        color: '#FFF',
        marginTop: 10,
        fontSize: 16,
        fontWeight: '500',
    },
    emptyStateCard: {
        padding: 16,
        paddingBottom: 24,
    },
    emptyStateContent: {
        alignItems: 'center',
        width: '100%',
        gap: 12,
    },
    emptyStateIcon: {
        marginBottom: 12,
    },
    emptyStateTitle: {
        color: '#FFF',
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 8,
        textAlign: 'center',
    },
    emptyStateDescription: {
        color: 'rgba(255,255,255,0.9)',
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 20,
    },
    suggestedCities: {
        width: '100%',
        height: 160,
        marginVertical: 16,
        overflow: 'hidden',
    },
    suggestedCitiesInner: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    citySet: {
        flexDirection: 'row',
    },
    suggestedCityCard: {
        width: 140,
        height: 160,
        marginLeft: 12,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 12,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 3,
    },
    cityImage: {
        width: '100%',
        height: 90,
        resizeMode: 'cover',
    },
    cityTitle: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: 'bold',
        padding: 8,
        paddingBottom: 4,
    },
    cityDescription: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 12,
        padding: 8,
        paddingTop: 0,
    },
    rewardsPreview: {
        width: '100%',
        marginVertical: 16,
    },
    rewardsTitle: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 12,
        textAlign: 'center',
    },
    rewardsList: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        width: '100%',
    },
    rewardItem: {
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.1)',
        padding: 12,
        borderRadius: 12,
        width: '30%',
    },
    rewardText: {
        color: '#FFF',
        fontSize: 12,
        marginTop: 8,
        textAlign: 'center',
    },
    startButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 25,
        marginTop: 8,
    },
    startButtonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '600',
        marginRight: 8,
    },
});

export default CityExplorerCard; 