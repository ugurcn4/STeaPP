import React, { useRef, useState, useEffect } from 'react';
import {
    Modal,
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    FlatList,
    SafeAreaView,
    Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Activity from '../components/Activity';

const { width } = Dimensions.get('window');

const PostDetailModal = ({
    visible,
    onClose,
    selectedPost,
    currentPosts,
    currentUserId,
    onLikePress,
    onCommentPress,
    onPostUpdate,
    navigation
}) => {
    const [postHeights, setPostHeights] = useState({});
    const [initialScrollDone, setInitialScrollDone] = useState(false);
    const listRef = useRef(null);

    const selectedIndex = currentPosts.findIndex(post => post.id === selectedPost?.id);

    // Modal kapandığında state'leri sıfırlayalım
    useEffect(() => {
        if (!visible) {
            setInitialScrollDone(false);
        }
    }, [visible]);

    // Modal açıldığında scroll işlemini yapalım
    useEffect(() => {
        if (visible && selectedPost && !initialScrollDone) {
            scrollToSelectedIndex();
        }
    }, [visible, selectedPost]);

    // Scroll işlemini kontrol eden fonksiyon
    const scrollToSelectedIndex = () => {
        if (!selectedPost || initialScrollDone || !listRef.current) return;

        const selectedIndex = currentPosts.findIndex(post => post.id === selectedPost?.id);

        if (selectedIndex !== -1) {
            setTimeout(() => {
                try {
                    listRef.current.scrollToIndex({
                        index: selectedIndex,
                        animated: false,
                        viewPosition: 0
                    });
                } catch (error) {
                }
                setInitialScrollDone(true);
            }, 50);
        }
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            onRequestClose={onClose}
        >
            <SafeAreaView style={styles.modalContainer}>
                <View style={styles.modalHeader}>
                    <TouchableOpacity
                        onPress={onClose}
                        style={styles.backButton}
                    >
                        <Ionicons name="close" size={24} color="#000" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Gönderi Detayı</Text>
                    <View style={{ width: 24 }} />
                </View>
                {selectedPost && (
                    <FlatList
                        ref={listRef}
                        data={currentPosts}
                        keyExtractor={(item) => item.id}
                        renderItem={({ item }) => (
                            <View
                                onLayout={(event) => {
                                    const { height } = event.nativeEvent.layout;
                                    setPostHeights(prev => ({
                                        ...prev,
                                        [item.id]: height
                                    }));
                                }}
                                style={styles.postContainer}
                            >
                                <Activity
                                    activity={item}
                                    onLikePress={() => onLikePress(item.id)}
                                    onCommentPress={(comment, replyToId) => {
                                        onCommentPress(item.id, comment, replyToId);
                                    }}
                                    isLiked={item.likedBy?.includes(currentUserId)}
                                    currentUserId={currentUserId}
                                    onUpdate={(updatedPost) => {
                                        onPostUpdate(updatedPost);
                                    }}
                                    navigation={navigation}
                                />
                            </View>
                        )}
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={styles.modalContent}
                        initialScrollIndex={selectedIndex}
                        getItemLayout={(data, index) => {
                            // Eğer yükseklik bilgisi yoksa varsayılan bir değer kullan
                            const defaultHeight = 500; // Varsayılan yükseklik
                            let offset = 0;
                            for (let i = 0; i < index; i++) {
                                const postId = data[i]?.id;
                                offset += postHeights[postId] || defaultHeight;
                            }
                            const length = postHeights[data[index]?.id] || defaultHeight;
                            return {
                                length,
                                offset,
                                index,
                            };
                        }}
                        onScrollToIndexFailed={(info) => {
                            setTimeout(() => {
                                if (listRef.current) {
                                    try {
                                        listRef.current.scrollToIndex({
                                            index: selectedIndex,
                                            animated: false
                                        });
                                    } catch (error) {
                                    }
                                }
                            }, 200);
                        }}
                        scrollEventThrottle={16}
                        maintainVisibleContentPosition={{
                            minIndexForVisible: 0,
                            autoscrollToTopThreshold: 10
                        }}
                        decelerationRate="normal"
                        onMomentumScrollEnd={(event) => {
                            let totalHeight = 0;
                            let newIndex = 0;

                            for (let i = 0; i < currentPosts.length; i++) {
                                const postHeight = postHeights[currentPosts[i].id] || 500;
                                if (totalHeight + postHeight / 2 > event.nativeEvent.contentOffset.y) {
                                    newIndex = i;
                                    break;
                                }
                                totalHeight += postHeight;
                            }

                            if (currentPosts[newIndex] && currentPosts[newIndex].id !== selectedPost.id) {
                                onPostUpdate(currentPosts[newIndex]);
                            }
                        }}
                    />
                )}
            </SafeAreaView>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalContainer: {
        flex: 1,
        backgroundColor: '#fff',
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        backgroundColor: '#fff',
        zIndex: 10,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        paddingBottom: 15,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
    },
    backButton: {
        padding: 4,
    },
    modalContent: {
        paddingBottom: 20,
        paddingTop: 0,
    },
    postContainer: {
        backgroundColor: '#fff',
        marginBottom: 1,
        marginTop: 0,
    }
});

export default PostDetailModal; 