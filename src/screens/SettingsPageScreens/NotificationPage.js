import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useSelector } from 'react-redux';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { lightTheme, darkTheme } from '../../themes';
import { useNotifications } from '../../Notifications/useNotifications';
import * as Notifications from 'expo-notifications';

const NotificationsPage = ({ navigation }) => {
    const theme = useSelector((state) => state.theme.theme);
    const currentTheme = theme === 'dark' ? darkTheme : lightTheme;

    const {
        settings,
        loading,
        error,
        toggleNotificationSetting,
        loadNotificationSettings
    } = useNotifications();

    useEffect(() => {
        loadNotificationSettings();
    }, []);

    const sendTestNotification = async () => {
        try {
            const { status } = await Notifications.getPermissionsAsync();

            if (status !== 'granted') {
                Alert.alert(
                    "İzin Gerekli",
                    "Bildirim göndermek için izin gerekiyor.",
                    [{ text: "Tamam", style: "default" }]
                );
                return;
            }

            if (settings.allNotifications) {
                await Notifications.scheduleNotificationAsync({
                    content: {
                        title: "Test Bildirimi",
                        body: "Bildirimler başarıyla çalışıyor! 🎉",
                        sound: true,
                        priority: 'high',
                        vibrate: true,
                    },
                    trigger: null,
                });

                Alert.alert(
                    "Başarılı",
                    "Test bildirimi gönderildi!",
                    [{ text: "Tamam", style: "default" }]
                );
            } else {
                Alert.alert(
                    "Bildirim Hatası",
                    "Bildirimleri test etmek için önce 'Tüm Bildirimler' ayarını açın.",
                    [{ text: "Tamam", style: "default" }]
                );
            }
        } catch (error) {
            console.error('Test bildirimi gönderme hatası:', error);
            Alert.alert(
                "Hata",
                "Bildirim gönderilirken bir hata oluştu: " + error.message,
                [{ text: "Tamam", style: "default" }]
            );
        }
    };

    if (loading) {
        return (
            <View style={[styles.container, { backgroundColor: currentTheme.background }]}>
                <ActivityIndicator size="large" color="#4CAF50" />
            </View>
        );
    }

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
                    Bildirimler
                </Text>
            </View>

            <View style={styles.section}>
                <View style={styles.settingItem}>
                    <Text style={[styles.settingTitle, { color: currentTheme.text }]}>
                        Tüm Bildirimler
                    </Text>
                    <Switch
                        value={settings.allNotifications}
                        onValueChange={(value) => toggleNotificationSetting('allNotifications', value)}
                        trackColor={{ false: "#767577", true: "#4CAF50" }}
                    />
                </View>

                <View style={styles.settingItem}>
                    <Text style={[styles.settingTitle, { color: currentTheme.text }]}>
                        Yeni Arkadaş İstekleri
                    </Text>
                    <Switch
                        value={settings.newFriends}
                        onValueChange={(value) => toggleNotificationSetting('newFriends', value)}
                        trackColor={{ false: "#767577", true: "#4CAF50" }}
                        disabled={!settings.allNotifications}
                    />
                </View>

                <View style={styles.settingItem}>
                    <Text style={[styles.settingTitle, { color: currentTheme.text }]}>
                        Mesajlar
                    </Text>
                    <Switch
                        value={settings.messages}
                        onValueChange={(value) => toggleNotificationSetting('messages', value)}
                        trackColor={{ false: "#767577", true: "#4CAF50" }}
                        disabled={!settings.allNotifications}
                    />
                </View>

                <View style={styles.settingItem}>
                    <Text style={[styles.settingTitle, { color: currentTheme.text }]}>
                        Aktivite Güncellemeleri
                    </Text>
                    <Switch
                        value={settings.activityUpdates}
                        onValueChange={(value) => toggleNotificationSetting('activityUpdates', value)}
                        trackColor={{ false: "#767577", true: "#4CAF50" }}
                        disabled={!settings.allNotifications}
                    />
                </View>

                <View style={styles.settingItem}>
                    <Text style={[styles.settingTitle, { color: currentTheme.text }]}>
                        E-posta Bildirimleri
                    </Text>
                    <Switch
                        value={settings.emailNotifications}
                        onValueChange={(value) => toggleNotificationSetting('emailNotifications', value)}
                        trackColor={{ false: "#767577", true: "#4CAF50" }}
                        disabled={!settings.allNotifications}
                    />
                </View>
            </View>

            <TouchableOpacity
                style={[
                    styles.testButton,
                    { opacity: settings.allNotifications ? 1 : 0.5 }
                ]}
                onPress={sendTestNotification}
            >
                <Ionicons
                    name="notifications"
                    size={24}
                    color="#FFFFFF"
                />
                <Text style={styles.testButtonText}>
                    Test Bildirimi Gönder
                </Text>
            </TouchableOpacity>

            {error && (
                <Text style={styles.errorText}>
                    {error}
                </Text>
            )}

            <Text style={[styles.note, { color: currentTheme.text }]}>
                Not: Bildirimleri kapatmak bazı önemli güncellemeleri kaçırmanıza neden olabilir.
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
    settingItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.1)',
    },
    settingTitle: {
        fontSize: 16,
        flex: 1,
    },
    note: {
        fontSize: 14,
        fontStyle: 'italic',
        marginTop: 20,
        opacity: 0.7,
    },
    errorText: {
        color: 'red',
        fontSize: 14,
        marginTop: 20,
        textAlign: 'center',
    },
    testButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#4CAF50',
        padding: 15,
        borderRadius: 10,
        marginHorizontal: 20,
        marginTop: 20,
    },
    testButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 10,
    },
});

export default NotificationsPage;
