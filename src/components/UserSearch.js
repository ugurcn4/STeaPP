import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  Image, 
  TextInput, 
  FlatList, 
  Modal, 
  ActivityIndicator,
  Keyboard,
  TouchableWithoutFeedback,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebaseConfig';

import { 
  searchUsers, 
  sendFriendRequest, 
  getCurrentUserUid,
  cancelFriendRequest,
  removeFriend
} from '../services/friendFunctions';

import styles from '../styles/FriendsPageStyles';

const UserSearch = ({ visible, onClose, refreshData }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [loading, setLoading] = useState(false);
  const [allUsers, setAllUsers] = useState([]);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [userFriends, setUserFriends] = useState([]);
  const [userSentRequests, setUserSentRequests] = useState([]);
  const [userReceivedRequests, setUserReceivedRequests] = useState([]);
  const searchTimeoutRef = useRef(null);

  // Modal açıldığında kullanıcı listesini ve mevcut kullanıcı ID'sini çek
  useEffect(() => {
    if (visible) {
      fetchAllUsers();
      fetchCurrentUserId();
      fetchUserRelationships();
    }
  }, [visible]);

  // Mevcut kullanıcı ID'sini çek
  const fetchCurrentUserId = async () => {
    try {
      const userId = await getCurrentUserUid();
      setCurrentUserId(userId);
    } catch (error) {
      console.error('Kullanıcı ID\'si alınırken hata:', error);
    }
  };

  // Tüm kullanıcıları çek
  const fetchAllUsers = async () => {
    try {
      setLoading(true);
      // Boş sorgu ile tüm kullanıcıları getir
      const users = await searchUsers('');
      setAllUsers(users);
      setLoading(false);
    } catch (error) {
      console.error('Kullanıcılar alınırken hata:', error);
      setLoading(false);
    }
  };

  // Kullanıcı ilişkilerini getir (arkadaşlar, gönderilen ve alınan istekler)
  const fetchUserRelationships = async () => {
    try {
      const userId = await getCurrentUserUid();
      if (!userId) return;

      // Kullanıcının verilerini getir
      const userRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        // Arkadaşlar listesi
        setUserFriends(userData.friends || []);
        
        // Gönderilen istekler
        setUserSentRequests(userData.friendRequests?.sent || []);
        
        // Alınan istekler
        setUserReceivedRequests(userData.friendRequests?.received || []);
      }
    } catch (error) {
      console.error('Kullanıcı ilişkileri alınırken hata:', error);
    }
  };

  // Kullanıcının arkadaşlık durumunu kontrol et
  const checkFriendshipStatus = (userId) => {
    // Zaten arkadaş mı?
    if (userFriends.includes(userId)) {
      return 'friend';
    }
    
    // Gönderilmiş istek var mı?
    if (userSentRequests.includes(userId)) {
      return 'sent';
    }
    
    // Alınmış istek var mı?
    if (userReceivedRequests.includes(userId)) {
      return 'received';
    }
    
    // Hiçbir ilişki yok
    return 'none';
  };

  // Debounce ile arama fonksiyonu
  const debouncedSearch = useCallback((searchText) => {
    // Önceki zamanlayıcıyı temizle
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Boş arama sorgusu kontrolü
    if (!searchText.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    
    // 300ms gecikme ile arama fonksiyonunu çağır
    searchTimeoutRef.current = setTimeout(() => {
      // Yerel arama - daha hızlı sonuç için
      const filteredResults = allUsers.filter(user => {
        // Kendini aramada gösterme
        if (user.id === currentUserId) return false;
        
        // İsimde arama
        const nameMatch = user.informations?.name?.toLowerCase().includes(searchText.toLowerCase());
        
        // Kullanıcı adında arama (varsa)
        const usernameMatch = user.informations?.username?.toLowerCase().includes(searchText.toLowerCase());
        
        // E-posta adresinde arama (varsa)
        const emailMatch = user.informations?.email?.toLowerCase().includes(searchText.toLowerCase());
        
        return nameMatch || usernameMatch || emailMatch;
      });

      // Sonuçları sırala ve arkadaşlık durumunu ekle
      const resultsWithStatus = filteredResults.map(user => ({
        ...user,
        friendshipStatus: checkFriendshipStatus(user.id)
      }));

      // Sonuçları sırala: İsimle tam eşleşenler önce gelsin
      resultsWithStatus.sort((a, b) => {
        const nameA = a.informations?.name?.toLowerCase() || '';
        const nameB = b.informations?.name?.toLowerCase() || '';
        const queryLower = searchText.toLowerCase();
        
        // İsmi tam eşleşenler öncelikli olsun
        if (nameA === queryLower && nameB !== queryLower) return -1;
        if (nameB === queryLower && nameA !== queryLower) return 1;
        
        // Sonra ismi ile başlayanlar
        if (nameA.startsWith(queryLower) && !nameB.startsWith(queryLower)) return -1;
        if (nameB.startsWith(queryLower) && !nameB.startsWith(queryLower)) return 1;
        
        // Sonra alfabetik sıralama
        return nameA.localeCompare(nameB);
      });

      setSearchResults(resultsWithStatus);
      setIsSearching(false);
    }, 300);
  }, [allUsers, currentUserId, userFriends, userSentRequests, userReceivedRequests]);

  // Arama sorgusu değiştiğinde
  useEffect(() => {
    debouncedSearch(searchQuery);
  }, [searchQuery, debouncedSearch]);

  // Kullanıcı arama fonksiyonu (manuel arama için)
  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    
    try {
      setLoading(true);
      
      // Gelişmiş sunucu taraflı arama için
      const results = await searchUsers(searchQuery);
      
      // Kendini aramada gösterme
      const filteredResults = results.filter(user => user.id !== currentUserId);
      
      // Arkadaşlık durumunu ekle
      const resultsWithStatus = filteredResults.map(user => ({
        ...user,
        friendshipStatus: checkFriendshipStatus(user.id)
      }));
      
      // Sonuçları isme göre sırala
      resultsWithStatus.sort((a, b) => {
        const nameA = a.informations?.name?.toLowerCase() || '';
        const nameB = b.informations?.name?.toLowerCase() || '';
        const queryLower = searchQuery.toLowerCase();
        
        // İsmi tam eşleşenler öncelikli olsun
        if (nameA === queryLower && nameB !== queryLower) return -1;
        if (nameB === queryLower && nameA !== queryLower) return 1;
        
        // Sonra ismi ile başlayanlar
        if (nameA.startsWith(queryLower) && !nameB.startsWith(queryLower)) return -1;
        if (nameB.startsWith(queryLower) && !nameB.startsWith(queryLower)) return 1;
        
        // Sonra alfabetik sıralama
        return nameA.localeCompare(nameB);
      });
      
      setSearchResults(resultsWithStatus);
    } catch (error) {
      console.error('Arama hatası:', error);
      Alert.alert('Hata', 'Kullanıcı araması sırasında bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  // Arama alanını temizle
  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    
    // Zamanlayıcıyı da temizle
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
  };

  // Arkadaşlık isteği gönderme
  const handleSendRequest = async (userId) => {
    try {
      const response = await sendFriendRequest(userId);
      
      if (response.success) {
        // Başarılı olursa gönderilen istekler listesini güncelle
        setUserSentRequests(prev => [...prev, userId]);
        
        // Sonuçları güncelle
        updateUserRelationshipInResults(userId, 'sent');
        
        if (refreshData) refreshData();
        
        Alert.alert('Başarılı', response.message);
      } else {
        Alert.alert('Hata', response.message || 'İstek gönderilemedi.');
      }
    } catch (error) {
      console.error('İstek gönderme hatası:', error);
      Alert.alert('Hata', 'Arkadaşlık isteği gönderilirken bir hata oluştu.');
    }
  };

  // Arkadaşlık isteğini iptal et
  const handleCancelRequest = async (userId) => {
    try {
      const response = await cancelFriendRequest(userId);
      
      if (response.success) {
        // Başarılı olursa gönderilen istekler listesini güncelle
        setUserSentRequests(prev => prev.filter(id => id !== userId));
        
        // Sonuçları güncelle
        updateUserRelationshipInResults(userId, 'none');
        
        if (refreshData) refreshData();
        
        Alert.alert('Başarılı', response.message);
      } else {
        Alert.alert('Hata', response.message || 'İstek iptal edilemedi.');
      }
    } catch (error) {
      console.error('İstek iptal hatası:', error);
      Alert.alert('Hata', 'Arkadaşlık isteği iptal edilirken bir hata oluştu.');
    }
  };

  // Arkadaşı kaldır
  const handleRemoveFriend = async (userId) => {
    // Onay al
    Alert.alert(
      'Arkadaşı Kaldır',
      'Bu kişiyi arkadaş listenizden kaldırmak istediğinize emin misiniz?',
      [
        {
          text: 'İptal',
          style: 'cancel'
        },
        {
          text: 'Kaldır',
          style: 'destructive',
          onPress: async () => {
            try {
              const result = await removeFriend(currentUserId, userId);
              
              if (result.success) {
                // Başarılı olursa arkadaşlar listesini güncelle
                setUserFriends(prev => prev.filter(id => id !== userId));
                
                // Sonuçları güncelle
                updateUserRelationshipInResults(userId, 'none');
                
                if (refreshData) refreshData();
                
                Alert.alert('Başarılı', 'Arkadaşlık başarıyla kaldırıldı.');
              }
            } catch (error) {
              console.error('Arkadaş kaldırma hatası:', error);
              Alert.alert('Hata', 'Arkadaş kaldırılırken bir hata oluştu.');
            }
          }
        }
      ]
    );
  };

  // Arama sonuçlarında bir kullanıcının ilişki durumunu güncelle
  const updateUserRelationshipInResults = (userId, newStatus) => {
    setSearchResults(prev => 
      prev.map(user => {
        if (user.id === userId) {
          return { ...user, friendshipStatus: newStatus };
        }
        return user;
      })
    );
  };

  // Arkadaşlık durumunu gösteren etiket
  const renderFriendshipStatusLabel = (status) => {
    let label = '';
    let color = '';
    let icon = null;
    
    switch(status) {
      case 'friend':
        label = 'Arkadaşınız';
        color = '#44D7B6';
        icon = 'people';
        break;
      
      case 'sent':
        label = 'İstek Gönderildi';
        color = '#FF9500';
        icon = 'paper-plane';
        break;
      
      case 'received':
        label = 'İstek Aldınız';
        color = '#007AFF';
        icon = 'mail';
        break;
      
      default:
        return null;
    }
    
    return (
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 3,
        backgroundColor: `${color}20`,
        borderRadius: 4,
        marginTop: 4
      }}>
        <Ionicons name={icon} size={12} color={color} style={{ marginRight: 4 }} />
        <Text style={{ color: color, fontSize: 12, fontWeight: '500' }}>{label}</Text>
      </View>
    );
  };

  const closeModal = () => {
    clearSearch();
    onClose();
  };

  return (
    <Modal
      animationType="slide"
      transparent={false}
      visible={visible}
      onRequestClose={closeModal}
      statusBarTranslucent={true}
    >
      <LinearGradient 
        colors={['#252636', '#1E1E2C']} 
        start={{x: 0, y: 0}} 
        end={{x: 0, y: 0.3}}
        style={styles.modalContainer}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.modalContent}>
            <View style={styles.searchHeader}>
              <Text style={styles.searchTitle}>Arkadaş Ara</Text>
              <TouchableOpacity 
                style={styles.headerButton} 
                onPress={closeModal}
              >
                <Ionicons name="close" size={24} color="#AE63E4" />
              </TouchableOpacity>
            </View>

            <View style={styles.searchInputContainer}>
              <Ionicons name="search-outline" size={20} color="#9797A9" style={{marginLeft: 15}} />
              <TextInput
                style={styles.searchInput}
                placeholder="İsim, kullanıcı adı veya e-posta ile ara..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholderTextColor="#9797A9"
                returnKeyType="search"
                onSubmitEditing={() => {
                  handleSearch();
                  Keyboard.dismiss();
                }}
                autoFocus={true}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity 
                  style={{padding: 10}}
                  onPress={clearSearch}
                >
                  <Ionicons name="close-circle" size={22} color="#9797A9" />
                </TouchableOpacity>
              )}
            </View>

            {/* Arama ipuçları */}
            {!searchQuery.trim() && !loading && !isSearching && (
              <View style={{marginBottom: 20}}>
                <Text style={{color: '#AE63E4', fontSize: 16, fontWeight: '600', marginBottom: 10}}>Arama İpuçları</Text>
                <View style={{backgroundColor: '#32323E', borderRadius: 10, padding: 15}}>
                  <Text style={{color: '#E5E5E9', fontSize: 14, marginBottom: 8}}>• İsim, kullanıcı adı veya e-posta ile arama yapabilirsiniz</Text>
                  <Text style={{color: '#E5E5E9', fontSize: 14, marginBottom: 8}}>• Yazarken sonuçlar otomatik olarak güncellenir</Text>
                  <Text style={{color: '#E5E5E9', fontSize: 14}}>• En alakalı sonuçlar üstte gösterilir</Text>
                </View>
              </View>
            )}

            {isSearching ? (
              <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
                <ActivityIndicator size="large" color="#AE63E4" />
                <Text style={[styles.statusText, {marginTop: 20}]}>Kullanıcılar aranıyor...</Text>
              </View>
            ) : loading ? (
              <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
                <ActivityIndicator size="large" color="#AE63E4" />
                <Text style={[styles.statusText, {marginTop: 20}]}>Kullanıcılar yükleniyor...</Text>
              </View>
            ) : searchResults.length > 0 ? (
              <>
                <View style={{flexDirection: 'row', marginBottom: 15, justifyContent: 'space-between', alignItems: 'center'}}>
                  <Text style={{color: '#9797A9', fontSize: 14}}>
                    {searchResults.length} kullanıcı bulundu
                  </Text>
                  {searchResults.length > 10 && (
                    <Text style={{color: '#AE63E4', fontSize: 14}}>
                      İlk 10 sonuç gösteriliyor
                    </Text>
                  )}
                </View>
                <FlatList
                  data={searchResults.slice(0, 10)} // Performans için maksimum 10 sonuç göster
                  keyExtractor={(item) => item.id}
                  renderItem={({ item }) => {
                    const friendshipStatus = item.friendshipStatus;
                    
                    // Buton metni ve rengi
                    let buttonText = '';
                    let buttonColor = '#AE63E4';
                    let buttonIcon = 'person-add';
                    
                    switch(friendshipStatus) {
                      case 'friend':
                        buttonText = 'Arkadaşlıktan Çıkar';
                        buttonColor = '#32323E';
                        buttonIcon = 'person-remove';
                        break;
                      case 'sent':
                        buttonText = 'İsteği İptal Et';
                        buttonColor = '#FF6B78';
                        buttonIcon = 'close';
                        break;
                      case 'received':
                        buttonText = 'İsteği Kabul Et';
                        buttonColor = '#44D7B6';
                        buttonIcon = 'checkmark';
                        break;
                      default:
                        buttonText = 'Arkadaş Ekle';
                        break;
                    }
                    
                    return (
                      <View style={styles.userCard}>
                        <View style={styles.userInfo}>
                          {item.profilePicture ? (
                            <Image source={{ uri: item.profilePicture }} style={styles.userAvatar} />
                          ) : (
                            <LinearGradient
                              colors={['#8E2DE2', '#4A00E0']}
                              style={styles.userAvatar}
                            >
                              <Text style={styles.avatarText}>{item.informations?.name?.charAt(0) || "?"}</Text>
                            </LinearGradient>
                          )}
                          <View>
                            <Text style={styles.userName}>{item.informations?.name || 'İsimsiz Kullanıcı'}</Text>
                            {renderFriendshipStatusLabel(friendshipStatus)}
                          </View>
                        </View>
                        
                        <TouchableOpacity 
                          style={[
                            styles.friendActionButton,
                            { backgroundColor: buttonColor }
                          ]}
                          onPress={() => {
                            switch(friendshipStatus) {
                              case 'friend':
                                handleRemoveFriend(item.id);
                                break;
                              case 'sent':
                                handleCancelRequest(item.id);
                                break;
                              case 'received':
                                Alert.alert('Bilgi', 'İsteği kabul etmek için arkadaşlık istekleri sayfasını ziyaret edin');
                                break;
                              default:
                                handleSendRequest(item.id);
                                break;
                            }
                          }}
                        >
                          <Ionicons name={buttonIcon} size={16} color="#FFF" style={{marginRight: 5}} />
                          <Text style={styles.friendActionButtonText}>{buttonText}</Text>
                        </TouchableOpacity>
                      </View>
                    );
                  }}
                  style={styles.resultsList}
                  showsVerticalScrollIndicator={false}
                />
                {searchResults.length > 10 && (
                  <TouchableOpacity 
                    style={{
                      alignSelf: 'center', 
                      paddingVertical: 10, 
                      paddingHorizontal: 15, 
                      backgroundColor: '#32323E',
                      borderRadius: 10,
                      marginTop: 10,
                      marginBottom: 20,
                      flexDirection: 'row',
                      alignItems: 'center'
                    }}
                    onPress={handleSearch}
                  >
                    <Text style={{color: '#AE63E4', fontSize: 14, marginRight: 5}}>Daha fazla sonuç göster</Text>
                    <Ionicons name="chevron-down" size={16} color="#AE63E4" />
                  </TouchableOpacity>
                )}
              </>
            ) : searchQuery.trim() !== '' && !loading ? (
              <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
                <Ionicons name="search-outline" size={60} color="#9797A9" />
                <Text style={styles.statusText}>Kullanıcı bulunamadı</Text>
                <Text style={{color: '#9797A9', fontSize: 14, textAlign: 'center', marginTop: 10}}>
                  Farklı bir arama terimi deneyin
                </Text>
              </View>
            ) : (
              <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
                <Ionicons name="people-outline" size={60} color="#9797A9" />
                <Text style={styles.statusText}>Arkadaş aramak için</Text>
                <Text style={{color: '#9797A9', fontSize: 14, textAlign: 'center', marginTop: 10}}>
                  yukarıdaki arama çubuğunu kullanabilirsiniz
                </Text>
              </View>
            )}
          </View>
        </TouchableWithoutFeedback>
      </LinearGradient>
    </Modal>
  );
};

export default UserSearch; 