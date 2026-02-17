import React from "react";

import {
  View,
  Text,
  StyleSheet
} from "react-native";

export default function RestaurantDetailScreen({

  route

}) {

  const { restaurant } = route.params;

  return (

    <View style={styles.container}>

      <Text style={styles.name}>
        {restaurant.name}
      </Text>

      <Text>
        ⭐ {restaurant.rating}
      </Text>

      <Text>
        {restaurant.vicinity}
      </Text>

    </View>

  );

}

const styles = StyleSheet.create({

    cardContainer: {
    position: "absolute",
    bottom: 100,
    marginBottom: 100,
    left: 16,
    right: 16
  },


  name: {

    fontSize: 24,
    fontWeight: "bold"

  }
});
