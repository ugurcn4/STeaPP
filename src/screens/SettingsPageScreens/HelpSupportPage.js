import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Linking } from 'react-native';
import { useSelector } from 'react-redux';
import { lightTheme, darkTheme } from '../../themes';
import Ionicons from 'react-native-vector-icons/Ionicons';

const HelpSupportPage = ({ navigation }) => {
    const theme = useSelector((state) => state.theme.theme);
    const currentTheme = theme === 'dark' ? darkTheme : lightTheme;

    const [expandedQuestion, setExpandedQuestion] = useState(null);

    const faqData = [
        {
            id: 1,
            question: 'Nasıl arkadaş ekleyebilirim?',
            answer: 'Arkadaşlar sekmesinden "Arkadaş Ekle" butonuna tıklayarak e-posta adresi veya kullanıcı adı ile arkadaşlarınızı bulabilirsiniz.'
        },
        {
            id: 2,
            question: 'Şifremi nasıl değiştirebilirim?',
            answer: 'Profil ayarlarından "Şifre Değiştir" seçeneğine tıklayarak şifrenizi güncelleyebilirsiniz.'
        },
        {
            id: 3,
            question: 'Bildirimler gelmiyor, ne yapmalıyım?',
            answer: 'Öncelikle telefon ayarlarından uygulama bildirimlerinin açık olduğundan emin olun. Ardından uygulama içi bildirim ayarlarını kontrol edin.'
        },
        {
            id: 4,
            question: 'Hesabımı nasıl silebilirim?',
            answer: 'Hesap silme işlemi için Ayarlar > Gizlilik > Hesabı Sil yolunu izleyebilirsiniz. Bu işlem geri alınamaz.'
        },
    ];

    const supportLinks = [
        {
            id: 1,
            title: 'Destek Merkezi',
            icon: 'help-circle-outline',
            color: '#4CAF50',
            action: () => Linking.openURL('https://support.yourapp.com')
        },
        {
            id: 2,
            title: 'E-posta ile İletişim',
            icon: 'mail-outline',
            color: '#2196F3',
            action: () => Linking.openURL('mailto:support@yourapp.com')
        },
        {
            id: 3,
            title: 'Canlı Destek',
            icon: 'chatbubbles-outline',
            color: '#FF9800',
            action: () => Linking.openURL('https://chat.yourapp.com')
        }
    ];

    const toggleQuestion = (id) => {
        setExpandedQuestion(expandedQuestion === id ? null : id);
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
                    Yardım ve Destek
                </Text>
            </View>

            <Text style={[styles.sectionTitle, { color: currentTheme.text }]}>
                Sık Sorulan Sorular
            </Text>

            <View style={styles.faqSection}>
                {faqData.map((item) => (
                    <TouchableOpacity
                        key={item.id}
                        style={styles.questionContainer}
                        onPress={() => toggleQuestion(item.id)}
                    >
                        <View style={styles.questionHeader}>
                            <Text style={[styles.question, { color: currentTheme.text }]}>
                                {item.question}
                            </Text>
                            <Ionicons
                                name={expandedQuestion === item.id ? "chevron-up" : "chevron-down"}
                                size={20}
                                color={currentTheme.text}
                            />
                        </View>
                        {expandedQuestion === item.id && (
                            <Text style={[styles.answer, { color: currentTheme.text }]}>
                                {item.answer}
                            </Text>
                        )}
                    </TouchableOpacity>
                ))}
            </View>

            <Text style={[styles.sectionTitle, { color: currentTheme.text }]}>
                Destek Kanalları
            </Text>

            <View style={styles.supportSection}>
                {supportLinks.map((item) => (
                    <TouchableOpacity
                        key={item.id}
                        style={[styles.supportItem, { borderColor: item.color }]}
                        onPress={item.action}
                    >
                        <Ionicons name={item.icon} size={24} color={item.color} />
                        <Text style={[styles.supportText, { color: currentTheme.text }]}>
                            {item.title}
                        </Text>
                        <Ionicons name="chevron-forward" size={20} color={item.color} />
                    </TouchableOpacity>
                ))}
            </View>

            <Text style={styles.note}>
                7/24 destek ekibimiz size yardımcı olmaktan mutluluk duyacaktır.
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
    sectionTitle: {
        fontSize: 20,
        fontWeight: '600',
        marginBottom: 15,
        marginLeft: 10,
    },
    faqSection: {
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 12,
        padding: 15,
        marginBottom: 30,
    },
    questionContainer: {
        marginBottom: 15,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.1)',
        paddingBottom: 15,
    },
    questionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    question: {
        fontSize: 16,
        fontWeight: '500',
        flex: 1,
    },
    answer: {
        marginTop: 10,
        fontSize: 14,
        lineHeight: 20,
        opacity: 0.8,
    },
    supportSection: {
        marginBottom: 30,
    },
    supportItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 15,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 12,
        marginBottom: 10,
        borderLeftWidth: 4,
    },
    supportText: {
        fontSize: 16,
        marginLeft: 15,
        flex: 1,
    },
    note: {
        textAlign: 'center',
        fontSize: 14,
        color: '#666',
        marginBottom: 30,
        fontStyle: 'italic',
    },
});

export default HelpSupportPage; 