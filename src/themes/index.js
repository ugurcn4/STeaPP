import { Platform } from 'react-native';

export const lightTheme = {
    background: '#FFFFFF',
    text: '#2C3E50',
    textSecondary: '#7F8C8D',
    cardBackground: '#FFFFFF',
    primary: '#4CAF50',
    secondary: '#2196F3',
    accent: '#FF9800',
    error: '#FF5252',
    success: '#4CAF50',
    warning: '#FFC107',
    info: '#2196F3',
    border: '#E0E0E0',
    shadow: {
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 16,
        marginVertical: 8,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.25,
                shadowRadius: 3.84,
            },
            android: {
                elevation: 5,
            },
        }),
    }
};

export const darkTheme = {
    background: '#121212',
    text: '#FFFFFF',
    textSecondary: '#B0B3B8',
    cardBackground: '#1E1E1E',
    primary: '#4CAF50',
    secondary: '#2196F3',
    accent: '#FF9800',
    error: '#FF5252',
    success: '#4CAF50',
    warning: '#FFC107',
    info: '#2196F3',
    border: '#2D2D2D',
    shadow: {
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    card: {
        backgroundColor: '#1E1E1E',
        borderRadius: 12,
        padding: 16,
        marginVertical: 8,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.25,
                shadowRadius: 3.84,
            },
            android: {
                elevation: 5,
            },
        }),
    }
}; 