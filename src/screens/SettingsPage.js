import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, Pressable, TouchableOpacity, Alert } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { RblSection } from '../components/';
import { logout } from '../redux/userSlice';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { RadioButton } from 'react-native-paper';
import { setTheme } from '../redux/themeSlice';
import { lightTheme, darkTheme } from '../themes';

const SettingsPage = ({ navigation }) => {
    const dispatch = useDispatch();
    const theme = useSelector((state) => state.theme.theme);
    const [searchQuery, setSearchQuery] = useState('');

    const sections = [
        {
            title: "Bildirimler",
            iconName: "notifications-outline",
            screen: "Bildirimler",
            iconColor: '#FF6347'
        },
        {
            title: "İzinler",
            iconName: "key-outline",
            screen: "Izinler",
            iconColor: '#4682B4'
        },
        {
            title: "Gizlilik",
            iconName: "lock-closed-outline",
            screen: "Gizlilik",
            iconColor: '#32CD32'
        },
        {
            title: "Yardım ve Destek",
            iconName: "help-circle-outline",
            screen: "YardimDestek",
            iconColor: '#FFD700'
        },
        {
            title: "Hakkında",
            iconName: "information-circle-outline",
            screen: "Hakkinda",
            iconColor: '#1E90FF'
        },
        {
            title: "Arkadaşlarınızı davet edin",
            iconName: "people-outline",
            screen: "Arkadaşlarımı Davet Et",
            iconColor: '#FF69B4'
        },
    ];

    const filteredSections = sections.filter(section =>
        section.title.toLowerCase().trim().includes(searchQuery.toLowerCase().trim())
    );


    const currentTheme = theme === 'dark' ? darkTheme : lightTheme;

    const handleLogout = () => {
        Alert.alert(
            "Çıkış Yap",
            "Çıkış yapmak istediğinize emin misiniz?",
            [
                { text: "Hayır", onPress: () => { } },
                {
                    text: "Evet", onPress: () => {
                        dispatch(logout());
                        navigation.reset({
                            index: 0,
                            routes: [{ name: "Giriş Yap" }],
                        });
                    }
                }
            ],
            { cancelable: false }
        );
    };

    const handleThemeChange = (selectedTheme) => {
        dispatch(setTheme(selectedTheme));
    };

    const handleNavigation = (screen) => {
        navigation.navigate(screen);
    };

    return (
        <ScrollView
            style={[styles.container, { backgroundColor: currentTheme.background }]}
            contentContainerStyle={{ paddingBottom: 80 }}
        >
            {/* Header Bölümü */}
            <View style={[styles.header, { backgroundColor: currentTheme.background }]}>
                <Text style={[styles.headerTitle, { color: currentTheme.text }]}>Ayarlar</Text>

                {/* Arama Çubuğu */}
                <View style={[styles.searchContainer, { backgroundColor: currentTheme.cardBackground }]}>
                    <Ionicons name="search" size={20} color={currentTheme.text} style={styles.searchIcon} />
                    <TextInput
                        style={[styles.searchInput, { color: currentTheme.text }]}
                        placeholder="Ayarlarda ara..."
                        placeholderTextColor={currentTheme.textSecondary}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                </View>
            </View>

            <View style={styles.content}>
                {/* Tema Seçimi Kartı */}
                <View style={[styles.settingsCard, { backgroundColor: currentTheme.cardBackground }]}>
                    <Text style={[styles.cardTitle, { color: currentTheme.text }]}>Tema</Text>
                    <View style={styles.themeOptions}>
                        <TouchableOpacity
                            style={[
                                styles.themeOption,
                                theme === 'light' && styles.selectedThemeOption
                            ]}
                            onPress={() => handleThemeChange('light')}
                        >
                            <Ionicons name="sunny" size={24} color={theme === 'light' ? '#fff' : '#FDB813'} />
                            <Text style={[
                                styles.themeText,
                                theme === 'light' && styles.selectedThemeText
                            ]}>Açık</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[
                                styles.themeOption,
                                theme === 'dark' && styles.selectedThemeOption
                            ]}
                            onPress={() => handleThemeChange('dark')}
                        >
                            <Ionicons name="moon" size={24} color={theme === 'dark' ? '#fff' : '#1A237E'} />
                            <Text style={[
                                styles.themeText,
                                theme === 'dark' && styles.selectedThemeText
                            ]}>Koyu</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[
                                styles.themeOption,
                                theme === 'system' && styles.selectedThemeOption
                            ]}
                            onPress={() => handleThemeChange('system')}
                        >
                            <Ionicons name="settings" size={24} color={theme === 'system' ? '#fff' : '#757575'} />
                            <Text style={[
                                styles.themeText,
                                theme === 'system' && styles.selectedThemeText
                            ]}>Sistem</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Ayarlar Kartları */}
                {filteredSections.length > 0 ? (
                    filteredSections.map((section, index) => (
                        <TouchableOpacity
                            key={index}
                            style={[styles.settingsCard, { backgroundColor: currentTheme.cardBackground }]}
                            onPress={() => handleNavigation(section.screen)}
                        >
                            <View style={styles.settingRow}>
                                <View style={[styles.iconContainer, { backgroundColor: section.iconColor + '20' }]}>
                                    <Ionicons name={section.iconName} size={24} color={section.iconColor} />
                                </View>
                                <View style={styles.settingInfo}>
                                    <Text style={[styles.settingTitle, { color: currentTheme.text }]}>
                                        {section.title}
                                    </Text>
                                </View>
                                <Ionicons name="chevron-forward" size={24} color={currentTheme.text} />
                            </View>
                        </TouchableOpacity>
                    ))
                ) : (
                    <View style={[styles.settingsCard, { backgroundColor: currentTheme.cardBackground }]}>
                        <Text style={[styles.noResults, { color: currentTheme.textSecondary }]}>
                            Sonuç bulunamadı
                        </Text>
                    </View>
                )}

                {/* Çıkış Yap Butonu */}
                <TouchableOpacity
                    style={styles.logoutButton}
                    onPress={handleLogout}
                >
                    <Ionicons name="log-out-outline" size={24} color="#fff" />
                    <Text style={styles.logoutText}>Çıkış Yap</Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
};

export default SettingsPage;

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        padding: 20,
        paddingTop: 60,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 5,
    },
    headerTitle: {
        fontSize: 34,
        fontWeight: 'bold',
        marginBottom: 20,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F5F6FA',
        borderRadius: 15,
        padding: 10,
        marginBottom: 10,
    },
    searchIcon: {
        marginRight: 10,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
    },
    content: {
        padding: 20,
    },
    settingsCard: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 20,
        marginBottom: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 15,
    },
    themeOptions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    themeOption: {
        flex: 1,
        alignItems: 'center',
        padding: 15,
        borderRadius: 15,
        marginHorizontal: 5,
        backgroundColor: '#F5F6FA',
    },
    selectedThemeOption: {
        backgroundColor: '#4CAF50',
    },
    themeText: {
        marginTop: 8,
        fontSize: 14,
        color: '#666',
    },
    selectedThemeText: {
        color: '#fff',
    },
    settingRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconContainer: {
        width: 50,
        height: 50,
        borderRadius: 15,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    settingInfo: {
        flex: 1,
    },
    settingTitle: {
        fontSize: 16,
        fontWeight: '500',
    },
    noResults: {
        textAlign: 'center',
        fontSize: 16,
    },
    logoutButton: {
        backgroundColor: '#FF5252',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 15,
        borderRadius: 20,
        marginTop: 20,
        shadowColor: '#FF5252',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    logoutText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 10,
    },
});
