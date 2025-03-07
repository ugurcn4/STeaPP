import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    View,
    StyleSheet,
    FlatList,
    ActivityIndicator,
    Text,
    SafeAreaView,
    StatusBar,
    TouchableOpacity,
    Dimensions,
    Modal
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Activity from '../components/Activity';
import FastImage from 'react-native-fast-image';
import { fetchLikedPosts, fetchArchivedPosts, toggleLikePost, addComment, deleteComment, fetchArchiveGroups } from '../services/postService';
import { getAuth } from 'firebase/auth';
import PostDetailModal from '../modals/PostDetailModal';

const { width } = Dimensions.get('window');
const GRID_SIZE = width / 3;

const LikedPostsScreen = ({ navigation }) => {
    const [selectedPost, setSelectedPost] = useState(null);
    const [activeTab, setActiveTab] = useState('liked'); // 'liked' veya 'archived'
    const auth = getAuth();
    const currentUser = auth.currentUser;
    const listRef = useRef(null);
    const [selectedCollection, setSelectedCollection] = useState(null);
    const POSTS_PER_PAGE = 21;

    // Ayrı FlatList'ler için ayrı key'ler kullanalım
    const gridKey = useRef(`grid-${activeTab}`);

    // Her sekme için ayrı veri ve yükleme durumu tutuyoruz
    const [tabData, setTabData] = useState({
        liked: {
            posts: [],
            lastDoc: null,
            hasMore: true,
            loading: true,
            refreshing: false
        },
        archived: {
            posts: [],
            collections: [],
            loading: true,
            refreshing: false
        }
    });

    // Aktif sekmenin verilerine kolay erişim için
    const activeTabData = tabData[activeTab];

    const loadPosts = async (isInitial = true) => {
        try {
            if (isInitial) {
                setTabData(prev => ({
                    ...prev,
                    [activeTab]: {
                        ...prev[activeTab],
                        loading: true
                    }
                }));
            }

            if (!activeTabData.hasMore && !isInitial && activeTab === 'liked') return;

            if (activeTab === 'liked') {
                const { posts: newPosts, lastVisible } = await fetchLikedPosts(
                    currentUser.uid,
                    POSTS_PER_PAGE,
                    isInitial ? null : activeTabData.lastDoc
                );

                setTabData(prev => ({
                    ...prev,
                    liked: {
                        ...prev.liked,
                        posts: isInitial ? newPosts : [...prev.liked.posts, ...newPosts],
                        lastDoc: lastVisible,
                        hasMore: newPosts.length === POSTS_PER_PAGE,
                        loading: false,
                        refreshing: false
                    }
                }));
            }
        } catch (error) {
            console.error('Gönderiler yüklenirken hata:', error);
            setTabData(prev => ({
                ...prev,
                [activeTab]: {
                    ...prev[activeTab],
                    loading: false,
                    refreshing: false
                }
            }));
        }
    };

    useEffect(() => {
        if (activeTab === 'liked' && tabData.liked.posts.length === 0) {
            loadPosts();
        } else if (activeTab === 'archived' && tabData.archived.collections.length === 0) {
            loadCollections();
        }
    }, [activeTab]);

    const handleRefresh = async () => {
        setTabData(prev => ({
            ...prev,
            [activeTab]: {
                ...prev[activeTab],
                refreshing: true
            }
        }));

        if (activeTab === 'liked') {
            await loadPosts(true);
        } else {
            await loadCollections();
        }
    };

    const handlePostUpdate = (updatedPost) => {
        setTabData(prev => {
            if (activeTab === 'liked') {
                return {
                    ...prev,
                    liked: {
                        ...prev.liked,
                        posts: prev.liked.posts.map(post =>
                            post.id === updatedPost.id ? updatedPost : post
                        )
                    }
                };
            } else {
                return {
                    ...prev,
                    archived: {
                        ...prev.archived,
                        posts: prev.archived.posts.map(post =>
                            post.id === updatedPost.id ? updatedPost : post
                        )
                    }
                };
            }
        });
    };

    const handleLikePress = async (postId) => {
        if (!currentUser?.uid) return;

        try {
            const isLiked = await toggleLikePost(postId, currentUser.uid);

            // Aktif sekmeye göre doğru veri kümesini güncelleyelim
            setTabData(prevTabData => {
                if (activeTab === 'liked') {
                    // Beğenilen postlar sekmesindeki güncelleme
                    const updatedPosts = prevTabData.liked.posts.map(post => {
                        if (post.id === postId) {
                            const currentLikes = post.stats?.likes || 0;
                            const newLikes = Math.max(0, currentLikes + (isLiked ? 1 : -1));

                            // Beğeni kaldırıldıysa postu listeden kaldır
                            if (!isLiked) {
                                return null;
                            }

                            return {
                                ...post,
                                likedBy: isLiked
                                    ? [...(post.likedBy || []), currentUser.uid]
                                    : (post.likedBy || []).filter(id => id !== currentUser.uid),
                                stats: {
                                    ...post.stats,
                                    likes: newLikes
                                }
                            };
                        }
                        return post;
                    }).filter(Boolean); // null olan postları filtrele

                    return {
                        ...prevTabData,
                        liked: {
                            ...prevTabData.liked,
                            posts: updatedPosts
                        }
                    };
                } else {
                    // Arşivlenen postlar sekmesindeki güncelleme
                    const updatedPosts = prevTabData.archived.posts.map(post => {
                        if (post.id === postId) {
                            const currentLikes = post.stats?.likes || 0;
                            const newLikes = Math.max(0, currentLikes + (isLiked ? 1 : -1));

                            return {
                                ...post,
                                likedBy: isLiked
                                    ? [...(post.likedBy || []), currentUser.uid]
                                    : (post.likedBy || []).filter(id => id !== currentUser.uid),
                                stats: {
                                    ...post.stats,
                                    likes: newLikes
                                }
                            };
                        }
                        return post;
                    });

                    return {
                        ...prevTabData,
                        archived: {
                            ...prevTabData.archived,
                            posts: updatedPosts
                        }
                    };
                }
            });
        } catch (error) {
            console.error('Beğeni hatası:', error);
        }
    };

    const handleCommentSubmit = async (postId, comment, replyToId = null) => {
        if (!currentUser?.uid) return;

        try {
            if (comment === 'delete') {
                await deleteComment(postId, replyToId, currentUser.uid);

                // Aktif sekmeye göre doğru veri kümesini güncelleyelim
                setTabData(prevTabData => {
                    if (activeTab === 'liked') {
                        // Beğenilen postlar sekmesindeki güncelleme
                        const updatedPosts = prevTabData.liked.posts.map(post => {
                            if (post.id === postId) {
                                return {
                                    ...post,
                                    comments: post.comments.filter(c => c.id !== replyToId),
                                    stats: {
                                        ...post.stats,
                                        comments: (post.stats?.comments || 1) - 1
                                    }
                                };
                            }
                            return post;
                        });

                        return {
                            ...prevTabData,
                            liked: {
                                ...prevTabData.liked,
                                posts: updatedPosts
                            }
                        };
                    } else {
                        // Arşivlenen postlar sekmesindeki güncelleme
                        const updatedPosts = prevTabData.archived.posts.map(post => {
                            if (post.id === postId) {
                                return {
                                    ...post,
                                    comments: post.comments.filter(c => c.id !== replyToId),
                                    stats: {
                                        ...post.stats,
                                        comments: (post.stats?.comments || 1) - 1
                                    }
                                };
                            }
                            return post;
                        });

                        return {
                            ...prevTabData,
                            archived: {
                                ...prevTabData.archived,
                                posts: updatedPosts
                            }
                        };
                    }
                });
            } else {
                const newComment = await addComment(postId, currentUser.uid, comment, replyToId);

                // Aktif sekmeye göre doğru veri kümesini güncelleyelim
                setTabData(prevTabData => {
                    if (activeTab === 'liked') {
                        // Beğenilen postlar sekmesindeki güncelleme
                        const updatedPosts = prevTabData.liked.posts.map(post => {
                            if (post.id === postId) {
                                if (replyToId) {
                                    const updatedComments = post.comments.map(c => {
                                        if (c.id === replyToId) {
                                            return {
                                                ...c,
                                                replies: [...(c.replies || []), newComment]
                                            };
                                        }
                                        return c;
                                    });
                                    return {
                                        ...post,
                                        comments: updatedComments,
                                        stats: {
                                            ...post.stats,
                                            comments: (post.stats?.comments || 0) + 1
                                        }
                                    };
                                } else {
                                    return {
                                        ...post,
                                        comments: [...(post.comments || []), newComment],
                                        stats: {
                                            ...post.stats,
                                            comments: (post.stats?.comments || 0) + 1
                                        }
                                    };
                                }
                            }
                            return post;
                        });

                        return {
                            ...prevTabData,
                            liked: {
                                ...prevTabData.liked,
                                posts: updatedPosts
                            }
                        };
                    } else {
                        // Arşivlenen postlar sekmesindeki güncelleme
                        const updatedPosts = prevTabData.archived.posts.map(post => {
                            if (post.id === postId) {
                                if (replyToId) {
                                    const updatedComments = post.comments.map(c => {
                                        if (c.id === replyToId) {
                                            return {
                                                ...c,
                                                replies: [...(c.replies || []), newComment]
                                            };
                                        }
                                        return c;
                                    });
                                    return {
                                        ...post,
                                        comments: updatedComments,
                                        stats: {
                                            ...post.stats,
                                            comments: (post.stats?.comments || 0) + 1
                                        }
                                    };
                                } else {
                                    return {
                                        ...post,
                                        comments: [...(post.comments || []), newComment],
                                        stats: {
                                            ...post.stats,
                                            comments: (post.stats?.comments || 0) + 1
                                        }
                                    };
                                }
                            }
                            return post;
                        });

                        return {
                            ...prevTabData,
                            archived: {
                                ...prevTabData.archived,
                                posts: updatedPosts
                            }
                        };
                    }
                });
            }
        } catch (error) {
            console.error('Yorum işlemi hatası:', error);
        }
    };

    const loadCollections = async () => {
        try {
            const userCollections = await fetchArchiveGroups(currentUser.uid);
            const archivedPosts = await fetchArchivedPosts(currentUser.uid);

            const collectionsWithCount = userCollections.map(collection => ({
                ...collection,
                postCount: archivedPosts.filter(post =>
                    post.archiveGroups?.includes(collection.id)
                ).length
            }));

            setTabData(prev => ({
                ...prev,
                archived: {
                    ...prev.archived,
                    collections: collectionsWithCount,
                    posts: archivedPosts,
                    loading: false,
                    refreshing: false
                }
            }));
        } catch (error) {
            console.error('Koleksiyonlar yüklenirken hata:', error);
            setTabData(prev => ({
                ...prev,
                archived: {
                    ...prev.archived,
                    loading: false,
                    refreshing: false
                }
            }));
        }
    };

    const loadArchivedPosts = async (collectionId = null) => {
        try {
            setTabData(prev => ({
                ...prev,
                archived: {
                    ...prev.archived,
                    loading: true
                }
            }));

            const archivedPosts = await fetchArchivedPosts(currentUser.uid);

            if (collectionId) {
                // Belirli bir koleksiyondaki postları filtrele
                const filteredPosts = archivedPosts.filter(post =>
                    post.archiveGroups?.includes(collectionId)
                );

                setTabData(prev => ({
                    ...prev,
                    archived: {
                        ...prev.archived,
                        posts: filteredPosts,
                        loading: false
                    }
                }));
            } else {
                setTabData(prev => ({
                    ...prev,
                    archived: {
                        ...prev.archived,
                        posts: archivedPosts,
                        loading: false
                    }
                }));
            }
        } catch (error) {
            console.error('Arşivlenen gönderiler yüklenirken hata:', error);
            setTabData(prev => ({
                ...prev,
                archived: {
                    ...prev.archived,
                }
            }));
        }
    };

    const handleCollectionPress = (collection) => {
        // Önce koleksiyonu seçelim
        setSelectedCollection(collection);

        // Mevcut postları temizleyelim ve loading durumunu true yapalım
        setTabData(prev => ({
            ...prev,
            archived: {
                ...prev.archived,
                posts: [], // Postları temizle
                loading: true
            }
        }));

        // Sonra yeni postları yükleyelim
        loadArchivedPosts(collection.id);
    };

    const renderHeader = () => (
        <View style={styles.headerContainer}>
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    style={styles.backButton}
                >
                    <Ionicons name="arrow-back" size={24} color="#000" />
                </TouchableOpacity>
                <View style={styles.headerTabs}>
                    <TouchableOpacity
                        onPress={() => setActiveTab('liked')}
                        style={styles.headerTab}
                    >
                        <Text style={[
                            styles.headerTabText,
                            activeTab === 'liked' && styles.activeHeaderTabText
                        ]}>
                            Beğenilenler
                        </Text>
                    </TouchableOpacity>
                    <Text style={styles.headerTabDivider}>|</Text>
                    <TouchableOpacity
                        onPress={() => setActiveTab('archived')}
                        style={styles.headerTab}
                    >
                        <Text style={[
                            styles.headerTabText,
                            activeTab === 'archived' && styles.activeHeaderTabText
                        ]}>
                            Arşivlenenler
                        </Text>
                    </TouchableOpacity>
                </View>
                <View style={{ width: 24 }} />
            </View>
        </View>
    );

    // Performans için memoize edilmiş render fonksiyonları
    const renderGridItem = useCallback(({ item }) => (
        <TouchableOpacity
            onPress={() => setSelectedPost(item)}
            style={styles.gridItem}
        >
            <FastImage
                source={{ uri: item.imageUrl }}
                style={styles.gridImage}
                resizeMode={FastImage.resizeMode.cover}
            />
            <View style={styles.gridOverlay}>
                <View style={styles.statsContainer}>
                    <View style={[styles.statItem, styles.likeStatItem]}>
                        <Ionicons name="heart" size={16} color="#FF4B6A" />
                        <Text style={[styles.statText, styles.likeStatText]}>
                            {item.stats?.likes || 0}
                        </Text>
                    </View>
                    <View style={[styles.statItem, styles.commentStatItem]}>
                        <Ionicons name="chatbubble" size={16} color="#4B9DFF" />
                        <Text style={[styles.statText, styles.commentStatText]}>
                            {item.stats?.comments || 0}
                        </Text>
                    </View>
                </View>
            </View>
        </TouchableOpacity>
    ), []);

    const renderCollectionItem = useCallback(({ item, index }) => (
        <TouchableOpacity
            style={[
                styles.collectionCard,
                index % 2 === 0 && { marginRight: 8 }
            ]}
            onPress={() => handleCollectionPress(item)}
        >
            <View style={styles.collectionEmoji}>
                <Text style={styles.emojiText}>{item.emoji}</Text>
            </View>
            <View style={styles.collectionInfo}>
                <Text style={styles.collectionName} numberOfLines={1}>
                    {item.name}
                </Text>
                {item.description && (
                    <Text style={styles.collectionDescription} numberOfLines={2}>
                        {item.description}
                    </Text>
                )}
                <Text style={styles.postCount}>
                    {item.postCount} gönderi
                </Text>
            </View>
        </TouchableOpacity>
    ), []);

    // Grid görünümü için optimize edilmiş liste
    const GridList = useCallback(() => (
        <FlatList
            key={gridKey.current}
            data={tabData.liked.posts}
            numColumns={3}
            renderItem={renderGridItem}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.gridContainer}
            refreshing={tabData.liked.refreshing}
            onRefresh={handleRefresh}
            removeClippedSubviews={true}
            maxToRenderPerBatch={9}
            windowSize={5}
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.5}
            ListFooterComponent={() => (
                tabData.liked.loading && !tabData.liked.refreshing && tabData.liked.posts.length > 0 ? (
                    <View style={styles.footerLoader}>
                        <ActivityIndicator color="#2196F3" />
                    </View>
                ) : null
            )}
            getItemLayout={(data, index) => ({
                length: GRID_SIZE,
                offset: GRID_SIZE * index,
                index,
            })}
        />
    ), [tabData.liked]);

    // Koleksiyonlar listesi
    const CollectionsList = useCallback(() => (
        <FlatList
            data={tabData.archived.collections}
            renderItem={renderCollectionItem}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.collectionsContainer}
            numColumns={2}
            columnWrapperStyle={styles.row}
            refreshing={tabData.archived.refreshing}
            onRefresh={handleRefresh}
            removeClippedSubviews={true}
            maxToRenderPerBatch={6}
            windowSize={5}
        />
    ), [tabData.archived]);

    // Seçili koleksiyon görünümü için optimize edilmiş liste
    const SelectedCollectionList = useCallback(() => {
        // Sadece seçili koleksiyona ait postları filtreleyelim
        const filteredPosts = tabData.archived.posts.filter(post =>
            post.archiveGroups?.includes(selectedCollection.id)
        );

        return (
            <>
                <View style={styles.selectedCollectionHeader}>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => {
                            setSelectedCollection(null);
                            loadCollections();
                        }}
                    >
                        <Ionicons name="arrow-back" size={24} color="#000" />
                    </TouchableOpacity>
                    <Text style={styles.selectedCollectionTitle}>
                        {selectedCollection.name}
                    </Text>
                    <View style={{ width: 24 }} />
                </View>

                {tabData.archived.loading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="#2196F3" />
                    </View>
                ) : (
                    <FlatList
                        data={filteredPosts}
                        numColumns={3}
                        renderItem={renderGridItem}
                        keyExtractor={item => item.id}
                        contentContainerStyle={styles.gridContainer}
                        refreshing={tabData.archived.refreshing}
                        onRefresh={handleRefresh}
                        removeClippedSubviews={true}
                        maxToRenderPerBatch={9}
                        windowSize={5}
                        getItemLayout={(data, index) => ({
                            length: GRID_SIZE,
                            offset: GRID_SIZE * index,
                            index,
                        })}
                        ListEmptyComponent={() => (
                            <View style={styles.emptyContainer}>
                                <Ionicons name="images-outline" size={48} color="#ccc" />
                                <Text style={styles.emptyText}>
                                    Bu koleksiyonda henüz gönderi yok
                                </Text>
                            </View>
                        )}
                    />
                )}
            </>
        );
    }, [tabData.archived, selectedCollection]);

    const handleLoadMore = () => {
        if (!activeTabData.loading && activeTabData.hasMore && activeTab === 'liked') {
            loadPosts(false);
        }
    };

    const renderArchivedContent = useCallback(() => {
        if (selectedCollection) {
            return <SelectedCollectionList />;
        }

        return tabData.archived.collections.length > 0 ? (
            <CollectionsList />
        ) : (
            <View style={styles.emptyContainer}>
                <Ionicons name="folder-open-outline" size={48} color="#666" />
                <Text style={styles.emptyText}>
                    Henüz koleksiyon oluşturmadınız
                </Text>
                <Text style={styles.emptySubText}>
                    Gönderilerinizi düzenlemek için koleksiyon oluşturun
                </Text>
            </View>
        );
    }, [selectedCollection, tabData.archived]);

    const renderDetailModal = () => {
        // Aktif sekmeye göre doğru veri kaynağını seçelim
        const currentPosts = activeTab === 'liked'
            ? tabData.liked.posts
            : tabData.archived.posts;

        return (
            <PostDetailModal
                visible={selectedPost !== null}
                onClose={() => setSelectedPost(null)}
                selectedPost={selectedPost}
                currentPosts={currentPosts}
                currentUserId={currentUser?.uid}
                onLikePress={handleLikePress}
                onCommentPress={handleCommentSubmit}
                onPostUpdate={(updatedPost) => {
                    handlePostUpdate(updatedPost);
                    if (updatedPost.id !== selectedPost.id) {
                        setSelectedPost(updatedPost);
                    }
                }}
                navigation={navigation}
            />
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" />
            {renderHeader()}
            {activeTabData.loading &&
                (activeTab === 'liked' ? tabData.liked.posts.length === 0 : tabData.archived.collections.length === 0) ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#2196F3" />
                </View>
            ) : (
                <>
                    {activeTab === 'liked' ? <GridList /> : renderArchivedContent()}
                    {renderDetailModal()}
                </>
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerContainer: {
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
    },
    headerTabs: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    headerTab: {
        paddingVertical: 4,
        paddingHorizontal: 4,
    },
    headerTabText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#8E8E8E',
    },
    activeHeaderTabText: {
        color: '#262626',
    },
    headerTabDivider: {
        fontSize: 18,
        fontWeight: '300',
        color: '#8E8E8E',
        marginHorizontal: 8,
    },
    backButton: {
        padding: 4,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    emptyText: {
        marginTop: 16,
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        fontWeight: '600',
    },
    emptySubText: {
        marginTop: 8,
        fontSize: 14,
        color: '#999',
        textAlign: 'center',
    },
    gridContainer: {
        padding: 1,
    },
    gridItem: {
        width: GRID_SIZE - 2,
        height: GRID_SIZE - 2,
        margin: 1,
        position: 'relative',
        borderRadius: 4,
        overflow: 'hidden',
        backgroundColor: '#f5f5f5',
    },
    gridImage: {
        width: '100%',
        height: '100%',
        borderRadius: 4,
    },
    gridOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'rgba(0,0,0,0.4)',
        padding: 6,
        borderBottomLeftRadius: 4,
        borderBottomRightRadius: 4,
        backdropFilter: 'blur(5px)',
    },
    statsContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 16,
    },
    statItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.15)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        gap: 4,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.2,
        shadowRadius: 1.5,
        elevation: 2,
    },
    likeStatItem: {
        backgroundColor: 'rgba(255,75,106,0.25)',
    },
    commentStatItem: {
        backgroundColor: 'rgba(75,157,255,0.25)',
    },
    statText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '600',
        textShadowColor: 'rgba(0,0,0,0.3)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
    },
    likeStatText: {
        color: '#FFE8EC',
    },
    commentStatText: {
        color: '#E8F2FF',
    },
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
    modalContent: {
        paddingBottom: 20,
        paddingTop: 0,
    },
    postContainer: {
        backgroundColor: '#fff',
        marginBottom: 1,
        marginTop: 0,
    },
    collectionsContainer: {
        padding: 16,
    },
    row: {
        flex: 1,
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    collectionCard: {
        flex: 1,
        maxWidth: '48%', // İki kart arasında boşluk bırakmak için
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 3,
    },
    collectionEmoji: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#f5f5f5',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    emojiText: {
        fontSize: 24,
    },
    collectionInfo: {
        flex: 1,
    },
    collectionName: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 4,
    },
    collectionDescription: {
        fontSize: 13,
        color: '#666',
        marginBottom: 4,
        lineHeight: 18,
    },
    postCount: {
        fontSize: 12,
        color: '#2196F3',
        fontWeight: '500',
        marginTop: 'auto', // Alt kısma sabitlemek için
    },
    selectedCollectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    selectedCollectionTitle: {
        fontSize: 18,
        fontWeight: '600',
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    footerLoader: {
        paddingVertical: 16,
        alignItems: 'center',
    },
});

export default LikedPostsScreen; 