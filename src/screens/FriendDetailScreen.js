import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Platform } from 'react-native';
import { useSelector } from 'react-redux';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import { shareLocation, shareLiveLocation, trackLiveLocations, listenToSharedLocations } from '../helpers/firebaseHelpers';
import { Ionicons } from '@expo/vector-icons';

const FriendDetailScreen = ({ route, navigation }) => {
    const [isSharing, setIsSharing] = useState(false);
    const [sharingType, setSharingType] = useState(null); // 'live' veya 'current'
    const [locationSubscription, setLocationSubscription] = useState(null);
    const [friendLocation, setFriendLocation] = useState(null);
    const [myLocation, setMyLocation] = useState(null);
    const mapRef = useRef(null);
    const { friend } = route.params;
    const userId = useSelector(state => state.user.userId);

    useEffect(() => {
        let liveLocationsUnsubscribe;
        let sharedLocationsUnsubscribe;

        const setupLocationTracking = async () => {
            try {
                const { status } = await Location.requestForegroundPermissionsAsync();
                if (status !== 'granted') {
                    Alert.alert('Hata', 'Konum izni gerekli');
                    return;
                }

                const location = await Location.getCurrentPositionAsync({});
                setMyLocation({
                    latitude: location.coords.latitude,
                    longitude: location.coords.longitude,
                });

                // Canlı konumları dinle
                liveLocationsUnsubscribe = trackLiveLocations(userId, (locations) => {
                    const friendLiveLocation = locations.find(loc => loc.sharedBy === friend.id);
                    if (friendLiveLocation) {
                        setFriendLocation({
                            latitude: friendLiveLocation.latitude,
                            longitude: friendLiveLocation.longitude,
                            timestamp: new Date(friendLiveLocation.timestamp),
                            type: 'live'
                        });
                    }
                });

                // Paylaşılan konumları dinle
                sharedLocationsUnsubscribe = listenToSharedLocations(userId, (type, locations) => {
                    if (type === 'shared') {
                        const friendSharedLocation = locations.find(loc => loc.sharedBy === friend.id);
                        if (friendSharedLocation) {
                            setFriendLocation({
                                latitude: friendSharedLocation.latitude,
                                longitude: friendSharedLocation.longitude,
                                timestamp: new Date(friendSharedLocation.timestamp),
                                type: 'shared'
                            });
                        }
                    }
                });

            } catch (error) {
                console.error('Konum takibi başlatılırken hata:', error);
                Alert.alert('Hata', 'Konum takibi başlatılamadı');
            }
        };

        setupLocationTracking();

        return () => {
            if (liveLocationsUnsubscribe) liveLocationsUnsubscribe();
            if (sharedLocationsUnsubscribe) sharedLocationsUnsubscribe();
            if (locationSubscription) locationSubscription.remove();
        };
    }, [userId, friend.id]);

    const startSharing = async (type) => {
        try {
            if (!myLocation) {
                Alert.alert('Hata', 'Konum bilgisi alınamadı');
                return;
            }

            const locationData = {
                latitude: myLocation.latitude,
                longitude: myLocation.longitude,
                timestamp: new Date().toISOString()
            };

            if (type === 'current') {
                await shareLocation(userId, friend.id, locationData);
                Alert.alert('Başarılı', 'Anlık konum paylaşıldı');
            } else if (type === 'live') {
                const subscription = await shareLiveLocation(userId, friend.id);
                setLocationSubscription(subscription);
                Alert.alert('Başarılı', 'Canlı konum paylaşımı başlatıldı');
            }

            setSharingType(type);
            setIsSharing(true);
        } catch (error) {
            console.error('Konum paylaşımı başlatılırken hata:', error);
            Alert.alert('Hata', 'Konum paylaşımı başlatılamadı');
        }
    };

    const stopSharing = async () => {
        try {
            if (locationSubscription) {
                locationSubscription.remove();
            }
            setIsSharing(false);
            setSharingType(null);
        } catch (error) {
            console.error('Konum paylaşımı durdurulurken hata:', error);
            Alert.alert('Hata', 'Konum paylaşımı durdurulamadı');
        }
    };

    const handleMessagePress = () => {
        const chatFriend = {
            id: friend.id,
            name: friend.name || friend.informations?.name,
            profilePicture: friend.profilePicture || friend.informations?.profilePicture,
            informations: friend.informations,
            isOnline: friend.isOnline || false,
            lastSeen: friend.lastSeen
        };

        navigation.navigate('DirectMessages', {
            screen: 'MessagesHome',
            params: {
                initialChat: chatFriend
            }
        });
    };

    // Marker render fonksiyonu
    const renderMarker = (location, isMyLocation) => {
        if (!location) return null;

        return (
            <Marker
                coordinate={{
                    latitude: location.latitude,
                    longitude: location.longitude
                }}
                title={isMyLocation ? "Benim Konumum" : `${friend.name}'in Konumu`}
            >
                <View style={styles.markerContainer}>
                    <Ionicons
                        name="location"
                        size={30}
                        color={isMyLocation ? "#4CAF50" :
                            (location.type === 'live' ? "#2196F3" : "#FF5252")}
                    />
                </View>
            </Marker>
        );
    };

    return (
        <View style={styles.container}>
            {myLocation && (
                <MapView
                    ref={mapRef}
                    style={styles.map}
                    initialRegion={{
                        latitude: myLocation.latitude,
                        longitude: myLocation.longitude,
                        latitudeDelta: 0.0922,
                        longitudeDelta: 0.0421,
                    }}
                >
                    {myLocation && renderMarker(myLocation, true)}
                    {friendLocation && renderMarker(friendLocation, false)}
                </MapView>
            )}

            <View style={styles.actionButtons}>
                <TouchableOpacity
                    style={[styles.actionButton, styles.messageButton]}
                    onPress={handleMessagePress}
                >
                    <Ionicons name="chatbubble-outline" size={24} color="#fff" />
                    <Text style={styles.actionButtonText}>Mesaj Gönder</Text>
                </TouchableOpacity>

                {!isSharing ? (
                    <>
                        <TouchableOpacity
                            style={[styles.shareButton, styles.currentLocation]}
                            onPress={() => startSharing('current')}
                        >
                            <Ionicons name="location-outline" size={24} color="white" />
                            <Text style={styles.shareButtonText}>Anlık Konum Paylaş</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.shareButton, styles.liveLocation]}
                            onPress={() => startSharing('live')}
                        >
                            <Ionicons name="navigate-outline" size={24} color="white" />
                            <Text style={styles.shareButtonText}>Canlı Konum Paylaş</Text>
                        </TouchableOpacity>
                    </>
                ) : (
                    <TouchableOpacity
                        style={[styles.shareButton, styles.stopSharing]}
                        onPress={stopSharing}
                    >
                        <Ionicons name="stop-circle-outline" size={24} color="white" />
                        <Text style={styles.shareButtonText}>
                            {sharingType === 'live' ? 'Canlı Konumu Durdur' : 'Paylaşımı Durdur'}
                        </Text>
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    map: {
        flex: 1,
        width: '100%',
    },
    actionButtons: {
        position: 'absolute',
        bottom: 20,
        left: 20,
        right: 20,
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    actionButton: {
        backgroundColor: '#4CAF50',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 15,
        borderRadius: 25,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    messageButton: {
        backgroundColor: '#2196F3',
    },
    shareButton: {
        backgroundColor: '#4CAF50',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 15,
        borderRadius: 25,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    currentLocation: {
        backgroundColor: '#4CAF50',
        marginBottom: 10,
    },
    liveLocation: {
        backgroundColor: '#2196F3',
    },
    stopSharing: {
        backgroundColor: '#FF5252',
    },
    shareButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 8,
    },
    markerContainer: {
        alignItems: 'center',
    },
    actionButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 8,
    },
});

export default FriendDetailScreen; 