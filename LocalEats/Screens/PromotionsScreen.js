import React from "react";
import { View, Text, StyleSheet } from "react-native";

export default function PromotionsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>🔥 Promociones</Text>
      <Text style={styles.subtitle}>
        Aquí podrás crear promociones y descuentos.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f7f7f7"
  },
  title: {
    fontSize: 26,
    fontWeight: "bold"
  },
  subtitle: {
    marginTop: 10,
    color: "#666",
    textAlign: "center",
    paddingHorizontal: 20
  }
});