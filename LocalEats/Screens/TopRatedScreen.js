import React, { useState, useEffect } from "react";
import {
  View,
  FlatList,
  StyleSheet,
  TextInput,
  ImageBackground
} from "react-native";

import RestaurantCardVertical from "../Components/RestaurantCardVertical";
import ImgTop from "../Components/ImageTop";

export default function TopRatedScreen({ navigation, route }) {

  const { restaurants } = route.params;

  const sortedRestaurants =
    [...restaurants].sort(
      (a, b) => (b.rating || 0) - (a.rating || 0)
    );

  const [searchText, setSearchText] = useState("");
  const [filteredRestaurants, setFilteredRestaurants] =
    useState(sortedRestaurants);

  useEffect(() => {
    filterRestaurants(searchText);
  }, [searchText]);

  function filterRestaurants(text) {

    if (!text) {
      setFilteredRestaurants(sortedRestaurants);
      return;
    }

    const filtered = sortedRestaurants.filter(r =>
      r.name?.toLowerCase().includes(text.toLowerCase()) ||
      r.vicinity?.toLowerCase().includes(text.toLowerCase())
    );

    setFilteredRestaurants(filtered);
  }

  return (

    <View style={styles.container}>
      <ImageBackground
              source={require("../assets/FondoInicio.png")}
              style={styles.background}
              imageStyle={styles.backgroundImage}
            />
      
            <ImgTop title="Mejores valorados" />
      
            <View style={styles.searchContainer}>
              <TextInput
                  placeholder="Buscar restaurante..."
                  placeholderTextColor="#999"
                  style={styles.search}
                  value={searchText}
                   onChangeText={setSearchText}
            />
            </View>

      <FlatList
        data={filteredRestaurants}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <RestaurantCardVertical
            item={item}
            navigation={navigation}
          />
        )}
        contentContainerStyle={{
          padding: 16,
          paddingBottom: 100
        }}
        showsVerticalScrollIndicator={false}
      />

    </View>

  );

}

const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: "#f2f2f2"
  },

  searchContainer: {
    padding: 16
  },

  search: {
    backgroundColor: "white",
    padding: 14,
    borderRadius: 12,
    marginTop: 120,
    fontSize: 16
  }

});
