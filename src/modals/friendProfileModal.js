import React from 'react';
import {
    Modal,
    View,
    Text,
    Image,
    TouchableOpacity,
    StyleSheet,
    Dimensions,
    ScrollView
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const FriendProfileModal = ({ visible, onClose, friend }) => {
    if (!friend) return null;

    const { informations } = friend;

    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="slide"
            onRequestClose={onClose}
        >
            <View style={styles.modalContainer}>
                <View style={styles.modalContent}>
                    <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                        <Ionicons name="close" size={24} color="#333" />
                    </TouchableOpacity>

                    <ScrollView
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={styles.scrollContent}
                    >
                        <Image
                            source={
                                friend.profilePicture
                                    ? { uri: friend.profilePicture }
                                    : { uri: `https://ui-avatars.com/api/?name=${friend.name}&background=random` }
                            }
                            style={styles.profileImage}
                        />

                        <Text style={styles.name}>{informations?.name || friend.name}</Text>

                        {informations?.username && (
                            <Text style={styles.username}>@{informations.username}</Text>
                        )}

                        <View style={styles.statsContainer}>
                            <View style={styles.statItem}>
                                <Text style={styles.statNumber}>{friend.friends?.length || 0}</Text>
                                <Text style={styles.statLabel}>Arkadaş</Text>
                            </View>
                        </View>

                        {informations?.bio && (
                            <View style={styles.bioContainer}>
                                <Text style={styles.bioText}>{informations.bio}</Text>
                            </View>
                        )}

                        <View style={styles.infoContainer}>
                            {informations?.email && (
                                <View style={styles.infoRow}>
                                    <Ionicons name="mail-outline" size={20} color="#7F8C8D" />
                                    <Text style={styles.infoText}>{informations.email}</Text>
                                </View>
                            )}

                            {informations?.phone && (
                                <View style={styles.infoRow}>
                                    <Ionicons name="call-outline" size={20} color="#7F8C8D" />
                                    <Text style={styles.infoText}>{informations.phone}</Text>
                                </View>
                            )}

                            {informations?.instagram && (
                                <View style={styles.infoRow}>
                                    <MaterialCommunityIcons name="instagram" size={20} color="#7F8C8D" />
                                    <Text style={styles.infoText}>@{informations.instagram}</Text>
                                </View>
                            )}

                            {informations?.location && (
                                <View style={styles.infoRow}>
                                    <Ionicons name="location-outline" size={20} color="#7F8C8D" />
                                    <Text style={styles.infoText}>{informations.location}</Text>
                                </View>
                            )}
                        </View>

                        {informations?.interests && informations.interests.length > 0 && (
                            <View style={styles.interestsContainer}>
                                <Text style={styles.sectionTitle}>İlgi Alanları</Text>
                                <View style={styles.interestTags}>
                                    {informations.interests.map((interest, index) => (
                                        <View key={index} style={styles.interestTag}>
                                            <Text style={styles.interestText}>{interest}</Text>
                                        </View>
                                    ))}
                                </View>
                            </View>
                        )}
                    </ScrollView>

                    <View style={styles.actionButtons}>
                        <TouchableOpacity style={[styles.actionButton, { backgroundColor: '#4CAF50' }]}>
                            <Ionicons name="location-outline" size={24} color="#FFF" />
                            <Text style={styles.actionButtonText}>Konum Paylaş</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={[styles.actionButton, { backgroundColor: '#2196F3' }]}>
                            <Ionicons name="chatbubble-outline" size={24} color="#FFF" />
                            <Text style={styles.actionButtonText}>Mesaj</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={[styles.actionButton, { backgroundColor: '#9C27B0' }]}>
                            <Ionicons name="videocam-outline" size={24} color="#FFF" />
                            <Text style={styles.actionButtonText}>Görüntülü</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalContainer: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#FFF',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 20,
        height: '80%',
    },
    scrollContent: {
        alignItems: 'center',
        paddingBottom: 20,
    },
    closeButton: {
        position: 'absolute',
        right: 20,
        top: 20,
        zIndex: 1,
    },
    profileImage: {
        width: 120,
        height: 120,
        borderRadius: 60,
        marginTop: 20,
        marginBottom: 16,
    },
    name: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#2C3E50',
        marginBottom: 8,
    },
    username: {
        fontSize: 16,
        color: '#7F8C8D',
        marginBottom: 16,
    },
    statsContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        width: '100%',
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
        marginBottom: 16,
    },
    statItem: {
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    statNumber: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#2C3E50',
    },
    statLabel: {
        fontSize: 14,
        color: '#7F8C8D',
        marginTop: 4,
    },
    bioContainer: {
        backgroundColor: '#F8F9FA',
        padding: 16,
        borderRadius: 12,
        width: '100%',
        marginVertical: 12,
    },
    bioText: {
        fontSize: 16,
        color: '#2C3E50',
        textAlign: 'center',
        lineHeight: 22,
    },
    infoContainer: {
        width: '100%',
        marginVertical: 12,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 16,
    },
    infoText: {
        fontSize: 16,
        color: '#2C3E50',
        marginLeft: 12,
    },
    interestsContainer: {
        width: '100%',
        marginTop: 12,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#2C3E50',
        marginBottom: 12,
        paddingHorizontal: 16,
    },
    interestTags: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        paddingHorizontal: 12,
    },
    interestTag: {
        backgroundColor: '#E8F5E9',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        margin: 4,
    },
    interestText: {
        color: '#4CAF50',
        fontSize: 14,
    },
    actionButtons: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        width: '100%',
        paddingVertical: 16,
        borderTopWidth: 1,
        borderTopColor: '#E0E0E0',
        backgroundColor: '#FFF',
    },
    actionButton: {
        alignItems: 'center',
        padding: 12,
        borderRadius: 12,
        width: width / 3.5,
    },
    actionButtonText: {
        color: '#FFF',
        marginTop: 4,
        fontSize: 12,
        fontWeight: '600',
    },
});

export default FriendProfileModal;