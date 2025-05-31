import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { HomePage, FriendsPage, MapPage, SettingsPage, ActivitiesScreen } from '../screens';
import { Ionicons } from '@expo/vector-icons';
import { View, StyleSheet, Text, Platform } from 'react-native';

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
                    } else if (route.name === 'Akış') {
                        iconName = focused ? 'flame' : 'flame-outline';
                    } else if (route.name === 'Ayarlar') {
                        iconName = focused ? 'settings' : 'settings-outline';
                    }

                    return (
                        <View style={[
                            styles.iconContainer,
                            focused ? styles.activeIconContainer : null
                        ]}>
                            <Ionicons name={iconName} size={focused ? 24 : 22} color={color} />
                            {route.name === 'Ayarlar' && (
                                <View style={styles.newBadgeContainer}>
                                    <Text style={styles.newBadgeText}>Yeni</Text>
                                </View>
                            )}
                        </View>
                    );
                },
                tabBarActiveTintColor: '#000000',
                tabBarInactiveTintColor: '#9E9E9E',
                tabBarStyle: {
                    backgroundColor: '#ffffff',
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    elevation: 8,
                    height: Platform.OS === 'ios' ? 85 : 65,
                    shadowColor: '#000',
                    shadowOffset: {
                        width: 0,
                        height: 2,
                    },
                    shadowOpacity: 0.1,
                    shadowRadius: 4,
                    borderTopWidth: 1,
                    borderTopColor: '#f0f0f0',
                    paddingHorizontal: 5,
                    paddingBottom: Platform.OS === 'ios' ? 22 : 8,
                    paddingTop: 3,
                },
                tabBarItemStyle: {
                    paddingVertical: 6,
                    height: 46,
                    alignItems: 'center',
                    justifyContent: 'center',
                },
                tabBarLabelStyle: {
                    fontSize: 11,
                    marginTop: 2,
                    marginBottom: Platform.OS === 'ios' ? 4 : 2,
                },
                headerShown: false,
                tabBarShowLabel: true,
            })}
        >
            <Tab.Screen name="Ana Sayfa" component={HomePage} />
            <Tab.Screen name="Harita" component={MapPage} />
            <Tab.Screen name="Arkadaşlar" component={FriendsPage} />
            <Tab.Screen name="Akış" component={ActivitiesScreen} />
            <Tab.Screen name="Ayarlar" component={SettingsPage} />
        </Tab.Navigator>
    );
}

const styles = StyleSheet.create({
    iconContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        width: 48,
        height: 30,
        borderRadius: 15,
        marginTop: 5,
    },
    activeIconContainer: {
        backgroundColor: 'rgba(0, 0, 0, 0.1)',
    },
    newBadgeContainer: {
        position: 'absolute',
        top: -4,
        right: -8,
        backgroundColor: 'red',
        borderRadius: 6,
        paddingHorizontal: 4,
        paddingVertical: 1,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'white',
    },
    newBadgeText: {
        color: 'white',
        fontSize: 8,
        fontWeight: 'bold',
    }
});

export default CustomNavBar;