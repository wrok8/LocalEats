import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

/* SCREENS */
import SplashScreen from "./Screens/SplashScreen";
import LoginRegister from "./Screens/LoginRegisterScreen";
import LoginScreen from "./Screens/LoginScreen";
import RegisterScreen from "./Screens/RegisterScreen";
import RestaurantDetailScreen from "./Screens/RestaurantDetailScreen";
import NearbyScreen from "./Screens/NearbyScreen";
import TopRatedScreen from "./Screens/TopRatedScreen";
import PreferencesScreen from "./Screens/PreferencesScreen";

/* TABS */
import BottomTabs from "./navigation/BottomTabs";

const Stack = createNativeStackNavigator();

export default function App() {

  return (
    <NavigationContainer>

      <Stack.Navigator
        initialRouteName="Splash"
        screenOptions={{ headerShown: false }}
      >

        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="Welcome" component={LoginRegister} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />

        {/* MAIN APP */}
        <Stack.Screen name="MainTabs" component={BottomTabs} />

        {/* OTRAS */}
        <Stack.Screen name="RestaurantDetail" component={RestaurantDetailScreen} />
        <Stack.Screen name="NearbyScreen" component={NearbyScreen} />
        <Stack.Screen name="TopRatedScreen" component={TopRatedScreen} />

        <Stack.Screen name="Preferences" component={PreferencesScreen} />

      </Stack.Navigator>

    </NavigationContainer>
  );
}