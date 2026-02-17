import React, { useEffect, useState } from "react";
import { View, StyleSheet, Text, Image, TouchableOpacity, Dimensions } from "react-native";
import MapView, { Marker } from "react-native-maps";
import * as Location from "expo-location";

import { getNearbyRestaurants } from "../Services/PlacesApi";

const { width } = Dimensions.get("window");
const CARD_HEIGHT = 160;

export default function MapScreen({ navigation }) {
  const [location, setLocation] = useState(null);
  const [restaurants, setRestaurants] = useState([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") return;

    const loc = await Location.getCurrentPositionAsync({});
    setLocation(loc.coords);

    const data = await getNearbyRestaurants(loc.coords.latitude, loc.coords.longitude);
    setRestaurants(data);
  }

  if (!location) return null;

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={{
          latitude: location.latitude,
          longitude: location.longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05
        }}
      >
        {/* Usuario */}
        <Marker
          coordinate={{ latitude: location.latitude, longitude: location.longitude }}
          pinColor="blue"
        />

        {/* Restaurantes */}
        {restaurants.map((r) => (
          <Marker
            key={r.id}
            coordinate={{
              latitude: r.location?.lat || location.latitude,
              longitude: r.location?.lng || location.longitude
            }}
            onPress={() => setSelectedRestaurant(r)}
          />
        ))}
      </MapView>

      {/* Tarjeta de restaurante */}
      {selectedRestaurant && (
        <View style={styles.cardContainer}>
          <View style={styles.card}>
            {selectedRestaurant.image && (
              <Image
                source={{ uri: selectedRestaurant.image }}
                style={styles.image}
              />
            )}
            <Text style={styles.name}>{selectedRestaurant.name}</Text>
            <Text>⭐ {selectedRestaurant.rating || "N/A"}</Text>
            <Text>{selectedRestaurant.address}</Text>

            <View style={styles.buttonsRow}>
              <TouchableOpacity
                style={[styles.button, { backgroundColor: "#ccc" }]}
                onPress={() => setSelectedRestaurant(null)}
              >
                <Text style={styles.buttonText}>Cerrar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, { backgroundColor: "#27AE60" }]}
                onPress={() =>
                  navigation.navigate("RestaurantDetail", { restaurant: selectedRestaurant })
                }
              >
                <Text style={styles.buttonText}>Detalles</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  cardContainer: {
    position: "absolute",
    bottom: 50,
    marginBottom:20,
    left: 16,
    right: 16
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 12,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5
  },
  image: {
    width: "100%",
    height: 140,
    borderRadius: 12,
    marginBottom: 8
  },
  name: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 4
  },
  buttonsRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 12
  },
  button: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginLeft: 8
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold"
  }
});
