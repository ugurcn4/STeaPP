import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

const Activity = ({ activity }) => {
    const navigation = useNavigation();

    const handleMessagePress = () => {
        const friend = {
            id: activity.userId,
            name: activity.userName,
            profilePicture: activity.userAvatar,
            informations: {
                name: activity.userName,
                profilePicture: activity.userAvatar
            },
            isOnline: false,
            lastSeen: null
        };

        navigation.navigate('DirectMessages', {
            screen: 'MessagesHome',
            params: {
                initialChat: friend
            }
        });
    };

    const renderActivityContent = () => {
        switch (activity.type) {
            case 'location':
                return (
                    <View style={styles.locationContainer}>
                        <Image source={{ uri: activity.locationImage }} style={styles.locationImage} />
                        <View style={styles.locationInfo}>
                            <Text style={styles.locationName}>{activity.locationName}</Text>
                            <Text style={styles.locationAddress}>{activity.address}</Text>
                            <View style={styles.statsContainer}>
                                <Ionicons name="people" size={16} color="#666" />
                                <Text style={styles.statsText}>{activity.participantCount} kişi burada</Text>
                            </View>
                        </View>
                    </View>
                );
            case 'event':
                return (
                    <View style={styles.eventContainer}>
                        <Image source={{ uri: activity.eventImage }} style={styles.eventImage} />
                        <View style={styles.eventInfo}>
                            <Text style={styles.eventName}>{activity.eventName}</Text>
                            <Text style={styles.eventDate}>{activity.date}</Text>
                            <View style={styles.participantsContainer}>
                                <View style={styles.avatarStack}>
                                    {activity.participants.slice(0, 3).map((participant, index) => (
                                        <Image
                                            key={index}
                                            source={{ uri: participant.avatar }}
                                            style={[styles.participantAvatar, { right: index * 15 }]}
                                        />
                                    ))}
                                </View>
                                <Text style={styles.participantCount}>+{activity.participantCount} katılımcı</Text>
                            </View>
                        </View>
                    </View>
                );
            case 'achievement':
                return (
                    <View style={styles.achievementContainer}>
                        <View style={styles.achievementIconContainer}>
                            <Ionicons name={activity.icon} size={32} color="#FFD700" />
                        </View>
                        <View style={styles.achievementInfo}>
                            <Text style={styles.achievementTitle}>{activity.title}</Text>
                            <Text style={styles.achievementDescription}>{activity.description}</Text>
                        </View>
                    </View>
                );
            default:
                return null;
        }
    };

    return (
        <View style={styles.activityCard}>
            <View style={styles.header}>
                <View style={styles.userInfo}>
                    <Image source={{ uri: activity.userAvatar }} style={styles.userAvatar} />
                    <View>
                        <Text style={styles.userName}>{activity.userName}</Text>
                        <Text style={styles.timestamp}>{activity.timestamp}</Text>
                    </View>
                </View>
                <TouchableOpacity>
                    <Ionicons name="ellipsis-horizontal" size={20} color="#666" />
                </TouchableOpacity>
            </View>
            {renderActivityContent()}
            <View style={styles.footer}>
                <TouchableOpacity style={styles.actionButton}>
                    <Ionicons name="heart-outline" size={24} color="#666" />
                    <Text style={styles.actionText}>{activity.likes} Beğeni</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.messageButton}
                    onPress={handleMessagePress}
                >
                    <Ionicons name="chatbubble-outline" size={20} color="#2196F3" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionButton}>
                    <Ionicons name="share-outline" size={24} color="#666" />
                    <Text style={styles.actionText}>Paylaş</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    activityCard: {
        backgroundColor: '#FFF',
        borderRadius: 12,
        marginHorizontal: 16,
        marginVertical: 8,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    userInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    userAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginRight: 12,
    },
    userName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#262626',
    },
    timestamp: {
        fontSize: 12,
        color: '#666',
        marginTop: 2,
    },
    locationContainer: {
        borderRadius: 8,
        overflow: 'hidden',
    },
    locationImage: {
        width: '100%',
        height: 200,
        borderRadius: 8,
    },
    locationInfo: {
        padding: 12,
    },
    locationName: {
        fontSize: 18,
        fontWeight: '600',
        color: '#262626',
    },
    locationAddress: {
        fontSize: 14,
        color: '#666',
        marginTop: 4,
    },
    statsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8,
    },
    statsText: {
        marginLeft: 6,
        fontSize: 14,
        color: '#666',
    },
    eventContainer: {
        flexDirection: 'row',
        backgroundColor: '#F8F8F8',
        borderRadius: 8,
        overflow: 'hidden',
    },
    eventImage: {
        width: 100,
        height: 100,
    },
    eventInfo: {
        flex: 1,
        padding: 12,
    },
    eventName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#262626',
    },
    eventDate: {
        fontSize: 14,
        color: '#666',
        marginTop: 4,
    },
    participantsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8,
    },
    avatarStack: {
        flexDirection: 'row',
        marginRight: 8,
    },
    participantAvatar: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#FFF',
        position: 'absolute',
    },
    participantCount: {
        fontSize: 14,
        color: '#666',
        marginLeft: 45,
    },
    achievementContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF9E6',
        borderRadius: 8,
        padding: 12,
    },
    achievementIconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#FFF',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    achievementTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#262626',
    },
    achievementDescription: {
        fontSize: 14,
        color: '#666',
        marginTop: 4,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginTop: 16,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: '#EFEFEF',
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    actionText: {
        marginLeft: 6,
        fontSize: 14,
        color: '#666',
    },
    messageButton: {
        flexDirection: 'row',
        alignItems: 'center',
    },
});

export default Activity;