import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Image, ScrollView, ActivityIndicator } from 'react-native';
import { MaterialIcons, FontAwesome5, Ionicons } from '@expo/vector-icons';
import styles from '../styles/FriendGroupsStyles';
import { getCurrentUserUid, getFriendRequests } from '../services/friendFunctions';
import { getDoc, doc } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { fetchUserGroups, fetchPendingGroupInvitations } from '../services/groupService';
import { useNavigation } from '@react-navigation/native';

const FriendGroups = ({ refreshKey }) => {
  const navigation = useNavigation();
  const [userFriends, setUserFriends] = useState([]);
  const [userGroups, setUserGroups] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [pendingGroupInvites, setPendingGroupInvites] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadFriendsAndGroups = async () => {
      try {
        setLoading(true);
        
        // Mevcut kullanıcının UID'sini al
        const uid = await getCurrentUserUid();
        if (!uid) return;
        
        // Kullanıcı belgesini çek
        const userDoc = await getDoc(doc(db, 'users', uid));
        if (!userDoc.exists()) return;
        
        const userData = userDoc.data();
        const friends = userData.friends || [];
        
        // Bekleyen arkadaşlık isteklerini al
        const requests = await getFriendRequests();
        setPendingRequests(requests);
        
        // Arkadaş detaylarını al
        if (friends.length > 0) {
          const friendDetails = await Promise.all(
            friends.map(async (friendId) => {
              const friendDoc = await getDoc(doc(db, 'users', friendId));
              if (friendDoc.exists()) {
                return {
                  id: friendId,
                  ...friendDoc.data(),
                  name: friendDoc.data().informations?.name || 'İsimsiz Kullanıcı',
                  profilePicture: friendDoc.data().profilePicture || null,
                };
              }
              return null;
            })
          );
          
          setUserFriends(friendDetails.filter(friend => friend !== null));
        }

        // Kullanıcının gruplarını getir
        const groups = await fetchUserGroups(uid);
        setUserGroups(groups);

        // Bekleyen grup davetlerini getir
        const groupInvitations = await fetchPendingGroupInvitations(uid);
        setPendingGroupInvites(groupInvitations);
        
      } catch (error) {
        console.error('Veriler yüklenirken hata:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadFriendsAndGroups();
  }, [refreshKey]);

  const handleCreateGroup = () => {
    navigation.navigate('CreateGroupScreen');
  };

  const handleViewGroup = (groupId) => {
    navigation.navigate('GroupDetail', { groupId });
  };

  const handleGroupInvitations = () => {
    navigation.navigate('GroupInvitations');
  };

  const renderGroupAvatars = (membersData) => {
    if (!membersData || membersData.length === 0) return null;

    return (
      <View style={styles.avatarsContainer}>
        {membersData.slice(0, 3).map((member, index) => (
          <View key={index} style={[styles.avatar, { zIndex: membersData.length - index }]}>
            {member.profilePicture ? (
              <Image 
                source={{ uri: member.profilePicture }} 
                style={{ width: '100%', height: '100%', borderRadius: 15 }}
              />
            ) : (
              <View style={{ 
                width: '100%', 
                height: '100%', 
                borderRadius: 15,
                backgroundColor: '#AE63E4',
                justifyContent: 'center',
                alignItems: 'center'
              }}>
                <Text style={{ color: '#FFF', fontWeight: 'bold' }}>
                  {member.name.charAt(0)}
                </Text>
              </View>
            )}
          </View>
        ))}
        
        {membersData.length > 3 && (
          <View style={styles.moreAvatars}>
            <Text style={styles.moreAvatarsText}>+{membersData.length - 3}</Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>Arkadaş Grupları</Text>
        <TouchableOpacity 
          style={styles.headerButton}
          onPress={() => navigation.navigate('GroupsList')}
        >
          <Text style={styles.headerButtonText}>Tümünü Gör</Text>
          <Ionicons name="chevron-forward" size={14} color="#AE63E4" />
        </TouchableOpacity>
      </View>
      
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.groupsScrollContainer}
      >
        {loading ? (
          // Yükleme durumu göstergesi
          <View style={styles.emptyStateCard}>
            <ActivityIndicator size="large" color="#AE63E4" />
            <Text style={[styles.emptyStateText, {marginTop: 16}]}>Yükleniyor...</Text>
          </View>
        ) : (
          <>
            <TouchableOpacity 
              style={styles.createGroupCard}
              onPress={handleCreateGroup}
            >
              <View style={styles.createGroupIcon}>
                <Ionicons name="people" size={24} color="#FFFFFF" />
                <View style={styles.plusBadge}>
                  <Text style={styles.plusBadgeText}>+</Text>
                </View>
              </View>
              <Text style={styles.createGroupText}>Yeni Grup</Text>
            </TouchableOpacity>
            
            {/* Bekleyen Grup Davetleri */}
            {pendingGroupInvites.length > 0 && (
              <TouchableOpacity 
                style={[styles.groupCard, {borderLeftColor: '#4CAF50'}]}
                onPress={handleGroupInvitations}
              >
                <View style={[styles.groupIcon, { backgroundColor: '#4CAF50' }]}>
                  <Ionicons name="people" size={18} color="#FFFFFF" />
                  <View style={[styles.notificationBadge, {backgroundColor: '#4CAF50'}]}>
                    <Text style={styles.notificationText}>{pendingGroupInvites.length}</Text>
                  </View>
                </View>
                
                <Text style={styles.groupName}>Grup Davetleri</Text>
                
                <View style={[styles.statusPill, { backgroundColor: 'rgba(76, 175, 80, 0.2)' }]}>
                  <Ionicons name="time" size={12} color="#4CAF50" />
                  <Text style={[styles.statusText, { color: '#4CAF50' }]}>Yeni</Text>
                </View>
                
                <Text style={styles.groupMembers}>{pendingGroupInvites.length} davet</Text>
                
                <View style={styles.groupDivider} />
                
                <View style={styles.groupFooter}>
                  <Text style={{ color: '#9797A9', fontSize: 12 }}>Grup daveti</Text>
                  <TouchableOpacity style={styles.viewButton}>
                    <Text style={styles.viewButtonText}>Görüntüle</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            )}
            
            {/* Kullanıcının Grupları */}
            {userGroups.map((group) => (
              <TouchableOpacity 
                key={group.id} 
                style={[styles.groupCard, {borderLeftColor: group.color}]}
                onPress={() => handleViewGroup(group.id)}
              >
                <View style={[styles.groupIcon, { backgroundColor: group.color }]}>
                  <FontAwesome5 name={group.icon} size={18} color="#FFFFFF" />
                </View>
                
                <Text style={styles.groupName}>{group.name}</Text>
                
                <View style={styles.statusPill}>
                  <Ionicons name="people" size={12} color="#AE63E4" />
                  <Text style={styles.statusText}>{group.members.length} üye</Text>
                </View>
                
                <Text style={styles.groupMembers}>
                  {group.membersData?.length > 0 ? `${group.membersData.length} üye` : 'Üye yok'}
                </Text>
                
                <View style={styles.groupDivider} />
                
                <View style={styles.groupFooter}>
                  {renderGroupAvatars(group.membersData)}
                  <TouchableOpacity style={styles.viewButton}>
                    <Text style={styles.viewButtonText}>Görüntüle</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            ))}
            
            {/* Boş Durum Göstergesi - Hiç grup veya bildirim yoksa */}
            {userGroups.length === 0 && pendingGroupInvites.length === 0 && (
              <View style={styles.emptyStateCard}>
                <Ionicons name="people" size={48} color="#9797A9" />
                <Text style={styles.emptyStateText}>Henüz bir grubunuz yok</Text>
                <Text style={styles.emptyStateSubText}>Yeni bir grup oluşturmak için "Yeni Grup" butonuna tıklayın</Text>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
};

export default FriendGroups; 