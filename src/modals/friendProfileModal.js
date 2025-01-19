import React from 'react';
import { Modal, View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const FriendProfileModal = ({ visible, onClose, friend }) => {
    if (!friend) return null;

    return (
        <Modal
            animationType="fade"
            transparent={true}
            visible={visible}
            onRequestClose={onClose}
        >
            <View style={styles.modalContainer}>
                <View style={styles.modalContent}>
                    <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                        <Ionicons name="close" size={24} color="#666" />
                    </TouchableOpacity>

                    <View style={styles.profileHeader}>
                        <Image
                            source={friend.profilePicture
                                ? { uri: friend.profilePicture }
                                : { uri: `https://ui-avatars.com/api/?name=${friend.name.slice(0, 2)}&background=4CAF50&color=fff&size=128` }
                            }
                            style={styles.profileImage}
                        />
                        <Text style={styles.name}>{friend.name}</Text>
                        {friend.bio && <Text style={styles.bio}>{friend.bio}</Text>}
                    </View>

                    <View style={styles.infoSection}>
                        {friend.phoneNumber && (
                            <View style={styles.infoRow}>
                                <Ionicons name="call-outline" size={20} color="#4CAF50" />
                                <Text style={styles.infoText}>{friend.phoneNumber}</Text>
                            </View>
                        )}

                        {friend.insta && (
                            <View style={styles.infoRow}>
                                <Ionicons name="logo-instagram" size={20} color="#4CAF50" />
                                <Text style={styles.infoText}>{friend.insta}</Text>
                            </View>
                        )}

                        {friend.email && (
                            <View style={styles.infoRow}>
                                <Ionicons name="mail-outline" size={20} color="#4CAF50" />
                                <Text style={styles.infoText}>{friend.email}</Text>
                            </View>
                        )}
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContent: {
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 20,
        width: '90%',
        maxWidth: 400,
        elevation: 5,
    },
    closeButton: {
        position: 'absolute',
        right: 15,
        top: 15,
        zIndex: 1,
    },
    profileHeader: {
        alignItems: 'center',
        marginTop: 20,
        marginBottom: 30,
    },
    profileImage: {
        width: 120,
        height: 120,
        borderRadius: 60,
        marginBottom: 15,
    },
    name: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 10,
    },
    bio: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        paddingHorizontal: 20,
    },
    infoSection: {
        marginTop: 20,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    infoText: {
        marginLeft: 15,
        fontSize: 16,
        color: '#333',
    },
});

export default FriendProfileModal;