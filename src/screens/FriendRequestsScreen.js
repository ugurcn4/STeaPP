import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  ActivityIndicator, 
  Image,
  StatusBar,
  Platform,
  SafeAreaView,
  Alert,
  RefreshControl
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { getFriendRequests, acceptFriendRequest, rejectFriendRequest } from '../services/friendFunctions';

const STATUSBAR_HEIGHT = Platform.OS === 'ios' ? 44 : StatusBar.currentHeight;

const FriendRequestsScreen = () => {
  const navigation = useNavigation();
  const [friendRequests, setFriendRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadFriendRequests();
  }, []);

  const loadFriendRequests = async () => {
    try {
      setLoading(true);
      const requests = await getFriendRequests();
      setFriendRequests(requests);
    } catch (error) {
      console.error('İstekler yüklenirken hata:', error);
      Alert.alert('Hata', 'Arkadaşlık istekleri yüklenirken bir sorun oluştu');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadFriendRequests();
  };

  const handleAcceptRequest = async (friendId) => {
    try {
      await acceptFriendRequest(friendId);
      setFriendRequests(prev => prev.filter(request => request.id !== friendId));
      Alert.alert('Başarılı', 'Arkadaşlık isteği kabul edildi');
    } catch (error) {
      console.error('İstek kabul edilirken hata:', error);
      Alert.alert('Hata', 'Arkadaşlık isteği kabul edilirken bir sorun oluştu');
    }
  };

  const handleRejectRequest = async (friendId) => {
    try {
      await rejectFriendRequest(friendId);
      setFriendRequests(prev => prev.filter(request => request.id !== friendId));
      Alert.alert('Bilgi', 'Arkadaşlık isteği reddedildi');
    } catch (error) {
      console.error('İstek reddedilirken hata:', error);
      Alert.alert('Hata', 'Arkadaşlık isteği reddedilirken bir sorun oluştu');
    }
  };

  const renderRequestItem = (request) => {
    return (
      <View key={request.id} style={styles.requestCard}>
        <View style={styles.userInfo}>
          {request.profilePicture ? (
            <Image 
              source={{ uri: request.profilePicture }} 
              style={styles.profilePicture} 
            />
          ) : (
            <View style={styles.defaultProfilePicture}>
              <Text style={styles.profileInitial}>{request.name.charAt(0)}</Text>
            </View>
          )}
          <View style={styles.userDetails}>
            <Text style={styles.userName}>{request.name}</Text>
            <Text style={styles.userSubText}>Arkadaşlık isteği gönderdi</Text>
          </View>
        </View>
        
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={styles.rejectButton}
            onPress={() => handleRejectRequest(request.id)}
          >
            <Ionicons name="close" size={20} color="#FFFFFF" />
            <Text style={styles.buttonText}>Reddet</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.acceptButton}
            onPress={() => handleAcceptRequest(request.id)}
          >
            <Ionicons name="checkmark" size={20} color="#FFFFFF" />
            <Text style={styles.buttonText}>Kabul Et</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar
        translucent={Platform.OS === 'android'}
        backgroundColor="transparent"
        barStyle={Platform.OS === 'ios' ? 'dark-content' : 'light-content'}
      />
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.headerText}>Arkadaşlık İstekleri</Text>
          </View>
        </View>
        
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#AE63E4" />
            <Text style={styles.loadingText}>İstekler yükleniyor...</Text>
          </View>
        ) : (
          <ScrollView 
            style={styles.scrollContent}
            contentContainerStyle={styles.scrollContentContainer}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                colors={['#AE63E4']}
                tintColor="#AE63E4"
              />
            }
          >
            {friendRequests.length > 0 ? (
              friendRequests.map(request => renderRequestItem(request))
            ) : (
              <View style={styles.emptyContainer}>
                <Ionicons name="mail" size={48} color="#9797A9" />
                <Text style={styles.emptyText}>Bekleyen arkadaşlık isteği yok</Text>
                <Text style={styles.emptySubText}>
                  Yeni arkadaşlarınızdan gelen istekler burada görünecek
                </Text>
              </View>
            )}
          </ScrollView>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#252636',
    paddingTop: Platform.OS === 'android' ? STATUSBAR_HEIGHT : 0,
  },
  container: {
    flex: 1,
    backgroundColor: '#252636',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: Platform.OS === 'ios' ? 12 : 16,
    backgroundColor: '#252636',
    borderBottomWidth: 1,
    borderBottomColor: '#32323E',
    elevation: Platform.OS === 'android' ? 3 : 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: Platform.OS === 'ios' ? 0.2 : 0.1,
    shadowRadius: Platform.OS === 'ios' ? 4 : 3,
    zIndex: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    padding: 8,
  },
  headerText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 12,
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
  scrollContent: {
    flex: 1,
  },
  scrollContentContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 32,
  },
  requestCard: {
    backgroundColor: '#32323E',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  profilePicture: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  defaultProfilePicture: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#AE63E4',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  profileInitial: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: 'bold',
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  userSubText: {
    color: '#9797A9',
    fontSize: 13,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  acceptButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginLeft: 12,
  },
  rejectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF4136',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 6,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  emptyText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubText: {
    color: '#9797A9',
    fontSize: 14,
    textAlign: 'center',
  },
});

export default FriendRequestsScreen; 