import { Tabs } from 'expo-router';
import { View, StyleSheet, Animated, TouchableOpacity, Platform, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import React, { useRef, useEffect } from 'react';

const SCREEN_WIDTH = Dimensions.get('window').width;

function CustomTabBar({ state, descriptors, navigation }) {
  const animatedValues = useRef(
    state.routes.map(() => new Animated.Value(0))
  ).current;

  useEffect(() => {
    const animations = state.routes.map((_, i) =>
      Animated.spring(animatedValues[i], {
        toValue: i === state.index ? 1 : 0,
        useNativeDriver: true,
        stiffness: 150,
        damping: 15,
        mass: 1
      })
    );
    
    Animated.parallel(animations).start();
  }, [state.index]);

  const renderIcon = (route, isFocused) => {
    let iconName;
    if (route.name === 'analytics') {
      iconName = isFocused ? 'stats-chart' : 'stats-chart-outline';
    } else if (route.name === 'index') {
      iconName = isFocused ? 'home' : 'home-outline';
    } else if (route.name === 'menu') {
      iconName = isFocused ? 'grid' : 'grid-outline';
    } else if (route.name === 'entries') {
      iconName = isFocused ? 'list' : 'list-outline';
    }
    return iconName;
  };

  // Filter routes to only show the three main tabs
  const visibleRoutes = state.routes.filter(route => 
    ['index', 'analytics', 'menu', 'entries'].includes(route.name)
  );

  return (
    <View style={styles.tabBarWrapper}>
      <Animated.View style={styles.tabBar}>
        <View style={styles.tabBarContent}>
          {visibleRoutes.map((route, index) => {
            const isFocused = state.index === state.routes.findIndex(r => r.key === route.key);
            const iconName = renderIcon(route, isFocused);

            const scale = animatedValues[state.routes.findIndex(r => r.key === route.key)].interpolate({
              inputRange: [0, 1],
              outputRange: [0.88, 1],
            });

            const translateY = animatedValues[state.routes.findIndex(r => r.key === route.key)].interpolate({
              inputRange: [0, 1],
              outputRange: [0, -10],
            });

            const opacity = animatedValues[state.routes.findIndex(r => r.key === route.key)].interpolate({
              inputRange: [0, 1],
              outputRange: [0.7, 1],
            });

            return (
              <TouchableOpacity
                key={route.key}
                style={[
                  styles.tabItem,
                  index === 1 && { marginHorizontal: SCREEN_WIDTH * 0.05 }
                ]}
                onPress={() => {
                  const event = navigation.emit({
                    type: 'tabPress',
                    target: route.key,
                    canPreventDefault: true,
                  });

                  if (!isFocused && !event.defaultPrevented) {
                    Animated.sequence([
                      Animated.timing(animatedValues[state.routes.findIndex(r => r.key === route.key)], {
                        toValue: 0.9,
                        duration: 100,
                        useNativeDriver: true,
                      }),
                      Animated.spring(animatedValues[state.routes.findIndex(r => r.key === route.key)], {
                        toValue: 1,
                        stiffness: 150,
                        damping: 15,
                        mass: 1,
                        useNativeDriver: true,
                      }),
                    ]).start();
                    navigation.navigate(route.name);
                  }
                }}
                activeOpacity={0.9}
              >
                <Animated.View
                  style={[
                    styles.iconContainer,
                    isFocused && styles.activeIconContainer,
                    {
                      transform: [
                        { scale },
                        { translateY }
                      ],
                      opacity
                    },
                  ]}
                >
                  <Ionicons
                    name={iconName}
                    size={28}
                    color={isFocused ? '#000000' : '#FFFFFF'}
                    style={[
                      styles.icon,
                      isFocused && styles.activeIcon
                    ]}
                  />
                </Animated.View>
              </TouchableOpacity>
            );
          })}
        </View>
      </Animated.View>
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
      }}
      tabBar={props => <CustomTabBar {...props} />}
    >
      <Tabs.Screen 
        name="index" 
        options={{
          href: "/"
        }}
      />
      <Tabs.Screen 
        name="analytics" 
        options={{
          href: null
        }}
      />
      <Tabs.Screen 
        name="menu" 
        options={{
          href: null
        }}
      />
      <Tabs.Screen 
        name="entries" 
        options={{
          href: "/entries",
          title: "Entries",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="list-outline" size={size} color={color} />
          )
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBarWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 90,
    paddingHorizontal: 16,
    paddingBottom: Platform.OS === 'ios' ? 25 : 15,
  },
  tabBar: {
    flex: 1,
    backgroundColor: 'rgba(22, 22, 22, 0.95)',
    borderRadius: 30,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 12,
  },
  tabBarContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  tabItem: {
    height: 60,
    width: 60,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 30,
  },
  iconContainer: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  activeIconContainer: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2.5,
    borderColor: 'rgba(22, 22, 22, 0.95)',
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 8,
  },
  icon: {
    zIndex: 1,
    opacity: 0.65,
  },
  activeIcon: {
    opacity: 1,
    transform: [{ scale: 1.05 }]
  },
});