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
import CreateRestaurantScreen from "./Screens/CreateRestaurantScreen";
import AdminRestaurantRequestsScreen from "./Screens/AdminRestaurantRequestsScreen";
import ReviewScreen from "./Screens/ReviewScreen";
import ProfileScreen from "./Screens/ProfileScreen";
import AnalyticsScreen from "./Screens/AnalyticsScreen";

/* NUEVAS SCREENS */
import FavoritesScreen from "./Screens/FavoritesScreen";
import MyRestaurantScreen from "./Screens/MyRestaurantScreen";
import EditRestaurantScreen from "./Screens/EditRestaurantScreen";
import ChangePhotosScreen from "./Screens/ChangePhotosScreen";

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
        {/* AUTH */}
        <Stack.Screen
          name="Splash"
          component={SplashScreen}
        />

        <Stack.Screen
          name="Welcome"
          component={LoginRegister}
        />

        <Stack.Screen
          name="Login"
          component={LoginScreen}
        />

        <Stack.Screen
          name="Register"
          component={RegisterScreen}
        />

        {/* MAIN APP */}
        <Stack.Screen
          name="MainTabs"
          component={BottomTabs}
        />

        {/* GENERALES */}
        <Stack.Screen
          name="RestaurantDetail"
          component={RestaurantDetailScreen}
        />

        <Stack.Screen
          name="NearbyScreen"
          component={NearbyScreen}
        />

        <Stack.Screen
          name="TopRatedScreen"
          component={TopRatedScreen}
        />

        <Stack.Screen
          name="CreateRestaurant"
          component={CreateRestaurantScreen}
        />

        <Stack.Screen
          name="ProfileScreen"
          component={ProfileScreen}
        />

        <Stack.Screen
          name="Preferences"
          component={PreferencesScreen}
        />

        <Stack.Screen
          name="AdminRequests"
          component={AdminRestaurantRequestsScreen}
        />

        <Stack.Screen
          name="ReviewScreen"
          component={ReviewScreen}
        />

        {/* DASHBOARD OWNER */}
        <Stack.Screen
          name="Analytics"
          component={AnalyticsScreen}
        />

        <Stack.Screen
          name="Favorites"
          component={FavoritesScreen}
        />

        <Stack.Screen
          name="MyRestaurant"
          component={MyRestaurantScreen}
        />

        <Stack.Screen
          name="EditRestaurant"
          component={EditRestaurantScreen}
        />

        <Stack.Screen
          name="ChangePhotos"
          component={ChangePhotosScreen}
        />

      </Stack.Navigator>
    </NavigationContainer>
  );
}