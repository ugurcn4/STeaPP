import React, { useState } from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity } from 'react-native';
import { useSelector } from 'react-redux';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { lightTheme, darkTheme } from '../../themes';

const NotificationsPage = ({ navigation }) => {
    const theme = useSelector((state) => state.theme.theme);
    const currentTheme = theme === 'dark' ? darkTheme : lightTheme;

    const [notifications, setNotifications] = useState({
        allNotifications: true,
        newFriends: true,
        messages: true,
        activityUpdates: true,
        emailNotifications: false,
    });

    const toggleSwitch = (key) => {
        setNotifications(prev => ({
            ...prev,
            [key]: !prev[key]
        }));
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
                    Bildirimler
                </Text>
            </View>

            <View style={styles.section}>
                <View style={styles.settingItem}>
                    <Text style={[styles.settingTitle, { color: currentTheme.text }]}>
                        Tüm Bildirimler
                    </Text>
                    <Switch
                        value={notifications.allNotifications}
                        onValueChange={() => toggleSwitch('allNotifications')}
                        trackColor={{ false: "#767577", true: "#4CAF50" }}
                    />
                </View>

                <View style={styles.settingItem}>
                    <Text style={[styles.settingTitle, { color: currentTheme.text }]}>
                        Yeni Arkadaş İstekleri
                    </Text>
                    <Switch
                        value={notifications.newFriends}
                        onValueChange={() => toggleSwitch('newFriends')}
                        trackColor={{ false: "#767577", true: "#4CAF50" }}
                    />
                </View>

                <View style={styles.settingItem}>
                    <Text style={[styles.settingTitle, { color: currentTheme.text }]}>
                        Mesajlar
                    </Text>
                    <Switch
                        value={notifications.messages}
                        onValueChange={() => toggleSwitch('messages')}
                        trackColor={{ false: "#767577", true: "#4CAF50" }}
                    />
                </View>

                <View style={styles.settingItem}>
                    <Text style={[styles.settingTitle, { color: currentTheme.text }]}>
                        Aktivite Güncellemeleri
                    </Text>
                    <Switch
                        value={notifications.activityUpdates}
                        onValueChange={() => toggleSwitch('activityUpdates')}
                        trackColor={{ false: "#767577", true: "#4CAF50" }}
                    />
                </View>

                <View style={styles.settingItem}>
                    <Text style={[styles.settingTitle, { color: currentTheme.text }]}>
                        E-posta Bildirimleri
                    </Text>
                    <Switch
                        value={notifications.emailNotifications}
                        onValueChange={() => toggleSwitch('emailNotifications')}
                        trackColor={{ false: "#767577", true: "#4CAF50" }}
                    />
                </View>
            </View>

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
});

export default NotificationsPage;
