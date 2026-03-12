import React, { useEffect } from "react";
import { View, StyleSheet, Image } from "react-native";

export default function SplashScreen({ navigation }) {

  useEffect(() => {
    setTimeout(() => {
      navigation.replace("Welcome");
    }, 2500);
  }, []);

  return (
    <View style={styles.container}>
      <Image
        source={require("../assets/splash.png")}
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