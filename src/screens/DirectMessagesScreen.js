import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    Image,
    SafeAreaView,
    StatusBar,
    Platform,
    TextInput
} from 'react-native';
import { GestureHandlerRootView, PanGestureHandler, State } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { getCurrentUserUid } from '../services/friendFunctions';
import { getRecentChats } from '../services/messageService';

const DirectMessagesScreen = ({ navigation, route }) => {
    const [chats, setChats] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        let unsubscribe;
        const loadChats = async () => {
            try {
                const currentUserId = await getCurrentUserUid();
                if (currentUserId) {
                    unsubscribe = getRecentChats(currentUserId, (recentChats) => {
                        setChats(recentChats);
                        setIsLoading(false);
                    });
                }
            } catch (error) {
                console.error('Sohbetler yüklenirken hata:', error);
                setIsLoading(false);
            }
        };

        loadChats();
        return () => unsubscribe && unsubscribe();
    }, []);

    useEffect(() => {
        // initialChat parametresi varsa, doğrudan Chat ekranına yönlendir
        const initialChat = route.params?.initialChat;
        if (initialChat) {
            navigation.navigate('Chat', { friend: initialChat });
        }
    }, [route.params]);

    const handleNewChat = () => {
        navigation.navigate('Friends', {
            mode: 'selectForChat',
            onSelect: (selectedFriend) => {
                navigation.navigate('Chat', { friend: selectedFriend });
            }
        });
    };

    const renderHeader = () => (
        <View style={styles.headerContainer}>
            <BlurView intensity={100} style={styles.headerBlur}>
                <View style={styles.header}>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => navigation.goBack()}
                    >
                        <Ionicons name="chevron-back" size={28} color="#2196F3" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Mesajlar</Text>
                    <TouchableOpacity
                        onPress={handleNewChat}
                        style={styles.newChatButton}
                    >
                        <Ionicons name="create-outline" size={24} color="#0066FF" />
                    </TouchableOpacity>
                </View>

                <View style={styles.searchContainer}>
                    <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Ara..."
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        placeholderTextColor="#666"
                    />
                </View>
            </BlurView>
        </View>
    );

    const renderChatItem = ({ item }) => {
        const renderLastMessage = () => {
            const message = item.lastMessage;
            if (!message) return 'Yeni sohbet';

            switch (message.mediaType) {
                case 'voice':
                    return '🎤 Sesli mesaj';
                case 'image':
                    return '📷 Fotoğraf';
                case 'document':
                    return '📎 Dosya';
                default:
                    return message.message || 'Yeni sohbet';
            }
        };

        const formatTime = (timestamp) => {
            if (!timestamp) return '';
            const date = timestamp.toDate();
            const now = new Date();

            if (date.toDateString() === now.toDateString()) {
                // Bugün ise saat göster
                return date.toLocaleTimeString('tr-TR', {
                    hour: '2-digit',
                    minute: '2-digit'
                });
            } else if (date.getFullYear() === now.getFullYear()) {
                // Bu yıl ise gün ve ay göster
                return date.toLocaleDateString('tr-TR', {
                    day: 'numeric',
                    month: 'long'
                });
            } else {
                // Geçmiş yıllar için tarih göster
                return date.toLocaleDateString('tr-TR', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                });
            }
        };

        return (
            <TouchableOpacity
                style={styles.chatItem}
                onPress={() => navigation.navigate('Chat', { friend: item.user })}
            >
                <Image
                    source={
                        item.user.profilePicture
                            ? { uri: item.user.profilePicture }
                            : { uri: `https://ui-avatars.com/api/?name=${encodeURIComponent(item.user.name)}&background=random` }
                    }
                    style={styles.avatar}
                />
                {item.user.isOnline && <View style={styles.onlineIndicator} />}

                <View style={styles.chatInfo}>
                    <View style={styles.chatHeader}>
                        <Text style={styles.userName}>{item.user.name}</Text>
                        <Text style={styles.timestamp}>{formatTime(item.timestamp)}</Text>
                    </View>
                    <View style={styles.lastMessageContainer}>
                        <Text style={styles.lastMessage} numberOfLines={1}>
                            {renderLastMessage()}
                        </Text>
                        {item.unreadCount > 0 && (
                            <View style={styles.unreadBadge}>
                                <Text style={styles.unreadCount}>{item.unreadCount}</Text>
                            </View>
                        )}
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    const renderEmptyComponent = () => (
        <View style={styles.emptyContainer}>
            <Ionicons name="chatbubbles-outline" size={48} color="#666" style={styles.emptyIcon} />
            <Text style={styles.emptyTitle}>Henüz mesaj yok</Text>
            <Text style={styles.emptyText}>
                Arkadaşlarınla sohbet etmeye başla!
            </Text>
        </View>
    );

    const onGestureEvent = ({ nativeEvent }) => {
        if (nativeEvent.state === State.END) {
            // Soldan sağa çekme hareketi (pozitif x değeri)
            if (nativeEvent.translationX > 50) {
                navigation.goBack();
            }
        }
    };

    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <PanGestureHandler
                onHandlerStateChange={onGestureEvent}
                activeOffsetX={[-20, 20]}
            >
                <View style={styles.container}>
                    <StatusBar barStyle="dark-content" />
                    {renderHeader()}

                    <FlatList
                        data={chats}
                        renderItem={renderChatItem}
                        keyExtractor={item => item.chatId}
                        ListEmptyComponent={renderEmptyComponent}
                        contentContainerStyle={styles.listContainer}
                    />
                </View>
            </PanGestureHandler>
        </GestureHandlerRootView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    headerContainer: {
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.1)',
        paddingTop: Platform.OS === 'ios' ? 44 : StatusBar.currentHeight,
    },
    headerBlur: {
        width: '100%',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: '#000',
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f0f0f0',
        margin: 16,
        marginTop: 0,
        borderRadius: 10,
        padding: 8,
    },
    searchIcon: {
        marginRight: 8,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        color: '#000',
    },
    listContainer: {
        flexGrow: 1,
    },
    chatItem: {
        flexDirection: 'row',
        padding: 16,
        alignItems: 'center',
        borderBottomWidth: 0.5,
        borderBottomColor: 'rgba(0,0,0,0.1)',
    },
    avatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
    },
    onlineIndicator: {
        position: 'absolute',
        left: 55,
        top: 45,
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: '#4CAF50',
        borderWidth: 2,
        borderColor: '#fff',
    },
    chatInfo: {
        flex: 1,
        marginLeft: 12,
    },
    chatHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    userName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#000',
        marginBottom: 4,
    },
    timestamp: {
        fontSize: 12,
        color: '#666',
        marginBottom: 4,
    },
    lastMessageContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    lastMessage: {
        fontSize: 14,
        color: '#666',
        flex: 1,
    },
    unreadBadge: {
        backgroundColor: '#FF3B30',
        borderRadius: 12,
        minWidth: 24,
        height: 24,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 8,
        marginLeft: 8,
    },
    unreadCount: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '700',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 32,
    },
    emptyIcon: {
        marginBottom: 16,
        opacity: 0.7,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#000',
        marginBottom: 8,
    },
    emptyText: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
    },
    newChatButton: {
        padding: 8,
    },
});

export default DirectMessagesScreen; 