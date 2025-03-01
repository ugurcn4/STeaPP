import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    Image,
    TouchableOpacity,
    ActivityIndicator,
} from 'react-native';
import * as MediaLibrary from 'expo-media-library';
import * as Location from 'expo-location';
import { MaterialIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { getPlaceFromCoordinates } from '../helpers/locationHelpers';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

const PhotosPage = ({ navigation }) => {
    const [photos, setPhotos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [groupedPhotos, setGroupedPhotos] = useState({});
    const [selectedCity, setSelectedCity] = useState(null);
    const [error, setError] = useState(null);
    const [selectedPhoto, setSelectedPhoto] = useState(null);
    const [hasMore, setHasMore] = useState(true);
    const [page, setPage] = useState(1);
    const PHOTOS_PER_PAGE = 50;

    useEffect(() => {
        loadPhotos();
    }, []);

    const loadPhotos = async (loadMore = false) => {
        try {
            if (!loadMore) {
                setLoading(true);
                setError(null);
            }

            // Medya izinlerini kontrol et
            const { status: mediaStatus } = await MediaLibrary.requestPermissionsAsync();
            if (mediaStatus !== 'granted') {
                setError('Medya erişim izni reddedildi');
                return;
            }

            // Konum izinlerini kontrol et
            const { status: locationStatus } = await Location.requestForegroundPermissionsAsync();
            if (locationStatus !== 'granted') {
                setError('Konum erişim izni reddedildi');
                return;
            }

            const currentPage = loadMore ? page : 1;

            // İlk sayfa için assets'leri al
            let assetsResponse;
            if (!loadMore) {
                assetsResponse = await MediaLibrary.getAssetsAsync({
                    mediaType: 'photo',
                    first: PHOTOS_PER_PAGE,
                    sortBy: [MediaLibrary.SortBy.creationTime],
                });
            } else {
                // Sonraki sayfalar için son fotoğrafın ID'sini kullan
                const lastPhoto = photos[photos.length - 1];
                assetsResponse = await MediaLibrary.getAssetsAsync({
                    mediaType: 'photo',
                    first: PHOTOS_PER_PAGE,
                    after: lastPhoto.id, // ID'yi string olarak kullan
                    sortBy: [MediaLibrary.SortBy.creationTime],
                });
            }

            const { assets, hasNextPage, endCursor } = assetsResponse;

            if (assets.length === 0 && !loadMore) {
                setError('Hiç fotoğraf bulunamadı');
                return;
            }

            // Fotoğrafları işle ve konum bilgilerini al
            const processedPhotos = await Promise.all(
                assets.map(async (photo) => {
                    try {
                        const asset = await MediaLibrary.getAssetInfoAsync(photo.id);

                        if (asset.location) {
                            const { latitude, longitude } = asset.location;
                            const placeInfo = await getPlaceFromCoordinates(latitude, longitude);

                            return {
                                id: photo.id,
                                uri: asset.localUri || photo.uri,
                                city: placeInfo.city,
                                district: placeInfo.district,
                                creationTime: asset.creationTime,
                                location: asset.location
                            };
                        }

                        return {
                            id: photo.id,
                            uri: asset.localUri || photo.uri,
                            city: 'Diğer',
                            district: 'Konum Bilgisi Yok',
                            creationTime: asset.creationTime
                        };
                    } catch (error) {
                        console.error('Fotoğraf işleme hatası:', error);
                        return null;
                    }
                })
            );

            const validPhotos = processedPhotos.filter(photo => photo !== null);

            // Şehirlere göre grupla
            const newGrouped = validPhotos.reduce((acc, photo) => {
                if (!acc[photo.city]) {
                    acc[photo.city] = [];
                }
                acc[photo.city].push(photo);
                return acc;
            }, loadMore ? { ...groupedPhotos } : {});

            // Her şehir için fotoğrafları tarihe göre sırala
            Object.keys(newGrouped).forEach(city => {
                newGrouped[city].sort((a, b) => b.creationTime - a.creationTime);
            });

            setPhotos(prev => loadMore ? [...prev, ...validPhotos] : validPhotos);
            setGroupedPhotos(newGrouped);
            setHasMore(hasNextPage);
            setPage(currentPage + 1);

        } catch (error) {
            console.error('Fotoğraf yükleme hatası:', error);
            setError('Fotoğraflar yüklenirken bir hata oluştu');
        } finally {
            setLoading(false);
        }
    };

    const handleLoadMore = () => {
        if (hasMore && !loading) {
            loadPhotos(true);
        }
    };

    const renderCityItem = ({ item: city }) => {
        const cityPhotos = groupedPhotos[city] || [];
        const firstPhoto = cityPhotos[0];

        return (
            <TouchableOpacity
                style={[
                    styles.cityCard,
                    selectedCity === city && styles.selectedCityCard
                ]}
                onPress={() => setSelectedCity(city === selectedCity ? null : city)}
            >
                <LinearGradient
                    colors={['transparent', 'rgba(0,0,0,0.7)']}
                    style={styles.cityGradient}
                />
                {firstPhoto && (
                    <Image
                        source={{ uri: firstPhoto.uri }}
                        style={styles.cityThumbnail}
                        resizeMode="cover"
                    />
                )}
                <View style={styles.cityInfoContainer}>
                    <Text style={styles.cityName}>{city}</Text>
                    <View style={styles.photoCountContainer}>
                        <MaterialIcons name="photo-library" size={12} color="#fff" />
                        <Text style={styles.photoCount}>
                            {cityPhotos.length}
                        </Text>
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    const renderPhotoItem = ({ item }) => (
        <TouchableOpacity
            style={styles.photoCard}
            onPress={() => setSelectedPhoto(item)}
        >
            <Image
                source={{ uri: item.uri }}
                style={styles.photo}
                resizeMode="cover"
            />
            <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.7)']}
                style={styles.photoGradient}
            >
                <View style={styles.photoInfo}>
                    <View style={styles.photoLocationContainer}>
                        <MaterialIcons name="location-on" size={12} color="#fff" />
                        <Text style={styles.photoLocation}>
                            {item.district}
                        </Text>
                    </View>
                    <View style={styles.photoDateContainer}>
                        <MaterialIcons name="access-time" size={12} color="#fff" />
                        <Text style={styles.photoDate}>
                            {new Date(item.creationTime).toLocaleDateString('tr-TR')}
                        </Text>
                    </View>
                </View>
            </LinearGradient>
        </TouchableOpacity>
    );

    if (error) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => navigation.goBack()}
                    >
                        <MaterialIcons name="arrow-back" size={24} color="#333" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Fotoğraflar</Text>
                    <View style={styles.headerRight} />
                </View>
                <View style={styles.errorContainer}>
                    <MaterialIcons name="error-outline" size={48} color="#FF6B6B" />
                    <Text style={styles.errorText}>{error}</Text>
                    <TouchableOpacity
                        style={styles.retryButton}
                        onPress={loadPhotos}
                    >
                        <Text style={styles.retryButtonText}>Tekrar Dene</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#25D220" />
                <Text style={styles.loadingText}>Fotoğraflar yükleniyor...</Text>
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <LinearGradient
                colors={['#4CAF50', '#45a049']}
                style={styles.header}
            >
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <MaterialIcons name="arrow-back" size={24} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Fotoğraflar</Text>
                <View style={styles.headerRight} />
            </LinearGradient>

            <View style={styles.content}>
                <View style={styles.cityListContainer}>
                    <FlatList
                        horizontal
                        data={Object.keys(groupedPhotos)}
                        renderItem={renderCityItem}
                        keyExtractor={item => item}
                        style={styles.cityList}
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.cityListContent}
                    />
                </View>

                <FlatList
                    data={selectedCity ? groupedPhotos[selectedCity] : photos}
                    renderItem={renderPhotoItem}
                    keyExtractor={item => item.id}
                    numColumns={3}
                    style={styles.photoList}
                    contentContainerStyle={styles.photoListContent}
                    onEndReached={handleLoadMore}
                    onEndReachedThreshold={0.5}
                    ListFooterComponent={
                        loading && hasMore ? (
                            <View style={styles.loadingMore}>
                                <ActivityIndicator size="small" color="#25D220" />
                                <Text style={styles.loadingMoreText}>
                                    Daha fazla yükleniyor...
                                </Text>
                            </View>
                        ) : null
                    }
                />
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 16,
        borderBottomLeftRadius: 20,
        borderBottomRightRadius: 20,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: '#fff',
    },
    backButton: {
        padding: 8,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.2)',
    },
    headerRight: {
        width: 40,
    },
    content: {
        flex: 1,
    },
    cityListContainer: {
        backgroundColor: '#fff',
        marginTop: 8,
        paddingVertical: 12,
        borderRadius: 20,
        marginHorizontal: 8,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    cityList: {
        flexGrow: 0,
    },
    cityListContent: {
        paddingHorizontal: 8,
    },
    cityCard: {
        width: 140,
        height: 90,
        marginHorizontal: 4,
        borderRadius: 16,
        overflow: 'hidden',
        elevation: 3,
        backgroundColor: '#fff',
    },
    selectedCityCard: {
        borderWidth: 2,
        borderColor: '#4CAF50',
    },
    cityGradient: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        height: '100%',
        zIndex: 1,
    },
    cityThumbnail: {
        width: '100%',
        height: '100%',
    },
    cityInfoContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 8,
        zIndex: 2,
    },
    cityName: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 4,
    },
    photoCountContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    photoCount: {
        color: '#fff',
        fontSize: 12,
        marginLeft: 4,
    },
    photoList: {
        flex: 1,
        marginTop: 8,
    },
    photoListContent: {
        padding: 4,
    },
    photoCard: {
        flex: 1 / 3,
        aspectRatio: 1,
        margin: 1,
        borderRadius: 12,
        overflow: 'hidden',
        elevation: 2,
    },
    photo: {
        width: '100%',
        height: '100%',
    },
    photoGradient: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        height: '50%',
        justifyContent: 'flex-end',
        padding: 6,
    },
    photoInfo: {
        justifyContent: 'flex-end',
    },
    photoLocationContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 2,
    },
    photoLocation: {
        color: '#fff',
        fontSize: 10,
        marginLeft: 2,
    },
    photoDateContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    photoDate: {
        color: '#fff',
        fontSize: 10,
        marginLeft: 2,
    },
    loadingMore: {
        padding: 16,
        alignItems: 'center',
    },
    loadingMoreText: {
        marginTop: 8,
        fontSize: 12,
        color: '#666',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 10,
        fontSize: 16,
        color: '#666',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    errorText: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        marginTop: 12,
        marginBottom: 20,
    },
    retryButton: {
        backgroundColor: '#4CAF50',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 8,
    },
    retryButtonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '600',
    },
});

export default PhotosPage; 