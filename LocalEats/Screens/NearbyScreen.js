import React from "react";
import { View, FlatList, StyleSheet } from "react-native";
import RestaurantCardVertical from "../Components/RestaurantCardVertical";

export default function NearbyScreen({ navigation, route }) {
  // Recibimos los restaurantes pasados desde HomeScreen
  const { restaurants } = route.params;

  return (
    <View style={styles.container}>
      <FlatList
        data={restaurants} // todos los cercanos
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <RestaurantCardVertical
            item={item}
            navigation={navigation}
          />
        )}
        contentContainerStyle={{ padding: 16 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f2f2f2" }
});
