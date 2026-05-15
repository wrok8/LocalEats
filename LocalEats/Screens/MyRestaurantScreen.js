import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ScrollView,
  ActivityIndicator,
  Alert,
  Linking,
} from "react-native";

import { LinearGradient } from "expo-linear-gradient";
import { getAuth } from "firebase/auth";
import {
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";

import { db } from "../firebaseConfig";

const GREEN = "#27AE60";
const DARK_GREEN = "#1A5C35";
const RED = "#E74C3C";
const BG = "#F4F6F4";

export default function EditRestaurantScreen({ navigation }) {
  const [restaurants, setRestaurants] = useState([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = navigation.addListener("focus", () => {
      loadMyRestaurants();
    });

    loadMyRestaurants();

    return unsub;
  }, [navigation]);

  async function loadMyRestaurants() {
    try {
      setLoading(true);

      const user = getAuth().currentUser;

      if (!user) {
        Alert.alert("Error", "Debes iniciar sesión");
        return;
      }

      const q = query(
        collection(db, "restaurants"),
        where("ownerId", "==", user.uid)
      );

      const snapshot = await getDocs(q);

      const data = snapshot.docs.map((docItem) => ({
        id: docItem.id,
        ...docItem.data(),
      }));

      setRestaurants(data);
    } catch (error) {
      console.log("Error cargando mis restaurantes:", error);
      Alert.alert("Error", "No se pudieron cargar tus restaurantes");
    } finally {
      setLoading(false);
    }
  }

  if (selectedRestaurant) {
    return (
      <RestaurantDetail
        item={selectedRestaurant}
        onBack={() => setSelectedRestaurant(null)}
      />
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[DARK_GREEN, GREEN]}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>🍽️ Mis restaurantes</Text>
        <Text style={styles.headerSub}>
          Consulta la información de tus restaurantes registrados
        </Text>
      </LinearGradient>

      {loading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color={GREEN} />
          <Text style={styles.loadingText}>Cargando restaurantes...</Text>
        </View>
      ) : restaurants.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyIcon}>🏪</Text>
          <Text style={styles.emptyTitle}>No tienes restaurantes registrados</Text>
          <Text style={styles.emptyText}>
            Cuando registres un restaurante aparecerá en esta sección.
          </Text>
        </View>
      ) : (
        <FlatList
          data={restaurants}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <RestaurantCard
              item={item}
              onPress={() => setSelectedRestaurant(item)}
            />
          )}
        />
      )}
    </View>
  );
}

function RestaurantCard({ item, onPress }) {
  const cover = item.image || item.images?.[0] || item.gallery?.[0];

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.85}
      onPress={onPress}
    >
      {cover ? (
        <Image source={{ uri: cover }} style={styles.cardImage} />
      ) : (
        <View style={styles.noImage}>
          <Text style={styles.noImageText}>Sin imagen</Text>
        </View>
      )}

      <View style={styles.cardBody}>
        <View style={[
          styles.statusBadge,
          getStatusStyle(item.status),
        ]}>
          <Text style={styles.statusText}>
            {getStatusText(item.status)}
          </Text>
        </View>

        <Text style={styles.name}>
          {item.name || "Restaurante sin nombre"}
        </Text>

        <Text style={styles.address}>
          📍 {item.address || "Sin dirección"}
        </Text>

        {!!item.description && (
          <Text numberOfLines={2} style={styles.description}>
            {item.description}
          </Text>
        )}

        <View style={styles.infoRow}>
          <InfoPill text={`🍽️ ${item.types?.length || 0} categorías`} />
          <InfoPill text={`💵 ${getPriceText(item.price_level)}`} />
        </View>

        <View style={styles.viewButton}>
          <Text style={styles.viewButtonText}>Ver información</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

function RestaurantDetail({ item, onBack }) {
  const gallery = item.gallery || item.images || [];
  const cover = item.image || gallery[0];

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.detailHeader}>
        {cover ? (
          <Image source={{ uri: cover }} style={styles.detailCover} />
        ) : (
          <View style={styles.detailNoCover}>
            <Text style={styles.noImageText}>Sin imagen</Text>
          </View>
        )}

        <LinearGradient
          colors={["rgba(0,0,0,0.65)", "transparent"]}
          style={styles.detailOverlay}
        />

        <TouchableOpacity style={styles.backBtn} onPress={onBack}>
          <Text style={styles.backBtnText}>‹</Text>
        </TouchableOpacity>

        <View style={styles.detailTitleBox}>
          <Text style={styles.detailName}>
            {item.name || "Restaurante"}
          </Text>
          <Text style={styles.detailAddress}>
            📍 {item.address || "Sin dirección"}
          </Text>
        </View>
      </View>

      <View style={styles.detailBody}>
        <Section title="Estado de revisión">
          <View style={[
            styles.statusLarge,
            getStatusStyle(item.status),
          ]}>
            <Text style={styles.statusLargeText}>
              {getStatusText(item.status)}
            </Text>
          </View>
        </Section>

        <Section title="Información general">
          <InfoLine label="Nombre" value={item.name} />
          <InfoLine label="Dirección" value={item.address} />
          <InfoLine label="Teléfono" value={item.phone || "No registrado"} />
          <InfoLine label="Sitio web" value={item.website || "No registrado"} />
          <InfoLine label="Precio" value={getPriceText(item.price_level)} />
          <InfoLine label="Rating" value={String(item.averageRating ?? item.rating ?? 0)} />
          <InfoLine label="Reseñas" value={String(item.totalReviews ?? 0)} />
        </Section>

        {!!item.description && (
          <Section title="Descripción">
            <Text style={styles.longText}>{item.description}</Text>
          </Section>
        )}

        <Section title="Categorías">
          <View style={styles.chipsWrap}>
            {(item.types || []).length > 0 ? (
              item.types.map((type, index) => (
                <View key={index} style={styles.chip}>
                  <Text style={styles.chipText}>{type}</Text>
                </View>
              ))
            ) : (
              <Text style={styles.muted}>Sin categorías</Text>
            )}
          </View>
        </Section>

        <Section title="Horario de atención">
          {(item.opening_hours || []).length > 0 ? (
            item.opening_hours.map((hour, index) => (
              <Text key={index} style={styles.scheduleText}>
                🕐 {hour}
              </Text>
            ))
          ) : (
            <Text style={styles.muted}>Sin horario registrado</Text>
          )}
        </Section>

        <Section title="Fotos">
          {gallery.length > 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {gallery.map((img, index) => (
                <Image
                  key={index}
                  source={{ uri: img }}
                  style={styles.galleryImage}
                />
              ))}
            </ScrollView>
          ) : (
            <Text style={styles.muted}>No hay fotos registradas</Text>
          )}
        </Section>

        <Section title="Estadísticas">
          <View style={styles.statsRow}>
            <StatCard icon="👁️" value={item.views || 0} label="Vistas" />
            <StatCard icon="❤️" value={item.favoritesCount || 0} label="Favoritos" />
            <StatCard icon="📍" value={item.directionsClicks || 0} label="Cómo llegar" />
          </View>
        </Section>

        <Section title="Ubicación">
          {item.location ? (
            <>
              <InfoLine label="Latitud" value={String(item.location.lat)} />
              <InfoLine label="Longitud" value={String(item.location.lng)} />

              <TouchableOpacity
                style={styles.mapBtn}
                onPress={() =>
                  Linking.openURL(
                    `https://www.google.com/maps/search/?api=1&query=${item.location.lat},${item.location.lng}`
                  )
                }
              >
                <Text style={styles.mapBtnText}>Abrir ubicación en Maps</Text>
              </TouchableOpacity>
            </>
          ) : (
            <Text style={styles.muted}>Sin ubicación registrada</Text>
          )}
        </Section>

        <View style={{ height: 30 }} />
      </View>
    </ScrollView>
  );
}

function Section({ title, children }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function InfoLine({ label, value }) {
  return (
    <View style={styles.infoLine}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value || "No registrado"}</Text>
    </View>
  );
}

function InfoPill({ text }) {
  return (
    <View style={styles.infoPill}>
      <Text style={styles.infoPillText}>{text}</Text>
    </View>
  );
}

function StatCard({ icon, value, label }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statIcon}>{icon}</Text>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function getPriceText(price) {
  if (!price) return "Sin precio";
  return "$".repeat(price);
}

function getStatusText(status) {
  if (status === "approved") return "✅ Aprobado";
  if (status === "rejected") return "❌ Rechazado";
  return "⏳ Pendiente";
}

function getStatusStyle(status) {
  if (status === "approved") {
    return {
      backgroundColor: "#E8F8F0",
      borderColor: GREEN,
    };
  }

  if (status === "rejected") {
    return {
      backgroundColor: "#FFE8E8",
      borderColor: RED,
    };
  }

  return {
    backgroundColor: "#FFF3CD",
    borderColor: "#F39C12",
  };
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG,
  },

  header: {
    paddingTop: 56,
    paddingBottom: 26,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 26,
    borderBottomRightRadius: 26,
  },

  headerTitle: {
    color: "#fff",
    fontSize: 25,
    fontWeight: "900",
    textAlign: "center",
  },

  headerSub: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 13,
    textAlign: "center",
    marginTop: 6,
  },

  listContent: {
    padding: 16,
    paddingBottom: 40,
  },

  card: {
    backgroundColor: "#fff",
    borderRadius: 22,
    marginBottom: 18,
    overflow: "hidden",
    elevation: 4,
  },

  cardImage: {
    width: "100%",
    height: 185,
  },

  noImage: {
    width: "100%",
    height: 185,
    backgroundColor: "#E8F8F0",
    justifyContent: "center",
    alignItems: "center",
  },

  noImageText: {
    color: GREEN,
    fontWeight: "800",
  },

  cardBody: {
    padding: 16,
  },

  statusBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 8,
  },

  statusText: {
    color: "#444",
    fontSize: 11,
    fontWeight: "900",
  },

  name: {
    fontSize: 21,
    fontWeight: "900",
    color: "#222",
  },

  address: {
    color: "#777",
    fontSize: 13,
    marginTop: 4,
  },

  description: {
    color: "#555",
    fontSize: 13,
    marginTop: 8,
    lineHeight: 19,
  },

  infoRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 12,
  },

  infoPill: {
    backgroundColor: "#E8F8F0",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },

  infoPillText: {
    color: DARK_GREEN,
    fontSize: 12,
    fontWeight: "700",
  },

  viewButton: {
    marginTop: 14,
    backgroundColor: GREEN,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: "center",
  },

  viewButtonText: {
    color: "#fff",
    fontWeight: "900",
  },

  centerBox: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  loadingText: {
    color: "#777",
    marginTop: 10,
  },

  emptyBox: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 30,
  },

  emptyIcon: {
    fontSize: 52,
    marginBottom: 10,
  },

  emptyTitle: {
    fontSize: 19,
    fontWeight: "900",
    color: "#222",
    textAlign: "center",
  },

  emptyText: {
    color: "#777",
    textAlign: "center",
    marginTop: 6,
    lineHeight: 20,
  },

  detailHeader: {
    height: 320,
    position: "relative",
    backgroundColor: "#ddd",
  },

  detailCover: {
    width: "100%",
    height: "100%",
  },

  detailNoCover: {
    width: "100%",
    height: "100%",
    backgroundColor: "#E8F8F0",
    justifyContent: "center",
    alignItems: "center",
  },

  detailOverlay: {
    position: "absolute",
    width: "100%",
    height: "100%",
    top: 0,
  },

  backBtn: {
    position: "absolute",
    top: 50,
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "center",
    alignItems: "center",
  },

  backBtnText: {
    color: "#fff",
    fontSize: 32,
    lineHeight: 34,
  },

  detailTitleBox: {
    position: "absolute",
    bottom: 24,
    left: 20,
    right: 20,
  },

  detailName: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "900",
  },

  detailAddress: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 14,
    marginTop: 4,
  },

  detailBody: {
    padding: 16,
  },

  section: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    elevation: 2,
  },

  sectionTitle: {
    fontSize: 15,
    fontWeight: "900",
    color: DARK_GREEN,
    marginBottom: 12,
  },

  infoLine: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
    paddingVertical: 8,
    gap: 12,
  },

  infoLabel: {
    color: "#777",
    fontWeight: "700",
    fontSize: 13,
  },

  infoValue: {
    flex: 1,
    color: "#222",
    fontSize: 13,
    fontWeight: "600",
    textAlign: "right",
  },

  longText: {
    color: "#444",
    lineHeight: 21,
    fontSize: 14,
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

  scheduleText: {
    color: "#444",
    fontSize: 14,
    marginBottom: 6,
  },

  galleryImage: {
    width: 130,
    height: 130,
    borderRadius: 16,
    marginRight: 10,
  },

  muted: {
    color: "#999",
    fontStyle: "italic",
  },

  mapBtn: {
    marginTop: 12,
    backgroundColor: "#E8F8F0",
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: "center",
  },

  mapBtnText: {
    color: DARK_GREEN,
    fontWeight: "800",
  },

  statsRow: {
    flexDirection: "row",
    gap: 8,
  },

  statCard: {
    flex: 1,
    alignItems: "center",
    backgroundColor: "#F4F6F4",
    borderRadius: 14,
    paddingVertical: 12,
  },

  statIcon: {
    fontSize: 20,
    marginBottom: 3,
  },

  statValue: {
    fontSize: 18,
    fontWeight: "900",
    color: GREEN,
  },

  statLabel: {
    fontSize: 10,
    color: "#888",
    marginTop: 2,
    textAlign: "center",
  },

  statusLarge: {
    borderWidth: 1.5,
    borderRadius: 16,
    padding: 14,
    alignItems: "center",
  },

  statusLargeText: {
    fontWeight: "900",
    color: "#333",
    fontSize: 15,
  },
});