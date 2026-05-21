import React, { useEffect } from "react";
import { View, StyleSheet, Image } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebaseConfig";
import { logAudit } from "../Logs/FileManager";

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
      await logAudit({
        action: "Se consultaron credenciales guardadas",
        storage: "AsyncStorage",
        target: "userEmail,userPassword",
        detail: savedEmail && savedPassword ? "credenciales encontradas" : "sin credenciales",
      });

      await new Promise((resolve) => setTimeout(resolve, 1800));

      if (savedEmail && savedPassword) {
        const credential = await signInWithEmailAndPassword(auth, savedEmail, savedPassword);
        await logAudit({
          action: "Auto login con credenciales recordadas",
          storage: "Firebase Auth",
          target: "auth/session",
          detail: `correo: ${savedEmail}`,
          userId: credential.user.uid,
        });
        navigation.replace("MainTabs");
        return;
      }
    } catch (error) {
      await AsyncStorage.removeItem("userEmail");
      await AsyncStorage.removeItem("userPassword");
      await logAudit({
        action: "Se limpiaron credenciales por error de auto login",
        storage: "AsyncStorage",
        target: "userEmail,userPassword",
        detail: error.code || error.message,
      });
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
