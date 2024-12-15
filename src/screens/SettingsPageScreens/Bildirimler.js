import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const Bildirimler = () => {
    return (
        <View style={styles.container}>
            <Text style={styles.header}>Bildirimler</Text>
            {/* Bildirimler içeriği buraya gelecek */}
        </View>
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
        textAlign: 'left',
        marginVertical: 20,
    },
});

export default Bildirimler;