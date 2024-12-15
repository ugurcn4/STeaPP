import React from 'react';
import { TextInput, StyleSheet } from 'react-native';


const ReusableTextInput = ({ value, onChangeText, inputMode, placeholder, secureTextEntry, setWidth, placeholderTextColor }) => {
    return (
        <TextInput
            style={styles.input}
            value={value}
            onChangeText={onChangeText}
            inputMode={inputMode}
            placeholder={placeholder}
            secureTextEntry={secureTextEntry}
            width={setWidth}
            placeholderTextColor={placeholderTextColor}
        />

    );
};

const styles = StyleSheet.create({
    input: {
        height: 60,
        marginVertical: 12,
        borderWidth: 1,
        padding: 10,
        borderRadius: 10,
        borderColor: 'Black',
        borderWidth: 2,
        textAlign: 'center',
    },
});

export default ReusableTextInput;