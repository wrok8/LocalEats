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

/* BOTTOM TABS */
import BottomTabs from "./navigation/BottomTabs";

const Stack = createNativeStackNavigator();

export default function App() {

  return (

    <NavigationContainer>

      <Stack.Navigator
        initialRouteName="Splash"
        screenOptions={{ headerShown: false }}
      >

        {/* Splash Screen */}
        <Stack.Screen
          name="Splash"
          component={SplashScreen}
        />

        {/* Pantalla inicial */}
        <Stack.Screen
          name="Welcome"
          component={LoginRegister}
        />

        {/* Login */}
        <Stack.Screen
          name="Login"
          component={LoginScreen}
        />

        {/* Registro */}
        <Stack.Screen
          name="Register"
          component={RegisterScreen}
        />

        {/* Tabs principales*/}
        <Stack.Screen
          name="MainTabs"
          component={BottomTabs}
        />

        {/* Detalle restaurante */}
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

      </Stack.Navigator>

    </NavigationContainer>

  );

}