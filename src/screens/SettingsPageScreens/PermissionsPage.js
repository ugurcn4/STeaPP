import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Switch,
    TouchableOpacity,
    Platform,
    Alert,
    Linking
} from 'react-native';
import { useSelector } from 'react-redux';
import { lightTheme, darkTheme } from '../../themes';
import Ionicons from 'react-native-vector-icons/Ionicons';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import * as ImagePicker from 'expo-image-picker';
import * as IntentLauncher from 'expo-intent-launcher';
import { Audio } from 'expo-av';
import { ApplicationId } from '../../constants';

const PermissionsPage = ({ navigation }) => {
    const theme = useSelector((state) => state.theme.theme);
    const currentTheme = theme === 'dark' ? darkTheme : lightTheme;
    const [permissions, setPermissions] = useState({
        location: false,
        camera: false,
        notifications: false,
        photos: false,
        microphone: false,
    });

    useEffect(() => {
        checkPermissions();
    }, []);

    const checkPermissions = async () => {
        try {
            const [
                locationStatus,
                cameraStatus,
                notificationStatus,
                mediaStatus,
                microphoneStatus
            ] = await Promise.all([
                Location.getForegroundPermissionsAsync(),
                ImagePicker.getCameraPermissionsAsync(),
                Notifications.getPermissionsAsync(),
                ImagePicker.getMediaLibraryPermissionsAsync(),
                Audio.getPermissionsAsync()
            ]);

            setPermissions({
                location: locationStatus.status === 'granted',
                camera: cameraStatus.status === 'granted',
                notifications: notificationStatus.status === 'granted',
                photos: mediaStatus.status === 'granted',
                microphone: microphoneStatus.status === 'granted',
            });
        } catch (error) {
            console.error('İzin kontrolü hatası:', error);
        }
    };

    const handlePermissionChange = async (type) => {
        try {
            if (permissions[type]) {
                Alert.alert(
                    "İzni Kapat",
                    `${getPermissionName(type)} iznini kapatmak için cihaz ayarlarına gitmeniz gerekiyor. Ayarları açmak ister misiniz?`,
                    [
                        {
                            text: "İptal",
                            style: "cancel"
                        },
                        {
                            text: "Ayarları Aç",
                            onPress: () => openSettings()
                        }
                    ]
                );
                return;
            }

            let status;
            switch (type) {
                case 'location':
                    status = await Location.requestForegroundPermissionsAsync();
                    break;
                case 'camera':
                    status = await ImagePicker.requestCameraPermissionsAsync();
                    break;
                case 'notifications':
                    status = await Notifications.requestPermissionsAsync();
                    break;
                case 'photos':
                    status = await ImagePicker.requestMediaLibraryPermissionsAsync();
                    break;
                case 'microphone':
                    status = await Audio.requestPermissionsAsync();
                    break;
            }

            if (status.status !== 'granted') {
                showPermissionAlert(getPermissionName(type));
            }

            checkPermissions();
        } catch (error) {
            console.error('İzin değiştirme hatası:', error);
        }
    };

    const getPermissionName = (type) => {
        const names = {
            location: 'konum',
            camera: 'kamera',
            notifications: 'bildirim',
            photos: 'galeri',
            microphone: 'mikrofon'
        };
        const name = names[type];
        return name.charAt(0).toUpperCase() + name.slice(1);
    };

    const openSettings = async () => {
        try {
            if (Platform.OS === 'ios') {
                await Linking.openSettings();
            } else {
                const packageName = 'com.yourdomain.yourappname'; // Android uygulama ID'nizi buraya yazın
                await IntentLauncher.startActivityAsync(
                    IntentLauncher.ActivityAction.APPLICATION_DETAILS_SETTINGS,
                    { data: 'package:' + packageName }
                );
            }
        } catch (error) {
            console.error('Ayarlar açılırken hata:', error);
            Linking.openSettings().catch(err => {
                console.error('Alternatif ayarlar açma hatası:', err);
                Alert.alert(
                    "Hata",
                    "Ayarlar açılamadı. Lütfen manuel olarak uygulama ayarlarına gidin.",
                    [{ text: "Tamam" }]
                );
            });
        }
    };

    const showPermissionAlert = (permissionType) => {
        Alert.alert(
            "İzin Gerekli",
            `${permissionType} izni için ayarları açmak ister misiniz?`,
            [
                {
                    text: "İptal",
                    style: "cancel"
                },
                {
                    text: "Ayarları Aç",
                    onPress: openSettings
                }
            ]
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: currentTheme.background }]}>
            <View style={styles.headerContainer}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <Ionicons
                        name="arrow-back"
                        size={24}
                        color={currentTheme.text}
                    />
                </TouchableOpacity>
                <Text style={[styles.header, { color: currentTheme.text }]}>
                    İzinler
                </Text>
            </View>

            <View style={styles.section}>
                <View style={styles.permissionItem}>
                    <View style={styles.permissionInfo}>
                        <Ionicons name="location-outline" size={24} color={currentTheme.text} />
                        <View style={styles.textContainer}>
                            <Text style={[styles.permissionTitle, { color: currentTheme.text }]}>
                                Konum
                            </Text>
                            <Text style={[styles.permissionDescription, { color: currentTheme.textSecondary }]}>
                                Arkadaşlarınızla konum paylaşımı için gerekli
                            </Text>
                        </View>
                    </View>
                    <Switch
                        value={permissions.location}
                        onValueChange={() => handlePermissionChange('location')}
                        trackColor={{ false: "#767577", true: "#4CAF50" }}
                        thumbColor={permissions.location ? "#fff" : "#f4f3f4"}
                    />
                </View>

                <View style={styles.permissionItem}>
                    <View style={styles.permissionInfo}>
                        <Ionicons name="camera-outline" size={24} color={currentTheme.text} />
                        <View style={styles.textContainer}>
                            <Text style={[styles.permissionTitle, { color: currentTheme.text }]}>
                                Kamera
                            </Text>
                            <Text style={[styles.permissionDescription, { color: currentTheme.textSecondary }]}>
                                Fotoğraf çekmek ve paylaşmak için gerekli
                            </Text>
                        </View>
                    </View>
                    <Switch
                        value={permissions.camera}
                        onValueChange={() => handlePermissionChange('camera')}
                        trackColor={{ false: "#767577", true: "#4CAF50" }}
                        thumbColor={permissions.camera ? "#fff" : "#f4f3f4"}
                    />
                </View>

                <View style={styles.permissionItem}>
                    <View style={styles.permissionInfo}>
                        <Ionicons name="notifications-outline" size={24} color={currentTheme.text} />
                        <View style={styles.textContainer}>
                            <Text style={[styles.permissionTitle, { color: currentTheme.text }]}>
                                Bildirimler
                            </Text>
                            <Text style={[styles.permissionDescription, { color: currentTheme.textSecondary }]}>
                                Mesaj ve etkinlik bildirimlerini almak için gerekli
                            </Text>
                        </View>
                    </View>
                    <Switch
                        value={permissions.notifications}
                        onValueChange={() => handlePermissionChange('notifications')}
                        trackColor={{ false: "#767577", true: "#4CAF50" }}
                        thumbColor={permissions.notifications ? "#fff" : "#f4f3f4"}
                    />
                </View>

                <View style={styles.permissionItem}>
                    <View style={styles.permissionInfo}>
                        <Ionicons name="images-outline" size={24} color={currentTheme.text} />
                        <View style={styles.textContainer}>
                            <Text style={[styles.permissionTitle, { color: currentTheme.text }]}>
                                Fotoğraflar
                            </Text>
                            <Text style={[styles.permissionDescription, { color: currentTheme.textSecondary }]}>
                                Galeriden fotoğraf seçmek ve paylaşmak için gerekli
                            </Text>
                        </View>
                    </View>
                    <Switch
                        value={permissions.photos}
                        onValueChange={() => handlePermissionChange('photos')}
                        trackColor={{ false: "#767577", true: "#4CAF50" }}
                        thumbColor={permissions.photos ? "#fff" : "#f4f3f4"}
                    />
                </View>

                <View style={styles.permissionItem}>
                    <View style={styles.permissionInfo}>
                        <Ionicons name="mic-outline" size={24} color={currentTheme.text} />
                        <View style={styles.textContainer}>
                            <Text style={[styles.permissionTitle, { color: currentTheme.text }]}>
                                Mikrofon
                            </Text>
                            <Text style={[styles.permissionDescription, { color: currentTheme.textSecondary }]}>
                                Sesli mesaj göndermek için gerekli
                            </Text>
                        </View>
                    </View>
                    <Switch
                        value={permissions.microphone}
                        onValueChange={() => handlePermissionChange('microphone')}
                        trackColor={{ false: "#767577", true: "#4CAF50" }}
                        thumbColor={permissions.microphone ? "#fff" : "#f4f3f4"}
                    />
                </View>
            </View>

            <Text style={[styles.note, { color: currentTheme.textSecondary }]}>
                Not: Bu izinler uygulamanın düzgün çalışması için gereklidir. İzinleri istediğiniz zaman cihaz ayarlarından değiştirebilirsiniz.
            </Text>

            <View style={styles.bottomSection}>
                <TouchableOpacity
                    style={[styles.settingsButton, { backgroundColor: currentTheme.cardBackground }]}
                    onPress={openSettings}
                >
                    <Ionicons
                        name="settings-outline"
                        size={24}
                        color={currentTheme.text}
                        style={styles.buttonIcon}
                    />
                    <Text style={[styles.buttonText, { color: currentTheme.text }]}>
                        Sistem İzinlerini Yönet
                    </Text>
                </TouchableOpacity>

                <View style={styles.infoContainer}>
                    <View style={styles.infoItem}>
                        <Ionicons
                            name="shield-checkmark-outline"
                            size={20}
                            color={currentTheme.textSecondary}
                        />
                        <Text style={[styles.infoText, { color: currentTheme.textSecondary }]}>
                            Verileriniz güvende
                        </Text>
                    </View>
                    <View style={styles.infoItem}>
                        <Ionicons
                            name="lock-closed-outline"
                            size={20}
                            color={currentTheme.textSecondary}
                        />
                        <Text style={[styles.infoText, { color: currentTheme.textSecondary }]}>
                            KVKK uyumlu
                        </Text>
                    </View>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
    },
    headerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 30,
        marginTop: 60,
    },
    backButton: {
        padding: 10,
        marginRight: 10,
    },
    header: {
        fontSize: 28,
        fontWeight: 'bold',
    },
    section: {
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 12,
        padding: 15,
        marginBottom: 20,
    },
    permissionItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.1)',
    },
    permissionInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    textContainer: {
        marginLeft: 15,
        flex: 1,
    },
    permissionTitle: {
        fontSize: 16,
        fontWeight: '500',
    },
    permissionDescription: {
        fontSize: 12,
        color: '#666',
        marginTop: 2,
    },
    note: {
        fontSize: 14,
        fontStyle: 'italic',
        opacity: 0.7,
        textAlign: 'center',
        paddingHorizontal: 20,
        marginBottom: 20,
    },
    bottomSection: {
        marginTop: 'auto',
        padding: 20,
    },
    settingsButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 15,
        borderRadius: 12,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    buttonIcon: {
        marginRight: 10,
    },
    buttonText: {
        fontSize: 16,
        fontWeight: '500',
    },
    infoContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginTop: 10,
    },
    infoItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 10,
    },
    infoText: {
        marginLeft: 6,
        fontSize: 14,
    },
});

export default PermissionsPage; 