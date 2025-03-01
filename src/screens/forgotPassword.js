import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    SafeAreaView,
    StatusBar,
    KeyboardAvoidingView,
    ScrollView,
    Platform,
} from 'react-native';
import { useDispatch } from 'react-redux';
import { sendPasswordResetEmail } from '../redux/userSlice';
import Toast from 'react-native-toast-message';
import { Ionicons } from '@expo/vector-icons';

const ForgotPassword = ({ navigation }) => {
    const [email, setEmail] = useState('');
    const dispatch = useDispatch();

    useEffect(() => {
        navigation.setOptions({
            headerShown: false
        });
    }, [navigation]);

    const handlePasswordReset = () => {
        dispatch(sendPasswordResetEmail(email))
            .unwrap()
            .then(() => {
                Toast.show({
                    type: 'success',
                    position: 'top',
                    text1: 'Başarılı',
                    text2: 'Şifre sıfırlama e-postası gönderildi.',
                    visibilityTime: 2000,
                    autoHide: true,
                });
                navigation.navigate("Giriş Yap");
            })
            .catch((error) => {
                Toast.show({
                    type: 'error',
                    position: 'top',
                    text1: 'Hata',
                    text2: 'Şifre sıfırlama e-postası gönderilemedi.',
                    visibilityTime: 2000,
                    autoHide: true,
                });
            });
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" />
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardView}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContainer}
                    showsVerticalScrollIndicator={false}
                    bounces={false}
                >
                    <View style={styles.mainContent}>
                        <View style={styles.header}>
                            <Text style={styles.title}>Şifremi Unuttum</Text>
                            <Text style={styles.subtitle}>
                                E-posta adresinizi girin, size şifre sıfırlama bağlantısı gönderelim
                            </Text>
                        </View>

                        <View style={styles.formContainer}>
                            <TextInput
                                style={styles.input}
                                placeholder="E-posta adresinizi girin"
                                value={email}
                                onChangeText={setEmail}
                                keyboardType="email-address"
                                autoCapitalize="none"
                                placeholderTextColor="#A0A0A0"
                            />

                            <TouchableOpacity
                                style={styles.resetButton}
                                onPress={handlePasswordReset}
                            >
                                <Text style={styles.resetButtonText}>
                                    SIFIRLA
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.backButton}
                                onPress={() => navigation.goBack()}
                            >
                                <Text style={styles.backButtonText}>
                                    Giriş Sayfasına Dön
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View style={styles.infoSection}>
                        <Text style={styles.infoTitle}>Yardımcı Bilgiler</Text>

                        <View style={styles.infoContainer}>
                            <Ionicons name="mail-outline" size={24} color="#FF6B6B" />
                            <Text style={styles.infoText}>
                                Şifre sıfırlama bağlantısı e-posta adresinize gönderilecektir.
                            </Text>
                        </View>

                        <View style={styles.infoContainer}>
                            <Ionicons name="time-outline" size={24} color="#4ECDC4" />
                            <Text style={styles.infoText}>
                                Bağlantı 24 saat boyunca geçerli olacaktır.
                            </Text>
                        </View>

                        <View style={styles.infoContainer}>
                            <Ionicons name="shield-checkmark-outline" size={24} color="#82C596" />
                            <Text style={styles.infoText}>
                                Güvenliğiniz için yeni şifreniz eskisinden farklı olmalıdır.
                            </Text>
                        </View>

                        <View style={styles.helpSection}>
                            <Text style={styles.helpTitle}>Hala sorun mu yaşıyorsunuz?</Text>
                            <TouchableOpacity
                                style={styles.helpButton}
                                onPress={() => {/* Destek sayfasına yönlendirme */ }}
                            >
                                <Ionicons name="help-circle-outline" size={20} color="#666666" />
                                <Text style={styles.helpButtonText}>Destek Ekibine Ulaşın</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    keyboardView: {
        flex: 1,
    },
    scrollContainer: {
        flexGrow: 1,
        justifyContent: 'space-between',
    },
    mainContent: {
        paddingTop: 60,
        paddingBottom: 20,
    },
    header: {
        paddingHorizontal: 24,
        marginBottom: 40,
    },
    title: {
        fontSize: 32,
        fontWeight: '700',
        color: '#1A1A1A',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: '#666666',
        lineHeight: 24,
    },
    formContainer: {
        paddingHorizontal: 24,
    },
    input: {
        height: 56,
        backgroundColor: '#F5F5F5',
        borderRadius: 12,
        paddingHorizontal: 16,
        fontSize: 16,
        color: '#1A1A1A',
        marginBottom: 24,
    },
    resetButton: {
        height: 56,
        backgroundColor: '#FF6B6B',
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    resetButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
    backButton: {
        alignItems: 'center',
        padding: 12,
    },
    backButtonText: {
        color: '#666666',
        fontSize: 14,
        fontWeight: '500',
    },
    infoSection: {
        backgroundColor: '#F8F9FF',
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        padding: 24,
        paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    },
    infoTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1A1A1A',
        marginBottom: 16,
    },
    infoContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 3,
    },
    infoText: {
        flex: 1,
        marginLeft: 12,
        color: '#666666',
        fontSize: 14,
        lineHeight: 20,
    },
    helpSection: {
        marginTop: 24,
        alignItems: 'center',
    },
    helpTitle: {
        fontSize: 16,
        color: '#666666',
        marginBottom: 12,
    },
    helpButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 20,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 3,
    },
    helpButtonText: {
        color: '#666666',
        fontSize: 14,
        fontWeight: '500',
        marginLeft: 8,
    },
});

export default ForgotPassword;
