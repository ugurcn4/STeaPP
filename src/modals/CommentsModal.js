import React, { useState, useRef } from 'react';
import { /* ... mevcut importlar ... */ } from 'react-native';
import FriendProfileModal from './friendProfileModal';

const CommentsModal = ({ visible, onClose, comments, onAddComment, currentUserId, postUserId, onDelete }) => {
    // ... mevcut kodlar ...
    const [selectedFriend, setSelectedFriend] = useState(null);
    const [friendModalVisible, setFriendModalVisible] = useState(false);

    // ... mevcut kodlar ...

    const handleUserPress = (user) => {
        if (user) {
            setSelectedFriend(user);
            setFriendModalVisible(true);
        }
    };

    // ... mevcut kodlar ...

    const renderComment = (comment, isReply = false) => {
        return (
            <View style={[styles.commentItem, isReply && styles.replyItem]}>
                <View style={styles.commentHeader}>
                    <TouchableOpacity
                        style={styles.commentUser}
                        onPress={() => handleUserPress(comment.user)}
                    >
                        <FastImage
                            source={{
                                uri: comment.user?.avatar || 'https://via.placeholder.com/40',
                                priority: FastImage.priority.normal,
                            }}
                            style={styles.commentAvatar}
                        />
                        <Text style={styles.commentUsername}>{comment.user?.name || 'İsimsiz Kullanıcı'}</Text>
                    </TouchableOpacity>

                    {/* ... mevcut kodlar ... */}
                </View>

                {/* ... mevcut kodlar ... */}
            </View>
        );
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={true}
            onRequestClose={onClose}
        >
            {/* ... mevcut kodlar ... */}

            {/* FriendProfileModal ekleyelim */}
            <FriendProfileModal
                visible={friendModalVisible}
                onClose={() => setFriendModalVisible(false)}
                friend={selectedFriend}
                navigation={navigation}
            />
        </Modal>
    );
}; 