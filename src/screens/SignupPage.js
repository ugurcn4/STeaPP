import React, { useState } from 'react';
import { StyleSheet, View, Text, Image, SafeAreaView, ScrollView, Pressable } from 'react-native';
import { ReusableTextInput, ReusablePressable, LoadingComponent } from '../components/index';
import { useDispatch, useSelector } from 'react-redux';
import { register } from '../redux/userSlice';



const SignupPage = ({ navigation }) => {
    const [username, setUserName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [verifyPassword, setVerifyPassword] = useState('');
    const [errorMessage, setErrorMessage] = useState('');

    const dispatch = useDispatch(); // useDispatch fonksiyonunu kullanarak register fonksiyonunu çağırıldı
    const { Loading } = useSelector(state => state.user); // Kullanıcı bilgilerini almak için useSelector kullanımı

    // Kullanıcı kayıt işlemleri
    const handleRegister = () => {
        if (password !== verifyPassword) {
            setErrorMessage('Şifreler uyuşmuyor');
            return;
        }
        // Şifreler uyuşuyorsa, hata mesajını temizle
        setErrorMessage('');
        dispatch(register({ email, password, username }));
    }

    if (Loading) {
        return <LoadingComponent />
    }

    return (
        <ScrollView contentContainerStyle={styles.scrollContainer}>
            <SafeAreaView style={styles.container}>
                <Text style={styles.title}>Kayıt Ol</Text>
                <ReusableTextInput
                    onChangeText={setUserName}
                    value={username}
                    inputMode='text'
                    placeholder='Kullanıcı Adı'
                    setWidth={'80%'}
                    placeholderTextColor='black'
                />
                <ReusableTextInput
                    onChangeText={setEmail}
                    value={email}
                    inputMode='email'
                    placeholder='E-Posta'
                    setWidth={'80%'}
                    placeholderTextColor='black'
                />
                <ReusableTextInput
                    onChangeText={setPassword}
                    value={password}
                    inputMode='password'
                    placeholder='Şifre'
                    secureTextEntry={true}
                    setWidth={'80%'}
                    placeholderTextColor='black'
                />
                <ReusableTextInput
                    onChangeText={setVerifyPassword}
                    value={verifyPassword}
                    inputMode='password'
                    placeholder='Şifreyi Doğrula'
                    secureTextEntry={true}
                    setWidth={'80%'}
                    placeholderTextColor='black'
                />
                {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

                <ReusablePressable
                    title='Kayıt Ol'
                    backgroundColor='black'
                    pressedColor='gray'
                    style={styles.signupButton}
                    setWidth={'80%'}
                    onPress={handleRegister}
                />

                <View style={styles.LoginOptionsContainer}>
                    <View style={styles.textContainer}>
                        <Text>Kaydolarak koşullarımızı kabul etmiş olursunuz</Text>
                        <Text>Ya da</Text>
                    </View>
                    <View style={styles.LoginImageContainer}>
                        <Image style={styles.Loginimage} source={require('../../assets/images/facebook.png')} />

                        <Image style={styles.Loginimage} source={require('../../assets/images/search.png')} />

                        <Image style={styles.Loginimage} source={require('../../assets/images/apple-logo.png')} />
                    </View>
                    <Text style={styles.loginText}>Zaten bir hesabınız var mı?
                        <Text
                            style={styles.loginLink}
                            onPress={() => navigation.navigate("Giriş Yap")}
                        >
                            Giriş Yap</Text>
                    </Text>
                </View>
            </SafeAreaView>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    scrollContainer: {
        flexGrow: 1,
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
    },
    container: {
        flex: 1,
        backgroundColor: '#FDD32A',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
    },
    LoginOptionsContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 20,
    },
    textContainer: {
        alignItems: 'center',
        marginBottom: 20,
        width: '85%',

    },
    LoginImageContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    Loginimage: {
        height: 60,
        width: 60,
        marginHorizontal: 10,
    },
    loginText: {
        textAlign: 'center',
        marginTop: 10,
    },
    loginLink: {
        fontWeight: 'bold',
        color: 'black',
        textDecorationLine: 'underline',
    },
    signupButton: {
        marginTop: 20,
        width: '80%',
    },
    errorText: {
        color: 'red',
        marginTop: 10,
    },
});

export default SignupPage;