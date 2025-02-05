import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, FlatList, PanResponder, Animated, Dimensions, Keyboard, TouchableWithoutFeedback } from 'react-native';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';

// Ekran boyutlarını alalım
const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export const emojiCategories = [
    {
        id: 'places',
        title: 'Yerler',
        icon: '🏢',
        emojis: [
            { id: 'home', emoji: '🏠', label: 'Ev' },
            { id: 'office', emoji: '🏢', label: 'Ofis' },
            { id: 'school', emoji: '🏫', label: 'Okul' },
            { id: 'hospital', emoji: '🏥', label: 'Hastane' },
            { id: 'pharmacy', emoji: '💊', label: 'Eczane' },
            { id: 'library', emoji: '📚', label: 'Kütüphane' },
            { id: 'mosque', emoji: '🕌', label: 'Cami' },
            { id: 'mall', emoji: '🏬', label: 'AVM' },
        ]
    },
    {
        id: 'food',
        title: 'Yeme & İçme',
        icon: '🍽️',
        emojis: [
            { id: 'restaurant', emoji: '🍽️', label: 'Restoran' },
            { id: 'cafe', emoji: '☕', label: 'Kafe' },
            { id: 'bar', emoji: '🍺', label: 'Bar' },
            { id: 'fastfood', emoji: '🍔', label: 'Fast Food' },
            { id: 'market', emoji: '🏪', label: 'Market' },
            { id: 'bakery', emoji: '🥖', label: 'Fırın' },
            { id: 'icecream', emoji: '🍦', label: 'Dondurmacı' },
            { id: 'dessert', emoji: '🍰', label: 'Tatlıcı' },
        ]
    },
    {
        id: 'activities',
        title: 'Aktiviteler',
        icon: '🎯',
        emojis: [
            { id: 'gym', emoji: '🏋️', label: 'Spor Salonu' },
            { id: 'park', emoji: '🌳', label: 'Park' },
            { id: 'cinema', emoji: '🎬', label: 'Sinema' },
            { id: 'shopping', emoji: '🛍️', label: 'AVM' },
            { id: 'beach', emoji: '🏖️', label: 'Plaj' },
            { id: 'pool', emoji: '🏊', label: 'Havuz' },
            { id: 'game', emoji: '🎮', label: 'Oyun Salonu' },
            { id: 'bowling', emoji: '🎳', label: 'Bowling' },
        ]
    },
    {
        id: 'transport',
        title: 'Ulaşım',
        icon: '🚗',
        emojis: [
            { id: 'bus-stop', emoji: '🚌', label: 'Otobüs Durağı' },
            { id: 'metro', emoji: '🚇', label: 'Metro' },
            { id: 'train', emoji: '🚂', label: 'Tren' },
            { id: 'airport', emoji: '✈️', label: 'Havalimanı' },
            { id: 'parking', emoji: '🅿️', label: 'Otopark' },
            { id: 'gas', emoji: '⛽', label: 'Benzin' },
            { id: 'taxi', emoji: '🚕', label: 'Taksi' },
            { id: 'ferry', emoji: '⛴️', label: 'Vapur' },
        ]
    },
    {
        id: 'others',
        title: 'Diğer',
        icon: '📍',
        emojis: [
            { id: 'pin', emoji: '📍', label: 'Pin' },
            { id: 'favorite', emoji: '❤️', label: 'Favori' },
            { id: 'bank', emoji: '🏦', label: 'Banka' },
            { id: 'atm', emoji: '🏧', label: 'ATM' },
            { id: 'police', emoji: '👮', label: 'Polis' },
            { id: 'post', emoji: '📮', label: 'PTT' },
            { id: 'hotel', emoji: '🏨', label: 'Otel' },
            { id: 'custom', emoji: '🔖', label: 'Özel' },
        ]
    },
];

const EmojiModal = ({ onSelectEmoji, currentEmoji, onClose }) => {
    const [searchText, setSearchText] = useState('');
    const [selectedEmoji, setSelectedEmoji] = useState(currentEmoji);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const modalHeight = useRef(new Animated.Value(60)).current;
    const lastGestureDy = useRef(0);
    const startPositionY = useRef(0);

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: () => true,
            onPanResponderGrant: () => {
                startPositionY.current = modalHeight._value;
            },
            onPanResponderMove: (_, gesture) => {
                const newHeight = Math.max(
                    60,
                    Math.min(95, startPositionY.current - (gesture.dy / SCREEN_HEIGHT) * 100)
                );
                modalHeight.setValue(newHeight);
                lastGestureDy.current = gesture.dy;
            },
            onPanResponderRelease: () => {
                const currentValue = modalHeight._value;
                const targetValue = currentValue > 75 ? 95 : 60;

                Animated.spring(modalHeight, {
                    toValue: targetValue,
                    useNativeDriver: false,
                    friction: 8,
                    tension: 40,
                }).start();
            },
        })
    ).current;

    const handleEmojiSelect = (emoji) => {
        setSelectedEmoji(emoji.id);
        onSelectEmoji(emoji);
    };

    const filteredCategories = searchText
        ? emojiCategories.map(category => ({
            ...category,
            emojis: category.emojis.filter(emoji =>
                emoji.label.toLowerCase().includes(searchText.toLowerCase())
            )
        })).filter(category => category.emojis.length > 0)
        : emojiCategories;

    const renderIcon = (emoji) => {
        switch (emoji.type) {
            case 'material':
                return <MaterialCommunityIcons name={emoji.icon} size={24} color="#000" />;
            case 'font':
                return <FontAwesome5 name={emoji.icon} size={24} color="#000" />;
            default:
                return <Ionicons name={emoji.icon} size={24} color="#000" />;
        }
    };

    const renderCategory = ({ item: category }) => (
        <View style={styles.categoryContainer}>
            <View style={styles.categoryHeader}>
                <Text style={styles.categoryIcon}>{category.icon}</Text>
                <Text style={styles.categoryTitle}>{category.title}</Text>
            </View>
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.emojiRowContainer}
            >
                {category.emojis.map((emoji) => (
                    <TouchableOpacity
                        key={emoji.id}
                        style={[
                            styles.emojiItem,
                            selectedEmoji === emoji.id && styles.selectedEmojiItem,
                        ]}
                        onPress={() => handleEmojiSelect(emoji)}
                    >
                        <Text style={styles.emojiIcon}>{emoji.emoji}</Text>
                        <Text style={[
                            styles.emojiLabel,
                            selectedEmoji === emoji.id && styles.selectedEmojiLabel
                        ]}>
                            {emoji.label}
                        </Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </View>
    );

    return (
        <View style={styles.overlay}>
            <TouchableOpacity
                style={styles.backdrop}
                activeOpacity={1}
                onPress={onClose}
            />
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <Animated.View
                    style={[
                        styles.container,
                        {
                            height: modalHeight.interpolate({
                                inputRange: [60, 95],
                                outputRange: [SCREEN_HEIGHT * 0.6, SCREEN_HEIGHT * 0.95],
                            }),
                        },
                    ]}
                >
                    <View style={styles.dragHandleContainer} {...panResponder.panHandlers}>
                        <View style={styles.dragHandle} />
                    </View>

                    <View style={styles.headerContainer}>
                        <Text style={styles.headerTitle}>İşaretçi Seç</Text>
                        <TouchableOpacity
                            style={styles.closeButton}
                            onPress={onClose}
                        >
                            <Ionicons name="close" size={24} color="#666" />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.searchContainer}>
                        <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Emoji ara..."
                            value={searchText}
                            onChangeText={setSearchText}
                            placeholderTextColor="#666"
                        />
                    </View>

                    <FlatList
                        data={filteredCategories}
                        renderItem={renderCategory}
                        keyExtractor={item => item.id}
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={styles.categoriesContainer}
                        keyboardShouldPersistTaps="handled"
                    />
                </Animated.View>
            </TouchableWithoutFeedback>
        </View>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    container: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        overflow: 'hidden',
    },
    dragHandleContainer: {
        width: '100%',
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#fff',
    },
    dragHandle: {
        width: 40,
        height: 4,
        backgroundColor: '#DDD',
        borderRadius: 2,
        marginVertical: 8,
    },
    headerContainer: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        paddingBottom: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
    },
    headerTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
    },
    closeButton: {
        position: 'absolute',
        right: 16,
        top: 0,
        padding: 4,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F5F5F5',
        borderRadius: 12,
        paddingHorizontal: 12,
        margin: 16,
        marginBottom: 8,
    },
    searchIcon: {
        marginRight: 8,
    },
    searchInput: {
        flex: 1,
        paddingVertical: 12,
        fontSize: 16,
        color: '#333',
    },
    categoriesContainer: {
        padding: 8,
    },
    categoryContainer: {
        marginBottom: 20,
    },
    categoryHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        paddingHorizontal: 16,
    },
    categoryTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginLeft: 12,
        marginBottom: 12,
    },
    emojiRowContainer: {
        paddingHorizontal: 8,
    },
    emojiItem: {
        alignItems: 'center',
        justifyContent: 'center',
        marginHorizontal: 8,
        width: 72,
        borderRadius: 16,
        padding: 8,
        backgroundColor: '#F8F9FA',
    },
    selectedEmojiItem: {
        backgroundColor: '#E8F5E9',
        borderWidth: 2,
        borderColor: '#4CAF50',
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#F5F5F5',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 4,
    },
    emojiLabel: {
        fontSize: 12,
        color: '#666',
        textAlign: 'center',
        marginTop: 4,
    },
    selectedEmojiLabel: {
        color: '#333',
    },
    categoryIcon: {
        fontSize: 24,
        marginRight: 8,
    },
    emojiIcon: {
        fontSize: 32,
        marginBottom: 4,
    },
});

export default EmojiModal; 