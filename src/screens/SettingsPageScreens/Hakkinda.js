import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

const Hakkinda = () => {
    return (
        <ScrollView style={styles.container}>
            <Text style={styles.header}>Hakkında</Text>
            <View style={styles.section}>
                <Ionicons name="information-circle-outline" size={24} color="#1E90FF" />
                <Text style={styles.sectionTitle}>Uygulama Bilgileri</Text>
            </View>
            <Text style={styles.text}>
                Bu uygulama, kullanıcıların arkadaşlarıyla bağlantı kurmasını, mesajlaşmasını ve çeşitli etkinlikler düzenlemesini sağlar.
            </Text>
            <View style={styles.section}>
                <Ionicons name="people-outline" size={24} color="#FF6347" />
                <Text style={styles.sectionTitle}>Geliştirici Bilgileri</Text>
            </View>
            <Text style={styles.text}>
                Geliştirici: [Geliştirici Adı]
                {'\n'}İletişim: [Geliştirici E-posta]
            </Text>
            <View style={styles.section}>
                <Ionicons name="shield-checkmark-outline" size={24} color="#32CD32" />
                <Text style={styles.sectionTitle}>Gizlilik Politikası</Text>
            </View>
            <Text style={styles.text}>
                Kullanıcı verileri gizli tutulur ve üçüncü şahıslarla paylaşılmaz. Daha fazla bilgi için gizlilik politikamızı okuyun.
            </Text>
            <View style={styles.section}>
                <Ionicons name="document-text-outline" size={24} color="#FFD700" />
                <Text style={styles.sectionTitle}>Kullanım Koşulları</Text>
            </View>
            <Text style={styles.text}>
                Uygulamayı kullanarak, kullanım koşullarımızı kabul etmiş olursunuz. Detaylı bilgi için kullanım koşullarımızı okuyun.
            </Text>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: '#fff',
    },
    header: {
        fontSize: 35,
        fontWeight: 'bold',
        textAlign: 'center',
        marginVertical: 20,
    },
    section: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 10,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginLeft: 10,
    },
    text: {
        fontSize: 16,
        marginVertical: 10,
        textAlign: 'justify',
    },
});

export default Hakkinda;