// Konum izleme hassasiyeti için sabitler
export const LOCATION_ACCURACY = {
    HIGH: 6, // En yüksek hassasiyet
    BALANCED: 5, // Dengeli hassasiyet
    LOW_POWER: 4, // Düşük güç tüketimi
    PASSIVE: 1 // Pasif izleme
};

// Minimum mesafe eşiği (metre cinsinden)
export const MIN_DISTANCE_THRESHOLD = 10; // 10 metre

// Harita sabitleri
export const MAP_CONSTANTS = {
    DEFAULT_ZOOM: {
        latitudeDelta: 0.01,
        longitudeDelta: 0.01
    },
    MIN_ZOOM_LEVEL: 3,
    MAX_ZOOM_LEVEL: 20,
    CLUSTER_RADIUS: 50, // Kümeleme yarıçapı (piksel)
    MARKER_SIZE: {
        MIN: 24,
        MAX: 40
    }
};

// Konum doğruluk eşikleri
export const ACCURACY_THRESHOLDS = {
    EXCELLENT: 10, // 10 metre ve altı
    GOOD: 20, // 20 metre ve altı
    FAIR: 50, // 50 metre ve altı
    POOR: 100 // 100 metre ve üstü
};

// Konum güncelleme aralıkları (milisaniye)
export const UPDATE_INTERVALS = {
    REALTIME: 5000, // 5 saniye
    NORMAL: 10000, // 10 saniye
    BATTERY_SAVING: 30000 // 30 saniye
};

// Harita stilleri
export const MAP_TYPES = {
    STANDARD: 'standard',
    SATELLITE: 'satellite',
    HYBRID: 'hybrid'
};

// Marker tipleri ve renkleri
export const MARKER_TYPES = {
    NORMAL: {
        color: '#2C3E50',
        icon: 'location',
        size: 24
    },
    LIVE: {
        color: '#4CAF50',
        icon: 'radio-button-on',
        size: 24
    },
    SHARED: {
        color: '#2196F3',
        icon: 'location',
        size: 24
    },
    SELECTED: {
        color: '#FFC107',
        icon: 'bookmark',
        size: 24
    }
};

// Polyline stilleri
export const POLYLINE_STYLES = {
    NORMAL: {
        color: '#FF4B4B',
        width: 4
    },
    SELECTED: {
        color: '#4CAF50',
        width: 5
    },
    SHARED: {
        color: '#2196F3',
        width: 4
    }
}; 