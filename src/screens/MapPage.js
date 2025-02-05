import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, Modal, FlatList, Image } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import * as Location from 'expo-location';
import { collection, addDoc, where, query, getDocs, onSnapshot, orderBy, limit } from 'firebase/firestore';
import { onAuthStateChanged, getAuth } from 'firebase/auth';
import { db } from '../../firebaseConfig';
import { Ionicons } from '@expo/vector-icons';

import {
    getSharedWithMe,
    trackLiveLocations,
    shareSelectedLocations,
    listenToShares,
    listenToSharedLocations,
} from '../helpers/firebaseHelpers';
import { fetchFriends } from './FriendsPage';
import { haversine } from '../helpers/locationUtils';
import EmojiModal from '../modals/EmojiModal';
import { emojiCategories } from '../modals/EmojiModal';

const CustomMarker = ({ type, timestamp, user, emoji }) => {
    const markerConfig = {
        normal: {
            color: '#2C3E50',
            icon: emoji || '📍',
            size: 32,
            isEmoji: true
        },
        live: {
            color: '#4CAF50',
            icon: 'radio-button-on',
            size: 24,
            isEmoji: false
        },
        shared: {
            color: '#2196F3',
            icon: emoji || '📍',
            size: 32,
            isEmoji: true
        },
        selected: {
            color: '#FFC107',
            icon: 'checkbox',
            size: 24,
            isEmoji: false
        }
    };

    const config = markerConfig[type] || markerConfig.normal;

    // Tarih formatını düzenleyen yardımcı fonksiyon
    const formatDate = (timestamp) => {
        if (!timestamp) return '';

        const date = new Date(timestamp);
        const now = new Date();
        const diffTime = Math.abs(now - date);
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

        // Bugün için
        if (diffDays === 0) {
            if (diffTime < 1000 * 60 * 60) { // 1 saatten az
                const minutes = Math.floor(diffTime / (1000 * 60));
                return `${minutes} dakika önce`;
            }
            return 'Bugün ' + date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
        }

        // Dün için
        if (diffDays === 1) {
            return 'Dün ' + date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
        }

        // 7 günden az ise
        if (diffDays < 7) {
            return `${diffDays} gün önce`;
        }

        // Diğer durumlar için
        return date.toLocaleDateString('tr-TR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    };

    return (
        <View style={styles.markerContainer}>
            {config.isEmoji ? (
                <Text style={[styles.markerEmoji, { fontSize: config.size }]}>
                    {config.icon}
                </Text>
            ) : (
                <View style={styles.markerIconContainer}>
                    <Ionicons
                        name={config.icon}
                        size={config.size}
                        color={config.color}
                    />
                </View>
            )}

            {(timestamp || user) && (
                <View style={styles.markerLabel}>
                    {user && (
                        <Text style={[styles.markerUsername, { color: config.color }]}>
                            {user}
                        </Text>
                    )}
                    {timestamp && (
                        <View style={styles.timeContainer}>
                            <Ionicons
                                name="time-outline"
                                size={12}
                                color="#666666"
                                style={styles.timeIcon}
                            />
                            <Text style={styles.markerTimestamp}>
                                {formatDate(timestamp)}
                            </Text>
                        </View>
                    )}
                </View>
            )}
        </View>
    );
};

const SelectionModeBar = ({ selectionMode, selectedCount, onToggleMode, onShare, onClear }) => {
    return (
        <View style={styles.selectionModeContainer}>
            {selectionMode ? (
                <View style={styles.selectionModeActiveBar}>
                    <View style={styles.selectionModeInfo}>
                        <Text style={styles.selectedCountText}>
                            {selectedCount} konum seçildi
                        </Text>
                    </View>
                    <View style={styles.selectionModeActions}>
                        {selectedCount > 0 && (
                            <>
                                <TouchableOpacity
                                    style={styles.actionButton}
                                    onPress={onClear}
                                >
                                    <Ionicons name="trash-outline" size={22} color="#FF5252" />
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={styles.actionButton}
                                    onPress={onShare}
                                >
                                    <Ionicons name="share-social" size={22} color="#4CAF50" />
                                </TouchableOpacity>
                            </>
                        )}
                        <TouchableOpacity
                            style={styles.exitSelectionButton}
                            onPress={onToggleMode}
                        >
                            <Text style={styles.exitSelectionText}>Çıkış</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            ) : (
                <TouchableOpacity
                    style={styles.selectionModeButton}
                    onPress={onToggleMode}
                >
                    <Ionicons name="checkbox-outline" size={24} color="#4CAF50" />
                    <Text style={styles.selectionModeButtonText}>Konum Seç</Text>
                </TouchableOpacity>
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
    const [friendPickerVisible, setFriendPickerVisible] = useState(false);
    const [friends, setFriends] = useState([]);
    const mapRef = useRef(null);
    const [liveLocations, setLiveLocations] = useState([]);
    const [liveLocationsUnsubscribe, setLiveLocationsUnsubscribe] = useState(null);
    const [sharedLocationsUnsubscribe, setSharedLocationsUnsubscribe] = useState(null);
    const [activeShares, setActiveShares] = useState([]);
    const [sharedWithMe, setSharedWithMe] = useState([]);
    const [locations, setLocations] = useState({
        active: {},
        shared: {}
    });
    const [emojiPickerVisible, setEmojiPickerVisible] = useState(false);
    const [selectedMarkerIcon, setSelectedMarkerIcon] = useState('pin');
    const [selectedMarkerId, setSelectedMarkerId] = useState(null);

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
        }
    }, [userId]);

    // Paylaşımları dinlemek için ayrı bir useEffect
    useEffect(() => {
        if (!userId) return;

        // Paylaşımları dinle
        const unsubscribe = listenToShares(userId, (type, locations) => {
            if (type === 'active') {
                setActiveShares(locations);
            } else if (type === 'shared') {
                setSharedWithMe(locations);
            }
        });

        // Canlı konumları dinle
        const unsubscribeLive = trackLiveLocations(userId, (locations) => {
            if (Array.isArray(locations)) {
                setLiveLocations(locations);
            }
        });

        return () => {
            if (unsubscribe) unsubscribe();
            if (unsubscribeLive) unsubscribeLive();
        };
    }, [userId]);

    // Konumları filtrelemek için useEffect
    useEffect(() => {
        const filterLocations = () => {
            // Canlı konumları filtrele
            const filteredLive = liveLocations.filter(location => {
                const hasActiveShare = activeShares.some(share =>
                    share.friendId === location.sharedBy &&
                    share.type === 'live'
                );
                return hasActiveShare;
            });

            // Paylaşılan konumları filtrele
            const filteredShared = sharedLocations.filter(location => {
                const hasActiveShare = activeShares.some(share =>
                    share.friendId === location.sharedBy &&
                    share.type === 'current'
                );
                return hasActiveShare;
            });

            setLocations({
                active: filteredLive.map(loc => ({
                    ...loc,
                    type: 'live'
                })),
                shared: filteredShared.map(loc => ({
                    ...loc,
                    type: 'shared'
                }))
            });
        };

        filterLocations();
    }, [activeShares, liveLocations, sharedLocations]);

    const handleMarkerPress = (location) => {
        if (selectionMode) {
            // Seçim modu aktifse mevcut seçim işlemlerini yap
            const isSelected = selectedLocations.some(loc =>
                loc.enlem === location.enlem &&
                loc.boylam === location.boylam
            );

            if (isSelected) {
                setSelectedLocations(prev =>
                    prev.filter(loc =>
                        loc.enlem !== location.enlem ||
                        loc.boylam !== location.boylam
                    )
                );
            } else {
                setSelectedLocations(prev => [...prev, location]);
            }
        } else {
            // Seçim modu aktif değilse etiket göster/gizle
            setSelectedMarkerId(prev => prev === location.id ? null : location.id);
        }
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

    useEffect(() => {
        if (!userId) return;

        // Paylaşılan konumları dinle
        const unsubscribe = listenToSharedLocations(userId, (type, locations) => {
            if (type === 'live') {
                setLiveLocations(locations);
            } else {
                setSharedLocations(locations);
            }
        });

        return () => {
            if (unsubscribe) unsubscribe();
        };
    }, [userId]);

    const getEmojiForMarker = (markerId) => {
        const selectedEmoji = emojiCategories
            .flatMap(category => category.emojis)
            .find(emoji => emoji.id === selectedMarkerIcon);
        return selectedEmoji ? selectedEmoji.emoji : '📍';
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
                        key={`cluster-${index}`}
                        coordinate={{
                            latitude: parseFloat(loc.enlem),
                            longitude: parseFloat(loc.boylam)
                        }}
                        onPress={() => handleMarkerPress(loc)}
                    >
                        <CustomMarker
                            type={selectedLocations.some(
                                selected =>
                                    selected.enlem === loc.enlem &&
                                    selected.boylam === loc.boylam
                            ) ? 'selected' : 'normal'}
                            timestamp={selectedMarkerId === loc.id ? loc.timestamp : null}
                            emoji={getEmojiForMarker(loc.id)}
                        />
                    </Marker>
                ))}

                {locations.active.map((loc) => (
                    <Marker
                        key={`live-${loc.sharedBy}-${loc.timestamp}`}
                        coordinate={{
                            latitude: loc.latitude,
                            longitude: loc.longitude
                        }}
                        onPress={() => handleMarkerPress(loc)}
                    >
                        <CustomMarker
                            type="live"
                            timestamp={selectedMarkerId === loc.id ? loc.timestamp : null}
                            user={selectedMarkerId === loc.id ? loc.sharedBy : null}
                            emoji={getEmojiForMarker(loc.id)}
                        />
                    </Marker>
                ))}

                {locations.shared.map((loc) => (
                    <Marker
                        key={`shared-${loc.sharedBy}-${loc.timestamp}`}
                        coordinate={{
                            latitude: loc.latitude,
                            longitude: loc.longitude
                        }}
                        onPress={() => handleMarkerPress(loc)}
                    >
                        <CustomMarker
                            type="shared"
                            timestamp={selectedMarkerId === loc.id ? loc.timestamp : null}
                            user={selectedMarkerId === loc.id ? loc.sharedBy : null}
                            emoji={getEmojiForMarker(loc.id)}
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
                            type="live"
                            timestamp={selectedMarkerId === liveLocation.id ? liveLocation.timestamp : null}
                            user={selectedMarkerId === liveLocation.id ? liveLocation.sharedBy : null}
                            emoji={getEmojiForMarker(liveLocation.id)}
                        />
                    </Marker>
                )}
            </MapView>

            {selectionMode && (
                <View style={styles.selectionModeOverlay}>
                    <Text style={styles.selectionModeText}>
                        Rota seçmek için işaretçilere tıklayın
                    </Text>
                </View>
            )}

            <View style={styles.mapControls}>
                <TouchableOpacity
                    style={styles.controlButton}
                    onPress={() => setPickerVisible(!pickerVisible)}
                >
                    <Ionicons name="layers-outline" size={24} color="#333" />
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.controlButton}
                    onPress={handleMyLocation}
                >
                    <Ionicons name="locate" size={24} color="#333" />
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.controlButton, styles.emojiControlButton]}
                    onPress={() => setEmojiPickerVisible(true)}
                >
                    <Text style={styles.selectedEmoji}>
                        {emojiCategories
                            .flatMap(category => category.emojis)
                            .find(emoji => emoji.id === selectedMarkerIcon)?.emoji || '📍'}
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[
                        styles.controlButton,
                        { backgroundColor: selectionMode ? '#E8F5E9' : '#fff' }
                    ]}
                    onPress={() => setSelectionMode(!selectionMode)}
                >
                    <Ionicons
                        name={selectionMode ? "checkbox" : "checkbox-outline"}
                        size={24}
                        color={selectionMode ? "#4CAF50" : "#333"}
                    />
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

            {selectionMode && (
                <View style={styles.selectionModeContainer}>
                    <View style={styles.selectionModeActiveBar}>
                        <View style={styles.selectionModeInfo}>
                            <Text style={styles.selectedCountText}>
                                {selectedLocations.length} konum seçildi
                            </Text>
                        </View>
                        <View style={styles.selectionModeActions}>
                            {selectedLocations.length > 0 && (
                                <>
                                    <TouchableOpacity
                                        style={styles.actionButton}
                                        onPress={() => setSelectedLocations([])}
                                    >
                                        <Ionicons name="trash-outline" size={22} color="#FF5252" />
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={styles.actionButton}
                                        onPress={() => setFriendPickerVisible(true)}
                                    >
                                        <Ionicons name="share-social" size={22} color="#4CAF50" />
                                    </TouchableOpacity>
                                </>
                            )}
                        </View>
                    </View>
                </View>
            )}

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

            <Modal
                visible={emojiPickerVisible}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setEmojiPickerVisible(false)}
            >
                <EmojiModal
                    currentEmoji={selectedMarkerIcon}
                    onSelectEmoji={(emoji) => {
                        setSelectedMarkerIcon(emoji.id);
                        setEmojiPickerVisible(false);
                    }}
                    onClose={() => setEmojiPickerVisible(false)}
                />
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
        alignItems: 'center',
        gap: 10,
    },
    controlButton: {
        backgroundColor: '#fff',
        padding: 12,
        borderRadius: 30,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
        alignItems: 'center',
        justifyContent: 'center',
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
    selectionModeContainer: {
        position: 'absolute',
        bottom: 20,
        left: 16,
        right: 16,
    },
    selectionModeButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        padding: 12,
        borderRadius: 25,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
        elevation: 5,
    },
    selectionModeButtonText: {
        marginLeft: 8,
        fontSize: 16,
        color: '#4CAF50',
        fontWeight: '600',
    },
    selectionModeActiveBar: {
        flexDirection: 'row',
        backgroundColor: '#FFFFFF',
        borderRadius: 25,
        padding: 12,
        alignItems: 'center',
        justifyContent: 'space-between',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
        elevation: 5,
    },
    selectionModeInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    selectedCountText: {
        fontSize: 15,
        color: '#333',
        fontWeight: '600',
    },
    selectionModeActions: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    actionButton: {
        padding: 8,
        marginHorizontal: 4,
    },
    exitSelectionButton: {
        backgroundColor: '#F5F5F5',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        marginLeft: 8,
    },
    exitSelectionText: {
        color: '#333',
        fontWeight: '600',
        fontSize: 14,
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
        width: 'auto',
    },
    markerEmoji: {
        textAlign: 'center',
        textShadowColor: 'rgba(0, 0, 0, 0.3)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 1,
    },
    markerIconContainer: {
        padding: 8,
        borderRadius: 12,
        backgroundColor: '#FFFFFF',
        borderWidth: 1.5,
        borderColor: '#E0E0E0',
        alignItems: 'center',
        justifyContent: 'center',
    },
    markerLabel: {
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 8,
        paddingVertical: 6,
        borderRadius: 8,
        marginTop: 4,
        borderWidth: 1,
        borderColor: '#E0E0E0',
        minWidth: 100,
        alignItems: 'center',
    },
    timeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 2,
        paddingTop: 2,
        borderTopWidth: 1,
        borderTopColor: '#F0F0F0',
    },
    timeIcon: {
        marginRight: 4,
    },
    markerUsername: {
        fontSize: 13,
        fontWeight: '600',
        textAlign: 'center',
        marginBottom: 2,
    },
    markerTimestamp: {
        fontSize: 11,
        color: '#666666',
    },
    selectionModeOverlay: {
        position: 'absolute',
        top: 100,
        left: 16,
        right: 16,
        backgroundColor: 'rgba(76, 175, 80, 0.9)',
        padding: 12,
        borderRadius: 25,
        zIndex: 1,
        alignItems: 'center',
    },
    selectionModeText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '600',
    },
    emojiControlButton: {
        padding: 8,
    },
    selectedEmoji: {
        fontSize: 24,
    },
});

export default MapPage;