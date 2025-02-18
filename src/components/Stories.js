import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    View,
    ScrollView,
    TouchableOpacity,
    Image,
    StyleSheet,
    Text,
    Alert
} from 'react-native';
import { getStories, uploadStory, clearStoryCache } from '../services/storyService';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { getCurrentUserUid } from '../services/friendFunctions';
import { getDoc, doc } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';

const Stories = ({ friends, navigation }) => {
    const [stories, setStories] = useState([]);
    const [viewedStories, setViewedStories] = useState(new Set());
    const [currentUser, setCurrentUser] = useState(null);
    const [myStories, setMyStories] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    // Profil fotoğrafı için yardımcı fonksiyon - memoized
    const getProfilePicture = useCallback((user) => {
        if (!user) return null;
        if (user.profilePicture && user.profilePicture.startsWith('http')) {
            return user.profilePicture;
        }
        const name = user.informations?.name || '';
        return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random&size=200&color=fff&bold=true&font-size=0.33`;
    }, []);

    const fetchStories = useCallback(async () => {
        try {
            setIsLoading(true);
            const friendIds = friends.map(friend => friend.id);

            if (friendIds.length === 0) {
                setStories({});
                return;
            }

            const fetchedStories = await getStories(friendIds);

            const groupedStories = fetchedStories.reduce((acc, story) => {
                if (!acc[story.userId]) {
                    acc[story.userId] = [];
                }
                acc[story.userId].push(story);
                return acc;
            }, {});

            setStories(groupedStories);
        } catch (error) {
            console.error('Hikayeler yüklenirken hata:', error);
            setStories({});
        } finally {
            setIsLoading(false);
        }
    }, [friends]);

    const fetchCurrentUser = useCallback(async () => {
        try {
            const userId = await getCurrentUserUid();
            if (userId) {
                const userDoc = await getDoc(doc(db, 'users', userId));
                if (userDoc.exists()) {
                    const userData = userDoc.data();
                    setCurrentUser({
                        id: userId,
                        ...userData,
                        name: userData.informations?.name || 'Ben'
                    });
                }
            }
        } catch (error) {
            console.error('Kullanıcı bilgileri alınamadı:', error);
        }
    }, []);

    const fetchMyStories = useCallback(async () => {
        try {
            const userId = await getCurrentUserUid();
            if (userId) {
                const myStoriesData = await getStories([userId]);
                setMyStories(myStoriesData);
            }
        } catch (error) {
            console.error('Kişisel hikayeler yüklenirken hata:', error);
        }
    }, []);

    useEffect(() => {
        const loadData = async () => {
            await Promise.all([
                fetchStories(),
                fetchCurrentUser(),
                fetchMyStories()
            ]);
        };

        loadData();

        // Komponentin unmount olduğunda önbelleği temizle
        return () => {
            clearStoryCache();
        };
    }, [friends]);

    // Arkadaşları hikayesi olanlar ve olmayanlar olarak ayır - memoized
    const sortedFriends = useMemo(() => {
        return friends
            .sort((a, b) => {
                const aHasStory = stories[a.id]?.length > 0;
                const bHasStory = stories[b.id]?.length > 0;
                const aViewed = viewedStories.has(a.id);
                const bViewed = viewedStories.has(b.id);

                if (aHasStory && !bHasStory) return -1;
                if (!aHasStory && bHasStory) return 1;
                if (aViewed && !bViewed) return 1;
                if (!aViewed && bViewed) return -1;
                return 0;
            })
            .filter(friend => stories[friend.id]?.length > 0);
    }, [friends, stories, viewedStories]);

    const handleStoryPress = useCallback((userId, userStories) => {
        const user = friends.find(friend => friend.id === userId);
        setViewedStories(prev => new Set(prev).add(userId));
        navigation.navigate('StoryView', {
            userId,
            stories: userStories,
            user: user,
            updateStories: (updatedStories) => {
                setStories(prev => ({
                    ...prev,
                    [userId]: updatedStories
                }));
            }
        });
    }, [friends, navigation]);

    const handleAddStory = async () => {
        try {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('İzin Gerekli', 'Hikaye paylaşmak için galeri izni gerekiyor.');
                return;
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: false,
                quality: 1,
                aspect: undefined,
                allowsMultipleSelection: false,
                presentationStyle: 'fullScreen',
            });

            if (!result.canceled) {
                const imageUri = result.assets[0].uri;
                navigation.navigate('StoryEditor', { imageUri });
            }
        } catch (error) {
            console.error('Hikaye ekleme hatası:', error);
            Alert.alert('Hata', 'Hikaye eklenirken bir sorun oluştu.');
        }
    };

    const handleAddStoryPress = () => {
        if (myStories.length > 0) {
            Alert.alert(
                'Hikaye',
                'Ne yapmak istersiniz?',
                [
                    {
                        text: 'Hikayemi Gör',
                        onPress: () => navigation.navigate('StoryView', {
                            userId: currentUser?.id,
                            stories: myStories,
                            user: currentUser,
                            isOwnStory: true
                        })
                    },
                    {
                        text: 'Yeni Hikaye Ekle',
                        onPress: handleAddStory
                    },
                    {
                        text: 'İptal',
                        style: 'cancel'
                    }
                ]
            );
        } else {
            handleAddStory();
        }
    };

    return (
        <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.container}
            removeClippedSubviews={true} // Performans iyileştirmesi
            initialNumToRender={10} // Başlangıçta render edilecek öğe sayısı
        >
            {/* Hikaye Ekleme/Görüntüleme Butonu */}
            <TouchableOpacity
                onPress={handleAddStoryPress}
                style={styles.storyItem}
            >
                <View style={styles.addStoryButton}>
                    <View style={[
                        styles.storyRing,
                        myStories.length > 0 ? styles.activeStoryRing : styles.inactiveStoryRing
                    ]}>
                        <Image
                            source={{ uri: getProfilePicture(currentUser) }}
                            style={styles.storyImage}
                            loading="eager" // Öncelikli yükleme
                        />
                        <View style={styles.plusIconContainer}>
                            <Ionicons name="add-circle" size={20} color="#2196F3" />
                        </View>
                    </View>
                </View>
                <Text style={styles.storyText}>
                    {myStories.length > 0 ? 'Hikayem' : 'Hikaye Ekle'}
                </Text>
            </TouchableOpacity>

            {/* Arkadaş Hikayeleri */}
            {sortedFriends.map((friend) => {
                return (
                    <TouchableOpacity
                        key={friend.id}
                        style={styles.storyItem}
                        onPress={() => handleStoryPress(friend.id, stories[friend.id])}
                    >
                        <View style={[
                            styles.storyRing,
                            viewedStories.has(friend.id) ? styles.viewedStoryRing : styles.activeStoryRing
                        ]}>
                            <Image
                                source={{ uri: getProfilePicture(friend) }}
                                style={styles.storyImage}
                                loading="eager" // Öncelikli yükleme
                            />
                        </View>
                        <Text style={styles.storyText} numberOfLines={1}>
                            {friend.informations?.name || friend.name || 'İsimsiz'}
                        </Text>
                    </TouchableOpacity>
                );
            })}
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        paddingVertical: 12,
        paddingHorizontal: 10,
    },
    storyItem: {
        alignItems: 'center',
        marginHorizontal: 9,
    },
    addStoryButton: {
        position: 'relative',
        alignItems: 'center',
    },
    storyRing: {
        width: 80,
        height: 80,
        borderRadius: 40,
        padding: 3,
        justifyContent: 'center',
        alignItems: 'center',
    },
    activeStoryRing: {
        backgroundColor: '#2196F3',
    },
    inactiveStoryRing: {
        backgroundColor: '#E0E0E0',
    },
    viewedStoryRing: {
        backgroundColor: '#8E8E8E',
    },
    plusIconContainer: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: '#FFF',
        borderRadius: 12,
        width: 27,
        height: 27,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#FFF',
    },
    storyImage: {
        width: 76,
        height: 76,
        borderRadius: 37,
        borderWidth: 3,
        borderColor: '#FFF',
    },

    storyText: {
        marginTop: 4,
        fontSize: 12,
        color: '#262626',
        maxWidth: 76,
        textAlign: 'center',
    },
});

export default Stories; 