import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Share, ScrollView, Clipboard } from 'react-native';
import { useSelector } from 'react-redux';
import { lightTheme, darkTheme } from '../../themes';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Toast from 'react-native-toast-message';

const InviteFriendsPage = ({ navigation }) => {
    const theme = useSelector((state) => state.theme.theme);
    const currentTheme = theme === 'dark' ? darkTheme : lightTheme;

    const [inviteCode] = useState('FRIEND2024'); // Örnek davet kodu

    const shareOptions = [
        {
            id: 1,
            title: 'WhatsApp',
            icon: 'logo-whatsapp',
            color: '#25D366',
            action: () => shareToWhatsApp()
        },
        {
            id: 2,
            title: 'Instagram',
            icon: 'logo-instagram',
            color: '#E4405F',
            action: () => shareToInstagram()
        },
        {
            id: 3,
            title: 'Twitter',
            icon: 'logo-twitter',
            color: '#1DA1F2',
            action: () => shareToTwitter()
        },
        {
            id: 4,
            title: 'SMS',
            icon: 'chatbubble-outline',
            color: '#FF9500',
            action: () => shareViaSMS()
        },
        {
            id: 5,
            title: 'E-posta',
            icon: 'mail-outline',
            color: '#4CAF50',
            action: () => shareViaEmail()
        }
    ];

    const shareMessage = `Hey! Harika bir uygulama keşfettim. Şu davet koduyla katıl: ${inviteCode}\n\nİndir: https://yourapp.com/download`;

    const shareToWhatsApp = async () => {
        try {
            await Share.share({
                message: shareMessage,
            });
        } catch (error) {
            showToast('error', 'Paylaşım başarısız oldu');
        }
    };

    const shareToInstagram = async () => {
        try {
            await Share.share({
                message: shareMessage,
            });
        } catch (error) {
            showToast('error', 'Paylaşım başarısız oldu');
        }
    };

    const shareToTwitter = async () => {
        try {
            await Share.share({
                message: shareMessage,
            });
        } catch (error) {
            showToast('error', 'Paylaşım başarısız oldu');
        }
    };

    const shareViaSMS = async () => {
        try {
            await Share.share({
                message: shareMessage,
            });
        } catch (error) {
            showToast('error', 'Paylaşım başarısız oldu');
        }
    };

    const shareViaEmail = async () => {
        try {
            await Share.share({
                message: shareMessage,
                title: 'Arkadaşını Davet Et',
            });
        } catch (error) {
            showToast('error', 'Paylaşım başarısız oldu');
        }
    };

    const copyInviteCode = () => {
        Clipboard.setString(inviteCode);
        showToast('success', 'Davet kodu kopyalandı');
    };

    const showToast = (type, message1) => {
        Toast.show({
            type: type,
            text1: message1,
            position: 'bottom',
        });
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
                    Arkadaş Davet Et
                </Text>
            </View>

            <View style={styles.inviteCodeSection}>
                <Text style={[styles.inviteCodeTitle, { color: currentTheme.text }]}>
                    Davet Kodun
                </Text>
                <TouchableOpacity
                    style={styles.codeContainer}
                    onPress={copyInviteCode}
                >
                    <Text style={styles.inviteCode}>{inviteCode}</Text>
                    <Ionicons name="copy-outline" size={20} color="#4CAF50" />
                </TouchableOpacity>
                <Text style={styles.tapToCopy}>
                    Kopyalamak için dokun
                </Text>
            </View>

            <View style={styles.shareSection}>
                <Text style={[styles.shareTitle, { color: currentTheme.text }]}>
                    Arkadaşlarını Davet Et
                </Text>
                <View style={styles.shareGrid}>
                    {shareOptions.map((option) => (
                        <TouchableOpacity
                            key={option.id}
                            style={[styles.shareOption, { backgroundColor: option.color + '20' }]}
                            onPress={option.action}
                        >
                            <View style={[styles.iconContainer, { backgroundColor: option.color + '40' }]}>
                                <Ionicons name={option.icon} size={28} color={option.color} />
                            </View>
                            <Text style={[styles.optionTitle, { color: currentTheme.text }]}>
                                {option.title}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            <View style={styles.rewardSection}>
                <View style={styles.rewardCard}>
                    <Ionicons name="gift-outline" size={40} color="#4CAF50" />
                    <Text style={[styles.rewardTitle, { color: currentTheme.text }]}>
                        Arkadaşını Davet Et, Ödül Kazan!
                    </Text>
                    <Text style={styles.rewardDescription}>
                        Her başarılı davet için özel ödüller kazanabilirsin.
                    </Text>
                </View>
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
    inviteCodeSection: {
        alignItems: 'center',
        marginBottom: 40,
    },
    inviteCodeTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 15,
    },
    codeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(76, 175, 80, 0.1)',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 12,
        marginBottom: 8,
    },
    inviteCode: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#4CAF50',
        marginRight: 15,
        letterSpacing: 2,
    },
    tapToCopy: {
        fontSize: 12,
        color: '#666',
    },
    shareSection: {
        marginBottom: 40,
    },
    shareTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 20,
        marginLeft: 10,
    },
    shareGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    shareOption: {
        width: '30%',
        alignItems: 'center',
        padding: 15,
        borderRadius: 12,
        marginBottom: 15,
    },
    iconContainer: {
        width: 50,
        height: 50,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    optionTitle: {
        fontSize: 12,
        fontWeight: '500',
    },
    rewardSection: {
        marginBottom: 30,
    },
    rewardCard: {
        backgroundColor: 'rgba(76, 175, 80, 0.1)',
        borderRadius: 15,
        padding: 20,
        alignItems: 'center',
    },
    rewardTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginVertical: 10,
        textAlign: 'center',
    },
    rewardDescription: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        lineHeight: 20,
    },
});

export default InviteFriendsPage; 