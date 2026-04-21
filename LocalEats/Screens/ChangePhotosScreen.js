import React from "react";
import { View, Text, StyleSheet } from "react-native";

export default function ChangePhotosScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>📷 Cambiar fotos</Text>
      <Text style={styles.subtitle}>
        Próximamente podrás subir varias imágenes.
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
    color: "#666"
  }
});