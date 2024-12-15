import React from 'react';
import { Pressable, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const ReusablePressable = ({ onPress, title, backgroundColor, pressedColor, style, iconName }) => {
    return (
        <Pressable
            onPress={onPress}
            style={({ pressed }) => [{
                backgroundColor: pressed ? pressedColor : backgroundColor
            }, styles.button, style]}

        >
            <Ionicons name={iconName} size={24} color='white' />
            <Text style={styles.textStyle}>{title}</Text>
        </Pressable>
    );
};

const styles = StyleSheet.create({
    button: {
        padding: 1,
        borderRadius: 10,
        alignContent: 'center',
        alignItems: 'center',
        justifyContent: 'center',
    },
    textStyle: {
        alignContent: 'center',
        textAlign: 'center',
        fontWeight: 'bold',
        color: 'white',
        marginBottom: 10,
    },
});

export default ReusablePressable;