import React, { useEffect, useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  ImageBackground
} from "react-native";

import * as Location from "expo-location";
import { SafeAreaView } from "react-native-safe-area-context";

import ImgTop from "../Components/ImageTop";
import { getNearbyRestaurants } from "../Services/PlacesApi";

import RestaurantCardHorizontal from "../Components/RestaurantCardHorizontal";
import RestaurantCardVertical from "../Components/RestaurantCardVertical";

export default function HomeScreen({ navigation }) {

  const [restaurants, setRestaurants] = useState([]);
  const [sortedRestaurants, setSortedRestaurants] = useState([]);
  const [userLocation, setUserLocation] = useState(null);
  const [loading, setLoading] = useState(true);

  const [searchText, setSearchText] = useState("");
  const [filteredRestaurants, setFilteredRestaurants] = useState([]);

  /* =============================
     CARGAR RESTAURANTES
  ==============================*/

  useEffect(() => {
    loadRestaurants();
  }, []);

  useEffect(() => {
    if (userLocation && restaurants.length > 0) {
      sortRestaurantsByDistance();
    }
  }, [userLocation, restaurants]);

  /* =============================
     FILTRO DE BUSQUEDA
  ==============================*/

  useEffect(() => {

    if (!searchText.trim()) {

      const topRated =
        [...restaurants]
          .sort((a, b) => (b.rating || 0) - (a.rating || 0))
          .slice(0, 5);

      setFilteredRestaurants(topRated);

      return;
    }

    const filtered = restaurants.filter(r => {

      const name =
        r.name?.toLowerCase() || "";

      const address =
        r.vicinity?.toLowerCase() || "";

      const types =
        r.types?.join(" ").toLowerCase() || "";

      const search =
        searchText.toLowerCase();

      return (
        name.includes(search) ||
        address.includes(search) ||
        types.includes(search)
      );

    });

    setFilteredRestaurants(filtered);

  }, [searchText, restaurants]);

  /* =============================
     OBTENER UBICACION Y API
  ==============================*/

  async function loadRestaurants() {

    try {

      const { status } =
        await Location.requestForegroundPermissionsAsync();

      if (status !== "granted") {

        alert("Permiso de ubicación requerido");
        setLoading(false);
        return;

      }

      const location =
        await Location.getCurrentPositionAsync({});

      const coords = {

        latitude: location.coords.latitude,
        longitude: location.coords.longitude

      };

      setUserLocation(coords);

      const data =
        await getNearbyRestaurants(
          coords.latitude,
          coords.longitude
        );

      setRestaurants(data);

    } catch (error) {

      console.log(error);

    } finally {

      setLoading(false);

    }

  }

  /* =============================
     CALCULAR DISTANCIA
  ==============================*/

  function getDistance(lat1, lon1, lat2, lon2) {

    const R = 6371;

    const dLat =
      (lat2 - lat1) * Math.PI / 180;

    const dLon =
      (lon2 - lon1) * Math.PI / 180;

    const a =
      Math.sin(dLat / 2) *
      Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) *
      Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

    const c =
      2 * Math.atan2(
        Math.sqrt(a),
        Math.sqrt(1 - a)
      );

    return R * c;

  }

  /* =============================
     ORDENAR POR DISTANCIA
  ==============================*/

  function sortRestaurantsByDistance() {

    const sorted =
      restaurants
        .map(r => {

          if (!r.location) return r;

          const distance =
            getDistance(
              userLocation.latitude,
              userLocation.longitude,
              r.location.lat,
              r.location.lng
            );

          return {
            ...r,
            distance
          };

        })
        .sort(
          (a, b) =>
            (a.distance || 0) -
            (b.distance || 0)
        );

    setSortedRestaurants(sorted);

  }

  /* =============================
     LOADING
  ==============================*/

  if (loading) {

    return (

      <View style={styles.loading}>

        <ActivityIndicator
          size="large"
          color="#27AE60"
        />

      </View>

    );

  }

  /* =============================
     LISTAS
  ==============================*/

  const topRatedRestaurants =
    [...restaurants]
      .sort(
        (a, b) =>
          (b.rating || 0) -
          (a.rating || 0)
      )
      .slice(0, 5);

  const nearbyRestaurants =
    sortedRestaurants.slice(0, 5);

  /* =============================
     UI
  ==============================*/

  return (

    <SafeAreaView
      style={styles.container}
      edges={["bottom"]}
    >

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: 80
        }}
      >

        {/* HEADER */}
        <ImageBackground
          source={require("../assets/FondoInicio.png")}
          style={styles.background}
        >

          <ImgTop title="Inicio" />

          {/* BUSCADOR */}
          <View style={styles.searchContainer}>

            <TextInput
              placeholder="¿Qué deseas comer?"
              placeholderTextColor="#999"
              style={styles.search}
              value={searchText}
              onChangeText={setSearchText}
            />

          </View>

          {/* CERCA DE TI */}
          <View style={styles.sectionCard}>

            <View style={styles.sectionTextContainer}>

              <Text style={styles.sectionTitleWhite}>
                Cerca de ti
              </Text>

              <Text style={styles.sectionSubtitleWhite}>
                Los restaurantes más cercanos
              </Text>

            </View>

            <TouchableOpacity
              style={styles.verMasButton}
              onPress={() =>
                navigation.navigate(
                  "NearbyScreen",
                  {
                    restaurants:
                      sortedRestaurants
                  }
                )
              }
            >

              <Text style={styles.verMasButtonText}>
                Mirar más
              </Text>

            </TouchableOpacity>

          </View>

          {/* HORIZONTAL */}
          <FlatList
            horizontal
            data={nearbyRestaurants}
            keyExtractor={item => item.id}
            renderItem={({ item }) => (

              <RestaurantCardHorizontal
                item={item}
                navigation={navigation}
              />

            )}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{
              paddingLeft: 16,
              paddingBottom: 20
            }}
          />

        </ImageBackground>

        {/* FILTROS */}
        <View style={styles.filtersContainer}>

          <FilterButton title="Precio" />
          <FilterButton title="Categoría" />
          <FilterButton title="Calificación" />

        </View>

        {/* HEADER RESTAURANTES */}
        <View style={styles.sectionHeader}>

          <Text style={styles.sectionTitle}>
            Restaurantes
          </Text>

          <TouchableOpacity
            onPress={() =>
              navigation.navigate(
                "TopRatedScreen",
                { restaurants }
              )
            }
          >

            <Text style={styles.verMas}>
              Ver más
            </Text>

          </TouchableOpacity>

        </View>

        {/* RESULTADOS */}
        <FlatList
          data={
            searchText
              ? filteredRestaurants
              : topRatedRestaurants
          }
          keyExtractor={item => item.id}
          scrollEnabled={false}
          renderItem={({ item }) => (

            <RestaurantCardVertical
              item={item}
              navigation={navigation}
            />

          )}
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingBottom: 20
          }}
        />

      </ScrollView>

    </SafeAreaView>

  );

}

/* FILTRO */
function FilterButton({ title }) {

  return (

    <TouchableOpacity style={styles.filterButton}>

      <Text style={styles.filterText}>
        {title}
      </Text>

    </TouchableOpacity>

  );

}

/* ESTILOS */
const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: "#f2f2f2"
  },

  loading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center"
  },

  searchContainer: {
    padding: 16
  },

  search: {
    backgroundColor: "white",
    padding: 14,
    borderRadius: 12,
    marginTop: 120,
    fontSize: 16,
    elevation: 3
  },

  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold"
  },

  sectionTitleWhite: {
    fontSize: 18,
    fontWeight: "bold",
    color: "black"
  },

  sectionSubtitleWhite: {
    color: "gray",
    fontSize: 13
  },

  verMas: {
    color: "#27AE60",
    fontWeight: "bold"
  },

  filtersContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginVertical: 16
  },

  filterButton: {
    backgroundColor: "#fff",
    paddingVertical: 10,
    paddingHorizontal: 26,
    borderRadius: 20,
    elevation: 3
  },

  filterText: {
    color: "#27AE60",
    fontWeight: "bold"
  },

  sectionCard: {
    backgroundColor: "white",
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    elevation: 3
  },

  sectionTextContainer: {
    flex: 1
  },

  verMasButton: {
    backgroundColor: "#fff",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    elevation: 3
  },

  verMasButtonText: {
    color: "#27AE60",
    fontWeight: "bold"
  }

});
