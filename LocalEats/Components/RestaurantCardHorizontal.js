import React, { useState, useEffect } from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  Image, 
  Dimensions 
} from "react-native";

const { width } = Dimensions.get("window");

export default function RestaurantDetailScreen({ route }) {
  const { restaurant } = route.params;
  const [images, setImages] = useState([]);

  useEffect(() => {
    if (restaurant.image) {
      setImages([restaurant.image]); // puedes agregar más si la API devuelve más fotos
    }
  }, [restaurant]);

  return (
    <ScrollView style={styles.container}>
      {/* IMÁGENES DESLIZABLES */}
      <ScrollView 
        horizontal 
        pagingEnabled 
        showsHorizontalScrollIndicator={false}
        style={styles.imageScroll}
      >
        {images.map((img, idx) => (
          <Image 
            key={idx} 
            source={{ uri: img }} 
            style={styles.image} 
          />
        ))}
      </ScrollView>

      {/* INFO DEL RESTAURANTE */}
      <View style={styles.infoContainer}>
        <Text style={styles.name}>{restaurant.name}</Text>

        {/* ESTRELLAS */}
        <Text style={styles.rating}>
          {"⭐".repeat(Math.floor(restaurant.rating))} {restaurant.rating?.toFixed(1)}
        </Text>

        {/* DESCRIPCIÓN */}
        <Text style={styles.sectionTitle}>Description</Text>
        <Text style={styles.description}>
          {restaurant.vicinity || "No description available"}
        </Text>

        {/* INSTALACIONES / SERVICES */}
        <Text style={styles.sectionTitle}>Facilities</Text>
        <View style={styles.facilitiesContainer}>
          {restaurant.types?.map((type, idx) => (
            <Text key={idx} style={styles.facility}>
              ✔ {type}
            </Text>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff"
  },
  imageScroll: {
    height: 250
  },
  image: {
    width: width,
    height: 250,
    resizeMode: "cover"
  },
  infoContainer: {
    padding: 16
  },
  name: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 8
  },
  rating: {
    fontSize: 16,
    color: "#f1c40f",
    marginBottom: 16
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 16,
    marginBottom: 8
  },
  description: {
    fontSize: 14,
    color: "#555"
  },
  facilitiesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 8
  },
  facility: {
    width: "50%",
    fontSize: 14,
    color: "#555",
    marginBottom: 4
  }
});
