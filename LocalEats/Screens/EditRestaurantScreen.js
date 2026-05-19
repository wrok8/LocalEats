import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";

import * as ImagePicker from "expo-image-picker";
import { getAuth } from "firebase/auth";
import {
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
  writeBatch,
  collectionGroup,
} from "firebase/firestore";
import { db } from "../firebaseConfig";
import { LinearGradient } from "expo-linear-gradient";

const GREEN = "#27AE60";
const DARK_GREEN = "#1A5C35";

/* Categorías predefinidas */
const CATEGORY_CHIPS = [
  "Sushi", "Pizza", "Hamburguesas", "Tacos", "Ramen",
  "Ensaladas", "Pollo", "Carnes", "Postres", "Mariscos",
  "Italiana", "Mexicana", "Vegano", "Café",
];

// Formulario para editar los datos del restaurante del propietario.
export default function EditRestaurantScreen({ navigation }) {
  const [restaurantId, setRestaurantId] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [image, setImage] = useState("");
  const [types, setTypes] = useState([]);
  const [schedule, setSchedule] = useState("");
  const [description, setDescription] = useState("");
  const [priceLevel, setPriceLevel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadRestaurant();
  }, []);

  // Carga el primer restaurante asociado al usuario actual.
  async function loadRestaurant() {
    try {
      const user = getAuth().currentUser;
      const q = query(
        collection(db, "restaurants"),
        where("ownerId", "==", user.uid)
      );
      const snapshot = await getDocs(q);

      if (!snapshot.empty) {
        const docData = snapshot.docs[0];
        const data = docData.data();
        setRestaurantId(docData.id);
        setName(data.name || "");
        setPhone(data.phone || "");
        setAddress(data.address || "");
        setImage(data.image || "");
        setTypes(data.types || []);
        setSchedule(data.opening_hours?.join("\n") || "");
        setDescription(data.description || "");
        setPriceLevel(data.price_level ?? null);
      }
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  }

  // Selecciona una nueva imagen de portada desde la galeria.
  async function pickImage() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
    });
    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  }

  // Agrega o quita categorias sin duplicarlas.
  function toggleType(type) {
    setTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  }

  // Valida lo basico y guarda los cambios en Firestore.
  async function saveChanges() {

    if (!name.trim()) {
      Alert.alert("Error", "El nombre es obligatorio");
      return;
    }
    setSaving(true);
    try {
      await updateDoc(doc(db, "restaurants", restaurantId), {
        name,
        phone,
        address,
        image,
        description,
        price_level: priceLevel,
        types,
        opening_hours: schedule.split("\n").map((s) => s.trim()).filter(Boolean),
      });
      Alert.alert("✅ Guardado", "Restaurante actualizado correctamente", [
        { text: "OK", onPress: () => navigation?.goBack() },
      ]);
    } catch (error) {
      Alert.alert("Error", "No se pudo guardar. Intenta de nuevo.");
      console.log(error);
    } finally {
      setSaving(false);
    }
  }

  // Elimina el restaurante junto con sus resenas internas.
  async function deleteRestaurant() {
  if (!restaurantId) {
    Alert.alert("Error", "No se encontró el restaurante");
    return;
  }

  Alert.alert(
    "Eliminar restaurante",
    "¿Seguro que deseas eliminar este restaurante?",
    [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Eliminar",
        style: "destructive",
        onPress: async () => {
          try {
            setSaving(true);

            const reviewsSnap = await getDocs(
              collection(db, "restaurants", restaurantId, "reviews")
            );

            const batch = writeBatch(db);

            reviewsSnap.forEach((reviewDoc) => {
              batch.delete(reviewDoc.ref);
            });

            batch.delete(doc(db, "restaurants", restaurantId));

            await batch.commit();

            Alert.alert("Restaurante eliminado", "Se eliminó correctamente", [
              { text: "OK", onPress: () => navigation?.goBack() },
            ]);
          } catch (error) {
            console.log("Error eliminando restaurante:", error);
            Alert.alert("Error", "No se pudo eliminar el restaurante");
          } finally {
            setSaving(false);
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
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
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
          <Text style={styles.headerTitle}>Editar restaurante</Text>
          <Text style={styles.headerSubtitle}>
            Mantén tu información siempre actualizada
          </Text>
        </LinearGradient>

        <View style={styles.formContainer}>

          {/* FOTO PRINCIPAL */}
          <TouchableOpacity style={styles.imageUpload} onPress={pickImage} activeOpacity={0.85}>
            {image ? (
              <Image source={{ uri: image }} style={styles.previewImage} />
            ) : (
              <View style={styles.imagePlaceholder}>
                <Text style={styles.imagePlaceholderIcon}>🖼️</Text>
                <Text style={styles.imagePlaceholderText}>Toca para agregar foto de portada</Text>
              </View>
            )}
            <View style={styles.imageEditBadge}>
              <Text style={styles.imageEditText}>📷 Cambiar</Text>
            </View>
          </TouchableOpacity>

          {/* CAMPOS DE TEXTO */}
          <FieldLabel label="Nombre del restaurante *" />
          <TextInput
            style={styles.input}
            placeholder="Ej: La Cocina de Mamá"
            placeholderTextColor="#BBB"
            value={name}
            onChangeText={setName}
          />

          <FieldLabel label="Descripción" />
          <TextInput
            style={[styles.input, styles.textarea]}
            placeholder="Cuéntanos sobre tu restaurante..."
            placeholderTextColor="#BBB"
            multiline
            numberOfLines={3}
            value={description}
            onChangeText={setDescription}
          />

          <FieldLabel label="Teléfono" />
          <TextInput
            style={styles.input}
            placeholder="+52 624 123 4567"
            placeholderTextColor="#BBB"
            keyboardType="phone-pad"
            value={phone}
            onChangeText={setPhone}
          />

          <FieldLabel label="Dirección" />
          <TextInput
            style={styles.input}
            placeholder="Calle, número, colonia"
            placeholderTextColor="#BBB"
            value={address}
            onChangeText={setAddress}
          />

          {/* NIVEL DE PRECIO */}
          <FieldLabel label="Rango de precios" />
          <View style={styles.priceRow}>
            {[
              { value: 1, label: "$", desc: "Económico" },
              { value: 2, label: "$$", desc: "Moderado" },
              { value: 3, label: "$$$", desc: "Caro" },
              { value: 4, label: "$$$$", desc: "Lujoso" },
            ].map((p) => (
              <TouchableOpacity
                key={p.value}
                style={[
                  styles.priceChip,
                  priceLevel === p.value && styles.priceChipActive,
                ]}
                onPress={() => setPriceLevel(p.value)}
              >
                <Text
                  style={[
                    styles.priceChipLabel,
                    priceLevel === p.value && styles.priceChipLabelActive,
                  ]}
                >
                  {p.label}
                </Text>
                <Text
                  style={[
                    styles.priceChipDesc,
                    priceLevel === p.value && styles.priceChipDescActive,
                  ]}
                >
                  {p.desc}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* CATEGORÍAS */}
          <FieldLabel label="Categorías" />
          <Text style={styles.fieldHint}>Selecciona todas las que apliquen</Text>
          <View style={styles.chipsGrid}>
            {CATEGORY_CHIPS.map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[
                  styles.categoryChip,
                  types.includes(cat.toLowerCase()) && styles.categoryChipActive,
                ]}
                onPress={() => toggleType(cat.toLowerCase())}
              >
                <Text
                  style={[
                    styles.categoryChipText,
                    types.includes(cat.toLowerCase()) && styles.categoryChipTextActive,
                  ]}
                >
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* HORARIO */}
          <FieldLabel label="Horario" />
          <Text style={styles.fieldHint}>Un horario por línea (ej: Lunes–Viernes: 8am–10pm)</Text>
          <TextInput
            style={[styles.input, styles.textarea, { height: 110 }]}
            placeholder={"Lunes–Viernes: 8:00am–10:00pm\nSábados: 10:00am–11:00pm\nDomingos: Cerrado"}
            placeholderTextColor="#BBB"
            multiline
            value={schedule}
            onChangeText={setSchedule}
          />

          {/* BOTÓN GUARDAR */}
          <TouchableOpacity
            style={[styles.saveButton, saving && styles.saveButtonDisabled]}
            onPress={saveChanges}
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
                <Text style={styles.saveButtonText}>Guardar cambios</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>


          <TouchableOpacity
            style={styles.deleteButton}
            onPress={deleteRestaurant}
            disabled={saving}
            activeOpacity={0.85}
          >
            <Text style={styles.deleteButtonText}>Eliminar restaurante</Text>
          </TouchableOpacity>

        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}



// Etiqueta simple para que el formulario respire mejor.
function FieldLabel({ label }) {
  return <Text style={styles.fieldLabel}>{label}</Text>;
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

  /* FORM */
  formContainer: {
    padding: 16,
    marginTop: -12,
  },

  /* IMAGEN */
  imageUpload: {
    borderRadius: 20,
    overflow: "hidden",
    marginBottom: 20,
    backgroundColor: "#fff",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    position: "relative",
  },

  previewImage: {
    width: "100%",
    height: 180,
  },

  imagePlaceholder: {
    height: 150,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F0F0F0",
  },

  imagePlaceholderIcon: { fontSize: 36, marginBottom: 8 },

  imagePlaceholderText: {
    fontSize: 13,
    color: "#999",
    textAlign: "center",
  },

  imageEditBadge: {
    position: "absolute",
    bottom: 10,
    right: 10,
    backgroundColor: "rgba(0,0,0,0.55)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },

  imageEditText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },

  /* CAMPOS */
  fieldLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#444",
    marginBottom: 6,
    marginTop: 4,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  fieldHint: {
    fontSize: 12,
    color: "#999",
    marginBottom: 8,
    marginTop: -4,
  },

  input: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 14,
    fontSize: 15,
    color: "#222",
    marginBottom: 14,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    borderWidth: 1.5,
    borderColor: "transparent",
  },

  textarea: {
    height: 90,
    textAlignVertical: "top",
  },

  /* PRECIO */
  priceRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 14,
  },

  priceChip: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#E0E0E0",
    elevation: 1,
  },

  priceChipActive: {
    backgroundColor: "#E8F8F0",
    borderColor: GREEN,
  },

  priceChipLabel: {
    fontSize: 14,
    fontWeight: "800",
    color: "#888",
  },

  priceChipLabelActive: { color: GREEN },

  priceChipDesc: {
    fontSize: 10,
    color: "#AAA",
    marginTop: 2,
  },

  priceChipDescActive: { color: GREEN },

  /* CATEGORÍAS */
  chipsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 14,
  },

  categoryChip: {
    backgroundColor: "#fff",
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: "#E0E0E0",
    elevation: 1,
  },

  categoryChipActive: {
    backgroundColor: "#E8F8F0",
    borderColor: GREEN,
  },

  categoryChipText: {
    fontSize: 13,
    color: "#666",
    fontWeight: "500",
  },

  categoryChipTextActive: {
    color: GREEN,
    fontWeight: "700",
  },

  /* BOTÓN */
  saveButton: {
    borderRadius: 16,
    overflow: "hidden",
    marginTop: 8,
    elevation: 4,
    shadowColor: GREEN,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },

  saveButtonDisabled: {
    elevation: 0,
    shadowOpacity: 0,
  },

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

  deleteButton: {
    marginTop: 14,
    borderWidth: 1.5,
    borderColor: "#E74C3C",
    paddingVertical: 15,
    borderRadius: 16,
    alignItems: "center",
    backgroundColor: "#fff",
  },

  deleteButtonText: {
    color: "#E74C3C",
    fontWeight: "800",
    fontSize: 15,
  },
});
