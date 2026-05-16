import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

export default function ImgTop({ title }) {
  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[
          "rgba(10, 65, 38, 0.97)",
          "rgba(39, 174, 96, 0.93)",
          "rgba(255, 185, 73, 0.78)",
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.decorCircle1} />
        <View style={styles.decorCircle2} />

        <Text style={styles.appName}>LocalEats</Text>
        <Text
          style={styles.title}
          numberOfLines={1}
          adjustsFontSizeToFit
          minFontScale={0.78}
        >
          {title}
        </Text>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    height: 0,
  },

  header: {
    width: "100%",
    height: 120,
    paddingTop: 42,
    alignItems: "center",
    overflow: "hidden",
    position: "relative",
  },

  decorCircle1: {
    position: "absolute",
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: "rgba(255,255,255,0.06)",
    top: -60,
    right: -50,
  },

  decorCircle2: {
    position: "absolute",
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: "rgba(255,255,255,0.06)",
    bottom: -40,
    left: -30,
  },

  appName: {
    color: "rgba(255,255,255,0.78)",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1,
    textTransform: "uppercase",
    zIndex: 2,
  },

  title: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "900",
    marginTop: 6,
    textAlign: "center",
    zIndex: 2,
  },
});
