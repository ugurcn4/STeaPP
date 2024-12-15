import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, Modal, FlatList } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import * as Location from 'expo-location';
import { collection, addDoc, where, query, getDocs, onSnapshot, orderBy, limit, doc, getDoc } from 'firebase/firestore';
import { onAuthStateChanged, getAuth } from 'firebase/auth';
import { db } from '../../firebaseConfig';
import { Picker } from 'react-native-image-picker';
import { Ionicons } from '@expo/vector-icons';

import {
    getSharedWithMe,
    listenToSharedWithMe,
    trackLiveLocations,
    shareSelectedLocations,
} from '../helpers/firebaseHelpers';


// İki koordinat arasındaki mesafeyi hesaplamak için Haversine formülü
const haversine = (lat1, lon1, lat2, lon2) => {
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
            prev.includes(location)
                ? prev.filter((loc) => loc !== location)
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
                        coordinate={{ latitude: parseFloat(loc.enlem), longitude: parseFloat(loc.boylam) }}
                        pinColor={selectionMode && selectedLocations.includes(loc) ? "green" : "red"}
                        title={`Gittiğiniz konum ${new Date(loc.timestamp).toLocaleDateString()}`}
                        onPress={() => handleMarkerPress(loc)}
                    />
                ))}

                {sharedLocations.map((loc, index) => (
                    <Marker
                        key={index}
                        coordinate={{
                            latitude: parseFloat(loc.latitude),
                            longitude: parseFloat(loc.longitude),
                        }}
                        pinColor="blue"
                        title={`Paylaşılan konum: ${new Date(loc.timestamp).toLocaleDateString()}`}
                    />
                ))}

                {liveLocation && (
                    <Marker
                        coordinate={{
                            latitude: liveLocation.latitude,
                            longitude: liveLocation.longitude,
                        }}
                        pinColor="green"
                        title={`Canlı konum ${new Date(liveLocation.timestamp).toLocaleDateString()}`}
                    />
                )}
            </MapView>

            <TouchableOpacity
                style={styles.iconContainer}
                onPress={() => setPickerVisible(!pickerVisible)}
            >
                <Ionicons name="options" size={24} color="black" />
            </TouchableOpacity>

            {pickerVisible && (
                <View style={styles.pickerContainer}>
                    <Picker
                        selectedValue={MapType}
                        onValueChange={(itemValue) => setMapType(itemValue)}
                    >
                        <Picker.Item label="Standart" value="standard" />
                        <Picker.Item label="Hibrit" value="hybrid" />
                        <Picker.Item label="Uydu" value="satellite" />
                    </Picker>
                </View>
            )}

            <TouchableOpacity
                style={styles.selectionButton}
                onPress={() => setSelectionMode(!selectionMode)}
            >
                <Text style={styles.selectionButtonText}>
                    {selectionMode ? "Seçim Modunu Kapat" : "Seçim Modunu Aç"}
                </Text>
            </TouchableOpacity>

            {selectionMode && (
                <TouchableOpacity
                    style={styles.shareButton}
                    onPress={() => setFriendPickerVisible(true)}
                >
                    <Text style={styles.shareButtonText}>Arkadaş Seç ve Paylaş</Text>
                </TouchableOpacity>
            )}

            {/* Arkadaş Seçimi Modalı */}
            <Modal
                visible={friendPickerVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setFriendPickerVisible(false)}
            >
                <View style={styles.modalContainer}>
                    <Text style={styles.modalTitle}>Arkadaş Seç</Text>
                    <FlatList
                        data={friends}
                        keyExtractor={(item) => item.id}
                        renderItem={({ item }) => (
                            <TouchableOpacity
                                style={styles.friendItem}
                                onPress={() => {
                                    setSelectedFriend(item);
                                    setFriendPickerVisible(false);
                                    handleShareSelectedLocations(item);
                                }}
                            >
                                <Text style={styles.friendName}>{item.name}</Text>
                            </TouchableOpacity>
                        )}
                    />
                    <TouchableOpacity
                        style={styles.closeButton}
                        onPress={() => setFriendPickerVisible(false)}
                    >
                        <Text style={styles.closeButtonText}>Kapat</Text>
                    </TouchableOpacity>
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
        ...StyleSheet.absoluteFillObject,
    },
    iconContainer: {
        position: 'absolute',
        top: 10,
        right: 4,
        backgroundColor: 'white',
        padding: 10,
        borderRadius: 20,
        elevation: 5,
        marginTop: 94,
    },
    pickerContainer: {
        position: 'absolute',
        bottom: 0,
        width: '100%',
        backgroundColor: 'white',
        padding: 20,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    selectionButton: {
        position: 'absolute',
        bottom: 80,
        left: 20,
        backgroundColor: '#4CAF50',
        padding: 10,
        borderRadius: 5,
    },
    selectionButtonText: {
        color: 'white',
        fontSize: 16,
    },
    shareButton: {
        position: 'absolute',
        bottom: 20,
        left: 20,
        backgroundColor: '#4CAF50',
        padding: 10,
        borderRadius: 5,
    },
    shareButtonText: {
        color: 'white',
        fontSize: 16,
    },
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 20,
    },
    friendItem: {
        backgroundColor: '#fff',
        padding: 15,
        marginVertical: 5,
        borderRadius: 8,
        width: '80%',
        alignItems: 'center',
    },
    friendName: {
        fontSize: 18,
    },
    closeButton: {
        marginTop: 20,
        backgroundColor: '#E57373',
        padding: 10,
        borderRadius: 5,
    },
    closeButtonText: {
        color: 'white',
        fontSize: 16,
    },

});

export default MapPage;