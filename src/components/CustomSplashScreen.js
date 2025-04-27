import React, { useEffect, useState } from 'react';
import { View, Image, StyleSheet, Dimensions, ActivityIndicator, Text, ImageBackground } from 'react-native';
import * as Updates from 'expo-updates';
import { LinearGradient } from 'expo-linear-gradient';
import { getAuth } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebaseConfig';

const { width, height } = Dimensions.get('window');

const CustomSplashScreen = ({ onDataLoaded }) => {
    const [isCheckingUpdate, setIsCheckingUpdate] = useState(false);
    const [updateStatus, setUpdateStatus] = useState('');
    const [loadingStatus, setLoadingStatus] = useState({
        update: false,
        userData: false,
        auth: false
    });

    useEffect(() => {
        checkForUpdates();
        checkUserData();
    }, []);

    useEffect(() => {
        // Tüm veriler yüklendiğinde ana sayfaya geçiş için callback'i çağır
        if (loadingStatus.update && loadingStatus.userData && loadingStatus.auth) {
            if (onDataLoaded) {
                onDataLoaded();
            }
        }
    }, [loadingStatus]);

    const checkUserData = async () => {
        const auth = getAuth();

        try {
            // Auth durumunu kontrol et
            if (auth.currentUser) {
                // Kullanıcının bilgilerini Firestore'dan çek
                const docRef = doc(db, 'users', auth.currentUser.uid);
                await getDoc(docRef);

                setLoadingStatus(prev => ({
                    ...prev,
                    userData: true,
                    auth: true
                }));
            } else {
                // Kullanıcı giriş yapmamış
                setLoadingStatus(prev => ({
                    ...prev,
                    userData: true,
                    auth: true
                }));
            }
        } catch (error) {
            console.error('Kullanıcı verileri kontrol edilirken hata:', error);
            // Hata durumunda da yükleme tamamlandı olarak işaretle
            setLoadingStatus(prev => ({
                ...prev,
                userData: true,
                auth: true
            }));
        }
    };

    const checkForUpdates = async () => {
        try {
            setIsCheckingUpdate(true);
            setUpdateStatus('Güncellemeler kontrol ediliyor...');

            const update = await Updates.checkForUpdateAsync();

            if (update.isAvailable) {
                setUpdateStatus('Güncelleme indiriliyor...');
                await Updates.fetchUpdateAsync();
                // Güncelleme başarıyla indirildiğinde global değişkeni ayarla
                global.updateDownloaded = true;
                setUpdateStatus('Güncelleme indirildi!');
            } else {
                setUpdateStatus('Uygulama güncel');
            }

            setLoadingStatus(prev => ({
                ...prev,
                update: true
            }));
        } catch (error) {
            console.error('Güncelleme kontrolü hatası:', error);
            setUpdateStatus('Güncelleme kontrolünde hata oluştu');

            // Hata durumunda da yükleme tamamlandı olarak işaretle
            setLoadingStatus(prev => ({
                ...prev,
                update: true
            }));
        } finally {
            setIsCheckingUpdate(false);
        }
    };

    // Yükleme durumunu gösteren metin
    const getLoadingText = () => {
        if (!loadingStatus.update) return "Güncellemeler kontrol ediliyor...";
        if (!loadingStatus.auth) return "Kullanıcı bilgileri kontrol ediliyor...";
        if (!loadingStatus.userData) return "Kullanıcı verileri yükleniyor...";
        return "Uygulama başlatılıyor...";
    };

    return (
        <View style={styles.container}>
            {/* Beyaz arka plan ve logoyu içeren bileşen */}
            <View style={styles.logoContainer}>
                <Image
                    source={require('../../assets/images/logo.png')}
                    style={styles.logo}
                    resizeMode="contain"
                />
            </View>

            <View style={styles.updaterContainer}>
                <ActivityIndicator size="small" color="#4CAF50" style={styles.loader} />
                <Text style={styles.updateText}>{getLoadingText()}</Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#ffffff',
        alignItems: 'center',
        justifyContent: 'center',
    },
    logoContainer: {
        width: width * 0.4,
        height: width * 0.4,
        borderRadius: 30,
        overflow: 'hidden',
        backgroundColor: 'white',
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
    },
    logo: {
        width: '80%',
        height: '80%',
        borderRadius: 20,
    },
    updaterContainer: {
        position: 'absolute',
        bottom: 40,
        flexDirection: 'row',
        alignItems: 'center',
    },
    loader: {
        marginRight: 10,
    },
    updateText: {
        fontSize: 12,
        color: '#666',
    },
});

export default CustomSplashScreen; 