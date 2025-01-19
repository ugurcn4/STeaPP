import React, { useState } from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity, ScrollView } from 'react-native';
import { useSelector } from 'react-redux';
import { lightTheme, darkTheme } from '../../themes';
import Ionicons from 'react-native-vector-icons/Ionicons';

const PrivacyPage = ({ navigation }) => {
    const theme = useSelector((state) => state.theme.theme);
    const currentTheme = theme === 'dark' ? darkTheme : lightTheme;

    const [privacySettings, setPrivacySettings] = useState({
        profileVisibility: true,
        locationSharing: false,
        activityStatus: true,
        friendsList: true,
        searchable: true,
        dataCollection: true,
    });

    const toggleSetting = (key) => {
        setPrivacySettings(prev => ({
            ...prev,
            [key]: !prev[key]
        }));
    };

    return (
        <ScrollView style={[styles.container, { backgroundColor: currentTheme.background }]}>
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
                    Gizlilik
                </Text>
            </View>

            <View style={styles.section}>
                <View style={styles.privacyItem}>
                    <View style={styles.settingInfo}>
                        <Ionicons name="person-outline" size={24} color={currentTheme.text} />
                        <View style={styles.textContainer}>
                            <Text style={[styles.settingTitle, { color: currentTheme.text }]}>
                                Profil Görünürlüğü
                            </Text>
                            <Text style={styles.settingDescription}>
                                Profilinizi kimler görebilir
                            </Text>
                        </View>
                    </View>
                    <Switch
                        value={privacySettings.profileVisibility}
                        onValueChange={() => toggleSetting('profileVisibility')}
                        trackColor={{ false: "#767577", true: "#32CD32" }}
                    />
                </View>

                <View style={styles.privacyItem}>
                    <View style={styles.settingInfo}>
                        <Ionicons name="location-outline" size={24} color={currentTheme.text} />
                        <View style={styles.textContainer}>
                            <Text style={[styles.settingTitle, { color: currentTheme.text }]}>
                                Konum Paylaşımı
                            </Text>
                            <Text style={styles.settingDescription}>
                                Konumunuzu arkadaşlarınızla paylaşın
                            </Text>
                        </View>
                    </View>
                    <Switch
                        value={privacySettings.locationSharing}
                        onValueChange={() => toggleSetting('locationSharing')}
                        trackColor={{ false: "#767577", true: "#32CD32" }}
                    />
                </View>

                <View style={styles.privacyItem}>
                    <View style={styles.settingInfo}>
                        <Ionicons name="radio-button-on-outline" size={24} color={currentTheme.text} />
                        <View style={styles.textContainer}>
                            <Text style={[styles.settingTitle, { color: currentTheme.text }]}>
                                Çevrimiçi Durumu
                            </Text>
                            <Text style={styles.settingDescription}>
                                Çevrimiçi olduğunuzu göster
                            </Text>
                        </View>
                    </View>
                    <Switch
                        value={privacySettings.activityStatus}
                        onValueChange={() => toggleSetting('activityStatus')}
                        trackColor={{ false: "#767577", true: "#32CD32" }}
                    />
                </View>

                <View style={styles.privacyItem}>
                    <View style={styles.settingInfo}>
                        <Ionicons name="people-outline" size={24} color={currentTheme.text} />
                        <View style={styles.textContainer}>
                            <Text style={[styles.settingTitle, { color: currentTheme.text }]}>
                                Arkadaş Listesi
                            </Text>
                            <Text style={styles.settingDescription}>
                                Arkadaş listenizi kimler görebilir
                            </Text>
                        </View>
                    </View>
                    <Switch
                        value={privacySettings.friendsList}
                        onValueChange={() => toggleSetting('friendsList')}
                        trackColor={{ false: "#767577", true: "#32CD32" }}
                    />
                </View>

                <View style={styles.privacyItem}>
                    <View style={styles.settingInfo}>
                        <Ionicons name="search-outline" size={24} color={currentTheme.text} />
                        <View style={styles.textContainer}>
                            <Text style={[styles.settingTitle, { color: currentTheme.text }]}>
                                Arama Görünürlüğü
                            </Text>
                            <Text style={styles.settingDescription}>
                                Aramada görünür ol
                            </Text>
                        </View>
                    </View>
                    <Switch
                        value={privacySettings.searchable}
                        onValueChange={() => toggleSetting('searchable')}
                        trackColor={{ false: "#767577", true: "#32CD32" }}
                    />
                </View>

                <View style={styles.privacyItem}>
                    <View style={styles.settingInfo}>
                        <Ionicons name="analytics-outline" size={24} color={currentTheme.text} />
                        <View style={styles.textContainer}>
                            <Text style={[styles.settingTitle, { color: currentTheme.text }]}>
                                Veri Toplama
                            </Text>
                            <Text style={styles.settingDescription}>
                                Deneyimi iyileştirmek için veri topla
                            </Text>
                        </View>
                    </View>
                    <Switch
                        value={privacySettings.dataCollection}
                        onValueChange={() => toggleSetting('dataCollection')}
                        trackColor={{ false: "#767577", true: "#32CD32" }}
                    />
                </View>
            </View>

            <Text style={[styles.note, { color: currentTheme.text }]}>
                Not: Gizlilik ayarlarınızı istediğiniz zaman değiştirebilirsiniz. Bu ayarlar hesabınızın güvenliğini ve gizliliğini etkiler.
            </Text>
        </ScrollView>
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
    privacyItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.1)',
    },
    settingInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    textContainer: {
        marginLeft: 15,
        flex: 1,
    },
    settingTitle: {
        fontSize: 16,
        fontWeight: '500',
    },
    settingDescription: {
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
        marginBottom: 30,
    },
});

export default PrivacyPage; 