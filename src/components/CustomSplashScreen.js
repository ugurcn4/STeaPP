import React, { useEffect, useState } from 'react';
import { View, Image, StyleSheet, Dimensions, ActivityIndicator, Text, ImageBackground } from 'react-native';
import * as Updates from 'expo-updates';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

const CustomSplashScreen = () => {
    const [isCheckingUpdate, setIsCheckingUpdate] = useState(false);
    const [updateStatus, setUpdateStatus] = useState('');

    useEffect(() => {
        checkForUpdates();
    }, []);

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
        } catch (error) {
            console.error('Güncelleme kontrolü hatası:', error);
            setUpdateStatus('Güncelleme kontrolünde hata oluştu');
        } finally {
            setIsCheckingUpdate(false);
        }
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

            {isCheckingUpdate && (
                <View style={styles.updaterContainer}>
                    <ActivityIndicator size="small" color="#4CAF50" style={styles.loader} />
                </View>
            )}
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