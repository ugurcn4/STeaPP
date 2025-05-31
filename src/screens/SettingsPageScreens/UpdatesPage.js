import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
    ScrollView,
    Platform,
    Alert,
    SafeAreaView,
    StatusBar
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Updates from 'expo-updates';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';

const UpdatesPage = ({ navigation }) => {
    const [isChecking, setIsChecking] = useState(false);
    const [updateAvailable, setUpdateAvailable] = useState(false);
    const [lastChecked, setLastChecked] = useState(null);
    const [currentVersion, setCurrentVersion] = useState('1.0.0');
    const [updateInfo, setUpdateInfo] = useState(null);

    useEffect(() => {
        navigation.setOptions({
            headerBackTitle: ' ',
        });
        checkForUpdates();

        // Eğer başlangıçta bir güncelleme indirilmişse, durumu güncelle
        if (global.updateDownloaded) {
            setUpdateAvailable(true);
        }
    }, [navigation]);

    const checkForUpdates = async () => {
        try {
            setIsChecking(true);
            // Eğer daha önce indirilmiş bir güncelleme varsa
            if (global.updateDownloaded) {
                setUpdateAvailable(true);
                setLastChecked(new Date());
                setUpdateInfo({ isAvailable: true });
                setIsChecking(false);
                return;
            }

            const update = await Updates.checkForUpdateAsync();
            setUpdateAvailable(update.isAvailable);
            setLastChecked(new Date());
            setUpdateInfo(update);
        } catch (error) {
            Alert.alert('Hata', 'Güncellemeler kontrol edilirken bir hata oluştu.');
            console.error('Güncelleme kontrolü hatası:', error);
        } finally {
            setIsChecking(false);
        }
    };

    const installUpdate = async () => {
        try {
            setIsChecking(true);

            // Eğer başlangıçta indirilmiş güncelleme varsa direkt reload yap
            if (global.updateDownloaded) {
                await Updates.reloadAsync();
                return;
            }

            Alert.alert(
                'Güncelleme',
                'Güncelleme indirilip yüklenecek. Uygulama yeniden başlatılacak.',
                [
                    { text: 'İptal', style: 'cancel' },
                    {
                        text: 'Güncelle',
                        onPress: async () => {
                            try {
                                await Updates.fetchUpdateAsync();
                                global.updateDownloaded = true;
                                await Updates.reloadAsync();
                            } catch (error) {
                                Alert.alert('Hata', 'Güncelleme yüklenirken bir hata oluştu.');
                                console.error('Güncelleme yükleme hatası:', error);
                            }
                        }
                    }
                ]
            );
        } catch (error) {
            Alert.alert('Hata', 'Güncelleme işlemi sırasında bir hata oluştu.');
            console.error('Güncelleme hatası:', error);
        } finally {
            setIsChecking(false);
        }
    };

    const formatDate = (date) => {
        if (!date) return '';
        return date.toLocaleString('tr-TR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const updateTips = [
        {
            icon: 'shield-checkmark-outline',
            title: 'Güvenlik',
            description: 'Düzenli güncellemeler güvenliğinizi artırır ve verilerinizi korur.'
        },
        {
            icon: 'flash-outline',
            title: 'Performans',
            description: 'Her güncelleme ile daha hızlı ve daha akıcı bir deneyim.'
        },
        {
            icon: 'star-outline',
            title: 'Yeni Özellikler',
            description: 'Güncellemelerle birlikte yeni özellikler ve iyileştirmeler.'
        }
    ];

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="light-content" backgroundColor="#4CAF50" />
            <ScrollView style={styles.container}>
                <Animated.View
                    entering={FadeInDown.springify()}
                    style={styles.header}
                >
                    <LinearGradient
                        colors={['#4CAF50', '#45a049']}
                        style={styles.headerGradient}
                    >
                        <TouchableOpacity
                            style={styles.backButton}
                            onPress={() => navigation.goBack()}
                        >
                            <Ionicons name="chevron-back" size={28} color="#fff" />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>Güncellemeler</Text>
                        <Ionicons name="cloud-upload-outline" size={60} color="rgba(255,255,255,0.9)" />
                        <View style={styles.versionContainer}>
                            <Text style={styles.versionLabel}>Mevcut Sürüm</Text>
                            <Text style={styles.versionNumber}>{currentVersion}</Text>
                        </View>
                        {lastChecked && (
                            <Text style={styles.lastChecked}>
                                Son kontrol: {formatDate(lastChecked)}
                            </Text>
                        )}
                    </LinearGradient>
                </Animated.View>

                <View style={styles.content}>
                    <Animated.View
                        entering={FadeInDown.springify().delay(100)}
                        style={styles.card}
                    >
                        <View style={styles.statusContainer}>
                            <View style={[
                                styles.statusIndicator,
                                { backgroundColor: updateAvailable ? '#FF9800' : '#4CAF50' }
                            ]} />
                            <Text style={styles.statusText}>
                                {updateAvailable ? 'Güncelleme Mevcut' : 'Güncel'}
                            </Text>
                        </View>

                        <TouchableOpacity
                            style={[
                                styles.button,
                                isChecking && styles.buttonDisabled
                            ]}
                            onPress={updateAvailable ? installUpdate : checkForUpdates}
                            disabled={isChecking}
                        >
                            {isChecking ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <>
                                    <Ionicons
                                        name={updateAvailable ? "cloud-download-outline" : "refresh-outline"}
                                        size={24}
                                        color="#fff"
                                        style={styles.buttonIcon}
                                    />
                                    <Text style={styles.buttonText}>
                                        {updateAvailable ? 'Güncellemeyi Yükle' : 'Güncellemeleri Kontrol Et'}
                                    </Text>
                                </>
                            )}
                        </TouchableOpacity>
                    </Animated.View>

                    {updateInfo && (
                        <Animated.View
                            entering={FadeInDown.springify().delay(200)}
                            style={styles.infoCard}
                        >
                            <Text style={styles.infoTitle}>Güncelleme Bilgileri</Text>
                            <View style={styles.infoRow}>
                                <Ionicons name="information-circle-outline" size={20} color="#666" />
                                <Text style={styles.infoText}>
                                    Güncelleme ID: {Updates.updateId || 'Mevcut değil'}
                                </Text>
                            </View>
                            <View style={styles.infoRow}>
                                <Ionicons name="time-outline" size={20} color="#666" />
                                <Text style={styles.infoText}>
                                    Yayın Tarihi: {formatDate(new Date())}
                                </Text>
                            </View>
                        </Animated.View>
                    )}

                    <View style={styles.tipsContainer}>
                        <Text style={styles.tipsTitle}>Neden Güncel Kalmalıyım?</Text>
                        {updateTips.map((tip, index) => (
                            <Animated.View
                                key={index}
                                entering={FadeInDown.springify().delay(300 + (index * 100))}
                                style={styles.tipCard}
                            >
                                <View style={styles.tipIconContainer}>
                                    <Ionicons name={tip.icon} size={24} color="#4CAF50" />
                                </View>
                                <View style={styles.tipContent}>
                                    <Text style={styles.tipTitle}>{tip.title}</Text>
                                    <Text style={styles.tipDescription}>{tip.description}</Text>
                                </View>
                            </Animated.View>
                        ))}
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#4CAF50',
    },
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    header: {
        overflow: 'hidden',
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    headerGradient: {
        padding: 20,
        paddingTop: Platform.OS === 'ios' ? 0 : 20,
        alignItems: 'center',
    },
    backButton: {
        position: 'absolute',
        left: 20,
        top: Platform.OS === 'ios' ? 10 : 20,
        zIndex: 1,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 20,
    },
    versionContainer: {
        alignItems: 'center',
        marginVertical: 15,
    },
    versionLabel: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 16,
        marginBottom: 5,
    },
    versionNumber: {
        color: '#fff',
        fontSize: 32,
        fontWeight: 'bold',
    },
    lastChecked: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 14,
        textAlign: 'center',
    },
    content: {
        padding: 20,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 20,
        marginBottom: 20,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3.84,
    },
    statusContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    statusIndicator: {
        width: 12,
        height: 12,
        borderRadius: 6,
        marginRight: 10,
    },
    statusText: {
        fontSize: 16,
        color: '#333',
        fontWeight: '600',
    },
    button: {
        backgroundColor: '#4CAF50',
        borderRadius: 15,
        padding: 15,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    buttonDisabled: {
        backgroundColor: '#a5d6a7',
    },
    buttonIcon: {
        marginRight: 10,
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    infoCard: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 20,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3.84,
    },
    infoTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
        marginBottom: 15,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    infoText: {
        marginLeft: 10,
        fontSize: 14,
        color: '#666',
    },
    tipsContainer: {
        marginTop: 20,
    },
    tipsTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: '#333',
        marginBottom: 15,
        textAlign: 'center',
    },
    tipCard: {
        backgroundColor: '#fff',
        borderRadius: 15,
        padding: 15,
        marginBottom: 15,
        flexDirection: 'row',
        alignItems: 'center',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    tipIconContainer: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: 'rgba(76, 175, 80, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    tipContent: {
        flex: 1,
    },
    tipTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 4,
    },
    tipDescription: {
        fontSize: 14,
        color: '#666',
        lineHeight: 20,
    },
});

export default UpdatesPage; 