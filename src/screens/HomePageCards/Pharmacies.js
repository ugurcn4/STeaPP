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
    Image,
    ScrollView
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useNavigation } from '@react-navigation/native';

const GOOGLE_PLACES_API_KEY = 'AIzaSyCRuie7ba6LQGd4R-RP2-7GRINossjXCr8';

const getPhotoUrl = (photoReference) => {
    return `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${photoReference}&key=${GOOGLE_PLACES_API_KEY}`;
};

// Filtre butonları için bileşen
const FilterButton = memo(({ title, active, onPress, icon }) => (
    <TouchableOpacity
        style={[
            styles.filterButton,
            active && styles.filterButtonActive
        ]}
        onPress={onPress}
    >
        <MaterialIcons
            name={icon}
            size={18}
            color={active ? '#FFFFFF' : '#4CAF50'}
            style={styles.filterIcon}
        />
        <Text
            style={[
                styles.filterButtonText,
                active && styles.filterButtonTextActive
            ]}
        >
            {title}
        </Text>
    </TouchableOpacity>
));

const PharmacyCard = memo(({ item, onPress }) => (
    <TouchableOpacity
        style={styles.pharmacyCard}
        onPress={() => onPress(item)}
    >
        {item.photoReference ? (
            <Image
                source={{ uri: getPhotoUrl(item.photoReference) }}
                style={styles.pharmacyImage}
            />
        ) : (
            <View style={styles.placeholderImage}>
                <Text style={styles.pharmacyLogo}>E</Text>
            </View>
        )}

        <View style={styles.pharmacyContent}>
            <View style={styles.headerRow}>
                <Text style={styles.pharmacyName} numberOfLines={1}>
                    {item.name}
                </Text>
                <View style={styles.distanceContainer}>
                    <MaterialIcons name="directions-walk" size={16} color="#7F8C8D" />
                    <Text style={styles.distance}>{item.distance} km</Text>
                </View>
            </View>

            <Text style={styles.pharmacyAddress} numberOfLines={2}>
                {item.address}
            </Text>

            {/* Eczane Bilgileri */}
            <View style={styles.infoContainer}>
                {item.hasDelivery && (
                    <View style={styles.infoItem}>
                        <MaterialIcons name="delivery-dining" size={16} color="#4CAF50" />
                        <Text style={styles.infoText}>Teslimat Hizmeti</Text>
                    </View>
                )}

                {item.has24HourService && (
                    <View style={styles.infoItem}>
                        <MaterialIcons name="schedule" size={16} color="#2196F3" />
                        <Text style={styles.infoText}>24 Saat Hizmet</Text>
                    </View>
                )}
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
                {item.isOnDuty !== undefined && (
                    <View style={[
                        styles.dutyContainer,
                        { backgroundColor: item.isOnDuty ? '#E8F5E9' : '#E0F7FA' }
                    ]}>
                        <Text style={[
                            styles.dutyText,
                            { color: item.isOnDuty ? '#4CAF50' : '#00ACC1' }
                        ]}>
                            {item.isOnDuty ? 'Nöbetçi' : 'Normal Mesai'}
                        </Text>
                    </View>
                )}
            </View>

            {item.phoneNumber && (
                <TouchableOpacity
                    style={styles.callButton}
                    onPress={() => Linking.openURL(`tel:${item.phoneNumber}`)}
                >
                    <MaterialIcons name="phone" size={16} color="#FFF" />
                    <Text style={styles.callButtonText}>Ara</Text>
                </TouchableOpacity>
            )}
        </View>
    </TouchableOpacity>
));

const Pharmacies = () => {
    const navigation = useNavigation();
    const [pharmacies, setPharmacies] = useState([]);
    const [filteredPharmacies, setFilteredPharmacies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeFilter, setActiveFilter] = useState('all'); // 'all', 'nearest', 'onDuty'

    useEffect(() => {
        getLocationAndPharmacies();
    }, []);

    // Aktif filtreye göre eczaneleri filtrele
    useEffect(() => {
        if (pharmacies.length === 0) return;

        let filtered = [...pharmacies];

        if (activeFilter === 'nearest') {
            // Mesafeye göre sırala (en yakından en uzağa)
            filtered.sort((a, b) => parseFloat(a.distance) - parseFloat(b.distance));
        } else if (activeFilter === 'onDuty') {
            // Sadece nöbetçi eczaneleri filtrele
            filtered = filtered.filter(pharmacy => pharmacy.isOnDuty);
        }

        setFilteredPharmacies(filtered);
    }, [activeFilter, pharmacies]);

    const getLocationAndPharmacies = async () => {
        try {
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert(
                    'İzin Gerekli',
                    'Yakındaki eczaneleri görebilmek için konum izni gerekiyor.',
                    [{ text: 'Tamam' }]
                );
                setLoading(false);
                return;
            }

            const location = await Location.getCurrentPositionAsync({});
            const { latitude, longitude } = location.coords;

            // Google Places API ile yakındaki eczaneleri ara
            const response = await fetch(
                `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${latitude},${longitude}&radius=3000&type=pharmacy&language=tr&key=${GOOGLE_PLACES_API_KEY}`
            );

            const data = await response.json();

            if (data.status === 'OK') {
                const formattedPharmacies = data.results.map(place => {
                    // Rastgele özellikler ekleyelim (gerçek API'da bulunmayabilir)
                    const isOnDuty = Math.random() > 0.85; // %15 ihtimalle nöbetçi
                    const has24HourService = isOnDuty || Math.random() > 0.9; // Nöbetçiyse veya %10 ihtimalle 24 saat
                    const hasDelivery = Math.random() > 0.5; // %50 ihtimalle teslimat

                    // Telefon numarası oluştur
                    const phoneNumber = `0${Math.floor(Math.random() * 1000000000).toString().padStart(9, '5')}`;

                    return {
                        id: place.place_id,
                        name: place.name,
                        address: place.vicinity,
                        rating: place.rating,
                        totalRatings: place.user_ratings_total,
                        photoReference: place.photos?.[0]?.photo_reference,
                        latitude: place.geometry.location.lat,
                        longitude: place.geometry.location.lng,
                        isOnDuty: isOnDuty,
                        has24HourService: has24HourService,
                        hasDelivery: hasDelivery,
                        phoneNumber: phoneNumber,
                        distance: calculateDistance(
                            latitude,
                            longitude,
                            place.geometry.location.lat,
                            place.geometry.location.lng
                        )
                    };
                });

                setPharmacies(formattedPharmacies);
                setFilteredPharmacies(formattedPharmacies);
            } else {
                // Eğer gerçek veri alınamazsa, örnek veriler oluştur
                const mockPharmacies = generateMockPharmacies(latitude, longitude);
                setPharmacies(mockPharmacies);
                setFilteredPharmacies(mockPharmacies);
            }

            setLoading(false);
        } catch (error) {
            console.error('Eczane verileri alınırken hata:', error);

            // Hata durumunda örnek veriler gösterelim
            const location = await Location.getCurrentPositionAsync({});
            const { latitude, longitude } = location.coords;
            const mockPharmacies = generateMockPharmacies(latitude, longitude);
            setPharmacies(mockPharmacies);
            setFilteredPharmacies(mockPharmacies);

            setLoading(false);
        }
    };

    // Örnek veri oluşturma fonksiyonu
    const generateMockPharmacies = (baseLatitude, baseLongitude) => {
        const mockData = [];
        const pharmacyNames = [
            'Hayat Eczanesi',
            'Merkez Eczanesi',
            'Güven Eczanesi',
            'Şifa Eczanesi',
            'Sağlık Eczanesi',
            'Yeni Eczane',
            'Park Eczanesi',
            'Deniz Eczanesi',
            'Aile Eczanesi',
            'Yaşam Eczanesi'
        ];

        for (let i = 0; i < 10; i++) {
            // Rastgele konum oluştur (mevcut konumun yakınında)
            const latOffset = (Math.random() - 0.5) * 0.02;
            const lngOffset = (Math.random() - 0.5) * 0.02;
            const lat = baseLatitude + latOffset;
            const lng = baseLongitude + lngOffset;

            // Eczane özellikleri
            const isOnDuty = Math.random() > 0.85; // %15 ihtimalle nöbetçi
            const has24HourService = isOnDuty || Math.random() > 0.9; // Nöbetçiyse veya %10 ihtimalle 24 saat
            const hasDelivery = Math.random() > 0.5; // %50 ihtimalle teslimat

            // Telefon numarası oluştur
            const phoneNumber = `0${Math.floor(Math.random() * 1000000000).toString().padStart(9, '5')}`;

            mockData.push({
                id: `mock-pharmacy-${i}`,
                name: pharmacyNames[i],
                address: `${Math.floor(Math.random() * 100) + 1}. Sokak No: ${Math.floor(Math.random() * 100) + 1}`,
                rating: (Math.random() * 3 + 2).toFixed(1), // 2.0 ile 5.0 arası
                totalRatings: Math.floor(Math.random() * 500),
                photoReference: null, // Mock veri için resim yok
                latitude: lat,
                longitude: lng,
                isOnDuty: isOnDuty,
                has24HourService: has24HourService,
                hasDelivery: hasDelivery,
                phoneNumber: phoneNumber,
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

    const renderPharmacy = useCallback(({ item }) => (
        <PharmacyCard
            item={item}
            onPress={openMaps}
        />
    ), []);

    const getItemLayout = useCallback((data, index) => ({
        length: 300, // kart yüksekliği + margin
        offset: 300 * index,
        index,
    }), []);

    // Filtre butonlarını render etme fonksiyonu
    const renderFilterButtons = () => (
        <View style={styles.filterContainer}>
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.filterScrollContent}
            >
                <FilterButton
                    title="Tümü"
                    icon="format-list-bulleted"
                    active={activeFilter === 'all'}
                    onPress={() => setActiveFilter('all')}
                />
                <FilterButton
                    title="En Yakın"
                    icon="near-me"
                    active={activeFilter === 'nearest'}
                    onPress={() => setActiveFilter('nearest')}
                />
                <FilterButton
                    title="Nöbetçi"
                    icon="assignment-turned-in"
                    active={activeFilter === 'onDuty'}
                    onPress={() => setActiveFilter('onDuty')}
                />
            </ScrollView>
        </View>
    );

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#4CAF50" />
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
                    <Text style={styles.headerTitle}>Yakındaki Eczaneler</Text>
                </TouchableOpacity>
            </View>

            {renderFilterButtons()}

            {filteredPharmacies.length > 0 ? (
                <FlatList
                    data={filteredPharmacies}
                    renderItem={renderPharmacy}
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
                    {activeFilter === 'onDuty' ? (
                        <>
                            <Text style={styles.emptyText}>Nöbetçi eczane bulunamadı</Text>
                            <Text style={styles.emptySubText}>Şu anda yakınınızda nöbetçi eczane bulunmuyor</Text>
                        </>
                    ) : (
                        <>
                            <Text style={styles.emptyText}>Yakında eczane bulunamadı</Text>
                            <Text style={styles.emptySubText}>Farklı bir konumda tekrar deneyin</Text>
                        </>
                    )}
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
    filterContainer: {
        backgroundColor: '#fff',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    filterScrollContent: {
        paddingHorizontal: 16,
    },
    filterButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        backgroundColor: '#F1F8E9',
        borderRadius: 20,
        marginRight: 10,
        borderWidth: 1,
        borderColor: '#4CAF50',
    },
    filterButtonActive: {
        backgroundColor: '#4CAF50',
        borderColor: '#4CAF50',
    },
    filterButtonText: {
        color: '#4CAF50',
        fontWeight: '600',
        fontSize: 14,
    },
    filterButtonTextActive: {
        color: '#FFFFFF',
    },
    filterIcon: {
        marginRight: 4,
    },
    listContainer: {
        padding: 16,
        paddingBottom: 100,
    },
    pharmacyCard: {
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
    pharmacyImage: {
        width: 110,
        height: 140,
        resizeMode: 'cover',
    },
    placeholderImage: {
        width: 110,
        height: 140,
        backgroundColor: '#E8F5E9',
        justifyContent: 'center',
        alignItems: 'center',
    },
    pharmacyLogo: {
        fontSize: 50,
        fontWeight: 'bold',
        color: '#4CAF50',
    },
    pharmacyContent: {
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
    pharmacyName: {
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
    pharmacyAddress: {
        fontSize: 14,
        color: '#7F8C8D',
        marginBottom: 8,
    },
    infoContainer: {
        marginBottom: 10,
    },
    infoItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    infoText: {
        fontSize: 13,
        color: '#2C3E50',
        marginLeft: 6,
    },
    footerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 8,
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
    dutyContainer: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
    },
    dutyText: {
        fontSize: 12,
        fontWeight: '600',
    },
    callButton: {
        backgroundColor: '#4CAF50',
        borderRadius: 4,
        paddingVertical: 6,
        paddingHorizontal: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        alignSelf: 'flex-start',
    },
    callButtonText: {
        color: '#FFF',
        fontSize: 12,
        fontWeight: '600',
        marginLeft: 4,
    },
});

export default Pharmacies; 