import React, { useState, useEffect, create } from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';

const AIRecommendationCard = ({ navigation }) => {
    const [currentRecommendation, setCurrentRecommendation] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchRecommendations();
    }, []);

    const fetchRecommendations = async () => {
        try {
            // Kullanıcının konumunu al
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                console.error('Konum izni reddedildi');
                return;
            }

            const location = await Location.getCurrentPositionAsync({});

            // Yapay zeka önerilerini al
            const recommendation = await getAIRecommendations(
                location.coords.latitude,
                location.coords.longitude
            );

            setCurrentRecommendation(recommendation);
            setLoading(false);
        } catch (error) {
            console.error('Öneri alma hatası:', error);
            setLoading(false);
        }
    };

    if (loading) {
        return <ActivityIndicator size="large" color="#4CAF50" />;
    }

    return (
        <TouchableOpacity
            onPress={() => navigation.navigate('AIRecommendations')}
        >
            <LinearGradient
                colors={['#4CAF50', '#2E7D32']}
                style={styles.card}
            >
                <View style={styles.header}>
                    <View style={styles.titleContainer}>
                        <Ionicons name="bulb" size={24} color="#FFF" />
                        <Text style={styles.title}>AI Önerileri</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={24} color="#FFF" />
                </View>

                <View style={styles.content}>
                    <View style={styles.recommendationContainer}>
                        <Text style={styles.mainText}>
                            {currentRecommendation?.mainSuggestion}
                        </Text>
                        <Text style={styles.subText}>
                            {currentRecommendation?.description}
                        </Text>
                    </View>

                    <View style={styles.statsContainer}>
                        <View style={styles.stat}>
                            <Ionicons name="walk" size={20} color="#FFF" />
                            <Text style={styles.statText}>
                                {currentRecommendation?.distance} km
                            </Text>
                        </View>
                        <View style={styles.stat}>
                            <Ionicons name="time" size={20} color="#FFF" />
                            <Text style={styles.statText}>
                                {currentRecommendation?.duration} dk
                            </Text>
                        </View>
                    </View>
                </View>
            </LinearGradient>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    card: {
        borderRadius: 20,
        padding: 16,
        marginVertical: 8,
        marginHorizontal: 16,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    titleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    title: {
        fontSize: 18,
        fontWeight: '600',
        color: '#FFF',
        marginLeft: 8,
    },
    content: {
        marginTop: 8,
    },
    recommendationContainer: {
        marginBottom: 12,
    },
    mainText: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#FFF',
        marginBottom: 4,
    },
    subText: {
        fontSize: 14,
        color: '#FFF',
        opacity: 0.9,
    },
    statsContainer: {
        flexDirection: 'row',
        justifyContent: 'flex-start',
        marginTop: 8,
    },
    stat: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 16,
    },
    statText: {
        color: '#FFF',
        marginLeft: 4,
        fontSize: 14,
    },
});

export default AIRecommendationCard;
