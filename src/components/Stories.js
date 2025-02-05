import React, { useState, useEffect } from 'react';
import {
    View,
    ScrollView,
    TouchableOpacity,
    Image,
    StyleSheet,
    Text,
    Alert
} from 'react-native';
import { getStories, uploadStory } from '../services/storyService';
import { LinearGradient } from 'expo-linear-gradient';
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

    useEffect(() => {
        fetchStories();
        fetchCurrentUser();
        fetchMyStories();
    }, [friends]);

    const fetchStories = async () => {
        try {
            const friendIds = friends.map(friend => friend.id);

            // Eğer arkadaş listesi boşsa hikayeleri getirmeye çalışma
            if (friendIds.length === 0) {
                setStories({});
                return;
            }

            const fetchedStories = await getStories(friendIds);

            // Hikayeleri kullanıcılara göre grupla
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
        }
    };

    // Aktif kullanıcının bilgilerini al
    const fetchCurrentUser = async () => {
        try {
            const userId = await getCurrentUserUid();
            if (userId) {
                const userDoc = await getDoc(doc(db, 'users', userId));
                if (userDoc.exists()) {
                    const userData = userDoc.data();

                    const profilePicture =
                        userData.profilePicture ||
                        userData.informations?.profilePicture ||
                        userData.informations?.profileImage ||
                        null;

                    setCurrentUser({
                        id: userId,
                        ...userData,
                        profilePicture,
                        name: userData.informations?.name || 'Ben'
                    });
                }
            }
        } catch (error) {
            console.error('Kullanıcı bilgileri alınamadı:', error);
        }
    };

    const fetchMyStories = async () => {
        try {
            const userId = await getCurrentUserUid();
            if (userId) {
                const myStoriesData = await getStories([userId]);
                setMyStories(myStoriesData);
            }
        } catch (error) {
            console.error('Kişisel hikayeler yüklenirken hata:', error);
        }
    };

    // Arkadaşları hikayesi olanlar ve olmayanlar olarak ayır
    const sortedFriends = friends.sort((a, b) => {
        const aHasStory = stories[a.id]?.length > 0;
        const bHasStory = stories[b.id]?.length > 0;
        const aViewed = viewedStories.has(a.id);
        const bViewed = viewedStories.has(b.id);

        if (aHasStory && !bHasStory) return -1;
        if (!aHasStory && bHasStory) return 1;
        if (aViewed && !bViewed) return 1;
        if (!aViewed && bViewed) return -1;
        return 0;
    }).filter(friend => stories[friend.id]?.length > 0); // Sadece hikayesi olanları göster

    // Profil fotoğrafı için yardımcı fonksiyon
    const getProfilePicture = (user) => {
        if (!user) return null;

        return user.profilePicture ||
            user.informations?.profilePicture ||
            user.informations?.profileImage ||
            null;
    };

    const handleStoryPress = (userId, userStories) => {
        const user = friends.find(friend => friend.id === userId);
        setViewedStories(prev => new Set(prev).add(userId));
        navigation.navigate('StoryView', {
            userId,
            stories: userStories,
            user: user,
            updateStories: (updatedStories) => {
                // stories state'ini güncelle
                setStories(prev => ({
                    ...prev,
                    [userId]: updatedStories
                }));
            }
        });
    };

    const handleAddStory = async () => {
        try {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('İzin Gerekli', 'Hikaye paylaşmak için galeri izni gerekiyor.');
                return;
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                quality: 0.8,
                aspect: undefined,
                allowsMultipleSelection: false,
                presentationStyle: 'pageSheet',
            });

            if (!result.canceled) {
                const userId = await getCurrentUserUid();
                if (!userId) {
                    Alert.alert('Hata', 'Kullanıcı bulunamadı');
                    return;
                }

                const imageUri = result.assets[0].uri;
                const manipulateResult = await manipulateAsync(
                    imageUri,
                    [
                        {
                            resize: {
                                width: 1080,
                                height: undefined
                            }
                        }
                    ],
                    { format: SaveFormat.JPEG }
                );

                const response = await fetch(manipulateResult.uri);
                const blob = await response.blob();

                const uploadResult = await uploadStory(userId, blob);

                if (uploadResult.success) {
                    Alert.alert('Başarılı', 'Hikayen paylaşıldı!');
                    fetchStories();
                } else {
                    Alert.alert('Hata', 'Hikaye paylaşılırken bir sorun oluştu.');
                }
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
                            source={
                                getProfilePicture(currentUser)
                                    ? { uri: getProfilePicture(currentUser) }
                                    : {
                                        uri: `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser?.informations?.name || currentUser?.name || '')
                                            }&background=random&size=200&color=fff&bold=true`
                                    }
                            }
                            style={styles.storyImage}
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
                const profilePic = getProfilePicture(friend);

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
                                source={
                                    profilePic
                                        ? { uri: profilePic }
                                        : {
                                            uri: `https://ui-avatars.com/api/?name=${encodeURIComponent(friend.informations?.name || friend.name || '')
                                                }&background=random&size=200&color=fff&bold=true`
                                        }
                                }
                                style={styles.storyImage}
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
        paddingVertical: 10,
        paddingHorizontal: 8,
    },
    storyItem: {
        alignItems: 'center',
        marginHorizontal: 8,
    },
    addStoryButton: {
        position: 'relative',
        alignItems: 'center',
    },
    storyRing: {
        width: 68,
        height: 68,
        borderRadius: 34,
        padding: 2,
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
        borderRadius: 10,
        width: 20,
        height: 20,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: '#FFF',
    },
    storyImage: {
        width: 64,
        height: 64,
        borderRadius: 32,
        borderWidth: 2,
        borderColor: '#FFF',
    },
    storyText: {
        marginTop: 4,
        fontSize: 12,
        color: '#262626',
        maxWidth: 64,
        textAlign: 'center',
    },
});

export default Stories; 