import { StyleSheet, Platform } from 'react-native';

const HomePageStyles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F6FA',
    },
    header: {
        backgroundColor: '#fff',
        padding: 24,
        paddingTop: 60,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 5,
    },
    profileSection: {
        marginBottom: 10,
    },
    greetingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    welcomeTextContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
        maxWidth: '80%', // Container'ın maksimum genişliğini sınırla
    },
    welcomeText: {
        fontSize: 24,
        fontWeight: '600',
        color: '#1a1a1a',
        letterSpacing: 0.5,
    },
    emailText: {
        fontSize: 13,
        color: '#666',
        marginTop: 4,
        letterSpacing: 0.2,
    },
    profileButton: {
        padding: 6,
    },
    avatarOuterContainer: {
        width: 60,
        height: 60,
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
    },
    waveContainer: {
        position: 'absolute',
        width: '150%',
        height: '150%',
        borderRadius: 35,
        overflow: 'hidden',
    },
    wave: {
        position: 'absolute',
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(76, 175, 80, 0.15)',
        borderRadius: 35,
        transform: [{ scale: 1.3 }],
    },
    wave2: {
        backgroundColor: 'rgba(76, 175, 80, 0.1)',
        transform: [{ scale: 1.2 }, { rotate: '45deg' }],
    },
    avatarContainer: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#4CAF50',
        shadowOffset: {
            width: 0,
            height: 3,
        },
        shadowOpacity: 0.3,
        shadowRadius: 6,
        elevation: 5,
        overflow: 'hidden',
        borderWidth: 3,
        borderColor: '#4CAF50',
        zIndex: 1,
    },
    avatarImage: {
        width: '100%',
        height: '100%',
        borderRadius: 30,
    },
    backgroundImage: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        opacity: 0.1,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
    },
    content: {
        padding: 20,
        paddingBottom: 80,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 25,
        padding: 20,
        marginVertical: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 5,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.05)',
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: '800',
        marginBottom: 15,
        color: '#2C3E50',
        letterSpacing: 0.5,
    },
    cardRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f8f9fa',
        padding: 12,
        borderRadius: 15,
    },
    cardContent: {
        fontSize: 15,
        color: '#34495E',
        marginLeft: 10,
        flex: 1,
    },
    button: {
        backgroundColor: '#3498DB', // Modern mavi ton
        padding: 18,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        shadowColor: '#3498DB',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 8,
        width: '100%',
    },
    buttonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    goalContainer: {
        backgroundColor: '#fff',
        padding: 20,
        borderRadius: 25,
        alignItems: 'center',
        marginHorizontal: 20,
        marginVertical: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 5,
    },
    goalTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: '#2C3E50',
        marginBottom: 0,
        letterSpacing: 0.5,
        lineHeight: 24,
    },
    goalProgress: {
        fontSize: 16,
        color: '#34495E',
        marginTop: 10,
        fontWeight: '600',
    },
    motivationContainer: {
        margin: 20,
        padding: 20,
        backgroundColor: '#3498DB',
        borderRadius: 25,
        alignItems: 'center',
        shadowColor: '#3498DB',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 5,
    },
    motivationText: {
        fontSize: 16,
        color: '#2C3E50',
        textAlign: 'center',
        lineHeight: 22,
        fontWeight: '500',
        opacity: 1
    },
    weatherCard: {
        borderRadius: 25,
        overflow: 'hidden',
        marginBottom: 20,
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    weatherGradient: {
        padding: 20,
    },
    weatherContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    weatherMainInfo: {
        flex: 1,
    },
    weatherLocationContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    locationIcon: {
        marginRight: 5,
    },
    weatherLocation: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    weatherTemp: {
        color: '#fff',
        fontSize: 48,
        fontWeight: 'bold',
        marginVertical: 5,
    },
    weatherDescription: {
        color: '#fff',
        fontSize: 16,
        textTransform: 'capitalize',
        opacity: 0.9,
    },
    weatherIconContainer: {
        padding: 10,
    },
    weatherMainIcon: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
    },
    weatherDetailsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 20,
        paddingTop: 20,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.2)',
    },
    weatherDetailItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    weatherDetailText: {
        color: '#fff',
        marginLeft: 8,
        fontSize: 14,
        opacity: 0.9,
    },
    statsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 20,
    },
    statCard: {
        backgroundColor: '#fff',
        padding: 15,
        borderRadius: 20,
        alignItems: 'center',
        width: '30%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    statIconContainer: {
        padding: 10,
        borderRadius: 15,
        backgroundColor: '#F5F6FA',
        marginBottom: 8,
    },
    statNumber: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#2C3E50',
    },
    statLabel: {
        fontSize: 12,
        color: '#95A5A6',
        marginTop: 4,
    },
    goalCard: {
        backgroundColor: '#fff',
        padding: 20,
        borderRadius: 25,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
        position: 'relative',
        zIndex: 1,
    },
    goalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
    },
    streakContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF5F5',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    streakText: {
        marginLeft: 6,
        color: '#FF6B6B',
        fontWeight: '600',
        fontSize: 14,
    },
    goalStats: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginTop: 15,
        paddingTop: 15,
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
    },
    goalStat: {
        alignItems: 'center',
    },
    goalStatValue: {
        fontSize: 18,
        fontWeight: '700',
        color: '#2C3E50',
    },
    goalStatLabel: {
        fontSize: 12,
        color: '#95A5A6',
        marginTop: 4,
    },
    confettiContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 10,
        pointerEvents: 'none',
    },
    confetti: {
        width: '100%',
        height: '100%',
    },
    quickAccessContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        marginBottom: 20,
    },
    quickAccessCard: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 12,
        marginBottom: 16,
        width: '31%',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    quickAccessIcon: {
        width: 40,
        height: 40,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    quickAccessTitle: {
        fontSize: 12,
        fontWeight: '600',
        color: '#2C3E50',
        textAlign: 'center',
    },
    motivationCard: {
        backgroundColor: '#fff',
        borderRadius: 15,
        padding: 20,
        marginVertical: 10,
        marginHorizontal: 20,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 3.84,
        elevation: 5,
        minHeight: 80,
        justifyContent: 'center',
        alignItems: 'center'
    },
    aiRecommendCard: {
        marginVertical: 16,
        borderRadius: 20,
        overflow: 'hidden',
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        height: 100,
    },
    aiCardGradient: {
        flex: 1,
        padding: 16,
    },
    aiCardContent: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    aiCardLeft: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
    },
    aiCardTextContainer: {
        flex: 1,
        marginLeft: 12,
        justifyContent: 'center',
    },
    aiCardTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#FFF',
        marginBottom: 4,
    },
    messageContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        height: 40,
    },
    aiCardSubtitle: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.9)',
        fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
        flex: 1,
    },
    aiIconContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        minWidth: 50,
    },
    pulseCircle: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#4CAF50',
        marginLeft: 8,
        shadowColor: '#4CAF50',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 4,
        elevation: 5,
    },
    cursor: {
        color: '#FFF',
        fontSize: 14,
        marginLeft: 2,
        marginTop: -2,
    },
    aiCardIcon: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 12,
    },
    goalTitleContainer: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        position: 'relative',
        zIndex: 9999,
    },
    infoButton: {
        padding: 0,
        marginLeft: 4,
        height: 24,
        marginTop: 2,
        justifyContent: 'center',
        alignItems: 'center',
    },
    tooltipContainer: {
        position: 'absolute',
        top: 40,
        left: 0,
        backgroundColor: '#FFF',
        borderRadius: 12,
        padding: 0,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
        zIndex: 9999,
        width: 280,
    },
    tooltipArrow: {
        position: 'absolute',
        top: -8,
        left: 20,
        width: 0,
        height: 0,
        backgroundColor: 'transparent',
        borderStyle: 'solid',
        borderLeftWidth: 8,
        borderRightWidth: 8,
        borderBottomWidth: 8,
        borderLeftColor: 'transparent',
        borderRightColor: 'transparent',
        borderBottomColor: '#FFF',
        transform: [{ translateY: -1 }],
    },
    tooltipContent: {
        padding: 15,
    },
    tooltipHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
        paddingBottom: 8,
        marginBottom: 10,
    },
    tooltipTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#2C3E50',
        marginBottom: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
        paddingBottom: 8,
    },
    tooltipSection: {
        marginTop: 8,
    },
    tooltipSubtitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#34495E',
        marginBottom: 4,
    },
    tooltipText: {
        fontSize: 12,
        color: '#7F8C8D',
        marginBottom: 2,
        lineHeight: 18,
    },
    closeButton: {
        padding: 4,
    },
    tooltipOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'transparent',
        zIndex: 9998,
    },
});

export default HomePageStyles; 