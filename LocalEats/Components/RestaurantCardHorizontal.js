import React from "react";
import { View, Text, Image, StyleSheet, TouchableOpacity, Dimensions } from "react-native";

const { width } = Dimensions.get("window");

export default function RestaurantCardHorizontal({ item, navigation }) {

  if (!item) return null;

  const handlePress = () => {
    navigation.getParent()?.navigate("RestaurantDetail", { restaurant: item });
  };

  return (
    <TouchableOpacity style={styles.card} onPress={handlePress}>
      <Image
        source={
          item.image
            ? { uri: item.image }
            : { uri: "https://via.placeholder.com/150" }
        }
        style={styles.image}
      />
      <View style={styles.infoContainer}>
        <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.rating}>⭐ {item.rating || "N/A"}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: width * 0.6,
    marginRight: 16,
    marginTop:20,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  image: { width: "100%", height: 120 },
  infoContainer: { padding: 12 },
  name: { fontSize: 16, fontWeight: "bold", marginBottom: 4 },
  rating: { fontSize: 14, color: "#444" }
});
