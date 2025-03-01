import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity, ScrollView, Alert, TextInput, Modal } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { lightTheme, darkTheme } from '../../themes';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { auth, db } from '../../../firebaseConfig';
import { EmailAuthProvider, reauthenticateWithCredential, deleteUser } from 'firebase/auth';
import { doc, deleteDoc, collection, query, where, getDocs, writeBatch, getDoc, updateDoc } from 'firebase/firestore';
import { logout, updatePrivacySettings, savePrivacySettings, updateVisibility, setAllPrivacySettings } from '../../redux/userSlice';
import Toast from 'react-native-toast-message';

const PrivacyPage = ({ navigation }) => {
    const dispatch = useDispatch();
    const theme = useSelector((state) => state.theme.theme);
    const currentTheme = theme === 'dark' ? darkTheme : lightTheme;
    const user = useSelector((state) => state.user.user) || auth.currentUser;
    const privacySettings = useSelector((state) => state.user.settings.privacySettings);
    const visibility = useSelector((state) => state.user.settings.visibility);
    const [deleteModalVisible, setDeleteModalVisible] = useState(false);
    const [password, setPassword] = useState('');
    const [deleteReason, setDeleteReason] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!user?.uid) {
            const currentUser = auth.currentUser;
            if (!currentUser?.uid) {
                Alert.alert('Hata', 'Oturum süreniz dolmuş olabilir. Lütfen tekrar giriş yapın.');
                navigation.navigate('Login');
                return;
            }
        }

        // Firestore'dan ayarları çek
        const fetchSettings = async () => {
            try {
                const userDoc = await getDoc(doc(db, 'users', user.uid));
                if (userDoc.exists()) {
                    const userData = userDoc.data();
                    if (userData.settings?.privacySettings) {
                        dispatch(setAllPrivacySettings(userData.settings.privacySettings));
                    }
                }
            } catch (error) {
                console.error('Ayarlar yüklenirken hata:', error);
            }
        };

        fetchSettings();
    }, [user]);

    const getSettingMessage = (setting, value) => {
        switch (setting) {
            case 'visibility':
                return value === 'public'
                    ? 'Artık herkes profilinizi görüntüleyebilir'
                    : 'Şu an sadece arkadaşlarınız profilinizi görüntüleyebilir';
            case 'locationSharing':
                return value
                    ? 'Artık arkadaşlarınız konumunuzu görebilir'
                    : 'Artık kimse konumunuzu göremez';
            case 'activityStatus':
                return value
                    ? 'Arkadaşlarınız çevrimiçi olduğunuzu görebilir'
                    : 'Çevrimiçi durumunuz gizlendi';
            case 'friendsList':
                return value
                    ? 'Arkadaş listeniz herkese açık'
                    : 'Arkadaş listeniz gizlendi';
            case 'searchable':
                return value
                    ? 'Kullanıcılar sizi arama sonuçlarında görebilir'
                    : 'Artık arama sonuçlarında görünmeyeceksiniz';
            case 'dataCollection':
                return value
                    ? 'Uygulama deneyiminizi iyileştirmek için veri toplanacak'
                    : 'Artık verileriniz toplanmayacak';
            default:
                return 'Ayarlar güncellendi';
        }
    };

    const showToast = (message) => {
        Toast.show({
            type: 'success',
            text1: 'Bilgi',
            text2: message,
            position: 'top',
            visibilityTime: 4000,
        });
    };

    const toggleSetting = async (key) => {
        if (!user?.uid) {
            Alert.alert('Hata', 'Kullanıcı bilgilerine ulaşılamadı');
            return;
        }

        const newValue = !privacySettings[key];

        dispatch(updatePrivacySettings({ setting: key, value: newValue }));

        try {
            await dispatch(savePrivacySettings({
                userId: user.uid,
                settings: {
                    ...privacySettings,
                    [key]: newValue
                }
            }));
            showToast(getSettingMessage(key, newValue));
        } catch (error) {
            console.error('Ayar güncellenirken hata:', error);
            Alert.alert('Hata', 'Ayarlar kaydedilirken bir hata oluştu');
        }
    };

    const handleVisibilityChange = async (newValue) => {
        if (!user?.uid) {
            Alert.alert('Hata', 'Kullanıcı bilgilerine ulaşılamadı');
            return;
        }

        dispatch(updateVisibility(newValue));

        try {
            const userRef = doc(db, 'users', user.uid);
            await updateDoc(userRef, {
                'settings.visibility': newValue
            });
            showToast(getSettingMessage('visibility', newValue));
        } catch (error) {
            console.error('Görünürlük ayarı güncellenirken hata:', error);
            Alert.alert('Hata', 'Görünürlük ayarı kaydedilirken bir hata oluştu');
        }
    };

    const deleteReasons = [
        'Uygulamayı artık kullanmıyorum',
        'Gizlilik endişelerim var',
        'Başka bir uygulama kullanıyorum',
        'Teknik sorunlar yaşıyorum',
        'Diğer'
    ];

    const showDeleteConfirmation = () => {
        Alert.alert(
            "Hesap Silme",
            "Hesabınızı silmek üzeresiniz. Bu işlem geri alınamaz ve tüm verileriniz kalıcı olarak silinecektir.",
            [
                {
                    text: "İptal",
                    style: "cancel"
                },
                {
                    text: "Devam Et",
                    onPress: () => setDeleteModalVisible(true),
                    style: "destructive"
                }
            ]
        );
    };

    const handleDeleteAccount = async () => {
        if (!password) {
            Alert.alert("Hata", "Lütfen şifrenizi girin");
            return;
        }
        if (!deleteReason) {
            Alert.alert("Hata", "Lütfen hesap silme nedeninizi seçin");
            return;
        }

        setLoading(true);
        try {
            const user = auth.currentUser;

            if (!user || !user.email) {
                throw new Error('Kullanıcı bilgileri bulunamadı');
            }

            // Kimlik doğrulama işlemini güncelle
            try {
                const credential = EmailAuthProvider.credential(
                    user.email,
                    password
                );

                await reauthenticateWithCredential(user, credential);
            } catch (authError) {
                console.error('Kimlik doğrulama hatası:', authError);
                if (authError.code === 'auth/invalid-credential') {
                    Alert.alert(
                        "Hata",
                        "Girdiğiniz şifre yanlış. Lütfen şifrenizi kontrol edip tekrar deneyin."
                    );
                } else if (authError.code === 'auth/too-many-requests') {
                    Alert.alert(
                        "Hata",
                        "Çok fazla başarısız deneme. Lütfen bir süre bekleyip tekrar deneyin."
                    );
                } else {
                    Alert.alert(
                        "Hata",
                        "Kimlik doğrulama başarısız. Lütfen tekrar giriş yapıp deneyin."
                    );
                }
                setLoading(false);
                return;
            }

            // Batch işlemi başlat
            const batch = writeBatch(db);

            // Kullanıcının tüm verilerini temizle
            const collectionsToDelete = [
                'users',
                'userSettings',
                'locations',
                'shares',
                'sharedLocations',
                'liveLocations',
                'friends',
                'notifications'
            ];

            // Her bir koleksiyonda kullanıcıya ait verileri sil
            for (const collectionName of collectionsToDelete) {
                // Ana dokümanı sil
                const docRef = doc(db, collectionName, user.uid);
                batch.delete(docRef);

                // Alt koleksiyonları temizle
                const subCollections = await getDocs(
                    query(collection(db, collectionName), where('userId', '==', user.uid))
                );
                subCollections.forEach(doc => {
                    batch.delete(doc.ref);
                });
            }

            // Arkadaşlık ilişkilerini temizle
            const friendsQuery = query(
                collection(db, 'friends'),
                where('friendId', '==', user.uid)
            );
            const friendDocs = await getDocs(friendsQuery);
            friendDocs.forEach(doc => {
                batch.delete(doc.ref);
            });

            // Silme nedenini kaydet (istatistik için)
            const deleteReasonRef = doc(db, 'deletedAccounts', user.uid);
            batch.set(deleteReasonRef, {
                reason: deleteReason,
                timestamp: new Date().toISOString(),
                email: user.email,
                deletedAt: new Date()
            });

            // Tüm batch işlemlerini gerçekleştir
            await batch.commit();

            // Firebase Auth'dan kullanıcıyı sil
            await deleteUser(user);

            // Modal ve loading durumlarını kapat
            setDeleteModalVisible(false);
            setLoading(false);

            // Önce Redux state'i güncelle
            dispatch(logout());

            // Bilgilendirme mesajı
            Alert.alert(
                "Hesap Silindi",
                "Hesabınız ve tüm verileriniz başarıyla silindi."
            );

        } catch (error) {
            console.error('Hesap silme hatası:', error);
            Alert.alert(
                "Hata",
                "Hesap silinirken beklenmeyen bir hata oluştu. Lütfen daha sonra tekrar deneyin."
            );
            setLoading(false);
            setDeleteModalVisible(false);
        }
    };

    return (
        <>
            <ScrollView style={[styles.container, { backgroundColor: currentTheme.background }]}>
                <View style={styles.headerContainer}>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => navigation.goBack()}
                    >
                        <Ionicons
                            name="arrow-back"
                            size={24}
                            color={currentTheme.text}
                        />
                    </TouchableOpacity>
                    <Text style={[styles.header, { color: currentTheme.text }]}>
                        Gizlilik
                    </Text>
                </View>

                <View style={styles.section}>
                    <View style={styles.privacyItem}>
                        <View style={styles.settingInfo}>
                            <Ionicons name="person-outline" size={24} color={currentTheme.text} />
                            <View style={styles.textContainer}>
                                <Text style={[styles.settingTitle, { color: currentTheme.text }]}>
                                    Profil Görünürlüğü
                                </Text>
                                <Text style={styles.settingDescription}>
                                    Profilinizi kimler görebilir
                                </Text>
                            </View>
                        </View>
                        <Switch
                            value={visibility === 'public'}
                            onValueChange={(value) => handleVisibilityChange(value ? 'public' : 'private')}
                            trackColor={{ false: "#767577", true: "#32CD32" }}
                        />
                    </View>

                    <View style={styles.privacyItem}>
                        <View style={styles.settingInfo}>
                            <Ionicons name="location-outline" size={24} color={currentTheme.text} />
                            <View style={styles.textContainer}>
                                <Text style={[styles.settingTitle, { color: currentTheme.text }]}>
                                    Konum Paylaşımı
                                </Text>
                                <Text style={styles.settingDescription}>
                                    Konumunuzu arkadaşlarınızla paylaşın
                                </Text>
                            </View>
                        </View>
                        <Switch
                            value={privacySettings.locationSharing}
                            onValueChange={() => toggleSetting('locationSharing')}
                            trackColor={{ false: "#767577", true: "#32CD32" }}
                        />
                    </View>

                    <View style={styles.privacyItem}>
                        <View style={styles.settingInfo}>
                            <Ionicons name="radio-button-on-outline" size={24} color={currentTheme.text} />
                            <View style={styles.textContainer}>
                                <Text style={[styles.settingTitle, { color: currentTheme.text }]}>
                                    Çevrimiçi Durumu
                                </Text>
                                <Text style={styles.settingDescription}>
                                    Çevrimiçi olduğunuzu göster
                                </Text>
                            </View>
                        </View>
                        <Switch
                            value={privacySettings.activityStatus}
                            onValueChange={() => toggleSetting('activityStatus')}
                            trackColor={{ false: "#767577", true: "#32CD32" }}
                        />
                    </View>

                    <View style={styles.privacyItem}>
                        <View style={styles.settingInfo}>
                            <Ionicons name="people-outline" size={24} color={currentTheme.text} />
                            <View style={styles.textContainer}>
                                <Text style={[styles.settingTitle, { color: currentTheme.text }]}>
                                    Arkadaş Listesi
                                </Text>
                                <Text style={styles.settingDescription}>
                                    Arkadaş listenizi kimler görebilir
                                </Text>
                            </View>
                        </View>
                        <Switch
                            value={privacySettings.friendsList}
                            onValueChange={() => toggleSetting('friendsList')}
                            trackColor={{ false: "#767577", true: "#32CD32" }}
                        />
                    </View>

                    <View style={styles.privacyItem}>
                        <View style={styles.settingInfo}>
                            <Ionicons name="search-outline" size={24} color={currentTheme.text} />
                            <View style={styles.textContainer}>
                                <Text style={[styles.settingTitle, { color: currentTheme.text }]}>
                                    Arama Görünürlüğü
                                </Text>
                                <Text style={styles.settingDescription}>
                                    Aramada görünür ol
                                </Text>
                            </View>
                        </View>
                        <Switch
                            value={privacySettings.searchable}
                            onValueChange={() => toggleSetting('searchable')}
                            trackColor={{ false: "#767577", true: "#32CD32" }}
                        />
                    </View>

                    <View style={styles.privacyItem}>
                        <View style={styles.settingInfo}>
                            <Ionicons name="analytics-outline" size={24} color={currentTheme.text} />
                            <View style={styles.textContainer}>
                                <Text style={[styles.settingTitle, { color: currentTheme.text }]}>
                                    Veri Toplama
                                </Text>
                                <Text style={styles.settingDescription}>
                                    Deneyimi iyileştirmek için veri topla
                                </Text>
                            </View>
                        </View>
                        <Switch
                            value={privacySettings.dataCollection}
                            onValueChange={() => toggleSetting('dataCollection')}
                            trackColor={{ false: "#767577", true: "#32CD32" }}
                        />
                    </View>
                </View>

                <View style={styles.dangerZone}>
                    <Text style={styles.dangerZoneTitle}>Tehlikeli Bölge</Text>
                    <TouchableOpacity
                        style={styles.deleteButton}
                        onPress={showDeleteConfirmation}
                    >
                        <Ionicons name="trash-outline" size={24} color="#FF3B30" />
                        <Text style={styles.deleteButtonText}>Hesabı Sil</Text>
                    </TouchableOpacity>
                </View>

                <Modal
                    visible={deleteModalVisible}
                    animationType="slide"
                    transparent={true}
                    onRequestClose={() => setDeleteModalVisible(false)}
                    statusBarTranslucent={true}
                >
                    <TouchableOpacity
                        style={styles.modalContainer}
                        activeOpacity={1}
                        onPress={() => setDeleteModalVisible(false)}
                    >
                        <TouchableOpacity
                            activeOpacity={1}
                            onPress={(e) => e.stopPropagation()}
                        >
                            <View style={[
                                styles.modalContent,
                                {
                                    backgroundColor: '#FFFFFF'
                                }
                            ]}>
                                <View style={styles.modalHeader}>
                                    <Ionicons name="warning-outline" size={40} color="#FF3B30" />
                                    <Text style={[styles.modalTitle, { color: currentTheme.text }]}>
                                        Hesabınızı Silmek İstediğinize Emin misiniz?
                                    </Text>
                                    <Text style={[styles.modalSubtitle, { color: currentTheme.textSecondary }]}>
                                        Bu işlem geri alınamaz ve tüm verileriniz kalıcı olarak silinecektir.
                                    </Text>
                                </View>

                                <Text style={[styles.sectionTitle, { color: currentTheme.text }]}>
                                    Silme Nedeni
                                </Text>
                                <ScrollView style={styles.reasonsContainer}>
                                    {deleteReasons.map((reason, index) => (
                                        <TouchableOpacity
                                            key={index}
                                            style={[
                                                styles.reasonButton,
                                                { backgroundColor: currentTheme.cardBackground },
                                                deleteReason === reason && styles.selectedReason
                                            ]}
                                            onPress={() => setDeleteReason(reason)}
                                        >
                                            <View style={styles.reasonContent}>
                                                <View style={styles.radioButton}>
                                                    <View style={deleteReason === reason ? styles.radioButtonSelected : null} />
                                                </View>
                                                <Text style={[
                                                    styles.reasonText,
                                                    { color: currentTheme.text }
                                                ]}>
                                                    {reason}
                                                </Text>
                                            </View>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>

                                <Text style={[styles.sectionTitle, { color: currentTheme.text }]}>
                                    Hesap Şifreniz
                                </Text>
                                <TextInput
                                    style={[styles.passwordInput, {
                                        backgroundColor: currentTheme.cardBackground,
                                        borderColor: currentTheme.border,
                                        color: currentTheme.text
                                    }]}
                                    placeholder="Şifrenizi girin"
                                    placeholderTextColor={currentTheme.textSecondary}
                                    secureTextEntry
                                    value={password}
                                    onChangeText={setPassword}
                                />

                                <View style={styles.modalButtons}>
                                    <TouchableOpacity
                                        style={[styles.modalButton, styles.cancelButton]}
                                        onPress={() => setDeleteModalVisible(false)}
                                    >
                                        <Text style={styles.cancelButtonText}>Vazgeç</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[
                                            styles.modalButton,
                                            styles.confirmButton,
                                            !password || !deleteReason && styles.disabledButton
                                        ]}
                                        onPress={handleDeleteAccount}
                                        disabled={loading || !password || !deleteReason}
                                    >
                                        <Text style={styles.confirmButtonText}>
                                            {loading ? 'Siliniyor...' : 'Hesabı Sil'}
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </TouchableOpacity>
                    </TouchableOpacity>
                </Modal>

                <Text style={[styles.note, { color: currentTheme.text }]}>
                    Not: Gizlilik ayarlarınızı istediğiniz zaman değiştirebilirsiniz. Bu ayarlar hesabınızın güvenliğini ve gizliliğini etkiler.
                </Text>
            </ScrollView>
            <Toast />
        </>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
    },
    headerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 30,
        marginTop: 60,
    },
    backButton: {
        padding: 10,
        marginRight: 10,
    },
    header: {
        fontSize: 28,
        fontWeight: 'bold',
    },
    section: {
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 12,
        padding: 15,
        marginBottom: 20,
    },
    privacyItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.1)',
    },
    settingInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    textContainer: {
        marginLeft: 15,
        flex: 1,
    },
    settingTitle: {
        fontSize: 16,
        fontWeight: '500',
    },
    settingDescription: {
        fontSize: 12,
        color: '#666',
        marginTop: 2,
    },
    note: {
        fontSize: 14,
        fontStyle: 'italic',
        marginTop: 20,
        opacity: 0.7,
        textAlign: 'center',
        paddingHorizontal: 20,
        marginBottom: 30,
    },
    dangerZone: {
        marginTop: 30,
        padding: 20,
        borderRadius: 12,
        backgroundColor: 'rgba(255,59,48,0.1)',
    },
    dangerZoneTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#FF3B30',
        marginBottom: 15,
    },
    deleteButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 15,
        backgroundColor: 'rgba(255,59,48,0.2)',
        borderRadius: 8,
    },
    deleteButtonText: {
        color: '#FF3B30',
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 10,
    },
    modalContainer: {
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(0,0,0,0.8)',
    },
    modalContent: {
        width: '100%',
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
        maxHeight: '90%',
    },
    modalHeader: {
        alignItems: 'center',
        marginBottom: 24,
    },
    modalTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        textAlign: 'center',
        marginVertical: 12,
    },
    modalSubtitle: {
        fontSize: 14,
        textAlign: 'center',
        marginBottom: 8,
        lineHeight: 20,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 12,
    },
    reasonsContainer: {
        maxHeight: 200,
        marginBottom: 24,
    },
    reasonButton: {
        marginBottom: 8,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.1)',
        backgroundColor: '#FFFFFF',
    },
    reasonContent: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
    },
    radioButton: {
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: '#FF3B30',
        marginRight: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    radioButtonSelected: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: '#FF3B30',
    },
    selectedReason: {
        borderColor: '#FF3B30',
        borderWidth: 2,
    },
    reasonText: {
        fontSize: 15,
        flex: 1,
    },
    passwordInput: {
        borderWidth: 1,
        borderRadius: 12,
        padding: 16,
        marginBottom: 24,
        fontSize: 16,
        backgroundColor: '#FFFFFF',
        borderColor: 'rgba(0,0,0,0.1)',
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 12,
    },
    modalButton: {
        flex: 1,
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    cancelButton: {
        backgroundColor: 'rgba(0,0,0,0.05)',
    },
    confirmButton: {
        backgroundColor: '#FF3B30',
    },
    disabledButton: {
        backgroundColor: '#FF3B30',
        opacity: 0.5,
    },
    cancelButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#000',
    },
    confirmButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFF',
    },
});

export default PrivacyPage; 