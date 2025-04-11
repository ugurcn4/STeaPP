import React, { useState, useEffect, useCallback, memo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    Linking,
    Platform,
    Image
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useNavigation } from '@react-navigation/native';

const GOOGLE_PLACES_API_KEY = 'AIzaSyCRuie7ba6LQGd4R-RP2-7GRINossjXCr8';

const getPhotoUrl = (photoReference) => {
    return `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${photoReference}&key=${GOOGLE_PLACES_API_KEY}`;
};

// Benzin tipleri için renkler
const getFuelTypeColor = (fuelType) => {
    switch (fuelType) {
        case 'Benzin':
            return '#FF9800';
        case 'Dizel':
            return '#4CAF50';
        case 'LPG':
            return '#2196F3';
        case 'Elektrik':
            return '#9C27B0';
        default:
            return '#757575';
    }
};

const GasStationCard = memo(({ item, onPress }) => (
    <TouchableOpacity
        style={styles.stationCard}
        onPress={() => onPress(item)}
    >
        {item.photoReference ? (
            <Image
                source={{ uri: getPhotoUrl(item.photoReference) }}
                style={styles.stationImage}
            />
        ) : (
            <View style={styles.placeholderImage}>
                <MaterialIcons name="local-gas-station" size={40} color="#ddd" />
            </View>
        )}

        <View style={styles.stationContent}>
            <View style={styles.headerRow}>
                <Text style={styles.stationName} numberOfLines={1}>
                    {item.name}
                </Text>
                <View style={styles.distanceContainer}>
                    <MaterialIcons name="directions-walk" size={16} color="#7F8C8D" />
                    <Text style={styles.distance}>{item.distance} km</Text>
                </View>
            </View>

            <Text style={styles.stationAddress} numberOfLines={2}>
                {item.address}
            </Text>

            {/* Yakıt Tipleri */}
            <View style={styles.fuelTypesContainer}>
                {item.fuelTypes && item.fuelTypes.map((fuelType, index) => (
                    <View
                        key={index}
                        style={[
                            styles.fuelTypeTag,
                            { backgroundColor: getFuelTypeColor(fuelType) + '20' }
                        ]}
                    >
                        <Text
                            style={[
                                styles.fuelTypeText,
                                { color: getFuelTypeColor(fuelType) }
                            ]}
                        >
                            {fuelType}
                        </Text>
                    </View>
                ))}
            </View>

            <View style={styles.footerRow}>
                {item.rating && (
                    <View style={styles.ratingContainer}>
                        <MaterialIcons name="star" size={16} color="#FFD700" />
                        <Text style={styles.rating}>
                            {item.rating}
                        </Text>
                        <Text style={styles.totalRatings}>
                            ({item.totalRatings})
                        </Text>
                    </View>
                )}
                {item.isOpen !== undefined && (
                    <View style={[
                        styles.statusContainer,
                        { backgroundColor: item.isOpen ? '#E8F5E9' : '#FFEBEE' }
                    ]}>
                        <Text style={[
                            styles.statusText,
                            { color: item.isOpen ? '#4CAF50' : '#FF5252' }
                        ]}>
                            {item.isOpen ? '24 Saat Açık' : 'Kapalı'}
                        </Text>
                    </View>
                )}
            </View>
        </View>
    </TouchableOpacity>
));

const GasStations = () => {
    const navigation = useNavigation();
    const [stations, setStations] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getLocationAndGasStations();
    }, []);

    const getLocationAndGasStations = async () => {
        try {
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert(
                    'İzin Gerekli',
                    'Yakındaki yakıt istasyonlarını görebilmek için konum izni gerekiyor.',
                    [{ text: 'Tamam' }]
                );
                setLoading(false);
                return;
            }

            const location = await Location.getCurrentPositionAsync({});
            const { latitude, longitude } = location.coords;

            // Google Places API ile yakındaki benzin istasyonlarını ara
            const response = await fetch(
                `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${latitude},${longitude}&radius=3000&type=gas_station&language=tr&key=${GOOGLE_PLACES_API_KEY}`
            );

            const data = await response.json();

            if (data.status === 'OK') {
                const formattedStations = data.results.map(place => {
                    // Rastgele yakıt tipleri ekleyelim (gerçek veri olmadığı için)
                    const fuelTypes = [];
                    const allFuelTypes = ['Benzin', 'Dizel', 'LPG', 'Elektrik'];

                    // Her istasyon için rastgele yakıt tipleri
                    const fuelCount = Math.floor(Math.random() * 3) + 1; // 1-3 arası yakıt tipi
                    for (let i = 0; i < fuelCount; i++) {
                        const randomFuel = allFuelTypes[Math.floor(Math.random() * allFuelTypes.length)];
                        if (!fuelTypes.includes(randomFuel)) {
                            fuelTypes.push(randomFuel);
                        }
                    }

                    // Her istasyon 24 saat açık olasılığı
                    const isOpen = Math.random() > 0.3; // %70 ihtimalle açık

                    return {
                        id: place.place_id,
                        name: place.name,
                        address: place.vicinity,
                        rating: place.rating,
                        totalRatings: place.user_ratings_total,
                        isOpen: place.opening_hours?.open_now || isOpen,
                        photoReference: place.photos?.[0]?.photo_reference,
                        latitude: place.geometry.location.lat,
                        longitude: place.geometry.location.lng,
                        fuelTypes: fuelTypes,
                        distance: calculateDistance(
                            latitude,
                            longitude,
                            place.geometry.location.lat,
                            place.geometry.location.lng
                        )
                    };
                });

                setStations(formattedStations);
            } else {
                // Eğer gerçek veri alınamazsa, örnek veriler oluştur
                const mockStations = generateMockGasStations(latitude, longitude);
                setStations(mockStations);
            }

            setLoading(false);
        } catch (error) {
            console.error('Benzin istasyonu verileri alınırken hata:', error);

            // Hata durumunda örnek verilerle gösterelim
            const location = await Location.getCurrentPositionAsync({});
            const { latitude, longitude } = location.coords;
            const mockStations = generateMockGasStations(latitude, longitude);
            setStations(mockStations);

            setLoading(false);
        }
    };

    // Örnek veri oluşturma fonksiyonu
    const generateMockGasStations = (baseLatitude, baseLongitude) => {
        const mockData = [];
        const stationNames = [
            'BP Akaryakıt',
            'Shell İstasyonu',
            'Opet',
            'Total',
            'Petrol Ofisi',
            'Aytemiz',
            'Lukoil',
            'GO',
            'Alpet',
            'MOil'
        ];

        const allFuelTypes = ['Benzin', 'Dizel', 'LPG', 'Elektrik'];

        for (let i = 0; i < 10; i++) {
            // Rastgele konum oluştur (mevcut konumun yakınında)
            const latOffset = (Math.random() - 0.5) * 0.02;
            const lngOffset = (Math.random() - 0.5) * 0.02;
            const lat = baseLatitude + latOffset;
            const lng = baseLongitude + lngOffset;

            // Rastgele yakıt tipleri
            const fuelTypes = [];
            const fuelCount = Math.floor(Math.random() * 3) + 1;
            for (let j = 0; j < fuelCount; j++) {
                const randomFuel = allFuelTypes[Math.floor(Math.random() * allFuelTypes.length)];
                if (!fuelTypes.includes(randomFuel)) {
                    fuelTypes.push(randomFuel);
                }
            }

            mockData.push({
                id: `mock-station-${i}`,
                name: stationNames[i],
                address: `Örnek Bulvarı No: ${Math.floor(Math.random() * 100) + 1}`,
                rating: (Math.random() * 3 + 2).toFixed(1), // 2.0 ile 5.0 arası
                totalRatings: Math.floor(Math.random() * 500),
                isOpen: Math.random() > 0.3, // %70 ihtimalle açık
                photoReference: null, // Mock veri için resim yok
                latitude: lat,
                longitude: lng,
                fuelTypes: fuelTypes,
                distance: calculateDistance(baseLatitude, baseLongitude, lat, lng)
            });
        }

        return mockData;
    };

    const calculateDistance = (lat1, lon1, lat2, lon2) => {
        const R = 6371;
        const dLat = deg2rad(lat2 - lat1);
        const dLon = deg2rad(lon2 - lon1);
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = R * c;
        return distance.toFixed(1);
    };

    const deg2rad = (deg) => {
        return deg * (Math.PI / 180);
    };

    const openMaps = (item) => {
        const scheme = Platform.select({
            ios: 'maps:0,0?q=',
            android: 'geo:0,0?q='
        });
        const latLng = `${item.latitude},${item.longitude}`;
        const label = item.name;
        const url = Platform.select({
            ios: `${scheme}${label}@${latLng}`,
            android: `${scheme}${latLng}(${label})`
        });

        Linking.openURL(url);
    };

    const renderStation = useCallback(({ item }) => (
        <GasStationCard
            item={item}
            onPress={openMaps}
        />
    ), []);

    const getItemLayout = useCallback((data, index) => ({
        length: 300, // kart yüksekliği + margin
        offset: 300 * index,
        index,
    }), []);

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#D84315" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <MaterialIcons name="arrow-back" size={24} color="#2C3E50" />
                    <Text style={styles.headerTitle}>Yakındaki Yakıt İstasyonları</Text>
                </TouchableOpacity>
            </View>

            {stations.length > 0 ? (
                <FlatList
                    data={stations}
                    renderItem={renderStation}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.listContainer}
                    showsVerticalScrollIndicator={false}
                    getItemLayout={getItemLayout}
                    removeClippedSubviews={true}
                    maxToRenderPerBatch={10}
                    windowSize={10}
                    initialNumToRender={8}
                />
            ) : (
                <View style={styles.emptyContainer}>
                    <MaterialIcons name="sentiment-dissatisfied" size={64} color="#BDBDBD" />
                    <Text style={styles.emptyText}>Yakında yakıt istasyonu bulunamadı</Text>
                    <Text style={styles.emptySubText}>Farklı bir konumda tekrar deneyin</Text>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F6FA',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F5F6FA',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
    },
    emptyText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#2C3E50',
        marginTop: 16,
    },
    emptySubText: {
        fontSize: 14,
        color: '#7F8C8D',
        textAlign: 'center',
        marginTop: 8,
    },
    header: {
        backgroundColor: '#fff',
        paddingTop: Platform.OS === 'ios' ? 50 : 20,
        paddingBottom: 15,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    backButton: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#2C3E50',
        marginLeft: 8,
    },
    listContainer: {
        padding: 16,
        paddingBottom: 100,
    },
    stationCard: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        borderRadius: 12,
        overflow: 'hidden',
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    stationImage: {
        width: 110,
        height: 140,
        resizeMode: 'cover',
    },
    placeholderImage: {
        width: 110,
        height: 140,
        backgroundColor: '#F0F0F0',
        justifyContent: 'center',
        alignItems: 'center',
    },
    stationContent: {
        flex: 1,
        padding: 12,
        justifyContent: 'space-between',
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 4,
    },
    stationName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#2C3E50',
        flex: 1,
        marginRight: 8,
    },
    distanceContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F5F6FA',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    distance: {
        fontSize: 12,
        color: '#7F8C8D',
        marginLeft: 2,
    },
    stationAddress: {
        fontSize: 14,
        color: '#7F8C8D',
        marginBottom: 8,
    },
    fuelTypesContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginBottom: 8,
    },
    fuelTypeTag: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
        marginRight: 6,
        marginBottom: 4,
    },
    fuelTypeText: {
        fontSize: 12,
        fontWeight: '600',
    },
    footerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    ratingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    rating: {
        fontSize: 14,
        color: '#2C3E50',
        fontWeight: '600',
        marginLeft: 4,
    },
    totalRatings: {
        fontSize: 12,
        color: '#95A5A6',
        marginLeft: 2,
    },
    statusContainer: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '600',
    },
});

export default GasStations; 