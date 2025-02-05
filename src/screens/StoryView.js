import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Image,
    StyleSheet,
    Dimensions,
    TouchableOpacity,
    StatusBar,
    Text,
    ActivityIndicator,
    PanResponder,
    Animated,
    ScrollView,
    Platform
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { getStoryViewers, markStoryAsViewed, likeStory } from '../services/storyService';
import { getCurrentUserUid } from '../services/friendFunctions';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';

const { width, height } = Dimensions.get('window');

const StoryView = ({ route, navigation }) => {
    const { stories, user, isOwnStory } = route.params;
    const [currentIndex, setCurrentIndex] = useState(0);
    const [progress, setProgress] = useState(0);
    const [loading, setLoading] = useState(true);
    const [viewers, setViewers] = useState([]);
    const [showViewers, setShowViewers] = useState(false);
    const slideAnim = useRef(new Animated.Value(height)).current;
    const panY = useRef(new Animated.Value(0)).current;
    const [isLiked, setIsLiked] = useState(false);
    const [currentUserId, setCurrentUserId] = useState(null);
    const [isTransitioning, setIsTransitioning] = useState(false);
    const fadeAnim = useRef(new Animated.Value(1)).current;
    const [isPaused, setIsPaused] = useState(false);

    const panResponder = useRef(
        PanResponder.create({
            onMoveShouldSetPanResponder: (_, gestureState) => {
                return Math.abs(gestureState.dy) > 20;
            },
            onPanResponderMove: (_, gestureState) => {
                if (gestureState.dy > 0) { // Sadece aşağı kaydırmaya izin ver
                    panY.setValue(gestureState.dy);
                }
            },
            onPanResponderRelease: (_, gestureState) => {
                if (gestureState.dy > 100) {
                    // Yeterince aşağı kaydırıldıysa kapat
                    Animated.timing(panY, {
                        toValue: height,
                        duration: 300,
                        useNativeDriver: true
                    }).start(() => navigation.goBack());
                } else {
                    // Yetersiz kaydırma, geri döndür
                    Animated.spring(panY, {
                        toValue: 0,
                        tension: 30,
                        useNativeDriver: true
                    }).start();
                }
            }
        })
    ).current;

    useEffect(() => {
        const handleStoryView = async () => {
            try {
                const currentUserId = await getCurrentUserUid();
                const currentStory = stories[currentIndex];

                if (currentUserId && !isOwnStory) {
                    // Görüntüleme kaydı ekle
                    const result = await markStoryAsViewed(currentStory.id, currentUserId);

                    // Görüntüleyenleri güncelle
                    if (isOwnStory) {
                        await fetchViewers();
                    }
                }
            } catch (error) {
                console.error('Hikaye görüntüleme hatası:', error);
            }
        };

        handleStoryView();

        const timer = setInterval(() => {
            if (!loading && !isTransitioning && progress < 1 && !showViewers && !isPaused) {
                // 10 saniye için progress artışını ayarla (0.01 = 1/100)
                setProgress(prev => prev + 0.01);
            }
        }, 100); // 100ms aralıklarla güncelle

        return () => clearInterval(timer);
    }, [currentIndex, loading, isTransitioning, showViewers, isPaused]);

    // Görüntüleyenleri getirme fonksiyonunu ayrı bir useEffect'te tutalım
    useEffect(() => {
        if (isOwnStory) {
            fetchViewers();
        }
    }, [currentIndex, isOwnStory]);

    useEffect(() => {
        if (isOwnStory && stories[currentIndex]) {
            const storyRef = doc(db, 'stories', stories[currentIndex].id);
            const unsubscribe = onSnapshot(storyRef, (doc) => {
                if (doc.exists()) {
                    const data = doc.data();
                    setViewers(data.viewedBy || []);
                }
            });

            return () => unsubscribe();
        }
    }, [currentIndex, isOwnStory]);

    useEffect(() => {
        const init = async () => {
            const uid = await getCurrentUserUid();
            setCurrentUserId(uid);

            // Mevcut hikayenin beğeni durumunu kontrol et
            const currentStory = stories[currentIndex];
            if (currentStory?.likes?.includes(uid)) {
                setIsLiked(true);
            } else {
                setIsLiked(false);
            }
        };

        init();
    }, [currentIndex]);

    const handleStoryTransition = (nextIndex) => {
        if (isTransitioning) return;
        setIsTransitioning(true);

        Animated.sequence([
            Animated.timing(fadeAnim, {
                toValue: 0,
                duration: 150,
                useNativeDriver: true,
            }),
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 150,
                useNativeDriver: true,
            })
        ]).start(() => {
            setIsTransitioning(false);
            setCurrentIndex(nextIndex);
            setProgress(0);
        });
    };

    const handlePress = (event) => {
        const x = event.nativeEvent.locationX;
        if (x < width / 2) {
            if (currentIndex > 0) {
                handleStoryTransition(currentIndex - 1);
            }
        } else {
            if (currentIndex < stories.length - 1) {
                handleStoryTransition(currentIndex + 1);
            } else {
                navigation.goBack();
            }
        }
    };

    useEffect(() => {
        if (progress >= 1 && !isTransitioning) {
            if (currentIndex < stories.length - 1) {
                handleStoryTransition(currentIndex + 1);
            } else {
                navigation.goBack();
            }
        }
    }, [progress]);

    const fetchViewers = async () => {
        try {
            const currentStory = stories[currentIndex];
            const viewersList = await getStoryViewers(currentStory.id);
            setViewers(viewersList);
        } catch (error) {
            console.error('Görüntüleyenler alınamadı:', error);
        }
    };

    const toggleViewers = () => {
        if (showViewers) {
            // Panel'i kapat
            Animated.spring(slideAnim, {
                toValue: height,
                tension: 65,
                friction: 11,
                useNativeDriver: true
            }).start(() => {
                setShowViewers(false);
                setIsPaused(false); // Panel kapandığında ilerlemeyi devam ettir
            });
        } else {
            // Panel'i aç
            setShowViewers(true);
            setIsPaused(true); // Panel açıldığında ilerlemeyi durdur
            Animated.spring(slideAnim, {
                toValue: 0,
                tension: 65,
                friction: 11,
                useNativeDriver: true
            }).start();
        }
    };

    const formatViewTime = (timestamp) => {
        if (!timestamp) {
            return '';
        }

        try {
            const date = timestamp.toDate();
            return date.toLocaleTimeString('tr-TR', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
            });
        } catch (error) {
            console.error('Zaman formatı hatası:', error);
            return '';
        }
    };

    const handleLike = async () => {
        try {
            const currentStory = stories[currentIndex];
            const result = await likeStory(currentStory.id, currentUserId);

            if (result) {
                setIsLiked(!isLiked);

                // stories state'ini güncelle
                const newStories = stories.map((story, index) => {
                    if (index === currentIndex) {
                        return {
                            ...story,
                            likes: !isLiked
                                ? [...(story.likes || []), currentUserId]
                                : (story.likes || []).filter(id => id !== currentUserId)
                        };
                    }
                    return story;
                });

                // route.params üzerinden stories'i güncelle
                if (route.params?.updateStories) {
                    route.params.updateStories(newStories);
                }
            }
        } catch (error) {
            console.error('Beğenme hatası:', error);
        }
    };

    const ViewersPanel = () => {
        const panResponderViewers = useRef(
            PanResponder.create({
                onStartShouldSetPanResponder: () => true,
                onMoveShouldSetPanResponder: () => true,
                onPanResponderMove: (_, gestureState) => {
                    if (gestureState.dy > 0) {
                        slideAnim.setValue(gestureState.dy);
                    }
                },
                onPanResponderRelease: (_, gestureState) => {
                    if (gestureState.dy > 50) {
                        // Panel'i kapat
                        Animated.spring(slideAnim, {
                            toValue: height,
                            tension: 65,
                            friction: 11,
                            useNativeDriver: true
                        }).start(() => {
                            toggleViewers();
                            setIsPaused(false); // Panel kapandığında ilerlemeyi devam ettir
                        });
                    } else {
                        // Geri döndür
                        Animated.spring(slideAnim, {
                            toValue: 0,
                            tension: 65,
                            friction: 11,
                            useNativeDriver: true
                        }).start();
                    }
                }
            })
        ).current;

        return (
            <Animated.View
                style={[
                    styles.viewersPanel,
                    {
                        transform: [{ translateY: slideAnim }],
                        zIndex: 4 // Panel'in zIndex'ini artır
                    }
                ]}
            >
                {/* Tutma çubuğu ve başlık kısmı */}
                <View {...panResponderViewers.panHandlers} style={styles.panelHeader}>
                    <View style={styles.viewersPanelHandle} />
                    <View style={styles.viewersHeader}>
                        <Text style={styles.viewersTitle}>Görüntüleyenler</Text>
                        <TouchableOpacity onPress={toggleViewers}>
                            <Ionicons name="close" size={24} color="#000" />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Görüntüleyenler listesi */}
                <ScrollView style={styles.viewersList}>
                    {viewers.length === 0 ? (
                        <View style={styles.noViewersContainer}>
                            <Text style={styles.noViewersText}>Henüz görüntüleyen yok</Text>
                        </View>
                    ) : (
                        viewers.map((viewer, index) => (
                            <View
                                key={`viewer-${viewer.id}-${index}`}
                                style={styles.viewerItem}
                            >
                                <Image
                                    source={
                                        viewer.profilePicture
                                            ? { uri: viewer.profilePicture }
                                            : { uri: `https://ui-avatars.com/api/?name=${encodeURIComponent(viewer.name)}&background=random&size=200` }
                                    }
                                    style={styles.viewerAvatar}
                                />
                                <View style={styles.viewerInfo}>
                                    <View style={styles.viewerTextContainer}>
                                        <Text style={styles.viewerName}>{viewer.name}</Text>
                                        <Text style={styles.viewerTime}>
                                            {formatViewTime(viewer.viewedAt)}
                                        </Text>
                                    </View>
                                </View>
                                {viewer.liked && (
                                    <Ionicons name="heart" size={20} color="red" style={styles.likeIcon} />
                                )}
                            </View>
                        ))
                    )}
                </ScrollView>
            </Animated.View>
        );
    };

    return (
        <Animated.View
            style={[
                styles.container,
                {
                    transform: [{
                        translateY: panY
                    }]
                }
            ]}
            {...panResponder.panHandlers}
        >
            <StatusBar hidden />

            <View style={styles.safeAreaContainer}>
                {/* Progress Bar */}
                <View style={styles.progressContainer}>
                    {stories.map((_, index) => (
                        <View key={index} style={styles.progressBarContainer}>
                            <View
                                style={[
                                    styles.progressBar,
                                    {
                                        width: `${index === currentIndex ? progress * 100 : index < currentIndex ? 100 : 0}%`
                                    }
                                ]}
                            />
                        </View>
                    ))}
                </View>

                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.userInfo}>
                        <Image
                            source={
                                user?.profilePicture
                                    ? { uri: user.profilePicture }
                                    : { uri: `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || '')}&background=random` }
                            }
                            style={styles.userAvatar}
                        />
                        <Text style={styles.userName}>{user?.name}</Text>
                    </View>
                    <TouchableOpacity onPress={() => navigation.goBack()}>
                        <Ionicons name="close" size={24} color="#FFF" />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Story Content */}
            <TouchableOpacity
                activeOpacity={1}
                style={styles.storyContainer}
                onPress={handlePress}
            >
                <Animated.View style={{ opacity: fadeAnim, flex: 1 }}>
                    <Image
                        source={{ uri: stories[currentIndex].storyUrl }}
                        style={styles.storyImage}
                        resizeMode="contain"
                        onLoadStart={() => setLoading(true)}
                        onLoadEnd={() => setLoading(false)}
                    />
                </Animated.View>
            </TouchableOpacity>

            {/* Görüntüleyenler Butonu */}
            {isOwnStory && (
                <TouchableOpacity
                    style={styles.viewersButton}
                    onPress={toggleViewers}
                >
                    <View style={styles.viewersButtonContent}>
                        <Ionicons name="eye-outline" size={20} color="#FFF" />
                        <Text style={styles.viewersButtonText}>
                            {viewers.length} görüntüleme
                        </Text>
                        <Ionicons name="chevron-up" size={20} color="#FFF" />
                    </View>
                </TouchableOpacity>
            )}

            {/* Görüntüleyenler Paneli Arka Planı */}
            {isOwnStory && showViewers && (
                <View
                    style={[
                        styles.modalBackground,
                        { zIndex: 3 } // Arka plan zIndex'ini panel'den düşük tut
                    ]}
                    onTouchEnd={toggleViewers}
                />
            )}

            {/* Görüntüleyenler Paneli */}
            {isOwnStory && showViewers && <ViewersPanel />}

            {/* Beğenme butonu */}
            {!isOwnStory && (
                <TouchableOpacity
                    style={styles.likeButton}
                    onPress={handleLike}
                >
                    <Ionicons
                        name={isLiked ? "heart" : "heart-outline"}
                        size={28}
                        color={isLiked ? "#FF3B30" : "#FFF"}
                    />
                </TouchableOpacity>
            )}

            {/* Loading Indicator */}
            {(loading || isTransitioning) && (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#FFF" />
                </View>
            )}
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    storyContainer: {
        flex: 1,
        justifyContent: 'center',
    },
    storyImage: {
        width,
        height: height - 100,
        alignSelf: 'center',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 15, // Progress bar ile header arası boşluk
    },
    progressContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
    },
    viewersButton: {
        position: 'absolute',
        bottom: 40,
        left: 20,
        right: 20,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        borderRadius: 20,
        padding: 12,
        zIndex: 2,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    viewersButtonContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    viewersButtonText: {
        color: '#FFF',
        fontSize: 16,
        marginHorizontal: 8,
    },
    viewersPanel: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: height * 0.7,
        backgroundColor: '#FFF',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        zIndex: 4,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: -2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84
    },
    viewersPanelHandle: {
        width: 40,
        height: 4,
        backgroundColor: '#DDD',
        borderRadius: 2,
        alignSelf: 'center',
        marginVertical: 10,
    },
    viewersHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingBottom: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#EFEFEF',
    },
    viewersList: {
        flex: 1,
    },
    viewerItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderBottomWidth: 0.5,
        borderBottomColor: '#EFEFEF',
        minHeight: 72,
    },
    viewerInfo: {
        flex: 1,
        marginLeft: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    viewerTextContainer: {
        flex: 1,
        justifyContent: 'center',
    },
    viewerAvatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#E1E1E1',
    },
    viewerName: {
        fontSize: 15,
        fontWeight: '600',
        color: '#262626',
        marginBottom: 2,
    },
    viewerTime: {
        fontSize: 13,
        color: '#8E8E8E',
    },
    likeIcon: {
        marginLeft: 10,
    },
    viewersTitle: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    loadingContainer: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.3)',
    },
    userInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    userAvatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
        marginRight: 10,
    },
    userName: {
        color: '#FFF',
        fontSize: 14,
        fontWeight: '600',
    },
    modalBackground: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        zIndex: 3
    },
    panelHeader: {
        width: '100%',
    },
    noViewersContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 40,
    },
    noViewersText: {
        fontSize: 16,
        color: '#8E8E8E',
        textAlign: 'center',
    },
    likeButton: {
        position: 'absolute',
        right: 20,
        bottom: 80,
        zIndex: 2,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        borderRadius: 25,
        padding: 10,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    safeAreaContainer: {
        paddingTop: Platform.OS === 'ios' ? 50 : StatusBar.currentHeight + 10,
        paddingHorizontal: 15,
    },
    progressBarContainer: {
        flex: 1,
        height: 2,
        backgroundColor: 'rgba(255,255,255,0.5)',
        marginHorizontal: 2,
        borderRadius: 1,
        overflow: 'hidden'
    },
    progressBar: {
        height: '100%',
        backgroundColor: '#FFF',
        borderRadius: 1,
    },
});

export default StoryView; 