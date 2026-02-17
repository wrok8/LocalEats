import React from "react";

import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Image
} from "react-native";

import { Ionicons } from "@expo/vector-icons";

export default function RestaurantCardHorizontal({
  item,
  navigation
}) {

  return (

    <Pressable
      style={styles.card}
      onPress={() =>
        navigation.navigate(
          "RestaurantDetail",
          { restaurant: item }
        )
      }
    >

      {/* IMAGEN */}
      <Image
        source={{
          uri:
            item.image ||
            "https://via.placeholder.com/400x300.png?text=No+Image"
        }}
        style={styles.image}
      />

      {/* INFO */}
      <View style={styles.infoContainer}>

        {/* NOMBRE */}
        <Text
          style={styles.name}
          numberOfLines={1}
        >
          {item.name}
        </Text>

        {/* UBICACION */}
        <View style={styles.row}>

          <Ionicons
            name="location"
            size={14}
            color="#27AE60"
          />

          <Text
            style={styles.address}
            numberOfLines={1}
          >
            {item.address || "Sin dirección"}
          </Text>

        </View>

        {/* ESTRELLAS */}
        <View style={styles.row}>

          <Ionicons
            name="star"
            size={14}
            color="#FFD700"
          />

          <Text style={styles.rating}>
            {item.rating
              ? item.rating.toFixed(1)
              : "N/A"}
          </Text>

        </View>

      </View>

    </Pressable>

  );

}

const styles = StyleSheet.create({

  card: {

    width: 220,
    backgroundColor: "white",
    borderRadius: 16,
    marginRight: 16,
    marginTop: 20,
    marginBottom: 5,
    overflow: "hidden",
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 5,
    shadowOffset: {
      width: 0,
      height: 2
    }
  },

  image: {
    width: "100%",
    height: 140
  },

  infoContainer: {
    padding: 12
  },

  name: {

    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 4
  },

  address: {

    fontSize: 13,
    color: "#666",
    marginLeft: 4,
    flex: 1
  },

  rating: {

    fontSize: 13,
    marginLeft: 4,
    fontWeight: "bold"
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2
  }

});
