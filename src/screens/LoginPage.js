import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ImageBackground, Image, Text, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { ReusableTextInput, ReusablePressable, LoadingComponent } from '../components/index';
import { login, autoLogin } from '../redux/userSlice';
import { Ionicons } from '@expo/vector-icons';

const LoginPage = ({ navigation }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [showPassword, setShowPassword] = useState(false);



    // Kullanıcının giriş yapma durumunu kontrol etmek için useSelector 
    const loginStatus = useSelector((state) => state.user.status);

    // useDispatch fonksiyonunu kullanarak login fonksiyonu
    const dispatch = useDispatch();

    useEffect(() => {
        // Kullanıcı giriş yaptıysa anasayfaya yönlendirme
        dispatch(autoLogin());
    }, []);

    // Kullanıcı giriş yaparken loading ekranını gösterme
    useEffect(() => {
        if (loginStatus === 'loading') {
            setLoading(true);
        } else {
            setLoading(false);
        }
    }, [loginStatus]);

    const handleLogin = () => {
        setLoading(true);
        dispatch(login({ email, password }))
            .unwrap()
            .catch((error) => {
                setErrorMessage('Giriş başarısız. Lütfen e-posta ve şifrenizi kontrol edin.');
                setLoading(false);
                Alert.alert('Hata', 'Giriş başarısız. Lütfen e-posta ve şifrenizi kontrol edin.');
            });
    };

    return (
        <ScrollView contentContainerStyle={styles.scrollContainer}>
            <View style={styles.container}>
                <ImageBackground source={require('../../assets/images/map_background.jpg')} style={styles.background}>
                    <View style={styles.inputContainer}>
                        <View style={styles.logoContainer}>
                            <Text style={styles.welcome}>Hoş Geldiniz</Text>
                            <Image source={require('../../assets/images/logo.png')} style={styles.logo} />
                        </View>
                        <ReusableTextInput
                            value={email}
                            onChangeText={setEmail}
                            inputMode='email'
                            placeholder='E-Posta'
                            placeholderTextColor={'black'}
                            secureTextEntry={false}
                        />
                        <ReusableTextInput
                            value={password}
                            onChangeText={setPassword}
                            inputMode='password'
                            placeholder='Şifre'
                            placeholderTextColor={'black'}
                            secureTextEntry={!showPassword}
                            style={styles.passwordInput}
                        />
                    </View>
                    {/* Şifremi unuttum butonu */}
                    <ReusablePressable
                        onPress={() => navigation.navigate('ForgotPassword')} title='Şifremi Unuttum'
                        backgroundColor='green'
                        pressedColor='#4eed8b'
                        style={styles.forogotPasswordButton}
                        iconName={'lock-open'}
                    />

                    <View style={styles.buttonContainer}>
                        <ReusablePressable
                            onPress={() => navigation.navigate('Kayıt Ol')}
                            title='Kayıt Ol'
                            backgroundColor='blue'
                            pressedColor='#3c81f0'
                            style={styles.registerButton}
                            iconName={'person-add'}
                        />
                        <ReusablePressable
                            onPress={handleLogin}
                            title='Giriş Yap'
                            backgroundColor='green'
                            pressedColor='#4eed8b'
                            style={styles.loginButton}
                            iconName={'log-in'}
                        />
                    </View>

                    {loading && (
                        <LoadingComponent changeIsLoading={() => setLoading(false)} />
                    )}
                </ImageBackground>
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    scrollContainer: {
        flexGrow: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
        height: '100%',
    },
    background: {
        flex: 1,
        width: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    inputContainer: {
        width: '80%',
        marginBottom: 20,
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '80%',
    },
    registerButton: {
        flex: 1,
        marginRight: 10,
    },
    loginButton: {
        flex: 1,
        marginLeft: 10,
    },
    logoContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 50,
        fontSize: 'bold',
    },
    logo: {
        width: 150,
        height: 150,
    },
    welcome: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    forogotPasswordButton: {
        padding: 5,
        backgroundColor: 'gray',
        borderRadius: 5,
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'center',
        marginBottom: 20,
    },
    iconContainer: {
        padding: 10,
    },

});

export default LoginPage;