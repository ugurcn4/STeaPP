import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSelector } from 'react-redux';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';

const NotificationItem = ({ notification, onPress }) => {
    const theme = useSelector((state) => state.theme.theme);
    const currentTheme = theme === 'dark' ? darkTheme : lightTheme;

    const getNotificationIcon = () => {
        switch (notification.type) {
            case 'friendRequest':
                return 'person-add';
            case 'message':
                return 'chatbubble';
            case 'activity':
                return 'walk';
            default:
                return 'notifications';
        }
    };

    const formatTime = (date) => {
        return formatDistanceToNow(new Date(date), {
            addSuffix: true,
            locale: tr
        });
    };

    return (
        <TouchableOpacity
            style={[
                styles.container,
                {
                    backgroundColor: notification.status === 'unread'
                        ? currentTheme.highlightBackground
                        : currentTheme.background
                }
            ]}
            onPress={onPress}
        >
            <View style={styles.iconContainer}>
                <Ionicons
                    name={getNotificationIcon()}
                    size={24}
                    color={currentTheme.primary}
                />
            </View>
            <View style={styles.content}>
                <Text style={[styles.title, { color: currentTheme.text }]}>
                    {notification.title}
                </Text>
                <Text style={[styles.body, { color: currentTheme.textSecondary }]}>
                    {notification.body}
                </Text>
                <Text style={[styles.time, { color: currentTheme.textTertiary }]}>
                    {formatTime(notification.createdAt)}
                </Text>
            </View>
            {notification.status === 'unread' && (
                <View style={[styles.unreadDot, { backgroundColor: currentTheme.primary }]} />
            )}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.1)',
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(76,175,80,0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    content: {
        flex: 1,
        marginRight: 8,
    },
    title: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 4,
    },
    body: {
        fontSize: 14,
        marginBottom: 4,
    },
    time: {
        fontSize: 12,
    },
    unreadDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginTop: 4,
    }
});

export default NotificationItem; 