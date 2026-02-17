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

  container: {

    flex: 1,

    padding: 20

  },

  name: {

    fontSize: 24,

    fontWeight: "bold"

  }

});
