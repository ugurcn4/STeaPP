import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity, Platform } from 'react-native';
import { useSelector } from 'react-redux';
import { lightTheme, darkTheme } from '../../themes';
import Ionicons from 'react-native-vector-icons/Ionicons';
import * as Location from 'expo-location';
//import * as Notifications from 'expo-notifications';
import * as ImagePicker from 'expo-image-picker';

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
        // Konum izni kontrolü
        const locationStatus = await Location.getForegroundPermissionsAsync();

        // Kamera izni kontrolü
        const cameraStatus = await ImagePicker.getCameraPermissionsAsync();

        // Bildirim izni kontrolü
        const notificationStatus = await Notifications.getPermissionsAsync();

        // Galeri izni kontrolü
        const mediaStatus = await ImagePicker.getMediaLibraryPermissionsAsync();

        setPermissions({
            location: locationStatus.status === 'granted',
            camera: cameraStatus.status === 'granted',
            notifications: notificationStatus.status === 'granted',
            photos: mediaStatus.status === 'granted',
            microphone: false, // Mikrofon izni için ayrı bir kontrol eklenebilir
        });
    };

    const requestPermission = async (type) => {
        try {
            switch (type) {
                case 'location':
                    const { status: locationStatus } = await Location.requestForegroundPermissionsAsync();
                    setPermissions(prev => ({ ...prev, location: locationStatus === 'granted' }));
                    break;

                case 'camera':
                    const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
                    setPermissions(prev => ({ ...prev, camera: cameraStatus === 'granted' }));
                    break;

                case 'notifications':
                    const { status: notificationStatus } = await Notifications.requestPermissionsAsync();
                    setPermissions(prev => ({ ...prev, notifications: notificationStatus === 'granted' }));
                    break;

                case 'photos':
                    const { status: mediaStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
                    setPermissions(prev => ({ ...prev, photos: mediaStatus === 'granted' }));
                    break;
            }
        } catch (error) {
            console.error('İzin alınırken hata:', error);
        }
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
                            <Text style={styles.permissionDescription}>
                                Yakındaki etkinlikleri görebilmek için
                            </Text>
                        </View>
                    </View>
                    <Switch
                        value={permissions.location}
                        onValueChange={() => requestPermission('location')}
                        trackColor={{ false: "#767577", true: "#4682B4" }}
                    />
                </View>

                <View style={styles.permissionItem}>
                    <View style={styles.permissionInfo}>
                        <Ionicons name="camera-outline" size={24} color={currentTheme.text} />
                        <View style={styles.textContainer}>
                            <Text style={[styles.permissionTitle, { color: currentTheme.text }]}>
                                Kamera
                            </Text>
                            <Text style={styles.permissionDescription}>
                                Fotoğraf çekmek için
                            </Text>
                        </View>
                    </View>
                    <Switch
                        value={permissions.camera}
                        onValueChange={() => requestPermission('camera')}
                        trackColor={{ false: "#767577", true: "#4682B4" }}
                    />
                </View>

                <View style={styles.permissionItem}>
                    <View style={styles.permissionInfo}>
                        <Ionicons name="notifications-outline" size={24} color={currentTheme.text} />
                        <View style={styles.textContainer}>
                            <Text style={[styles.permissionTitle, { color: currentTheme.text }]}>
                                Bildirimler
                            </Text>
                            <Text style={styles.permissionDescription}>
                                Önemli güncellemeleri almak için
                            </Text>
                        </View>
                    </View>
                    <Switch
                        value={permissions.notifications}
                        onValueChange={() => requestPermission('notifications')}
                        trackColor={{ false: "#767577", true: "#4682B4" }}
                    />
                </View>

                <View style={styles.permissionItem}>
                    <View style={styles.permissionInfo}>
                        <Ionicons name="images-outline" size={24} color={currentTheme.text} />
                        <View style={styles.textContainer}>
                            <Text style={[styles.permissionTitle, { color: currentTheme.text }]}>
                                Fotoğraflar
                            </Text>
                            <Text style={styles.permissionDescription}>
                                Galeriden fotoğraf seçmek için
                            </Text>
                        </View>
                    </View>
                    <Switch
                        value={permissions.photos}
                        onValueChange={() => requestPermission('photos')}
                        trackColor={{ false: "#767577", true: "#4682B4" }}
                    />
                </View>
            </View>

            <Text style={[styles.note, { color: currentTheme.text }]}>
                Not: Bu izinler uygulamanın düzgün çalışması için gereklidir. İzinleri istediğiniz zaman cihaz ayarlarından değiştirebilirsiniz.
            </Text>
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
        marginTop: 20,
        opacity: 0.7,
        textAlign: 'center',
        paddingHorizontal: 20,
    },
});

export default PermissionsPage; 