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

const getPriceLevel = (level) => {
    return '₺'.repeat(level || 1);
};

const HotelCard = memo(({ item, onPress }) => (
    <TouchableOpacity
        style={styles.hotelCard}
        onPress={() => onPress(item)}
    >
        {item.photoReference ? (
            <Image
                source={{ uri: getPhotoUrl(item.photoReference) }}
                style={styles.hotelImage}
            />
        ) : (
            <View style={styles.placeholderImage}>
                <MaterialIcons name="hotel" size={40} color="#ddd" />
            </View>
        )}

        <View style={styles.hotelContent}>
            <View style={styles.headerRow}>
                <Text style={styles.hotelName} numberOfLines={1}>
                    {item.name}
                </Text>
                <Text style={styles.priceLevel}>
                    {getPriceLevel(item.priceLevel)}
                </Text>
            </View>

            <Text style={styles.hotelAddress} numberOfLines={2}>
                {item.address}
            </Text>

            <View style={styles.footerRow}>
                <View style={styles.ratingContainer}>
                    <MaterialIcons name="star" size={16} color="#FFD700" />
                    <Text style={styles.rating}>
                        {item.rating}
                    </Text>
                    <Text style={styles.totalRatings}>
                        ({item.totalRatings})
                    </Text>
                </View>
                <View style={styles.distanceContainer}>
                    <MaterialIcons name="location-on" size={16} color="#7F8C8D" />
                    <Text style={styles.distance}>{item.distance} km</Text>
                </View>
            </View>
        </View>
    </TouchableOpacity>
));

const NearbyHotels = () => {
    const navigation = useNavigation();
    const [hotels, setHotels] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getLocationAndHotels();
    }, []);

    const getLocationAndHotels = async () => {
        try {
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert(
                    'İzin Gerekli',
                    'Yakındaki otelleri görebilmek için konum izni gerekiyor.',
                    [{ text: 'Tamam' }]
                );
                setLoading(false);
                return;
            }

            const location = await Location.getCurrentPositionAsync({});
            const { latitude, longitude } = location.coords;

            const response = await fetch(
                `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${latitude},${longitude}&radius=5000&type=lodging&language=tr&key=${GOOGLE_PLACES_API_KEY}`
            );

            const data = await response.json();

            if (data.status === 'OK') {
                const formattedHotels = data.results.map(place => ({
                    id: place.place_id,
                    name: place.name,
                    address: place.vicinity,
                    rating: place.rating,
                    totalRatings: place.user_ratings_total,
                    photoReference: place.photos?.[0]?.photo_reference,
                    priceLevel: place.price_level, // Fiyat seviyesi (1-4 arası)
                    latitude: place.geometry.location.lat,
                    longitude: place.geometry.location.lng,
                    distance: calculateDistance(
                        latitude,
                        longitude,
                        place.geometry.location.lat,
                        place.geometry.location.lng
                    )
                }));

                setHotels(formattedHotels);
            }
            setLoading(false);
        } catch (error) {
            console.error(error);
            Alert.alert('Hata', 'Oteller yüklenirken bir hata oluştu.');
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
        return (R * c).toFixed(1);
    };

    const deg2rad = (deg) => {
        return deg * (Math.PI / 180);
    };

    const renderHotel = useCallback(({ item }) => (
        <HotelCard
            item={item}
            onPress={(hotel) => Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${hotel.latitude},${hotel.longitude}`)}
        />
    ), []);

    const getItemLayout = useCallback((data, index) => ({
        length: 320, // kart yüksekliği + margin
        offset: 320 * index,
        index,
    }), []);

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
                    <Text style={styles.headerTitle}>Yakındaki Oteller</Text>
                </TouchableOpacity>
            </View>

            <FlatList
                data={hotels}
                renderItem={renderHotel}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.listContainer}
                showsVerticalScrollIndicator={false}
                getItemLayout={getItemLayout}
                removeClippedSubviews={true}
                maxToRenderPerBatch={10}
                windowSize={10}
                initialNumToRender={8}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F6FA',
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
        fontWeight: '600',
        color: '#2C3E50',
        marginLeft: 12,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    listContainer: {
        padding: 16,
    },
    hotelCard: {
        backgroundColor: '#fff',
        borderRadius: 20,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
        overflow: 'hidden',
    },
    hotelImage: {
        width: '100%',
        height: 200,
        backgroundColor: '#f5f5f5',
    },
    placeholderImage: {
        width: '100%',
        height: 200,
        backgroundColor: '#f5f5f5',
        justifyContent: 'center',
        alignItems: 'center',
    },
    hotelContent: {
        padding: 16,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    hotelName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#2C3E50',
        flex: 1,
        marginRight: 8,
    },
    priceLevel: {
        fontSize: 16,
        color: '#4CAF50',
        fontWeight: '600',
    },
    hotelAddress: {
        fontSize: 14,
        color: '#7F8C8D',
        marginBottom: 12,
        lineHeight: 20,
    },
    footerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    ratingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF8E1',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    rating: {
        marginLeft: 4,
        fontSize: 14,
        color: '#2C3E50',
        fontWeight: '600',
    },
    totalRatings: {
        fontSize: 14,
        color: '#7F8C8D',
        marginLeft: 4,
    },
    distanceContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8F9FA',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    distance: {
        marginLeft: 4,
        fontSize: 14,
        color: '#7F8C8D',
    }
});

export default NearbyHotels; 