import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, Alert, SafeAreaView, Platform, Modal, Image, Pressable } from 'react-native';
import MapView, { Polyline, Marker, Callout } from 'react-native-maps';
import * as Location from 'expo-location';
import {
    collection,
    addDoc,
    onSnapshot,
    getDoc,
    updateDoc,
    serverTimestamp,
    query,
    getDocs,
    where,
    doc as firestoreDoc
} from 'firebase/firestore';
import { onAuthStateChanged, getAuth } from 'firebase/auth';
import { db } from '../../firebaseConfig';
import { Ionicons } from '@expo/vector-icons';
import { fetchFriends } from './FriendsPage';
import { haversine } from '../helpers/locationUtils';
import {
    shouldCollectPoint,
    GPS_ACCURACY,
    MOVEMENT_CONSTANTS,
    isGPSStable,
    evaluateGPSQuality,
    isGPSUsable,
    isStationary,
    calculateBearing
} from '../helpers/pathTracking';
import { getPlaceFromCoordinates } from '../helpers/locationHelpers';
import FastImage from 'react-native-fast-image';
import { startBackgroundLocationUpdates, stopBackgroundLocationUpdates } from '../services/LocationBackgroundService';
import { ref, set, remove, get, onValue, off } from 'firebase/database';
import { rtdb } from '../../firebaseConfig';

// Yol renk ve stilleri
const PATH_STYLES = {
    colors: {
        newPath: '#FFD700', // Daha parlak bir sarı
        discovered: '#4CAF50',
        undiscovered: '#808080'
    },
    width: 6 // Direkt kalınlık değeri
};

const CustomMarker = ({ photo, name }) => {
    return (
        <View>
            <View style={styles.markerContainer}>
                {photo ? (
                    <FastImage
                        source={{
                            uri: photo,
                            priority: FastImage.priority.normal,
                            cache: FastImage.cacheControl.immutable
                        }}
                        style={styles.markerImage}
                        resizeMode={FastImage.resizeMode.cover}
                    />
                ) : (
                    <View style={styles.markerDefault}>
                        <Text style={styles.markerInitial}>
                            {name?.charAt(0) || '?'}
                        </Text>
                    </View>
                )}
            </View>
            {/* Üçgen işaretçi */}
            <View style={styles.markerTriangle} />
        </View>
    );
};

const MapPage = ({ navigation, route }) => {
    const [MapType, setMapType] = useState('standard');
    const [location, setLocation] = useState(null);
    const [userId, setUserId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [sharedLocations, setSharedLocations] = useState([]);
    const [receivedLocations, setReceivedLocations] = useState([]);
    const [receivedInstantLocations, setReceivedInstantLocations] = useState([]);
    const [friendPickerVisible, setFriendPickerVisible] = useState(false);
    const [friends, setFriends] = useState([]);
    const mapRef = useRef(null);
    const [liveLocations, setLiveLocations] = useState([]);
    const [activeShares, setActiveShares] = useState([]);
    const [sharedWithMe, setSharedWithMe] = useState([]);
    const [locations, setLocations] = useState({
        active: {},
        shared: {}
    });
    const [pathCoordinates, setPathCoordinates] = useState([]);
    const [currentPath, setCurrentPath] = useState({
        points: [],
        startTime: null
    });
    const [savedPaths, setSavedPaths] = useState([]);
    const [selectedPath, setSelectedPath] = useState(null);
    const [showBottomSheet, setShowBottomSheet] = useState(false);
    const [is3DMode, setIs3DMode] = useState(false);
    const [showMapTypeMenu, setShowMapTypeMenu] = useState(false);
    const [currentSpeed, setCurrentSpeed] = useState(0);
    const [followsUserLocation, setFollowsUserLocation] = useState(false);
    const [showPathDetails, setShowPathDetails] = useState(false);
    const [accuracyHistory, setAccuracyHistory] = useState([]);
    const [isGPSCalibrated, setIsGPSCalibrated] = useState(false);
    const [gpsQuality, setGpsQuality] = useState('POOR');
    const [calibrationStartTime, setCalibrationStartTime] = useState(null);
    const [isMoving, setIsMoving] = useState(true);
    const [lastLocations, setLastLocations] = useState([]);
    const [locationSubscription, setLocationSubscription] = useState(null);
    const [selectedMarker, setSelectedMarker] = useState(null);
    const [selectedLocation, setSelectedLocation] = useState(null);
    const [modalVisible, setModalVisible] = useState(false);
    const [activeLocationShares, setActiveLocationShares] = useState({});

    useEffect(() => {
        let locationSubscription;
        const auth = getAuth();

        const startLocationTracking = async (currentUserId) => {
            try {
                const { status } = await Location.requestForegroundPermissionsAsync();
                if (status !== 'granted') {
                    Alert.alert('Hata', 'Konum izni gerekli');
                    setLoading(false);
                    return;
                }

                // Kalibrasyon başlangıç zamanını ayarla
                setCalibrationStartTime(Date.now());
                setFollowsUserLocation(false); // Başlangıçta false olarak ayarlayalım

                const initialLocation = await Location.getCurrentPositionAsync({});
                setLocation(initialLocation);
                setLoading(false);

                const subscription = await Location.watchPositionAsync(
                    {
                        accuracy: Location.Accuracy.High,
                        timeInterval: MOVEMENT_CONSTANTS.MOVEMENT_CHECK_INTERVAL,
                        distanceInterval: 10,
                    },
                    (newLocation) => {
                        setLocation(newLocation);

                        // Sadece followsUserLocation true ise konumu takip et
                        if (followsUserLocation && mapRef.current) {
                            mapRef.current.animateToRegion({
                                latitude: newLocation.coords.latitude,
                                longitude: newLocation.coords.longitude,
                                latitudeDelta: 0.005,
                                longitudeDelta: 0.005,
                            }, 1000);
                        }

                        // GPS kalibrasyonu ve diğer işlemler followsUserLocation'dan bağımsız devam etsin
                        setLastLocations(prev => {
                            const newLocations = [...prev, {
                                latitude: newLocation.coords.latitude,
                                longitude: newLocation.coords.longitude,
                                timestamp: new Date()
                            }].slice(-MOVEMENT_CONSTANTS.STATIONARY_CHECK_COUNT);
                            return newLocations;
                        });

                        setAccuracyHistory(prev => {
                            const newHistory = [...prev, newLocation.coords.accuracy];
                            return newHistory.slice(-GPS_ACCURACY.SAMPLE_SIZE);
                        });

                        const quality = evaluateGPSQuality(newLocation.coords.accuracy);
                        setGpsQuality(quality);

                        // GPS kalibrasyonunu followsUserLocation'dan bağımsız yap
                        if (!isGPSCalibrated) {
                            const timeSinceStart = Date.now() - calibrationStartTime;
                            const stable = isGPSStable(accuracyHistory);

                            if (timeSinceStart >= GPS_ACCURACY.CALIBRATION_TIME && stable) {
                                setIsGPSCalibrated(true);
                            }
                        }

                        // Hareket durumunu kontrol et
                        const speedMs = newLocation.coords.speed || 0;
                        const stationary = isStationary(speedMs, lastLocations);

                        if (stationary !== !isMoving) {
                            setIsMoving(!stationary);
                        }

                        // Diğer işlemler sadece hareket halindeyken yapılsın
                        if (!stationary) {
                            // Hız hesaplamaları...
                            let speedKmh = 0;
                            if (newLocation.coords.speed != null && newLocation.coords.speed >= 0) {
                                speedKmh = Math.round(newLocation.coords.speed * 3.6);
                                if (speedKmh < 3) speedKmh = 0;
                            }
                            setCurrentSpeed(speedKmh);

                            // Konum takibi ve yol çizimi
                            if (isGPSCalibrated && currentUserId) {
                                trackUserLocation(newLocation, currentUserId);
                            }
                        }
                    }
                );

                setLocationSubscription(subscription);
            } catch (error) {
                console.error('Konum takibi başlatılamadı:', error);
                setLoading(false);
            }
        };

        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                setUserId(user.uid);
                await startLocationTracking(user.uid);
            } else {
                setUserId(null);
                setLoading(false);
            }
        });

        return () => {
            unsubscribe();
            if (locationSubscription) {
                locationSubscription.remove();
            }
        };
    }, [followsUserLocation]);

    useEffect(() => {
        if (!userId) return;

        const pathsRef = collection(db, `users/${userId}/paths`);
        const unsubscribe = onSnapshot(pathsRef, (snapshot) => {
            const paths = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setSavedPaths(paths);
        });

        return () => unsubscribe();
    }, [userId]);

    // Konum dinleme useEffect'i
    useEffect(() => {
        if (!userId) return;

        // 1. Firestore'dan gelen paylaşımları dinle
        const receivedSharesRef = collection(db, `users/${userId}/receivedShares`);
        const activeSharesQuery = query(receivedSharesRef, where('status', '==', 'active'));

        const unsubscribe = onSnapshot(activeSharesQuery, async (snapshot) => {
            try {
                const shares = await Promise.all(
                    snapshot.docs.map(async (doc) => {
                        const shareData = doc.data();

                        // Paylaşan kullanıcının bilgilerini al
                        const senderDoc = await getDoc(firestoreDoc(db, 'users', shareData.fromUserId));
                        const senderData = senderDoc.data();

                        // Anlık konum paylaşımları için konum bilgisini doğrudan Firestore'dan al
                        let locationData = null;
                        if (shareData.type === 'instant' && shareData.location) {
                            // Eğer konum bilgisi doğrudan paylaşımda varsa kullan
                            locationData = shareData.location;
                        }

                        return {
                            id: doc.id,
                            shareId: shareData.shareId || doc.id,
                            type: shareData.type,
                            senderId: shareData.fromUserId,
                            senderName: shareData.senderName || senderData?.informations?.name || 'İsimsiz',
                            senderUsername: shareData.senderUsername || senderData?.informations?.username,
                            senderPhoto: shareData.senderPhoto || senderData?.profilePicture,
                            startTime: shareData.startTime,
                            lastUpdate: shareData.lastUpdate,
                            status: shareData.status,
                            locationInfo: shareData.locationInfo,
                            // Anlık konum için konum bilgisini ekle
                            location: locationData || (shareData.type === 'instant' ? {
                                latitude: shareData.latitude,
                                longitude: shareData.longitude
                            } : null)
                        };
                    })
                );

                // Anlık ve canlı konumları ayır
                const instantLocations = shares.filter(share =>
                    share.type === 'instant' && share.location
                );
                const liveLocations = shares.filter(share => share.type === 'live');

                // Anlık konumları doğrudan set et
                setReceivedInstantLocations(instantLocations);

                // Canlı konumlar için RTDB dinleyicilerini ayarla
                liveLocations.forEach(share => {
                    const locationRef = ref(rtdb, `locations/${share.shareId}`);
                    onValue(locationRef, (snapshot) => {
                        const locationData = snapshot.val();
                        if (locationData) {
                            setReceivedLocations(prev => {
                                const filtered = prev.filter(loc => loc.id !== share.id);
                                return [...filtered, { ...share, location: locationData }];
                            });
                        }
                    });
                });

                // Canlı konumları başlangıç değerleriyle set et
                setReceivedLocations(liveLocations);

            } catch (error) {
                console.error('Paylaşımları dinlerken hata:', error);
            }
        });

        return () => {
            unsubscribe();
            // RTDB dinleyicilerini temizle
            receivedLocations.forEach(share => {
                const locationRef = ref(rtdb, `locations/${share.shareId}`);
                off(locationRef);
            });
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

    const handleMyLocation = () => {
        if (location?.coords) {
            mapRef.current?.animateToRegion({
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
            }, 1000);
            setFollowsUserLocation(true);
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

    const savePath = useCallback(async (points, currentUserId) => {
        if (!currentUserId || points.length < 2) return;

        try {
            // Yolun başlangıç noktasından şehir bilgisini al
            const startPoint = points[0];
            const locationInfo = await getPlaceFromCoordinates(
                startPoint.latitude,
                startPoint.longitude
            );

            const pathRef = collection(db, `users/${currentUserId}/paths`);
            await addDoc(pathRef, {
                points: points.map(point => ({
                    latitude: point.latitude,
                    longitude: point.longitude,
                    timestamp: point.timestamp
                })),
                firstDiscovery: new Date(),
                visitCount: 1,
                type: 'discovered',
                city: locationInfo.city || 'Bilinmeyen',
                district: locationInfo.district || 'Bilinmeyen'
            });

        } catch (error) {
            console.error('Yol kaydedilirken hata:', error);
            // Hata durumunda bile kaydı yapalım ama şehir bilgisi olmadan
            const pathRef = collection(db, `users/${currentUserId}/paths`);
            await addDoc(pathRef, {
                points: points.map(point => ({
                    latitude: point.latitude,
                    longitude: point.longitude,
                    timestamp: point.timestamp
                })),
                firstDiscovery: new Date(),
                visitCount: 1,
                type: 'discovered',
                city: 'Bilinmeyen',
                district: 'Bilinmeyen'
            });
        }
    }, []);

    const trackUserLocation = useCallback(async (newLocation, currentUserId) => {
        if (!currentUserId) return;

        // GPS kullanılabilirlik kontrolü
        if (!isGPSUsable(newLocation.coords.accuracy, accuracyHistory)) {
            return;
        }

        // Yeni noktayı toplamak gerekiyor mu kontrol et
        const lastLocation = pathCoordinates.length > 0 ? pathCoordinates[pathCoordinates.length - 1] : null;

        // shouldCollectPoint kontrolü
        if (!shouldCollectPoint(newLocation, lastLocation)) {
            return;
        }

        // Yeni nokta için bearing hesapla
        let bearing = null;
        if (lastLocation) {
            bearing = calculateBearing(
                lastLocation.latitude,
                lastLocation.longitude,
                newLocation.coords.latitude,
                newLocation.coords.longitude
            );
        }

        const newPoint = {
            latitude: newLocation.coords.latitude,
            longitude: newLocation.coords.longitude,
            timestamp: new Date(),
            accuracy: newLocation.coords.accuracy,
            quality: gpsQuality,
            bearing: bearing,
            speed: newLocation.coords.speed || 0
        };

        // Son nokta ile yeni nokta arasındaki mesafeyi kontrol et
        setPathCoordinates(prev => {
            const lastPoint = prev[prev.length - 1];
            if (lastPoint) {
                // İki nokta arası mesafeyi metre cinsinden hesapla
                const distance = haversine(
                    lastPoint.latitude,
                    lastPoint.longitude,
                    newPoint.latitude,
                    newPoint.longitude
                );

                // Eğer mesafe 100 metreden fazlaysa yeni bir path başlat
                if (distance > 100) {
                    return [newPoint]; // Yeni bir dizi başlat
                }
            }
            return [...prev, newPoint];
        });

        setCurrentPath(prev => {
            const lastPoint = prev.points[prev.points.length - 1];
            if (lastPoint) {
                const distance = haversine(
                    lastPoint.latitude,
                    lastPoint.longitude,
                    newPoint.latitude,
                    newPoint.longitude
                );

                if (distance > 100) {
                    if (prev.points.length >= 2) {
                        savePath(prev.points, currentUserId);
                    }
                    return {
                        points: [newPoint],
                        startTime: new Date()
                    };
                }
            }

            const updatedPoints = [...prev.points, newPoint];
            if (!prev.startTime) {
                return {
                    points: updatedPoints,
                    startTime: new Date()
                };
            }

            const timeSinceStart = new Date() - prev.startTime;

            if (timeSinceStart > 5 * 60 * 1000 || updatedPoints.length >= 20) {
                savePath(updatedPoints, currentUserId);
                return {
                    points: [newPoint],
                    startTime: new Date()
                };
            }

            return {
                ...prev,
                points: updatedPoints
            };
        });
    }, [savePath, pathCoordinates, gpsQuality, accuracyHistory]);

    const toggle3DMode = () => {
        setIs3DMode(!is3DMode);
        if (mapRef.current) {
            mapRef.current.animateCamera({
                pitch: is3DMode ? 0 : 35,
                heading: is3DMode ? 0 : 30,
                duration: 1000
            });
        }
    };

    const mapTypes = [
        { id: 'standard', name: 'Standart', icon: 'map-outline' },
        { id: 'satellite', name: 'Uydu', icon: 'earth' },
        { id: 'hybrid', name: 'Hibrit', icon: 'globe-outline' },
        { id: 'terrain', name: 'Arazi', icon: 'layers-outline' }
    ];

    // Harita etkileşimlerini dinleyen fonksiyon
    const handleMapInteraction = () => {
        if (followsUserLocation) {
            setFollowsUserLocation(false);
        }
    };

    const handlePathPress = (path) => {
        setSelectedPath(path);
        setShowPathDetails(true);
    };

    const closePathDetails = () => {
        setShowPathDetails(false);
        setSelectedPath(null);
    };

    const handleMarkerPress = (location) => {
        setSelectedLocation(location);
        setModalVisible(true);
    };

    const closeModal = () => {
        setModalVisible(false);
        setSelectedLocation(null);
    };

    useEffect(() => {
        const shareData = route?.params?.shareData;
        const initialRegion = route?.params?.initialRegion;

        if (shareData && initialRegion) {
            // Haritayı paylaşılan konuma odakla
            mapRef.current?.animateToRegion(initialRegion, 1000);

            // Paylaşım türüne göre marker göster
            if (shareData.type === 'received') {
                setSelectedLocation({
                    ...shareData.location,
                    title: `${shareData.senderName}'in Konumu`,
                    description: shareData.type === 'live' ? 'Canlı Konum' : 'Anlık Konum'
                });
            }
        }
    }, [route?.params]);

    // Canlı konum paylaşımını başlat
    const startLiveLocationShare = async (friendId) => {
        try {
            // 1. Firestore'da paylaşım kaydı oluştur (locationShares yerine users/{userId}/shares)
            const shareRef = await addDoc(collection(db, `users/${userId}/shares`), {
                type: 'live',
                friendId: friendId,
                status: 'active',
                startTime: serverTimestamp(),
                lastUpdate: serverTimestamp()
            });

            // 2. Karşı tarafa paylaşımı ekle
            await addDoc(collection(db, `users/${friendId}/receivedShares`), {
                type: 'live',
                fromUserId: userId,
                status: 'active',
                startTime: serverTimestamp(),
                lastUpdate: serverTimestamp()
            });

            // 3. RTDB'de başlangıç konumu oluştur
            const locationRef = ref(rtdb, `locations/${shareRef.id}`);
            await set(locationRef, {
                latitude: location?.coords?.latitude,
                longitude: location?.coords?.longitude,
                accuracy: location?.coords?.accuracy,
                heading: location?.coords?.heading,
                speed: location?.coords?.speed,
                timestamp: serverTimestamp()
            });

            // 4. Arka plan konum takibini başlat
            const started = await startBackgroundLocationUpdates(userId);
            if (!started) {
                throw new Error('Arka plan konum takibi başlatılamadı');
            }

            setActiveLocationShares(prev => ({
                ...prev,
                [shareRef.id]: { friendId, type: 'live' }
            }));

            Alert.alert('Başarılı', 'Canlı konum paylaşımı başlatıldı');
        } catch (error) {
            console.error('Konum paylaşımı hatası:', error);
            Alert.alert('Hata', 'Konum paylaşımı başlatılamadı');
        }
    };

    // Konum paylaşımını durdur
    const stopLiveLocationShare = async (shareId) => {
        try {
            // 1. Firestore'da paylaşımı yapan kullanıcının shares koleksiyonunu güncelle
            await updateDoc(firestoreDoc(db, `users/${userId}/shares/${shareId}`), {
                status: 'ended',
                endTime: serverTimestamp()
            });

            // 2. Karşı tarafın receivedShares koleksiyonunu güncelle
            const friendId = activeLocationShares[shareId].friendId;
            const receivedSharesQuery = query(
                collection(db, `users/${friendId}/receivedShares`),
                where('fromUserId', '==', userId),
                where('status', '==', 'active')
            );
            const querySnapshot = await getDocs(receivedSharesQuery);
            querySnapshot.forEach(async (doc) => {
                await updateDoc(doc.ref, {
                    status: 'ended',
                    endTime: serverTimestamp()
                });
            });

            // 3. RTDB'den konum verilerini temizle
            const locationRef = ref(rtdb, `locations/${shareId}`);
            await remove(locationRef);

            // 4. Aktif paylaşımları güncelle
            setActiveLocationShares(prev => {
                const newShares = { ...prev };
                delete newShares[shareId];
                return newShares;
            });

            // 5. Eğer başka aktif paylaşım yoksa arka plan takibi durdur
            if (Object.keys(activeLocationShares).length === 0) {
                await stopBackgroundLocationUpdates();
            }

            Alert.alert('Başarılı', 'Konum paylaşımı durduruldu');
        } catch (error) {
            console.error('Konum paylaşımı durdurma hatası:', error);
            Alert.alert('Hata', 'Konum paylaşımı durdurulamadı');
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
                ref={mapRef}
                style={styles.map}
                mapType={MapType}
                showsUserLocation={true}
                followsUserLocation={followsUserLocation}
                onPanDrag={handleMapInteraction}
                onPinchEnd={handleMapInteraction}
                onRotateEnd={handleMapInteraction}
                initialRegion={{
                    latitude: location?.coords?.latitude || 37.78825,
                    longitude: location?.coords?.longitude || -122.4324,
                    latitudeDelta: 0.005,
                    longitudeDelta: 0.005,
                }}
                zoomControlEnabled={false}
                mapToolbarEnabled={false}
                showsMyLocationButton={false}
                zoomEnabled={true}
                rotateEnabled={true}
                scrollEnabled={true}
                pitchEnabled={true}
            >
                {/* Tüm konumlar için tek tip marker */}
                {[...receivedInstantLocations, ...receivedLocations]
                    .filter(share => {
                        // Konum bilgilerini kontrol et
                        if (share.location) {
                            return typeof share.location.latitude === 'number' &&
                                typeof share.location.longitude === 'number';
                        } else if (share.latitude && share.longitude) {
                            // Alternatif konum formatı
                            return typeof share.latitude === 'number' &&
                                typeof share.longitude === 'number';
                        }
                        return false;
                    })
                    .map((share) => {
                        // Konum koordinatlarını belirle
                        const coordinate = share.location ?
                            { latitude: share.location.latitude, longitude: share.location.longitude } :
                            { latitude: share.latitude, longitude: share.longitude };

                        return (
                            <Marker
                                key={share.id}
                                coordinate={coordinate}
                                onPress={() => handleMarkerPress(share)}
                            >
                                <CustomMarker
                                    photo={share.senderPhoto}
                                    name={share.senderName}
                                />
                            </Marker>
                        );
                    })
                }

                {/* Kaydedilmiş yollar */}
                {savedPaths.map((path, index) => (
                    <Polyline
                        key={index}
                        coordinates={path.points}
                        strokeColor={selectedPath && selectedPath.id === path.id
                            ? '#FFA726'
                            : PATH_STYLES.colors.discovered}
                        strokeWidth={PATH_STYLES.width}
                        lineCap="round"
                        geodesic={true}
                        tappable={true}
                        onPress={() => handlePathPress(path)}
                    />
                ))}

                {/* Aktif yol çizgisi */}
                <Polyline
                    coordinates={pathCoordinates}
                    strokeColor={PATH_STYLES.colors.newPath}
                    strokeWidth={PATH_STYLES.width}
                    lineCap="round"
                    geodesic={true}
                />
            </MapView>

            <View style={styles.statusBar}>
                {/* Hız Göstergesi */}
                <View style={styles.statusItem}>
                    <Ionicons name="speedometer-outline" size={20} color="#FFFFFF" />
                    <Text style={styles.speedValue}>{currentSpeed}</Text>
                    <Text style={styles.speedUnit}>km/sa</Text>
                </View>

                {/* GPS Durumu */}
                <View style={styles.statusItem}>
                    <Ionicons
                        name={gpsQuality === 'OPTIMAL' ? 'location' :
                            gpsQuality === 'GOOD' ? 'location-outline' : 'warning-outline'}
                        size={20}
                        color={gpsQuality === 'OPTIMAL' ? '#4CAF50' :
                            gpsQuality === 'GOOD' ? '#2196F3' : '#FFA000'}
                    />
                    {!isGPSCalibrated ? (
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <ActivityIndicator size="small" color="#FFFFFF" style={{ marginRight: 6 }} />
                            <Text style={styles.statusText}>Kalibrasyon</Text>
                        </View>
                    ) : (
                        <Text style={styles.statusText}>
                            {gpsQuality === 'OPTIMAL' ? 'Mükemmel' :
                                gpsQuality === 'GOOD' ? 'İyi' :
                                    gpsQuality === 'FAIR' ? 'Orta' : 'Zayıf'}
                        </Text>
                    )}
                </View>

                {/* Hareket Durumu */}
                <View style={[styles.statusItem, styles.statusItemLast]}>
                    <Ionicons
                        name={isMoving ? "walk" : "pause-circle"}
                        size={20}
                        color="#FFFFFF"
                    />
                    <Text style={styles.statusText}>
                        {isMoving ? "Hareket" : "Durağan"}
                    </Text>
                </View>
            </View>

            <SafeAreaView style={styles.mapControlsWrapper}>
                <View style={styles.mapControlsContainer}>
                    <View style={styles.mapControlsGroup}>
                        <TouchableOpacity
                            style={[styles.mapControlButton, styles.topButton]}
                            onPress={() => setShowMapTypeMenu(!showMapTypeMenu)}
                        >
                            <Ionicons
                                name={MapType === 'standard' ? "map-outline" :
                                    MapType === 'satellite' ? "earth" :
                                        MapType === 'hybrid' ? "globe-outline" : "layers-outline"}
                                size={22}
                                color="#333"
                            />
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.mapControlButton, styles.middleButton]}
                            onPress={toggle3DMode}
                        >
                            <Ionicons
                                name={is3DMode ? "cube" : "cube-outline"}
                                size={22}
                                color="#333"
                            />
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[
                                styles.mapControlButton,
                                styles.bottomButton,
                                followsUserLocation && styles.activeButton
                            ]}
                            onPress={handleMyLocation}
                        >
                            <Ionicons
                                name="locate"
                                size={22}
                                color={followsUserLocation ? "#007AFF" : "#333"}
                            />
                        </TouchableOpacity>
                    </View>

                    {/* Harita Tipi Menüsü */}
                    {showMapTypeMenu && (
                        <View style={styles.mapTypeMenu}>
                            {mapTypes.map((type) => (
                                <TouchableOpacity
                                    key={type.id}
                                    style={[
                                        styles.mapTypeMenuItem,
                                        MapType === type.id && styles.mapTypeMenuItemActive
                                    ]}
                                    onPress={() => {
                                        setMapType(type.id);
                                        setShowMapTypeMenu(false);
                                    }}
                                >
                                    <Ionicons name={type.icon} size={20} color={MapType === type.id ? "#007AFF" : "#333"} />
                                    <Text style={[
                                        styles.mapTypeMenuText,
                                        MapType === type.id && styles.mapTypeMenuTextActive
                                    ]}>
                                        {type.name}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    )}
                </View>
            </SafeAreaView>

            {/* Konum Detay Modalı */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={closeModal}
            >
                <Pressable
                    style={styles.modalOverlay}
                    onPress={closeModal}
                >
                    <View style={styles.modalContainer}>
                        <View style={styles.modalContent}>
                            {/* Modal Handle */}
                            <View style={styles.modalHandle} />

                            {/* Kişi Bilgileri */}
                            <View style={styles.userInfoContainer}>
                                <View style={styles.userPhotoContainer}>
                                    {selectedLocation?.senderPhoto ? (
                                        <Image
                                            source={{ uri: selectedLocation.senderPhoto }}
                                            style={styles.userPhoto}
                                        />
                                    ) : (
                                        <View style={styles.userPhotoDefault}>
                                            <Text style={styles.userPhotoInitial}>
                                                {selectedLocation?.senderName?.charAt(0) || '?'}
                                            </Text>
                                        </View>
                                    )}
                                    <View style={[
                                        styles.shareTypeIndicator,
                                        selectedLocation?.type === 'instant' ? styles.instantType : styles.liveType
                                    ]} />
                                </View>
                                <View style={styles.userInfo}>
                                    <Text style={styles.userName}>{selectedLocation?.senderName || 'İsimsiz'}</Text>
                                    <Text style={styles.userUsername}>@{selectedLocation?.senderUsername || 'kullanıcı'}</Text>
                                    <View style={styles.locationInfoContainer}>
                                        <Ionicons name="location" size={16} color="#666666" />
                                        <Text style={styles.locationInfo}>
                                            {selectedLocation?.locationInfo?.city}, {selectedLocation?.locationInfo?.district}
                                        </Text>
                                    </View>
                                    <View style={styles.shareTypeContainer}>
                                        <Ionicons
                                            name={selectedLocation?.type === 'instant' ? 'flash' : 'radio'}
                                            size={16}
                                            color={selectedLocation?.type === 'instant' ? '#FF9500' : '#30B0C7'}
                                        />
                                        <Text style={[
                                            styles.shareType,
                                            { color: selectedLocation?.type === 'instant' ? '#FF9500' : '#30B0C7' }
                                        ]}>
                                            {selectedLocation?.type === 'instant' ? 'Anlık Konum' : 'Canlı Konum'}
                                        </Text>
                                    </View>
                                </View>
                            </View>

                            {/* Hızlı Aksiyonlar */}
                            <View style={styles.quickActions}>
                                <TouchableOpacity style={styles.quickActionButton}>
                                    <View style={[styles.actionIcon, { backgroundColor: '#E8F5E9' }]}>
                                        <Ionicons name="person" size={24} color="#4CAF50" />
                                    </View>
                                    <Text style={styles.actionText}>Profil</Text>
                                </TouchableOpacity>

                                <TouchableOpacity style={styles.quickActionButton}>
                                    <View style={[styles.actionIcon, { backgroundColor: '#E3F2FD' }]}>
                                        <Ionicons name="navigate" size={24} color="#2196F3" />
                                    </View>
                                    <Text style={styles.actionText}>Yol Tarifi</Text>
                                </TouchableOpacity>

                                <TouchableOpacity style={styles.quickActionButton}>
                                    <View style={[styles.actionIcon, { backgroundColor: '#FFF3E0' }]}>
                                        <Ionicons name="notifications" size={24} color="#FF9800" />
                                    </View>
                                    <Text style={styles.actionText}>Bildirim</Text>
                                </TouchableOpacity>
                            </View>

                            {/* Konum Bilgileri */}
                            <View style={styles.locationDetails}>
                                <View style={styles.locationDetailItem}>
                                    <Ionicons name="time-outline" size={20} color="#666666" />
                                    <View style={styles.locationDetailText}>
                                        <Text style={styles.detailLabel}>Son Güncelleme</Text>
                                        <Text style={styles.detailValue}>5 dakika önce</Text>
                                    </View>
                                </View>

                                <View style={styles.locationDetailItem}>
                                    <Ionicons name="speedometer-outline" size={20} color="#666666" />
                                    <View style={styles.locationDetailText}>
                                        <Text style={styles.detailLabel}>Uzaklık</Text>
                                        <Text style={styles.detailValue}>2.5 km</Text>
                                    </View>
                                </View>
                            </View>

                            {/* Aksiyon Butonları */}
                            <View style={styles.actionButtons}>
                                <TouchableOpacity
                                    style={[styles.actionButton, { backgroundColor: '#007AFF' }]}
                                >
                                    <Text style={styles.actionButtonText}>Konumumu Paylaş</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[styles.actionButton, { backgroundColor: '#FF3B30' }]}
                                >
                                    <Text style={styles.actionButtonText}>Paylaşımı Durdur</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </Pressable>
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
    statusBar: {
        position: 'absolute',
        top: Platform.OS === 'ios' ? 50 : 30,
        left: 16,
        right: 16,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        borderRadius: 12,
        padding: 12,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    statusItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        borderRightWidth: 1,
        borderRightColor: 'rgba(255, 255, 255, 0.2)',
    },
    statusItemLast: {
        borderRightWidth: 0,
    },
    statusText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '500',
        marginLeft: 6,
    },
    speedValue: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: 'bold',
    },
    speedUnit: {
        color: '#FFFFFF',
        fontSize: 12,
        marginLeft: 4,
        opacity: 0.8,
    },
    infoWindowContainer: {
        position: 'absolute',
        top: '40%',
        left: 20,
        right: 20,
        alignItems: 'center',
        zIndex: 1000,
    },
    mapControlsWrapper: {
        position: 'absolute',
        top: 0,
        right: 0,
        left: 0,
        paddingTop: Platform.OS === 'ios' ? 50 : 30, // iOS ve Android için güvenli alan
    },
    mapControlsContainer: {
        position: 'absolute',
        right: 16,
        top: Platform.OS === 'ios' ? 110 : 90, // Daha önce 50/30'du, şimdi daha aşağıya çektik
        backgroundColor: 'transparent',
    },
    mapControlsGroup: {
        backgroundColor: 'white',
        borderRadius: 8,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    mapControlButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'white',
    },
    topButton: {
        borderTopLeftRadius: 8,
        borderTopRightRadius: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    middleButton: {
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    bottomButton: {
        borderBottomLeftRadius: 8,
        borderBottomRightRadius: 8,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    mapTypeMenu: {
        position: 'absolute',
        top: 50,
        right: 0,
        backgroundColor: 'white',
        borderRadius: 8,
        padding: 8,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
        minWidth: 150,
    },
    mapTypeMenuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 6,
    },
    mapTypeMenuItemActive: {
        backgroundColor: '#F0F0F0',
    },
    mapTypeMenuText: {
        marginLeft: 12,
        fontSize: 16,
        color: '#333',
    },
    mapTypeMenuTextActive: {
        color: '#007AFF',
        fontWeight: '500',
    },
    activeButton: {
        backgroundColor: '#F0F0F0', // Aktif durumda arka plan rengini değiştirelim
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContainer: {
        backgroundColor: 'white',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        minHeight: '45%',
        maxHeight: '90%',
    },
    modalContent: {
        padding: 20,
    },
    modalHandle: {
        width: 36,
        height: 4,
        backgroundColor: '#E0E0E0',
        borderRadius: 2,
        alignSelf: 'center',
        marginBottom: 20,
    },
    userInfoContainer: {
        flexDirection: 'row',
        marginBottom: 24,
        alignItems: 'center',
    },
    userPhotoContainer: {
        position: 'relative',
        marginRight: 16,
    },
    userPhoto: {
        width: 64,
        height: 64,
        borderRadius: 32,
    },
    userPhotoDefault: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: '#F5F5F5',
        justifyContent: 'center',
        alignItems: 'center',
    },
    userPhotoInitial: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#666666',
    },
    shareTypeIndicator: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 14,
        height: 14,
        borderRadius: 7,
        borderWidth: 2,
        borderColor: 'white',
    },
    instantType: {
        backgroundColor: '#FF9500',
    },
    liveType: {
        backgroundColor: '#30B0C7',
    },
    userInfo: {
        flex: 1,
        justifyContent: 'center',
    },
    userName: {
        fontSize: 20,
        fontWeight: '600',
        color: '#1A1A1A',
        marginBottom: 2,
    },
    userUsername: {
        fontSize: 14,
        color: '#666666',
        marginBottom: 6,
    },
    locationInfoContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    locationInfo: {
        fontSize: 14,
        color: '#666666',
        marginLeft: 4,
    },
    shareTypeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    shareType: {
        fontSize: 13,
        fontWeight: '500',
        marginLeft: 4,
    },
    quickActions: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingVertical: 16,
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderColor: '#F0F0F0',
        marginBottom: 20,
    },
    quickActionButton: {
        alignItems: 'center',
    },
    actionIcon: {
        width: 50,
        height: 50,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    actionText: {
        fontSize: 13,
        color: '#1A1A1A',
        fontWeight: '500',
    },
    locationDetails: {
        backgroundColor: '#F9F9F9',
        borderRadius: 16,
        padding: 16,
        marginBottom: 20,
    },
    locationDetailItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    locationDetailText: {
        marginLeft: 12,
    },
    detailLabel: {
        fontSize: 12,
        color: '#666666',
        marginBottom: 2,
    },
    detailValue: {
        fontSize: 14,
        color: '#1A1A1A',
        fontWeight: '500',
    },
    actionButtons: {
        gap: 12,
    },
    actionButton: {
        borderRadius: 12,
        paddingVertical: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    actionButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
    markerContainer: {
        width: 54,
        height: 54,
        borderRadius: 27,
        backgroundColor: 'white',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    markerImage: {
        width: 50,
        height: 50,
        borderRadius: 25,
    },
    markerDefault: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#E0E0E0',
        justifyContent: 'center',
        alignItems: 'center',
    },
    markerInitial: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#757575',
    },
    markerTriangle: {
        width: 0,
        height: 0,
        backgroundColor: 'transparent',
        borderStyle: 'solid',
        borderLeftWidth: 10,
        borderRightWidth: 10,
        borderTopWidth: 15,
        borderLeftColor: 'transparent',
        borderRightColor: 'transparent',
        borderTopColor: 'white',
        alignSelf: 'center',
        marginTop: -2, // Üçgeni marker'a biraz daha yaklaştırır
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
});

export default MapPage;