import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, Linking } from 'react-native';
import { useSelector } from 'react-redux';
import { lightTheme, darkTheme } from '../../themes';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { version } from '../../../package.json'; // Uygulama versiyonunu package.json'dan alıyoruz

const AboutPage = ({ navigation }) => {
    const theme = useSelector((state) => state.theme.theme);
    const currentTheme = theme === 'dark' ? darkTheme : lightTheme;

    const legalLinks = [
        {
            id: 1,
            title: 'Kullanım Koşulları',
            icon: 'document-text-outline',
            action: () => Linking.openURL('https://yourapp.com/terms')
        },
        {
            id: 2,
            title: 'Gizlilik Politikası',
            icon: 'shield-checkmark-outline',
            action: () => Linking.openURL('https://yourapp.com/privacy')
        },
        {
            id: 3,
            title: 'Lisans Bilgileri',
            icon: 'information-circle-outline',
            action: () => Linking.openURL('https://yourapp.com/license')
        }
    ];

    const socialLinks = [
        {
            id: 1,
            title: 'Instagram',
            icon: 'logo-instagram',
            action: () => Linking.openURL('https://instagram.com/yourapp')
        },
        {
            id: 2,
            title: 'Twitter',
            icon: 'logo-twitter',
            action: () => Linking.openURL('https://twitter.com/yourapp')
        },
        {
            id: 3,
            title: 'Web Sitesi',
            icon: 'globe-outline',
            action: () => Linking.openURL('https://yourapp.com')
        }
    ];

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
                    Hakkında
                </Text>
            </View>

            <View style={styles.appInfoSection}>
                <Image
                    source={require('../../../assets/images/new-logo.png')} // Uygulama ikonunuzu ekleyin
                    style={styles.appIcon}
                />
                <Text style={[styles.appName, { color: currentTheme.text }]}>
                    STeaPP
                </Text>
                <Text style={[styles.version, { color: currentTheme.text }]}>
                    Versiyon {version}
                </Text>
                <Text style={styles.description}>
                    Bu uygulama arkadaşlarınızla iletişim kurmanız ve paylaşımda bulunmanız için tasarlanmıştır.
                </Text>
            </View>

            <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: currentTheme.text }]}>
                    Yasal
                </Text>
                {legalLinks.map((item) => (
                    <TouchableOpacity
                        key={item.id}
                        style={styles.linkItem}
                        onPress={item.action}
                    >
                        <Ionicons name={item.icon} size={24} color={currentTheme.text} />
                        <Text style={[styles.linkText, { color: currentTheme.text }]}>
                            {item.title}
                        </Text>
                        <Ionicons name="chevron-forward" size={20} color={currentTheme.text} />
                    </TouchableOpacity>
                ))}
            </View>

            <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: currentTheme.text }]}>
                    Bizi Takip Edin
                </Text>
                <View style={styles.socialLinksContainer}>
                    {socialLinks.map((item) => (
                        <TouchableOpacity
                            key={item.id}
                            style={styles.socialItem}
                            onPress={item.action}
                        >
                            <Ionicons name={item.icon} size={24} color={currentTheme.text} />
                            <Text style={[styles.socialText, { color: currentTheme.text }]}>
                                {item.title}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            <View style={styles.creditsSection}>
                <Text style={[styles.credits, { color: currentTheme.text }]}>
                    © 2024 STeaPP. Tüm hakları saklıdır.
                </Text>
                <Text style={styles.madeWith}>
                    Uğur Can UÇAR tarafından Türkiye'de geliştirildi.
                </Text>
                <Text style={styles.madeWith}>
                    ❤️🇹🇷
                </Text>
            </View>
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
    appInfoSection: {
        alignItems: 'center',
        marginBottom: 40,
    },
    appIcon: {
        width: 100,
        height: 100,
        borderRadius: 20,
        marginBottom: 15,
    },
    appName: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 5,
    },
    version: {
        fontSize: 16,
        opacity: 0.7,
        marginBottom: 10,
    },
    description: {
        textAlign: 'center',
        color: '#666',
        lineHeight: 20,
        paddingHorizontal: 20,
    },
    section: {
        marginBottom: 30,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '600',
        marginBottom: 15,
        marginLeft: 10,
    },
    linkItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 15,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 12,
        marginBottom: 10,
    },
    linkText: {
        fontSize: 16,
        marginLeft: 15,
        flex: 1,
    },
    socialLinksContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        flexWrap: 'wrap',
    },
    socialItem: {
        alignItems: 'center',
        padding: 15,
        minWidth: 100,
    },
    socialText: {
        marginTop: 5,
        fontSize: 14,
    },
    creditsSection: {
        alignItems: 'center',
        marginTop: 20,
        marginBottom: 40,
    },
    credits: {
        fontSize: 14,
        marginBottom: 5,
    },
    madeWith: {
        fontSize: 14,
        color: '#666',
    },
});

export default AboutPage; 