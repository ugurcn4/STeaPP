import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { getCurrentUserUid } from '../services/friendFunctions';
import { createGroup } from '../services/groupService';

// Grup simgeleri seçenekleri
const ICON_OPTIONS = [
  'users', 'user-friends', 'beer', 'coffee', 'utensils', 'gamepad', 
  'film', 'music', 'book', 'graduation-cap', 'plane', 'car', 'futbol', 
  'basketball-ball', 'volleyball-ball', 'running', 'hiking', 'dumbbell', 
  'home', 'building', 'briefcase', 'baby', 'heart'
];

// Grup renk seçenekleri
const COLOR_OPTIONS = [
  '#53B4DF', // Mavi
  '#4CAF50', // Yeşil
  '#FFAC30', // Turuncu
  '#FF4136', // Kırmızı
  '#AE63E4', // Mor
  '#FF5722', // Tuğla
  '#009688', // Turkuaz
  '#3F51B5', // İndigo
  '#795548', // Kahverengi
  '#607D8B', // Gri Mavi
];

const CreateGroupScreen = ({ navigation, route }) => {
  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('users');
  const [selectedColor, setSelectedColor] = useState('#53B4DF');
  const [loading, setLoading] = useState(false);
  
  // Route üzerinden gelen callback varsa kullan
  const onGroupCreated = route.params?.onGroupCreated;
  
  const handleCreateGroup = async () => {
    // Doğrulama
    if (!groupName.trim()) {
      Alert.alert('Hata', 'Lütfen grup adı girin');
      return;
    }
    
    try {
      setLoading(true);
      
      // Kullanıcı ID'sini al
      const uid = await getCurrentUserUid();
      if (!uid) {
        Alert.alert('Hata', 'Kullanıcı bilgileriniz alınamadı');
        setLoading(false);
        return;
      }
      
      // Grup verisi
      const groupData = {
        name: groupName,
        description: groupDescription,
        icon: selectedIcon,
        color: selectedColor
      };
      
      // Grup oluştur
      const newGroup = await createGroup(groupData, uid);
      
      // Başarılı mesajı
      Alert.alert(
        'Başarılı', 
        'Grup başarıyla oluşturuldu',
        [{ 
          text: 'Tamam', 
          onPress: () => {
            // Navigation geçmişini temizleyip ana sayfaya dönüş
            navigation.reset({
              index: 0,
              routes: [{ name: 'MainTabs', params: { screen: 'Arkadaşlar' } }],
            });
          }
        }]
      );
    } catch (error) {
      console.error('Grup oluşturulurken hata:', error);
      Alert.alert('Hata', 'Grup oluşturulurken bir sorun oluştu');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Yeni Grup Oluştur</Text>
        <TouchableOpacity 
          style={[
            styles.createButton,
            !groupName.trim() && styles.disabledButton
          ]}
          onPress={handleCreateGroup}
          disabled={!groupName.trim() || loading}
        >
          <Text style={styles.createButtonText}>Oluştur</Text>
        </TouchableOpacity>
      </View>
      
      <ScrollView style={styles.content}>
        {/* Grup Ön İzleme */}
        <View style={styles.previewContainer}>
          <View style={[styles.groupIconPreview, { backgroundColor: selectedColor }]}>
            <FontAwesome5 name={selectedIcon} size={28} color="#FFFFFF" />
          </View>
          <Text style={styles.previewName}>
            {groupName || 'Grup Adı'}
          </Text>
          {groupDescription ? (
            <Text style={styles.previewDescription}>{groupDescription}</Text>
          ) : null}
        </View>
        
        {/* Form */}
        <View style={styles.formContainer}>
          {/* Grup Adı */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Grup Adı</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Örn: Yakın Arkadaşlar"
              placeholderTextColor="#9797A9"
              value={groupName}
              onChangeText={setGroupName}
              maxLength={50}
            />
          </View>
          
          {/* Grup Açıklaması */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Açıklama (İsteğe Bağlı)</Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              placeholder="Grubunuz hakkında kısa bir açıklama..."
              placeholderTextColor="#9797A9"
              value={groupDescription}
              onChangeText={setGroupDescription}
              multiline={true}
              numberOfLines={4}
              textAlignVertical="top"
              maxLength={200}
            />
          </View>
          
          {/* Grup Simgesi */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Grup Simgesi</Text>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.iconOptionsContainer}
            >
              {ICON_OPTIONS.map((icon) => (
                <TouchableOpacity
                  key={icon}
                  style={[
                    styles.iconOption,
                    { backgroundColor: selectedColor },
                    selectedIcon === icon && styles.selectedIconOption
                  ]}
                  onPress={() => setSelectedIcon(icon)}
                >
                  <FontAwesome5 name={icon} size={20} color="#FFFFFF" />
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
          
          {/* Grup Rengi */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Grup Rengi</Text>
            <View style={styles.colorOptionsContainer}>
              {COLOR_OPTIONS.map((color) => (
                <TouchableOpacity
                  key={color}
                  style={[
                    styles.colorOption,
                    { backgroundColor: color },
                    selectedColor === color && styles.selectedColorOption
                  ]}
                  onPress={() => setSelectedColor(color)}
                />
              ))}
            </View>
          </View>
        </View>
      </ScrollView>
      
      {/* Loading Overlay */}
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#FFFFFF" />
        </View>
      )}
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#252636',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#32323E',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
    elevation: 4,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
  },
  createButton: {
    backgroundColor: '#53B4DF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  disabledButton: {
    backgroundColor: 'rgba(83, 180, 223, 0.5)',
  },
  createButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  previewContainer: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#32323E',
    marginBottom: 16,
  },
  groupIconPreview: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  previewName: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  previewDescription: {
    color: '#CDCDCD',
    fontSize: 14,
    textAlign: 'center',
  },
  formContainer: {
    padding: 16,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    color: '#FFFFFF',
    fontSize: 14,
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#32323E',
    color: '#FFFFFF',
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
  },
  textArea: {
    minHeight: 100,
  },
  iconOptionsContainer: {
    flexDirection: 'row',
    paddingVertical: 8,
  },
  iconOption: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  selectedIconOption: {
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  colorOptionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  colorOption: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
    marginBottom: 12,
  },
  selectedColorOption: {
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default CreateGroupScreen; 