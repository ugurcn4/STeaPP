import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import CustomNavBar from '../components/CustomNavBar';
import NotificationPage from '../screens/SettingsPageScreens/NotificationPage';
import NotificationsListScreen from '../screens/NotificationsListScreen';
import PermissionsPage from '../screens/SettingsPageScreens/PermissionsPage';
import PrivacyPage from '../screens/SettingsPageScreens/PrivacyPage';
import HelpSupportPage from '../screens/SettingsPageScreens/HelpSupportPage';
import AboutPage from '../screens/SettingsPageScreens/AboutPage';
import InviteFriendsPage from '../screens/SettingsPageScreens/InviteFriendsPage';
import NearbyRestaurants from '../screens/HomePageCards/NearbyRestaurants';
import NearbyHotels from '../screens/HomePageCards/NearbyHotels';
import NearbyAttractions from '../screens/HomePageCards/NearbyAttractions';
import PhotosPage from '../screens/PhotosPage';
import AIRecommendationsScreen from '../screens/AIRecommendationsScreen';
import AIChatScreen from '../screens/AIChatScreen';
import { useSelector } from 'react-redux';
import StoryView from '../screens/StoryView';
import ActivitiesScreen from '../screens/ActivitiesScreen';
import ChatScreen from '../screens/ChatScreen';
import ImageViewer from '../screens/ImageViewer';
import CityExplorer from '../screens/CityExplorer';
import { createStackNavigator, CardStyleInterpolators } from '@react-navigation/stack';
import DirectMessagesScreen from '../screens/DirectMessagesScreen';
import QRCodeScreen from '../screens/QRCodeScreen';
import StoryEditor from '../screens/StoryEditor';
import UpdatesPage from '../screens/SettingsPageScreens/UpdatesPage';
import { OnboardingScreen } from '../screens';
import CreatePostScreen from '../screens/CreatePostScreen';
import CreatePostDetails from '../screens/CreatePostDetails';
import ImageEditor from '../screens/ImageEditor';
import LikedPostsScreen from '../screens/LikedPostsScreen';
import LikedByScreen from '../screens/LikedByScreen';
import MapPage from '../screens/MapPage';

const Stack = createNativeStackNavigator();

const MessagesStack = createStackNavigator();

const MessagesNavigator = () => {
    return (
        <MessagesStack.Navigator
            screenOptions={{
                headerShown: false,
                cardStyle: { backgroundColor: '#fff' },
                presentation: 'card',
                gestureEnabled: false,
            }}
        >
            <MessagesStack.Screen
                name="MessagesHome"
                component={DirectMessagesScreen}
            />
            <MessagesStack.Screen
                name="Chat"
                component={ChatScreen}
                options={{
                    presentation: 'card',
                    animationEnabled: true,
                    gestureEnabled: false,
                    cardStyle: { backgroundColor: '#EEE7DD' },
                    fullScreenGestureEnabled: false,
                }}
            />
        </MessagesStack.Navigator>
    );
};

const MainStack = () => {
    const theme = useSelector((state) => state.theme.theme);

    return (
        <Stack.Navigator
            screenOptions={{
                headerShown: false
            }}
        >
            <Stack.Screen name="MainTabs" component={CustomNavBar} />
            <Stack.Screen
                name="NearbyRestaurants"
                component={NearbyRestaurants}
            />
            <Stack.Screen
                name="NearbyHotels"
                component={NearbyHotels}
            />
            <Stack.Screen
                name="NearbyAttractions"
                component={NearbyAttractions}
            />
            <Stack.Screen
                name="Bildirimler"
                component={NotificationPage}
            />
            <Stack.Screen
                name="BildirimListesi"
                component={NotificationsListScreen}
                options={{
                    headerShown: true,
                    title: 'Bildirimler',
                    headerBackTitleVisible: false,
                }}
            />
            <Stack.Screen
                name="Izinler"
                component={PermissionsPage}
            />
            <Stack.Screen
                name="Gizlilik"
                component={PrivacyPage}
            />
            <Stack.Screen
                name="YardimDestek"
                component={HelpSupportPage}
            />
            <Stack.Screen
                name="Hakkinda"
                component={AboutPage}
            />
            <Stack.Screen
                name="Arkadaşlarımı Davet Et"
                component={InviteFriendsPage}
            />
            <Stack.Screen
                name="Fotoğraflar"
                component={PhotosPage}
            />
            <Stack.Screen
                name="AIRecommendations"
                component={AIRecommendationsScreen}
            />
            <Stack.Screen
                name="AIChat"
                component={AIChatScreen}
                options={{
                    headerShown: false
                }}
            />
            <Stack.Screen
                name="StoryView"
                component={StoryView}
                options={{ headerShown: false }}
            />
            <Stack.Screen
                name="Activities"
                component={ActivitiesScreen}
                options={{ headerShown: false }}
            />
            <Stack.Screen
                name="DirectMessages"
                component={MessagesNavigator}
                options={{
                    headerShown: false,
                    gestureEnabled: true,
                    gestureDirection: 'horizontal',
                    cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
                    transitionSpec: {
                        open: {
                            animation: 'spring',
                            config: {
                                stiffness: 1000,
                                damping: 500,
                                mass: 3,
                                overshootClamping: true,
                                restDisplacementThreshold: 0.01,
                                restSpeedThreshold: 0.01,
                            }
                        },
                        close: {
                            animation: 'spring',
                            config: {
                                stiffness: 1000,
                                damping: 500,
                                mass: 3,
                                overshootClamping: true,
                                restDisplacementThreshold: 0.01,
                                restSpeedThreshold: 0.01,
                            }
                        },
                    },
                }}
            />
            <Stack.Screen
                name="ImageViewer"
                component={ImageViewer}
                options={{
                    headerShown: false,
                    presentation: 'modal',
                    cardStyle: { backgroundColor: 'black' }
                }}
            />
            <Stack.Screen
                name="QRCode"
                component={QRCodeScreen}
                options={{
                    presentation: 'card',
                    animationEnabled: true,
                    cardStyleInterpolator: CardStyleInterpolators.forVerticalIOS,
                }}
            />
            <Stack.Screen
                name="CityExplorer"
                component={CityExplorer}
                options={{ headerShown: false }}
            />
            <Stack.Screen
                name="StoryEditor"
                component={StoryEditor}
                options={{ headerShown: false }}
            />
            <Stack.Screen
                name="Updates"
                component={UpdatesPage}
                options={{ headerShown: false }}
            />
            <Stack.Screen
                name="Onboarding"
                component={OnboardingScreen}
            />
            <Stack.Screen
                name="CreatePost"
                component={CreatePostScreen}
                options={{
                    headerShown: false,
                    animation: 'slide_from_right'
                }}
            />
            <Stack.Screen
                name="CreatePostDetails"
                component={CreatePostDetails}
                options={{
                    headerShown: false,
                    animation: 'slide_from_right'
                }}
            />
            <Stack.Screen
                name="ImageEditor"
                component={ImageEditor}
                options={{
                    headerShown: false,
                    presentation: 'modal'
                }}
            />
            <Stack.Screen
                name="LikedPosts"
                component={LikedPostsScreen}
                options={{ headerShown: false }}
            />
            <Stack.Screen
                name="LikedBy"
                component={LikedByScreen}
                options={{
                    headerShown: false,
                    presentation: 'transparentModal',
                    cardStyle: { backgroundColor: 'transparent' },
                    cardOverlayEnabled: true
                }}
            />
        </Stack.Navigator>
    );

};

export default MainStack; 