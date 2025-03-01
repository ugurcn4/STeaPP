import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Share,
    Platform,
    SafeAreaView,
    StatusBar,
    Image,
    ActivityIndicator,
    Alert
} from 'react-native';
import { Camera } from 'expo-camera';
import { MaterialIcons, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { getCurrentUserUid } from '../services/friendFunctions';
import { BlurView } from 'expo-blur';
import * as QRCodeComponent from 'react-native-qrcode-svg';

const QRCodeScreen = ({ navigation }) => {
    const [isScanMode, setIsScanMode] = useState(false);
    const [hasPermission, setHasPermission] = useState(null);
    const [scanned, setScanned] = useState(false);
    const [qrValue, setQrValue] = useState('');
    const [loading, setLoading] = useState(true);
    const cameraRef = useRef(null);
    const qrRef = useRef();

    const loadQRData = async () => {
        try {
            setLoading(true);
            const uid = await getCurrentUserUid();
            if (uid) {
                setQrValue(`friendrequest:${uid}`);
            } else {
                Alert.alert('Hata', 'Kullanıcı bilgileri yüklenemedi. Lütfen tekrar deneyin.');
            }
        } catch (error) {
            console.error('QR kod yükleme hatası:', error);
            Alert.alert('Hata', 'QR kod oluşturulurken bir sorun oluştu.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadQRData();
    }, []);

    useEffect(() => {
        (async () => {
            try {
                const { status } = await Camera.requestCameraPermissionsAsync();
                setHasPermission(status === 'granted');
            } catch (error) {
                console.error('Kamera izni hatası:', error);
                setHasPermission(false);
            }
        })();
    }, []);

    const handleShare = async () => {
        try {
            await Share.share({
                message: `Beni Sosyalleşme uygulamasında arkadaş olarak ekle! Arkadaşlık kodum: ${qrValue}`,
            });
        } catch (error) {
            console.error('Paylaşım hatası:', error);
            Alert.alert('Paylaşım Hatası', 'QR kod paylaşılırken bir sorun oluştu.');
        }
    };

    const handleBarCodeScanned = ({ type, data }) => {
        setScanned(true);
        if (data && data.startsWith('friendrequest:')) {
            try {
                const friendUid = data.split(':')[1];
                if (friendUid) {
                    navigation.navigate('FriendRequestConfirm', { friendUid });
                } else {
                    Alert.alert('Geçersiz QR Kod', 'Bu QR kod geçerli bir arkadaşlık isteği içermiyor.');
                }
            } catch (error) {
                console.error('QR kod işleme hatası:', error);
                Alert.alert('Hata', 'QR kod işlenirken bir sorun oluştu.');
            }
        } else {
            Alert.alert('Geçersiz QR Kod', 'Bu QR kod geçerli bir arkadaşlık isteği içermiyor.');
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

    const renderQRCode = () => {
        if (loading) {
            return (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#2196F3" />
                    <Text style={styles.loadingText}>QR Kod Yükleniyor...</Text>
                </View>
            );
        }

        const userId = qrValue ? qrValue.split(':')[1] : '';

        return (
            <View style={styles.qrContainer}>
                <View style={styles.qrWrapper}>
                    <View style={styles.userIdContainer}>
                        <Text style={styles.userIdTitle}>Arkadaşlık Kodun:</Text>
                        <Text style={styles.userId}>{userId}</Text>
                    </View>
                </View>
                <Text style={styles.instruction}>
                    Bu kodu arkadaşına göster veya paylaş
                </Text>
                <TouchableOpacity style={styles.shareButtonAlt} onPress={handleShare}>
                    <MaterialCommunityIcons name="share-variant" size={22} color="#fff" />
                    <Text style={styles.shareButtonText}>Arkadaşlık Kodunu Paylaş</Text>
                </TouchableOpacity>
            </View>
        );
    };

    const renderCamera = () => {
        if (!hasPermission) {
            return (
                <View style={styles.centerContent}>
                    <MaterialIcons name="no-photography" size={64} color="#FF3B30" />
                    <Text style={styles.errorText}>Kamera izni verilmedi</Text>
                    <TouchableOpacity
                        style={styles.permissionButton}
                        onPress={async () => {
                            const { status } = await Camera.requestCameraPermissionsAsync();
                            setHasPermission(status === 'granted');
                        }}
                    >
                        <Text style={styles.permissionButtonText}>İzin İste</Text>
                    </TouchableOpacity>
                </View>
            );
        }

        return (
            <View style={styles.cameraContainer}>
                <Camera
                    ref={cameraRef}
                    style={StyleSheet.absoluteFill}
                    type={1}
                    onBarCodeScanned={scanned ? undefined : handleBarCodeScanned}
                    barCodeScannerSettings={{
                        barCodeTypes: ['qr']
                    }}
                >
                    <View style={styles.overlay}>
                        <View style={styles.scanFrame}>
                            <View style={styles.cornerTL} />
                            <View style={styles.cornerTR} />
                            <View style={styles.cornerBL} />
                            <View style={styles.cornerBR} />
                        </View>
                        <Text style={styles.scanText}>QR kodu çerçeve içine alın</Text>
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
            {isScanMode ? renderCamera() : renderQRCode()}
            <TouchableOpacity
                style={styles.switchButton}
                onPress={() => {
                    setIsScanMode(!isScanMode);
                    setScanned(false);
                }}
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
        backgroundColor: '#f8f9fa',
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
        padding: 25,
        backgroundColor: '#fff',
        borderRadius: 20,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.2,
        shadowRadius: 5,
        elevation: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    instruction: {
        marginTop: 24,
        fontSize: 16,
        color: '#555',
        textAlign: 'center',
        fontWeight: '500',
    },
    cameraContainer: {
        flex: 1,
        overflow: 'hidden',
    },
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    scanFrame: {
        width: 250,
        height: 250,
        borderWidth: 0,
        borderColor: 'transparent',
        backgroundColor: 'transparent',
        position: 'relative',
    },
    cornerTL: {
        position: 'absolute',
        top: 0,
        left: 0,
        width: 40,
        height: 40,
        borderTopWidth: 4,
        borderLeftWidth: 4,
        borderColor: '#2196F3',
        borderTopLeftRadius: 12,
    },
    cornerTR: {
        position: 'absolute',
        top: 0,
        right: 0,
        width: 40,
        height: 40,
        borderTopWidth: 4,
        borderRightWidth: 4,
        borderColor: '#2196F3',
        borderTopRightRadius: 12,
    },
    cornerBL: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        width: 40,
        height: 40,
        borderBottomWidth: 4,
        borderLeftWidth: 4,
        borderColor: '#2196F3',
        borderBottomLeftRadius: 12,
    },
    cornerBR: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 40,
        height: 40,
        borderBottomWidth: 4,
        borderRightWidth: 4,
        borderColor: '#2196F3',
        borderBottomRightRadius: 12,
    },
    scanText: {
        color: '#fff',
        fontSize: 16,
        marginTop: 20,
        fontWeight: '500',
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
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
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
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.2,
        shadowRadius: 3.84,
        elevation: 5,
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
        marginTop: 12,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
        color: '#555',
    },
    shareButtonAlt: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#2196F3',
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 10,
        marginTop: 24,
    },
    shareButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '500',
        marginLeft: 8,
    },
    permissionButton: {
        backgroundColor: '#2196F3',
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 10,
        marginTop: 20,
    },
    permissionButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '500',
    },
    userIdContainer: {
        padding: 20,
        alignItems: 'center',
    },
    userIdTitle: {
        fontSize: 16,
        color: '#555',
        marginBottom: 10,
    },
    userId: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#2196F3',
        textAlign: 'center',
        padding: 10,
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        backgroundColor: '#f8f9fa',
        minWidth: 200,
    },
});

export default QRCodeScreen; 