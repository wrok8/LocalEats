import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image
} from "react-native";

export default function RestaurantCardVertical({ item, navigation }) {

  if (!item) return null;

  const handlePress = () => {

    navigation.navigate("RestaurantDetail", {
      restaurant: item
    });

  };

  return (
    <View style={styles.card}>

      <Image
        source={
          item.image
            ? { uri: item.image }
            : { uri: "https://via.placeholder.com/100" }
        }
        style={styles.image}
      />

      <View style={styles.infoContainer}>
        <Text style={styles.name} numberOfLines={1}>
          {item.name}
        </Text>

        <Text style={styles.location} numberOfLines={1}>
          📍 {item.address}
        </Text>

        <Text style={styles.rating}>
          ⭐ {item.rating || "N/A"}
        </Text>
      </View>

      <TouchableOpacity
        style={styles.button}
        onPress={handlePress}
      >
        <Text style={styles.buttonText}>
          Detalles
        </Text>
      </TouchableOpacity>

    </View>
  );
}

const styles = StyleSheet.create({

  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 12,
    marginBottom: 12,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },

  image: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: "#ddd"
  },

  infoContainer: {
    flex: 1,
    marginLeft: 12,
    justifyContent: "center"
  },

  name: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 4
  },

  location: {
    color: "#777",
    fontSize: 13,
    marginBottom: 4
  },

  rating: {
    color: "#444",
    fontSize: 14
  },

  button: {
    backgroundColor: "#27AE60",
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 12,
    marginLeft: 10
  },

  buttonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 14
  }

});
