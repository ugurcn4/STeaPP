import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Image,
    TouchableOpacity,
    ScrollView,
    Dimensions,
    SafeAreaView
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import * as ImageManipulator from 'expo-image-manipulator';

const { width } = Dimensions.get('window');

const FILTERS = [
    { name: 'Normal', value: 'normal', icon: 'image' },
    { name: 'S/B', value: 'b&w', icon: 'contrast' },
    { name: 'Sepya', value: 'sepia', icon: 'color-filter' },
    { name: 'Vintage', value: 'vintage', icon: 'film' },
    { name: 'Canlı', value: 'vivid', icon: 'sunny' }
];

const TOOLS = [
    {
        name: 'Filtreler',
        icon: 'color-filter',
        type: 'filters',
        color: '#FF9800' // Turuncu
    },
    {
        name: 'Ayarlar',
        icon: 'options',
        type: 'adjustments',
        color: '#4CAF50' // Yeşil
    },
    {
        name: 'Kırp',
        icon: 'crop',
        type: 'crop',
        color: '#E91E63' // Pembe
    },
    {
        name: 'Döndür',
        icon: 'refresh',
        type: 'rotate',
        color: '#2196F3' // Mavi
    },
];

const ImageEditor = ({ route, navigation }) => {
    const { imageUri } = route.params;
    const [editedImage, setEditedImage] = useState(imageUri);
    const [brightness, setBrightness] = useState(0);
    const [contrast, setContrast] = useState(0);
    const [selectedFilter, setSelectedFilter] = useState('normal');
    const [isOriginalShowing, setIsOriginalShowing] = useState(false);
    const [activeToolType, setActiveToolType] = useState('filters');

    const applyEdits = async () => {
        try {
            let actions = [];

            // Döndürme işlemi için
            if (activeToolType === 'rotate') {
                actions.push({ rotate: 90 });
            }

            // Siyah beyaz için
            if (selectedFilter === 'b&w') {
                // Siyah beyaz efekti için flip kullanabiliriz
                actions.push(
                    { flip: ImageManipulator.FlipType.Vertical },
                    { flip: ImageManipulator.FlipType.Horizontal }
                );
            }

            // Parlaklık için resize kullanabiliriz
            if (brightness !== 0) {
                const scale = 1 + brightness; // -1 ile 1 arasındaki değeri 0-2 arasına dönüştür
                actions.push({
                    resize: {
                        width: width * scale,
                        height: width * scale
                    }
                });
            }

            // Kontrast için crop kullanabiliriz
            if (contrast !== 0) {
                const cropSize = width * (1 - Math.abs(contrast) * 0.1);
                const offset = (width - cropSize) / 2;
                actions.push({
                    crop: {
                        originX: offset,
                        originY: offset,
                        width: cropSize,
                        height: cropSize
                    }
                });
            }

            if (actions.length > 0) {
                const result = await ImageManipulator.manipulateAsync(
                    imageUri,
                    actions,
                    {
                        compress: 1,
                        format: ImageManipulator.SaveFormat.JPEG,
                    }
                );
                setEditedImage(result.uri);
            } else {
                setEditedImage(imageUri);
            }
        } catch (error) {
            console.error('Görsel düzenleme hatası:', error);
        }
    };

    const handleBrightnessChange = (value) => {
        setBrightness(value);
        clearTimeout(window.brightnessTimeout);
        window.brightnessTimeout = setTimeout(() => {
            applyEdits();
        }, 100);
    };

    const handleContrastChange = (value) => {
        setContrast(value);
        clearTimeout(window.contrastTimeout);
        window.contrastTimeout = setTimeout(() => {
            applyEdits();
        }, 100);
    };

    const handleFilterSelect = (filter) => {
        setSelectedFilter(filter);
        applyEdits();
    };

    const handleSave = () => {
        navigation.navigate('CreatePostDetails', {
            image: editedImage,
            originalImage: imageUri
        });
    };

    const handleRotate = () => {
        if (activeToolType === 'rotate') {
            applyEdits();
        }
    };

    const renderToolbar = () => (
        <View style={styles.toolbar}>
            {TOOLS.map((tool) => (
                <TouchableOpacity
                    key={tool.type}
                    style={[
                        styles.toolButton,
                        activeToolType === tool.type && styles.toolButtonActive
                    ]}
                    onPress={() => {
                        setActiveToolType(tool.type);
                        if (tool.type === 'rotate') {
                            handleRotate();
                        }
                    }}
                >
                    <View style={[
                        styles.toolIconContainer,
                        { backgroundColor: `${tool.color}15` }
                    ]}>
                        <Ionicons
                            name={tool.icon}
                            size={24}
                            color={activeToolType === tool.type ? tool.color : tool.color}
                        />
                    </View>
                    <Text style={[
                        styles.toolText,
                        activeToolType === tool.type && { color: tool.color }
                    ]}>
                        {tool.name}
                    </Text>
                </TouchableOpacity>
            ))}
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.headerButton}
                    onPress={() => navigation.goBack()}
                >
                    <Ionicons name="close" size={24} color="#000" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Düzenle</Text>
                <TouchableOpacity
                    style={[styles.headerButton, styles.saveButton]}
                    onPress={handleSave}
                >
                    <Text style={styles.saveButtonText}>Kaydet</Text>
                </TouchableOpacity>
            </View>

            {/* Görsel Alanı */}
            <View style={styles.imageWrapper}>
                <TouchableOpacity
                    style={styles.imageContainer}
                    activeOpacity={0.8}
                    onPressIn={() => setIsOriginalShowing(true)}
                    onPressOut={() => setIsOriginalShowing(false)}
                >
                    <Image
                        source={{ uri: isOriginalShowing ? imageUri : editedImage }}
                        style={styles.image}
                        resizeMode="contain"
                    />
                    {isOriginalShowing && (
                        <View style={styles.originalOverlay}>
                            <MaterialIcons name="compare" size={24} color="#FFF" />
                            <Text style={styles.originalText}>ORİJİNAL</Text>
                        </View>
                    )}
                </TouchableOpacity>
            </View>

            {/* Araç Çubuğu */}
            {renderToolbar()}

            {/* Düzenleme Araçları */}
            <View style={styles.editingTools}>
                {activeToolType === 'filters' && (
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        style={styles.filtersContainer}
                        contentContainerStyle={styles.filtersContent}
                    >
                        {FILTERS.map((filter) => (
                            <TouchableOpacity
                                key={filter.value}
                                style={[
                                    styles.filterOption,
                                    selectedFilter === filter.value && styles.filterOptionSelected
                                ]}
                                onPress={() => handleFilterSelect(filter.value)}
                            >
                                <Ionicons
                                    name={filter.icon}
                                    size={24}
                                    color={selectedFilter === filter.value ? '#2196F3' : '#666'}
                                />
                                <Text style={[
                                    styles.filterText,
                                    selectedFilter === filter.value && styles.filterTextSelected
                                ]}>
                                    {filter.name}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                )}

                {activeToolType === 'adjustments' && (
                    <View style={styles.adjustments}>
                        <View style={styles.adjustment}>
                            <View style={styles.adjustmentHeader}>
                                <Ionicons name="sunny" size={20} color="#666" />
                                <Text style={styles.adjustmentLabel}>Parlaklık</Text>
                                <Text style={styles.adjustmentValue}>
                                    {Math.round(brightness * 100)}%
                                </Text>
                            </View>
                            <Slider
                                style={styles.slider}
                                minimumValue={-1}
                                maximumValue={1}
                                value={brightness}
                                onValueChange={handleBrightnessChange}
                                minimumTrackTintColor="#2196F3"
                                maximumTrackTintColor="#E0E0E0"
                                thumbTintColor="#2196F3"
                            />
                        </View>

                        <View style={styles.adjustment}>
                            <View style={styles.adjustmentHeader}>
                                <Ionicons name="contrast" size={20} color="#666" />
                                <Text style={styles.adjustmentLabel}>Kontrast</Text>
                                <Text style={styles.adjustmentValue}>
                                    {Math.round(contrast * 100)}%
                                </Text>
                            </View>
                            <Slider
                                style={styles.slider}
                                minimumValue={-1}
                                maximumValue={1}
                                value={contrast}
                                onValueChange={handleContrastChange}
                                minimumTrackTintColor="#2196F3"
                                maximumTrackTintColor="#E0E0E0"
                                thumbTintColor="#2196F3"
                            />
                        </View>
                    </View>
                )}
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    headerButton: {
        padding: 8,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#000',
    },
    saveButton: {
        backgroundColor: '#2196F3',
        borderRadius: 20,
        paddingHorizontal: 16,
    },
    saveButtonText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 15,
    },
    imageWrapper: {
        flex: 1,
        backgroundColor: '#000',
    },
    imageContainer: {
        flex: 1,
        justifyContent: 'center',
    },
    image: {
        width: '100%',
        height: '100%',
    },
    originalOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.3)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    originalText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
        marginTop: 8,
    },
    toolbar: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingVertical: 12,
        borderTopWidth: 1,
        borderTopColor: '#eee',
        backgroundColor: '#fff',
    },
    toolButton: {
        alignItems: 'center',
        padding: 8,
        borderRadius: 8,
    },
    toolButtonActive: {
        backgroundColor: '#fff',
    },
    toolIconContainer: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 4,
    },
    toolText: {
        fontSize: 12,
        color: '#666',
        marginTop: 4,
        fontWeight: '500',
    },
    editingTools: {
        backgroundColor: '#fff',
        paddingVertical: 16,
        borderTopWidth: 1,
        borderTopColor: '#eee',
    },
    filtersContainer: {
        maxHeight: 100,
    },
    filtersContent: {
        paddingHorizontal: 16,
    },
    filterOption: {
        alignItems: 'center',
        marginRight: 20,
        padding: 8,
        borderRadius: 8,
    },
    filterOptionSelected: {
        backgroundColor: '#E3F2FD',
    },
    filterText: {
        fontSize: 12,
        color: '#666',
        marginTop: 4,
    },
    filterTextSelected: {
        color: '#2196F3',
        fontWeight: '500',
    },
    adjustments: {
        paddingHorizontal: 16,
    },
    adjustment: {
        marginBottom: 16,
    },
    adjustmentHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    adjustmentLabel: {
        flex: 1,
        fontSize: 14,
        color: '#333',
        marginLeft: 8,
    },
    adjustmentValue: {
        fontSize: 14,
        color: '#666',
        width: 50,
        textAlign: 'right',
    },
    slider: {
        width: '100%',
        height: 40,
    },
});

export default ImageEditor; 