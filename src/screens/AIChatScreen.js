import React, { useState, useRef, useEffect } from 'react';
import {
    View, Text, StyleSheet, TextInput, TouchableOpacity,
    FlatList, KeyboardAvoidingView, Platform, Animated,
    Alert, Keyboard
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { getAIResponse } from '../services/aiService';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { translate } from '../i18n/i18n';

const SUGGESTED_PROMPTS = [
    {
        id: '1',
        title: 'ai_prompt_historical',
        prompt: 'ai_prompt_historical_text'
    },
    {
        id: '2',
        title: 'ai_prompt_food',
        prompt: 'ai_prompt_food_text'
    },
    {
        id: '3',
        title: 'ai_prompt_nature',
        prompt: 'ai_prompt_nature_text'
    },
    {
        id: '4',
        title: 'ai_prompt_family',
        prompt: 'ai_prompt_family_text'
    },
    {
        id: '5',
        title: 'ai_prompt_famous',
        prompt: 'ai_prompt_famous_text'
    },
    {
        id: '6',
        title: 'ai_prompt_stories',
        prompt: 'ai_prompt_stories_text'
    },
    {
        id: '7',
        title: 'ai_prompt_culture',
        prompt: 'ai_prompt_culture_text'
    }
];

const AIChatScreen = ({ navigation }) => {
    const [messages, setMessages] = useState([]);
    const [inputText, setInputText] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const flatListRef = useRef(null);
    const loadingDots = useRef(new Animated.Value(0)).current;
    const [location, setLocation] = useState(null);
    const [isTyping, setIsTyping] = useState(false);
    const [typingText, setTypingText] = useState('');
    const typingAnimation = useRef(null);
    const [messagesLoaded, setMessagesLoaded] = useState(false);

    const startLoadingAnimation = () => {
        Animated.sequence([
            Animated.timing(loadingDots, {
                toValue: 3,
                duration: 1000,
                useNativeDriver: true
            }),
            Animated.timing(loadingDots, {
                toValue: 0,
                duration: 0,
                useNativeDriver: true
            })
        ]).start(() => {
            if (isLoading) startLoadingAnimation();
        });
    };

    useEffect(() => {
        // Konum izni ve mevcut konumu al
        (async () => {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status === 'granted') {
                const location = await Location.getCurrentPositionAsync({});
                setLocation(location);
            }
        })();
    }, []);

    useEffect(() => {
        if (isTyping) {
            let dots = '';
            typingAnimation.current = setInterval(() => {
                dots = dots.length >= 3 ? '' : dots + '.';
                setTypingText(`${translate('ai_chat_typing')}${dots}`);
            }, 500);
        } else {
            if (typingAnimation.current) {
                clearInterval(typingAnimation.current);
            }
        }

        return () => {
            if (typingAnimation.current) {
                clearInterval(typingAnimation.current);
            }
        };
    }, [isTyping]);

    const sendMessage = async (text) => {
        if (!text.trim()) return;

        const userMessage = {
            id: Date.now().toString(),
            text: text.trim(),
            isUser: true,
            timestamp: new Date()
        };

        // Önce kullanıcı mesajını ekle
        setMessages(prev => [...prev, userMessage]);
        setInputText('');
        setIsTyping(true);

        try {
            let response;
            if (location) {
                const coords = {
                    latitude: location.coords.latitude,
                    longitude: location.coords.longitude
                };

                // Son 5 mesajı geçmiş olarak gönder
                const recentHistory = [...messages, userMessage].slice(-5);
                response = await getAIResponse(text, coords, recentHistory);
            } else {
                response = translate('ai_chat_location_error');
            }

            setIsTyping(false);

            // AI yanıtını ekle
            setMessages(prev => [...prev, {
                id: Date.now().toString(),
                text: response,
                isUser: false,
                timestamp: new Date()
            }]);

        } catch (error) {
            console.error('AI yanıt hatası:', error);
            setIsTyping(false);

            // Hata mesajını ekle
            setMessages(prev => [...prev, {
                id: Date.now().toString(),
                text: translate('ai_chat_error'),
                isUser: false,
                timestamp: new Date()
            }]);
        }
    };

    // Sohbet geçmişini yükleme
    useEffect(() => {
        const loadMessages = async () => {
            try {
                const savedMessages = await AsyncStorage.getItem('chatHistory');
                if (savedMessages) {
                    // Mesajları yükle ve yüklendiğini işaretle
                    setMessages(JSON.parse(savedMessages));
                    setMessagesLoaded(true);
                } else {
                    // Mesaj yoksa da yüklendiğini işaretle
                    setMessagesLoaded(true);
                }
            } catch (error) {
                console.error('Sohbet geçmişi yüklenemedi:', error);
                Alert.alert(
                    translate('error'),
                    translate('ai_chat_load_error')
                );
                // Hata durumunda da yüklendiğini işaretle
                setMessagesLoaded(true);
            }
        };
        loadMessages();
    }, []);

    // Mesajlar değiştiğinde kaydet - debounce ekleyelim
    useEffect(() => {
        const saveMessages = async () => {
            try {
                await AsyncStorage.setItem('chatHistory', JSON.stringify(messages));
            } catch (error) {
                console.error('Sohbet geçmişi kaydedilemedi:', error);
            }
        };

        // Performans için debounce ekleyelim
        const timeoutId = setTimeout(() => {
            if (messages.length > 0) {
                saveMessages();
            }
        }, 500);

        return () => clearTimeout(timeoutId);
    }, [messages]);

    // Yeni mesaj eklendiğinde otomatik kaydırma için useEffect ekleyelim
    // Ancak sadece mesajlar yüklendikten sonra çalışsın
    useEffect(() => {
        if (messages.length > 0 && messagesLoaded) {
            setTimeout(() => {
                flatListRef.current?.scrollToEnd({ animated: true });
            }, 100);
        }
    }, [messages, messagesLoaded]);

    // Klavye açıldığında otomatik kaydırma
    useEffect(() => {
        const keyboardDidShowListener = Keyboard.addListener(
            'keyboardDidShow',
            () => {
                if (messages.length > 0) {
                    setTimeout(() => {
                        flatListRef.current?.scrollToEnd({ animated: true });
                    }, 100);
                }
            }
        );

        return () => {
            keyboardDidShowListener.remove();
        };
    }, [messages]);

    // Sohbeti temizleme fonksiyonu
    const clearChat = async () => {
        Alert.alert(
            translate('ai_chat_clear_title'),
            translate('ai_chat_clear_message'),
            [
                {
                    text: translate('ai_chat_clear_cancel'),
                    style: 'cancel'
                },
                {
                    text: translate('ai_chat_clear_confirm'),
                    onPress: async () => {
                        setMessages([]);
                        await AsyncStorage.removeItem('chatHistory');
                    },
                    style: 'destructive'
                }
            ]
        );
    };

    const renderSuggestedPrompt = ({ item }) => (
        <TouchableOpacity
            style={styles.promptChip}
            onPress={() => sendMessage(translate(item.prompt))}
        >
            <Text style={styles.promptChipText}>{translate(item.title)}</Text>
        </TouchableOpacity>
    );

    const renderMessage = ({ item }) => (
        <View style={[
            styles.messageContainer,
            item.isUser ? styles.userMessage : styles.aiMessage
        ]}>
            {!item.isUser && (
                <View style={styles.aiAvatar}>
                    <MaterialIcons name="psychology" size={24} color="#6C3EE8" />
                </View>
            )}
            <View style={styles.messageContent}>
                <Text style={styles.messageText}>{item.text}</Text>
                <Text style={styles.timestamp}>
                    {new Date(item.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                    })}
                </Text>
            </View>
        </View>
    );

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <LinearGradient
                colors={['#6C3EE8', '#4527A0']}
                style={styles.header}
            >
                <View style={styles.headerLeftSection}>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => navigation.goBack()}
                    >
                        <MaterialIcons name="arrow-back" size={24} color="#FFF" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>{translate('ai_chat_title')}</Text>
                </View>
                <TouchableOpacity
                    style={styles.menuButton}
                    onPress={clearChat}
                >
                    <MaterialIcons name="more-vert" size={24} color="#FFF" />
                </TouchableOpacity>
            </LinearGradient>

            <FlatList
                ref={flatListRef}
                data={messages}
                renderItem={renderMessage}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.messagesList}
                // İlk yükleme sırasında animasyonsuz, sonraki değişikliklerde animasyonlu
                onContentSizeChange={() => {
                    if (messagesLoaded) {
                        flatListRef.current?.scrollToEnd({ animated: false });
                    }
                }}
                // İlk yükleme sırasında animasyonsuz, sonraki değişikliklerde animasyonlu
                onLayout={() => {
                    if (messagesLoaded && messages.length > 0) {
                        flatListRef.current?.scrollToEnd({ animated: false });
                    }
                }}
                ListFooterComponent={() => (
                    isTyping ? (
                        <View style={styles.typingContainer}>
                            <View style={styles.aiAvatar}>
                                <MaterialIcons name="psychology" size={24} color="#6C3EE8" />
                            </View>
                            <View style={styles.typingBubble}>
                                <Text style={styles.typingText}>{typingText}</Text>
                            </View>
                        </View>
                    ) : null
                )}
            />

            {messages.length === 0 && (
                <View style={styles.suggestedPromptsContainer}>
                    <Text style={styles.suggestedTitle}>{translate('ai_chat_suggested_title')}</Text>
                    <FlatList
                        data={SUGGESTED_PROMPTS}
                        renderItem={renderSuggestedPrompt}
                        keyExtractor={item => item.id}
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.promptsList}
                    />
                </View>
            )}

            <View style={styles.inputContainer}>
                <TextInput
                    style={styles.input}
                    value={inputText}
                    onChangeText={setInputText}
                    placeholder={translate('ai_chat_input_placeholder')}
                    placeholderTextColor="#666"
                    multiline
                />
                <TouchableOpacity
                    style={styles.sendButton}
                    onPress={() => sendMessage(inputText)}
                >
                    <MaterialIcons name="send" size={24} color="#6C3EE8" />
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F5F5'
    },
    header: {
        padding: 16,
        paddingTop: Platform.OS === 'ios' ? 60 : 16,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    headerLeftSection: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    backButton: {
        padding: 8,
        marginLeft: -8,
        marginRight: 8,
    },
    headerTitle: {
        color: '#FFF',
        fontSize: 20,
        fontWeight: 'bold'
    },
    menuButton: {
        padding: 8,
        marginRight: -8
    },
    messagesList: {
        padding: 16
    },
    messageContainer: {
        flexDirection: 'row',
        marginBottom: 16,
        maxWidth: '80%'
    },
    userMessage: {
        alignSelf: 'flex-end'
    },
    aiMessage: {
        alignSelf: 'flex-start'
    },
    aiAvatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#F0E7FF',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 8
    },
    messageContent: {
        backgroundColor: '#FFF',
        padding: 12,
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
        elevation: 2
    },
    messageText: {
        fontSize: 16,
        color: '#333'
    },
    timestamp: {
        fontSize: 12,
        color: '#666',
        marginTop: 4,
        alignSelf: 'flex-end'
    },
    inputContainer: {
        flexDirection: 'row',
        padding: 16,
        backgroundColor: '#FFF',
        borderTopWidth: 1,
        borderTopColor: '#EEE'
    },
    input: {
        flex: 1,
        backgroundColor: '#F5F5F5',
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 8,
        marginRight: 8,
        maxHeight: 100
    },
    sendButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#F0E7FF',
        justifyContent: 'center',
        alignItems: 'center'
    },
    suggestedPromptsContainer: {
        padding: 16
    },
    suggestedTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 12
    },
    promptsList: {
        paddingVertical: 8
    },
    promptChip: {
        backgroundColor: '#FFF',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        marginRight: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
        elevation: 2
    },
    promptChipText: {
        color: '#6C3EE8',
        fontSize: 14,
        fontWeight: '500'
    },
    typingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        marginLeft: 16
    },
    typingBubble: {
        backgroundColor: '#F0E7FF',
        padding: 12,
        borderRadius: 16,
        maxWidth: '70%',
        marginLeft: 8
    },
    typingText: {
        color: '#6C3EE8',
        fontSize: 14
    }
});

export default AIChatScreen; 