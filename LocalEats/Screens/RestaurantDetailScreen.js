import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  Dimensions,
  Linking
} from "react-native";

const { width } = Dimensions.get("window");

export default function RestaurantDetailScreen({ route }) {
  const { restaurant } = route.params;
  const [images, setImages] = useState([]);

  useEffect(() => {
    if (restaurant.image) {
      setImages([restaurant.image]); // puedes agregar más si tienes más fotos
    }
  }, [restaurant]);

  return (
    <ScrollView style={styles.container}>
      {/* ====== IMAGEN DESLIZABLE ====== */}
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

      {/* ====== INFORMACIÓN DEL RESTAURANTE ====== */}
      <View style={styles.infoContainer}>
        <Text style={styles.name}>{restaurant.name}</Text>
        <Text style={styles.rating}>
          {"⭐".repeat(Math.floor(restaurant.rating))}{" "}
          {restaurant.rating?.toFixed(1)}
        </Text>

        {/* Dirección */}
        {restaurant.address ? (
          <>
            <Text style={styles.sectionTitle}>Dirección</Text>
            <Text style={styles.text}>{restaurant.address}</Text>
          </>
        ) : null}

        {/* Servicios / tipos */}
        {restaurant.types?.length ? (
          <>
            <Text style={styles.sectionTitle}>Servicios / Tipos</Text>
            <View style={styles.listContainer}>
              {restaurant.types.map((type, idx) => (
                <Text key={idx} style={styles.listItem}>
                  ✔ {type}
                </Text>
              ))}
            </View>
          </>
        ) : null}

        {/* Teléfono */}
        {restaurant.phone && restaurant.phone !== "N/A" ? (
          <>
            <Text style={styles.sectionTitle}>Teléfono</Text>
            <Text
              style={[styles.text, styles.link]}
              onPress={() => Linking.openURL(`tel:${restaurant.phone}`)}
            >
              {restaurant.phone}
            </Text>
          </>
        ) : null}

        {/* Website */}
        {restaurant.website && restaurant.website !== "N/A" ? (
          <>
            <Text style={styles.sectionTitle}>Sitio Web</Text>
            <Text
              style={[styles.text, styles.link]}
              onPress={() => Linking.openURL(restaurant.website)}
            >
              {restaurant.website}
            </Text>
          </>
        ) : null}

        {/* Horario semanal */}
        {restaurant.opening_hours?.length ? (
          <>
            <Text style={styles.sectionTitle}>Horario Semanal</Text>
            {restaurant.opening_hours.map((day, idx) => (
              <Text key={idx} style={styles.text}>
                {day}
              </Text>
            ))}
          </>
        ) : null}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  imageScroll: { height: 250 },
  image: { width: width, height: 250, resizeMode: "cover" },
  infoContainer: { padding: 16 },
  name: { fontSize: 24, fontWeight: "bold", marginBottom: 8 },
  rating: { fontSize: 16, color: "#f1c40f", marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontWeight: "bold", marginTop: 16, marginBottom: 6 },
  text: { fontSize: 14, color: "#555" },
  listContainer: { flexDirection: "row", flexWrap: "wrap", marginTop: 4 },
  listItem: { width: "50%", fontSize: 14, color: "#555", marginBottom: 4 },
  link: { color: "#27AE60", textDecorationLine: "underline" }
});
