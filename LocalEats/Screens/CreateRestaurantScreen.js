import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  Image,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
} from "react-native";

import * as Location from "expo-location";
import * as ImagePicker from "expo-image-picker";
import { auth, db } from "../firebaseConfig";
import { collection, addDoc } from "firebase/firestore";
import { LinearGradient } from "expo-linear-gradient";

const { width } = Dimensions.get("window");
const GREEN = "#27AE60";
const DARK_GREEN = "#1A5C35";
const PHOTO_SIZE = (width - 64) / 3;
const CLOUD_NAME = "dyyqxxm7z";
const UPLOAD_PRESET = "localeats_unsigned";

const DAYS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

const CATEGORY_CHIPS = [
  { label: "🍣 Sushi", value: "sushi" },
  { label: "🍕 Pizza", value: "pizza" },
  { label: "🍔 Hamburguesas", value: "hamburger" },
  { label: "🌮 Tacos", value: "mexican" },
  { label: "🍜 Ramen", value: "ramen" },
  { label: "🥗 Ensaladas", value: "salad" },
  { label: "🍗 Pollo", value: "chicken" },
  { label: "🥩 Carnes", value: "steak" },
  { label: "🦞 Mariscos", value: "seafood" },
  { label: "🍦 Postres", value: "dessert" },
  { label: "☕ Café", value: "cafe" },
  { label: "🥑 Vegano", value: "vegan" },
  { label: "🍝 Italiana", value: "italian" },
  { label: "🥡 China", value: "chinese" },
];

const STEPS = ["Información", "Horario", "Fotos"];

// Flujo por pasos para que un propietario registre su restaurante.
export default function CreateRestaurantScreen({ navigation }) {
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [website, setWebsite] = useState("");
  const [description, setDescription] = useState("");
  const [selectedTypes, setSelectedTypes] = useState([]);
  const [priceLevel, setPriceLevel] = useState(null);
  const [images, setImages] = useState([]);
  const [saving, setSaving] = useState(false);

  const [schedule, setSchedule] = useState(
    DAYS.map((day) => ({ day, open: "", close: "", closed: false }))
  );

  // Actualiza solo el dia que el usuario esta editando.
  function updateSchedule(index, field, value) {
    const updated = [...schedule];
    updated[index][field] = value;
    setSchedule(updated);
  }

  function toggleType(value) {
    setSelectedTypes((prev) =>
      prev.includes(value) ? prev.filter((t) => t !== value) : [...prev, value]
    );
  }

  // Permite elegir varias fotos, respetando el limite del formulario.
  async function pickImage() {
    if (images.length >= 6) {
      Alert.alert("Límite", "Máximo 6 fotos");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.85,
    });
    if (!result.canceled) {
      const uris = result.assets.map((a) => a.uri);
      setImages((prev) => [...prev, ...uris].slice(0, 6));
    }
  }

  
  // Sube cada foto a Cloudinary y devuelve las URLs finales.
  async function uploadImages() {
  const uploadedUrls = [];

  for (let i = 0; i < images.length; i++) {
    const formData = new FormData();

    formData.append("file", {
      uri: images[i],
      type: "image/jpeg",
      name: `restaurant_${Date.now()}_${i}.jpg`,
    });

    formData.append("upload_preset", UPLOAD_PRESET);
    formData.append("folder", "restaurants");

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
      {
        method: "POST",
        body: formData,
      }
    );

    const data = await response.json();

    console.log("Respuesta Cloudinary:", data);

    if (!response.ok || !data.secure_url) {
      throw new Error(data?.error?.message || "No se pudo subir la imagen");
    }

    uploadedUrls.push(data.secure_url);
  }

  return uploadedUrls;
}


  // Revisa lo minimo necesario antes de avanzar de paso.
  function validateStep() {
    if (step === 0) {
      if (!name.trim()) { Alert.alert("Error", "El nombre es obligatorio"); return false; }
      if (!address.trim()) { Alert.alert("Error", "La dirección es obligatoria"); return false; }
    }
    return true;
  }

  function nextStep() {
    if (!validateStep()) return;
    setStep((s) => Math.min(s + 1, 2));
  }

  function prevStep() {
    setStep((s) => Math.max(s - 1, 0));
  }

  // Guarda la solicitud como pendiente para que un admin la revise.
  async function saveRestaurant() {
    if (images.length === 0) {
      Alert.alert("Fotos requeridas", "Agrega al menos una foto de tu restaurante");
      return;
    }
    setSaving(true);
    try {
      const user = auth.currentUser;
      if (!user) { Alert.alert("Error", "Debes iniciar sesión"); return; }

      const uploadedImages = await uploadImages();
      const location = await Location.getCurrentPositionAsync({});

      const formattedSchedule = schedule.map((item) =>
        item.closed
          ? `${item.day}: Cerrado`
          : `${item.day}: ${item.open || "?"} – ${item.close || "?"}`
      );

      await addDoc(collection(db, "restaurants"), {
        ownerId: user.uid,
        name,
        address,
        phone,
        website,
        description,
        rating: 0,
        price_level: priceLevel,
        types: selectedTypes,
        opening_hours: formattedSchedule,
        image: uploadedImages[0] || null,
        gallery: uploadedImages,
        location: {
          lat: location.coords.latitude,
          lng: location.coords.longitude,
        },
        status: "pending",
        createdAt: new Date(),
        views: 0,
        favoritesCount: 0,
        directionsClicks: 0,
        totalReviews: 0,
        averageRating: 0,
      });

      Alert.alert("✅ Solicitud enviada", "Tu restaurante está en revisión. Lo activaremos pronto.", [
        { text: "OK", onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      console.log("CODE:", error.code);
      console.log("MESSAGE:", error.message);
      console.log("SERVER:", error.serverResponse);
      Alert.alert("Error", error.message);
    } finally {
      setSaving(false);
    }
    
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
        keyboardShouldPersistTaps="handled"
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
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.backBtnText}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.appName}>LocalEats</Text>
          <Text style={styles.headerTitle}>Registrar restaurante</Text>
          <Text style={styles.headerSub}>Completa la información paso a paso</Text>

          {/* STEPPER */}
          <View style={styles.stepperRow}>
            {STEPS.map((label, i) => (
              <React.Fragment key={i}>
                <View style={styles.stepItem}>
                  <View style={[styles.stepDot, i <= step && styles.stepDotActive]}>
                    <Text style={[styles.stepNum, i <= step && styles.stepNumActive]}>
                      {i < step ? "✓" : i + 1}
                    </Text>
                  </View>
                  <Text style={[styles.stepLabel, i === step && styles.stepLabelActive]}>
                    {label}
                  </Text>
                </View>
                {i < 2 && (
                  <View style={[styles.stepLine, i < step && styles.stepLineActive]} />
                )}
              </React.Fragment>
            ))}
          </View>
        </LinearGradient>

        <View style={styles.formBody}>

          {/* ========== PASO 0: INFORMACIÓN ========== */}
          {step === 0 && (
            <>
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
                placeholder="Cuéntanos sobre tu restaurante, especialidad, ambiente..."
                placeholderTextColor="#BBB"
                multiline
                value={description}
                onChangeText={setDescription}
              />

              <FieldLabel label="Dirección *" />
              <TextInput
                style={styles.input}
                placeholder="Calle, número, colonia"
                placeholderTextColor="#BBB"
                value={address}
                onChangeText={setAddress}
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

              <FieldLabel label="Sitio web" />
              <TextInput
                style={styles.input}
                placeholder="https://mirestaurante.com"
                placeholderTextColor="#BBB"
                keyboardType="url"
                autoCapitalize="none"
                value={website}
                onChangeText={setWebsite}
              />

              {/* PRECIO */}
              <FieldLabel label="Rango de precios" />
              <View style={styles.priceRow}>
                {[
                  { v: 1, label: "$", desc: "Económico" },
                  { v: 2, label: "$$", desc: "Moderado" },
                  { v: 3, label: "$$$", desc: "Caro" },
                  { v: 4, label: "$$$$", desc: "Lujoso" },
                ].map((p) => (
                  <TouchableOpacity
                    key={p.v}
                    style={[styles.priceChip, priceLevel === p.v && styles.priceChipActive]}
                    onPress={() => setPriceLevel(p.v)}
                  >
                    <Text style={[styles.priceSymbol, priceLevel === p.v && styles.priceSymbolActive]}>
                      {p.label}
                    </Text>
                    <Text style={[styles.priceDesc, priceLevel === p.v && styles.priceDescActive]}>
                      {p.desc}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* CATEGORÍAS */}
              <FieldLabel label="Categorías" />
              <Text style={styles.hint}>Selecciona todas las que apliquen</Text>
              <View style={styles.chipsGrid}>
                {CATEGORY_CHIPS.map((cat) => (
                  <TouchableOpacity
                    key={cat.value}
                    style={[
                      styles.catChip,
                      selectedTypes.includes(cat.value) && styles.catChipActive,
                    ]}
                    onPress={() => toggleType(cat.value)}
                  >
                    <Text
                      style={[
                        styles.catChipText,
                        selectedTypes.includes(cat.value) && styles.catChipTextActive,
                      ]}
                    >
                      {cat.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}

          {/* ========== PASO 1: HORARIO ========== */}
          {step === 1 && (
            <>
              <View style={styles.scheduleHeader}>
                <Text style={styles.scheduleTitle}>🕐 Horario de atención</Text>
                <Text style={styles.scheduleHint}>Configura tus horas de apertura</Text>
              </View>

              {schedule.map((item, index) => (
                <View key={item.day} style={styles.dayCard}>
                  <View style={styles.dayCardTop}>
                    <Text style={styles.dayName}>{item.day}</Text>
                    <TouchableOpacity
                      style={[styles.toggleClosed, item.closed && styles.toggleClosedActive]}
                      onPress={() => updateSchedule(index, "closed", !item.closed)}
                    >
                      <Text style={[styles.toggleClosedText, item.closed && styles.toggleClosedTextActive]}>
                        {item.closed ? "Cerrado" : "Abierto"}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {!item.closed && (
                    <View style={styles.timeRow}>
                      <View style={styles.timeBlock}>
                        <Text style={styles.timeLabel}>Apertura</Text>
                        <TextInput
                          style={styles.timeInput}
                          placeholder="08:00"
                          placeholderTextColor="#BBB"
                          value={item.open}
                          onChangeText={(t) => updateSchedule(index, "open", t)}
                        />
                      </View>
                      <View style={styles.timeDash}>
                        <Text style={styles.timeDashText}>–</Text>
                      </View>
                      <View style={styles.timeBlock}>
                        <Text style={styles.timeLabel}>Cierre</Text>
                        <TextInput
                          style={styles.timeInput}
                          placeholder="22:00"
                          placeholderTextColor="#BBB"
                          value={item.close}
                          onChangeText={(t) => updateSchedule(index, "close", t)}
                        />
                      </View>
                    </View>
                  )}
                </View>
              ))}
            </>
          )}

          {/* ========== PASO 2: FOTOS ========== */}
          {step === 2 && (
            <>
              <View style={styles.scheduleHeader}>
                <Text style={styles.scheduleTitle}>📷 Fotos del restaurante</Text>
                <Text style={styles.scheduleHint}>
                  Agrega hasta 6 fotos. La primera será tu portada.
                </Text>
              </View>

              <View style={styles.photoGrid}>
                {images.map((uri, i) => (
                  <View key={i} style={styles.photoWrapper}>
                    <Image source={{ uri }} style={styles.photoThumb} />
                    {i === 0 && (
                      <View style={styles.mainBadge}>
                        <Text style={styles.mainBadgeText}>Portada</Text>
                      </View>
                    )}
                    <TouchableOpacity
                      style={styles.photoDelete}
                      onPress={() => setImages((prev) => prev.filter((_, idx) => idx !== i))}
                    >
                      <Text style={styles.photoDeleteText}>✕</Text>
                    </TouchableOpacity>
                  </View>
                ))}

                {images.length < 6 && (
                  <TouchableOpacity style={styles.photoAdd} onPress={pickImage}>
                    <Text style={styles.photoAddIcon}>+</Text>
                    <Text style={styles.photoAddText}>Agregar</Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* TIP */}
              <View style={styles.tipBox}>
                <Text style={styles.tipTitle}>💡 Consejos</Text>
                <Text style={styles.tipText}>• Usa fotos con buena iluminación</Text>
                <Text style={styles.tipText}>• Muestra tus platos más populares</Text>
                <Text style={styles.tipText}>• Incluye fotos del interior del local</Text>
              </View>

              {/* AVISO REVISIÓN */}
              <View style={styles.reviewNotice}>
                <Text style={styles.reviewNoticeIcon}>📋</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.reviewNoticeTitle}>Revisión pendiente</Text>
                  <Text style={styles.reviewNoticeText}>
                    Tu solicitud será revisada por un administrador antes de publicarse.
                    Generalmente tarda menos de 24 horas.
                  </Text>
                </View>
              </View>
            </>
          )}

          {/* NAVEGACIÓN */}
          <View style={styles.navRow}>
            {step > 0 && (
              <TouchableOpacity style={styles.prevButton} onPress={prevStep}>
                <Text style={styles.prevButtonText}>‹ Anterior</Text>
              </TouchableOpacity>
            )}

            {step < 2 ? (
              <TouchableOpacity style={styles.nextButton} onPress={nextStep}>
                <LinearGradient
                  colors={[DARK_GREEN, GREEN]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.nextGradient}
                >
                  <Text style={styles.nextButtonText}>Siguiente ›</Text>
                </LinearGradient>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[styles.nextButton, saving && { opacity: 0.7 }]}
                onPress={saveRestaurant}
                disabled={saving}
              >
                <LinearGradient
                  colors={saving ? ["#AAA", "#888"] : [DARK_GREEN, GREEN]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.nextGradient}
                >
                  {saving ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={styles.nextButtonText}>Enviar solicitud ✓</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// Etiqueta pequena para mantener ordenados los campos del formulario.
function FieldLabel({ label }) {
  return <Text style={styles.fieldLabel}>{label}</Text>;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F4F6F4" },

  /* HEADER */
  header: {
    paddingTop: 60,
    paddingBottom: 24,
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
  headerTitle: { fontSize: 22, fontWeight: "900", color: "#fff", textAlign: "center", marginTop: 6, zIndex: 2 },
  headerSub: { fontSize: 13, color: "rgba(255,255,255,0.75)", textAlign: "center", marginTop: 4, marginBottom: 20, zIndex: 2 },

  /* STEPPER */
  stepperRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  stepItem: { alignItems: "center", width: 72 },
  stepDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.25)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4,
  },
  stepDotActive: { backgroundColor: "#fff" },
  stepNum: { fontSize: 13, fontWeight: "700", color: "rgba(255,255,255,0.7)" },
  stepNumActive: { color: GREEN },
  stepLabel: { fontSize: 11, color: "rgba(255,255,255,0.6)", textAlign: "center" },
  stepLabelActive: { color: "#fff", fontWeight: "700" },
  stepLine: { flex: 1, height: 2, backgroundColor: "rgba(255,255,255,0.25)", marginBottom: 18 },
  stepLineActive: { backgroundColor: "#fff" },

  /* FORM */
  formBody: { padding: 16, marginTop: 4 },

  fieldLabel: {
    fontSize: 12,
    fontWeight: "800",
    color: "#555",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 6,
    marginTop: 4,
  },
  hint: { fontSize: 12, color: "#999", marginBottom: 8, marginTop: -4 },

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
  textarea: { height: 90, textAlignVertical: "top" },

  /* PRECIO */
  priceRow: { flexDirection: "row", gap: 8, marginBottom: 16 },
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
  priceChipActive: { backgroundColor: "#E8F8F0", borderColor: GREEN },
  priceSymbol: { fontSize: 14, fontWeight: "800", color: "#999" },
  priceSymbolActive: { color: GREEN },
  priceDesc: { fontSize: 9, color: "#BBB", marginTop: 2 },
  priceDescActive: { color: GREEN },

  /* CATEGORÍAS */
  chipsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 16 },
  catChip: {
    backgroundColor: "#fff",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: "#E0E0E0",
    elevation: 1,
  },
  catChipActive: { backgroundColor: "#E8F8F0", borderColor: GREEN },
  catChipText: { fontSize: 13, color: "#666", fontWeight: "500" },
  catChipTextActive: { color: GREEN, fontWeight: "700" },

  /* HORARIO */
  scheduleHeader: { marginBottom: 16 },
  scheduleTitle: { fontSize: 17, fontWeight: "800", color: "#222" },
  scheduleHint: { fontSize: 13, color: "#888", marginTop: 3 },

  dayCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  dayCardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  dayName: { fontSize: 15, fontWeight: "700", color: "#222" },
  toggleClosed: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: "#E8F8F0",
  },
  toggleClosedActive: { backgroundColor: "#FFE8E8" },
  toggleClosedText: { fontSize: 12, fontWeight: "700", color: GREEN },
  toggleClosedTextActive: { color: "#E74C3C" },

  timeRow: { flexDirection: "row", alignItems: "flex-end", marginTop: 12, gap: 8 },
  timeBlock: { flex: 1 },
  timeLabel: { fontSize: 11, color: "#999", marginBottom: 4, fontWeight: "600" },
  timeInput: {
    backgroundColor: "#F4F6F4",
    borderRadius: 10,
    padding: 10,
    fontSize: 15,
    fontWeight: "600",
    color: "#222",
    textAlign: "center",
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  timeDash: { paddingBottom: 10 },
  timeDashText: { fontSize: 18, color: "#BBB" },

  /* FOTOS */
  photoGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 16 },
  photoWrapper: { width: PHOTO_SIZE, height: PHOTO_SIZE, position: "relative", borderRadius: 14, overflow: "visible" },
  photoThumb: { width: PHOTO_SIZE, height: PHOTO_SIZE, borderRadius: 14 },
  mainBadge: {
    position: "absolute",
    bottom: 5,
    left: 5,
    backgroundColor: "rgba(39,174,96,0.85)",
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  mainBadgeText: { color: "#fff", fontSize: 9, fontWeight: "700" },
  photoDelete: {
    position: "absolute",
    top: -6,
    right: -6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#E74C3C",
    justifyContent: "center",
    alignItems: "center",
    elevation: 5,
  },
  photoDeleteText: { color: "#fff", fontSize: 11, fontWeight: "800" },
  photoAdd: {
    width: PHOTO_SIZE,
    height: PHOTO_SIZE,
    borderRadius: 14,
    backgroundColor: "#fff",
    borderWidth: 2,
    borderColor: "#DDD",
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
    elevation: 1,
  },
  photoAddIcon: { fontSize: 28, color: GREEN },
  photoAddText: { fontSize: 11, color: GREEN, fontWeight: "600", marginTop: 2 },

  /* TIP BOX */
  tipBox: {
    backgroundColor: "#E8F8F0",
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
    borderLeftWidth: 3,
    borderLeftColor: GREEN,
  },
  tipTitle: { fontSize: 13, fontWeight: "700", color: DARK_GREEN, marginBottom: 6 },
  tipText: { fontSize: 13, color: "#555", marginBottom: 3 },

  /* AVISO */
  reviewNotice: {
    backgroundColor: "#FFF9E6",
    borderRadius: 14,
    padding: 14,
    marginBottom: 20,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    borderLeftWidth: 3,
    borderLeftColor: "#F39C12",
  },
  reviewNoticeIcon: { fontSize: 24 },
  reviewNoticeTitle: { fontSize: 13, fontWeight: "700", color: "#7D5A00", marginBottom: 4 },
  reviewNoticeText: { fontSize: 12, color: "#666", lineHeight: 17 },

  /* NAV BUTTONS */
  navRow: { flexDirection: "row", gap: 10, marginTop: 4 },
  prevButton: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: "#D0D0D0",
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: "center",
  },
  prevButtonText: { color: "#777", fontWeight: "700", fontSize: 15 },
  nextButton: {
    flex: 2,
    borderRadius: 14,
    overflow: "hidden",
    elevation: 4,
    shadowColor: GREEN,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  nextGradient: { paddingVertical: 15, alignItems: "center", borderRadius: 14 },
  nextButtonText: { color: "#fff", fontWeight: "800", fontSize: 15 },
});
