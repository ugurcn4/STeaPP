import React, { useState, useEffect } from 'react';
import { View, Text, Image, TouchableOpacity, Modal, StyleSheet, TextInput, Button } from 'react-native';
import { Entypo, FontAwesome } from '@expo/vector-icons';
import { getAuth } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db, storage } from '../../firebaseConfig';
import * as ImagePicker from 'expo-image-picker';
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import Toast from 'react-native-toast-message';

const showToast = (type, text1, text2) => {
    Toast.show({
        type: type,
        text1: text1,
        text2: text2
    });
};

const ProfileModal = ({ modalVisible, setModalVisible, navigation }) => {
    const [userData, setUserData] = useState(null);
    const [imageUri, setImageUri] = useState(null);
    const [phoneModalVisible, setPhoneModalVisible] = useState(false);
    const [instaModalVisible, setInstaModalVisible] = useState(false);
    const [bioModalVisible, setBioModalVisible] = useState(false);
    const [imageModalVisible, setImageModalVisible] = useState(false);
    const [uploading, setUploading] = useState(false); // Yükleme durumu
    const [progress, setProgress] = useState(0); // Yükleme ilerlemesi


    const auth = getAuth();

    const user = getAuth().currentUser;

    const [userInfo, setUserInfo] = useState({
        bio: '',
        phoneNumber: '',
        insta: '',
        profileImage: '',
    });

    useEffect(() => {
        const user = auth.currentUser;
        if (user) {
            const getUserData = async () => {
                const docRef = doc(db, 'users', user.uid);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    setUserInfo(docSnap.data());
                    setUserData(docSnap.data());
                }
            };
            getUserData();
        }
    }, [user]);

    const fetchUserData = async () => {
        const user = auth.currentUser;
        if (!user) {
            return;
        }

        try {
            const userDoc = doc(db, `users/${user.uid}`);
            const userSnapshot = await getDoc(userDoc);

            if (userSnapshot.exists()) {
                const userInfo = userSnapshot.data().informations || {};
                const friends = userSnapshot.data().friends || [];
                setUserData((prevData) => ({
                    ...prevData,
                    ...userInfo,
                    contact: {
                        ...(prevData?.contact || {}),
                        ...(userInfo.contact || {}),
                    },
                    friendsCount: friends.length,
                }));
            } else {
                await setDoc(userDoc, { informations: { email: user.email } }, { merge: true });
                setUserData({ email: user.email, contact: {}, friendsCount: 0 });
            }
        } catch (error) {
            showToast('error', 'Hata', 'Kullanıcı verileri alınamadı.');
        }
    };

    useEffect(() => {
        if (modalVisible) {
            fetchUserData();
        }
    }, [modalVisible]);

    const handleAddPhoneNumber = async () => {
        if (!userInfo.phoneNumber || !userInfo.phoneNumber.match(/^\d{10,}$/)) {
            showToast('error', 'Hata', 'Geçerli bir telefon numarası girin.');
            return;
        }

        try {
            if (user) {
                const userDoc = doc(db, 'users', user.uid);
                await setDoc(userDoc, { phoneNumber: userInfo.phoneNumber }, { merge: true });

                setUserData((prevData) => ({
                    ...prevData,
                    phoneNumber: userInfo.phoneNumber,
                }));
                setPhoneModalVisible(false);
                showToast('success', 'Başarılı', 'Telefon numarası güncellendi.');
            }
        } catch (error) {
            showToast('error', 'Hata', 'Telefon numarası güncellenirken bir hata oluştu.');
        }
    };

    const handleAddInstaAccount = async () => {
        try {
            if (user) {
                const userDoc = doc(db, 'users', user.uid);
                await setDoc(userDoc, { insta: userInfo.insta }, { merge: true });

                setUserData((prevData) => ({
                    ...prevData,
                    insta: userInfo.insta,
                }));
                setInstaModalVisible(false);
                showToast('success', 'Başarılı', 'Instagram hesabı güncellendi.');
            }
        } catch (error) {
            showToast('error', 'Hata', 'Instagram hesabı güncellenirken bir hata oluştu.');
        }
    };

    const handleUpdateBio = async () => {
        try {
            if (user) {
                const userDoc = doc(db, 'users', user.uid);
                await setDoc(userDoc, { bio: userInfo.bio }, { merge: true });

                setUserData((prevData) => ({
                    ...prevData,
                    bio: userInfo.bio,
                }));
                setBioModalVisible(false);
                showToast('success', 'Başarılı', 'Biyografi güncellendi.');
            }
        } catch (error) {
            showToast('error', 'Hata', 'Biyografi güncellenirken bir hata oluştu.');
        }
    };

    const handleChangeProfilePicture = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            showToast('error', 'İzin Gerekli', 'Bu özelliği kullanmak için medya kütüphanesi erişim izni vermelisiniz.');
            return;
        }

        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            quality: 0.3,
        });

        if (!result.canceled) {
            const { uri } = result.assets[0];
            setImageUri(uri);
            setUploading(true); // Yüklemeyi başlatıyoruz
            setProgress(0); // İlerlemeyi sıfırlıyoruz

            const user = getAuth().currentUser;
            if (user) {
                try {
                    const response = await fetch(uri);
                    const blob = await response.blob();
                    const storageRef = ref(storage, `profile_pictures/${user.uid}`);
                    const uploadTask = uploadBytesResumable(storageRef, blob);

                    uploadTask.on(
                        'state_changed',
                        (snapshot) => {
                            const prog = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                            setProgress(prog); // Yükleme ilerlemesini güncelliyoruz
                        },
                        (error) => {
                            showToast('error', 'Hata', 'Fotoğraf yüklenirken bir hata oluştu.');
                        },
                        async () => {
                            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                            const userDoc = doc(db, `users/${user.uid}`);
                            await setDoc(userDoc, { profilePicture: downloadURL }, { merge: true });
                            setUserData((prevData) => ({
                                ...prevData,
                                profilePicture: downloadURL,
                            }));
                            showToast('success', 'Başarılı', 'Profil fotoğrafınız güncellendi.');
                            setUploading(false); // Yükleme tamamlandı
                        }
                    );
                } catch (error) {
                    showToast('error', 'Hata', 'Fotoğraf yüklenirken bir hata oluştu.');
                    setUploading(false); // Hata durumunda yükleme durumu false yapılıyor
                }
            }
        }
    };


    const getProfileImageUri = () => {
        if (userData?.profilePicture) {
            return { uri: userData.profilePicture };
        }
        else {
            const initials = userData?.name?.slice(0, 2).toUpperCase() || "PP";
            return {
                uri: `https://ui-avatars.com/api/?name=${initials}&background=4CAF50&color=fff&size=128`,
            };
        }

    };


    const handleNavigateToFriendsPage = () => {
        setModalVisible(false);
        navigation.navigate('Arkadaşlar');
    };

    const handleBioChange = (text) => {
        setUserInfo((prevData) => ({
            ...prevData,
            bio: text,
        }));
    };
    const handlePhoneNumberChange = (text) => {
        setUserInfo((prevData) => ({
            ...prevData,
            phoneNumber: text,
        }));
    };
    const handleInstaAccountChange = (text) => {
        setUserInfo((prevData) => ({
            ...prevData,
            insta: text,
        }));
    };

    return (
        <Modal
            animationType="fade"
            transparent={true}
            visible={modalVisible}
            onRequestClose={() => setModalVisible(false)}
        >
            <View style={styles.modalContainer}>
                <View style={styles.modalContent}>
                    <View style={styles.header}>
                        <View style={styles.profileSection}>
                            <TouchableOpacity style={styles.imageContainer} onPress={() => setImageModalVisible(true)}>
                                <Image
                                    style={styles.profileImage}
                                    source={getProfileImageUri()}
                                />
                                <TouchableOpacity style={styles.editIcon} onPress={handleChangeProfilePicture}>
                                    <FontAwesome name="pencil" size={18} color="#fff" />
                                </TouchableOpacity>
                            </TouchableOpacity>


                            <View style={styles.nameSection}>
                                <Text style={styles.name}>{userData?.name || ''}</Text>
                                <Text style={styles.jobTitle}>{userInfo?.bio || 'Biyografi Ekleyin'}</Text>
                                <View style={styles.statsSection}>
                                    <TouchableOpacity style={styles.statsBox} onPress={handleNavigateToFriendsPage}>
                                        <Text style={styles.statsNumber}>{userData?.friendsCount || 0}</Text>
                                        <Text style={styles.statsLabel}>Arkadaş</Text>
                                    </TouchableOpacity>
                                    <View style={styles.statsBox}>
                                        <Text style={styles.statsNumber}>10</Text>
                                        <Text style={styles.statsLabel}>Favori</Text>
                                    </View>
                                </View>
                            </View>
                        </View>
                    </View>

                    <View style={styles.infoContainer}>
                        <View style={styles.infoRow}>
                            <Entypo name="mail" size={24} color="#4A90E2" />
                            <Text style={styles.infoText}>
                                {userData?.email || auth.currentUser?.email || ''}
                            </Text>
                        </View>
                        <TouchableOpacity style={styles.infoRow} onPress={() => setPhoneModalVisible(true)}>
                            <Entypo name="phone" size={24} color="#4A90E2" />
                            <Text style={styles.infoText}>{userInfo?.phoneNumber || 'Telefon numarası ekle'}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.infoRow} onPress={() => setInstaModalVisible(true)}>
                            <Entypo name="instagram" size={24} color="#4A90E2" />
                            <Text style={styles.infoText}>{'@' + userInfo?.insta || 'Instagram hesabı ekle'}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.infoRow} onPress={() => setBioModalVisible(true)}>
                            <Entypo name="text" size={24} color="#4A90E2" />
                            <Text style={styles.infoText}>{userInfo?.bio || 'Biyografi ekle'}</Text>
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity style={styles.closeButton} onPress={() => setModalVisible(false)}>
                        <Text style={styles.closeButtonText}>Kapat</Text>
                    </TouchableOpacity>
                </View>
            </View>

            <Modal
                animationType="fade"
                transparent={true}
                visible={phoneModalVisible}
                onRequestClose={() => setPhoneModalVisible(false)}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Telefon Numarası Ekle</Text>
                        <TextInput
                            style={styles.input}
                            value={userInfo.phoneNumber}
                            onChangeText={handlePhoneNumberChange}
                            placeholder="Telefon numarası"
                            keyboardType="phone-pad"
                        />
                        <Button title="Kaydet" onPress={handleAddPhoneNumber} />
                        <TouchableOpacity style={styles.closeButton} onPress={() => setPhoneModalVisible(false)}>
                            <Text style={styles.closeButtonText}>İptal</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            <Modal
                animationType="fade"
                transparent={true}
                visible={instaModalVisible}
                onRequestClose={() => setInstaModalVisible(false)}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Instagram Hesabı Ekle</Text>
                        <TextInput
                            style={styles.input}
                            value={userInfo.insta}
                            onChangeText={handleInstaAccountChange}
                            placeholder="Instagram hesabı"
                        />
                        <Button title="Kaydet" onPress={handleAddInstaAccount} />
                        <TouchableOpacity style={styles.closeButton} onPress={() => setInstaModalVisible(false)}>
                            <Text style={styles.closeButtonText}>İptal</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            <Modal
                animationType="fade"
                transparent={true}
                visible={bioModalVisible}
                onRequestClose={() => setBioModalVisible(false)}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Biyografi Ekle</Text>
                        <TextInput
                            style={styles.input}
                            value={userInfo.bio}
                            onChangeText={handleBioChange}
                            placeholder="Biyografi"
                        />
                        <Button title="Kaydet" onPress={handleUpdateBio} />
                        <TouchableOpacity style={styles.closeButton} onPress={() => setBioModalVisible(false)}>
                            <Text style={styles.closeButtonText}>İptal</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            <Modal
                animationType="fade"
                transparent={true}
                visible={imageModalVisible}
                onRequestClose={() => setImageModalVisible(false)}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.imageModalContent}>
                        <TouchableOpacity style={styles.closeButtonImage} onPress={() => setImageModalVisible(false)}>
                            <Text style={styles.closeButtonTextImage}>X</Text>
                        </TouchableOpacity>
                        <Image
                            style={styles.largeImage}
                            source={getProfileImageUri()} // Burada kullanıcı profil fotoğrafını gösterecek
                        />
                        {/* Yükleme Durumu */}
                        {uploading && (
                            <View style={styles.uploadingContainer}>
                                <Text style={styles.uploadingText}>Yükleniyor... {Math.round(progress)}%</Text>
                                <View style={styles.progressBar}>
                                    <View
                                        style={[styles.progress, { width: `${progress}%` }]} // İlerlemeyi gösteriyoruz
                                    />
                                </View>
                            </View>
                        )}
                    </View>
                </View>
            </Modal>

        </Modal>
    );
};

const styles = StyleSheet.create({
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.3)', // Daha yumuşak bir arka plan rengi
    },
    modalContent: {
        backgroundColor: 'white',
        padding: 30,
        borderRadius: 20, // Yuvarlatılmış köşeler
        width: '85%',
        maxWidth: 420,
        elevation: 5, // Gölgeleme efekti
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
    },
    header: {
        alignItems: 'center',
        marginBottom: 20,
    },
    profileSection: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    imageContainer: {
        position: 'relative',
        marginRight: 20,
    },
    profileImage: {
        width: 100,
        height: 100,
        borderRadius: 50, // Profil fotoğrafı yuvarlak
        borderWidth: 3,
        borderColor: '#4CAF50', // Çerçeve rengi
    },
    editIcon: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: '#4CAF50',
        borderRadius: 20,
        padding: 6,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
    },
    nameSection: {
        flex: 1,
    },
    name: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#333', // Ana metin rengi
    },
    jobTitle: {
        fontSize: 16,
        color: '#888', // Daha açık renkli bir alt yazı
    },
    statsSection: {
        flexDirection: 'row',
        marginTop: 10,
        justifyContent: 'space-between',
    },
    statsBox: {
        alignItems: 'center',
        width: '45%', // Daha düzenli istatistik kutuları
        paddingVertical: 10,
        backgroundColor: '#F4F4F4', // Daha yumuşak arka plan
        borderRadius: 10,
    },
    statsNumber: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    statsLabel: {
        fontSize: 12,
        color: '#777',
    },
    infoContainer: {
        marginTop: 20,
        borderTopWidth: 1,
        borderTopColor: '#f1f1f1',
        paddingTop: 15,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
    },
    infoText: {
        marginLeft: 10,
        fontSize: 16,
        color: '#444', // Daha net bir yazı rengi
    },
    closeButton: {
        marginTop: 20,
        backgroundColor: '#4CAF50',
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        marginHorizontal: 20, // Buton genişliği
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
    },
    closeButtonText: {
        color: 'black',
        fontWeight: 'bold',
        fontSize: 16,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 10,
        color: '#333',
    },
    input: {
        height: 45,
        borderColor: '#ccc',
        borderWidth: 1,
        borderRadius: 10,
        marginBottom: 20,
        paddingLeft: 15,
        fontSize: 16,
        color: '#333',
    },
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.7)', // Arka planı karartmak
    },
    imageModalContent: {
        backgroundColor: 'white',
        padding: 20,
        borderRadius: 20,
        alignItems: 'center',
    },
    largeImage: {
        width: 300, // Resmin genişliği
        height: 300, // Resmin yüksekliği
        borderRadius: 10, // İstenirse köşeleri yuvarlatabilirsiniz
    },
    closeButtonImage: {
        position: 'absolute',
        right: -15, // Sağdan mesafe
        top: -20, // Üstten mesafe
        backgroundColor: '#FF4C4C', // Kırmızı arka plan
        padding: 12, // Butonun iç paddingi
        borderRadius: 100, // Yuvarlatılmış köşeler
        alignItems: 'center',
        justifyContent: 'center',
    },
    closeButtonTextImage: {
        color: 'white', // Kırmızı butonda beyaz renk
        fontWeight: 'bold',
        fontSize: 20, // Daha büyük bir "X" ikonu
    },
    uploadingContainer: {
        marginTop: 20,
        alignItems: 'center',
    },
    uploadingText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#4CAF50',
    },
    progressBar: {
        width: '100%',
        height: 10,
        backgroundColor: '#ddd',
        borderRadius: 5,
        marginTop: 10,
    },
    progress: {
        height: '100%',
        backgroundColor: '#4CAF50',
        borderRadius: 5,
    },
});

export default ProfileModal;