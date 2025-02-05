import { withSpring, withTiming, Easing } from 'react-native-reanimated';

export const SPRING_CONFIG = {
    damping: 15,
    mass: 1,
    stiffness: 120,
    overshootClamping: false,
    restDisplacementThreshold: 0.01,
    restSpeedThreshold: 0.01
};

export const TIMING_CONFIG = {
    duration: 300,
    easing: Easing.bezier(0.25, 0.1, 0.25, 1)
};

export const slideInUp = (value) => {
    'worklet';
    return withSpring(value, SPRING_CONFIG);
};

export const fadeIn = (value) => {
    'worklet';
    return withTiming(value, TIMING_CONFIG);
};

export const scaleIn = (value) => {
    'worklet';
    return withSpring(value, {
        ...SPRING_CONFIG,
        stiffness: 200
    });
};

export const rotateIn = (value) => {
    'worklet';
    return withSpring(value, {
        ...SPRING_CONFIG,
        damping: 20
    });
};

export const MARKER_SPRING = {
    damping: 12,
    mass: 1,
    stiffness: 150
};

export const pulseAnimation = (value) => {
    'worklet';
    return withSpring(value, {
        ...SPRING_CONFIG,
        damping: 3,
        mass: 0.5,
        stiffness: 200
    });
};

export const dropAnimation = (value) => {
    'worklet';
    return withSpring(value, {
        ...SPRING_CONFIG,
        damping: 20,
        mass: 1.2,
        stiffness: 250
    });
};

export const pathAnimation = (value) => {
    'worklet';
    return withTiming(value, {
        duration: 1000,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1)
    });
}; 