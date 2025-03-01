import React from 'react';
import {
    Modal,
    View,
    Text,
    Image,
    TouchableOpacity,
    StyleSheet,
    Dimensions,
    ScrollView,
    Animated,
    Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

const FriendProfileModal = ({ visible, onClose, friend }) => {
    if (!friend) return null;

    const { informations } = friend;

    const renderActionButton = (icon, text, color, gradientColors) => (
        <TouchableOpacity style={styles.actionButton}>
            <LinearGradient
                colors={gradientColors}
                style={styles.actionButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            >
                <Ionicons name={icon} size={24} color="#FFF" />
                <Text style={styles.actionButtonText}>{text}</Text>
            </LinearGradient>
        </TouchableOpacity>
    );

    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="slide"
            onRequestClose={onClose}
        >
            <View style={styles.modalContainer}>
                <View style={styles.modalContent}>
                    {/* Header */}
                    <View style={styles.headerSection}>
                        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                            <Ionicons name="close" size={24} color="#333" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={styles.scrollContent}
                    >
                        {/* Profile Header Section */}
                        <View style={styles.profileHeader}>
                            <View style={styles.profileImageContainer}>
                                <Image
                                    source={
                                        friend.profilePicture
                                            ? { uri: friend.profilePicture }
                                            : { uri: `https://ui-avatars.com/api/?name=${friend.name}&background=random` }
                                    }
                                    style={styles.profileImage}
                                />
                                <View style={styles.onlineIndicator} />
                            </View>

                            <View style={styles.profileInfo}>
                                <Text style={styles.name}>{informations?.name || friend.name}</Text>
                                {informations?.username && (
                                    <Text style={styles.username}>@{informations.username}</Text>
                                )}
                                {informations?.email && (
                                    <Text style={styles.email}>{informations.email}</Text>
                                )}
                                {informations?.bio && (
                                    <Text style={styles.bioText} numberOfLines={2}>{informations.bio}</Text>
                                )}
                            </View>
                        </View>

                        {/* Stats Cards */}
                        <View style={styles.statsContainer}>
                            <View style={styles.statCard}>
                                <Text style={styles.statNumber}>{friend.friends?.length || 0}</Text>
                                <Text style={styles.statLabel}>Arkadaş</Text>
                            </View>
                            <View style={styles.statCard}>
                                <Text style={styles.statNumber}>12</Text>
                                <Text style={styles.statLabel}>Paylaşım</Text>
                            </View>
                            <View style={styles.statCard}>
                                <Text style={styles.statNumber}>85%</Text>
                                <Text style={styles.statLabel}>Aktiflik</Text>
                            </View>
                        </View>

                        {/* Recent Activities */}
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Son Aktiviteler</Text>
                            <View style={styles.activitiesList}>
                                <View style={styles.activityItem}>
                                    <View style={[styles.activityIcon, { backgroundColor: '#E3F2FD' }]}>
                                        <Ionicons name="location" size={20} color="#2196F3" />
                                    </View>
                                    <View style={styles.activityInfo}>
                                        <Text style={styles.activityText}>İstanbul'da yeni bir yer keşfetti</Text>
                                        <Text style={styles.activityTime}>2 saat önce</Text>
                                    </View>
                                </View>
                                <View style={styles.activityItem}>
                                    <View style={[styles.activityIcon, { backgroundColor: '#E8F5E9' }]}>
                                        <Ionicons name="camera" size={20} color="#4CAF50" />
                                    </View>
                                    <View style={styles.activityInfo}>
                                        <Text style={styles.activityText}>Yeni bir fotoğraf paylaştı</Text>
                                        <Text style={styles.activityTime}>5 saat önce</Text>
                                    </View>
                                </View>
                            </View>
                        </View>

                        {/* Mutual Friends */}
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Ortak Arkadaşlar</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.mutualFriends}>
                                {[1, 2, 3, 4, 5].map((_, index) => (
                                    <View key={index} style={styles.mutualFriendItem}>
                                        <Image
                                            source={{ uri: `https://ui-avatars.com/api/?name=User${index}&background=random` }}
                                            style={styles.mutualFriendImage}
                                        />
                                        <Text style={styles.mutualFriendName}>Kullanıcı {index + 1}</Text>
                                    </View>
                                ))}
                            </ScrollView>
                        </View>

                        {/* Interests Section */}
                        {informations?.interests && informations.interests.length > 0 && (
                            <View style={styles.section}>
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

                    {/* Action Buttons */}
                    <View style={styles.actionButtons}>
                        {renderActionButton(
                            "location-outline",
                            "Konum",
                            "#4CAF50",
                            ['#4CAF50', '#388E3C']
                        )}
                        {renderActionButton(
                            "chatbubble-outline",
                            "Mesaj",
                            "#2196F3",
                            ['#2196F3', '#1976D2']
                        )}
                        {renderActionButton(
                            "videocam-outline",
                            "Arama",
                            "#9C27B0",
                            ['#9C27B0', '#7B1FA2']
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
        backgroundColor: 'rgba(0,0,0,0.3)',
    },
    modalContent: {
        flex: 1,
        backgroundColor: '#FFF',
        borderTopLeftRadius: 25,
        borderTopRightRadius: 25,
        marginTop: 50,
    },
    headerSection: {
        paddingTop: Platform.OS === 'ios' ? 20 : 15,
        paddingHorizontal: 20,
        flexDirection: 'row',
        justifyContent: 'flex-end',
    },
    closeButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#F5F5F5',
        justifyContent: 'center',
        alignItems: 'center',
    },
    scrollContent: {
        paddingBottom: 100,
    },
    profileHeader: {
        flexDirection: 'row',
        padding: 20,
        alignItems: 'center',
    },
    profileImageContainer: {
        position: 'relative',
    },
    profileImage: {
        width: 100,
        height: 100,
        borderRadius: 50,
        borderWidth: 3,
        borderColor: '#FFF',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 5,
    },
    onlineIndicator: {
        position: 'absolute',
        bottom: 5,
        right: 5,
        width: 16,
        height: 16,
        borderRadius: 8,
        backgroundColor: '#4CAF50',
        borderWidth: 2,
        borderColor: '#FFF',
    },
    profileInfo: {
        flex: 1,
        marginLeft: 15,
    },
    name: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 4,
    },
    username: {
        fontSize: 16,
        color: '#666',
        marginBottom: 4,
    },
    email: {
        fontSize: 14,
        color: '#666',
        marginBottom: 8,
    },
    bioText: {
        fontSize: 14,
        color: '#666',
        lineHeight: 20,
    },
    statsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingVertical: 20,
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderColor: '#F0F0F0',
        marginHorizontal: 20,
    },
    statCard: {
        alignItems: 'center',
    },
    statNumber: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
    },
    statLabel: {
        fontSize: 14,
        color: '#666',
        marginTop: 4,
    },
    section: {
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
        marginBottom: 16,
    },
    activitiesList: {
        gap: 16,
    },
    activityItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    activityIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    activityInfo: {
        flex: 1,
    },
    activityText: {
        fontSize: 14,
        color: '#333',
        marginBottom: 4,
    },
    activityTime: {
        fontSize: 12,
        color: '#666',
    },
    mutualFriends: {
        flexDirection: 'row',
    },
    mutualFriendItem: {
        alignItems: 'center',
        marginRight: 16,
    },
    mutualFriendImage: {
        width: 60,
        height: 60,
        borderRadius: 30,
        marginBottom: 8,
    },
    mutualFriendName: {
        fontSize: 12,
        color: '#666',
        textAlign: 'center',
    },
    interestTags: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginTop: 8,
    },
    interestTag: {
        backgroundColor: '#F5F5F5',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        margin: 4,
    },
    interestText: {
        color: '#666',
        fontSize: 14,
    },
    actionButtons: {
        position: 'absolute',
        bottom: Platform.OS === 'ios' ? 40 : 20,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingHorizontal: 20,
        backgroundColor: '#FFF',
        borderTopWidth: 1,
        borderTopColor: '#F0F0F0',
        paddingTop: 16,
    },
    actionButton: {
        flex: 1,
        marginHorizontal: 6,
        height: 45,
        borderRadius: 22.5,
        overflow: 'hidden',
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.2,
                shadowRadius: 8,
            },
            android: {
                elevation: 8,
            },
        }),
    },
    actionButtonGradient: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    actionButtonText: {
        color: '#FFF',
        fontSize: 15,
        fontWeight: '600',
        marginLeft: 8,
    },
});

export default FriendProfileModal;