import React, { useEffect } from "react";
import { View, StyleSheet, Image } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebaseConfig";

// Pantalla inicial: intenta entrar con sesion recordada.
export default function SplashScreen({ navigation }) {

  useEffect(() => {
    checkSavedSession();
  }, []);

  // Si hay credenciales guardadas, hace auto login; si falla, limpia datos.
  async function checkSavedSession() {
    try {
      const savedEmail = await AsyncStorage.getItem("userEmail");
      const savedPassword = await AsyncStorage.getItem("userPassword");

      await new Promise((resolve) => setTimeout(resolve, 1800));

      if (savedEmail && savedPassword) {
        await signInWithEmailAndPassword(auth, savedEmail, savedPassword);
        navigation.replace("MainTabs");
        return;
      }
    } catch (error) {
      await AsyncStorage.removeItem("userEmail");
      await AsyncStorage.removeItem("userPassword");
      console.log("Auto login falló:", error.code);
    }

    navigation.replace("Welcome");
  }

  return (
    <View style={styles.container}>
      <Image
        source={require("../assets/logo.png")}
        style={styles.logo}
        resizeMode="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff", // fondo blanco
    justifyContent: "center",
    alignItems: "center",
  },
  logo: {
    width: 300,
    height: 300,
  },
});
