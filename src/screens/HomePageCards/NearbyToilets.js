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

const ToiletCard = memo(({ item, onPress }) => (
    <TouchableOpacity
        style={styles.toiletCard}
        onPress={() => onPress(item)}
    >
        {item.photoReference ? (
            <Image
                source={{ uri: getPhotoUrl(item.photoReference) }}
                style={styles.toiletImage}
            />
        ) : (
            <View style={styles.placeholderImage}>
                <MaterialIcons name="wc" size={40} color="#ddd" />
            </View>
        )}

        <View style={styles.toiletContent}>
            <View style={styles.headerRow}>
                <Text style={styles.toiletName} numberOfLines={1}>
                    {item.name}
                </Text>
                <View style={styles.distanceContainer}>
                    <MaterialIcons name="directions-walk" size={16} color="#7F8C8D" />
                    <Text style={styles.distance}>{item.distance} km</Text>
                </View>
            </View>

            <Text style={styles.toiletAddress} numberOfLines={2}>
                {item.address}
            </Text>

            <View style={styles.footerRow}>
                {item.rating !== undefined && (
                    <View style={styles.ratingContainer}>
                        <MaterialIcons name="star" size={16} color="#FFD700" />
                        <Text style={styles.rating}>
                            {item.rating}
                        </Text>
                        <Text style={styles.totalRatings}>
                            ({item.totalRatings || 0})
                        </Text>
                    </View>
                )}
                {item.isDisabledAccessible !== undefined && (
                    <View style={styles.accessibilityContainer}>
                        <MaterialIcons
                            name="accessible"
                            size={16}
                            color={item.isDisabledAccessible ? "#4CAF50" : "#BDBDBD"}
                        />
                        <Text style={styles.accessibilityText}>
                            {item.isDisabledAccessible ? 'Engelli erişimine uygun' : 'Engelli erişimi yok'}
                        </Text>
                    </View>
                )}
            </View>

            {item.isPaid !== undefined && (
                <View style={[
                    styles.statusContainer,
                    { backgroundColor: item.isPaid ? '#FFEBEE' : '#E8F5E9' }
                ]}>
                    <Text style={[
                        styles.statusText,
                        { color: item.isPaid ? '#FF5252' : '#4CAF50' }
                    ]}>
                        {item.isPaid ? 'Ücretli' : 'Ücretsiz'}
                    </Text>
                </View>
            )}
        </View>
    </TouchableOpacity>
));

const NearbyToilets = () => {
    const navigation = useNavigation();
    const [toilets, setToilets] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getLocationAndToilets();
    }, []);

    const getLocationAndToilets = async () => {
        try {
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert(
                    'İzin Gerekli',
                    'Yakındaki tuvaletleri görebilmek için konum izni gerekiyor.',
                    [{ text: 'Tamam' }]
                );
                setLoading(false);
                return;
            }

            const location = await Location.getCurrentPositionAsync({});
            const { latitude, longitude } = location.coords;

            // Google Places API ile yakındaki tuvaletleri ara
            // Not: Google Places API'da direkt "toilet" tipi olmadığı için,
            // anahtar kelime aramasıyla birlikte kullanılabilir
            const response = await fetch(
                `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${latitude},${longitude}&radius=2000&keyword=tuvalet|wc|toilet|restroom&language=tr&key=${GOOGLE_PLACES_API_KEY}`
            );

            const data = await response.json();

            if (data.status === 'OK') {
                const formattedToilets = data.results.map(place => {
                    // Not: isDisabledAccessible ve isPaid bilgisi Nearby Search API'sinden doğrudan gelmez.
                    // Bu bilgiler için Place Details API'sine ek istekler yapmak gerekir.
                    // Şimdilik bu alanları kaldırıyoruz.

                    return {
                        id: place.place_id,
                        name: place.name || 'Tuvalet',
                        address: place.vicinity,
                        rating: place.rating,
                        totalRatings: place.user_ratings_total,
                        photoReference: place.photos?.[0]?.photo_reference,
                        latitude: place.geometry.location.lat,
                        longitude: place.geometry.location.lng,
                        distance: calculateDistance(
                            latitude,
                            longitude,
                            place.geometry.location.lat,
                            place.geometry.location.lng
                        )
                    };
                });

                setToilets(formattedToilets);
            } else {
                // API'den 'OK' durumu gelmezse boş liste ata
                setToilets([]);
                console.warn('Google Places API isteği başarılı olmadı:', data.status, data.error_message);
            }

            setLoading(false);
        } catch (error) {
            console.error('Tuvalet verileri alınırken hata:', error);
            // Hata durumunda kullanıcıya bilgi ver ve boş liste ata
            setToilets([]);
            Alert.alert('Hata', 'Tuvalet verileri alınırken bir hata oluştu. Lütfen internet bağlantınızı kontrol edin veya daha sonra tekrar deneyin.');
            setLoading(false);
        }
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

    const renderToilet = useCallback(({ item }) => (
        <ToiletCard
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
                <ActivityIndicator size="large" color="#0288D1" />
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
                    <Text style={styles.headerTitle}>Yakındaki Tuvaletler</Text>
                </TouchableOpacity>
            </View>

            {toilets.length > 0 ? (
                <FlatList
                    data={toilets}
                    renderItem={renderToilet}
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
                    <Text style={styles.emptyText}>Yakında tuvalet bulunamadı</Text>
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
    toiletCard: {
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
    toiletImage: {
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
    toiletContent: {
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
    toiletName: {
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
    toiletAddress: {
        fontSize: 14,
        color: '#7F8C8D',
        marginBottom: 8,
    },
    footerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 4,
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
    accessibilityContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    accessibilityText: {
        fontSize: 12,
        color: '#7F8C8D',
        marginLeft: 4,
    },
    statusContainer: {
        alignSelf: 'flex-start',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
        marginTop: 4,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '600',
    },
});

export default NearbyToilets; 