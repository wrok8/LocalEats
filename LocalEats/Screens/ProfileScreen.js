import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Image,
  ScrollView,
  ActivityIndicator,
  ImageBackground,
  Dimensions,
} from "react-native";

import { getAuth, signOut } from "firebase/auth";
import {
  doc,
  getDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { db } from "../firebaseConfig";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { logAudit } from "../Logs/FileManager";


const { width } = Dimensions.get("window");

/* =============================
   ÍCONOS DE MENÚ
==============================*/
const ACCOUNT_MENU = [
  { icon: "⭐", label: "Mis favoritos", screen: "Favorites", color: "#FFF3CD" },
  { icon: "⚙️", label: "Configuración", screen: "Preferences", color: "#E8F4FD" },
  { icon: "TXT", label: "Auditoria TXT", screen: "AuditLog", color: "#F0E6FF" },
  { icon: "🏪", label: "Registrar restaurante", screen: "CreateRestaurant", color: "#E8F8F0" },
];

const OWNER_MENU = [
  { icon: "🍽️", label: "Mi restaurante", screen: "MyRestaurant", color: "#E8F8F0" },
  { icon: "✏️", label: "Editar información", screen: "EditRestaurant", color: "#FFF3CD" },
  { icon: "📷", label: "Cambiar fotos", screen: "ChangePhotos", color: "#F0E6FF" },
  { icon: "📊", label: "Estadísticas", screen: "Analytics", color: "#E8F4FD" },
];

// Perfil del usuario con accesos segun su rol.
export default function ProfileScreen({ navigation }) {
  const [userData, setUserData] = useState(null);
  const [ownerStats, setOwnerStats] = useState({
    views: 0,
    directionsClicks: 0,
    favoritesCount: 0,
    averageRating: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = navigation.addListener("focus", () => {
      loadUser();
    });

    loadUser();

    return unsub;
  }, [navigation]);

  // Permite cambiar la foto de perfil desde la galeria.
  async function pickProfileImage() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      const imageUri = result.assets[0].uri;
      const user = getAuth().currentUser;
      await updateDoc(doc(db, "users", user.uid), { photoURL: imageUri });
      await logAudit({
        action: "Se actualizo la foto de perfil",
        storage: "Firestore",
        target: `users/${user.uid}`,
        detail: "Campo modificado: photoURL",
        userId: user.uid,
      });
      setUserData({ ...userData, photoURL: imageUri });
    }
  }

 // Carga datos del usuario y, si aplica, sus metricas de propietario.
 async function loadUser() {
  try {
    const auth = getAuth();
      const user = auth.currentUser;
      if (!user) return;

      const userSnap = await getDoc(doc(db, "users", user.uid));
      await logAudit({
        action: "Se consulto el perfil del usuario",
        storage: "Firestore",
        target: `users/${user.uid}`,
        userId: user.uid,
      });

      if (userSnap.exists()) {
        const data = userSnap.data();
        setUserData(data);

        if (data.role === "owner") {
          await loadOwnerStats(user.uid);
        }
      }
    } catch (error) {
      console.log("Error cargando usuario:", error);
    } finally {
      setLoading(false);
    }
  }

  // Confirma antes de cerrar sesion y borrar credenciales guardadas.
  const handleLogout = () => {
  Alert.alert(
    "Cerrar sesión",
    "¿Estás seguro de que quieres cerrar sesión?",
    [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Cerrar sesión",
        style: "destructive",
        onPress: async () => {
          try {
            const currentUserId = getAuth().currentUser?.uid;
            await signOut(getAuth());
            await logAudit({
              action: "Cierre de sesion",
              storage: "Firebase Auth",
              target: "auth/session",
              userId: currentUserId,
            });
            await AsyncStorage.removeItem("userEmail");
            await AsyncStorage.removeItem("userPassword");
            await logAudit({
              action: "Se eliminaron credenciales recordadas",
              storage: "AsyncStorage",
              target: "userEmail,userPassword",
              userId: currentUserId,
            });
            navigation.replace("Login");
          } catch (error) {
            Alert.alert("Error", "No se pudo cerrar sesión");
          }
        },
      },
    ]
  );
};
  
    // Suma metricas de todos los restaurantes del propietario.
    async function loadOwnerStats(uid) {
    try {
      const q = query(
        collection(db, "restaurants"),
        where("ownerId", "==", uid)
      );

      const snapshot = await getDocs(q);
      await logAudit({
        action: "Se consultaron estadisticas de restaurantes del propietario",
        storage: "Firestore",
        target: "restaurants",
        detail: `ownerId == ${uid}; resultados: ${snapshot.size}`,
        userId: uid,
      });

      let totalViews = 0;
      let totalDirections = 0;
      let totalFavorites = 0;
      let ratingSum = 0;
      let ratingCount = 0;

      snapshot.docs.forEach((docItem) => {
        const r = docItem.data();

        totalViews += r.views || 0;
        totalDirections += r.directionsClicks || 0;
        totalFavorites += r.favoritesCount || 0;

        const rating = r.averageRating || r.rating || 0;

        if (rating > 0) {
          ratingSum += rating;
          ratingCount += 1;
        }
      });

      setOwnerStats({
        views: totalViews,
        directionsClicks: totalDirections,
        favoritesCount: totalFavorites,
        averageRating:
          ratingCount > 0 ? (ratingSum / ratingCount).toFixed(1) : "—",
      });
    } catch (error) {
      console.log("Error cargando estadísticas owner:", error);
    }
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#27AE60" />
      </View>
    );
  }

  if (!userData) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={{ color: "#666" }}>No se pudo cargar el perfil</Text>
      </View>
    );
  }

  const isOwner = userData.role === "owner";
  const isAdmin = userData.role === "admin";

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 60 }}
      showsVerticalScrollIndicator={false}
    >
      {/* ===== HEADER CON GRADIENTE ===== */}
      <View style={styles.headerWrapper}>
        <LinearGradient
          colors={[
            "rgba(10, 65, 38, 0.97)",
            "rgba(39, 174, 96, 0.93)",
            "rgba(255, 185, 73, 0.78)",
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.headerGradient}
        >
          {/* Círculos decorativos */}
          <View style={styles.decorCircle1} />
          <View style={styles.decorCircle2} />

          <Text style={styles.appName}>LocalEats</Text>
          <Text style={styles.headerTitle}>Perfil</Text>

          {/* Foto de perfil */}
          <TouchableOpacity
            onPress={pickProfileImage}
            style={styles.avatarWrapper}
            activeOpacity={0.85}
          >
            <Image
              source={{
                uri: userData.photoURL || "https://via.placeholder.com/120",
              }}
              style={styles.profileImage}
            />
            <View style={styles.editAvatarBadge}>
              <Text style={styles.editAvatarIcon}>📷</Text>
            </View>
          </TouchableOpacity>

          <Text style={styles.name}>{userData.name || "Usuario"}</Text>
          <Text style={styles.email}>{userData.email}</Text>

          {/* Badge de rol */}
          <View style={styles.roleBadge}>
            <Text style={styles.roleBadgeText}>
              {isAdmin ? "🛡️ Administrador" : isOwner ? "🏪 Propietario" : "👤 Usuario"}
            </Text>
          </View>
        </LinearGradient>
      </View>

      {/* ===== RESUMEN RÁPIDO (owner) ===== */}
      {isOwner && (
        <View style={styles.statsRow}>
          <StatCard icon="👁️" value={ownerStats.views} label="Vistas" />
          <StatCard icon="📍" value={ownerStats.directionsClicks} label="Cómo llegar" />
          <StatCard icon="❤️" value={ownerStats.favoritesCount} label="Favoritos" />
          <StatCard icon="⭐" value={ownerStats.averageRating} label="Rating" />
        </View>
      )}

      {/* ===== MI CUENTA ===== */}
      <SectionHeader title="Mi cuenta" />
      <View style={styles.menuSection}>
        {ACCOUNT_MENU.map((item, i) => (
          <MenuRow
            key={i}
            item={item}
            onPress={() => navigation.navigate(item.screen)}
          />
        ))}
      </View>

      {/* ===== PANEL PROPIETARIO ===== */}
      {isOwner && (
        <>
          <SectionHeader title="Dashboard negocio" />
          <View style={styles.menuSection}>
            {OWNER_MENU.map((item, i) => (
              <MenuRow
                key={i}
                item={item}
                onPress={() => navigation.navigate(item.screen)}
              />
            ))}
          </View>
        </>
      )}

      {/* ===== PANEL ADMIN ===== */}
      {isAdmin && (
        <>
          <SectionHeader title="Panel administrador" />
          <View style={styles.menuSection}>
            <MenuRow
              item={{ icon: "🛡️", label: "Aprobar restaurantes", screen: "AdminRequests", color: "#FFE8E8" }}
              onPress={() => navigation.navigate("AdminRequests")}
            />
          </View>
        </>
      )}

      {/* ===== CERRAR SESIÓN ===== */}
      <View style={{ paddingHorizontal: 20, marginTop: 8 }}>
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
          activeOpacity={0.8}
        >
          <Text style={styles.logoutText}>Cerrar sesión</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

/* =============================
   SUBCOMPONENTES
==============================*/

// Titulo de seccion con linea para separar bloques del perfil.
function SectionHeader({ title }) {
  return (
    <View style={styles.sectionHeaderRow}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionLine} />
    </View>
  );
}

// Fila de menu que abre una pantalla del perfil.
function MenuRow({ item, onPress }) {
  return (
    <TouchableOpacity
      style={styles.menuRow}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <View style={[styles.menuIconBg, { backgroundColor: item.color }]}>
        <Text style={styles.menuIcon}>{item.icon}</Text>
      </View>
      <Text style={styles.menuLabel}>{item.label}</Text>
      <Text style={styles.menuArrow}>›</Text>
    </TouchableOpacity>
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

/* =============================
   ESTILOS
==============================*/

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F4F6F4",
  },

  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F4F6F4",
  },

  /* HEADER */
  headerWrapper: {
    marginBottom: 0,
  },

  headerGradient: {
    alignItems: "center",
    paddingTop: 60,
    paddingBottom: 36,
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
    zIndex: 2,
  },

  headerTitle: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "900",
    marginTop: 6,
    marginBottom: 18,
    textAlign: "center",
    zIndex: 2,
  },

  avatarWrapper: {
    position: "relative",
    marginBottom: 14,
  },

  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: "rgba(255,255,255,0.7)",
  },

  editAvatarBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    elevation: 3,
  },

  editAvatarIcon: {
    fontSize: 14,
  },

  name: {
    fontSize: 22,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: 0.3,
  },

  email: {
    fontSize: 13,
    color: "rgba(255,255,255,0.75)",
    marginTop: 3,
    marginBottom: 12,
  },

  roleBadge: {
    backgroundColor: "rgba(255,255,255,0.18)",
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
  },

  roleBadgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
  },

  /* STATS */
  statsRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 8,
    backgroundColor: "#fff",
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    elevation: 4,
    shadowColor: "#27AE60",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    marginBottom: 20,
  },

  statCard: {
    flex: 1,
    alignItems: "center",
    backgroundColor: "#F4F6F4",
    borderRadius: 14,
    paddingVertical: 10,
  },

  statIcon: {
    fontSize: 18,
    marginBottom: 2,
  },

  statValue: {
    fontSize: 18,
    fontWeight: "800",
    color: "#27AE60",
  },

  statLabel: {
    fontSize: 10,
    color: "#888",
    marginTop: 2,
    textAlign: "center",
  },

  /* SECCIÓN */
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 10,
    marginTop: 4,
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

  menuSection: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    borderRadius: 20,
    overflow: "hidden",
    marginBottom: 20,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
  },

  menuRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },

  menuIconBg: {
    width: 38,
    height: 38,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },

  menuIcon: {
    fontSize: 18,
  },

  menuLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: "600",
    color: "#222",
  },

  menuArrow: {
    fontSize: 22,
    color: "#CCC",
    fontWeight: "300",
  },

  /* LOGOUT */
  logoutButton: {
    borderWidth: 1.5,
    borderColor: "#E74C3C",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    marginBottom: 10,
  },

  logoutText: {
    color: "#E74C3C",
    fontWeight: "700",
    fontSize: 15,
  },
});
