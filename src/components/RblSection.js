import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

const RblSection = ({ title, iconName, onPress, iconColor }) => {
    return (
        <Pressable style={styles.section} onPress={onPress}>
            <View style={styles.iconContainer}>
                <Ionicons name={iconName} size={24} color={iconColor} />
            </View>
            <Text style={styles.sectionTitle}>{title}</Text>
            <View style={styles.iconContainerRight}>
                <Ionicons name={"chevron-forward"} size={24} color="#333" />
            </View>
        </Pressable>
    );
};

const styles = StyleSheet.create({
    section: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 18,
        backgroundColor: '#fff',
        marginBottom: 10,
        borderRadius: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 5,
    },
    iconContainer: {
        marginRight: 10,
    },
    sectionTitle: {
        flex: 1,
        fontSize: 18,
    },
    iconContainerRight: {
        marginLeft: 'auto',
    },
});

export default RblSection;