import { StyleSheet, Dimensions, Platform, StatusBar } from 'react-native';

// Status bar yüksekliğini hesapla
const STATUSBAR_HEIGHT = Platform.OS === 'ios' ? 44 : StatusBar.currentHeight || 0;
const { width } = Dimensions.get('window');

// Ana renk paleti
const COLORS = {
    primary: '#6C63FF',       // Ana mor renk
    secondary: '#4D9DE0',     // Mavi
    accent: '#00C6CF',        // Turkuaz
    gradient1: '#6C63FF',     // Mor gradient başlangıç
    gradient2: '#4D9DE0',     // Mavi gradient orta
    gradient3: '#00C6CF',     // Turkuaz gradient bitiş
    dark: '#21295C',          // Koyu mavi
    light: '#F6F9FC',         // Açık arka plan
    lightGray: '#E9ECEF',     // Kenar, ayırıcı rengi
    text: '#21295C',          // Ana metin rengi
    textSecondary: '#626890', // İkincil metin rengi
    success: '#2DCE89',       // Başarılı, onay
    warning: '#FF9F43',       // Uyarı, bekleyen
    error: '#F5365C',         // Hata, iptal
    white: '#FFFFFF',
    shadowColor: '#8F9BB3',   // Gölge rengi
};

// Gölgeler ve stil değişkenleri
const SHADOWS = {
    small: {
        shadowColor: COLORS.shadowColor,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 2,
    },
    medium: {
        shadowColor: COLORS.shadowColor,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 5,
    },
    large: {
        shadowColor: COLORS.shadowColor,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.15,
        shadowRadius: 16,
        elevation: 8,
    },
};

// Neumorfik stil fonksiyonu
const createNeumorphicStyle = (bgColor = COLORS.light, elevation = 5) => ({
    backgroundColor: bgColor,
    borderRadius: 20,
    shadowColor: COLORS.shadowColor,
    shadowOffset: { width: -4, height: -4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation,
    borderWidth: 1,
    borderColor: `${COLORS.white}20`,
});

const FriendsPageStyles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.light,
        paddingTop: 0,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-start',
        paddingHorizontal: 16,
        paddingVertical: 16,
        paddingTop: STATUSBAR_HEIGHT + 10,
        backgroundColor: COLORS.white,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
        ...SHADOWS.medium,
        marginBottom: 12,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: COLORS.dark,
        letterSpacing: 0.3,
        flex: 1,
        textAlign: 'left',
    },
    headerTitleWithBack: {
        marginLeft: 8,
    },
    headerActions: {
        flexDirection: 'row',
        alignItems: 'center',
        marginLeft: 'auto',
    },
    headerButton: {
        width: 44,
        height: 44,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 12,
        backgroundColor: COLORS.light,
        ...SHADOWS.small,
    },
    backButton: {
        marginRight: 8,
        zIndex: 10,
    },
    badge: {
        position: 'absolute',
        top: -5,
        right: -5,
        backgroundColor: COLORS.error,
        borderRadius: 12,
        minWidth: 22,
        height: 22,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 4,
        borderWidth: 2,
        borderColor: COLORS.white,
    },
    badgeText: {
        color: COLORS.white,
        fontSize: 12,
        fontWeight: 'bold',
    },
    content: {
        flex: 1,
    },
    friendsListContainer: {
        padding: 16,
        paddingTop: 8,
        paddingBottom: 100,
    },
    listContainer: {
        flexGrow: 1,
    },
    friendCard: {
        ...createNeumorphicStyle(COLORS.white),
        padding: 16,
        marginBottom: 20,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderWidth: 0,
    },
    friendMainInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    profileImage: {
        width: 64,
        height: 64,
        borderRadius: 20,
        backgroundColor: COLORS.lightGray,
        borderWidth: 3,
        borderColor: COLORS.white,
        ...SHADOWS.small,
    },
    friendInfo: {
        marginLeft: 16,
        flex: 1,
        justifyContent: 'center',
    },
    friendNameContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    friendVerificationBadge: {
        marginLeft: 6,
    },
    friendName: {
        fontSize: 18,
        fontWeight: '700',
        color: COLORS.dark,
        marginBottom: 4,
        letterSpacing: 0.3,
    },
    activeShareContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: `${COLORS.success}15`,
        paddingVertical: 6,
        paddingHorizontal: 10,
        borderRadius: 12,
        alignSelf: 'flex-start',
        borderWidth: 1,
        borderColor: `${COLORS.success}30`,
    },
    activeShareText: {
        fontSize: 12,
        color: COLORS.success,
        marginLeft: 4,
        fontWeight: '600',
    },
    actionButtons: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    actionButton: {
        width: 44,
        height: 44,
        borderRadius: 16,
        overflow: 'hidden',
        ...SHADOWS.small,
    },
    actionButtonGradient: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    searchSection: {
        flex: 1,
        padding: 16,
        backgroundColor: COLORS.light,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.white,
        paddingHorizontal: 16,
        borderRadius: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: COLORS.lightGray,
        ...SHADOWS.small,
        height: 56,
    },
    searchInput: {
        flex: 1,
        paddingVertical: 12,
        marginLeft: 8,
        fontSize: 16,
        color: COLORS.text,
    },
    searchResultCard: {
        ...createNeumorphicStyle(COLORS.white, 3),
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        marginBottom: 16,
    },
    searchResultImage: {
        width: 56,
        height: 56,
        borderRadius: 18,
        borderWidth: 2,
        borderColor: COLORS.white,
        ...SHADOWS.small,
    },
    searchResultInfo: {
        flex: 1,
        justifyContent: 'center',
        marginLeft: 12,
    },
    searchResultNameContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    searchVerificationBadge: {
        marginLeft: 6,
    },
    searchResultName: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.text,
        marginBottom: 4,
    },
    searchResultEmail: {
        fontSize: 14,
        color: COLORS.textSecondary,
    },
    searchActionButton: {
        paddingVertical: 10,
        paddingHorizontal: 18,
        borderRadius: 14,
        minWidth: 110,
        alignItems: 'center',
        justifyContent: 'center',
    },
    searchActionButtonText: {
        color: COLORS.white,
        fontSize: 14,
        fontWeight: '600',
    },
    loader: {
        marginTop: 16,
    },
    requestsContainer: {
        flex: 1,
        backgroundColor: COLORS.light,
    },
    requestsContentContainer: {
        padding: 16,
    },
    requestsSection: {
        marginBottom: 24,
    },
    requestCard: {
        ...createNeumorphicStyle(COLORS.white, 3),
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        marginBottom: 16,
    },
    requestImage: {
        width: 60,
        height: 60,
        borderRadius: 18,
        borderWidth: 2,
        borderColor: COLORS.white,
        ...SHADOWS.small,
    },
    requestInfo: {
        flex: 1,
        marginLeft: 16,
    },
    requestName: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.text,
        marginBottom: 8,
    },
    requestButtons: {
        flexDirection: 'row',
        gap: 8,
    },
    requestButton: {
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 14,
    },
    emptyRequestsContainer: {
        ...createNeumorphicStyle(COLORS.white, 3),
        alignItems: 'center',
        padding: 32,
        borderRadius: 24,
        marginHorizontal: 16,
        marginTop: 16,
    },
    emptyRequestsText: {
        fontSize: 16,
        color: COLORS.textSecondary,
        marginTop: 12,
        textAlign: 'center',
    },
    sharingOptionsContainer: {
        ...createNeumorphicStyle(COLORS.white, 4),
        padding: 20,
        marginHorizontal: 16,
        marginTop: 16,
        marginBottom: 24,
        borderRadius: 24,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: COLORS.dark,
        marginBottom: 16,
    },
    friendChips: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginBottom: 20,
    },
    friendChip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.light,
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 14,
        marginRight: 10,
        marginBottom: 10,
        ...SHADOWS.small,
    },
    selectedChip: {
        backgroundColor: `${COLORS.primary}15`,
        borderColor: COLORS.primary,
        borderWidth: 1,
    },
    chipImage: {
        width: 30,
        height: 30,
        borderRadius: 10,
        marginRight: 8,
        borderWidth: 1,
        borderColor: COLORS.white,
    },
    chipText: {
        color: COLORS.text,
        fontSize: 14,
        fontWeight: '500',
    },
    sharingButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 8,
    },
    sharingButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 14,
        borderRadius: 16,
        marginHorizontal: 6,
        ...SHADOWS.small,
    },
    instantShareButton: {
        backgroundColor: COLORS.success,
    },
    liveShareButton: {
        backgroundColor: COLORS.primary,
    },
    sharingButtonText: {
        color: COLORS.white,
        fontWeight: '600',
        marginLeft: 8,
        fontSize: 15,
    },
    activeSharesSection: {
        ...createNeumorphicStyle(COLORS.white, 4),
        padding: 20,
        marginHorizontal: 16,
        marginTop: 16,
        borderRadius: 24,
    },
    shareCard: {
        borderRadius: 20,
        marginBottom: 20,
        overflow: 'hidden',
        ...SHADOWS.medium,
    },
    shareCardGradient: {
        padding: 20,
        borderRadius: 20,
    },
    shareHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    friendAvatar: {
        width: 56,
        height: 56,
        borderRadius: 18,
        borderWidth: 3,
        borderColor: 'rgba(255,255,255,0.5)',
        ...SHADOWS.small,
    },
    shareInfo: {
        flex: 1,
        marginLeft: 16,
    },
    username: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.8)',
        marginTop: 4,
    },
    shareDetails: {
        backgroundColor: 'rgba(255,255,255,0.9)',
        borderRadius: 16,
        padding: 16,
        marginTop: 12,
        ...SHADOWS.small,
    },
    shareTypeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        backgroundColor: `${COLORS.primary}20`,
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 12,
        alignSelf: 'flex-start',
    },
    shareTypeText: {
        marginLeft: 8,
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.primary,
    },
    locationInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    locationIconContainer: {
        width: 30,
        alignItems: 'center',
    },
    locationText: {
        marginLeft: 8,
        fontSize: 15,
        color: COLORS.text,
        flex: 1,
    },
    timeInfo: {
        marginTop: 12,
        borderTopWidth: 1,
        borderTopColor: 'rgba(0,0,0,0.05)',
        paddingTop: 12,
    },
    timeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    timeIconContainer: {
        width: 30,
        alignItems: 'center',
    },
    timeText: {
        marginLeft: 8,
        fontSize: 14,
        color: COLORS.textSecondary,
    },
    stopShareButton: {
        backgroundColor: COLORS.error,
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 16,
        marginTop: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        ...SHADOWS.small,
    },
    stopButtonText: {
        color: COLORS.white,
        fontWeight: '600',
        fontSize: 15,
        marginLeft: 8,
    },
    sharesContainer: {
        flex: 1,
        backgroundColor: COLORS.light,
    },
    sharesContentContainer: {
        padding: 16,
        paddingBottom: 100,
    },
    sharesSection: {
        marginBottom: 30,
    },
    quickShareSection: {
        marginBottom: 30,
    },
    emptyContainer: {
        ...createNeumorphicStyle(COLORS.white, 3),
        justifyContent: 'center',
        alignItems: 'center',
        padding: 32,
        borderRadius: 24,
        marginHorizontal: 16,
        marginTop: 16,
    },
    emptyText: {
        fontSize: 16,
        color: COLORS.textSecondary,
        textAlign: 'center',
        marginTop: 12,
    },
    shareName: {
        fontSize: 18,
        fontWeight: '600',
        color: COLORS.white,
    },
    shareType: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.8)',
    },
    emptyState: {
        alignItems: 'center',
        padding: 24,
    },
    emptyStateText: {
        fontSize: 16,
        color: COLORS.textSecondary,
        textAlign: 'center',
    },
    emptySharesContainer: {
        ...createNeumorphicStyle(COLORS.white, 3),
        alignItems: 'center',
        padding: 32,
        borderRadius: 24,
        marginHorizontal: 16,
        marginTop: 16,
    },
    emptySharesText: {
        fontSize: 18,
        fontWeight: '600',
        color: COLORS.dark,
        marginTop: 16,
    },
    emptySharesSubText: {
        fontSize: 15,
        color: COLORS.textSecondary,
        marginTop: 8,
        textAlign: 'center',
        lineHeight: 22,
    },
    quickShareCard: {
        ...createNeumorphicStyle(COLORS.white, 4),
        flexDirection: 'row',
        alignItems: 'center',
        padding: 20,
        marginBottom: 16,
    },
    quickShareIcon: {
        width: 56,
        height: 56,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
        backgroundColor: `${COLORS.primary}15`,
    },
    quickShareInfo: {
        flex: 1,
    },
    quickShareTitle: {
        fontSize: 17,
        fontWeight: '600',
        color: COLORS.dark,
        marginBottom: 6,
    },
    quickShareDescription: {
        fontSize: 14,
        color: COLORS.textSecondary,
        lineHeight: 20,
    },
    friendSelectContainer: {
        marginVertical: 20,
        marginBottom: 24,
    },
    subsectionTitle: {
        fontSize: 17,
        fontWeight: '600',
        color: COLORS.dark,
        marginBottom: 16,
    },
    friendSelectItem: {
        alignItems: 'center',
        marginRight: 20,
        opacity: 0.7,
    },
    selectedFriendItem: {
        opacity: 1,
    },
    friendSelectImage: {
        width: 60,
        height: 60,
        borderRadius: 20,
        marginBottom: 10,
        borderWidth: 3,
        borderColor: 'transparent',
        ...SHADOWS.small,
    },
    friendSelectName: {
        fontSize: 14,
        color: COLORS.text,
        textAlign: 'center',
        fontWeight: '500',
    },
    shareOptionsContainer: {
        marginTop: 24,
    },
    shareOption: {
        ...createNeumorphicStyle(COLORS.white, 3),
        flexDirection: 'row',
        alignItems: 'center',
        padding: 20,
        marginBottom: 16,
    },
    shareOptionInfo: {
        marginLeft: 16,
        flex: 1,
    },
    shareOptionTitle: {
        fontSize: 17,
        fontWeight: '600',
        color: COLORS.dark,
        marginBottom: 6,
    },
    shareOptionDescription: {
        fontSize: 14,
        color: COLORS.textSecondary,
        lineHeight: 20,
    },
    shareTypeSection: {
        marginBottom: 20,
    },
    shareTypeTitle: {
        fontSize: 17,
        fontWeight: '600',
        color: COLORS.dark,
        marginBottom: 16,
        marginTop: 20,
    },
    viewLocationButton: {
        position: 'absolute',
        right: 16,
        top: 16,
        borderRadius: 16,
        overflow: 'hidden',
        ...SHADOWS.medium,
    },
    viewButtonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 14,
    },
    viewButtonText: {
        color: COLORS.white,
        fontSize: 14,
        fontWeight: '600',
        marginLeft: 6,
    },
    viewLocationButtonContainer: {
        marginTop: 16,
        alignItems: 'center',
    },
    noSharesText: {
        fontSize: 16,
        color: COLORS.textSecondary,
        textAlign: 'center',
        marginTop: 16,
    },
    addFriendsSection: {
        marginTop: 30,
    },
    addOptionCard: {
        ...createNeumorphicStyle(COLORS.white, 4),
        flexDirection: 'row',
        alignItems: 'center',
        padding: 20,
        marginBottom: 16,
    },
    addOptionIcon: {
        width: 56,
        height: 56,
        borderRadius: 18,
        backgroundColor: `${COLORS.primary}15`,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    addOptionInfo: {
        flex: 1,
    },
    addOptionTitle: {
        fontSize: 17,
        fontWeight: '600',
        color: COLORS.dark,
        marginBottom: 6,
    },
    addOptionDescription: {
        fontSize: 14,
        color: COLORS.textSecondary,
        lineHeight: 20,
    },
    tipText: {
        fontSize: 14,
        color: COLORS.textSecondary,
        fontStyle: 'italic',
        textAlign: 'center',
        marginTop: 12,
        marginBottom: 20,
        lineHeight: 20,
    },
    cancelButton: {
        backgroundColor: COLORS.white,
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: COLORS.error,
        ...SHADOWS.small,
    },
    cancelButtonText: {
        color: COLORS.error,
        fontSize: 14,
        fontWeight: '600',
    },
    requestUsername: {
        fontSize: 14,
        color: COLORS.textSecondary,
        marginBottom: 8,
    },
    welcomeText: {
        fontSize: 24,
        fontWeight: '700',
        color: COLORS.dark,
        marginBottom: 24,
        textAlign: 'center',
    },
    tabContent: {
        flex: 1,
    },
    friendsList: {
        padding: 16,
    },
    addButton: {
        backgroundColor: COLORS.primary,
    },
    pendingButton: {
        backgroundColor: COLORS.warning,
    },
    friendButton: {
        backgroundColor: COLORS.success,
    },
    acceptButton: {
        backgroundColor: COLORS.success,
    },
    modernViewButton: {
        position: 'absolute',
        right: 16,
        top: 16,
        borderRadius: 16,
        overflow: 'hidden',
        ...SHADOWS.medium,
    },
    divider: {
        height: 1,
        backgroundColor: COLORS.lightGray,
        marginHorizontal: 16,
        marginVertical: 20,
    },
    searchResultsContainer: {
        paddingVertical: 10,
        flexGrow: 1
    },
});

export default FriendsPageStyles;