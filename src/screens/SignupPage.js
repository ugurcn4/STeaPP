import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    SafeAreaView,
    StatusBar,
    KeyboardAvoidingView,
    ScrollView,
    Platform,
    ActivityIndicator,
    TouchableWithoutFeedback,
    Keyboard,
    StyleSheet
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import { register } from '../redux/userSlice';

const SignupPage = ({ navigation }) => {
    const [username, setUserName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [verifyPassword, setVerifyPassword] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showVerifyPassword, setShowVerifyPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const dispatch = useDispatch();
    const { Loading } = useSelector(state => state.user);

    useEffect(() => {
        navigation.setOptions({
            headerShown: false
        });
    }, [navigation]);

    // Kullanıcı adı doğrulama
    const validateUsername = (username) => {
        // Türkçe karakterler ve diğer geçerli karakterler için regex
        const usernameRegex = /^[a-zA-ZğĞüÜşŞıİöÖçÇ0-9_]{3,20}$/;
        if (!usernameRegex.test(username)) {
            return 'Kullanıcı adı 3-20 karakter arasında olmalı ve sadece harf, rakam ve alt çizgi içerebilir';
        }
        return '';
    };

    // Email doğrulama
    const validateEmail = (email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return 'Geçerli bir e-posta adresi giriniz';
        }
        return '';
    };

    // Şifre doğrulama
    const validatePassword = (password) => {
        if (password.length < 6) {
            return 'Şifre en az 6 karakter olmalıdır';
        }
        if (!/[A-Z]/.test(password)) {
            return 'Şifre en az bir büyük harf içermelidir';
        }
        if (!/[0-9]/.test(password)) {
            return 'Şifre en az bir rakam içermelidir';
        }
        return '';
    };

    const handleRegister = async () => {
        setIsLoading(true);
        setErrorMessage('');

        // Tüm alanların dolu olduğunu kontrol et
        if (!username || !email || !password || !verifyPassword) {
            setErrorMessage('Lütfen tüm alanları doldurunuz');
            setIsLoading(false);
            return;
        }

        // Kullanıcı adı doğrulama
        const usernameError = validateUsername(username);
        if (usernameError) {
            setErrorMessage(usernameError);
            setIsLoading(false);
            return;
        }

        // Email doğrulama
        const emailError = validateEmail(email);
        if (emailError) {
            setErrorMessage(emailError);
            setIsLoading(false);
            return;
        }

        // Şifre doğrulama
        const passwordError = validatePassword(password);
        if (passwordError) {
            setErrorMessage(passwordError);
            setIsLoading(false);
            return;
        }

        // Şifre eşleşme kontrolü
        if (password !== verifyPassword) {
            setErrorMessage('Şifreler uyuşmuyor');
            setIsLoading(false);
            return;
        }

        try {
            const result = await dispatch(register({ email, password, username })).unwrap();

            if (result && result.user) {
                // Kayıt başarılı, ana sayfaya yönlendir
                navigation.reset({
                    index: 0,
                    routes: [{ name: 'MainStack' }],
                });
            }
        } catch (error) {
            setErrorMessage(error || 'Kayıt işlemi başarısız oldu. Lütfen tekrar deneyin.');
        } finally {
            setIsLoading(false);
        }
    };

    // Input değişikliklerinde hata mesajını temizle
    const handleInputChange = (setter) => (value) => {
        setErrorMessage('');
        setter(value);
    };

    return (
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
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
                                <Text style={styles.title}>Aramıza Katıl</Text>
                                <Text style={styles.subtitle}>Konumunu paylaş, arkadaşlarınla bağlantıda kal</Text>
                            </View>

                            <View style={styles.formContainer}>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Kullanıcı Adı"
                                    value={username}
                                    onChangeText={handleInputChange(setUserName)}
                                    autoCapitalize="none"
                                    placeholderTextColor="#A0A0A0"
                                />

                                <TextInput
                                    style={styles.input}
                                    placeholder="E-posta"
                                    value={email}
                                    onChangeText={handleInputChange(setEmail)}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                    placeholderTextColor="#A0A0A0"
                                />

                                <View style={styles.passwordContainer}>
                                    <TextInput
                                        style={[styles.input, styles.passwordInput]}
                                        placeholder="Şifre"
                                        value={password}
                                        onChangeText={handleInputChange(setPassword)}
                                        secureTextEntry={!showPassword}
                                        placeholderTextColor="#A0A0A0"
                                    />
                                    <TouchableOpacity
                                        onPress={() => setShowPassword(!showPassword)}
                                        style={styles.eyeIcon}
                                    >
                                        <Ionicons
                                            name={showPassword ? "eye-outline" : "eye-off-outline"}
                                            size={24}
                                            color="#A0A0A0"
                                        />
                                    </TouchableOpacity>
                                </View>

                                <View style={styles.passwordContainer}>
                                    <TextInput
                                        style={[styles.input, styles.passwordInput]}
                                        placeholder="Şifreyi Doğrula"
                                        value={verifyPassword}
                                        onChangeText={handleInputChange(setVerifyPassword)}
                                        secureTextEntry={!showVerifyPassword}
                                        placeholderTextColor="#A0A0A0"
                                    />
                                    <TouchableOpacity
                                        onPress={() => setShowVerifyPassword(!showVerifyPassword)}
                                        style={styles.eyeIcon}
                                    >
                                        <Ionicons
                                            name={showVerifyPassword ? "eye-outline" : "eye-off-outline"}
                                            size={24}
                                            color="#A0A0A0"
                                        />
                                    </TouchableOpacity>
                                </View>

                                {errorMessage ? (
                                    <Text style={styles.errorText}>{errorMessage}</Text>
                                ) : null}

                                <TouchableOpacity
                                    style={[styles.signUpButton, isLoading && styles.signUpButtonDisabled]}
                                    onPress={handleRegister}
                                    disabled={isLoading}
                                >
                                    {isLoading ? (
                                        <ActivityIndicator color="#FFF" />
                                    ) : (
                                        <Text style={styles.signUpButtonText}>KAYIT OL</Text>
                                    )}
                                </TouchableOpacity>

                                <View style={styles.loginContainer}>
                                    <Text style={styles.loginText}>Zaten hesabın var mı? </Text>
                                    <TouchableOpacity onPress={() => navigation.navigate('Giriş Yap')}>
                                        <Text style={styles.loginLink}>Giriş Yap</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>

                        <View style={styles.termsSection}>
                            <Text style={styles.termsText}>
                                Kayıt olarak,
                                <Text style={styles.termsLink}> Kullanım Koşullarını </Text>
                                ve
                                <Text style={styles.termsLink}> Gizlilik Politikasını </Text>
                                kabul etmiş olursunuz
                            </Text>
                        </View>
                    </ScrollView>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </TouchableWithoutFeedback>
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
        marginBottom: 16,
    },
    passwordContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F5F5F5',
        borderRadius: 12,
        marginBottom: 16,
    },
    passwordInput: {
        flex: 1,
        marginBottom: 0,
        backgroundColor: 'transparent',
    },
    eyeIcon: {
        padding: 16,
    },
    errorText: {
        color: '#FF6B6B',
        fontSize: 14,
        marginBottom: 16,
        textAlign: 'center',
    },
    signUpButton: {
        height: 56,
        backgroundColor: '#FF6B6B',
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 24,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    signUpButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
    loginContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    loginText: {
        color: '#666666',
        fontSize: 14,
    },
    loginLink: {
        color: '#FF6B6B',
        fontSize: 14,
        fontWeight: '600',
    },
    termsSection: {
        backgroundColor: '#F8F9FF',
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        padding: 24,
        paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    },
    termsText: {
        textAlign: 'center',
        color: '#666666',
        fontSize: 14,
        lineHeight: 20,
    },
    termsLink: {
        color: '#FF6B6B',
        fontWeight: '500',
    },
    signUpButtonDisabled: {
        opacity: 0.7,
    },
});

export default SignupPage;