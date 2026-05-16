import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Image,
  ScrollView,
  ActivityIndicator,
  Alert,
  Linking,
} from "react-native";

import {
  collection,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
  writeBatch,
} from "firebase/firestore";

import { db } from "../firebaseConfig";
import { LinearGradient } from "expo-linear-gradient";

const GREEN = "#27AE60";
const DARK_GREEN = "#1A5C35";
const RED = "#E74C3C";
const BG = "#F4F6F4";

export default function AdminRestaurantRequestsScreen({ navigation }) {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [processingId, setProcessingId] = useState(null);

  useEffect(() => {
    loadPendingRestaurants();
  }, []);

  async function loadPendingRestaurants() {
    try {
      setLoading(true);

      const q = query(
        collection(db, "restaurants"),
        where("status", "==", "pending")
      );

      const snapshot = await getDocs(q);

      const data = snapshot.docs.map((docItem) => ({
        id: docItem.id,
        ...docItem.data(),
      }));

      setRestaurants(data);
    } catch (error) {
      console.log("Error cargando restaurantes:", error);
      Alert.alert("Error", "No se pudieron cargar las solicitudes");
    } finally {
      setLoading(false);
    }
  }

  function confirmApprove(item) {
    Alert.alert(
      "Aprobar restaurante",
      `¿Seguro que deseas aprobar "${item.name}"?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Aprobar",
          onPress: () => approveRestaurant(item),
        },
      ]
    );
  }

  function confirmReject(item) {
    Alert.alert(
      "Rechazar restaurante",
      `¿Seguro que deseas rechazar "${item.name}"?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Rechazar",
          style: "destructive",
          onPress: () => rejectRestaurant(item.id),
        },
      ]
    );
  }

  async function approveRestaurant(item) {
    try {
      setProcessingId(item.id);

      const batch = writeBatch(db);
      const restaurantRef = doc(db, "restaurants", item.id);

      batch.update(restaurantRef, {
        status: "approved",
        approvedAt: new Date(),
      });

      if (item.ownerId) {
        const ownerRef = doc(db, "users", item.ownerId);
        batch.set(
          ownerRef,
          {
            role: "owner",
            ownerSince: new Date(),
            updatedAt: new Date(),
          },
          { merge: true }
        );
      }

      await batch.commit();

      Alert.alert(
        "Aprobado",
        item.ownerId
          ? "El restaurante fue aprobado y el usuario ahora es propietario."
          : "El restaurante fue aprobado, pero no tenía un propietario asociado."
      );

      setSelectedRestaurant(null);
      await loadPendingRestaurants();
    } catch (error) {
      console.log("Error aprobando:", error);
      Alert.alert("Error", "No se pudo aprobar el restaurante");
    } finally {
      setProcessingId(null);
    }
  }

  async function rejectRestaurant(id) {
    try {
      setProcessingId(id);

      await updateDoc(doc(db, "restaurants", id), {
        status: "rejected",
      });

      Alert.alert("Rechazado", "El restaurante fue rechazado");

      setSelectedRestaurant(null);
      await loadPendingRestaurants();
    } catch (error) {
      console.log("Error rechazando:", error);
      Alert.alert("Error", "No se pudo rechazar el restaurante");
    } finally {
      setProcessingId(null);
    }
  }

  if (selectedRestaurant) {
    return (
      <RestaurantDetail
        item={selectedRestaurant}
        onBack={() => setSelectedRestaurant(null)}
        onApprove={() => confirmApprove(selectedRestaurant)}
        onReject={() => confirmReject(selectedRestaurant)}
        loading={processingId === selectedRestaurant.id}
      />
    );
  }

  return (
    <View style={styles.container}>
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
        <Text style={styles.appName}>LocalEats</Text>
        <Text style={styles.headerTitle}>Solicitudes pendientes</Text>
        <Text style={styles.headerSub}>
          Revisa la información antes de aprobar un restaurante
        </Text>
      </LinearGradient>

      {loading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color={GREEN} />
          <Text style={styles.loadingText}>Cargando solicitudes...</Text>
        </View>
      ) : restaurants.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyIcon}>✅</Text>
          <Text style={styles.emptyTitle}>No hay solicitudes pendientes</Text>
          <Text style={styles.emptyText}>
            Cuando un propietario registre un restaurante aparecerá aquí.
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
              onView={() => setSelectedRestaurant(item)}
              onApprove={() => confirmApprove(item)}
              onReject={() => confirmReject(item)}
              loading={processingId === item.id}
            />
          )}
        />
      )}
    </View>
  );
}

function RestaurantCard({ item, onView, onApprove, onReject, loading }) {
  const cover = item.image || item.images?.[0] || item.gallery?.[0];

  return (
    <View style={styles.card}>
      {cover ? (
        <Image source={{ uri: cover }} style={styles.cardImage} />
      ) : (
        <View style={styles.noImage}>
          <Text style={styles.noImageText}>Sin imagen</Text>
        </View>
      )}

      <View style={styles.cardBody}>
        <View style={styles.statusBadge}>
          <Text style={styles.statusText}>Pendiente</Text>
        </View>

        <Text style={styles.name}>{item.name || "Restaurante sin nombre"}</Text>

        <Text style={styles.address}>📍 {item.address || "Sin dirección"}</Text>

        {!!item.description && (
          <Text numberOfLines={2} style={styles.description}>
            {item.description}
          </Text>
        )}

        <View style={styles.infoRow}>
          <InfoPill text={`🍽️ ${item.types?.length || 0} categorías`} />
          <InfoPill text={`💵 ${getPriceText(item.price_level)}`} />
        </View>

        <TouchableOpacity style={styles.viewButton} onPress={onView}>
          <Text style={styles.viewButtonText}>Ver detalles</Text>
        </TouchableOpacity>

        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.actionBtn, styles.approveBtn]}
            onPress={onApprove}
            disabled={loading}
          >
            <Text style={styles.actionText}>
              {loading ? "Procesando..." : "Aprobar"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, styles.rejectBtn]}
            onPress={onReject}
            disabled={loading}
          >
            <Text style={styles.actionText}>Rechazar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

function RestaurantDetail({ item, onBack, onApprove, onReject, loading }) {
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
          <Text style={styles.detailName}>{item.name}</Text>
          <Text style={styles.detailAddress}>📍 {item.address}</Text>
        </View>
      </View>

      <View style={styles.detailBody}>
        <Section title="Información general">
          <InfoLine label="Nombre" value={item.name} />
          <InfoLine label="Dirección" value={item.address} />
          <InfoLine label="Teléfono" value={item.phone || "No registrado"} />
          <InfoLine label="Sitio web" value={item.website || "No registrado"} />
          <InfoLine label="Precio" value={getPriceText(item.price_level)} />
          <InfoLine label="Estado" value={item.status || "pending"} />
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

        <Section title="Fotos del restaurante">
          {gallery.length > 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {gallery.map((img, index) => (
                <Image key={index} source={{ uri: img }} style={styles.galleryImage} />
              ))}
            </ScrollView>
          ) : (
            <Text style={styles.muted}>No hay fotos registradas</Text>
          )}
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

        <View style={styles.detailActions}>
          <TouchableOpacity
            style={[styles.detailActionBtn, styles.approveBtn]}
            onPress={onApprove}
            disabled={loading}
          >
            <Text style={styles.detailActionText}>
              {loading ? "Procesando..." : "Aprobar restaurante"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.detailActionBtn, styles.rejectBtn]}
            onPress={onReject}
            disabled={loading}
          >
            <Text style={styles.detailActionText}>Rechazar restaurante</Text>
          </TouchableOpacity>
        </View>
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

function getPriceText(price) {
  if (!price) return "Sin precio";
  return "$".repeat(price);
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
    color: "#fff",
    fontSize: 24,
    fontWeight: "900",
    textAlign: "center",
    marginTop: 6,
    zIndex: 2,
  },

  headerSub: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 13,
    textAlign: "center",
    marginTop: 6,
    zIndex: 2,
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
    height: 180,
  },

  noImage: {
    width: "100%",
    height: 180,
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
    backgroundColor: "#FFF3CD",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    marginBottom: 8,
  },

  statusText: {
    color: "#8A6D00",
    fontSize: 11,
    fontWeight: "800",
  },

  name: {
    fontSize: 20,
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
    borderWidth: 1.5,
    borderColor: GREEN,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: "center",
  },

  viewButtonText: {
    color: GREEN,
    fontWeight: "800",
  },

  actionRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 10,
  },

  actionBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: "center",
  },

  approveBtn: {
    backgroundColor: GREEN,
  },

  rejectBtn: {
    backgroundColor: RED,
  },

  actionText: {
    color: "#fff",
    fontWeight: "800",
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
    fontSize: 27,
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

  detailActions: {
    gap: 10,
    marginBottom: 40,
  },

  detailActionBtn: {
    paddingVertical: 15,
    borderRadius: 16,
    alignItems: "center",
  },

  detailActionText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "900",
  },
});
