import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Image,
    SafeAreaView,
    FlatList,
    Dimensions,
    Platform,
    Animated,
    ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as MediaLibrary from 'expo-media-library';

const { width, height } = Dimensions.get('window');
const THUMB_SIZE = width / 4;
const SELECTED_IMAGE_HEIGHT = width;
const HEADER_HEIGHT = 56;

const CreatePostScreen = ({ navigation }) => {
    const [selectedImage, setSelectedImage] = useState(null);
    const [galleryImages, setGalleryImages] = useState([]);
    const [hasMoreImages, setHasMoreImages] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [after, setAfter] = useState(null);  // Pagination için
    const scrollY = useRef(new Animated.Value(0)).current;

    // Transform için yeni interpolate değerleri
    const imageTranslateY = scrollY.interpolate({
        inputRange: [0, SELECTED_IMAGE_HEIGHT],
        outputRange: [0, -SELECTED_IMAGE_HEIGHT],
        extrapolate: 'clamp'
    });

    const imageScale = scrollY.interpolate({
        inputRange: [0, SELECTED_IMAGE_HEIGHT],
        outputRange: [1, 0.5],
        extrapolate: 'clamp'
    });

    // Seçili görsel alanının opacity değeri
    const imageAreaOpacity = scrollY.interpolate({
        inputRange: [SELECTED_IMAGE_HEIGHT / 2, SELECTED_IMAGE_HEIGHT],
        outputRange: [1, 0],
        extrapolate: 'clamp'
    });

    useEffect(() => {
        loadGalleryImages();
    }, []);

    const loadGalleryImages = async (loadMore = false) => {
        try {
            const { status } = await MediaLibrary.requestPermissionsAsync();
            if (status !== 'granted') {
                alert('Galeriye erişim izni gerekiyor!');
                return;
            }

            setIsLoadingMore(true);

            const media = await MediaLibrary.getAssetsAsync({
                mediaType: 'photo',
                sortBy: ['creationTime'],
                first: 50,  // Her seferinde 50 fotoğraf
                after: loadMore ? after : undefined
            });

            if (!media.hasNextPage) {
                setHasMoreImages(false);
            }

            setAfter(media.endCursor);

            if (loadMore) {
                setGalleryImages(prevImages => [...prevImages, ...media.assets]);
            } else {
                setGalleryImages(media.assets);
                if (media.assets.length > 0) {
                    setSelectedImage(media.assets[0].uri);
                }
            }
        } catch (error) {
            console.error('Galeri yükleme hatası:', error);
        } finally {
            setIsLoadingMore(false);
        }
    };

    const handleLoadMore = () => {
        if (!isLoadingMore && hasMoreImages) {
            loadGalleryImages(true);
        }
    };

    const handleImageSelect = (uri) => {
        setSelectedImage(uri);
        // Görsel seçildiğinde scrollY'yi sıfırla
        scrollY.setValue(0);
    };

    const renderGalleryItem = ({ item }) => (
        <TouchableOpacity
            style={[
                styles.thumbContainer,
                selectedImage === item.uri && styles.selectedThumb
            ]}
            onPress={() => handleImageSelect(item.uri)}
            activeOpacity={0.7}
        >
            <Image
                source={{ uri: item.uri }}
                style={styles.thumb}
            />
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container}>
            {/* Header - Sabit */}
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    style={styles.headerButton}
                >
                    <Ionicons name="close" size={24} color="#000" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Yeni Gönderi</Text>
                <TouchableOpacity
                    onPress={() => navigation.navigate('CreatePostDetails', { image: selectedImage })}
                    disabled={!selectedImage}
                    style={[styles.nextButton, !selectedImage && styles.nextButtonDisabled]}
                >
                    <Text style={[styles.nextButtonText, !selectedImage && styles.nextButtonTextDisabled]}>
                        İleri
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Seçili Görsel - Animasyonlu */}
            <Animated.View style={[
                styles.selectedImageContainer,
                {
                    transform: [
                        { translateY: imageTranslateY },
                        { scale: imageScale }
                    ],
                    opacity: imageAreaOpacity
                }
            ]}>
                {selectedImage ? (
                    <Image
                        source={{ uri: selectedImage }}
                        style={styles.selectedImage}
                        resizeMode="cover"
                    />
                ) : (
                    <View style={styles.noImagePlaceholder}>
                        <Ionicons name="images-outline" size={48} color="#666" />
                        <Text style={styles.noImageText}>Görsel Seçin</Text>
                    </View>
                )}
            </Animated.View>

            {/* Galeri Grid */}
            <Animated.FlatList
                data={galleryImages}
                renderItem={renderGalleryItem}
                keyExtractor={item => item.id}
                numColumns={4}
                showsVerticalScrollIndicator={false}
                onScroll={Animated.event(
                    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                    { useNativeDriver: true }
                )}
                scrollEventThrottle={16}
                style={styles.gallery}
                contentContainerStyle={[
                    styles.galleryContent,
                    { paddingTop: SELECTED_IMAGE_HEIGHT }
                ]}
                onEndReached={handleLoadMore}
                onEndReachedThreshold={0.5}
                ListFooterComponent={() => (
                    isLoadingMore ? (
                        <View style={styles.loadingMore}>
                            <ActivityIndicator size="small" color="#25D220" />
                        </View>
                    ) : null
                )}
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        height: HEADER_HEIGHT,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        backgroundColor: '#fff',
        zIndex: 10,
    },
    headerButton: {
        padding: 8,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
    },
    nextButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        backgroundColor: '#2196F3',
        borderRadius: 20,
    },
    nextButtonDisabled: {
        backgroundColor: '#E0E0E0',
    },
    nextButtonText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 15,
    },
    nextButtonTextDisabled: {
        color: '#999',
    },
    selectedImageContainer: {
        width: width,
        height: SELECTED_IMAGE_HEIGHT,
        backgroundColor: '#f5f5f5',
        position: 'absolute',
        top: HEADER_HEIGHT,
        zIndex: 1,
    },
    selectedImage: {
        width: '100%',
        height: '100%',
    },
    noImagePlaceholder: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    noImageText: {
        marginTop: 12,
        fontSize: 16,
        color: '#666',
    },
    gallery: {
        flex: 1,
    },
    galleryContent: {
        paddingTop: 2,
    },
    thumbContainer: {
        width: THUMB_SIZE,
        height: THUMB_SIZE,
        padding: 1,
    },
    thumb: {
        width: '100%',
        height: '100%',
    },
    selectedThumb: {
        opacity: 0.7,
    },
    loadingMore: {
        padding: 20,
        alignItems: 'center',
        justifyContent: 'center'
    }
});

export default CreatePostScreen; 