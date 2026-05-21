import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  Dimensions,
} from "react-native";

import { getAuth } from "firebase/auth";
import {
  collection,
  getDocs,
  doc,
  deleteDoc,
  updateDoc,
  increment,
} from "firebase/firestore";
import { db } from "../firebaseConfig";
import { LinearGradient } from "expo-linear-gradient";
import { cacheFavorites, logAudit, logError } from "../Logs/FileManager";

const { width } = Dimensions.get("window");
const GREEN = "#27AE60";
const DARK_GREEN = "#1A5C35";

// Muestra los restaurantes que el usuario guardo como favoritos.
export default function FavoritesScreen({ navigation }) {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFavorites();
    const unsub = navigation.addListener("focus", loadFavorites);
    return unsub;
  }, [navigation]);

  // Recarga favoritos al entrar para reflejar cambios hechos en otras pantallas.
  async function loadFavorites() {
    try {
      setLoading(true);
      const user = getAuth().currentUser;
      if (!user) return;

      const snap = await getDocs(collection(db, "users", user.uid, "favorites"));
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      await logAudit({
        action: "Se consultaron favoritos del usuario",
        storage: "Firestore",
        target: `users/${user.uid}/favorites`,
        detail: `resultados: ${snap.size}`,
        userId: user.uid,
      });
      setFavorites(data);
      await cacheFavorites(user.uid, data);
      await logAudit({
        action: "Se guardo cache local de favoritos",
        storage: "FileSystem",
        target: "cache/favorites.txt",
        detail: `favoritos: ${data.length}`,
        userId: user.uid,
      });
    } catch (error) {
      console.log("Error cargando favoritos:", error);
      await logError("FavoritesScreen.loadFavorites", error);
    } finally {
      setLoading(false);
    }
  }

  // Pide confirmacion antes de quitar un restaurante guardado.
  async function removeFavorite(restaurantId, name) {
  Alert.alert(
    "Quitar favorito",
    `¿Quitar "${name}" de tus favoritos?`,
    [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Quitar",
        style: "destructive",
        onPress: async () => {
          try {
            const user = getAuth().currentUser;
            if (!user) return;

            await deleteDoc(
              doc(db, "users", user.uid, "favorites", restaurantId)
            );
            await logAudit({
              action: "Se elimino favorito del usuario",
              storage: "Firestore",
              target: `users/${user.uid}/favorites/${restaurantId}`,
              detail: `restaurante: ${name}`,
              userId: user.uid,
            });

            try {
              await updateDoc(doc(db, "restaurants", restaurantId), {
                favoritesCount: increment(-1),
              });
              await logAudit({
                action: "Se decremento contador de favoritos",
                storage: "Firestore",
                target: `restaurants/${restaurantId}`,
                detail: "Campo modificado: favoritesCount -1",
                userId: user.uid,
              });
            } catch (error) {
              console.log("No se pudo restar contador:", error);
            }

            setFavorites((prev) =>
              prev.filter((item) => item.id !== restaurantId)
            );

          } catch (error) {
            console.log("Error eliminando:", error);
          }
        },
      },
    ]
  );
}

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={GREEN} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <LinearGradient
        colors={[
          "rgba(10, 65, 38, 0.97)",
          "rgba(39, 174, 96, 0.93)",
          "rgba(255, 185, 73, 0.78)",
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.decorCircle1} />
        <View style={styles.decorCircle2} />
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.appName}>LocalEats</Text>
        <Text style={styles.headerTitle}>Mis favoritos</Text>
        <Text style={styles.headerSub}>
          {favorites.length > 0
            ? `${favorites.length} restaurante${favorites.length !== 1 ? "s" : ""} guardado${favorites.length !== 1 ? "s" : ""}`
            : "Aún no tienes favoritos"}
        </Text>
      </LinearGradient>


      {/* LISTA VACÍA */}
      {favorites.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>🍽️</Text>
          <Text style={styles.emptyTitle}>Sin favoritos aún</Text>
          <Text style={styles.emptyText}>
            Explora restaurantes y guarda los que más te gusten tocando ❤️
          </Text>
          <TouchableOpacity
            style={styles.exploreButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.exploreButtonText}>Explorar restaurantes</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={favorites}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <FavoriteCard
              item={item}
              onPress={() =>
                navigation.navigate("RestaurantDetail", { restaurant: item })
              }
              onRemove={() => removeFavorite(item.id, item.name)}
            />
          )}
        />
      )}
    </View>
  );
}

/* =============================
   TARJETA DE FAVORITO
==============================*/

// Tarjeta con foto, rating y acciones rapidas del favorito.
function FavoriteCard({ item, onPress, onRemove }) {
  const ratingNum = parseFloat(item.rating) || 0;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.88}>
      {/* IMAGEN */}
      <View style={styles.imageWrapper}>
        <Image
          source={{
            uri: item.image || "https://via.placeholder.com/400x200?text=Sin+foto",
          }}
          style={styles.cardImage}
        />

        {/* BADGE RATING */}
        <View style={styles.ratingBadge}>
          <Text style={styles.ratingBadgeText}>⭐ {ratingNum > 0 ? ratingNum.toFixed(1) : "N/A"}</Text>
        </View>

        {/* BOTÓN QUITAR */}
        <TouchableOpacity style={styles.heartButton} onPress={onRemove} activeOpacity={0.8}>
          <Text style={styles.heartIcon}>❤️</Text>
        </TouchableOpacity>
      </View>

      {/* INFO */}
      <View style={styles.cardBody}>
        <View style={styles.cardTop}>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardName} numberOfLines={1}>{item.name}</Text>
            <Text style={styles.cardAddress} numberOfLines={1}>
              📍 {item.address || item.vicinity || "Sin dirección"}
            </Text>
          </View>
        </View>

        {/* TIPOS */}
        {item.types && item.types.length > 0 && (
          <View style={styles.typesRow}>
            {item.types.slice(0, 3).map((t, i) => (
              <View key={i} style={styles.typeChip}>
                <Text style={styles.typeChipText}>{t}</Text>
              </View>
            ))}
          </View>
        )}

        {/* ACCIONES */}
        <View style={styles.cardActions}>
          <TouchableOpacity style={styles.detailBtn} onPress={onPress}>
            <Text style={styles.detailBtnText}>Ver detalles</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.removeBtn} onPress={onRemove}>
            <Text style={styles.removeBtnText}>Quitar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}

/* =============================
   ESTILOS
==============================*/

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F4F6F4" },

  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F4F6F4",
  },

  /* HEADER */
  header: {
    paddingTop: 60,
    paddingBottom: 28,
    paddingHorizontal: 20,
    overflow: "hidden",
    position: "relative",
  },
  decorCircle1: {
    position: "absolute",
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: "rgba(255,255,255,0.06)",
    top: -60,
    right: -50,
  },
  decorCircle2: {
    position: "absolute",
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: "rgba(255,255,255,0.06)",
    bottom: -40,
    left: -30,
  },
  backBtn: {
    position: "absolute",
    top: 56,
    left: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  backBtnText: { color: "#fff", fontSize: 24, lineHeight: 28 },
  appName: {
    color: "rgba(255,255,255,0.78)",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1,
    textTransform: "uppercase",
    textAlign: "center",
    zIndex: 2,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "900",
    color: "#fff",
    textAlign: "center",
    marginTop: 6,
    zIndex: 2,
  },
  headerSub: {
    fontSize: 13,
    color: "rgba(255,255,255,0.75)",
    textAlign: "center",
    marginTop: 4,
    zIndex: 2,
  },

  /* VACÍO */
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  emptyIcon: { fontSize: 64, marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontWeight: "800", color: "#333", marginBottom: 8 },
  emptyText: {
    fontSize: 14,
    color: "#888",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 24,
  },
  exploreButton: {
    backgroundColor: GREEN,
    paddingVertical: 13,
    paddingHorizontal: 28,
    borderRadius: 14,
    elevation: 3,
    shadowColor: GREEN,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  exploreButtonText: { color: "#fff", fontWeight: "800", fontSize: 15 },

  /* CARD */
  card: {
    backgroundColor: "#fff",
    borderRadius: 20,
    marginBottom: 16,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    overflow: "hidden",
  },

  imageWrapper: { position: "relative" },

  cardImage: { width: "100%", height: 160 },

  ratingBadge: {
    position: "absolute",
    bottom: 10,
    left: 12,
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  ratingBadgeText: { color: "#fff", fontSize: 12, fontWeight: "700" },

  heartButton: {
    position: "absolute",
    top: 10,
    right: 12,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.92)",
    justifyContent: "center",
    alignItems: "center",
    elevation: 3,
  },
  heartIcon: { fontSize: 18 },

  cardBody: { padding: 14 },

  cardTop: { flexDirection: "row", alignItems: "flex-start", marginBottom: 8 },

  cardName: { fontSize: 17, fontWeight: "800", color: "#1A1A1A", marginBottom: 3 },

  cardAddress: { fontSize: 13, color: "#888" },

  typesRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 12 },

  typeChip: {
    backgroundColor: "#E8F8F0",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  typeChipText: { fontSize: 11, color: GREEN, fontWeight: "600" },

  cardActions: { flexDirection: "row", gap: 10 },

  detailBtn: {
    flex: 1,
    backgroundColor: GREEN,
    paddingVertical: 11,
    borderRadius: 12,
    alignItems: "center",
    elevation: 2,
    shadowColor: GREEN,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  detailBtnText: { color: "#fff", fontWeight: "700", fontSize: 14 },

  removeBtn: {
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#FFBDBD",
    alignItems: "center",
    justifyContent: "center",
  },
  removeBtnText: { color: "#E74C3C", fontWeight: "700", fontSize: 14 },
});

