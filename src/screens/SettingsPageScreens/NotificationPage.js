import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity, ActivityIndicator, Alert, Linking } from 'react-native';
import { useSelector } from 'react-redux';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { lightTheme, darkTheme } from '../../themes';
import { useNotifications } from '../../Notifications/useNotifications';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';

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

    if (loading) {
        return (
            <View style={[styles.container, { backgroundColor: currentTheme.background }]}>
                <ActivityIndicator size="large" color="#25D220" />
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

            {error && (
                <Text style={styles.errorText}>
                    {error}
                </Text>
            )}

            <View style={styles.infoContainer}>
                <Ionicons
                    name="notifications-outline"
                    size={48}
                    color={currentTheme.text}
                    style={styles.infoIcon}
                />
                <Text style={[styles.warningText, { color: currentTheme.text }]}>
                    Bildirimleri kapatmak bazı önemli güncellemeleri kaçırmanıza neden olabilir.
                </Text>
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
    errorText: {
        color: 'red',
        fontSize: 14,
        marginTop: 20,
        textAlign: 'center',
    },
    infoContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 30,
        paddingHorizontal: 20,
    },
    infoIcon: {
        marginBottom: 15,
        opacity: 0.8,
    },
    warningText: {
        fontSize: 14,
        textAlign: 'center',
        opacity: 0.8
    },
});

export default NotificationsPage;