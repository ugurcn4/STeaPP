import React, { useState, useEffect } from 'react';
import {
    View,
    TextInput,
    FlatList,
    TouchableOpacity,
    Text,
    StyleSheet,
    ActivityIndicator,
} from 'react-native';
import { getPlaceFromCoordinates } from '../helpers/locationHelpers';
import { Ionicons } from '@expo/vector-icons';
import debounce from 'lodash/debounce';
import * as Location from 'expo-location';

const LocationPicker = ({ onSelect, onClose }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    const debouncedSearch = debounce(async (query) => {
        if (query.length < 2) {
            setSearchResults([]);
            return;
        }

        setIsLoading(true);
        try {
            // Kullanıcının mevcut konumunu al
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                throw new Error('Konum izni reddedildi');
            }

            const location = await Location.getCurrentPositionAsync({});
            const placeInfo = await getPlaceFromCoordinates(
                location.coords.latitude,
                location.coords.longitude
            );

            // Arama sonuçlarını oluştur
            const results = [{
                id: '1',
                name: 'Mevcut Konum',
                address: `${placeInfo.district}, ${placeInfo.city}`,
                latitude: location.coords.latitude,
                longitude: location.coords.longitude
            }];

            setSearchResults(results);
        } catch (error) {
            console.error('Konum arama hatası:', error);
            setSearchResults([]);
        } finally {
            setIsLoading(false);
        }
    }, 300);

    useEffect(() => {
        return () => {
            debouncedSearch.cancel();
        };
    }, []);

    const handleSearch = (query) => {
        setSearchQuery(query);
        debouncedSearch(query);
    };

    const handleSelect = async (place) => {
        try {
            setIsLoading(true);
            const details = {
                latitude: place.latitude,
                longitude: place.longitude,
                address: place.address,
                name: place.name
            };
            onSelect(details);
        } catch (error) {
            console.error('Konum detayları alınamadı:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const renderLocationItem = ({ item }) => (
        <TouchableOpacity
            style={styles.locationItem}
            onPress={() => handleSelect(item)}
        >
            <View style={styles.locationIcon}>
                <Ionicons name="location" size={24} color="#2196F3" />
            </View>
            <View style={styles.locationInfo}>
                <Text style={styles.locationName} numberOfLines={1}>
                    {item.name}
                </Text>
                <Text style={styles.locationAddress} numberOfLines={1}>
                    {item.address}
                </Text>
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                    <Ionicons name="close" size={24} color="#FFF" />
                </TouchableOpacity>
                <Text style={styles.title}>Konum Seç</Text>
            </View>

            <View style={styles.searchContainer}>
                <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Konum ara..."
                    placeholderTextColor="#999"
                    value={searchQuery}
                    onChangeText={handleSearch}
                    autoFocus
                />
            </View>

            {isLoading ? (
                <ActivityIndicator style={styles.loader} color="#2196F3" />
            ) : (
                <FlatList
                    data={searchResults}
                    renderItem={renderLocationItem}
                    keyExtractor={(item) => item.id}
                    style={styles.list}
                    ItemSeparatorComponent={() => <View style={styles.separator} />}
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#333',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#444',
    },
    closeButton: {
        padding: 8,
    },
    title: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: 'bold',
        marginLeft: 16,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        margin: 16,
        paddingHorizontal: 16,
        backgroundColor: '#444',
        borderRadius: 8,
    },
    searchIcon: {
        marginRight: 8,
    },
    searchInput: {
        flex: 1,
        height: 40,
        color: '#FFF',
    },
    loader: {
        marginTop: 20,
    },
    list: {
        flex: 1,
    },
    locationItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
    },
    locationIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(33, 150, 243, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    locationInfo: {
        flex: 1,
        marginLeft: 12,
    },
    locationName: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
    locationAddress: {
        color: '#999',
        fontSize: 14,
        marginTop: 2,
    },
    separator: {
        height: 1,
        backgroundColor: '#444',
        marginLeft: 68,
    },
});

export default LocationPicker; 