import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Share,
    Platform,
    SafeAreaView,
    StatusBar,
    Image
} from 'react-native';
import { Camera } from 'expo-camera';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { getCurrentUserUid } from '../services/friendFunctions';
import { BlurView } from 'expo-blur';
import QRCode from 'react-native-qrcode-svg';


const QRCodeScreen = ({ navigation }) => {
    const [isScanMode, setIsScanMode] = useState(false);
    const [hasPermission, setHasPermission] = useState(null);
    const [scanned, setScanned] = useState(false);
    const [qrValue, setQrValue] = useState('');

    const loadQRData = async () => {
        const uid = await getCurrentUserUid();
        setQrValue(`friendrequest:${uid}`);
    };

    useEffect(() => {
        loadQRData();
    }, []);

    useEffect(() => {
        (async () => {
            const { status } = await Camera.requestCameraPermissionsAsync();
            setHasPermission(status === 'granted');
        })();
    }, []);

    const handleShare = async () => {
        try {
            await Share.share({
                message: `Beni Sosyalleşme uygulamasında arkadaş olarak ekle! Arkadaşlık kodum: ${qrValue}`,
            });
        } catch (error) {
            console.error('Paylaşım hatası:', error);
        }
    };

    const handleBarCodeScanned = ({ data }) => {
        setScanned(true);
        if (data.startsWith('friendrequest:')) {
            const friendUid = data.split(':')[1];
            // Arkadaşlık isteği gönderme işlemi
            navigation.navigate('FriendRequestConfirm', { friendUid });
        }
    };

    const renderHeader = () => (
        <SafeAreaView style={styles.headerContainer}>
            <BlurView intensity={100} style={styles.headerBlur}>
                <View style={styles.header}>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => navigation.goBack()}
                    >
                        <MaterialIcons name="arrow-back-ios" size={24} color="#2196F3" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>
                        {isScanMode ? 'QR Kod Tara' : 'QR Kodum'}
                    </Text>
                    <TouchableOpacity onPress={handleShare} style={styles.shareButton}>
                        {!isScanMode && <Ionicons name="share-outline" size={24} color="#2196F3" />}
                    </TouchableOpacity>
                </View>
            </BlurView>
        </SafeAreaView>
    );

    const renderCamera = () => {
        if (!hasPermission) return null;

        return (
            <View style={styles.cameraContainer}>
                <Camera
                    style={StyleSheet.absoluteFill}
                    type={1}
                    onBarCodeScanned={scanned ? undefined : handleBarCodeScanned}
                    barCodeScannerSettings={{
                        barCodeTypes: ['qr']
                    }}
                >
                    <View style={styles.overlay}>
                        <View style={styles.scanFrame} />
                    </View>
                </Camera>
                {scanned && (
                    <TouchableOpacity
                        style={styles.rescanButton}
                        onPress={() => setScanned(false)}
                    >
                        <Text style={styles.rescanText}>Tekrar Tara</Text>
                    </TouchableOpacity>
                )}
            </View>
        );
    };

    if (hasPermission === null) {
        return <View />;
    }

    if (hasPermission === false) {
        return (
            <View style={styles.container}>
                {renderHeader()}
                <View style={styles.centerContent}>
                    <Text style={styles.errorText}>Kamera izni verilmedi</Text>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {renderHeader()}
            {isScanMode ? renderCamera() : (
                <View style={styles.qrContainer}>
                    <View style={styles.qrWrapper}>
                        <QRCode
                            value={qrValue}
                            size={200}
                            color="#000"
                            backgroundColor="#fff"
                        />
                    </View>
                    <Text style={styles.instruction}>
                        QR kodunu arkadaşına göster
                    </Text>
                </View>
            )}
            <TouchableOpacity
                style={styles.switchButton}
                onPress={() => setIsScanMode(!isScanMode)}
            >
                <Text style={styles.switchButtonText}>
                    {isScanMode ? 'QR Kodumu Göster' : 'QR Kod Tara'}
                </Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    headerContainer: {
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.1)',
        paddingTop: Platform.OS === 'ios' ? 0 : StatusBar.currentHeight,
    },
    headerBlur: {
        width: '100%',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#000',
    },
    shareButton: {
        padding: 8,
    },
    qrContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    qrWrapper: {
        padding: 20,
        backgroundColor: '#fff',
        borderRadius: 20,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    instruction: {
        marginTop: 20,
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
    },
    cameraContainer: {
        flex: 1,
        overflow: 'hidden',
    },
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    scanFrame: {
        width: 250,
        height: 250,
        borderWidth: 2,
        borderColor: '#fff',
        backgroundColor: 'transparent',
    },
    switchButton: {
        position: 'absolute',
        bottom: 40,
        left: 20,
        right: 20,
        backgroundColor: '#2196F3',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    switchButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    rescanButton: {
        position: 'absolute',
        bottom: 100,
        left: 20,
        right: 20,
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    rescanText: {
        color: '#2196F3',
        fontSize: 16,
        fontWeight: '600',
    },
    centerContent: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    errorText: {
        fontSize: 16,
        color: '#FF3B30',
        textAlign: 'center',
    },
});

export default QRCodeScreen; 