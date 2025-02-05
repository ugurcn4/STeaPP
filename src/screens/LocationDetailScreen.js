import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { MaterialIcons } from '@expo/vector-icons';
import * as Location from 'expo-location';

// Saat formatı için yardımcı fonksiyon
const formatTurkishTime = (timestamp) => {
    try {
        let date;
        if (!timestamp) {
            return 'Belirtilmemiş';
        }

        if (typeof timestamp.toDate === 'function') {
            date = timestamp.toDate();
        } else if (timestamp instanceof Date) {
            date = timestamp;
        } else if (typeof timestamp === 'string') {
            date = new Date(timestamp);
        } else {
            return 'Belirtilmemiş';
        }

        const formattedTime = date.toLocaleTimeString('tr-TR', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        });
        return formattedTime;
    } catch (error) {
        console.error('Time formatting error:', error);
        return 'Belirtilmemiş';
    }
};


const LocationDetailScreen = ({ route, navigation }) => {
    const { share } = route.params;
    const mapRef = useRef(null);
    const [myLocation, setMyLocation] = useState(null);

    useEffect(() => {
        const getMyLocation = async () => {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                return;
            }

            const location = await Location.getCurrentPositionAsync({});
            setMyLocation({
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
            });
        };

        getMyLocation();
    }, []);

    const focusLocation = (location) => {
        if (mapRef.current && location) {
            mapRef.current.animateToRegion({
                latitude: location.latitude,
                longitude: location.longitude,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
            });
        }
    };

    // Konum verilerini güvenli bir şekilde işle
    const getValidLocation = (shareData) => {
        if (!shareData?.location) {
            return null;
        }

        try {
            const lat = Number(shareData.location.latitude);
            const lng = Number(shareData.location.longitude);

            if (isNaN(lat) || isNaN(lng)) {
                return null;
            }

            return {
                latitude: lat,
                longitude: lng,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01
            };
        } catch (error) {
            console.error('Error processing location:', error);
            return null;
        }
    };

    const validLocation = getValidLocation(share);

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <MaterialIcons name="arrow-back-ios" size={24} color="#333" />
                </TouchableOpacity>
                <View style={styles.headerInfo}>
                    <Text style={styles.headerTitle}>{share.senderName}</Text>
                    <View style={[
                        styles.shareTypeBadge,
                        { backgroundColor: share.type === 'live' ? '#E3F2FD' : '#E8F5E9' }
                    ]}>
                        <MaterialIcons
                            name={share.type === 'live' ? 'location-on' : 'place'}
                            size={16}
                            color={share.type === 'live' ? '#2196F3' : '#4CAF50'}
                        />
                        <Text style={[
                            styles.shareTypeText,
                            { color: share.type === 'live' ? '#2196F3' : '#4CAF50' }
                        ]}>
                            {share.type === 'live' ? 'Canlı Konum' : 'Anlık Konum'}
                        </Text>
                    </View>
                </View>
            </View>

            {validLocation ? (
                <MapView
                    ref={mapRef}
                    provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : null}
                    style={styles.map}
                    initialRegion={validLocation}
                >
                    <Marker
                        coordinate={{
                            latitude: validLocation.latitude,
                            longitude: validLocation.longitude
                        }}
                    >
                        <View style={styles.markerContainer}>
                            <MaterialIcons
                                name={share.type === 'live' ? 'location-on' : 'place'}
                                size={36}
                                color="#2196F3"
                            />
                        </View>
                    </Marker>

                    {myLocation && (
                        <Marker
                            coordinate={{
                                latitude: Number(myLocation.latitude),
                                longitude: Number(myLocation.longitude)
                            }}
                        >
                            <View style={styles.markerContainer}>
                                <MaterialIcons
                                    name="person-pin-circle"
                                    size={36}
                                    color="#4CAF50"
                                />
                            </View>
                        </Marker>
                    )}
                </MapView>
            ) : (
                <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>Konum bilgisi alınamadı</Text>
                </View>
            )}

            <View style={styles.footer}>
                <View style={styles.infoCard}>
                    <View style={styles.locationInfo}>
                        <View style={styles.iconContainer}>
                            <MaterialIcons name="place" size={24} color="#2196F3" />
                        </View>
                        <View style={styles.infoTextContainer}>
                            <Text style={styles.infoLabel}>Konum</Text>
                            <Text style={styles.locationText}>
                                {share.locationInfo?.district}, {share.locationInfo?.city}
                            </Text>
                        </View>
                    </View>

                    <View style={styles.timeInfo}>
                        <View style={styles.timeRow}>
                            <View style={styles.iconContainer}>
                                <MaterialIcons name="access-time" size={24} color="#4CAF50" />
                            </View>
                            <View style={styles.infoTextContainer}>
                                <Text style={styles.infoLabel}>Paylaşım Zamanı</Text>
                                <Text style={styles.timeText}>
                                    {formatTurkishTime(share.startTime)}
                                </Text>
                            </View>
                        </View>
                        {share.type === 'live' && share.lastUpdate && (
                            <View style={styles.timeRow}>
                                <View style={styles.iconContainer}>
                                    <MaterialIcons name="update" size={24} color="#FF9800" />
                                </View>
                                <View style={styles.infoTextContainer}>
                                    <Text style={styles.infoLabel}>Son Güncelleme</Text>
                                    <Text style={styles.timeText}>
                                        {formatTurkishTime(share.lastUpdate)}
                                    </Text>
                                </View>
                            </View>
                        )}
                    </View>
                </View>

                <View style={styles.actions}>
                    <TouchableOpacity
                        style={[styles.actionButton, { backgroundColor: '#2196F3' }]}
                        onPress={() => focusLocation(share.location)}
                    >
                        <MaterialIcons name="center-focus-strong" size={24} color="#FFF" />
                        <Text style={styles.actionButtonText}>Konuma Git</Text>
                    </TouchableOpacity>

                    {myLocation && (
                        <TouchableOpacity
                            style={[styles.actionButton, { backgroundColor: '#4CAF50' }]}
                            onPress={() => focusLocation(myLocation)}
                        >
                            <MaterialIcons name="my-location" size={24} color="#FFF" />
                            <Text style={styles.actionButtonText}>Konumum</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F6FA',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#FFF',
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    backButton: {
        padding: 8,
    },
    headerInfo: {
        flex: 1,
        marginLeft: 8,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: '#1A1A1A',
    },
    shareTypeBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 16,
        marginTop: 4,
        alignSelf: 'flex-start',
    },
    shareTypeText: {
        fontSize: 14,
        fontWeight: '500',
        marginLeft: 4,
    },
    map: {
        flex: 1,
    },
    markerContainer: {
        alignItems: 'center',
    },
    footer: {
        backgroundColor: '#F5F6FA',
        padding: 16,
    },
    infoCard: {
        backgroundColor: '#FFF',
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#F5F6FA',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    infoTextContainer: {
        flex: 1,
    },
    infoLabel: {
        fontSize: 12,
        color: '#666',
        marginBottom: 2,
    },
    locationInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    locationText: {
        fontSize: 16,
        color: '#1A1A1A',
        fontWeight: '500',
    },
    timeInfo: {
        gap: 16,
    },
    timeRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    timeText: {
        fontSize: 16,
        color: '#1A1A1A',
        fontWeight: '500',
    },
    actions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 12,
    },
    actionButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        borderRadius: 12,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    actionButtonText: {
        color: '#FFF',
        marginLeft: 8,
        fontSize: 16,
        fontWeight: '600',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f8f9fa'
    },
    errorText: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center'
    }
});

// Özel harita stilini düzeltelim
const mapStyle = [
    {
        featureType: "water",
        elementType: "geometry",
        stylers: [
            {
                color: "#e9e9e9"
            },
            {
                lightness: 17
            }
        ]
    },
    {
        featureType: "landscape",
        elementType: "geometry",
        stylers: [
            {
                color: "#f5f5f5"
            },
            {
                lightness: 20
            }
        ]
    }
];

export default LocationDetailScreen; 