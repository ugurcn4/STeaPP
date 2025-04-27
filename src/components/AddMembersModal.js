import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  Modal, 
  TouchableOpacity, 
  TextInput, 
  FlatList, 
  StyleSheet, 
  ActivityIndicator, 
  Image,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getCurrentUserUid } from '../services/friendFunctions';
import { getDoc, doc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebaseConfig';

const AddMembersModal = ({ 
  visible, 
  onClose, 
  onAddMember, 
  currentGroupMembers = [] 
}) => {
  const [userFriends, setUserFriends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredFriends, setFilteredFriends] = useState([]);

  useEffect(() => {
    if (visible) {
      loadFriends();
    }
  }, [visible]);

  useEffect(() => {
    // Arama sorgusuna göre arkadaş listesini filtrele
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const filtered = userFriends.filter(friend => 
        friend.name.toLowerCase().includes(query)
      );
      setFilteredFriends(filtered);
    } else {
      setFilteredFriends(userFriends);
    }
  }, [searchQuery, userFriends]);

  const loadFriends = async () => {
    try {
      setLoading(true);
      const uid = await getCurrentUserUid();
      if (!uid) return;

      // Kullanıcının arkadaş listesini al
      const userDoc = await getDoc(doc(db, 'users', uid));
      if (!userDoc.exists()) return;
      
      const userData = userDoc.data();
      const friends = userData.friends || [];
      
      // Detaylı arkadaş bilgilerini al
      if (friends.length > 0) {
        const friendsData = await Promise.all(
          friends.map(async (friendId) => {
            const friendDoc = await getDoc(doc(db, 'users', friendId));
            if (friendDoc.exists()) {
              return {
                id: friendId,
                name: friendDoc.data().informations?.name || 'İsimsiz Kullanıcı',
                profilePicture: friendDoc.data().profilePicture || null,
                // Arkadaş zaten gruptaysa (yani currentGroupMembers içindeyse) işaretlenir
                inGroup: currentGroupMembers.includes(friendId)
              };
            }
            return null;
          })
        );
        
        // Filtreleme: null değerleri kaldır ve grupta olmayanları göster
        const validFriends = friendsData
          .filter(friend => friend !== null)
          .filter(friend => !friend.inGroup);
        
        setUserFriends(validFriends);
        setFilteredFriends(validFriends);
      }
    } catch (error) {
      console.error('Arkadaşlar yüklenirken hata:', error);
      Alert.alert('Hata', 'Arkadaş listesi yüklenirken bir sorun oluştu.');
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = (userId) => {
    if (onAddMember) {
      onAddMember(userId);
    }
  };

  const renderFriendItem = ({ item }) => {
    // Profil fotoğrafı yoksa avatar oluştur
    const getInitials = (name) => {
      if (!name) return '?';
      return name.charAt(0).toUpperCase();
    };

    return (
      <View style={styles.friendItem}>
        <View style={styles.friendInfo}>
          {item.profilePicture ? (
            <Image 
              source={{ uri: item.profilePicture }} 
              style={styles.avatar} 
            />
          ) : (
            <View style={[styles.avatarPlaceholder, { backgroundColor: '#53B4DF' }]}>
              <Text style={styles.avatarText}>{getInitials(item.name)}</Text>
            </View>
          )}
          <Text style={styles.friendName}>{item.name}</Text>
        </View>
        
        <TouchableOpacity 
          style={styles.inviteButton}
          onPress={() => handleInvite(item.id)}
        >
          <Text style={styles.inviteButtonText}>Davet Et</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.centeredView}>
        <View style={styles.modalView}>
          {/* Modal Header */}
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Arkadaşını Gruba Davet Et</Text>
          </View>
          
          {/* Arama */}
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color="#9797A9" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Arkadaş ara..."
              placeholderTextColor="#9797A9"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
          
          {/* Arkadaş Listesi */}
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#53B4DF" />
              <Text style={styles.loadingText}>Arkadaşlar yükleniyor...</Text>
            </View>
          ) : filteredFriends.length > 0 ? (
            <FlatList
              data={filteredFriends}
              renderItem={renderFriendItem}
              keyExtractor={item => item.id}
              contentContainerStyle={styles.friendsList}
            />
          ) : (
            <View style={styles.emptyContainer}>
              {searchQuery ? (
                <>
                  <Ionicons name="search" size={48} color="#9797A9" />
                  <Text style={styles.emptyText}>
                    "{searchQuery}" için sonuç bulunamadı
                  </Text>
                </>
              ) : (
                <>
                  <Ionicons name="people" size={48} color="#9797A9" />
                  <Text style={styles.emptyText}>
                    Davet edilebilecek arkadaşınız bulunmuyor
                  </Text>
                  <Text style={styles.emptySubText}>
                    Tüm arkadaşlarınız zaten bu gruba dahil edilmiş veya henüz arkadaşınız yok.
                  </Text>
                </>
              )}
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalView: {
    backgroundColor: '#252636',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: '80%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -3,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  closeButton: {
    padding: 8,
  },
  modalTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
    marginLeft: 12,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#32323E',
    margin: 16,
    borderRadius: 12,
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: '#FFFFFF',
    padding: 10,
    fontSize: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#FFFFFF',
    marginTop: 12,
    fontSize: 16,
  },
  friendsList: {
    paddingHorizontal: 16,
  },
  friendItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  friendInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  friendName: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  inviteButton: {
    backgroundColor: '#53B4DF',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  inviteButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 12,
    textAlign: 'center',
  },
  emptySubText: {
    color: '#9797A9',
    fontSize: 14,
    marginTop: 4,
    textAlign: 'center',
  },
});

export default AddMembersModal; 