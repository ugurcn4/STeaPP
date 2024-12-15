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
        { title: "Bildirimler", iconName: "notifications-outline", screen: "Bildirimler" },
        { title: "İzinler", iconName: "key-outline", screen: "Profil" },
        { title: "Gizlilik", iconName: "lock-closed-outline", screen: "Profil" },
        { title: "Yardım ve Destek", iconName: "help-circle-outline", screen: "Profil" },
        { title: "Hakkinda", iconName: "information-circle-outline", screen: "Hakkinda" },
        { title: "Arkadaşlarınızı davet edin", iconName: "people-outline", screen: "Profil" },
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

    return (
        <ScrollView style={[styles.container, { backgroundColor: currentTheme.background }]}>
            <Text style={[styles.header, { color: currentTheme.text }]}>Ayarlar</Text>
            <View style={[styles.searchContainer, { backgroundColor: currentTheme.background }]}>
                <Ionicons name="search" size={20} color={currentTheme.text} style={styles.searchIcon} />
                <TextInput
                    style={[styles.searchInput, { color: currentTheme.text }]}
                    placeholder="Ara"
                    placeholderTextColor={currentTheme.text}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                />
            </View>

            {filteredSections.length > 0 ? (
                filteredSections.map((section, index) => (
                    <RblSection
                        key={index}
                        title={section.title}
                        iconName={section.iconName}
                        onPress={() => navigation.navigate(section.screen)}
                        iconColor={section.title == 'Bildirimler' ? '#FF6347'
                            : section.title == 'İzinler' ? '#4682B4'
                                : section.title == 'Gizlilik' ? '#32CD32'
                                    : section.title == 'Yardım ve Destek' ? '#FFD700'
                                        : section.title == 'Hakkinda' ? '#1E90FF'
                                            : section.title == 'Arkadaşlarınızı davet edin' ? '#FF69B4'
                                                : 'black'
                        }
                    />
                ))
            ) : (
                <Text style={[styles.noResults, { color: currentTheme.text }]}>Sonuç bulunamadı</Text>
            )}

            {/* Tema seçimi */}
            <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: currentTheme.text }]}>Tema</Text>
                <View style={styles.radioGroup}>
                    <TouchableOpacity style={styles.radioButton} onPress={() => handleThemeChange('light')}>
                        <Ionicons name="sunny" size={24} color="orange" />
                        <RadioButton
                            value="light"
                            status={theme === 'light' ? 'checked' : 'unchecked'}
                            onPress={() => handleThemeChange('light')}
                        />
                        <Text style={[styles.radioLabel, { color: currentTheme.text }]}>Açık</Text>
                    </TouchableOpacity>
                    <View style={styles.separator} />
                    <TouchableOpacity style={styles.radioButton} onPress={() => handleThemeChange('dark')}>
                        <Ionicons name="moon" size={24} color="black" />
                        <RadioButton
                            value="dark"
                            status={theme === 'dark' ? 'checked' : 'unchecked'}
                            onPress={() => handleThemeChange('dark')}
                        />
                        <Text style={[styles.radioLabel, { color: currentTheme.text }]}>Koyu</Text>
                    </TouchableOpacity>
                    <View style={styles.separator} />
                    <TouchableOpacity style={styles.radioButton} onPress={() => handleThemeChange('system')}>
                        <Ionicons name="settings" size={24} color="#6e7069" />
                        <RadioButton
                            value="system"
                            status={theme === 'system' ? 'checked' : 'unchecked'}
                            onPress={() => handleThemeChange('system')}
                        />
                        <Text style={[styles.radioLabel, { color: currentTheme.text }]}>Sistem Varsayılanı</Text>
                    </TouchableOpacity>
                </View>
            </View>

            <Pressable
                style={[styles.section, styles.logoutContainer]}
                onPress={() => handleLogout()}
            >
                <View style={styles.iconContainer}>
                    <Ionicons name="log-out-outline" size={24} color="white" />
                </View>
                <Text style={[styles.sectionTitle, { color: 'white' }]}>Çıkış Yap</Text>
                <View style={styles.iconContainerRight}>
                    <Ionicons name="chevron-forward" size={24} color="white" />
                </View>
            </Pressable>
        </ScrollView>
    );
};

export default SettingsPage;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
    },
    header: {
        fontSize: 35,
        fontWeight: 'bold',
        textAlign: 'left',
        marginLeft: 20,
        marginVertical: 20,
        marginTop: 90,
    },
    searchContainer: {
        borderWidth: 1,
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 8,
        paddingHorizontal: 10,
        marginHorizontal: 20,
        marginBottom: 20,
    },
    searchIcon: {
        marginRight: 10,
    },
    searchInput: {
        flex: 1,
        height: 40,
    },
    noResults: {
        textAlign: 'center',
        fontSize: 18,
        color: 'gray',
        marginTop: 20,
    },
    section: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 18,
        marginBottom: 10,
        borderRadius: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 5,
    },
    sectionTitle: {
        fontSize: 18,
        flex: 1,
        marginLeft: 10,
        fontWeight: '500',
    },
    radioGroup: {
        flexDirection: 'column',
    },
    radioButton: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    radioLabel: {
        marginLeft: 10,
        fontSize: 16,
    },
    separator: {
        height: 1,
        backgroundColor: '#ccc',
        marginVertical: 10,
    },
    logoutContainer: {
        backgroundColor: 'red',
    },
    iconContainerRight: {
        width: 30,
        alignItems: 'center',
    },
});
