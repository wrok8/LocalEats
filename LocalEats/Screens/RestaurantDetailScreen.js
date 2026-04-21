import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  Dimensions,
  Linking,
  TouchableOpacity,
  Alert,
  ActivityIndicator
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { getAuth } from "firebase/auth";
import {
  doc,
  updateDoc,
  increment,
  setDoc,
  getDoc
} from "firebase/firestore";
import { db } from "../firebaseConfig";

const { width } = Dimensions.get("window");

export default function RestaurantDetailScreen({ route, navigation }) {
  const { restaurant } = route.params;

  // IMPORTANTE: Inicializamos con los datos que vienen de la navegación (Google Maps)
  const [restaurantData, setRestaurantData] = useState(restaurant);
  const [images, setImages] = useState([]);
  const [isFavorite, setIsFavorite] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initializeScreen();
  }, []);

  useFocusEffect(
    useCallback(() => {
      refreshRestaurantData();
      checkFavorite();
    }, [])
  );

  async function initializeScreen() {
    if (restaurant.image) {
      setImages([restaurant.image]);
    } else if (restaurant.photos) {
       // Si vienes de Google Maps a veces la propiedad es photos
       setImages([restaurant.photos[0]]);
    }

    await addView();
    await refreshRestaurantData();
    await checkFavorite();

    setLoading(false);
  }

  async function refreshRestaurantData() {
    try {
      if (!restaurant.id) return;

      const restaurantRef = doc(db, "restaurants", restaurant.id);
      const snap = await getDoc(restaurantRef);

      if (snap.exists()) {
        const freshData = snap.data();

        // LA CLAVE ESTÁ AQUÍ:
        // Mezclamos los datos previos (Google) con los nuevos (Firebase)
        // Así no se borra el teléfono, la web ni las fotos.
        setRestaurantData((prevData) => ({
          ...prevData,
          ...freshData,
          id: snap.id // Aseguramos que el ID se mantenga
        }));

        if (freshData.image) {
          setImages([freshData.image]);
        }
      }
    } catch (error) {
      console.log("Error actualizando restaurante:", error);
    }
  }

  async function addView() {
    try {
      if (!restaurant.id) return;
      const restaurantRef = doc(db, "restaurants", restaurant.id);
      const snap = await getDoc(restaurantRef);
      if (snap.exists()) {
        await updateDoc(restaurantRef, { views: increment(1) });
      }
    } catch (error) {
      console.log("Error sumando vista:", error);
    }
  }

  async function checkFavorite() {
    try {
      const user = getAuth().currentUser;
      if (!user) return;
      const favoriteRef = doc(db, "users", user.uid, "favorites", restaurant.id);
      const favoriteSnap = await getDoc(favoriteRef);
      setIsFavorite(favoriteSnap.exists());
    } catch (error) {
      console.log("Error verificando favorito:", error);
    }
  }

  async function addToFavorites() {
    try {
      const user = getAuth().currentUser;
      if (!user) {
        Alert.alert("Error", "Debes iniciar sesión");
        return;
      }
      const favoriteRef = doc(db, "users", user.uid, "favorites", restaurant.id);
      await setDoc(favoriteRef, { ...restaurantData, savedAt: new Date() });
      setIsFavorite(true);
      Alert.alert("Éxito", "Restaurante agregado a favoritos");
    } catch (error) {
      console.log("Error favorito:", error);
    }
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  const rating = restaurantData.averageRating || restaurantData.rating || 0;
  const numResenas = restaurantData.reviewsCount || restaurantData.user_ratings_total || 0;

  return (
    <ScrollView style={styles.container}>
      <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false} style={styles.imageScroll}>
        {images.map((img, idx) => (
          <Image key={idx} source={{ uri: img }} style={styles.image} />
        ))}
      </ScrollView>

      <View style={styles.infoContainer}>
        <Text style={styles.name}>{restaurantData.name}</Text>

        <View style={styles.ratingRow}>
          <Text style={styles.stars}>{rating > 0 ? "⭐".repeat(Math.round(rating)) : "😶"}</Text>
          <Text style={styles.ratingNumber}>{rating > 0 ? rating.toFixed(1) : "N/A"}</Text>
          <Text style={styles.reviewCount}>({numResenas} reseñas)</Text>
        </View>

        <TouchableOpacity style={[styles.favoriteButton, isFavorite && styles.favoriteActive]} onPress={addToFavorites} disabled={isFavorite}>
          <Text style={styles.favoriteText}>{isFavorite ? "❤️ Guardado en favoritos" : "🤍 Agregar a favoritos"}</Text>
        </TouchableOpacity>

        {restaurantData.address && (
          <>
            <Text style={styles.sectionTitle}>Dirección</Text>
            <Text style={styles.text}>{restaurantData.address}</Text>
          </>
        )}

        {restaurantData.types?.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Servicios / Tipos</Text>
            <View style={styles.listContainer}>
              {restaurantData.types.map((type, idx) => (
                <Text key={idx} style={styles.listItem}>✔ {type}</Text>
              ))}
            </View>
          </>
        )}

        {restaurantData.phone && restaurantData.phone !== "N/A" && (
          <>
            <Text style={styles.sectionTitle}>Teléfono</Text>
            <Text style={[styles.text, styles.link]} onPress={() => Linking.openURL(`tel:${restaurantData.phone}`)}>
              {restaurantData.phone}
            </Text>
          </>
        )}

        {restaurantData.website && restaurantData.website !== "N/A" && (
          <>
            <Text style={styles.sectionTitle}>Sitio Web</Text>
            <Text style={[styles.text, styles.link]} onPress={() => Linking.openURL(restaurantData.website)}>
              {restaurantData.website}
            </Text>
          </>
        )}

        {restaurantData.opening_hours?.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Horario Semanal</Text>
            {restaurantData.opening_hours.map((day, idx) => (
              <Text key={idx} style={styles.text}>{day}</Text>
            ))}
          </>
        )}

        <TouchableOpacity style={styles.reviewButton} onPress={() => navigation.navigate("ReviewScreen", { restaurant: restaurantData })}>
          <Text style={styles.reviewButtonText}>⭐ Ver / Agregar reseñas</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  imageScroll: { height: 250 },
  image: { width: width, height: 250, resizeMode: "cover" },
  infoContainer: { padding: 16 },
  name: { fontSize: 24, fontWeight: "bold", marginBottom: 8 },
  ratingRow: { flexDirection: "row", alignItems: "center", marginBottom: 16 },
  stars: { fontSize: 18 },
  ratingNumber: { fontSize: 16, marginLeft: 8, fontWeight: "bold" },
  reviewCount: { marginLeft: 8, color: "#777" },
  sectionTitle: { fontSize: 18, fontWeight: "bold", marginTop: 16, marginBottom: 6 },
  text: { fontSize: 14, color: "#555" },
  listContainer: { flexDirection: "row", flexWrap: "wrap", marginTop: 4 },
  listItem: { width: "50%", fontSize: 14, color: "#555", marginBottom: 4 },
  link: { color: "#27AE60", textDecorationLine: "underline" },
  favoriteButton: { backgroundColor: "#f5f5f5", padding: 14, borderRadius: 12, marginBottom: 20 },
  favoriteActive: { backgroundColor: "#ffe6e6" },
  favoriteText: { textAlign: "center", fontWeight: "bold" },
  reviewButton: { backgroundColor: "#27AE60", padding: 14, borderRadius: 12, marginTop: 24 },
  reviewButtonText: { color: "#fff", textAlign: "center", fontWeight: "bold" }
});