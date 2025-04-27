import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StatusBar, TouchableOpacity, Image, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

// Oluşturduğumuz bileşenleri import edelim
import QuickOptions from '../components/QuickOptions';
import FriendGroups from '../components/FriendGroups';
import Meetings from '../components/Meetings';
import UserSearch from '../components/UserSearch';
import { getFriendRequests } from '../services/friendFunctions';

// Stil dosyasını import edelim
import styles from '../styles/FriendsPageStyles';

const FriendsPage = ({ navigation, route }) => {
  const [searchModalVisible, setSearchModalVisible] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [friendRequests, setFriendRequests] = useState([]);

  // Sayfa odaklandığında verileri yenile
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      setRefreshKey(prev => prev + 1);
      loadFriendRequests();
    });

    return unsubscribe;
  }, [navigation]);

  // Arkadaşlık isteklerini yükle
  const loadFriendRequests = async () => {
    try {
      const requests = await getFriendRequests();
      setFriendRequests(requests);
    } catch (error) {
      console.error('Arkadaşlık istekleri yüklenirken hata:', error);
    }
  };

  // Eğer route.params.refresh varsa, yenileme yap
  useEffect(() => {
    if (route.params?.refresh) {
      setRefreshKey(prev => prev + 1);
      loadFriendRequests();
      navigation.setParams({ refresh: null });
    }
  }, [route.params?.refresh]);

  // Tüm verileri yenilemeyi tetikle
  const handleDataRefresh = () => {
    setRefreshKey(prev => prev + 1);
    loadFriendRequests();
  };

  // İlk yüklemede istekleri getir
  useEffect(() => {
    loadFriendRequests();
  }, []);

  // Bekleyen istekler bölümünü render et
  const renderPendingRequestsSection = () => {
    if (friendRequests.length === 0) return null;
    
    return (
      <View style={styles.pendingRequestsSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Bekleyen İstekler</Text>
          <TouchableOpacity 
            style={styles.seeAllButton}
            onPress={() => navigation.navigate('FriendRequests')}
          >
            <Text style={styles.seeAllText}>Tümünü Gör</Text>
          </TouchableOpacity>
        </View>
        
        <TouchableOpacity 
          style={styles.pendingRequestsCard}
          onPress={() => navigation.navigate('FriendRequests')}
        >
          <View style={styles.pendingRequestsInfo}>
            <View style={styles.pendingRequestsIcon}>
              <Ionicons name="mail" size={22} color="#FFFFFF" />
            </View>
            <View>
              <Text style={styles.pendingRequestsTitle}>
                {friendRequests.length} yeni arkadaşlık isteği
              </Text>
              <Text style={styles.pendingRequestsSubtitle}>
                Bekleyen istekleri görüntüle ve yanıtla
              </Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={24} color="#9797A9" />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle="light-content"
      />
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header Bölümü */}
        <LinearGradient 
          colors={['#252636', '#292A3E']} 
          start={{x: 0, y: 0}} 
          end={{x: 0, y: 1}}
          style={styles.header}
        >
          <View>
            <Text style={{color: '#AE63E4', fontSize: 14, fontWeight: '500', marginBottom: 4}}>Hoş Geldin</Text>
            <Text style={styles.headerTitle}>Arkadaşlarım</Text>
          </View>
          <View style={styles.headerActionButtons}>
            <TouchableOpacity style={styles.headerButton}>
              <Ionicons name="notifications" size={22} color="#AE63E4" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerButton} onPress={() => setSearchModalVisible(true)}>
              <Ionicons name="search" size={22} color="#AE63E4" />
            </TouchableOpacity>
          </View>
        </LinearGradient>
        
        {/* Hızlı Erişim Bölümü */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Hızlı Erişim</Text>
          <TouchableOpacity style={styles.seeAllButton}>
            <Text style={styles.seeAllText}>Özelleştir</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.quickOptionsSection}>
          <QuickOptions navigation={navigation} />
        </View>
        
        {/* Bekleyen İstekler Bölümü */}
        {renderPendingRequestsSection()}
        
        {/* Arkadaş Grupları Bölümü */}
        <View style={styles.friendGroupsSection}>
          <FriendGroups refreshKey={refreshKey} />
        </View>
        
        {/* Buluşmalar Bölümü */}
        <View style={styles.meetingsSection}>
          <Meetings navigation={navigation} />
        </View>
        
        {/* Alt boşluk */}
        <View style={{ height: 20 }} />
      </ScrollView>

      {/* Arkadaş Arama Modalı */}
      <UserSearch 
        visible={searchModalVisible}
        onClose={() => setSearchModalVisible(false)}
        refreshData={handleDataRefresh}
      />
      
      {/* Alt Navigasyon Çubuğu */}
      <View style={styles.tabBar}>
        <TouchableOpacity 
          style={styles.tabButton}
          onPress={() => navigation.navigate('Home')}
        >
          <Ionicons name="home" size={24} color="#9797A9" style={styles.tabIcon} />
          <Text style={styles.tabLabel}>Ana Sayfa</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.tabButton}>
          <Ionicons name="people" size={24} color="#AE63E4" style={styles.tabIcon} />
          <Text style={[styles.tabLabel, styles.activeTabLabel]}>Arkadaşlar</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.tabButton}
          onPress={() => navigation.navigate('Map')}
        >
          <Ionicons name="map" size={24} color="#9797A9" style={styles.tabIcon} />
          <Text style={styles.tabLabel}>Harita</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.tabButton}
          onPress={() => navigation.navigate('Events')}
        >
          <Ionicons name="calendar" size={24} color="#9797A9" style={styles.tabIcon} />
          <Text style={styles.tabLabel}>Etkinlikler</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.tabButton}
          onPress={() => navigation.navigate('Profile')}
        >
          <Ionicons name="person" size={24} color="#9797A9" style={styles.tabIcon} />
          <Text style={styles.tabLabel}>Profil</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default FriendsPage;