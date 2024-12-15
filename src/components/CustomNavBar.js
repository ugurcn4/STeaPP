import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { HomePage, FriendsPage, MapPage, SettingsPage } from '../screens';
import { Ionicons } from '@expo/vector-icons'; // İkonlar için

const Tab = createBottomTabNavigator();

const CustomNavBar = () => {
    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                tabBarIcon: ({ focused, color, size }) => {
                    let iconName;

                    if (route.name === 'Ana Sayfa') {
                        iconName = focused ? 'home' : 'home-outline';
                    } else if (route.name === 'Harita') {
                        iconName = focused ? 'map' : 'map-outline';
                    } else if (route.name === 'Arkadaşlar') {
                        iconName = focused ? 'people' : 'people-outline';
                    } else if (route.name === 'Ayarlar') {
                        iconName = focused ? 'settings' : 'settings-outline';
                    }

                    // İkon bileşenini döndür
                    return <Ionicons name={iconName} size={size} color={color} />;
                },
                tabBarActiveTintColor: '#EFAC1A',
                tabBarInactiveTintColor: 'gray',
                tabBarStyle: {
                    backgroundColor: '#ffffff',
                    paddingBottom: 10,
                    height: 70,
                    borderTopWidth: 0,
                    elevation: 10,
                },
                tabBarLabelStyle: {
                    fontSize: 12,
                    fontWeight: 'bold',
                },
                tabBarIconStyle: {
                    size: 24,
                },
                tabBarItemStyle: {
                    paddingVertical: 5,
                },
                headerShown: false,
            })}
        >
            <Tab.Screen name="Ana Sayfa" component={HomePage} />
            <Tab.Screen name="Harita" component={MapPage} />
            <Tab.Screen name="Arkadaşlar" component={FriendsPage} />
            <Tab.Screen name="Ayarlar" component={SettingsPage} />
        </Tab.Navigator>
    );
}

export default CustomNavBar;