import { StyleSheet, Text, View, ActivityIndicator } from 'react-native';
import React from 'react';

const LoadingComponent = () => {
    return (
        <View style={styles.container}>
            <ActivityIndicator size={'large'} color={'black'} />
            <Text>Yükleniyor...</Text>
        </View>
    );
};

export default LoadingComponent;

const styles = StyleSheet.create({
    container: {
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
        marginTop: 20,
    },
});