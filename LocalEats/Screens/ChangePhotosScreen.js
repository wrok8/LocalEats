import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Alert,
  ActivityIndicator,
  FlatList,
  Dimensions,
} from "react-native";

import * as ImagePicker from "expo-image-picker";
import { getAuth } from "firebase/auth";
import {
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  doc,
} from "firebase/firestore";
import { db } from "../firebaseConfig";
import { LinearGradient } from "expo-linear-gradient";
import { logAudit } from "../Logs/FileManager";

const { width } = Dimensions.get("window");
const PHOTO_SIZE = (width - 52) / 3;

const GREEN = "#27AE60";
const DARK_GREEN = "#1A5C35";

// Permite actualizar portada y galeria del restaurante.
export default function ChangePhotosScreen({ navigation }) {
  const [restaurantId, setRestaurantId] = useState("");
  const [mainImage, setMainImage] = useState("");
  const [gallery, setGallery] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadRestaurant();
  }, []);

  // Carga las fotos actuales del restaurante del propietario.
  async function loadRestaurant() {
    try {
      const user = getAuth().currentUser;
      const q = query(
        collection(db, "restaurants"),
        where("ownerId", "==", user.uid)
      );
      const snapshot = await getDocs(q);
      await logAudit({
        action: "Se consultaron fotos del restaurante del propietario",
        storage: "Firestore",
        target: "restaurants",
        detail: `ownerId == ${user.uid}; resultados: ${snapshot.size}`,
        userId: user.uid,
      });
      if (!snapshot.empty) {
        const docData = snapshot.docs[0];
        const data = docData.data();
        setRestaurantId(docData.id);
        setMainImage(data.image || "");
        setGallery(data.gallery || []);
      }
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  }

  // Selecciona la imagen principal con formato ancho.
  async function pickMainImage() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 1,
    });
    if (!result.canceled) {
      setMainImage(result.assets[0].uri);
    }
  }

  // Agrega varias fotos a la galeria sin pasar el limite.
  async function pickGalleryImages() {
    if (gallery.length >= 8) {
      Alert.alert("Límite alcanzado", "Máximo 8 fotos en la galería.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 1,
    });
    if (!result.canceled) {
      const newUris = result.assets.map((a) => a.uri);
      setGallery((prev) => [...prev, ...newUris].slice(0, 8));
    }
  }

  // Confirma antes de quitar una foto de la galeria.
  function removeGalleryPhoto(index) {
    Alert.alert("Eliminar foto", "¿Estás seguro?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Eliminar",
        style: "destructive",
        onPress: () =>
          setGallery((prev) => prev.filter((_, i) => i !== index)),
      },
    ]);
  }

  // Guarda portada y galeria en el documento del restaurante.
  async function savePhotos() {
    setSaving(true);
    try {
      await updateDoc(doc(db, "restaurants", restaurantId), {
        image: mainImage,
        gallery,
      });
      await logAudit({
        action: "Se actualizaron fotos del restaurante",
        storage: "Firestore",
        target: `restaurants/${restaurantId}`,
        detail: `galeria: ${gallery.length} fotos`,
        userId: getAuth().currentUser?.uid,
      });
      Alert.alert("✅ Guardado", "Fotos actualizadas correctamente", [
        { text: "OK", onPress: () => navigation?.goBack() },
      ]);
    } catch (error) {
      Alert.alert("Error", "No se pudieron guardar las fotos.");
      console.log(error);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={GREEN} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 60 }}
      showsVerticalScrollIndicator={false}
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
        style={styles.header}
      >
        <View style={styles.decorCircle1} />
        <View style={styles.decorCircle2} />
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation?.goBack()}
        >
          <Text style={styles.backButtonText}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.appName}>LocalEats</Text>
        <Text style={styles.headerTitle}>Cambiar fotos</Text>
        <Text style={styles.headerSubtitle}>
          Las fotos son lo primero que ven tus clientes
        </Text>
      </LinearGradient>

      <View style={styles.content}>

        {/* FOTO PRINCIPAL */}
        <SectionTitle title="Foto de portada" subtitle="Imagen principal que verán los usuarios" />
        <TouchableOpacity
          style={styles.mainImageContainer}
          onPress={pickMainImage}
          activeOpacity={0.85}
        >
          {mainImage ? (
            <Image source={{ uri: mainImage }} style={styles.mainImage} />
          ) : (
            <View style={styles.mainImagePlaceholder}>
              <Text style={styles.placeholderIcon}>🖼️</Text>
              <Text style={styles.placeholderText}>Toca para seleccionar portada</Text>
            </View>
          )}
          <View style={styles.mainImageOverlay}>
            <View style={styles.changeButton}>
              <Text style={styles.changeButtonText}>📷  Cambiar portada</Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* GALERÍA */}
        <SectionTitle
          title={`Galería de fotos (${gallery.length}/8)`}
          subtitle="Muestra el ambiente, platos y más"
        />

        <View style={styles.galleryGrid}>
          {gallery.map((uri, index) => (
            <View key={index} style={styles.galleryItem}>
              <Image source={{ uri }} style={styles.galleryImage} />
              <TouchableOpacity
                style={styles.deleteBtn}
                onPress={() => removeGalleryPhoto(index)}
              >
                <Text style={styles.deleteBtnText}>✕</Text>
              </TouchableOpacity>
            </View>
          ))}

          {gallery.length < 8 && (
            <TouchableOpacity
              style={styles.addPhotoBtn}
              onPress={pickGalleryImages}
            >
              <Text style={styles.addPhotoBtnIcon}>+</Text>
              <Text style={styles.addPhotoBtnText}>Agregar</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* TIPS */}
        <View style={styles.tipsBox}>
          <Text style={styles.tipsTitle}>📌 Consejos para mejores fotos</Text>
          <Text style={styles.tipItem}>• Usa luz natural siempre que sea posible</Text>
          <Text style={styles.tipItem}>• Muestra tus platos más populares</Text>
          <Text style={styles.tipItem}>• Incluye fotos del interior y ambiente</Text>
          <Text style={styles.tipItem}>• Evita fotos borrosas o muy oscuras</Text>
        </View>

        {/* BOTÓN GUARDAR */}
        <TouchableOpacity
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          onPress={savePhotos}
          disabled={saving}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={saving ? ["#AAA", "#888"] : [DARK_GREEN, GREEN]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.saveGradient}
          >
            {saving ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.saveButtonText}>Guardar fotos</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

// Encabezado corto para cada bloque de fotos.
function SectionTitle({ title, subtitle }) {
  return (
    <View style={styles.sectionTitleWrapper}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {subtitle && <Text style={styles.sectionSubtitle}>{subtitle}</Text>}
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
  header: {
    paddingTop: 60,
    paddingBottom: 30,
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

  backButton: {
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

  backButtonText: { color: "#fff", fontSize: 24, lineHeight: 28 },

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

  headerSubtitle: {
    fontSize: 13,
    color: "rgba(255,255,255,0.75)",
    textAlign: "center",
    marginTop: 6,
    zIndex: 2,
  },

  content: {
    padding: 16,
  },

  sectionTitleWrapper: {
    marginBottom: 10,
    marginTop: 8,
  },

  sectionTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#333",
  },

  sectionSubtitle: {
    fontSize: 12,
    color: "#888",
    marginTop: 2,
  },

  /* FOTO PRINCIPAL */
  mainImageContainer: {
    borderRadius: 20,
    overflow: "hidden",
    marginBottom: 20,
    backgroundColor: "#E0E0E0",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    position: "relative",
  },

  mainImage: {
    width: "100%",
    height: 200,
  },

  mainImagePlaceholder: {
    height: 180,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F0F0F0",
  },

  placeholderIcon: { fontSize: 40, marginBottom: 10 },

  placeholderText: { fontSize: 13, color: "#999" },

  mainImageOverlay: {
    position: "absolute",
    bottom: 12,
    left: 0,
    right: 0,
    alignItems: "center",
  },

  changeButton: {
    backgroundColor: "rgba(0,0,0,0.55)",
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
  },

  changeButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 13,
  },

  /* GALERÍA */
  galleryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 20,
  },

  galleryItem: {
    width: PHOTO_SIZE,
    height: PHOTO_SIZE,
    borderRadius: 14,
    overflow: "visible",
    position: "relative",
  },

  galleryImage: {
    width: PHOTO_SIZE,
    height: PHOTO_SIZE,
    borderRadius: 14,
  },

  deleteBtn: {
    position: "absolute",
    top: -6,
    right: -6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#E74C3C",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
    elevation: 5,
  },

  deleteBtnText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "800",
  },

  addPhotoBtn: {
    width: PHOTO_SIZE,
    height: PHOTO_SIZE,
    borderRadius: 14,
    backgroundColor: "#fff",
    borderWidth: 2,
    borderColor: "#DDD",
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
  },

  addPhotoBtnIcon: {
    fontSize: 28,
    color: GREEN,
    fontWeight: "300",
  },

  addPhotoBtnText: {
    fontSize: 11,
    color: GREEN,
    fontWeight: "600",
    marginTop: 2,
  },

  /* TIPS */
  tipsBox: {
    backgroundColor: "#E8F8F0",
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderLeftWidth: 3,
    borderLeftColor: GREEN,
  },

  tipsTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: DARK_GREEN,
    marginBottom: 8,
  },

  tipItem: {
    fontSize: 13,
    color: "#555",
    marginBottom: 4,
    lineHeight: 18,
  },

  /* BOTÓN */
  saveButton: {
    borderRadius: 16,
    overflow: "hidden",
    elevation: 4,
    shadowColor: GREEN,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },

  saveButtonDisabled: { elevation: 0, shadowOpacity: 0 },

  saveGradient: {
    paddingVertical: 16,
    alignItems: "center",
    borderRadius: 16,
  },

  saveButtonText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 16,
    letterSpacing: 0.5,
  },
});
