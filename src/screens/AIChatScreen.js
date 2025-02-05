import React, { useState, useRef, useEffect } from 'react';
import {
    View, Text, StyleSheet, TextInput, TouchableOpacity,
    FlatList, KeyboardAvoidingView, Platform, Animated
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { getAIResponse } from '../services/aiService';
import * as Location from 'expo-location';

const SUGGESTED_PROMPTS = [
    {
        id: '1',
        title: 'Tarihi Yerler',
        prompt: 'Bölgedeki tarihi yerleri ve müzeleri önerir misin?'
    },
    {
        id: '2',
        title: 'Yemek Rotası',
        prompt: 'Yerel lezzetleri tadabileceğim bir rota önerir misin?'
    },
    {
        id: '3',
        title: 'Doğa Yürüyüşü',
        prompt: 'Yakındaki doğa yürüyüşü rotalarını önerir misin?'
    },
    {
        id: '4',
        title: 'Aile Aktiviteleri',
        prompt: 'Ailece yapabileceğimiz aktiviteleri önerir misin?'
    }
];

const AIChatScreen = () => {
    const [messages, setMessages] = useState([]);
    const [inputText, setInputText] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const flatListRef = useRef(null);
    const loadingDots = useRef(new Animated.Value(0)).current;
    const [location, setLocation] = useState(null);

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

    const sendMessage = async (text) => {
        if (!text.trim()) return;

        const newMessage = {
            id: Date.now().toString(),
            text,
            isUser: true,
            timestamp: new Date()
        };

        setMessages(prev => [...prev, newMessage]);
        setInputText('');
        setIsLoading(true);
        startLoadingAnimation();

        try {
            let response;
            if (location) {
                const coords = {
                    latitude: location.coords.latitude,
                    longitude: location.coords.longitude
                };
                response = await getAIResponse(text, coords);
            } else {
                response = "Üzgünüm, konumunuza erişemediğim için size özel öneriler sunamıyorum. Lütfen konum izni verdiğinizden emin olun.";
            }

            setMessages(prev => [...prev, {
                id: Date.now().toString(),
                text: response,
                isUser: false,
                timestamp: new Date()
            }]);
        } catch (error) {
            console.error('AI yanıt hatası:', error);
            setMessages(prev => [...prev, {
                id: Date.now().toString(),
                text: "Üzgünüm, bir hata oluştu. Lütfen tekrar deneyin.",
                isUser: false,
                timestamp: new Date()
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    const renderSuggestedPrompt = ({ item }) => (
        <TouchableOpacity
            style={styles.promptChip}
            onPress={() => sendMessage(item.prompt)}
        >
            <Text style={styles.promptChipText}>{item.title}</Text>
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
                <Text style={styles.headerTitle}>AI Asistan</Text>
            </LinearGradient>

            <FlatList
                ref={flatListRef}
                data={messages}
                renderItem={renderMessage}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.messagesList}
                onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
            />

            {messages.length === 0 && (
                <View style={styles.suggestedPromptsContainer}>
                    <Text style={styles.suggestedTitle}>Önerilen Sorular</Text>
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
                    placeholder="Mesajınızı yazın..."
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
        paddingTop: Platform.OS === 'ios' ? 60 : 16
    },
    headerTitle: {
        color: '#FFF',
        fontSize: 20,
        fontWeight: 'bold'
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
    }
});

export default AIChatScreen; 