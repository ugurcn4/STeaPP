import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert } from 'react-native';
import { useDispatch } from 'react-redux';
import { LinearGradient } from 'expo-linear-gradient'; // Gradient efekti için
import { sendPasswordResetEmail } from '../redux/userSlice';
import Toast from 'react-native-toast-message';

const ForgotPassword = ({ navigation }) => {
    const [email, setEmail] = useState('');
    const dispatch = useDispatch();

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
                    text2: 'Şifre sıfırlama e-postası gönderilemedi. Lütfen e-posta adresinizi kontrol edin.',
                    visibilityTime: 2000,
                    autoHide: true,
                });;
            });
    };

    return (
        <LinearGradient
            colors={['#07367c', '#658cc6', '#233b5e']} // Mavi tonlarında gradient arka plan
            style={styles.container}
        >
            <View style={styles.innerContainer}>
                <Text style={styles.header}>Şifremi Unuttum</Text>
                <TextInput
                    style={styles.input}
                    placeholder="E-posta"
                    placeholderTextColor="#ddd"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                />
                <TouchableOpacity onPress={handlePasswordReset} style={styles.button}>
                    <Text style={styles.buttonText}>Şifre Sıfırlama E-postası Gönder</Text>
                </TouchableOpacity>
            </View>
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    innerContainer: {
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        padding: 20,
        borderRadius: 20,
        width: '90%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 10,
    },
    header: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 30,
        textAlign: 'center',
    },
    input: {
        width: '100%',
        padding: 15,
        borderWidth: 1,
        borderColor: '#fff',
        borderRadius: 10,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        color: '#fff',
        marginBottom: 20,
    },
    button: {
        width: '100%',
        padding: 15,
        backgroundColor: '#3b5998',
        borderRadius: 10,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 10,
    },
    buttonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
    },
});

export default ForgotPassword;
