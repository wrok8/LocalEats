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
  ActivityIndicator,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { getAuth } from "firebase/auth";
import {
  doc,
  updateDoc,
  increment,
  setDoc,
  getDoc,
} from "firebase/firestore";
import { db } from "../firebaseConfig";
import { LinearGradient } from "expo-linear-gradient";

const { width } = Dimensions.get("window");
const GREEN = "#27AE60";
const DARK_GREEN = "#1A5C35";
const BG = "#F4F6F4";

export default function RestaurantDetailScreen({ route, navigation }) {
  const { restaurant } = route.params;

  const [restaurantData, setRestaurantData] = useState(restaurant);
  const [images, setImages] = useState([]);
  const [imageIndex, setImageIndex] = useState(0);
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

  function buildImages(data) {
    const all = [];

    if (data?.image) all.push(data.image);

    if (Array.isArray(data?.images)) {
      data.images.forEach((img) => {
        if (img && !all.includes(img)) all.push(img);
      });
    }

    if (Array.isArray(data?.gallery)) {
      data.gallery.forEach((img) => {
        if (img && !all.includes(img)) all.push(img);
      });
    }

    if (Array.isArray(data?.photos)) {
      data.photos.forEach((img) => {
        if (img && !all.includes(img)) all.push(img);
      });
    }

    return all.length > 0
      ? all
      : ["https://via.placeholder.com/600x400?text=Sin+foto"];
  }

  async function initializeScreen() {
    setImages(buildImages(restaurant));

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

        const merged = {
          ...restaurant,
          ...freshData,
          id: snap.id,
        };

        setRestaurantData(merged);
        setImages(buildImages(merged));
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
        await updateDoc(restaurantRef, {
          views: increment(1),
        });
      }
    } catch (error) {
      console.log("Error sumando vista:", error);
    }
  }

  async function checkFavorite() {
    try {
      const user = getAuth().currentUser;
      if (!user || !restaurant.id) return;

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

      if (!restaurant.id) {
        Alert.alert("Error", "No se encontró el ID del restaurante");
        return;
      }

      const favoriteRef = doc(db, "users", user.uid, "favorites", restaurant.id);
      const restaurantRef = doc(db, "restaurants", restaurant.id);

      const favoriteSnap = await getDoc(favoriteRef);

      if (favoriteSnap.exists()) {
        setIsFavorite(true);
        Alert.alert("Aviso", "Este restaurante ya está en tus favoritos");
        return;
      }

      await setDoc(favoriteRef, {
        ...restaurantData,
        id: restaurant.id,
        savedAt: new Date(),
      });

      const restaurantSnap = await getDoc(restaurantRef);

      if (restaurantSnap.exists()) {
        await updateDoc(restaurantRef, {
          favoritesCount: increment(1),
        });
      }

      setRestaurantData((prev) => ({
        ...prev,
        favoritesCount: (prev.favoritesCount || 0) + 1,
      }));

      setIsFavorite(true);
      Alert.alert("Éxito", "Restaurante agregado a favoritos");
    } catch (error) {
      console.log("Error favorito:", error);
      Alert.alert("Error", "No se pudo agregar a favoritos");
    }
  }

  function openMaps() {
    const location = restaurantData.location;

    if (!location?.lat || !location?.lng) {
      Alert.alert("Ubicación", "Este restaurante no tiene ubicación registrada");
      return;
    }

    Linking.openURL(
      `https://www.google.com/maps/search/?api=1&query=${location.lat},${location.lng}`
    );
  }

  function callRestaurant() {
    if (!restaurantData.phone || restaurantData.phone === "N/A") return;
    Linking.openURL(`tel:${restaurantData.phone}`);
  }

  function openWebsite() {
    if (!restaurantData.website || restaurantData.website === "N/A") return;

    const url = restaurantData.website.startsWith("http")
      ? restaurantData.website
      : `https://${restaurantData.website}`;

    Linking.openURL(url);
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={GREEN} />
      </View>
    );
  }

  const rating = restaurantData.averageRating || restaurantData.rating || 0;
  const numResenas =
    restaurantData.totalReviews ||
    restaurantData.reviewsCount ||
    restaurantData.user_ratings_total ||
    0;

    const isAppRestaurant =
  restaurantData.source === "firestore" || !!restaurantData.ownerId;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* CARRUSEL */}
      <View style={styles.hero}>
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={(e) => {
            const index = Math.round(
              e.nativeEvent.contentOffset.x / width
            );
            setImageIndex(index);
          }}
        >
          {images.map((img, idx) => (
            <Image key={idx} source={{ uri: img }} style={styles.heroImage} />
          ))}
        </ScrollView>

        <LinearGradient
          colors={["rgba(0,0,0,0.55)", "transparent", "rgba(0,0,0,0.65)"]}
          style={styles.heroOverlay}
        />

        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>‹</Text>
        </TouchableOpacity>

        <View style={styles.imageCounter}>
          <Text style={styles.imageCounterText}>
            {imageIndex + 1}/{images.length}
          </Text>
        </View>

        <View style={styles.dotsRow}>
          {images.map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                imageIndex === index && styles.dotActive,
              ]}
            />
          ))}
        </View>

        <View style={styles.heroTextBox}>
          <Text style={styles.name}>{restaurantData.name}</Text>
          <Text style={styles.address} numberOfLines={2}>
            📍 {restaurantData.address || restaurantData.vicinity || "Sin dirección"}
          </Text>
        </View>
      </View>

      {/* CONTENIDO */}
      <View style={styles.content}>


        <TouchableOpacity
          style={[styles.favoriteButton, isFavorite && styles.favoriteActive]}
          onPress={addToFavorites}
          disabled={isFavorite}
        >
          <Text style={[styles.favoriteText, isFavorite && styles.favoriteTextActive]}>
            {isFavorite ? "❤️ Guardado en favoritos" : "🤍 Agregar a favoritos"}
          </Text>
        </TouchableOpacity>


        <View style={styles.summaryCard}>
          <View style={styles.ratingBlock}>
            <Text style={styles.ratingValue}>
              {rating > 0 ? rating.toFixed(1) : "N/A"}
            </Text>
            <Text style={styles.ratingStars}>
              {rating > 0 ? "⭐".repeat(Math.round(rating)) : "Sin calificación"}
            </Text>
            <Text style={styles.reviewCount}>{numResenas} reseñas</Text>
          </View>
      </View>

        

        {isAppRestaurant && restaurantData.description ? (
          <InfoCard title="Descripción" icon="📝">
            <Text style={styles.paragraph}>{restaurantData.description}</Text>
          </InfoCard>
        ) : null}

        {isAppRestaurant && restaurantData.types?.length > 0 && (
          <InfoCard title="Categorías" icon="🍽️">
            <View style={styles.chipsWrap}>
              {restaurantData.types.map((type, idx) => (
                <View key={idx} style={styles.chip}>
                  <Text style={styles.chipText}>{type}</Text>
                </View>
              ))}
            </View>
          </InfoCard>
        )}

        <InfoCard title="Contacto y ubicación" icon="📌">
          <ActionRow
            icon="📍"
            title="Dirección"
            subtitle={restaurantData.address || restaurantData.vicinity || "Sin dirección"}
            onPress={openMaps}
          />

          {restaurantData.phone && restaurantData.phone !== "N/A" && (
            <ActionRow
              icon="📞"
              title="Teléfono"
              subtitle={restaurantData.phone}
              onPress={callRestaurant}
            />
          )}

          {restaurantData.website && restaurantData.website !== "N/A" && (
            <ActionRow
              icon="🌐"
              title="Sitio web"
              subtitle={restaurantData.website}
              onPress={openWebsite}
            />
          )}
        </InfoCard>

        {restaurantData.opening_hours?.length > 0 && (
          <InfoCard title="Horario semanal" icon="🕐">
            {restaurantData.opening_hours.map((day, idx) => (
              <Text key={idx} style={styles.scheduleText}>
                {day}
              </Text>
            ))}
          </InfoCard>
        )}

        <TouchableOpacity
          style={styles.reviewButton}
          onPress={() =>
            navigation.navigate("ReviewScreen", {
              restaurant: restaurantData,
            })
          }
        >
          <Text style={styles.reviewButtonText}>⭐ Ver / Agregar reseñas</Text>
        </TouchableOpacity>

        <View style={{ height: 30 }} />
      </View>
    </ScrollView>
  );
}

function InfoCard({ title, icon, children }) {
  return (
    <View style={styles.infoCard}>
      <Text style={styles.infoTitle}>
        {icon} {title}
      </Text>
      {children}
    </View>
  );
}

function ActionRow({ icon, title, subtitle, onPress }) {
  return (
    <TouchableOpacity style={styles.actionRow} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.actionIcon}>
        <Text>{icon}</Text>
      </View>

      <View style={{ flex: 1 }}>
        <Text style={styles.actionTitle}>{title}</Text>
        <Text style={styles.actionSub} numberOfLines={2}>
          {subtitle}
        </Text>
      </View>

      <Text style={styles.actionArrow}>›</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG,
  },

  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: BG,
  },

  hero: {
    height: 340,
    backgroundColor: "#ddd",
    position: "relative",
  },

  heroImage: {
    width,
    height: 340,
    resizeMode: "cover",
  },

  heroOverlay: {
    position: "absolute",
    width: "100%",
    height: "100%",
  },

  backButton: {
    position: "absolute",
    top: 50,
    left: 16,
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },

  backButtonText: {
    color: "#fff",
    fontSize: 34,
    lineHeight: 36,
  },

  imageCounter: {
    position: "absolute",
    top: 55,
    right: 16,
    backgroundColor: "rgba(0,0,0,0.45)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },

  imageCounterText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 12,
  },

  dotsRow: {
    position: "absolute",
    bottom: 88,
    alignSelf: "center",
    flexDirection: "row",
    gap: 6,
  },

  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.45)",
  },

  dotActive: {
    width: 18,
    backgroundColor: "#fff",
  },

  heroTextBox: {
    position: "absolute",
    bottom: 24,
    left: 20,
    right: 20,
  },

  name: {
    color: "#fff",
    fontSize: 29,
    fontWeight: "900",
  },

  address: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 14,
    marginTop: 4,
  },

  content: {
    padding: 16,
    marginTop: -10,
  },

  summaryCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 18,
    flexDirection: "row",
    alignItems: "center",
    elevation: 4,
    marginBottom: 14,
  },

  ratingBlock: {
    flex: 1,
    alignItems: "center",
  },

  ratingValue: {
    fontSize: 25,
    fontWeight: "900",
    color: GREEN,
  },

  ratingStars: {
    fontSize: 13,
    color: "#444",
    marginTop: 2,
    textAlign: "center",
  },

  reviewCount: {
    color: "#888",
    fontSize: 12,
    marginTop: 3,
    textAlign: "center",
  },

  summaryDivider: {
    width: 1,
    height: 48,
    backgroundColor: "#eee",
    marginHorizontal: 12,
  },

  favoriteButton: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 16,
    marginBottom: 14,
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#eee",
    elevation: 3,
  },

  favoriteActive: {
    backgroundColor: "#FFE8E8",
    borderColor: "#FFBDBD",
  },

  favoriteText: {
    color: "#333",
    fontWeight: "900",
    fontSize: 15,
  },

  favoriteTextActive: {
    color: "#E74C3C",
  },

  infoCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 16,
    marginBottom: 14,
    elevation: 3,
  },

  infoTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: DARK_GREEN,
    marginBottom: 12,
  },

  paragraph: {
    color: "#555",
    fontSize: 14,
    lineHeight: 21,
  },

  chipsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },

  chip: {
    backgroundColor: "#E8F8F0",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
  },

  chipText: {
    color: DARK_GREEN,
    fontWeight: "800",
    fontSize: 12,
  },

  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },

  actionIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "#E8F8F0",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },

  actionTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#333",
  },

  actionSub: {
    fontSize: 13,
    color: "#777",
    marginTop: 2,
  },

  actionArrow: {
    fontSize: 26,
    color: "#ccc",
    marginLeft: 8,
  },

  scheduleText: {
    fontSize: 14,
    color: "#555",
    marginBottom: 7,
  },

  reviewButton: {
    backgroundColor: GREEN,
    padding: 16,
    borderRadius: 18,
    alignItems: "center",
    elevation: 4,
  },

  reviewButtonText: {
    color: "#fff",
    fontWeight: "900",
    fontSize: 15,
  },
});