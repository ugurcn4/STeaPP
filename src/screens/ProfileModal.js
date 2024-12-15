// ProfileModal.js
import React, { useState, useEffect } from 'react';
import { View, Text, Image, TouchableOpacity, Modal, TextInput, Button, Alert } from 'react-native';
import { Entypo, FontAwesome } from '@expo/vector-icons';
import { getAuth } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../firebaseConfig';

const ProfileModal = ({ modalVisible, setModalVisible }) => {
    const [userData, setUserData] = useState({}); // Tüm kullanıcı bilgilerini burada tut
    const [instagram, setInstagram] = useState('');
    const [telno, setTelno] = useState('');
    const [currentModal, setCurrentModal] = useState(null); // 'phone' veya 'instagram' değerlerini alabilir
    const auth = getAuth();

    useEffect(() => {
        const fetchUserData = async () => {
            const user = auth.currentUser;
            if (user) {
                try {
                    const contactDoc = doc(db, `users/${user.uid}/informations/contact`);
                    const contactSnapshot = await getDoc(contactDoc);
                    const contactData = contactSnapshot.exists() ? contactSnapshot.data() : {};

                    const friendsDoc = doc(db, `users/${user.uid}`);
                    const friendsSnapshot = await getDoc(friendsDoc);
                    const friendsData = friendsSnapshot.exists() ? friendsSnapshot.data().friends || [] : [];

                    setUserData({
                        ...contactData,
                        friendCount: friendsData.length,
                        email: user.email, // Kullanıcının email bilgisini ekle
                    });

                    if (contactData.phone) setTelno(contactData.phone);
                    if (contactData.instagram) setInstagram(contactData.instagram);
                } catch (error) {
                    console.error('Kullanıcı verileri getirilirken hata oluştu:', error);
                }
            }
        };

        if (modalVisible) fetchUserData();
    }, [modalVisible]);

    const handleSaveContactInfo = async (field, value) => {
        try {
            const user = auth.currentUser;
            if (user) {
                const contactDoc = doc(db, `users/${user.uid}/informations/contact`);
                await setDoc(contactDoc, { [field]: value }, { merge: true });
                setUserData((prevData) => ({ ...prevData, [field]: value }));
                setCurrentModal(null);
            }
        } catch (error) {
            Alert.alert('Hata', `${field === 'phone' ? 'Telefon numarası' : 'Instagram hesabı'} eklenirken bir hata oluştu.`);
            console.error('Error saving contact info:', error);
        }
    };

    const toggleModal = (type) => setCurrentModal(type);

    return (
        <Modal
            animationType="fade"
            transparent
            visible={modalVisible}
            onRequestClose={() => setModalVisible(false)}
        >
            <View style={styles.modalContainer}>
                <View style={styles.modalContent}>
                    <View style={styles.header}>
                        <View style={styles.profileSection}>
                            <View style={styles.imageContainer}>
                                <TouchableOpacity style={styles.editIcon}>
                                    <FontAwesome name="pencil" size={18} color="#fff" />
                                </TouchableOpacity>
                            </View>
                            <View style={styles.nameSection}>
                                <Text style={styles.name}>{userData.name || ''}</Text>
                                <Text style={styles.jobTitle}>Bilgisayar Mühendisi</Text>
                            </View>
                        </View>
                        <View style={styles.statsSection}>
                            <View style={styles.statsBox}>
                                <Text style={styles.statsNumber}>{userData.friendCount || 0}</Text>
                                <Text style={styles.statsLabel}>Arkadaş</Text>
                            </View>
                            <View style={styles.statsBox}>
                                <Text style={styles.statsNumber}>10</Text>
                                <Text style={styles.statsLabel}>Favori</Text>
                            </View>
                        </View>
                    </View>
                    <View style={styles.infoContainer}>
                        <View style={styles.infoRow}>
                            <Entypo name="mail" size={24} color="#4A90E2" />
                            <Text style={styles.infoText}>{userData.email || ''}</Text>
                        </View>
                        <TouchableOpacity style={styles.infoRow} onPress={() => toggleModal('phone')}>
                            <Entypo name="phone" size={24} color="#4A90E2" />
                            <Text style={styles.infoText}>{userData.phone || 'Telefon numarası ekle'}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.infoRow} onPress={() => toggleModal('instagram')}>
                            <Entypo name="instagram" size={24} color="#4A90E2" />
                            <Text style={styles.infoText}>{userData.instagram || 'Instagram hesabı ekle'}</Text>
                        </TouchableOpacity>
                        <View style={styles.infoRow}>
                            <Entypo name="globe" size={24} color="#4A90E2" />
                            <Text style={styles.infoText}>www.feniksdijital.com</Text>
                        </View>
                    </View>
                    <TouchableOpacity style={styles.closeButton} onPress={() => setModalVisible(false)}>
                        <Text style={styles.closeButtonText}>Kapat</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Telefon Modal */}
            {currentModal === 'phone' && (
                <Modal animationType="slide" transparent visible onRequestClose={() => toggleModal(null)}>
                    <View style={styles.modalContainer}>
                        <View style={styles.modalContent}>
                            <Text style={styles.modalTitle}>Telefon Numarası Ekle</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Telefon numarası"
                                value={telno}
                                onChangeText={setTelno}
                                keyboardType="phone-pad"
                            />
                            <View style={styles.buttonRow}>
                                <Button title="İptal" onPress={() => toggleModal(null)} />
                                <Button title="Tamam" onPress={() => handleSaveContactInfo('phone', telno)} />
                            </View>
                        </View>
                    </View>
                </Modal>
            )}

            {/* Instagram Modal */}
            {currentModal === 'instagram' && (
                <Modal animationType="slide" transparent visible onRequestClose={() => toggleModal(null)}>
                    <View style={styles.modalContainer}>
                        <View style={styles.modalContent}>
                            <Text style={styles.modalTitle}>Instagram Hesabı Ekle</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Instagram kullanıcı adınız"
                                value={instagram}
                                onChangeText={setInstagram}
                            />
                            <View style={styles.buttonRow}>
                                <Button title="İptal" onPress={() => toggleModal(null)} />
                                <Button title="Tamam" onPress={() => handleSaveContactInfo('instagram', instagram)} />
                            </View>
                        </View>
                    </View>
                </Modal>
            )}
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContent: {
        width: '90%',
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 20,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 5,
    },
    header: {
        width: '100%',
        backgroundColor: '#fff',
        paddingBottom: 20,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
    },
    profileSection: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 20,
    },
    imageContainer: {
        position: 'relative',
    },
    profileImage: {
        width: 100,
        height: 100,
        borderRadius: 50,
        borderWidth: 3,
        borderColor: '#4A90E2',
    },
    editIcon: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: '#4A90E2',
        width: 30,
        height: 30,
        borderRadius: 15,
        justifyContent: 'center',
        alignItems: 'center',
    },
    nameSection: {
        marginLeft: 20,
    },
    name: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
    },
    jobTitle: {
        fontSize: 16,
        color: '#999',
    },
    statsSection: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginTop: 20,
    },
    statsBox: {
        alignItems: 'center',
    },
    statsNumber: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#4A90E2',
    },
    statsLabel: {
        fontSize: 14,
        color: '#999',
    },
    infoContainer: {
        width: '100%',
        marginTop: 20,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 15,
        paddingHorizontal: 10,
        backgroundColor: '#fff',
        borderRadius: 15,
        marginBottom: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 5,
    },
    infoText: {
        marginLeft: 15,
        fontSize: 18,
        fontWeight: '500',
        color: '#333',
    },
    closeButton: {
        marginTop: 20,
        backgroundColor: '#4A90E2',
        padding: 10,
        borderRadius: 20,
    },
    closeButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 20,
    },
    input: {
        width: '100%',
        padding: 10,
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 5,
        marginBottom: 20,
    },
    buttonRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
    },
});

export default ProfileModal;