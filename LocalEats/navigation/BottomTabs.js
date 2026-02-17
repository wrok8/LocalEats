import React, { useEffect, useRef } from "react"; // 👈 IMPORTANTE
import { View, Image, StyleSheet, Animated } from "react-native"; 
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";

import HomeScreen from "../Screens/HomeScreen";
import MapScreen from "../Screens/MapScreen";
import ProfileScreen from "../Screens/ProfileScreen";

const Tab = createBottomTabNavigator();

// Animated Tab Icon
function AnimatedTabIcon({ focused, activeIcon, inactiveIcon }) {
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(focused ? 1 : 0.6)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, {
        toValue: focused ? 1.2 : 1,
        friction: 4,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: focused ? 1 : 0.6,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  }, [focused]);

  return (
    <Animated.View style={{ transform: [{ scale }], opacity }}>
      <Image
        source={focused ? activeIcon : inactiveIcon}
        style={styles.icon}
        resizeMode="contain"
      />
    </Animated.View>
  );
}

export default function BottomTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: false,

        tabBarStyle: styles.tabBar,
        tabBarItemStyle: { overflow: "visible" },
        tabBarBackground: () => <View style={{ flex: 1, overflow: "visible" }} />,

        tabBarIcon: ({ focused }) => {
          let activeIcon;
          let inactiveIcon;

          if (route.name === "Home") {
            activeIcon = require("../assets/IconHouseGreen.png");
            inactiveIcon = require("../assets/IconHouseGray.png");
          }
          if (route.name === "Map") {
            activeIcon = require("../assets/IconMapsGreen.png");
            inactiveIcon = require("../assets/IconMapsGray.png");
          }
          if (route.name === "Profile") {
            activeIcon = require("../assets/IconProfileGreen.png");
            inactiveIcon = require("../assets/IconProfileGray.png");
          }

          return (
            <View style={styles.iconContainer}>
              <AnimatedTabIcon
                focused={focused}
                activeIcon={activeIcon}
                inactiveIcon={inactiveIcon}
              />
            </View>
          );
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Map" component={MapScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: "absolute",
    bottom: 0,
    left: 20,
    right: 20,
    height: 70,
    backgroundColor: "#fff",
    borderRadius: 35,
    borderTopWidth: 0,
  },

  iconContainer: {
    justifyContent: "center",
    alignItems: "center",
  },

  icon: {
    marginTop: 25,
    width: 58,
    height: 38,
  },
});
