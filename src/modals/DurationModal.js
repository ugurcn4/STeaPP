import React from 'react';
import { 
    View, 
    Text, 
    StyleSheet, 
    Modal, 
    TouchableOpacity, 
    Dimensions 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PanGestureHandler } from 'react-native-gesture-handler';
import Animated, {
    useAnimatedGestureHandler,
    useAnimatedStyle,
    useSharedValue,
    withTiming,
    runOnJS
} from 'react-native-reanimated';

// Süre seçenekleri
const durationOptions = [
    { id: '30min', label: '30 Dakika', value: 30 },
    { id: '1hour', label: '1 Saat', value: 60 },
    { id: '2hours', label: '2 Saat', value: 120 },
    { id: '4hours', label: '4 Saat', value: 240 },
    { id: '8hours', label: '8 Saat', value: 480 },
    { id: 'unlimited', label: 'Sınırsız', value: -1 }
];

const DurationModal = ({ 
    visible, 
    onClose, 
    selectedDuration, 
    setSelectedDuration, 
    onStartDrawing 
}) => {
    // Animasyon değerleri
    const translateY = useSharedValue(0);

    // Gesture handler fonksiyonları
    const onGestureEvent = useAnimatedGestureHandler({
        onStart: (_, ctx) => {
            ctx.startY = translateY.value;
        },
        onActive: (event, ctx) => {
            // Sadece aşağı doğru sürüklemeye izin ver
            if (event.translationY > 0) {
                translateY.value = ctx.startY + event.translationY;
            }
        },
        onEnd: (event) => {
            // Eğer yeterince aşağı sürüklendiyse modalı kapat
            if (event.translationY > 100) {
                // Önce modalı kapat, sonra animasyonu tamamla
                runOnJS(onClose)();
            } else {
                // Yeteri kadar sürüklenmemişse eski konumuna geri getir
                translateY.value = withTiming(0, { duration: 200 });
            }
        },
    });

    // Animasyon stilini tanımla
    const animatedStyle = useAnimatedStyle(() => {
        return {
            transform: [{ translateY: translateY.value }],
        };
    });

    // Modal kapandığında translateY değerini sıfırla
    React.useEffect(() => {
        if (!visible) {
            translateY.value = 0;
        }
    }, [visible]);

    // Modal açıldığında veya kapandığında handler
    const onHandlerStateChange = (event) => {
        // Bu fonksiyonu boş bırakalım, tüm işlemleri onGestureEvent içinde yapacağız
    };

    return (
        <Modal
            animationType="slide"
            transparent={true}
            visible={visible}
            onRequestClose={onClose}
        >
            <TouchableOpacity
                style={styles.modalOverlay}
                activeOpacity={1}
                onPress={onClose}
            >
                <PanGestureHandler
                    onGestureEvent={onGestureEvent}
                    onHandlerStateChange={onHandlerStateChange}
                >
                    <Animated.View style={[styles.durationModalContainer, animatedStyle]}>
                        <TouchableOpacity activeOpacity={1} onPress={e => e.stopPropagation()}>
                            <View style={styles.durationModalContent}>
                                {/* Modal Handle */}
                                <View style={styles.modalHandle} />

                                {/* Mevcut modal içeriği */}
                                <Text style={styles.durationModalTitle}>Arka Plan Çizim Süresi</Text>
                                <Text style={styles.durationModalSubtitle}>
                                    Uygulamayı kapatıp başka işler yaparken bile haritada yollarınızı çizmeye devam edebilirsiniz.
                                </Text>

                                <View style={styles.featureExplanation}>
                                    <Ionicons name="checkmark-circle" size={20} color="#4CAF50" style={styles.featureIcon} />
                                    <Text style={styles.featureText}>
                                        Arka planda çalışır, uygulamayı kapatabilirsiniz
                                    </Text>
                                </View>

                                <View style={styles.featureExplanation}>
                                    <Ionicons name="checkmark-circle" size={20} color="#4CAF50" style={styles.featureIcon} />
                                    <Text style={styles.featureText}>
                                        Gittiğiniz tüm yollar otomatik olarak kaydedilir
                                    </Text>
                                </View>

                                <View style={styles.featureExplanation}>
                                    <Ionicons name="checkmark-circle" size={20} color="#4CAF50" style={styles.featureIcon} />
                                    <Text style={styles.featureText}>
                                        Belirlediğiniz süre dolduğunda otomatik durur
                                    </Text>
                                </View>

                                <Text style={styles.durationSelectTitle}>Ne kadar süre çizim yapılsın?</Text>

                                <View style={styles.durationOptionsContainer}>
                                    {durationOptions.map((option) => (
                                        <TouchableOpacity
                                            key={option.id}
                                            style={[
                                                styles.durationOption,
                                                selectedDuration === option.id && styles.selectedDurationOption
                                            ]}
                                            onPress={() => setSelectedDuration(option.id)}
                                        >
                                            <Text style={[
                                                styles.durationOptionText,
                                                selectedDuration === option.id && styles.selectedDurationOptionText
                                            ]}>
                                                {option.label}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>

                                <View style={styles.durationModalButtons}>
                                    <TouchableOpacity
                                        style={styles.durationModalCancelButton}
                                        onPress={onClose}
                                    >
                                        <Text style={styles.durationModalCancelButtonText}>İptal</Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        style={[
                                            styles.durationModalStartButton,
                                            !selectedDuration && styles.durationModalStartButtonDisabled
                                        ]}
                                        disabled={!selectedDuration}
                                        onPress={() => {
                                            const option = durationOptions.find(opt => opt.id === selectedDuration);
                                            if (option) {
                                                onStartDrawing(option.value);
                                            }
                                        }}
                                    >
                                        <Text style={styles.durationModalStartButtonText}>Başlat</Text>
                                    </TouchableOpacity>
                                </View>

                                <View style={styles.infoContainer}>
                                    <Ionicons name="warning-outline" size={20} color="#FF9800" />
                                    <Text style={styles.infoText}>
                                        Arka planda çizim, pil tüketimini artırabilir ve GPS kullanımı nedeniyle telefonunuzun ısınmasına neden olabilir. Gerektiğinde kapatmayı unutmayın.
                                    </Text>
                                </View>
                            </View>
                        </TouchableOpacity>
                    </Animated.View>
                </PanGestureHandler>
            </TouchableOpacity>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    durationModalContainer: {
        backgroundColor: 'white',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
    },
    durationModalContent: {
        padding: 24,
    },
    modalHandle: {
        width: 36,
        height: 4,
        backgroundColor: '#E0E0E0',
        borderRadius: 2,
        alignSelf: 'center',
        marginBottom: 20,
    },
    durationModalTitle: {
        fontSize: 22,
        fontWeight: '700',
        color: '#1A1A1A',
        marginBottom: 8,
    },
    durationModalSubtitle: {
        fontSize: 16,
        color: '#666666',
        marginBottom: 24,
        lineHeight: 22,
    },
    featureExplanation: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    featureIcon: {
        marginRight: 10,
    },
    featureText: {
        fontSize: 15,
        color: '#333333',
        flex: 1,
    },
    durationSelectTitle: {
        fontSize: 17,
        fontWeight: '600',
        color: '#333333',
        marginTop: 10,
        marginBottom: 16,
    },
    durationOptionsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        marginBottom: 24,
    },
    durationOption: {
        width: '48%',
        paddingVertical: 16,
        paddingHorizontal: 12,
        borderRadius: 12,
        backgroundColor: '#F5F5F5',
        alignItems: 'center',
        marginBottom: 12,
        borderWidth: 2,
        borderColor: 'transparent',
    },
    selectedDurationOption: {
        borderColor: '#4CAF50',
        backgroundColor: '#E8F5E9',
    },
    durationOptionText: {
        fontSize: 16,
        fontWeight: '500',
        color: '#333333',
    },
    selectedDurationOptionText: {
        color: '#4CAF50',
    },
    durationModalButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    durationModalCancelButton: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 12,
        backgroundColor: '#F5F5F5',
        alignItems: 'center',
        marginRight: 8,
    },
    durationModalCancelButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#666666',
    },
    durationModalStartButton: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 12,
        backgroundColor: '#4CAF50',
        alignItems: 'center',
        marginLeft: 8,
    },
    durationModalStartButtonDisabled: {
        backgroundColor: '#A5D6A7',
        opacity: 0.7,
    },
    durationModalStartButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    infoContainer: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        backgroundColor: '#FFF8E1',
        padding: 12,
        borderRadius: 8,
        borderLeftWidth: 4,
        borderLeftColor: '#FF9800',
    },
    infoText: {
        fontSize: 14,
        color: '#333333',
        marginLeft: 10,
        flex: 1,
        lineHeight: 20,
    },
});

export default DurationModal; 