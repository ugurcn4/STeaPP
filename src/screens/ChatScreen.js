import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    FlatList,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    Image,
    SafeAreaView,
    Dimensions,
    Alert,
    Linking,
    ActionSheetIOS,
    StatusBar
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
    sendMessage,
    subscribeToMessages,
    markChatAsRead,
    updateOnlineStatus,
    subscribeToUserOnlineStatus,
    sendMediaMessage,
    sendVoiceMessage
} from '../services/messageService';
import { getCurrentUserUid } from '../services/friendFunctions';
import { BlurView } from 'expo-blur';
import FriendProfileModal from '../modals/friendProfileModal';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';

const { width } = Dimensions.get('window');

const ChatScreen = ({ route, navigation }) => {
    const [messages, setMessages] = useState([]);
    const [messageText, setMessageText] = useState('');
    const { friend } = route.params;
    const flatListRef = useRef();
    const [isOnline, setIsOnline] = useState(true);
    const [friendProfileVisible, setFriendProfileVisible] = useState(false);
    const [lastSeen, setLastSeen] = useState(null);
    const [currentUserId, setCurrentUserId] = useState(null);
    const [isRecording, setIsRecording] = useState(false);
    const [recording, setRecording] = useState(null);
    const [recordingDuration, setRecordingDuration] = useState(0);
    const recordingTimer = useRef(null);
    const [playingAudio, setPlayingAudio] = useState(null);
    const [sound, setSound] = useState(null);
    const [initialLoad, setInitialLoad] = useState(true);
    const [newMessageReceived, setNewMessageReceived] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        navigation.setOptions({
            headerShown: false
        });

        const loadMessages = async () => {
            setIsLoading(true);
            const uid = await getCurrentUserUid();
            setCurrentUserId(uid);
            const chatId = [uid, friend.id].sort().join('_');

            const unsubscribeMessages = subscribeToMessages(
                uid,
                friend.id,
                (newMessages) => {
                    const reversedMessages = [...newMessages].reverse();
                    if (!initialLoad && messages.length < newMessages.length) {
                        setNewMessageReceived(true);
                    }
                    setMessages(reversedMessages);
                    markChatAsRead(chatId, uid);
                    setInitialLoad(false);
                    setIsLoading(false);
                }
            );

            const unsubscribeOnlineStatus = subscribeToUserOnlineStatus(
                friend.id,
                ({ isOnline, lastSeen }) => {
                    setIsOnline(isOnline);
                    setLastSeen(lastSeen);
                }
            );

            return () => {
                unsubscribeMessages();
                unsubscribeOnlineStatus();
            };
        };

        loadMessages();
    }, [friend]);

    useEffect(() => {
        if (newMessageReceived && flatListRef.current) {
            flatListRef.current.scrollToEnd({ animated: true });
            setNewMessageReceived(false);
        }
    }, [newMessageReceived]);

    useEffect(() => {
        const checkPermissions = async () => {
            const { status } = await Audio.requestPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert(
                    'İzin Gerekli',
                    'Sesli mesaj göndermek için mikrofon izni gerekiyor'
                );
            }
        };
        checkPermissions();
    }, []);

    const handleSendMessage = async () => {
        if (!messageText.trim()) return;

        const uid = await getCurrentUserUid();
        await sendMessage(uid, friend.id, messageText.trim());
        setMessageText('');
    };

    const handleMediaPicker = async () => {
        if (Platform.OS === 'ios') {
            ActionSheetIOS.showActionSheetWithOptions(
                {
                    options: ['İptal', 'Fotoğraf Çek', 'Galeriden Seç', 'Dosya Seç'],
                    cancelButtonIndex: 0,
                },
                async (buttonIndex) => {
                    if (buttonIndex === 1) {
                        await handleCamera();
                    } else if (buttonIndex === 2) {
                        await handleGallery();
                    } else if (buttonIndex === 3) {
                        await handleDocument();
                    }
                }
            );
        } else {
            Alert.alert(
                'Medya Ekle',
                'Lütfen bir seçenek seçin',
                [
                    {
                        text: 'Fotoğraf Çek',
                        onPress: handleCamera
                    },
                    {
                        text: 'Galeriden Seç',
                        onPress: handleGallery
                    },
                    {
                        text: 'Dosya Seç',
                        onPress: handleDocument
                    },
                    {
                        text: 'İptal',
                        style: 'cancel'
                    }
                ],
                { cancelable: true }
            );
        }
    };

    const handleCamera = async () => {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('İzin Gerekli', 'Kamera izni gerekiyor');
            return;
        }

        const result = await ImagePicker.launchCameraAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            quality: 0.8,
        });

        if (!result.canceled) {
            await handleMediaUpload(result.assets[0].uri, 'image');
        }
    };

    const handleGallery = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('İzin Gerekli', 'Galeri izni gerekiyor');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.All,
            quality: 0.8,
        });

        if (!result.canceled) {
            await handleMediaUpload(result.assets[0].uri, 'image');
        }
    };

    const handleDocument = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: '*/*',
                copyToCacheDirectory: true,
            });

            if (result.type === 'success') {
                await handleMediaUpload(result.uri, 'document');
            }
        } catch (err) {
            console.error('Dosya seçme hatası:', err);
        }
    };

    const handleMediaUpload = async (uri, type) => {
        try {
            const response = await fetch(uri);
            const blob = await response.blob();
            await sendMediaMessage(currentUserId, friend.id, blob, type);
        } catch (error) {
            console.error('Medya yükleme hatası:', error);
            Alert.alert('Hata', 'Medya gönderilemedi');
        }
    };

    const startRecording = async () => {
        try {
            await Audio.setAudioModeAsync({
                allowsRecordingIOS: true,
                playsInSilentModeIOS: true,
            });

            const recordingOptions = {
                android: {
                    extension: '.mp4',
                    outputFormat: Audio.RECORDING_OPTION_ANDROID_OUTPUT_FORMAT_MPEG_4,
                    audioEncoder: Audio.RECORDING_OPTION_ANDROID_AUDIO_ENCODER_AAC,
                    sampleRate: 44100,
                    numberOfChannels: 1,
                    bitRate: 128000,
                },
                ios: {
                    extension: '.m4a',
                    audioQuality: Audio.RECORDING_OPTION_IOS_AUDIO_QUALITY_MAX,
                    sampleRate: 44100,
                    numberOfChannels: 1,
                    bitRate: 128000,
                    linearPCMBitDepth: 16,
                    linearPCMIsBigEndian: false,
                    linearPCMIsFloat: false,
                },
            };

            const { recording } = await Audio.Recording.createAsync(recordingOptions);
            setRecording(recording);
            setIsRecording(true);

            recordingTimer.current = setInterval(() => {
                setRecordingDuration(prev => prev + 1);
            }, 1000);

        } catch (err) {
            console.error('Ses kaydı başlatılamadı:', err);
            Alert.alert('Hata', 'Ses kaydı başlatılamadı');
        }
    };

    const stopRecording = async () => {
        if (!recording || !isRecording) return;

        try {
            setIsRecording(false);
            clearInterval(recordingTimer.current);

            const uri = recording.getURI();
            await recording.stopAndUnloadAsync();

            const response = await fetch(uri);
            const blob = await response.blob();
            blob.duration = recordingDuration;

            await sendVoiceMessage(currentUserId, friend.id, blob);

            setRecording(null);
            setRecordingDuration(0);

        } catch (err) {
            console.error('Ses kaydı durdurulamadı:', err);
            Alert.alert('Hata', 'Ses kaydı gönderilemedi');
            setRecording(null);
            setIsRecording(false);
            setRecordingDuration(0);
            clearInterval(recordingTimer.current);
        }
    };

    const playVoiceMessage = async (audioUrl, messageId) => {
        try {
            if (playingAudio === messageId && sound) {
                await sound.unloadAsync();
                setSound(null);
                setPlayingAudio(null);
                return;
            }

            if (sound) {
                await sound.unloadAsync();
                setSound(null);
            }

            await Audio.setAudioModeAsync({
                playsInSilentModeIOS: true,
                allowsRecordingIOS: false,
                staysActiveInBackground: true,
                shouldDuckAndroid: false,
            });

            // Platform'a göre dosya uzantısını belirle
            const extension = Platform.OS === 'ios' ? '.m4a' : '.aac';
            const localUri = `${FileSystem.cacheDirectory}voice_${messageId}${extension}`;

            const { uri } = await FileSystem.downloadAsync(audioUrl, localUri);

            const newSound = new Audio.Sound();

            await newSound.loadAsync(
                { uri },
                {
                    shouldPlay: true,
                    volume: 1.0,
                    rate: 1.0,
                }
            );

            newSound.setOnPlaybackStatusUpdate((status) => {
                if (status.didJustFinish) {
                    setPlayingAudio(null);
                    setSound(null);
                }
            });

            setSound(newSound);
            setPlayingAudio(messageId);

        } catch (err) {
            console.error('Ses oynatılamadı:', err);
            Alert.alert('Hata', 'Ses mesajı oynatılamadı');
            setSound(null);
            setPlayingAudio(null);
        }
    };

    const renderMessage = ({ item }) => {
        const isMine = item.senderId === currentUserId;

        const renderMessageContent = () => {
            if (item.audioUrl) {
                return (
                    <TouchableOpacity
                        style={styles.voiceMessageContainer}
                        onPress={() => playVoiceMessage(item.audioUrl, item.id)}
                    >
                        <View style={[
                            styles.voiceIconContainer,
                            { backgroundColor: isMine ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)' }
                        ]}>
                            <Ionicons
                                name={playingAudio === item.id ? "pause" : "play"}
                                size={20}
                                color={isMine ? "#FFF" : "#666"}
                            />
                        </View>
                        <View style={styles.voiceContentContainer}>
                            <View style={styles.voiceWaveform}>
                                {[...Array(15)].map((_, i) => (
                                    <View
                                        key={i}
                                        style={[
                                            styles.waveformBar,
                                            isMine ? styles.myWaveformBar : styles.theirWaveformBar,
                                            { height: Math.random() * 15 + 5 }
                                        ]}
                                    />
                                ))}
                            </View>
                            <Text style={[
                                styles.voiceDuration,
                                isMine ? styles.myVoiceDuration : styles.theirVoiceDuration
                            ]}>
                                {Math.floor(item.duration)}s
                            </Text>
                        </View>
                    </TouchableOpacity>
                );
            }

            if (item.mediaUrl) {
                switch (item.mediaType) {
                    case 'image':
                        return (
                            <TouchableOpacity
                                onPress={() => navigation.navigate('ImageViewer', { url: item.mediaUrl })}
                            >
                                <Image
                                    source={{ uri: item.mediaUrl }}
                                    style={styles.mediaImage}
                                    resizeMode="cover"
                                />
                            </TouchableOpacity>
                        );
                    case 'document':
                        return (
                            <TouchableOpacity
                                style={styles.documentContainer}
                                onPress={() => Linking.openURL(item.mediaUrl)}
                            >
                                <Ionicons name="document-outline" size={24} color={isMine ? "#FFF" : "#666"} />
                                <Text style={[styles.documentText, isMine ? styles.myMessageText : styles.theirMessageText]}>
                                    Döküman
                                </Text>
                            </TouchableOpacity>
                        );
                    default:
                        return null;
                }
            }

            return (
                <Text style={[
                    styles.messageText,
                    isMine ? styles.myMessageText : styles.theirMessageText
                ]}>
                    {item.message}
                </Text>
            );
        };

        const renderReadStatus = () => {
            if (!isMine) return null;

            return (
                <View style={styles.readStatusContainer}>
                    <View style={styles.readStatusWrapper}>
                        {item.read ? (
                            <Ionicons
                                name="checkmark-done-outline"
                                size={16}
                                color="rgba(255,255,255,0.9)"
                            />
                        ) : (
                            <Ionicons
                                name="checkmark-outline"
                                size={16}
                                color="rgba(255,255,255,0.7)"
                            />
                        )}
                    </View>
                    <Text style={[styles.timeText, styles.myTimeText]}>
                        {item.timestamp.toDate().toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit'
                        })}
                    </Text>
                </View>
            );
        };

        return (
            <View style={[
                styles.messageContainer,
                isMine ? styles.myMessage : styles.theirMessage
            ]}>
                <View style={[
                    styles.messageBubble,
                    isMine ? styles.myMessageBubble : styles.theirMessageBubble
                ]}>
                    {renderMessageContent()}
                    {isMine ? (
                        renderReadStatus()
                    ) : (
                        <Text style={[styles.timeText, styles.theirTimeText]}>
                            {item.timestamp.toDate().toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit'
                            })}
                        </Text>
                    )}
                </View>
            </View>
        );
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

                    <TouchableOpacity
                        style={styles.userInfo}
                        onPress={() => setFriendProfileVisible(true)}
                    >
                        <Image
                            source={
                                friend.profilePicture
                                    ? { uri: friend.profilePicture }
                                    : { uri: `https://ui-avatars.com/api/?name=${encodeURIComponent(friend.name)}&background=random` }
                            }
                            style={styles.profileImage}
                        />
                        <View style={styles.userTextInfo}>
                            <Text style={styles.userName} numberOfLines={1}>
                                {friend.informations?.name || friend.name || 'İsimsiz'}
                            </Text>
                            {renderUserStatus()}
                        </View>
                    </TouchableOpacity>

                    <View style={styles.headerActions}>
                        <TouchableOpacity
                            style={styles.headerButton}
                            onPress={() => {/* Video call */ }}
                        >
                            <Ionicons name="videocam" size={24} color="#2196F3" />
                        </TouchableOpacity>
                    </View>
                </View>
            </BlurView>
        </View>
    );

    const renderInputBar = () => (
        <BlurView intensity={100} style={styles.inputBarContainer}>
            <View style={styles.inputBar}>
                <TouchableOpacity
                    style={styles.attachButton}
                    onPress={handleMediaPicker}
                >
                    <Ionicons name="add-circle-outline" size={24} color="#666" />
                </TouchableOpacity>

                <View style={styles.inputWrapper}>
                    <TextInput
                        style={styles.input}
                        value={messageText}
                        onChangeText={setMessageText}
                        placeholder={isRecording ? `Kaydediliyor... ${recordingDuration}s` : "Mesaj yaz..."}
                        placeholderTextColor="#666"
                        multiline
                        maxHeight={100}
                        editable={!isRecording}
                    />
                </View>

                {messageText.trim() ? (
                    <TouchableOpacity
                        style={styles.sendButton}
                        onPress={handleSendMessage}
                    >
                        <Ionicons name="send" size={24} color="#2196F3" />
                    </TouchableOpacity>
                ) : (
                    <TouchableOpacity
                        style={[styles.voiceButton, isRecording && styles.recordingButton]}
                        onLongPress={startRecording}
                        onPressOut={stopRecording}
                        delayLongPress={200}
                    >
                        <Ionicons
                            name={isRecording ? "radio-button-on" : "mic-outline"}
                            size={24}
                            color={isRecording ? "#FF3B30" : "#666"}
                        />
                    </TouchableOpacity>
                )}
            </View>
        </BlurView>
    );

    const formatLastSeen = (timestamp) => {
        if (!timestamp) return '';
        const date = timestamp.toDate();
        const now = new Date();
        const diff = now - date;

        if (diff < 60000) return 'Az önce';
        if (diff < 3600000) return `${Math.floor(diff / 60000)} dakika önce`;
        if (diff < 86400000) return `${Math.floor(diff / 3600000)} saat önce`;
        return date.toLocaleDateString();
    };

    const renderUserStatus = () => {
        return (
            <View style={styles.statusContainer}>
                {isOnline && (
                    <View style={styles.onlineDot} />
                )}
                <Text style={styles.userStatus}>
                    {isOnline ? 'Çevrimiçi' : lastSeen ? `Son görülme: ${formatLastSeen(lastSeen)}` : ''}
                </Text>
            </View>
        );
    };

    const renderEmptyMessage = () => {
        if (isLoading) return null;

        return (
            <View style={styles.emptyContainer}>
                <Ionicons name="lock-closed" size={24} color="#666" style={styles.lockIcon} />
                <Text style={styles.emptyTitle}>
                    Uçtan uca şifrelenmiş
                </Text>
                <Text style={styles.emptyText}>
                    Mesajlarınız ve aramalarınız uçtan uca şifrelenmiştir. Üçüncü şahıslar, hatta STeaPP bile bunları okuyamaz veya dinleyemez.
                </Text>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFF" />
            {renderHeader()}
            <View style={styles.content}>
                <FlatList
                    ref={flatListRef}
                    data={messages}
                    renderItem={renderMessage}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.messagesList}
                    inverted={true}
                    ListEmptyComponent={renderEmptyMessage}
                    showsVerticalScrollIndicator={false}
                    onContentSizeChange={() => {
                        if (initialLoad || newMessageReceived) {
                            flatListRef.current?.scrollToOffset({ offset: 0, animated: false });
                        }
                    }}
                    onLayout={() => {
                        if (initialLoad) {
                            flatListRef.current?.scrollToOffset({ offset: 0, animated: false });
                        }
                    }}
                />
            </View>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
            >
                {renderInputBar()}
            </KeyboardAvoidingView>
            <FriendProfileModal
                visible={friendProfileVisible}
                onClose={() => setFriendProfileVisible(false)}
                friend={friend}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F9FB',
    },
    headerContainer: {
        backgroundColor: '#FFF',
        zIndex: 1000,
        height: Platform.OS === 'ios' ? 100 : 70,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 3,
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
    },
    headerBlur: {
        height: '100%',
        paddingTop: Platform.OS === 'ios' ? 44 : StatusBar.currentHeight,
    },
    header: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingBottom: 12,
    },
    backButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: -8,
    },
    userInfo: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        marginLeft: 4,
        marginRight: 8,
    },
    profileImage: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#F0F0F0',
    },
    userTextInfo: {
        flex: 1,
        marginLeft: 12,
        justifyContent: 'center',
    },
    userName: {
        fontSize: 17,
        fontWeight: '600',
        color: '#1A1A1A',
        marginBottom: 2,
    },
    headerActions: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    headerButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        flex: 1,
        backgroundColor: '#F8F9FB',
        marginTop: Platform.OS === 'ios' ? 90 : 70,
    },
    messagesList: {
        padding: 16,
        paddingBottom: Platform.OS === 'ios' ? 90 : 70,
    },
    messageContainer: {
        marginVertical: 4,
        maxWidth: width * 0.75,
    },
    messageBubble: {
        padding: 12,
        borderRadius: 18,
        maxWidth: '100%',
    },
    myMessage: {
        alignSelf: 'flex-end',
    },
    theirMessage: {
        alignSelf: 'flex-start',
    },
    myMessageBubble: {
        backgroundColor: '#0084FF',
        borderBottomRightRadius: 4,
    },
    theirMessageBubble: {
        backgroundColor: '#E4E6EB',
        borderBottomLeftRadius: 4,
    },
    messageText: {
        fontSize: 16,
        lineHeight: 22,
    },
    myMessageText: {
        color: '#FFFFFF',
    },
    theirMessageText: {
        color: '#1A1A1A',
    },
    timeText: {
        fontSize: 11,
        marginTop: 4,
    },
    myTimeText: {
        color: 'rgba(255,255,255,0.7)',
    },
    theirTimeText: {
        color: '#65676B',
    },
    inputBarContainer: {
        borderTopWidth: 1,
        borderTopColor: 'rgba(0,0,0,0.05)',
        backgroundColor: '#FFF',
        height: Platform.OS === 'ios' ? 90 : 70,
    },
    inputBar: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        paddingBottom: Platform.OS === 'ios' ? 32 : 12,
        backgroundColor: '#FFF',
        height: '100%',
    },
    attachButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    inputWrapper: {
        flex: 1,
        backgroundColor: '#F0F2F5',
        borderRadius: 24,
        marginHorizontal: 8,
        paddingHorizontal: 16,
        paddingVertical: Platform.OS === 'ios' ? 10 : 6,
        maxHeight: 100,
        justifyContent: 'center',
    },
    input: {
        fontSize: 16,
        maxHeight: 100,
        color: '#1A1A1A',
    },
    sendButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    voiceButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    recordingButton: {
        backgroundColor: 'rgba(255,59,48,0.1)',
    },
    readStatusContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
        marginTop: 4,
        gap: 4,
    },
    readStatusWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 2,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 32,
    },
    lockIcon: {
        marginBottom: 16,
        opacity: 0.7,
    },
    emptyTitle: {
        fontSize: 17,
        fontWeight: '600',
        color: '#1A1A1A',
        marginBottom: 8,
        marginTop: 16,
    },
    emptyText: {
        fontSize: 15,
        color: '#65676B',
        textAlign: 'center',
        lineHeight: 22,
    },
    statusContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    onlineDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#4CAF50',
        marginRight: 4,
    },
    userStatus: {
        fontSize: 13,
        color: '#65676B',
    },
    mediaImage: {
        width: 200,
        height: 200,
        borderRadius: 16,
        marginBottom: 4,
    },
    documentContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        padding: 12,
        backgroundColor: 'rgba(0,0,0,0.05)',
        borderRadius: 12,
    },
    documentText: {
        fontSize: 14,
    },
    voiceMessageContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 8,
        minWidth: 160,
        maxWidth: 250,
    },
    voiceIconContainer: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 8,
    },
    voiceContentContainer: {
        flex: 1,
    },
    voiceWaveform: {
        flexDirection: 'row',
        alignItems: 'center',
        height: 24,
        gap: 2,
    },
    waveformBar: {
        width: 2.5,
        borderRadius: 1.25,
    },
    myWaveformBar: {
        backgroundColor: 'rgba(255,255,255,0.7)',
    },
    theirWaveformBar: {
        backgroundColor: 'rgba(0,0,0,0.2)',
    },
    voiceDuration: {
        fontSize: 12,
        marginTop: 4,
    },
    myVoiceDuration: {
        color: 'rgba(255,255,255,0.9)',
    },
    theirVoiceDuration: {
        color: 'rgba(0,0,0,0.5)',
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#F0F0F0',
    },
    statusText: {
        fontSize: 12,
        color: '#7F8C8D',
    },
});

export default ChatScreen; 