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

                    return <Ionicons name={iconName} size={size} color={color} />;
                },
                tabBarActiveTintColor: '#1A73E8',
                tabBarInactiveTintColor: '#757575',
                tabBarStyle: {
                    backgroundColor: '#ffffff',
                    position: 'absolute',
                    bottom: 20,
                    left: 20,
                    right: 20,
                    elevation: 4,
                    borderRadius: 25,
                    height: 65,
                    shadowColor: '#000',
                    shadowOffset: {
                        width: 0,
                        height: 4,
                    },
                    shadowOpacity: 0.1,
                    shadowRadius: 8,
                    borderTopWidth: 0,
                },
                tabBarItemStyle: {
                    paddingVertical: 8,
                },
                tabBarLabelStyle: {
                    display: 'none', // İkon altındaki yazıları kaldır
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