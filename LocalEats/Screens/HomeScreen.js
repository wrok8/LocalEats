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
  Modal,
  Pressable,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import {
  collection,
  doc,
  getDoc,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { getAuth } from "firebase/auth";

import { db } from "../firebaseConfig";

import * as Location from "expo-location";
import { SafeAreaView } from "react-native-safe-area-context";

import { getNearbyRestaurants } from "../Services/PlacesApi";

import RestaurantCardHorizontal from "../Components/RestaurantCardHorizontal";
import RestaurantCardVertical from "../Components/RestaurantCardVertical";
import { logAudit } from "../Logs/FileManager";

/* =============================
   OPCIONES DE FILTRO
==============================*/

const PRICE_OPTIONS = [
  { label: "Cualquier precio", value: null },
  { label: "$100 - $200", value: [100, 200] },
  { label: "$200 - $500", value: [200, 500] },
  { label: "$500 - $1000", value: [500, 1000] },
];

const CATEGORY_OPTIONS = [
  { label: "Todas las categorías", value: null },
  { label: "Sushi", value: "sushi" },
  { label: "Pizza", value: "pizza" },
  { label: "Hamburguesas", value: "hamburger" },
  { label: "Tacos", value: "mexican" },
  { label: "Ramen", value: "ramen" },
  { label: "Ensaladas", value: "salad" },
  { label: "Pollo", value: "chicken" },
  { label: "Carnes", value: "steak" },
  { label: "Postres", value: "dessert" },
];

const RATING_OPTIONS = [
  { label: "Cualquier calificación", value: null },
  { label: "1 estrella o más", value: 1 },
  { label: "2 estrellas o más", value: 2 },
  { label: "3 estrellas o más", value: 3 },
  { label: "4 estrellas o más", value: 4 },
  { label: "Solo 5 estrellas", value: 5 },
];

const FILTER_OPTION_BG = "#E8F8F0";
const FILTER_OPTION_ACCENT = "#27AE60";
const FILTER_OPTION_ICON_BG = "#1F9D55";

/* =============================
   MODAL GENÉRICO DE FILTRO
==============================*/

const PASTEL_PRICE_OPTIONS = [
  { label: "Cualquier precio", value: null, icon: "$" },
  { label: "$100 - $200", value: [100, 200], icon: "$" },
  { label: "$200 - $500", value: [200, 500], icon: "$$" },
  { label: "$500 - $1000", value: [500, 1000], icon: "$$$" },
];

const PASTEL_CATEGORY_OPTIONS = [
  { label: "Todas las categorias", value: null, icon: "\u2726" },
  { label: "Sushi", value: "sushi", icon: "\uD83C\uDF63" },
  { label: "Pizza", value: "pizza", icon: "\uD83C\uDF55" },
  { label: "Hamburguesas", value: "hamburger", icon: "\uD83C\uDF54" },
  { label: "Tacos", value: "mexican", icon: "\uD83C\uDF2E" },
  { label: "Ramen", value: "ramen", icon: "\uD83C\uDF5C" },
  { label: "Ensaladas", value: "salad", icon: "\uD83E\uDD57" },
  { label: "Pollo", value: "chicken", icon: "\uD83C\uDF57" },
  { label: "Carnes", value: "steak", icon: "\uD83E\uDD69" },
  { label: "Postres", value: "dessert", icon: "\uD83C\uDF66" },
];

const PASTEL_RATING_OPTIONS = [
  { label: "Cualquier calificacion", value: null, icon: "★" },
  { label: "1 estrella o mas", value: 1, icon: "★" },
  { label: "2 estrellas o mas", value: 2, icon: "★" },
  { label: "3 estrellas o mas", value: 3, icon: "★" },
  { label: "4 estrellas o mas", value: 4, icon: "★" },
  { label: "Solo 5 estrellas", value: 5, icon: "★" },
];

// Modal reutilizable para escoger una opcion de filtro.
function FilterModal({ visible, title, options, selectedValue, onSelect, onClose }) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Pressable style={styles.modalSheet} onPress={() => {}}>
          <View style={styles.modalHandle} />

          <View style={styles.modalHeader}>
            <View style={styles.modalTitleDot} />
            <Text style={styles.modalTitle}>{title}</Text>
          </View>

          <ScrollView
            style={styles.modalOptionsScroll}
            showsVerticalScrollIndicator={false}
          >
            {options.map((option, index) => {
              const isSelected =
                option.value === null
                  ? selectedValue === null
                  : JSON.stringify(option.value) === JSON.stringify(selectedValue);

              return (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.modalOption,
                    { backgroundColor: FILTER_OPTION_BG },
                    isSelected && styles.modalOptionSelected,
                    isSelected && { borderColor: FILTER_OPTION_ACCENT },
                  ]}
                  onPress={() => {
                    onSelect(option.value);
                    onClose();
                  }}
                  activeOpacity={0.78}
                >
                  <View style={styles.modalOptionLeft}>
                    <View
                      style={[
                        styles.modalIconCircle,
                        { backgroundColor: FILTER_OPTION_ICON_BG },
                      ]}
                    >
                      <Text style={styles.modalIconText}>{option.icon || "•"}</Text>
                    </View>

                    <Text
                      style={[
                        styles.modalOptionText,
                        isSelected && styles.modalOptionTextSelected,
                        isSelected && { color: FILTER_OPTION_ACCENT },
                      ]}
                    >
                      {option.label}
                    </Text>
                  </View>

                  {isSelected && (
                    <View
                      style={[
                        styles.checkmark,
                        { backgroundColor: FILTER_OPTION_ACCENT },
                      ]}
                    >
                      <Text style={styles.checkmarkText}>✓</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <TouchableOpacity style={styles.modalCloseButton} onPress={onClose}>
            <Text style={styles.modalCloseText}>Cerrar</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

/* =============================
   PANTALLA PRINCIPAL
==============================*/

// Pantalla principal: junta busqueda, filtros y restaurantes cercanos.
export default function HomeScreen({ navigation }) {

  const [restaurants, setRestaurants] = useState([]);
  const [sortedRestaurants, setSortedRestaurants] = useState([]);
  const [userLocation, setUserLocation] = useState(null);
  const [userName, setUserName] = useState("Usuario");
  const [loading, setLoading] = useState(true);

  const [searchText, setSearchText] = useState("");
  const [filteredRestaurants, setFilteredRestaurants] = useState([]);

  // Estado de filtros
  const [selectedPrice, setSelectedPrice] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedRating, setSelectedRating] = useState(null);

  // Visibilidad de modales
  const [showPriceModal, setShowPriceModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);

  /* =============================
     CARGAR RESTAURANTES
  ==============================*/

  useEffect(() => {
    loadUserName();
    loadRestaurants();
  }, []);

  // Personaliza el saludo con el nombre guardado en el perfil.
  async function loadUserName() {
    try {
      const user = getAuth().currentUser;
      if (!user) return;

      const userSnap = await getDoc(doc(db, "users", user.uid));
      await logAudit({
        action: "Se consulto nombre del usuario para inicio",
        storage: "Firestore",
        target: `users/${user.uid}`,
        userId: user.uid,
      });
      const profileName = userSnap.exists() ? userSnap.data().name : null;
      const fallbackName = user.displayName || user.email?.split("@")[0];

      setUserName(profileName || fallbackName || "Usuario");
    } catch (error) {
      console.log("Error cargando nombre de usuario:", error);
    }
  }

  useEffect(() => {
    if (userLocation && restaurants.length > 0) {
      sortRestaurantsByDistance();
    }
  }, [userLocation, restaurants]);

  /* =============================
     FILTRO COMBINADO
  ==============================*/

  useEffect(() => {
    let result = [...restaurants];

    // Filtro de búsqueda por texto
    if (searchText.trim()) {
      const search = searchText.toLowerCase();
      result = result.filter((r) => {
        const name = r.name?.toLowerCase() || "";
        const address = (r.vicinity || r.address || "").toLowerCase();
        const types = r.types?.join(" ").toLowerCase() || "";
        return (
          name.includes(search) ||
          address.includes(search) ||
          types.includes(search)
        );
      });
    }

    // Filtro por calificación
    if (selectedRating !== null) {
      result = result.filter((r) => {
        const rating = parseFloat(r.rating) || 0;
        return selectedRating === 5
          ? rating === 5
          : rating >= selectedRating;
      });
    }

    // Filtro por categoría (busca en types del restaurante)
    if (selectedCategory !== null) {
      result = result.filter((r) => {
        const types = r.types?.join(" ").toLowerCase() || "";
        const name = r.name?.toLowerCase() || "";
        return types.includes(selectedCategory) || name.includes(selectedCategory);
      });
    }

    // Filtro por precio (usa priceLevel si existe, o price_level de Google)
    if (selectedPrice !== null) {
      const [min, max] = selectedPrice;
      result = result.filter((r) => {
        // Si el restaurante tiene precio como número directo
        if (r.price != null) {
          return r.price >= min && r.price <= max;
        }
        // Si usa price_level de Google (0-4), mapeamos a rangos aproximados
        if (r.price_level != null) {
          const priceMap = { 0: 50, 1: 150, 2: 350, 3: 750, 4: 1500 };
          const approx = priceMap[r.price_level] || 0;
          return approx >= min && approx <= max;
        }
        return true; // Si no tiene precio, no filtrar
      });
    }

    // Si no hay filtros de texto activos, mostrar top 5 por rating
    if (
      !searchText.trim() &&
      selectedRating === null &&
      selectedCategory === null &&
      selectedPrice === null
    ) {
      const topRated = [...restaurants]
        .sort((a, b) => (b.rating || 0) - (a.rating || 0))
        .slice(0, 5);
      setFilteredRestaurants(topRated);
      return;
    }

    setFilteredRestaurants(result);
  }, [searchText, restaurants, selectedPrice, selectedCategory, selectedRating]);

  /* =============================
     OBTENER UBICACIÓN Y API
  ==============================*/

  // Convierte restaurantes propios a la misma forma que los de Google.
  async function getApprovedRestaurantsFromFirestore() {
  const q = query(
    collection(db, "restaurants"),
    where("status", "==", "approved")
  );

  const snapshot = await getDocs(q);
  await logAudit({
    action: "Se consultaron restaurantes aprobados para inicio",
    storage: "Firestore",
    target: "restaurants",
    detail: `status == approved; resultados: ${snapshot.size}`,
    userId: getAuth().currentUser?.uid,
  });

  return snapshot.docs.map((docItem) => {
    const data = docItem.data();

    return {
      id: docItem.id,
      place_id: docItem.id,
      source: "firestore",

      name: data.name,
      address: data.address,
      vicinity: data.address,

      image: data.image || data.images?.[0] || data.gallery?.[0] || null,
      images: data.images || data.gallery || [],

      rating: data.averageRating || data.rating || 0,
      price_level: data.price_level ?? null,
      types: data.types || [],

      opening_hours: data.opening_hours || [],
      phone: data.phone || "",
      website: data.website || "",
      description: data.description || "",

      location: data.location || null,

      views: data.views || 0,
      favoritesCount: data.favoritesCount || 0,
      directionsClicks: data.directionsClicks || 0,
      totalReviews: data.totalReviews || 0,
      averageRating: data.averageRating || 0,
    };
  });
}

  // Pide ubicacion y combina resultados externos con restaurantes aprobados.
  async function loadRestaurants() {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();

    if (status !== "granted") {
      alert("Permiso de ubicación requerido");
      setLoading(false);
      return;
    }

    const location = await Location.getCurrentPositionAsync({});
    const coords = {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
    };

    setUserLocation(coords);

    const googleRestaurants = await getNearbyRestaurants(
      coords.latitude,
      coords.longitude
    );
    await logAudit({
      action: "Se consultaron restaurantes cercanos",
      storage: "Google Places API",
      target: "nearbySearch",
      detail: `resultados: ${googleRestaurants.length}`,
      userId: getAuth().currentUser?.uid,
    });

    const appRestaurants = await getApprovedRestaurantsFromFirestore();

    const allRestaurants = [
      ...appRestaurants,
      ...googleRestaurants,
    ];

    setRestaurants(allRestaurants);
  } catch (error) {
    console.log("Error cargando restaurantes:", error);
  } finally {
    setLoading(false);
  }
}

  /* =============================
     CALCULAR DISTANCIA
  ==============================*/

  // Calcula distancia en kilometros entre dos coordenadas.
  function getDistance(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /* =============================
     ORDENAR POR DISTANCIA
  ==============================*/

  // Ordena la lista para mostrar primero lo mas cercano.
  function sortRestaurantsByDistance() {
    const sorted = restaurants
      .map((r) => {
        if (!r.location) return r;
        const distance = getDistance(
          userLocation.latitude,
          userLocation.longitude,
          r.location.lat,
          r.location.lng
        );
        return { ...r, distance };
      })
      .sort((a, b) => (a.distance || 0) - (b.distance || 0));

    setSortedRestaurants(sorted);
  }

  /* =============================
     LOADING
  ==============================*/

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#27AE60" />
      </View>
    );
  }

  /* =============================
     LISTAS
  ==============================*/

  const topRatedRestaurants = [...restaurants]
    .sort((a, b) => (b.rating || 0) - (a.rating || 0))
    .slice(0, 5);

  const nearbyRestaurants = sortedRestaurants.slice(0, 5);

  /* Etiquetas activas en botones */
  const priceLabel =
    selectedPrice !== null
      ? PASTEL_PRICE_OPTIONS.find(
          (o) => JSON.stringify(o.value) === JSON.stringify(selectedPrice)
        )?.label
      : "Precio";

  const categoryLabel =
    selectedCategory !== null
      ? PASTEL_CATEGORY_OPTIONS.find((o) => o.value === selectedCategory)?.label
      : "Categoria";

  const ratingLabel =
    selectedRating !== null
      ? PASTEL_RATING_OPTIONS.find((o) => o.value === selectedRating)?.label
      : "Calificacion";

  const hasFilters =
    selectedPrice !== null || selectedCategory !== null || selectedRating !== null;

  const firstName = userName.trim().split(/\s+/)[0] || "Usuario";

  const filterTone = {
    color: FILTER_OPTION_BG,
    accent: FILTER_OPTION_ACCENT,
  };

  /* =============================
     UI
  ==============================*/

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>

      {/* ===== MODALES ===== */}
      <FilterModal
        visible={showPriceModal}
        title="Filtrar por Precio"
        options={PASTEL_PRICE_OPTIONS}
        selectedValue={selectedPrice}
        onSelect={setSelectedPrice}
        onClose={() => setShowPriceModal(false)}
      />

      <FilterModal
        visible={showCategoryModal}
        title="Filtrar por Categoría"
        options={PASTEL_CATEGORY_OPTIONS}
        selectedValue={selectedCategory}
        onSelect={setSelectedCategory}
        onClose={() => setShowCategoryModal(false)}
      />

      <FilterModal
        visible={showRatingModal}
        title="Filtrar por Calificación"
        options={PASTEL_RATING_OPTIONS}
        selectedValue={selectedRating}
        onSelect={setSelectedRating}
        onClose={() => setShowRatingModal(false)}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
      >
        {/* HEADER */}

          <LinearGradient
            colors={[
              "rgba(10, 65, 38, 0.97)",
              "rgba(39, 174, 96, 0.93)",
              "rgba(255, 185, 73, 0.78)",
            ]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.newTopHeader}
          >
            <View style={styles.decorCircle1} />
            <View style={styles.decorCircle2} />

            <Text style={styles.eyebrow}>LocalEats</Text>
            <Text
              style={styles.newTopTitle}
              numberOfLines={1}
              adjustsFontSizeToFit
              minFontScale={0.78}
            >
              Bienvenido, {firstName}
            </Text>
            <Text style={styles.newTopSubtitle}>
              Encuentra restaurantes cerca de ti
            </Text>
          </LinearGradient>

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
              <Text style={styles.sectionTitleWhite}>Cerca de ti</Text>
              <Text style={styles.sectionSubtitleWhite}>
                Los restaurantes más cercanos
              </Text>
            </View>

            <TouchableOpacity
              style={styles.verMasButton}
              onPress={() =>
                navigation.navigate("NearbyScreen", {
                  restaurants: sortedRestaurants,
                })
              }
            >
              <Text style={styles.verMasButtonText}>Mirar más</Text>
            </TouchableOpacity>
          </View>

          {/* HORIZONTAL */}
          <FlatList
            horizontal
            data={nearbyRestaurants}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <RestaurantCardHorizontal item={item} navigation={navigation} />
            )}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingLeft: 16, paddingBottom: 20 }}
          />

        <HomeSectionHeader title="Explorar" />

        {/* ===== FILTROS ===== */}
        <View style={styles.filtersWrapper}>

            <View style={styles.filtersRow}>
              {/* Botón Precio */}
              <FilterChip
                title={priceLabel}
                color={filterTone.color}
                accent={filterTone.accent}
                active={selectedPrice !== null}
                onPress={() => setShowPriceModal(true)}
                onClear={
                  selectedPrice !== null ? () => setSelectedPrice(null) : null
                }
              />

              {/* Botón Categoría */}
              <FilterChip
                title={categoryLabel}
                color={filterTone.color}
                accent={filterTone.accent}
                active={selectedCategory !== null}
                onPress={() => setShowCategoryModal(true)}
                onClear={
                  selectedCategory !== null
                    ? () => setSelectedCategory(null)
                    : null
                }
              />

              {/* Botón Calificación */}
              <FilterChip
                title={ratingLabel}
                color={filterTone.color}
                accent={filterTone.accent}
                active={selectedRating !== null}
                onPress={() => setShowRatingModal(true)}
                onClear={
                  selectedRating !== null ? () => setSelectedRating(null) : null
                }
              />
            </View>

            {/* Limpiar todos los filtros */}
            {hasFilters && (
              <TouchableOpacity
                style={styles.clearAllButton}
                onPress={() => {
                  setSelectedPrice(null);
                  setSelectedCategory(null);
                  setSelectedRating(null);
                }}
              >
                <Text style={styles.clearAllText}>× Limpiar filtros</Text>
              </TouchableOpacity>
            )}
        </View>

        {/* HEADER RESTAURANTES */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionHeaderTitleGroup}>
            <Text style={styles.sectionTitle}>
              {hasFilters || searchText
                ? `Resultados (${filteredRestaurants.length})`
                : "Restaurantes"}
            </Text>
            <View style={styles.sectionLine} />
          </View>

          {!hasFilters && !searchText && (
            <TouchableOpacity
              style={styles.verMasPill}
              onPress={() =>
                navigation.navigate("TopRatedScreen", { restaurants })
              }
            >
              <Text style={styles.verMas}>Ver más</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* RESULTADOS */}
        {filteredRestaurants.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>🔍</Text>
            <Text style={styles.emptyText}>
              No encontramos restaurantes con esos filtros
            </Text>
            <TouchableOpacity
              onPress={() => {
                setSelectedPrice(null);
                setSelectedCategory(null);
                setSelectedRating(null);
                setSearchText("");
              }}
            >
              <Text style={styles.emptyAction}>Limpiar filtros</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={
              hasFilters || searchText
                ? filteredRestaurants
                : topRatedRestaurants
            }
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            renderItem={({ item }) => (
              <RestaurantCardVertical item={item} navigation={navigation} />
            )}
            contentContainerStyle={{
              paddingHorizontal: 16,
              paddingBottom: 20,
            }}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

/* =============================
   CHIP DE FILTRO
==============================*/

// Chip pequeno que abre filtro y permite limpiarlo si esta activo.
function FilterChip({ title, color, accent, active, onPress, onClear }) {
  return (
    <View style={styles.chipWrapper}>
      <TouchableOpacity
        style={[
          styles.chip,
          { backgroundColor: color || "#fff" },
          active && styles.chipActive,
          active && { borderColor: accent || "#27AE60" },
        ]}
        onPress={onPress}
        activeOpacity={0.75}
      >
        <Text
          style={[
            styles.chipText,
            active && styles.chipTextActive,
            active && { color: accent || "#27AE60" },
          ]}
          numberOfLines={1}
        >
          {title}
        </Text>
        <Text
          style={[
            styles.chipArrow,
            active && styles.chipArrowActive,
            active && { color: accent || "#27AE60" },
          ]}
        >
          ▾
        </Text>
      </TouchableOpacity>

      {/* Botón X para limpiar este filtro */}
      {onClear && (
        <TouchableOpacity
          style={[
            styles.chipClear,
            { backgroundColor: accent || "#27AE60" },
          ]}
          onPress={onClear}
        >
          <Text style={styles.chipClearText}>×</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// Encabezado discreto para separar bloques dentro del inicio.
function HomeSectionHeader({ title }) {
  return (
    <View style={styles.homeSectionHeader}>
      <Text style={styles.homeSectionTitle}>{title}</Text>
      <View style={styles.homeSectionLine} />
    </View>
  );
}

/* =============================
   ESTILOS
==============================*/

const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: "#f2f2f2",
  },

  scroll: {
    flex: 1,
  },

  scrollContent: {
    paddingBottom: 80,
  },

  loading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  background: {
    width: "100%",
  },

  searchContainer: {
    padding: 16,
  },

  search: {
    backgroundColor: "white",
    padding: 14,
    borderRadius: 12,
    marginTop: 10,
    fontSize: 16,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },

  sectionCard: {
    backgroundColor: "white",
    marginHorizontal: 16,
    marginTop: 2,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    elevation: 3,
    shadowColor: "#27AE60",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.09,
    shadowRadius: 7,
  },

  newTopHeader: {
    width: "100%",
    paddingTop: 60,
    paddingBottom: 36,
    alignItems: "center",
    overflow: "hidden",
    position: "relative",
    borderRadius: 0,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
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

  eyebrow: {
    color: "rgba(255,255,255,0.78)",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1,
    textTransform: "uppercase",
    zIndex: 2,
  },

  newTopTitle: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "900",
    marginTop: 6,
    textAlign: "center",
    zIndex: 2,
  },

  newTopSubtitle: {
    color: "rgba(255,255,255,0.84)",
    fontSize: 14,
    marginTop: 5,
    textAlign: "center",
    zIndex: 2,
  },

  sectionTextContainer: {
    flex: 1,
  },

  sectionTitleWhite: {
    fontSize: 17,
    fontWeight: "800",
    color: "#222",
  },

  sectionSubtitleWhite: {
    color: "#888",
    fontSize: 13,
    marginTop: 2,
  },

  verMasButton: {
    backgroundColor: "#E8F8F0",
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#BFE8D0",
  },

  verMasButtonText: {
    color: "#27AE60",
    fontWeight: "bold",
  },

  /* ===== FILTROS ===== */

  filtersWrapper: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    borderRadius: 20,
    padding: 12,
    marginBottom: 20,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
  },

  filtersRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
  },

  chipWrapper: {
    flex: 1,
    position: "relative",
  },

  chip: {
    backgroundColor: "#fff",
    borderRadius: 14,
    paddingVertical: 11,
    paddingHorizontal: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    elevation: 0,
    borderWidth: 1.5,
    borderColor: "transparent",
  },

  chipActive: {
    backgroundColor: "#E8F8F0",
    borderColor: "#27AE60",
  },

  chipText: {
    color: "#444",
    fontWeight: "600",
    fontSize: 12,
    flexShrink: 1,
  },

  chipTextActive: {
    color: "#27AE60",
  },

  chipArrow: {
    fontSize: 10,
    color: "#888",
    marginLeft: 3,
  },

  chipArrowActive: {
    color: "#27AE60",
  },

  chipClear: {
    position: "absolute",
    top: -6,
    right: -6,
    backgroundColor: "#27AE60",
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1,
    elevation: 4,
  },

  chipClearText: {
    color: "white",
    fontSize: 9,
    fontWeight: "bold",
  },

  clearAllButton: {
    alignSelf: "center",
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 14,
    backgroundColor: "#F4F6F4",
    borderWidth: 1.2,
    borderColor: "#E0E0E0",
  },

  clearAllText: {
    color: "#888",
    fontSize: 12,
    fontWeight: "600",
  },

  /* ===== SECCIÓN RESTAURANTES ===== */

  homeSectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 10,
    marginTop: 16,
  },

  homeSectionTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#444",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginRight: 10,
  },

  homeSectionLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#E0E0E0",
  },

  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 10,
  },

  sectionHeaderTitleGroup: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    marginRight: 12,
  },

  sectionTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#444",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginRight: 10,
  },

  sectionLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#E0E0E0",
  },

  verMasPill: {
    backgroundColor: "#E8F8F0",
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: "#BFE8D0",
  },

  verMas: {
    color: "#27AE60",
    fontWeight: "bold",
  },

  /* ===== ESTADO VACÍO ===== */

  emptyContainer: {
    alignItems: "center",
    paddingVertical: 40,
    paddingHorizontal: 32,
  },

  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },

  emptyText: {
    fontSize: 15,
    color: "#666",
    textAlign: "center",
    marginBottom: 16,
  },

  emptyAction: {
    color: "#27AE60",
    fontWeight: "bold",
    fontSize: 14,
  },

  /* ===== MODAL ===== */

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },

  modalSheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === "ios" ? 36 : 24,
    paddingTop: 12,
    maxHeight: "75%",
  },

  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: "#ddd",
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 16,
  },

  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },

  modalTitleDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#27AE60",
    marginRight: 10,
  },

  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#222",
  },

  modalOptionsScroll: {
    maxHeight: 420,
  },

  modalOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 16,
    marginBottom: 8,
    backgroundColor: "#f7f7f7",
    borderWidth: 1.5,
    borderColor: "transparent",
  },

  modalOptionSelected: {
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },

  modalOptionLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },

  modalIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },

  modalIconText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "900",
  },

  modalOptionText: {
    fontSize: 15,
    color: "#333",
  },

  modalOptionTextSelected: {
    color: "#27AE60",
    fontWeight: "700",
  },

  checkmark: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#27AE60",
    justifyContent: "center",
    alignItems: "center",
  },

  checkmarkText: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
  },

  modalCloseButton: {
    marginTop: 12,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: "#f0f0f0",
    alignItems: "center",
  },

  modalCloseText: {
    color: "#555",
    fontWeight: "600",
    fontSize: 15,
  },
});

