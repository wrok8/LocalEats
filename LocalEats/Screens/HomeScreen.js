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

  useEffect(() => {
    loadRestaurants();
  }, []);

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

      const data =
        await getNearbyRestaurants(
          location.coords.latitude,
          location.coords.longitude
        );

      setRestaurants(data);

    } catch (error) {

      console.log(error);

    } finally {

      setLoading(false);

    }
  }

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#27AE60" />
      </View>
    );
  }

  return (

     <SafeAreaView style={styles.container}>

    <ScrollView showsVerticalScrollIndicator={false}>

      {/* ====== BLOQUE CON IMAGEN DE FONDO ====== */}
      <ImageBackground
        source={require("../assets/FondoInicio.png")}
        style={styles.background}
        imageStyle={styles.backgroundImage}
      >

        {/* HEADER */}
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
            <Text style={styles.sectionTitleWhite}>
              Cerca de ti
            </Text>

            <Text style={styles.sectionSubtitleWhite}>
              Los restaurantes más cercanos a ti
            </Text>
          </View>

          <TouchableOpacity style={styles.verMasButton}>
            <Text style={styles.verMasButtonText}>
              Mirar más
            </Text>
          </TouchableOpacity>

        </View>

        {/* LISTA HORIZONTAL */}
        <FlatList
          horizontal
          data={restaurants}
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

      {/* ====== RESTO NORMAL (FONDO GRIS) ====== */}

      {/* FILTROS */}
      <View style={styles.filtersContainer}>
        <FilterButton title="Precio" />
        <FilterButton title="Categoría" />
        <FilterButton title="Calificación" />
      </View>

      {/* RESTAURANTES */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>
          Restaurantes
        </Text>

        <TouchableOpacity>
          <Text style={styles.verMas}>
            Ver más
          </Text>
        </TouchableOpacity>
      </View>

      {/* LISTA VERTICAL */}
      <FlatList
        data={restaurants}
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


/* BOTON FILTRO */

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

  header: {
    backgroundColor: "#27AE60",
    padding: 20,
    alignItems: "center"
  },

  headerTitle: {
    color: "white",
    fontSize: 20,
    fontWeight: "bold"
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
  },

  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    marginTop: 0
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold"
  },

  sectionSubtitle: {
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
    backgroundColor: "#ffffff",
    paddingVertical: 10,
    paddingHorizontal: 26,
    borderRadius: 20,
    shadowColor: "#000",

    shadowOffset2: {
        width: 0,
        height: 2
    },
    
        shadowOpacity: 0.08,
        shadowRadius: 4,
        elevation: 3
    },

  filterText: {
    color: "#27AE60",
    fontWeight: "bold"
  },

  sectionCard: {
    backgroundColor: "white",
    marginHorizontal: 16,
    marginTop: 0,
    padding: 16,
    borderRadius: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    shadowColor: "#000",

  shadowOffset: {
    width: 0,
    height: 2
  },
  
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3
  },

  sectionTextContainer: {
    flex: 1

  },

verMasButton: {
  backgroundColor: "#ffffff",
  paddingVertical: 8,
  paddingHorizontal: 16,
  borderRadius: 20,
  shadowColor: "#000",

  shadowOffset2: {
    width: 0,
    height: 2
  },
  
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3
  },
  

verMasButtonText: {
  color: "#27AE60",
  fontWeight: "bold"
  },


});
