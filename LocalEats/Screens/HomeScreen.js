import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  ImageBackground,
  SafeAreaView
} from "react-native";

import * as Location from "expo-location";
import ImgTop from '../Components/ImageTop';

import { getNearbyRestaurants } from "../Services/PlacesApi";

import RestaurantCardHorizontal from "../Components/RestaurantCardHorizontal";
import RestaurantCardVertical from "../Components/RestaurantCardVertical";

export default function HomeScreen({ navigation }) {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);

  const HORIZONTAL_LIMIT = 5; // solo mostrar 5 cercanos
  const VERTICAL_LIMIT = 5;   // solo mostrar 5 mejores valorados

  useEffect(() => {
    loadRestaurants();
  }, []);

  async function loadRestaurants() {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        alert("Permiso de ubicación requerido");
        setLoading(false);
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const data = await getNearbyRestaurants(
        location.coords.latitude,
        location.coords.longitude
      );

      // Agregamos distancia aproximada al usuario para filtrar más cercanos
      const withDistance = data.map(r => ({
        ...r,
        distance: getDistance(
          location.coords.latitude,
          location.coords.longitude,
          r.location?.lat,
          r.location?.lng
        )
      }));

      setRestaurants(withDistance);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  }

  // Calcula distancia en metros
  function getDistance(lat1, lng1, lat2, lng2) {
    if (!lat2 || !lng2) return 99999;
    const toRad = x => (x * Math.PI) / 180;
    const R = 6371e3; // metros
    const φ1 = toRad(lat1);
    const φ2 = toRad(lat2);
    const Δφ = toRad(lat2 - lat1);
    const Δλ = toRad(lng2 - lng1);
    const a =
      Math.sin(Δφ/2) * Math.sin(Δφ/2) +
      Math.cos(φ1) * Math.cos(φ2) *
      Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#27AE60" />
      </View>
    );
  }

  // Restaurantes cercanos (ordenados por distancia)
  const nearbyRestaurants = restaurants
    .sort((a, b) => a.distance - b.distance)
    .slice(0, HORIZONTAL_LIMIT);

  // Restaurantes top valorados
  const topRatedRestaurants = [...restaurants]
    .sort((a, b) => (b.rating || 0) - (a.rating || 0))
    .slice(0, VERTICAL_LIMIT);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <ImageBackground
          source={require("../assets/FondoInicio.png")}
          style={styles.background}
          imageStyle={styles.backgroundImage}
        >
          <ImgTop title="Inicio" />

          {/* SEARCH */}
          <View style={styles.searchContainer}>
            <TextInput
              placeholder="¿Qué deseas comer?"
              placeholderTextColor="#999"
              style={styles.search}
            />
          </View>

          {/* CERCA DE TI */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionTextContainer}>
              <Text style={styles.sectionTitleWhite}>Cerca de ti</Text>
              <Text style={styles.sectionSubtitleWhite}>
                Los restaurantes más cercanos a ti
              </Text>
            </View>

            <TouchableOpacity
              style={styles.verMasButton}
              onPress={() =>
                navigation.navigate("NearbyScreen", { restaurants })
              }
            >
              <Text style={styles.verMasButtonText}>Mirar más</Text>
            </TouchableOpacity>
          </View>

          {/* LISTA HORIZONTAL */}
          <FlatList
            horizontal
            data={nearbyRestaurants}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <RestaurantCardHorizontal
                item={item}
                navigation={navigation}
              />
            )}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingLeft: 16, paddingBottom: 20 }}
          />
        </ImageBackground>

        {/* FILTROS */}
        <View style={styles.filtersContainer}>
          <FilterButton title="Precio" />
          <FilterButton title="Categoría" />
          <FilterButton title="Calificación" />
        </View>

        {/* RESTAURANTES TOP */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Mejor Valorados</Text>

          <TouchableOpacity
            onPress={() =>
              navigation.navigate("TopRatedScreen", { restaurants })
            }
          >
            <Text style={styles.verMas}>Ver más</Text>
          </TouchableOpacity>
        </View>

        {/* LISTA VERTICAL */}
        <FlatList
          data={topRatedRestaurants}
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
          renderItem={({ item }) => (
            <RestaurantCardVertical
              item={item}
              navigation={navigation}
            />
          )}
          contentContainerStyle={{ paddingHorizontal: 16 }}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

function FilterButton({ title }) {
  return (
    <TouchableOpacity style={styles.filterButton}>
      <Text style={styles.filterText}>{title}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f2f2f2" },
  loading: { flex: 1, justifyContent: "center", alignItems: "center" },
  searchContainer: { padding: 16 },
  search: {
    backgroundColor: "white",
    padding: 14,
    borderRadius: 12,
    marginTop: 120,
    fontSize: 16
  },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, marginTop: 0 },
  sectionTitle: { fontSize: 18, fontWeight: "bold" },
  sectionCard: { backgroundColor: "white", marginHorizontal: 16, marginTop: 0, padding: 16, borderRadius: 16, flexDirection: "row", justifyContent: "space-between", alignItems: "center", shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 3 },
  sectionTextContainer: { flex: 1 },
  verMasButton: { backgroundColor: "#ffffff", paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 3 },
  verMasButtonText: { color: "#27AE60", fontWeight: "bold" },
  filtersContainer: { flexDirection: "row", justifyContent: "space-around", marginVertical: 16 },
  filterButton: { backgroundColor: "#ffffff", paddingVertical: 10, paddingHorizontal: 26, borderRadius: 20, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 3 },
  filterText: { color: "#27AE60", fontWeight: "bold" },
  verMas: { color: "#27AE60", fontWeight: "bold" }
});
