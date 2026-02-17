import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import LoginRegister from "./Screens/LoginRegisterScreen";
import LoginScreen from "./Screens/LoginScreen";
import RegisterScreen from "./Screens/RegisterScreen";

import HomeScreen from "./Screens/HomeScreen";
import RestaurantDetailScreen from "./Screens/RestaurantDetailScreen";

const Stack = createNativeStackNavigator();

export default function App() {

  return (

    <NavigationContainer>

      <Stack.Navigator
        initialRouteName="Welcome"
        screenOptions={{ headerShown: false }}
      >

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

        <Stack.Screen
          name="Home"
          component={HomeScreen}
        />

        <Stack.Screen
          name="RestaurantDetail"
          component={RestaurantDetailScreen}
        />

      </Stack.Navigator>

    </NavigationContainer>

  );

}
