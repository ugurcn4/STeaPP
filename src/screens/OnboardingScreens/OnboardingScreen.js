import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    Dimensions,
    TouchableOpacity,
    Image,
    Animated,
    Easing,
} from 'react-native';

const { width, height } = Dimensions.get('window');

const slides = [
    {
        id: '1',
        title: 'Konum Takibi',
        description: 'Arkadaşlarının konumunu takip et ve kendi konumunu paylaş.',
        image: require('../../../assets/images/onboarding/ana-sayfa.png')
    },
    {
        id: '2',
        title: 'Etkinlikler',
        description: 'Çevrende gerçekleşen etkinlikleri keşfet ve katıl.',
        image: require('../../../assets/images/onboarding/akis.png')
    },
    {
        id: '3',
        title: 'Sosyal Ağ',
        description: 'Arkadaşlarınla iletişimde kal ve anılarını paylaş.',
        image: require('../../../assets/images/onboarding/arkadaslar.png')
    },
    {
        id: '4',
        title: 'Güvenle İletişim',
        description: 'Arkadaşlarınla iletişimde kal ve dilediğin gibi mesajlaş.',
        image: require('../../../assets/images/onboarding/sohbet-ekranı.png')
    },
    {
        id: '5',
        title: 'Şehir Kaşifi',
        description: 'Şehirleri keşfedin, ilerlemenizi görün, şehirlerin kralı olun.',
        image: require('../../../assets/images/onboarding/sehirler.png')
    }
];

const OnboardingScreen = ({ navigation, route }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const flatListRef = useRef(null);
    const scrollX = useRef(new Animated.Value(0)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const translateY = useRef(new Animated.Value(50)).current;
    const scaleAnim = useRef(new Animated.Value(1)).current;

    // Nokta animasyonu için yeni bir Animated.Value ekleyelim
    const dotPosition = Animated.divide(scrollX, width);

    // Settings'den gelip gelmediğini kontrol edelim
    const isFromSettings = route.params?.fromSettings;

    useEffect(() => {
        // Başlangıç animasyonu
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 1000,
                useNativeDriver: true,
            }),
            Animated.timing(translateY, {
                toValue: 0,
                duration: 1000,
                useNativeDriver: true,
            }),
        ]).start();

        // Next butonu için sürekli animasyon
        Animated.loop(
            Animated.sequence([
                Animated.timing(scaleAnim, {
                    toValue: 1.1,
                    duration: 1000,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
                Animated.timing(scaleAnim, {
                    toValue: 1,
                    duration: 1000,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
            ])
        ).start();
    }, []);

    const renderItem = ({ item, index }) => {
        const inputRange = [(index - 1) * width, index * width, (index + 1) * width];

        const scale = scrollX.interpolate({
            inputRange,
            outputRange: [0.8, 1, 0.8],
        });

        const opacity = scrollX.interpolate({
            inputRange,
            outputRange: [0.4, 1, 0.4],
        });

        return (
            <View style={styles.slide}>
                <Animated.View
                    style={[
                        {
                            transform: [{ scale }],
                            opacity,
                        },
                    ]}
                >
                    <Image
                        source={item.image}
                        style={styles.image}
                        resizeMode="contain"
                    />
                    <View style={styles.titleContainer}>
                        <Text style={styles.title}>{item.title}</Text>
                        <View style={styles.titleLine} />
                    </View>
                    <Text style={styles.description}>{item.description}</Text>
                </Animated.View>
            </View>
        );
    };

    const renderDots = () => {
        return (
            <View style={styles.dotContainer}>
                {/* Arka plan noktaları */}
                {slides.map((_, index) => (
                    <View
                        key={index}
                        style={[
                            styles.dot,
                            {
                                backgroundColor: '#D3D3D3'
                            }
                        ]}
                    />
                ))}

                {/* Animasyonlu aktif nokta */}
                <Animated.View
                    style={[
                        styles.activeDot,
                        {
                            transform: [{
                                translateX: Animated.multiply(
                                    dotPosition,
                                    9 // (dot width + marginHorizontal * 2) = 6 + (3 * 2)
                                )
                            }]
                        }
                    ]}
                />
            </View>
        );
    };

    const handleNext = () => {
        if (currentIndex < slides.length - 1) {
            flatListRef.current.scrollToIndex({
                index: currentIndex + 1,
                animated: true
            });
        } else {
            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 0,
                    duration: 500,
                    useNativeDriver: true,
                }),
                Animated.timing(translateY, {
                    toValue: 50,
                    duration: 500,
                    useNativeDriver: true,
                }),
            ]).start(() => {
                // Settings'den geldiyse geri dönelim, değilse login'e gidelim
                if (isFromSettings) {
                    navigation.goBack();
                } else {
                    navigation.replace('Giriş Yap');
                }
            });
        }
    };

    const handleSkip = () => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 0,
                duration: 300,
                useNativeDriver: true,
            }),
            Animated.timing(translateY, {
                toValue: 50,
                duration: 300,
                useNativeDriver: true,
            }),
        ]).start(() => {
            // Settings'den geldiyse geri dönelim, değilse login'e gidelim
            if (isFromSettings) {
                navigation.goBack();
            } else {
                navigation.replace('Giriş Yap');
            }
        });
    };

    return (
        <Animated.View
            style={[
                styles.container,
                {
                    opacity: fadeAnim,
                    transform: [{ translateY }]
                }
            ]}
        >
            <View style={styles.header}>
                <Image
                    source={require('../../../assets/images/new-logo.png')}
                    style={styles.logo}
                />
                <TouchableOpacity
                    onPress={handleSkip}
                    style={styles.skipButton}
                >
                    <Text style={styles.skipText}>Atla</Text>
                </TouchableOpacity>
            </View>

            <Animated.FlatList
                ref={flatListRef}
                data={slides}
                renderItem={renderItem}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onScroll={Animated.event(
                    [{ nativeEvent: { contentOffset: { x: scrollX } } }],
                    { useNativeDriver: true }
                )}
                scrollEventThrottle={16}
                onMomentumScrollEnd={(event) => {
                    const index = Math.round(event.nativeEvent.contentOffset.x / width);
                    setCurrentIndex(index);
                }}
                keyExtractor={(item) => item.id}
            />

            <View style={styles.footer}>
                {renderDots()}
                <Animated.View
                    style={[
                        styles.nextButton,
                        { transform: [{ scale: scaleAnim }] }
                    ]}
                >
                    <TouchableOpacity onPress={handleNext}>
                        <Text style={styles.nextButtonText}>
                            {currentIndex === slides.length - 1 ? 'Başla' : 'İleri'}
                        </Text>
                    </TouchableOpacity>
                </Animated.View>
            </View>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F9FF',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingTop: 60,
        paddingBottom: 20,
    },
    logo: {
        width: 80,
        height: 32,
        resizeMode: 'contain',
    },
    skipButton: {
        padding: 8,
    },
    skipText: {
        color: '#000',
        fontSize: 16,
        fontWeight: '700',
    },
    slide: {
        width,
        alignItems: 'center',
        padding: 20,
        paddingTop: 0,
    },
    image: {
        width: width * 1.7,
        height: height * 0.60,
        position: 'absolute',
        top: -30,
        left: -width * 0.45,
        resizeMode: 'contain',
    },
    titleContainer: {
        marginBottom: 10,
        marginTop: height * 0.6,
        paddingHorizontal: 20,
        width: '100%',
        alignItems: 'flex-start',
    },
    title: {
        fontSize: 42,
        fontWeight: '700',
        color: '#000',
        letterSpacing: -1,
    },
    titleLine: {
        height: 4,
        width: 40,
        backgroundColor: '#000',
        marginTop: 8,
        borderRadius: 2,
    },
    description: {
        fontSize: 16,
        color: '#666',
        lineHeight: 24,
        opacity: 0.8,
        marginTop: 10,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 40,
        paddingBottom: 40,
    },
    dotContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        position: 'relative',
    },
    dot: {
        height: 6,
        width: 6,
        borderRadius: 3,
        marginHorizontal: 3,
        backgroundColor: '#D3D3D3',
    },
    activeDot: {
        height: 6,
        width: 20,
        borderRadius: 3,
        backgroundColor: '#000',
        position: 'absolute',
        left: 0,
        marginHorizontal: 3,
    },
    nextButton: {
        width: 54,
        height: 54,
        borderRadius: 27,
        backgroundColor: '#000',
        justifyContent: 'center',
        alignItems: 'center',
    },
    nextButtonText: {
        color: '#FFF',
        fontSize: 14,
        fontWeight: '600',
    }
});

export default OnboardingScreen; 