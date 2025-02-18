import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, Alert, SafeAreaView, Platform, Modal } from 'react-native';
import MapView, { Polyline } from 'react-native-maps';
import * as Location from 'expo-location';
import { collection, addDoc, onSnapshot } from 'firebase/firestore';
import { onAuthStateChanged, getAuth } from 'firebase/auth';
import { db } from '../../firebaseConfig';
import { Ionicons } from '@expo/vector-icons';

import {
    trackLiveLocations,
    listenToShares,
    listenToSharedLocations,
} from '../helpers/firebaseHelpers';
import { fetchFriends } from './FriendsPage';
import { haversine } from '../helpers/locationUtils';
import {
    shouldCollectPoint,
    TRACKING_CONSTANTS,
    GPS_ACCURACY,
    MOVEMENT_CONSTANTS,
    calculateSpeed,
    isGPSStable,
    evaluateGPSQuality,
    isGPSUsable,
    isStationary,
    calculateBearing
} from '../helpers/pathTracking';
import { getPlaceFromCoordinates } from '../helpers/locationHelpers';

// Yol renk ve stilleri
const PATH_STYLES = {
    colors: {
        newPath: '#FFD700', // Daha parlak bir sarı
        discovered: '#4CAF50',
        undiscovered: '#808080'
    },
    width: 6 // Direkt kalınlık değeri
};

const MapPage = ({ navigation }) => {
    const [MapType, setMapType] = useState('standard');
    const [location, setLocation] = useState(null);
    const [userId, setUserId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [sharedLocations, setSharedLocations] = useState([]);
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

                        // Son konumları güncelle
                        setLastLocations(prev => {
                            const newLocations = [...prev, {
                                latitude: newLocation.coords.latitude,
                                longitude: newLocation.coords.longitude,
                                timestamp: new Date()
                            }].slice(-MOVEMENT_CONSTANTS.STATIONARY_CHECK_COUNT);
                            return newLocations;
                        });

                        // Accuracy değerini her zaman geçmişe ekle
                        setAccuracyHistory(prev => {
                            const newHistory = [...prev, newLocation.coords.accuracy];
                            return newHistory.slice(-GPS_ACCURACY.SAMPLE_SIZE);
                        });

                        // GPS kalitesini her zaman değerlendir
                        const quality = evaluateGPSQuality(newLocation.coords.accuracy);
                        setGpsQuality(quality);

                        // Kalibrasyon durumunu her zaman kontrol et
                        if (!isGPSCalibrated) {
                            const timeSinceStart = Date.now() - calibrationStartTime;
                            const stable = isGPSStable(accuracyHistory);

                            const isCalibrated = timeSinceStart >= GPS_ACCURACY.CALIBRATION_TIME && stable;

                            if (isCalibrated) {
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
                console.error('Konum başlatılırken hata:', error);
                setLoading(false);
                Alert.alert('Hata', 'Konum alınırken bir hata oluştu');
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

            {/* Path Details Modal */}
            <Modal
                visible={showPathDetails}
                transparent={true}
                animationType="slide"
                onRequestClose={closePathDetails}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={closePathDetails}
                >
                    <View style={styles.modalContainer}>
                        <View style={styles.modalContent}>
                            <View style={styles.modalHandle} />

                            <View style={styles.modalHeader}>
                                <View>
                                    <Text style={styles.modalTitle}>Yol Detayları</Text>
                                    <Text style={styles.modalSubtitle}>Bu yol hakkında detaylı bilgi</Text>
                                </View>
                                <TouchableOpacity
                                    style={styles.closeButton}
                                    onPress={closePathDetails}
                                >
                                    <Ionicons name="close" size={24} color="#666" />
                                </TouchableOpacity>
                            </View>

                            {selectedPath && (
                                <View style={styles.pathDetails}>
                                    <View style={styles.detailCard}>
                                        <View style={[styles.iconContainer, { backgroundColor: '#E8F5E9' }]}>
                                            <Ionicons name="location" size={24} color="#4CAF50" />
                                        </View>
                                        <View style={styles.detailInfo}>
                                            <Text style={styles.detailLabel}>Konum</Text>
                                            <Text style={styles.detailText}>
                                                {selectedPath.city}, {selectedPath.district}
                                            </Text>
                                        </View>
                                    </View>

                                    <View style={styles.detailCard}>
                                        <View style={[styles.iconContainer, { backgroundColor: '#E3F2FD' }]}>
                                            <Ionicons name="time" size={24} color="#2196F3" />
                                        </View>
                                        <View style={styles.detailInfo}>
                                            <Text style={styles.detailLabel}>İlk Keşif Tarihi</Text>
                                            <Text style={styles.detailText}>
                                                {new Date(selectedPath.firstDiscovery.toDate()).toLocaleDateString('tr-TR', {
                                                    year: 'numeric',
                                                    month: 'long',
                                                    day: 'numeric'
                                                })}
                                            </Text>
                                        </View>
                                    </View>

                                    <View style={styles.detailCard}>
                                        <View style={[styles.iconContainer, { backgroundColor: '#FFF3E0' }]}>
                                            <Ionicons name="repeat" size={24} color="#FF9800" />
                                        </View>
                                        <View style={styles.detailInfo}>
                                            <Text style={styles.detailLabel}>Ziyaret Sayısı</Text>
                                            <Text style={styles.detailText}>
                                                {selectedPath.visitCount} kez ziyaret edildi
                                            </Text>
                                        </View>
                                    </View>

                                    <TouchableOpacity style={styles.actionButton}>
                                        <Ionicons name="navigate" size={20} color="#FFF" />
                                        <Text style={styles.actionButtonText}>Yolu Görüntüle</Text>
                                    </TouchableOpacity>
                                </View>
                            )}
                        </View>
                    </View>
                </TouchableOpacity>
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
        backgroundColor: 'transparent',
    },
    modalContent: {
        backgroundColor: 'white',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 20,
        minHeight: 400,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: -4,
        },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 10,
    },
    modalHandle: {
        width: 40,
        height: 4,
        backgroundColor: '#E0E0E0',
        borderRadius: 2,
        alignSelf: 'center',
        marginBottom: 20,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 24,
    },
    modalTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1A1A1A',
        marginBottom: 4,
    },
    modalSubtitle: {
        fontSize: 14,
        color: '#666',
    },
    closeButton: {
        padding: 8,
        marginTop: -8,
        marginRight: -8,
    },
    pathDetails: {
        gap: 16,
    },
    detailCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        padding: 16,
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    detailInfo: {
        flex: 1,
    },
    detailLabel: {
        fontSize: 12,
        color: '#666',
        marginBottom: 4,
    },
    detailText: {
        fontSize: 16,
        color: '#1A1A1A',
        fontWeight: '500',
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#2196F3',
        padding: 16,
        borderRadius: 12,
        marginTop: 8,
    },
    actionButtonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 8,
    },
    gpsQualityIndicator: {
        position: 'absolute',
        top: Platform.OS === 'ios' ? 50 : 30,
        alignSelf: 'center',  // Yatayda ortalama
        backgroundColor: 'rgba(0, 0, 0, 0.7)', // Arka plan rengini daha koyu yapalım
        borderRadius: 20,
        padding: 12,
        flexDirection: 'row',
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
    gpsQualityText: {
        marginLeft: 8,
        fontSize: 14,  // Yazı boyutunu biraz büyütelim
        color: '#FFFFFF', // Yazı rengini beyaz yapalım
        fontWeight: '500'
    },
    movementIndicator: {
        position: 'absolute',
        top: Platform.OS === 'ios' ? 90 : 70,
        alignSelf: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        borderRadius: 20,
        padding: 12,
        flexDirection: 'row',
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
    movementText: {
        marginLeft: 8,
        fontSize: 14,
        color: '#FFFFFF',
        fontWeight: '500'
    }
});

export default MapPage;