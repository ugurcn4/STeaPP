import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { HomePage, FriendsPage, MapPage, SettingsPage, ActivitiesScreen } from '../screens';
import { Ionicons } from '@expo/vector-icons';
import { View, StyleSheet, Text } from 'react-native';

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
                    } else if (route.name === 'Etkinlikler') {
                        iconName = focused ? 'flame' : 'flame-outline';
                    } else if (route.name === 'Ayarlar') {
                        iconName = focused ? 'settings' : 'settings-outline';
                    }

                    return (
                        <View style={[
                            styles.iconContainer,
                            focused ? styles.activeIconContainer : null
                        ]}>
                            <Ionicons name={iconName} size={focused ? 32 : 26} color={color} />
                            {route.name === 'Ayarlar' && (
                                <View style={styles.newBadgeContainer}>
                                    <Text style={styles.newBadgeText}>Yeni</Text>
                                </View>
                            )}
                        </View>
                    );
                },
                tabBarActiveTintColor: '#2E64FE',
                tabBarInactiveTintColor: '#9E9E9E',
                tabBarStyle: {
                    backgroundColor: '#ffffff',
                    position: 'absolute',
                    bottom: 20,
                    left: 20,
                    right: 20,
                    elevation: 8,
                    borderRadius: 30,
                    height: 80,
                    shadowColor: '#000',
                    shadowOffset: {
                        width: 0,
                        height: 6,
                    },
                    shadowOpacity: 0.15,
                    shadowRadius: 10,
                    borderTopWidth: 0,
                    paddingHorizontal: 10,
                    alignItems: 'center',
                    justifyContent: 'center',
                },
                tabBarItemStyle: {
                    paddingVertical: 12,
                    height: 60,
                    alignItems: 'center',
                    justifyContent: 'center',
                },
                tabBarLabelStyle: {
                    display: 'none',
                },
                headerShown: false,
            })}
        >
            <Tab.Screen name="Ana Sayfa" component={HomePage} />
            <Tab.Screen name="Harita" component={MapPage} />
            <Tab.Screen name="Arkadaşlar" component={FriendsPage} />
            <Tab.Screen name="Etkinlikler" component={ActivitiesScreen} />
            <Tab.Screen name="Ayarlar" component={SettingsPage} />
        </Tab.Navigator>
    );
}

const styles = StyleSheet.create({
    iconContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        width: 60,
        height: 60,
        borderRadius: 30,
        marginTop: 7,
    },
    activeIconContainer: {
        backgroundColor: 'rgba(46, 100, 254, 0.15)',
    },
    newBadgeContainer: {
        position: 'absolute',
        bottom: -3,
        backgroundColor: 'red',
        borderRadius: 6,
        paddingHorizontal: 6,
        paddingVertical: 2,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'white',
    },
    newBadgeText: {
        color: 'white',
        fontSize: 9,
        fontWeight: 'bold',
    }
});

export default CustomNavBar;