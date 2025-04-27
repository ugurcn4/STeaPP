import React, { useState, useRef, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  Modal, 
  TouchableOpacity, 
  ScrollView,
  Image,
  Dimensions,
  TextInput,
  Animated,
  BackHandler
} from 'react-native';
import { PanGestureHandler } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import { translate } from '../i18n/i18n';
import LottieView from 'lottie-react-native';

// Ekran genişliği için
const { width, height } = Dimensions.get('window');

// Tab tipleri
const TABS = {
  CREATE: 'create',
  MY_CAPSULES: 'myCapsules'
};

const CapsuleModal = ({ visible, onClose }) => {
  // Tab durum yönetimi
  const [activeTab, setActiveTab] = useState(TABS.CREATE);
  
  // Kapsül oluşturma ekranı için durumlar
  const [capsuleType, setCapsuleType] = useState(null); // 'time' veya 'location'
  
  // Modal animasyonu için
  const slideAnim = useRef(new Animated.Value(height)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const [modalVisible, setModalVisible] = useState(false);

  // Modal görünürlüğünü takip et
  useEffect(() => {
    if (visible) {
      setModalVisible(true);
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true
        }),
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true
        })
      ]).start();
    } else {
      closeModal();
    }
  }, [visible]);

  // Android geri tuşu için
  useEffect(() => {
    const backAction = () => {
      if (visible) {
        closeModal();
        return true;
      }
      return false;
    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction
    );

    return () => backHandler.remove();
  }, [visible]);

  // Modal'ı kapat
  const closeModal = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: height,
        duration: 300,
        useNativeDriver: true
      }),
      Animated.timing(backdropOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true
      })
    ]).start(() => {
      setModalVisible(false);
      onClose();
    });
  };

  // Tab içeriğini render etme
  const renderTabContent = () => {
    switch (activeTab) {
      case TABS.CREATE:
        return renderCreateTab();
      case TABS.MY_CAPSULES:
        return renderMyCapsules();
      default:
        return null;
    }
  };

  // Kapsül tipini seçme ekranı
  const renderCapsuleTypeSelection = () => {
    return (
      <View style={styles.typeSelectionContainer}>
        {/* Başlık ve Animasyon Bölümü */}
        <View style={styles.welcomeContainer}>
          <View style={styles.bottleAnimationContainer}>
            <LottieView
              source={require('../../assets/animations/bottle.json')}
              autoPlay
              loop
              style={styles.bottleAnimation}
            />
          </View>
          <Text style={styles.welcomeTitle}>Zaman ve Mekan Kapsülleri</Text>
          <Text style={styles.welcomeSubtitle}>Özel mesajlarınızı gelecekte veya özel konumlarda açılmak üzere saklayın</Text>
        </View>
        
        {/* Kapsülün örnekleri */}
        <Text style={styles.examplesTitle}>Ne Yapabilirsiniz?</Text>
        <View style={styles.examplesContainer}>
          <View style={styles.exampleItem}>
            <View style={[styles.exampleIcon, {backgroundColor: 'rgba(231, 76, 60, 0.1)'}]}>
              <Ionicons name="heart-outline" size={20} color="#e74c3c" />
            </View>
            <View style={styles.exampleTextContainer}>
              <Text style={styles.exampleTitle}>Çocuğunuzun 18. Doğum Günü</Text>
              <Text style={styles.exampleText}>Doğduğu hastanede, 18 yaşına geldiğinde ona açılacak bir mesaj bırakın</Text>
            </View>
          </View>
          
          <View style={styles.exampleItem}>
            <View style={[styles.exampleIcon, {backgroundColor: 'rgba(46, 204, 113, 0.1)'}]}>
              <Ionicons name="diamond-outline" size={20} color="#2ecc71" />
            </View>
            <View style={styles.exampleTextContainer}>
              <Text style={styles.exampleTitle}>Evlilik Yıldönümü Sürprizi</Text>
              <Text style={styles.exampleText}>Eşinize ilk tanıştığınız kafede 10. yıldönümünüzde açılacak bir anı</Text>
            </View>
          </View>
          
          <View style={styles.exampleItem}>
            <View style={[styles.exampleIcon, {backgroundColor: 'rgba(52, 152, 219, 0.1)'}]}>
              <Ionicons name="school-outline" size={20} color="#3498db" />
            </View>
            <View style={styles.exampleTextContainer}>
              <Text style={styles.exampleTitle}>Mezuniyet Anısı</Text>
              <Text style={styles.exampleText}>Üniversite arkadaşlarınızla kampüste, 10 yıl sonra açılacak hatıralar</Text>
            </View>
          </View>
        </View>
        
        {/* Kapsül Tipi Seçimi */}
        <Text style={styles.capsuleTypeTitle}>Nasıl Bir Kapsül Oluşturmak İstersiniz?</Text>
        <View style={styles.capsuleTypeCards}>
          <TouchableOpacity
            style={styles.capsuleTypeCard}
            onPress={() => setCapsuleType('time')}
          >
            <View style={styles.capsuleTypeIconContainer}>
              <Ionicons name="timer-outline" size={36} color="#3498db" />
            </View>
            <Text style={styles.capsuleTypeCardTitle}>Zaman Kapsülü</Text>
            <Text style={styles.capsuleTypeDescription}>Belirlediğin tarihte açılacak</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.capsuleTypeCard}
            onPress={() => setCapsuleType('location')}
          >
            <View style={styles.capsuleTypeIconContainer}>
              <Ionicons name="location-outline" size={36} color="#e74c3c" />
            </View>
            <Text style={styles.capsuleTypeCardTitle}>Konum Kapsülü</Text>
            <Text style={styles.capsuleTypeDescription}>Bu konuma dönüldüğünde açılacak</Text>
          </TouchableOpacity>
        </View>
        
        {/* Güvenlik Açıklaması - Alt Kısım */}
        <View style={styles.securityContainer}>
          <Ionicons name="shield-checkmark-outline" size={24} color="#2ecc71" style={styles.securityIcon} />
          <Text style={styles.securityText}>
            Kapsülleriniz tamamen güvenli! Belirlediğiniz zaman veya konum koşulu sağlanana kadar STeaPP dahil hiç kimse içeriğe erişemez.
          </Text>
        </View>
      </View>
    );
  };
  
  // Yeni Kapsül Oluşturma Tab İçeriği
  const renderCreateTab = () => {
    if (!capsuleType) {
      return renderCapsuleTypeSelection();
    }
    
    return renderCapsuleForm();
  };

  // Kapsül oluşturma formu
  const renderCapsuleForm = () => {
    return (
      <View style={styles.capsuleFormContainer}>
        <View style={styles.formHeaderContainer}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => setCapsuleType(null)}
          >
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          
          <Text style={styles.formTitle}>
            {capsuleType === 'time' ? 'Zaman Kapsülü Oluştur' : 'Konum Kapsülü Oluştur'}
          </Text>
          
          <View style={styles.placeholderView} />
        </View>
        
        {/* İçerik başlık alanı */}
        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Kapsül Başlığı</Text>
          <View style={styles.inputContainer}>
            <Ionicons name="pencil-outline" size={20} color="#666" style={styles.inputIcon} />
            <TextInput
              style={styles.textInput}
              placeholder="Kapsüle bir isim ver"
              placeholderTextColor="#999"
            />
          </View>
        </View>
        
        {/* İçerik ekleme bölümü */}
        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>İçerik Ekle</Text>
          <Text style={styles.sectionSubtitle}>Kapsülüne eklemek istediğin içerik türünü seç</Text>
          
          {/* İçerik türü kartları - yatay scroll */}
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.contentTypeScroll}
          >
            {/* Metin Kartı */}
            <TouchableOpacity style={styles.contentTypeCard}>
              <View style={[styles.contentTypeIcon, { backgroundColor: 'rgba(52, 152, 219, 0.1)' }]}>
                <Ionicons name="chatbubble-outline" size={24} color="#3498db" />
              </View>
              <Text style={styles.contentTypeTitle}>Mesaj</Text>
              <Text style={styles.contentTypeSubtitle}>Metin mesajı ekle</Text>
              <View style={styles.addButtonContainer}>
                <Ionicons name="add-circle" size={26} color="#3498db" />
              </View>
            </TouchableOpacity>
            
            {/* Fotoğraf Kartı */}
            <TouchableOpacity style={styles.contentTypeCard}>
              <View style={[styles.contentTypeIcon, { backgroundColor: 'rgba(46, 204, 113, 0.1)' }]}>
                <Ionicons name="image-outline" size={24} color="#2ecc71" />
              </View>
              <Text style={styles.contentTypeTitle}>Fotoğraf</Text>
              <Text style={styles.contentTypeSubtitle}>Resim yükle</Text>
              <View style={styles.addButtonContainer}>
                <Ionicons name="add-circle" size={26} color="#2ecc71" />
              </View>
            </TouchableOpacity>
            
            {/* Video Kartı */}
            <TouchableOpacity style={styles.contentTypeCard}>
              <View style={[styles.contentTypeIcon, { backgroundColor: 'rgba(155, 89, 182, 0.1)' }]}>
                <Ionicons name="videocam-outline" size={24} color="#9b59b6" />
              </View>
              <Text style={styles.contentTypeTitle}>Video</Text>
              <Text style={styles.contentTypeSubtitle}>Video ekle</Text>
              <View style={styles.addButtonContainer}>
                <Ionicons name="add-circle" size={26} color="#9b59b6" />
              </View>
            </TouchableOpacity>
            
            {/* Ses Kartı */}
            <TouchableOpacity style={styles.contentTypeCard}>
              <View style={[styles.contentTypeIcon, { backgroundColor: 'rgba(231, 76, 60, 0.1)' }]}>
                <Ionicons name="mic-outline" size={24} color="#e74c3c" />
              </View>
              <Text style={styles.contentTypeTitle}>Ses</Text>
              <Text style={styles.contentTypeSubtitle}>Sesli mesaj kaydet</Text>
              <View style={styles.addButtonContainer}>
                <Ionicons name="add-circle" size={26} color="#e74c3c" />
              </View>
            </TouchableOpacity>
          </ScrollView>
        </View>
        
        {/* İçerik önizleme alanı - henüz boş */}
        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Eklenen İçerikler</Text>
          <View style={styles.emptyContentPreview}>
            <Ionicons name="albums-outline" size={40} color="#ccc" />
            <Text style={styles.emptyContentText}>Henüz içerik eklenmedi</Text>
          </View>
        </View>
        
        {/* Kapsül açılma ayarları */}
        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>
            {capsuleType === 'time' ? 'Ne Zaman Açılsın?' : 'Nerede Açılsın?'}
          </Text>
          
          {capsuleType === 'time' ? (
            <View style={styles.timeSelectionContainer}>
              {/* Hızlı seçenekler */}
              <Text style={styles.timeOptionsLabel}>Hızlı Seçim</Text>
              <View style={styles.quickTimeOptions}>
                <TouchableOpacity style={styles.quickTimeButton}>
                  <Text style={styles.quickTimeText}>1 Hafta</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.quickTimeButton}>
                  <Text style={styles.quickTimeText}>1 Ay</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.quickTimeButton, styles.quickTimeButtonActive]}>
                  <Text style={styles.quickTimeTextActive}>1 Yıl</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.quickTimeButton}>
                  <Text style={styles.quickTimeText}>5 Yıl</Text>
                </TouchableOpacity>
              </View>
              
              {/* Tarih göstergesi */}
              <View style={styles.dateDisplayContainer}>
                <View style={styles.dateIconWrapper}>
                  <Ionicons name="calendar-outline" size={22} color="#fff" />
                </View>
                <Text style={styles.dateDisplayText}>20 Haziran 2025</Text>
                <TouchableOpacity style={styles.datePickerButton}>
                  <Text style={styles.datePickerButtonText}>Değiştir</Text>
                  <Ionicons name="chevron-forward" size={16} color="#3498db" />
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.locationSelectionContainer}>
              <View style={styles.mapPreviewPlaceholder}>
                <View style={styles.mapIconWrapper}>
                  <Ionicons name="map-outline" size={32} color="#fff" />
                </View>
                <Text style={styles.mapPreviewText}>Konum seçmek için dokun</Text>
              </View>
              
              {/* Yarıçap seçimi */}
              <Text style={styles.radiusLabel}>Yarıçap Seçimi</Text>
              <View style={styles.radiusOptions}>
                <TouchableOpacity style={styles.radiusOption}>
                  <Text style={styles.radiusText}>50m</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.radiusOption, styles.radiusOptionActive]}>
                  <Text style={styles.radiusTextActive}>100m</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.radiusOption}>
                  <Text style={styles.radiusText}>250m</Text>
                </TouchableOpacity>
              </View>
              
              {/* Konum + Zaman seçeneği */}
              <TouchableOpacity style={styles.addTimeToLocationButton}>
                <View style={styles.addTimeIconWrapper}>
                  <Ionicons name="time-outline" size={18} color="#fff" />
                </View>
                <Text style={styles.addTimeToLocationText}>Zaman koşulu ekle</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
        
        {/* Alıcı seçimi */}
        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Kim Açabilsin?</Text>
          <View style={styles.recipientOptionsContainer}>
            <TouchableOpacity style={[styles.recipientOption, styles.recipientOptionActive]}>
              <View style={[styles.recipientIconWrapper, styles.recipientIconWrapperActive]}>
                <Ionicons name="person-outline" size={22} color="#fff" />
              </View>
              <Text style={[styles.recipientText, styles.recipientTextActive]}>Sadece Ben</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.recipientOption}>
              <View style={styles.recipientIconWrapper}>
                <Ionicons name="people-outline" size={22} color="#3498db" />
              </View>
              <Text style={styles.recipientText}>Belirli Kişiler</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.recipientOption}>
              <View style={styles.recipientIconWrapper}>
                <Ionicons name="earth-outline" size={22} color="#3498db" />
              </View>
              <Text style={styles.recipientText}>Herkes</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        {/* İşlem butonları */}
        <View style={styles.formActions}>
          <TouchableOpacity style={styles.cancelButton} onPress={() => setCapsuleType(null)}>
            <Text style={styles.cancelButtonText}>Vazgeç</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.createButton}>
            <Text style={styles.createButtonText}>Kapsülü Oluştur</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };
  
  // Kapsüllerim Tab İçeriği
  const renderMyCapsules = () => {
    return (
      <View style={styles.myCapsuleContainer}>
        <Text style={styles.myCapsuleTitle}>Kapsüllerim</Text>
        
        {/* Filtreleme alanı */}
        <View style={styles.filterContainer}>
          <TouchableOpacity style={[styles.filterButton, styles.activeFilterButton]}>
            <Text style={styles.activeFilterText}>Tümü</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.filterButton}>
            <Text style={styles.filterText}>Bekleyenler</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.filterButton}>
            <Text style={styles.filterText}>Açılmış</Text>
          </TouchableOpacity>
        </View>
        
        {/* Boş durum mesajı */}
        <View style={styles.emptyCapsuleContainer}>
          <LottieView
            source={require('../../assets/animations/bottle.json')}
            autoPlay
            loop
            style={styles.emptyAnimation}
          />
          <Text style={styles.emptyTitle}>Henüz Kapsülün Yok</Text>
          <Text style={styles.emptySubtitle}>İlk kapsülünü oluşturmak için "Yeni Kapsül" sekmesine geç</Text>
        </View>
      </View>
    );
  };

  return (
    <Modal
      transparent={true}
      visible={modalVisible}
      onRequestClose={closeModal}
      animationType="none"
    >
      <Animated.View 
        style={[
          styles.modalOverlay,
          {
            opacity: backdropOpacity
          }
        ]}
      >
        <TouchableOpacity 
          style={styles.modalOverlayTouch}
          activeOpacity={1}
          onPress={closeModal}
        />
        
        <Animated.View 
          style={[
            styles.modalContainer,
            {
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          {/* Modal Handle */}
          <View style={styles.modalHandleContainer}>
            <TouchableOpacity onPress={closeModal}>
              <View style={styles.modalHandle} />
            </TouchableOpacity>
          </View>
          
          {/* Tab Bar */}
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[styles.tabButton, activeTab === TABS.CREATE && styles.activeTabButton]}
              onPress={() => setActiveTab(TABS.CREATE)}
            >
              <Text style={[styles.tabText, activeTab === TABS.CREATE && styles.activeTabText]}>
                Yeni Kapsül
              </Text>
              {activeTab === TABS.CREATE && <View style={styles.activeTabIndicator} />}
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.tabButton, activeTab === TABS.MY_CAPSULES && styles.activeTabButton]}
              onPress={() => setActiveTab(TABS.MY_CAPSULES)}
            >
              <Text style={[styles.tabText, activeTab === TABS.MY_CAPSULES && styles.activeTabText]}>
                Kapsüllerim
              </Text>
              {activeTab === TABS.MY_CAPSULES && <View style={styles.activeTabIndicator} />}
            </TouchableOpacity>
          </View>
          
          {/* Tab İçerikleri */}
          <ScrollView 
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContentContainer}
          >
            {renderTabContent()}
          </ScrollView>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalOverlayTouch: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modalContainer: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: '80%',
    width: '100%',
  },
  modalHandleContainer: {
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 8,
  },
  modalHandle: {
    width: 36,
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    marginBottom: 16,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    position: 'relative',
  },
  activeTabButton: {
    borderBottomWidth: 0,
  },
  tabText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#888',
  },
  activeTabText: {
    color: '#3498db',
    fontWeight: '600',
  },
  activeTabIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 30,
    right: 30,
    height: 3,
    backgroundColor: '#3498db',
    borderRadius: 1.5,
  },
  scrollContentContainer: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  
  // Type Selection Styles
  typeSelectionContainer: {
    paddingBottom: 40,
  },
  welcomeContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  bottleAnimationContainer: {
    width: 120,
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  bottleAnimation: {
    width: 120,
    height: 120,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 8,
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    paddingHorizontal: 20,
    lineHeight: 22,
  },
  securityContainer: {
    flexDirection: 'row',
    backgroundColor: '#f0fff4',
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 10,
    marginVertical: 20,
    borderWidth: 1,
    borderColor: '#d4f5e2',
    alignItems: 'center',
  },
  securityIcon: {
    marginRight: 10,
  },
  securityText: {
    flex: 1,
    fontSize: 14,
    color: '#2f4f4f',
    lineHeight: 20,
  },
  examplesTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
    marginHorizontal: 15,
  },
  examplesContainer: {
    backgroundColor: '#f8f9fa',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    marginHorizontal: 10,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  exampleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  exampleIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  exampleTextContainer: {
    flex: 1,
  },
  exampleTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#444',
    marginBottom: 2,
  },
  exampleText: {
    fontSize: 12,
    color: '#666',
  },
  capsuleTypeTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
    marginHorizontal: 15,
  },
  capsuleTypeCards: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
  },
  capsuleTypeCard: {
    width: (width - 80) / 2,
    backgroundColor: '#f9f9f9',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  capsuleTypeIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  capsuleTypeDescription: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  capsuleTypeCardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  // Form Styles
  capsuleFormContainer: {
    position: 'relative',
    paddingTop: 10,
    paddingBottom: 40,
  },
  formHeaderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
    paddingHorizontal: 4,
  },
  backButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  formTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    flex: 1,
  },
  placeholderView: {
    width: 32,
    height: 32,
  },
  formSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  inputIcon: {
    marginRight: 10,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  contentTypeScroll: {
    marginBottom: 5,
  },
  contentTypeCard: {
    width: 150,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  contentTypeIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  contentTypeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  contentTypeSubtitle: {
    fontSize: 12,
    color: '#888',
    marginBottom: 10,
  },
  addButtonContainer: {
    alignItems: 'flex-end',
  },
  emptyContentPreview: {
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#ddd',
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContentText: {
    fontSize: 14,
    color: '#999',
    marginTop: 10,
  },
  timeSelectionContainer: {
    marginTop: 10,
    marginBottom: 20,
  },
  timeOptionsLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  quickTimeOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  quickTimeButton: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  quickTimeButtonActive: {
    backgroundColor: '#3498db',
    borderColor: '#2980b9',
  },
  quickTimeText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  quickTimeTextActive: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '600',
  },
  dateDisplayContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e8e8e8',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  dateIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#3498db',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  dateDisplayText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  datePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f7fd',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  datePickerButtonText: {
    fontSize: 14,
    color: '#3498db',
    fontWeight: '500',
    marginRight: 4,
  },
  locationSelectionContainer: {
    marginTop: 10,
    marginBottom: 20,
  },
  mapPreviewPlaceholder: {
    backgroundColor: '#eef2f5',
    borderRadius: 16,
    height: 160,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e0e7ee',
    overflow: 'hidden',
  },
  mapIconWrapper: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#3498db',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  mapPreviewText: {
    fontSize: 15,
    color: '#666',
    marginTop: 8,
  },
  radiusLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  radiusOptions: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  radiusOption: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginHorizontal: 3,
    borderRadius: 8,
  },
  radiusOptionActive: {
    backgroundColor: '#3498db',
    borderColor: '#2980b9',
  },
  radiusText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  radiusTextActive: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  addTimeToLocationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f7fd',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#d5e8f9',
  },
  addTimeIconWrapper: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#3498db',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  addTimeToLocationText: {
    fontSize: 14,
    color: '#3498db',
    fontWeight: '500',
  },
  recipientOptionsContainer: {
    flexDirection: 'row',
    marginTop: 16,
  },
  recipientOption: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
    marginHorizontal: 5,
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#eee',
  },
  recipientOptionActive: {
    backgroundColor: '#f0f7fd',
    borderColor: '#3498db',
  },
  recipientIconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f0f7fd',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#d5e8f9',
  },
  recipientIconWrapperActive: {
    backgroundColor: '#3498db',
    borderColor: '#2980b9',
  },
  recipientText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  recipientTextActive: {
    color: '#3498db',
    fontWeight: '600',
  },
  formActions: {
    flexDirection: 'row',
    marginTop: 30,
    marginBottom: 10,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    paddingVertical: 14,
    borderRadius: 12,
    marginRight: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  createButton: {
    flex: 2,
    backgroundColor: '#3498db',
    paddingVertical: 14,
    borderRadius: 12,
    marginLeft: 8,
    alignItems: 'center',
  },
  createButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
  // My Capsules Styles
  myCapsuleContainer: {
    paddingBottom: 40,
  },
  myCapsuleTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  filterContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 10,
    marginHorizontal: 4,
    borderRadius: 20,
    alignItems: 'center',
  },
  activeFilterButton: {
    backgroundColor: '#3498db',
  },
  filterText: {
    fontSize: 14,
    color: '#666',
  },
  activeFilterText: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '500',
  },
  emptyCapsuleContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 30,
    paddingBottom: 30,
  },
  emptyAnimation: {
    width: 120,
    height: 120,
    opacity: 0.7,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    paddingHorizontal: 30,
  },
});

export default CapsuleModal; 