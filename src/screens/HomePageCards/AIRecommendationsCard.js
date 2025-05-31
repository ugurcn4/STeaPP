import React, { useEffect, useRef, useState } from 'react';
import { Animated, Text, TouchableOpacity, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { translate } from '../../i18n/i18n';
import styles from '../../styles/HomePageStyles';

const AIRecommendationsCard = ({ navigation }) => {
    const [currentMessage, setCurrentMessage] = useState(0);
    const [displayedText, setDisplayedText] = useState('');
    const [isTyping, setIsTyping] = useState(true);
    const cursorAnim = useRef(new Animated.Value(0)).current;

    const messages = [
        translate('ai_help_message'),
        translate('ai_discover_places'),
        translate('ai_today_suggestion'),
        translate('ai_create_routes'),
        translate('ai_special_recommendations')
    ];

    // Yanıp sönen imleç için animasyon
    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(cursorAnim, {
                    toValue: 1,
                    duration: 500,
                    useNativeDriver: true,
                }),
                Animated.timing(cursorAnim, {
                    toValue: 0,
                    duration: 500,
                    useNativeDriver: true,
                }),
            ])
        ).start();
    }, []);

    // Yazma animasyonu için - bileşen yüklendikten sonra gecikmeli başlatma
    useEffect(() => {
        // Animasyonu gecikmeli başlat, UI yüklensin
        const initTimer = setTimeout(() => {
            startTypingAnimation();
        }, 1000);

        return () => clearTimeout(initTimer);
    }, []);

    // Yazma animasyonu için
    const startTypingAnimation = () => {
        let currentIndex = 0;
        let currentText = messages[currentMessage];
        setIsTyping(true);

        // Karakterleri tek tek yazma
        const typingInterval = setInterval(() => {
            if (currentIndex <= currentText.length) {
                setDisplayedText(currentText.slice(0, currentIndex));
                currentIndex++;
            } else {
                clearInterval(typingInterval);
                setIsTyping(false);

                // Silme işlemi için zamanlayıcı
                setTimeout(() => {
                    const deletingInterval = setInterval(() => {
                        setDisplayedText(prev => {
                            if (prev.length > 0) {
                                return prev.slice(0, -1);
                            } else {
                                clearInterval(deletingInterval);
                                setCurrentMessage((prev) => (prev + 1) % messages.length);
                                
                                // Yeni mesaj için yazma animasyonunu başlat
                                setTimeout(() => {
                                    startTypingAnimation();
                                }, 500);
                                
                                return '';
                            }
                        });
                    }, 50); // Silme hızı
                }, 2000); // Mesajın ekranda kalma süresi
            }
        }, 100); // Yazma hızı

        // Temizleme fonksiyonu
        return () => {
            clearInterval(typingInterval);
        };
    };

    return (
        <TouchableOpacity
            style={styles.aiRecommendCard}
            onPress={() => navigation.navigate('AIChat')}
        >
            <LinearGradient
                colors={['#6C3EE8', '#4527A0']}
                style={styles.aiCardGradient}
            >
                <View style={styles.aiCardContent}>
                    <View style={styles.aiCardLeft}>
                        <View style={styles.aiIconContainer}>
                            <MaterialIcons name="psychology" size={32} color="#FFF" />
                            <Animated.View
                                style={[
                                    styles.pulseCircle,
                                    { opacity: isTyping ? 1 : 0.3 }
                                ]}
                            />
                        </View>
                        <View style={styles.aiCardTextContainer}>
                            <Text style={styles.aiCardTitle}>{translate('ai_assistant_name')}</Text>
                            <View style={styles.messageContainer}>
                                <Text
                                    style={styles.aiCardSubtitle}
                                    numberOfLines={2}
                                >
                                    {displayedText}
                                </Text>
                                <Animated.Text
                                    style={[
                                        styles.cursor,
                                        { opacity: cursorAnim }
                                    ]}
                                >
                                    |
                                </Animated.Text>
                            </View>
                        </View>
                    </View>
                    <View style={styles.aiCardIcon}>
                        <MaterialIcons name="arrow-forward" size={24} color="#FFF" />
                    </View>
                </View>
            </LinearGradient>
        </TouchableOpacity>
    );
};

export default React.memo(AIRecommendationsCard); 