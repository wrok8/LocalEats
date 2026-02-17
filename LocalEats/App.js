import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

/* SCREENS */
import LoginRegister from "./Screens/LoginRegisterScreen";
import LoginScreen from "./Screens/LoginScreen";
import RegisterScreen from "./Screens/RegisterScreen";
import RestaurantDetailScreen from "./Screens/RestaurantDetailScreen";

/* BOTTOM TABS */
import BottomTabs from "./navigation/BottomTabs";

const Stack = createNativeStackNavigator();

export default function App() {

  return (

    <NavigationContainer>

      <Stack.Navigator
        initialRouteName="Welcome"
        screenOptions={{ headerShown: false }}
      >

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

        {/* Tabs principales (AQUI ESTA LA NAVBAR) */}
        <Stack.Screen
          name="MainTabs"
          component={BottomTabs}
        />

        {/* Detalle restaurante */}
        <Stack.Screen
          name="RestaurantDetail"
          component={RestaurantDetailScreen}
        />

      </Stack.Navigator>

    </NavigationContainer>

  );

}
