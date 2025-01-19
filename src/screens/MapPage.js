import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, Modal, FlatList, Image } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import * as Location from 'expo-location';
import { collection, addDoc, where, query, getDocs, onSnapshot, orderBy, limit, doc, getDoc } from 'firebase/firestore';
import { onAuthStateChanged, getAuth } from 'firebase/auth';
import { db } from '../../firebaseConfig';
import { Ionicons } from '@expo/vector-icons';
import { addLocation } from '../helpers/firebaseHelpers';


import {
    getSharedWithMe,
    listenToSharedWithMe,
    trackLiveLocations,
    shareSelectedLocations,
} from '../helpers/firebaseHelpers';
import { fetchFriends } from './FriendsPage';


// İki koordinat arasındaki mesafeyi hesaplamak için Haversine formülü
export const haversine = (lat1, lon1, lat2, lon2) => {
    const toRad = (x) => x * Math.PI / 180;
    const R = 6371e3; // Dünyanın metre cinsinden yarıçapı
    const φ1 = toRad(lat1);
    const φ2 = toRad(lat2);
    const Δφ = toRad(lat2 - lat1);
    const Δλ = toRad(lon2 - lon1);

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) *
        Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Metre cinsinden mesafe
};

const CustomMarker = ({ isSelected, timestamp, type = 'normal' }) => {
    let markerColor = '#FF5252'; // Varsayılan kırmızı
    let iconName = 'location';

    switch (type) {
        case 'selected':
            markerColor = '#4CAF50'; // Seçili yeşil
            iconName = 'location';
            break;
        case 'shared':
            markerColor = '#2196F3'; // Paylaşılan mavi
            iconName = 'share-location';
            break;
        case 'live':
            markerColor = '#FFC107'; // Canlı sarı
            iconName = 'navigate';
            break;
    }

    return (
        <View style={styles.markerContainer}>
            <View style={[styles.markerBubble, { backgroundColor: markerColor }]}>
                <Ionicons name={iconName} size={20} color="#FFF" />
            </View>
            <View style={[styles.markerArrow, { borderTopColor: markerColor }]} />
            {timestamp && (
                <View style={styles.markerLabel}>
                    <Text style={styles.markerText}>
                        {new Date(timestamp).toLocaleDateString()}
                    </Text>
                </View>
            )}
        </View>
    );
};

const MapPage = () => {
    const [MapType, setMapType] = useState('standard');
    const [pickerVisible, setPickerVisible] = useState(false);
    const [location, setLocation] = useState(null);
    const [errorMsg, setErrorMsg] = useState(null);
    const [userId, setUserId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [locationClusters, setLocationClusters] = useState([]); // Yeni kümeler için state
    const [sharedLocations, setSharedLocations] = useState([]); // Paylaşılan konumlar için state
    const [liveLocation, setLiveLocation] = useState(null); // Canlı konum için state
    const [selectionMode, setSelectionMode] = useState(false);
    const [selectedLocations, setSelectedLocations] = useState([]);
    const [selectedFriend, setSelectedFriend] = useState(null);
    const [friendPickerVisible, setFriendPickerVisible] = useState(false);
    const [friends, setFriends] = useState([]);
    const mapRef = useRef(null);

    const auth = getAuth();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                setUserId(user.uid);
            } else {
                setErrorMsg('Kullanıcı oturumu açık değil');
            }
        });

        return () => unsubscribe();
    }, []);



    useEffect(() => {
        const getLocation = async () => {
            try {
                let { status } = await Location.requestForegroundPermissionsAsync();
                if (status !== 'granted') {
                    setErrorMsg('Konuma erişim izni reddedildi');
                    setLoading(false);
                    return;
                }

                let location = await Location.getCurrentPositionAsync({});
                setLocation(location);
                setLoading(false);

                // Anlık konum değişikliklerini izleyin
                await Location.watchPositionAsync(
                    {
                        accuracy: Location.Accuracy.High,
                        timeInterval: 5000,
                        distanceInterval: 10,
                    },
                    (newLocation) => {
                        setLocation(newLocation);
                        if (userId) {
                            checkAndAddLocation(newLocation);
                        }
                    }
                );
            } catch (error) {
                setErrorMsg('Konum alınırken bir hata oluştu');
                setLoading(false);
            }
        };

        const fetchLocations = async () => {
            if (userId) {
                const q = collection(db, `users/${userId}/locations`);
                onSnapshot(q, (querySnapshot) => {
                    const fetchedLocations = querySnapshot.docs.map(doc => {
                        const data = doc.data();
                        return {
                            ...data,
                            id: doc.id,
                            timestamp: data.timestamp ? data.timestamp.toDate() : new Date(),
                        };
                    });

                    const sortedLocations = fetchedLocations.sort((a, b) => a.timestamp - b.timestamp);

                    // Konumları kümelere ayır
                    const clusters = [];
                    let currentCluster = [];

                    sortedLocations.forEach((location, index) => {
                        if (index === 0) {
                            currentCluster.push(location);
                        } else {
                            const prevLocation = currentCluster[currentCluster.length - 1];
                            const distance = haversine(prevLocation.enlem, prevLocation.boylam, location.enlem, location.boylam);

                            if (distance < 100) {
                                currentCluster.push(location);
                            } else {
                                clusters.push(currentCluster);
                                currentCluster = [location];
                            }
                        }
                    });

                    if (currentCluster.length > 0) {
                        clusters.push(currentCluster);
                    }

                    setLocationClusters(clusters);
                });
            }
        };

        const fetchSharedLocations = async () => {
            if (userId) {
                const locations = await getSharedWithMe(userId);
                setSharedLocations(locations);
            }
        };


        const checkAndAddLocation = async (newLocation) => {
            const q = query(
                collection(db, `users/${userId}/locations`),
                where('enlem', '==', newLocation.coords.latitude.toFixed(4)),
                where('boylam', '==', newLocation.coords.longitude.toFixed(4))
            );
            const querySnapshot = await getDocs(q);

            if (querySnapshot.empty) {
                const lastLocationDoc = await getDocs(
                    query(
                        collection(db, `users/${userId}/locations`),
                        orderBy('timestamp', 'desc'),
                        limit(1)
                    )
                );

                if (!lastLocationDoc.empty) {
                    const lastLocation = lastLocationDoc.docs[0].data();
                    const distance = haversine(
                        parseFloat(lastLocation.enlem),
                        parseFloat(lastLocation.boylam),
                        parseFloat(newLocation.coords.latitude.toFixed(4)),
                        parseFloat(newLocation.coords.longitude.toFixed(4))
                    );

                    if (distance < 50) {
                        await addDoc(collection(db, `users/${userId}/locations`), {
                            enlem: newLocation.coords.latitude.toFixed(4),
                            boylam: newLocation.coords.longitude.toFixed(4),
                            timestamp: new Date(),
                        });
                    } else {
                        await addDoc(collection(db, `users/${userId}/locations`), {
                            enlem: newLocation.coords.latitude.toFixed(4),
                            boylam: newLocation.coords.longitude.toFixed(4),
                            timestamp: new Date(),
                        });
                    }
                } else {
                    await addDoc(collection(db, `users/${userId}/locations`), {
                        enlem: newLocation.coords.latitude.toFixed(4),
                        boylam: newLocation.coords.longitude.toFixed(4),
                        timestamp: new Date(),
                    });
                }
            }
        };

        if (userId) {
            getLocation();
            fetchLocations();
            fetchSharedLocations();

            const unsubscribeSharedWithMe = listenToSharedWithMe(userId, (sharedLocations) => {
                setSharedLocations(sharedLocations);
            });

            // Canlı konumları dinleyin
            const unsubscribeLiveLocations = trackLiveLocations(userId, (liveLocations) => {
                if (liveLocations.length > 0) {
                    setLiveLocation(liveLocations[liveLocations.length - 1]);
                }
                else {
                    setLiveLocation(null); // Canlı konum yoksa null yap
                }
            });

            return () => {
                unsubscribeSharedWithMe();
                unsubscribeLiveLocations();
            };
        }

    }, [userId]);


    const handleMarkerPress = (location) => {
        if (!selectionMode) return;

        setSelectedLocations((prev) =>
            prev.some(loc =>
                loc.enlem === location.enlem &&
                loc.boylam === location.boylam
            )
                ? prev.filter(loc =>
                    loc.enlem !== location.enlem ||
                    loc.boylam !== location.boylam
                )
                : [...prev, location]
        );
    };


    const handleShareSelectedLocations = async (friend) => {
        if (selectedLocations.length === 0 || !friend) {
            alert('Lütfen paylaşmak için konumları ve arkadaşınızı seçin.');
            return;
        }
        try {
            await shareSelectedLocations(userId, selectedLocations, friend.id);
            alert(`${friend.name} ile konumlar başarıyla paylaşıldı.`);
        } catch (error) {
            console.error('Konumlar paylaşılırken hata oluştu:', error);
            alert('Konumlar paylaşılırken bir hata oluştu.');
        }
    };

    const handleMyLocation = () => {
        if (location?.coords) {
            mapRef.current?.animateToRegion({
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
            }, 1000);
        }
    };

    useEffect(() => {
        if (friendPickerVisible && userId) {
            const loadFriends = async () => {
                const friendsList = await fetchFriends(userId);
                setFriends(friendsList);
            };
            loadFriends();
        }
    }, [friendPickerVisible, userId]);

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#FDD329" />
                <Text>Konum bulunuyor...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <MapView
                ref={mapRef}
                style={styles.map}
                mapType={MapType}
                initialRegion={{
                    latitude: location?.coords?.latitude || 37.78825,
                    longitude: location?.coords?.longitude || -122.4324,
                    latitudeDelta: 0.0922,
                    longitudeDelta: 0.0421,
                }}
                showsUserLocation={true}
                showsScale={true}
                showsTraffic={true}
                rotateEnabled={true}
                pitchEnabled={true}
            >
                {locationClusters.map((cluster, clusterIndex) => (
                    <Polyline
                        key={clusterIndex}
                        coordinates={cluster.map((loc) => ({
                            latitude: parseFloat(loc.enlem),
                            longitude: parseFloat(loc.boylam),
                        }))}
                        strokeColor="#FF0000"
                        strokeWidth={4}
                        geodesic={true}
                    />
                ))}

                {locationClusters.flat().map((loc, index) => (
                    <Marker
                        key={index}
                        coordinate={{
                            latitude: parseFloat(loc.enlem),
                            longitude: parseFloat(loc.boylam)
                        }}
                        onPress={() => handleMarkerPress(loc)}
                    >
                        <CustomMarker
                            isSelected={selectedLocations.some(
                                selected =>
                                    selected.enlem === loc.enlem &&
                                    selected.boylam === loc.boylam
                            )}
                            timestamp={loc.timestamp}
                            type={selectedLocations.some(
                                selected =>
                                    selected.enlem === loc.enlem &&
                                    selected.boylam === loc.boylam
                            ) ? 'selected' : 'normal'}
                        />
                    </Marker>
                ))}

                {sharedLocations.map((loc, index) => (
                    <Marker
                        key={`shared_${index}`}
                        coordinate={{
                            latitude: parseFloat(loc.latitude),
                            longitude: parseFloat(loc.longitude)
                        }}
                    >
                        <CustomMarker
                            timestamp={loc.timestamp}
                            type="shared"
                        />
                    </Marker>
                ))}

                {liveLocation && (
                    <Marker
                        coordinate={{
                            latitude: liveLocation.latitude,
                            longitude: liveLocation.longitude
                        }}
                    >
                        <CustomMarker
                            timestamp={liveLocation.timestamp}
                            type="live"
                        />
                    </Marker>
                )}
            </MapView>

            <View style={styles.mapControls}>
                <TouchableOpacity
                    style={styles.mapTypeButton}
                    onPress={() => setPickerVisible(!pickerVisible)}
                >
                    <Ionicons name="layers-outline" size={24} color="#333" />
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.myLocationButton}
                    onPress={handleMyLocation}
                >
                    <Ionicons name="locate" size={24} color="#333" />
                </TouchableOpacity>
            </View>

            {pickerVisible && (
                <View style={styles.mapTypeSelector}>
                    <TouchableOpacity
                        style={[styles.mapTypeOption, MapType === 'standard' && styles.selectedMapType]}
                        onPress={() => {
                            setMapType('standard');
                            setPickerVisible(false);
                        }}
                    >
                        <Ionicons name="map-outline" size={24} color={MapType === 'standard' ? "#fff" : "#333"} />
                        <Text style={[styles.mapTypeText, MapType === 'standard' && styles.selectedMapTypeText]}>Standart</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.mapTypeOption, MapType === 'hybrid' && styles.selectedMapType]}
                        onPress={() => {
                            setMapType('hybrid');
                            setPickerVisible(false);
                        }}
                    >
                        <Ionicons name="globe-outline" size={24} color={MapType === 'hybrid' ? "#fff" : "#333"} />
                        <Text style={[styles.mapTypeText, MapType === 'hybrid' && styles.selectedMapTypeText]}>Hibrit</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.mapTypeOption, MapType === 'satellite' && styles.selectedMapType]}
                        onPress={() => {
                            setMapType('satellite');
                            setPickerVisible(false);
                        }}
                    >
                        <Ionicons name="earth-outline" size={24} color={MapType === 'satellite' ? "#fff" : "#333"} />
                        <Text style={[styles.mapTypeText, MapType === 'satellite' && styles.selectedMapTypeText]}>Uydu</Text>
                    </TouchableOpacity>
                </View>
            )}

            <View style={styles.selectionControls}>
                <TouchableOpacity
                    style={[styles.selectionButton, selectionMode && styles.activeSelectionButton]}
                    onPress={() => setSelectionMode(!selectionMode)}
                >
                    <Ionicons
                        name={selectionMode ? "checkmark-circle" : "ellipse-outline"}
                        size={24}
                        color={selectionMode ? "#fff" : "#333"}
                    />
                    <Text style={[styles.selectionButtonText, selectionMode && styles.activeSelectionButtonText]}>
                        {selectionMode ? "Seçim Modunu Kapat" : "Seçim Modunu Aç"}
                    </Text>
                </TouchableOpacity>

                {selectionMode && selectedLocations.length > 0 && (
                    <TouchableOpacity
                        style={styles.shareButton}
                        onPress={() => setFriendPickerVisible(true)}
                    >
                        <Ionicons name="share-social" size={24} color="#fff" />
                        <Text style={styles.shareButtonText}>Paylaş ({selectedLocations.length})</Text>
                    </TouchableOpacity>
                )}
            </View>

            <Modal
                visible={friendPickerVisible}
                transparent={true}
                animationType="slide"
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Konumları Paylaş</Text>
                            <Text style={styles.modalSubtitle}>
                                {selectedLocations.length} konum seçildi
                            </Text>
                        </View>

                        {friends.length > 0 ? (
                            <FlatList
                                data={friends}
                                keyExtractor={(item) => item.id}
                                renderItem={({ item }) => (
                                    <TouchableOpacity
                                        style={styles.friendItem}
                                        onPress={() => {
                                            handleShareSelectedLocations(item);
                                            setFriendPickerVisible(false);
                                        }}
                                    >
                                        <View style={styles.friendInfo}>
                                            <Image
                                                source={
                                                    item.profilePicture
                                                        ? { uri: item.profilePicture }
                                                        : { uri: `https://ui-avatars.com/api/?name=${item.name.slice(0, 2)}&background=4CAF50&color=fff&size=128` }
                                                }
                                                style={styles.friendAvatar}
                                            />
                                            <View style={styles.friendTextContainer}>
                                                <Text style={styles.friendName}>{item.name}</Text>
                                                {item.email && (
                                                    <Text style={styles.friendEmail}>{item.email}</Text>
                                                )}
                                            </View>
                                        </View>
                                        <Ionicons name="share-outline" size={24} color="#4CAF50" />
                                    </TouchableOpacity>
                                )}
                                ItemSeparatorComponent={() => <View style={styles.separator} />}
                            />
                        ) : (
                            <View style={styles.emptyState}>
                                <Ionicons name="people-outline" size={48} color="#666" />
                                <Text style={styles.emptyStateText}>Henüz arkadaşınız yok</Text>
                            </View>
                        )}

                        <TouchableOpacity
                            style={styles.closeModalButton}
                            onPress={() => setFriendPickerVisible(false)}
                        >
                            <Text style={styles.closeModalButtonText}>Kapat</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    map: {
        flex: 1,
    },
    mapControls: {
        position: 'absolute',
        right: 16,
        top: 50,
        backgroundColor: 'transparent',
    },
    mapTypeButton: {
        backgroundColor: '#fff',
        padding: 12,
        borderRadius: 30,
        marginBottom: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    myLocationButton: {
        backgroundColor: '#fff',
        padding: 12,
        borderRadius: 30,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    mapTypeSelector: {
        position: 'absolute',
        right: 16,
        top: 120,
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    mapTypeOption: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 10,
        borderRadius: 15,
        marginBottom: 5,
    },
    selectedMapType: {
        backgroundColor: '#4CAF50',
    },
    mapTypeText: {
        marginLeft: 10,
        fontSize: 16,
        color: '#333',
    },
    selectedMapTypeText: {
        color: '#fff',
    },
    selectionControls: {
        position: 'absolute',
        bottom: 100,
        left: 16,
        right: 16,
    },
    selectionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        padding: 12,
        borderRadius: 30,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    activeSelectionButton: {
        backgroundColor: '#4CAF50',
    },
    selectionButtonText: {
        marginLeft: 8,
        fontSize: 16,
        color: '#333',
    },
    activeSelectionButtonText: {
        color: '#fff',
    },
    shareButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#4CAF50',
        padding: 12,
        borderRadius: 30,
        marginTop: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    shareButtonText: {
        marginLeft: 8,
        fontSize: 16,
        color: '#fff',
    },
    modalContainer: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        padding: 20,
        maxHeight: '80%',
    },
    modalHeader: {
        alignItems: 'center',
        marginBottom: 20,
        paddingBottom: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
    },
    modalSubtitle: {
        fontSize: 14,
        color: '#666',
        marginTop: 5,
    },
    friendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 12,
    },
    friendInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    friendAvatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        marginRight: 15,
    },
    friendTextContainer: {
        flex: 1,
    },
    friendName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
    },
    friendEmail: {
        fontSize: 14,
        color: '#666',
        marginTop: 2,
    },
    separator: {
        height: 1,
        backgroundColor: '#eee',
        marginHorizontal: 12,
    },
    emptyState: {
        alignItems: 'center',
        padding: 30,
    },
    emptyStateText: {
        fontSize: 16,
        color: '#666',
        marginTop: 10,
    },
    closeModalButton: {
        backgroundColor: '#f0f0f0',
        padding: 15,
        borderRadius: 15,
        marginTop: 20,
        alignItems: 'center',
    },
    closeModalButtonText: {
        fontSize: 16,
        color: '#333',
        fontWeight: '600',
    },
    markerContainer: {
        alignItems: 'center',
    },
    markerBubble: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 8,
        borderRadius: 20,
        backgroundColor: '#FF5252',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    markerArrow: {
        width: 0,
        height: 0,
        borderLeftWidth: 8,
        borderRightWidth: 8,
        borderTopWidth: 8,
        borderStyle: 'solid',
        backgroundColor: 'transparent',
        borderLeftColor: 'transparent',
        borderRightColor: 'transparent',
        borderTopColor: '#FF5252',
        alignSelf: 'center',
        marginTop: -1,
    },
    markerLabel: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 4,
        paddingHorizontal: 8,
        marginTop: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
        elevation: 3,
    },
    markerText: {
        fontSize: 12,
        color: '#333',
    },
});

export default MapPage;