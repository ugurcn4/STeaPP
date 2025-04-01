import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Linking, Alert } from 'react-native';
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
            answer: 'Arkadaşlar sekmesinden "Arkadaş Ekle" butonuna tıklayarak e-posta adresi veya kullanıcı adı ile arkadaşlarınızı bulabilirsiniz. Ayrıca QR kod ile de hızlıca arkadaş ekleyebilirsiniz.'
        },
        {
            id: 2,
            question: 'Şifremi nasıl değiştirebilirim?',
            answer: 'Profil ayarlarından "Şifre Değiştir" seçeneğine tıklayarak şifrenizi güncelleyebilirsiniz. Şifrenizi unuttuysanız, giriş ekranındaki "Şifremi Unuttum" seçeneğini kullanabilirsiniz.'
        },
        {
            id: 3,
            question: 'Bildirimler gelmiyor, ne yapmalıyım?',
            answer: '1. Telefon ayarlarından uygulama bildirimlerinin açık olduğunu kontrol edin.\n2. Uygulama içi bildirim ayarlarını kontrol edin.\n3. İnternet bağlantınızı kontrol edin.\n4. Uygulamayı kapatıp yeniden açmayı deneyin.\n5. Sorun devam ederse uygulamayı kaldırıp yeniden yükleyin.'
        },
        {
            id: 4,
            question: 'Konum paylaşımı nasıl çalışır?',
            answer: 'Konum paylaşımı iki şekilde yapılabilir:\n1. Anlık Konum: Tek seferlik konum paylaşımı\n2. Canlı Konum: Belirli bir süre boyunca sürekli güncellenen konum paylaşımı\nKonum paylaşımını başlatmak için arkadaş profilindeki "Konum Paylaş" butonunu kullanabilirsiniz.'
        },
        {
            id: 5,
            question: 'Konum paylaşımını nasıl durdurabilirim?',
            answer: 'Aktif bir konum paylaşımını durdurmak için:\n1. Arkadaş profiline gidin\n2. "Paylaşımı Durdur" butonuna tıklayın\nveya\nHarita ekranındaki aktif paylaşımlar listesinden paylaşımı durdurabilirsiniz.'
        },
        {
            id: 6,
            question: 'Hesabımı nasıl silebilirim?',
            answer: 'Hesap silme işlemi için:\n1. Ayarlar > Gizlilik > Hesabı Sil yolunu izleyin\n2. Silme nedeninizi seçin\n3. Şifrenizi girin\n4. Onaylayın\nNot: Bu işlem geri alınamaz ve tüm verileriniz kalıcı olarak silinir.'
        },
        {
            id: 7,
            question: 'Uygulama çok pil tüketiyor, ne yapabilirim?',
            answer: '1. Arka plan konum izinlerini kapatın\n2. Sürekli konum paylaşımı yerine anlık konum paylaşımını tercih edin\n3. Kullanmadığınız zamanlarda uygulamadan çıkış yapın\n4. Bildirim sıklığını azaltın\n5. Karanlık temayı kullanın'
        },
        {
            id: 8,
            question: 'İstenmeyen arkadaşlık isteklerini nasıl engelleyebilirim?',
            answer: 'Ayarlar > Gizlilik > Arkadaşlık İstekleri menüsünden:\n1. Sadece telefon rehberinizdeki kişilerden\n2. Sadece arkadaşlarınızın arkadaşlarından\n3. Hiç kimseden\nseçeneklerinden birini seçebilirsiniz.'
        },
        {
            id: 9,
            question: 'Bir kullanıcıyı nasıl engelleyebilirim?',
            answer: 'Kullanıcıyı engellemek için:\n1. Kullanıcının profiline gidin\n2. Sağ üst köşedeki menü ikonuna tıklayın\n3. "Engelle" seçeneğini seçin\nEngellenen kullanıcı size mesaj gönderemez ve konumunuzu göremez.'
        },
        {
            id: 10,
            question: 'Veri kullanımını nasıl azaltabilirim?',
            answer: 'Ayarlar > Veri Kullanımı menüsünden:\n1. Düşük veri modunu aktifleştirin\n2. Otomatik konum güncellemelerini azaltın\n3. Sadece WiFi bağlantısında güncelleme yapacak şekilde ayarlayın\n4. Medya otomatik indirmeyi kapatın'
        },
        {
            id: 11,
            question: 'Geçmiş konum verilerimi nasıl silebilirim?',
            answer: 'Konum geçmişinizi silmek için:\n1. Ayarlar > Gizlilik > Konum Geçmişi\n2. "Geçmişi Temizle" butonuna tıklayın\n3. Temizlemek istediğiniz tarih aralığını seçin\nNot: Silinen veriler geri getirilemez.'
        }
    ];

    const supportLinks = [
        {
            id: 1,
            title: 'Destek Merkezi',
            icon: 'help-circle-outline',
            color: '#4CAF50',
            action: () => Linking.openURL('https://sites.google.com/view/steapp-privacy-policy/destek-merkezi')
        },
        {
            id: 2,
            title: 'E-posta ile İletişim',
            icon: 'mail-outline',
            color: '#2196F3',
            action: () => Linking.openURL('mailto:ucarugur57@gmail.com')
        },
        {
            id: 3,
            title: 'Canlı Destek',
            icon: 'chatbubbles-outline',
            color: '#FF9800',
            action: () => Linking.openURL('https://www.instagram.com/ugurrucr/')
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
                        style={[styles.supportOption, { backgroundColor: item.color + '10' }]}
                        onPress={item.action}
                    >
                        <View style={[styles.supportIconContainer, { backgroundColor: item.color + '20' }]}>
                            <Ionicons name={item.icon} size={24} color={item.color} />
                        </View>
                        <View style={styles.supportInfo}>
                            <Text style={[styles.supportTitle, { color: currentTheme.text }]}>
                                {item.title}
                            </Text>
                            {item.id === 1 && (
                                <Text style={[styles.supportDescription, { color: currentTheme.textSecondary }]}>
                                    Sık sorulan sorular ve yardım makaleleri
                                </Text>
                            )}
                            {item.id === 2 && (
                                <Text style={[styles.supportDescription, { color: currentTheme.textSecondary }]}>
                                    STeaPP Destek Merkezine e-posta gönderin
                                </Text>
                            )}
                            {item.id === 3 && (
                                <Text style={[styles.supportDescription, { color: currentTheme.textSecondary }]}>
                                    Instagram üzerinden mesaj gönderin
                                </Text>
                            )}
                        </View>
                        <Ionicons name="chevron-forward" size={24} color={currentTheme.textSecondary} />
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
        lineHeight: 22,
        opacity: 0.8,
        paddingLeft: 10,
    },
    bulletPoint: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 5,
    },
    bullet: {
        fontSize: 14,
        marginRight: 5,
        color: '#666',
    },
    highlightText: {
        fontWeight: '500',
        color: '#4CAF50',
    },
    noteText: {
        fontStyle: 'italic',
        fontSize: 13,
        color: '#666',
        marginTop: 5,
    },
    supportSection: {
        marginBottom: 30,
    },
    supportOption: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 2,
    },
    supportIconContainer: {
        width: 50,
        height: 50,
        borderRadius: 15,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    supportInfo: {
        flex: 1,
    },
    supportTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 5,
    },
    supportDescription: {
        fontSize: 14,
        opacity: 0.7,
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