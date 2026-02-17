import React from "react";
import { View, Text, FlatList, SafeAreaView, StyleSheet } from "react-native";
import RestaurantCardVertical from "../Components/RestaurantCardVertical";

export default function TopRatedScreen({ route, navigation }) {
  const { restaurants } = route.params;

  // Ordenamos por rating
  const sortedRestaurants = restaurants
    .slice()
    .sort((a, b) => (b.rating || 0) - (a.rating || 0));

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Mejor Valorados</Text>

      <FlatList
        data={sortedRestaurants}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <RestaurantCardVertical item={item} navigation={navigation} />
        )}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 20 }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f2f2f2" },
  title: { fontSize: 22, fontWeight: "bold", margin: 16 },
});
