import React, { useState, useEffect } from 'react';
import {
    View,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    StatusBar,
    SafeAreaView,
    ActivityIndicator,
    ScrollView,
    Image
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { login, socialLogin } from '../redux/userSlice';
import Toast from 'react-native-toast-message';
import { Ionicons, FontAwesome } from '@expo/vector-icons';
import * as AppleAuthentication from 'expo-apple-authentication';
import { getAuth, OAuthProvider, signInWithCredential, FacebookAuthProvider } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as WebBrowser from 'expo-web-browser';
import * as Facebook from 'expo-auth-session/providers/facebook';
import { ResponseType } from 'expo-auth-session';
import { useGoogleAuth, handleGoogleLogin } from '../services/googleAuthService';

// WebBrowser'ın auth session'ını kurulumu
WebBrowser.maybeCompleteAuthSession();

const LoginPage = ({ navigation }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const loginStatus = useSelector((state) => state.user.status);
    const dispatch = useDispatch();

    // Google kimlik doğrulama hook'u
    const googleAuth = useGoogleAuth();
    const googlePromptAsync = googleAuth.promptAsync;

    // Facebook kimlik doğrulama hook'u
    const [fbRequest, fbResponse, fbPromptAsync] = Facebook.useAuthRequest({
        clientId: '3564202470553580',
        responseType: ResponseType.Token,
        redirectUri: 'https://auth.expo.io/@ugurrucr/steapp'
    });

    useEffect(() => {
        setLoading(loginStatus === 'loading');
    }, [loginStatus]);

    useEffect(() => {
        navigation.setOptions({
            headerShown: false
        });
    }, [navigation]);

    // Google yanıtını işleme 
    useEffect(() => {
        if (googleAuth.response?.type === 'success') {
            try {
                // Code flow için 'authentication.accessToken' yerine 'code' kullanılır
                const authData = googleAuth.response;
                if (authData?.authentication?.accessToken) {
                    // Token akışı için
                    handleGoogleLogin(authData.authentication.accessToken, dispatch);
                } else if (authData?.authentication?.idToken) {
                    // ID token varsa
                    handleGoogleLogin(authData.authentication.idToken, dispatch);
                } else if (authData.code) {
                    // Normalde code'u sunucuya gönderip token almanız gerekir
                    // Burada demo amaçlı doğrudan token gibi kullanıyoruz
                    handleGoogleLogin(authData.code, dispatch);
                } else {
                    console.error('Google yanıtında token bilgisi bulunamadı');
                    Toast.show({
                        type: 'error',
                        text1: 'Giriş Hatası',
                        text2: 'Google ile giriş tamamlanamadı. Lütfen tekrar deneyin.',
                        position: 'top',
                    });
                }
            } catch (error) {
                console.error('Google yanıt işleme hatası:', error);
                Toast.show({
                    type: 'error',
                    text1: 'Giriş Hatası',
                    text2: 'Google ile giriş yapılırken hata oluştu',
                    position: 'top',
                });
            }
        } else if (googleAuth.response?.type === 'error') {
            console.error('Google giriş hatası:', googleAuth.response.error);
            Toast.show({
                type: 'error',
                text1: 'Giriş Hatası',
                text2: 'Google ile giriş yapılamadı',
                position: 'top',
            });
        }
    }, [googleAuth.response, dispatch]);

    // Facebook yanıtını işleme
    useEffect(() => {
        if (fbResponse?.type === 'success') {
            const { authentication } = fbResponse;
            handleFacebookSignIn(authentication.accessToken);
        }
    }, [fbResponse]);

    // Email/şifre ile giriş
    const handleLogin = async () => {
        if (!email || !password) {
            Toast.show({
                type: 'error',
                text1: 'Hata',
                text2: 'E-posta ve şifre alanları boş bırakılamaz',
                position: 'top',
            });
            return;
        }

        setLoading(true);
        try {
            await dispatch(login({ email, password })).unwrap();
        } catch (error) {
            console.error('Giriş hatası:', error);
            Toast.show({
                type: 'error',
                text1: 'Giriş Başarısız',
                text2: error || 'Lütfen bilgilerinizi kontrol edin',
                position: 'top',
            });
        } finally {
            setLoading(false);
        }
    };

    // Facebook ile giriş
    const handleFacebookSignIn = async (token) => {
        try {
            const auth = getAuth();
            const credential = FacebookAuthProvider.credential(token);
            const userCredential = await signInWithCredential(auth, credential);
            const firebaseToken = await userCredential.user.getIdToken();

            const userDataToStore = {
                token: firebaseToken,
                user: {
                    uid: userCredential.user.uid,
                    email: userCredential.user.email,
                    emailVerified: userCredential.user.emailVerified,
                    username: userCredential.user.displayName || userCredential.user.email?.split('@')[0]
                }
            };

            await AsyncStorage.setItem('userToken', firebaseToken);
            await AsyncStorage.setItem('userData', JSON.stringify(userDataToStore));
            await dispatch(socialLogin(userDataToStore)).unwrap();

            Toast.show({
                type: 'success',
                text1: 'Başarılı',
                text2: 'Facebook hesabınız ile giriş yapıldı',
                position: 'top',
            });
        } catch (error) {
            console.error('Facebook giriş hatası:', error);
            Toast.show({
                type: 'error',
                text1: 'Giriş Başarısız',
                text2: 'Facebook ile giriş yapılırken bir hata oluştu',
                position: 'top',
            });
        }
    };

    // Sosyal giriş işleyicisi
    const handleSocialLogin = async (provider) => {
        if (provider === 'Google') {
            try {

                // iOS için özel parametreler
                const promptParams = Platform.OS === 'ios'
                    ? { showInRecents: true }
                    : { showInRecents: true, useProxy: true };


                // Google giriş işlemini başlat
                const result = await googlePromptAsync(promptParams);

            } catch (error) {
                console.error('Google giriş başlatma hatası:', error);
                Toast.show({
                    type: 'error',
                    text1: 'Giriş Hatası',
                    text2: 'Google girişi başlatılamadı',
                    position: 'top',
                });
            }
        } else if (provider === 'Facebook') {
            // Facebook ile giriş için yakında bilgisi gösterilecek
            Toast.show({
                type: 'info',
                text1: 'Bilgi',
                text2: 'Facebook ile giriş yakında kullanılacaktır',
                position: 'top',
                visibilityTime: 3000,
            });
        } else if (provider === 'Apple') {
            try {
                const credential = await AppleAuthentication.signInAsync({
                    requestedScopes: [
                        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
                        AppleAuthentication.AppleAuthenticationScope.EMAIL,
                    ],
                });

                const { identityToken, nonce, email, fullName, user: appleUser } = credential;

                // Firebase ile giriş yap
                const auth = getAuth();
                const appleProvider = new OAuthProvider('apple.com');
                const firebaseCredential = appleProvider.credential({
                    idToken: identityToken,
                    rawNonce: nonce
                });

                const userCredential = await signInWithCredential(auth, firebaseCredential);
                const token = await userCredential.user.getIdToken();

                // Kullanıcı bilgilerini hazırla
                const userDataToStore = {
                    token,
                    user: {
                        uid: userCredential.user.uid,
                        email: email || userCredential.user.email,
                        emailVerified: userCredential.user.emailVerified,
                        username: fullName ? `${fullName.givenName} ${fullName.familyName}` : email?.split('@')[0]
                    }
                };

                // AsyncStorage'a kaydet
                await AsyncStorage.setItem('userToken', token);
                await AsyncStorage.setItem('userData', JSON.stringify(userDataToStore));

                // Redux store'u güncelle
                await dispatch(socialLogin(userDataToStore)).unwrap();

                Toast.show({
                    type: 'success',
                    text1: 'Başarılı',
                    text2: 'Apple hesabınız ile giriş yapıldı',
                    position: 'top',
                });

            } catch (error) {
                console.error('Apple giriş hatası:', error);
                Toast.show({
                    type: 'error',
                    text1: 'Giriş Başarısız',
                    text2: 'Apple ile giriş yapılırken bir hata oluştu. ' + error.message,
                    position: 'top',
                });
            }
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" />
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardView}
                enabled
            >
                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                    bounces={false}
                    alwaysBounceVertical={false}
                    scrollEventThrottle={16}
                    decelerationRate="normal"
                    keyboardShouldPersistTaps="handled"
                    keyboardDismissMode="on-drag"
                >
                    <View style={styles.mainContent}>
                        <View style={styles.header}>
                            <Text style={styles.title}>Hoş Geldiniz</Text>
                            <Text style={styles.subtitle}>Yerli konum tabanlı sosyal medya 🇹🇷</Text>
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

                            <View style={styles.passwordContainer}>
                                <TextInput
                                    style={[styles.input, styles.passwordInput]}
                                    placeholder="Şifrenizi girin"
                                    value={password}
                                    onChangeText={setPassword}
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

                            <TouchableOpacity
                                style={styles.forgotPassword}
                                onPress={() => navigation.navigate('ForgotPassword')}
                            >
                                <Text style={styles.forgotPasswordText}>Şifremi Unuttum</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.signInButton}
                                onPress={handleLogin}
                                disabled={loading}
                            >
                                {loading ? (
                                    <ActivityIndicator color="#FFF" />
                                ) : (
                                    <Text style={styles.signInButtonText}>GİRİŞ YAP</Text>
                                )}
                            </TouchableOpacity>

                            <View style={styles.dividerContainer}>
                                <View style={styles.divider} />
                                <Text style={styles.dividerText}>veya</Text>
                                <View style={styles.divider} />
                            </View>

                            <View style={styles.socialButtonsContainer}>
                                <TouchableOpacity
                                    style={[styles.socialButton, { backgroundColor: '#4267B2' }]}
                                    onPress={() => handleSocialLogin('Facebook')}
                                    disabled={false}
                                >
                                    <Ionicons name="logo-facebook" size={26} color="#FFF" />
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[styles.socialButton, { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#DADCE0' }]}
                                    onPress={() => handleSocialLogin('Google')}
                                    disabled={!googleAuth.request}
                                >
                                    <Image
                                        source={require('../../assets/images/google-logo.png')}
                                        style={{ width: 40, height: 40 }}
                                        resizeMode="contain"
                                    />
                                </TouchableOpacity>

                                {Platform.OS === 'ios' && (
                                    <TouchableOpacity
                                        style={[styles.socialButton, { backgroundColor: '#000000' }]}
                                        onPress={() => handleSocialLogin('Apple')}
                                    >
                                        <Ionicons name="logo-apple" size={26} color="#FFF" />
                                    </TouchableOpacity>
                                )}
                            </View>

                            <View style={styles.registerContainer}>
                                <Text style={styles.registerText}>Hesabınız yok mu? </Text>
                                <TouchableOpacity onPress={() => navigation.navigate('Kayıt Ol')}>
                                    <Text style={styles.registerLink}>Kayıt Ol</Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        <View style={styles.featureSection}>
                            <View style={styles.featureGrid}>
                                <View style={styles.featureItem}>
                                    <View style={[styles.featureIconContainer, { backgroundColor: '#FF6B6B' }]}>
                                        <Ionicons name="location-outline" size={24} color="#FFF" />
                                    </View>
                                    <Text style={styles.featureText}>Anlık Konum</Text>
                                </View>
                                <View style={styles.featureItem}>
                                    <View style={[styles.featureIconContainer, { backgroundColor: '#4ECDC4' }]}>
                                        <Ionicons name="time-outline" size={24} color="#FFF" />
                                    </View>
                                    <Text style={styles.featureText}>Geçmiş Konumlar</Text>
                                </View>
                                <View style={styles.featureItem}>
                                    <View style={[styles.featureIconContainer, { backgroundColor: '#45B7D1' }]}>
                                        <Ionicons name="people-outline" size={24} color="#FFF" />
                                    </View>
                                    <Text style={styles.featureText}>Grup Takibi</Text>
                                </View>
                                <View style={styles.featureItem}>
                                    <View style={[styles.featureIconContainer, { backgroundColor: '#82C596' }]}>
                                        <Ionicons name="shield-checkmark-outline" size={24} color="#FFF" />
                                    </View>
                                    <Text style={styles.featureText}>Güvenli Paylaşım</Text>
                                </View>
                                <View style={styles.featureItem}>
                                    <View style={[styles.featureIconContainer, { backgroundColor: '#FFD93D' }]}>
                                        <Ionicons name="notifications-outline" size={24} color="#FFF" />
                                    </View>
                                    <Text style={styles.featureText}>Anlık Bildirimler</Text>
                                </View>
                                <View style={styles.featureItem}>
                                    <View style={[styles.featureIconContainer, { backgroundColor: '#FF8C94' }]}>
                                        <Ionicons name="analytics-outline" size={24} color="#FFF" />
                                    </View>
                                    <Text style={styles.featureText}>Konum Analizi</Text>
                                </View>
                            </View>
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
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
    },
    mainContent: {
        flex: 1,
        paddingTop: Platform.OS === 'ios' ? 60 : 40,
        paddingBottom: Platform.OS === 'ios' ? 20 : 10,
    },
    header: {
        paddingHorizontal: 24,
        marginBottom: 32,
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
        marginBottom: 20,
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
    forgotPassword: {
        alignSelf: 'flex-end',
        marginBottom: 24,
    },
    forgotPasswordText: {
        color: '#666666',
        fontSize: 14,
    },
    signInButton: {
        height: 56,
        backgroundColor: '#34A853',
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 24,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 8,
    },
    signInButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
        letterSpacing: 1,
    },
    registerContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    registerText: {
        color: '#666666',
        fontSize: 14,
    },
    registerLink: {
        color: '#FF6B6B',
        fontSize: 14,
        fontWeight: '600',
    },
    featureSection: {
        backgroundColor: '#F8F9FF',
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        padding: 24,
    },
    featureGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        gap: 16,
    },
    featureItem: {
        width: '30%',
        alignItems: 'center',
    },
    featureIconContainer: {
        width: 56,
        height: 56,
        borderRadius: 28,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 8,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.15,
        shadowRadius: 3,
        elevation: 4,
    },
    featureText: {
        fontSize: 12,
        color: '#333333',
        textAlign: 'center',
        fontWeight: '500',
    },
    dividerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 20,
    },
    divider: {
        flex: 1,
        height: 1,
        backgroundColor: '#E5E5E5',
    },
    dividerText: {
        color: '#666666',
        paddingHorizontal: 16,
        fontSize: 14,
    },
    socialButtonsContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginVertical: 24,
        gap: 24,
    },
    socialButton: {
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 3,
        },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 6,
    },
});

export default LoginPage;