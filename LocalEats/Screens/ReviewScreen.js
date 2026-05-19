import React, { useState, useEffect } from "react";
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ActivityIndicator, Alert, FlatList, Keyboard
} from "react-native";
import { getAuth } from "firebase/auth";
import {
  collection, addDoc, query, onSnapshot, orderBy,
  doc, setDoc, getDoc, updateDoc, increment
} from "firebase/firestore";
import { db } from "../firebaseConfig";
import { LinearGradient } from "expo-linear-gradient";

const GREEN = "#27AE60";
const DARK_GREEN = "#1A5C35";

// Pantalla para leer y publicar resenas de un restaurante.
export default function ReviewScreen({ route, navigation }) {
  const { restaurant } = route.params;

  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [appReviews, setAppReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasReviewed, setHasReviewed] = useState(false);
  const [sending, setSending] = useState(false);

  const user = getAuth().currentUser;
  const googleReviews = restaurant.googleReviews || restaurant.reviews || [];

  useEffect(() => {
    const reviewsRef = collection(db, "restaurants", restaurant.id, "reviews");
    const q = query(reviewsRef, orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map((d) => ({
        id: d.id,
        source: "app",
        ...d.data(),
      }));

      setAppReviews(docs);
      setHasReviewed(docs.some((rev) => rev.userId === user?.uid));
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Guarda una unica resena por usuario y recalcula el promedio.
  async function sendReview() {
    if (hasReviewed) {
      Alert.alert("Aviso", "Ya has escrito una reseña para este restaurante.");
      return;
    }

    if (!comment.trim()) {
      Alert.alert("Error", "El comentario no puede estar vacío");
      return;
    }

    setSending(true);

    try {
      const restaurantRef = doc(db, "restaurants", restaurant.id);
      const reviewRef = collection(db, "restaurants", restaurant.id, "reviews");

      const restSnap = await getDoc(restaurantRef);

      if (!restSnap.exists()) {
        await setDoc(restaurantRef, {
          name: restaurant.name,
          averageRating: rating,
          rating,
          reviewsCount: 1,
          totalReviews: 1,
          totalRatingSum: rating,
          address: restaurant.address || restaurant.vicinity || "",
          source: restaurant.source || "google",
        });
      } else {
        const data = restSnap.data();
        const newCount = (data.reviewsCount || 0) + 1;
        const newSum = (data.totalRatingSum || 0) + rating;

        await updateDoc(restaurantRef, {
          reviewsCount: increment(1),
          totalReviews: increment(1),
          totalRatingSum: increment(rating),
          averageRating: newSum / newCount,
          rating: newSum / newCount,
        });
      }

      await addDoc(reviewRef, {
        userId: user.uid,
        userName: user.displayName || user.email.split("@")[0],
        rating,
        comment: comment.trim(),
        createdAt: new Date(),
      });

      setComment("");
      Keyboard.dismiss();
      Alert.alert("Éxito", "Tu reseña ha sido enviada");
    } catch (error) {
      console.log(error);
      Alert.alert("Error", "No se pudo enviar la reseña");
    } finally {
      setSending(false);
    }
  }

  const allReviews = [
    ...appReviews,
    ...googleReviews.map((r, index) => ({
      id: `google-${index}`,
      source: "google",
      userName: r.author_name || "Usuario de Google",
      rating: r.rating || 0,
      comment: r.text || "Sin comentario",
      relativeTime: r.relative_time_description || "",
    })),
  ];

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

        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>‹</Text>
        </TouchableOpacity>

        <Text style={styles.appName}>LocalEats</Text>
        <Text style={styles.headerTitle}>Reseñas</Text>
        <Text style={styles.headerSub}>{restaurant.name}</Text>
      </LinearGradient>

      {!hasReviewed ? (
        <View style={styles.reviewBox}>
          <Text style={styles.boxTitle}>¿Qué te pareció este lugar?</Text>

          <View style={styles.starsSelector}>
            {[1, 2, 3, 4, 5].map((num) => (
              <TouchableOpacity key={num} onPress={() => setRating(num)}>
                <Text style={styles.bigStar}>{num <= rating ? "⭐" : "☆"}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TextInput
            style={styles.input}
            placeholder="Cuéntanos tu experiencia..."
            placeholderTextColor="#999"
            value={comment}
            onChangeText={setComment}
            multiline
          />

          <TouchableOpacity
            style={[styles.btnSend, sending && { opacity: 0.6 }]}
            onPress={sendReview}
            disabled={sending}
          >
            {sending ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.btnText}>Publicar reseña</Text>
            )}
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.alreadyBox}>
          <Text style={styles.alreadyText}>
            ✅ Ya publicaste una reseña sobre este restaurante.
          </Text>
        </View>
      )}

      <View style={styles.sectionHeader}>
        <Text style={styles.subtitle}>Opiniones</Text>
        <Text style={styles.countText}>{allReviews.length} reseñas</Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={GREEN} style={{ marginTop: 30 }} />
      ) : (
        <FlatList
          data={allReviews}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: 40 }}
          renderItem={({ item }) => <ReviewCard item={item} currentUser={user} />}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Text style={styles.emptyIcon}>💬</Text>
              <Text style={styles.emptyText}>Sé el primero en opinar.</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

// Presenta una opinion de LocalEats o Google en el mismo formato.
function ReviewCard({ item, currentUser }) {
  const isMine = item.userId === currentUser?.uid;

  return (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {(item.userName || "U").charAt(0).toUpperCase()}
          </Text>
        </View>

        <View style={{ flex: 1 }}>
          <Text style={styles.cardUser}>
            {item.userName} {isMine ? "(Tú)" : ""}
          </Text>

          <Text style={styles.sourceText}>
            {item.source === "google" ? "Google Maps" : "Localeats"}
            {item.relativeTime ? ` · ${item.relativeTime}` : ""}
          </Text>
        </View>

        <Text style={styles.cardStars}>
          {"⭐".repeat(Math.round(item.rating || 0))}
        </Text>
      </View>

      <Text style={styles.cardComment}>{item.comment}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F4F6F4" },

  header: {
    paddingTop: 58,
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
    top: 54,
    left: 16,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },

  backText: { color: "#fff", fontSize: 28, lineHeight: 30 },

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
    fontSize: 25,
    fontWeight: "900",
    textAlign: "center",
    marginTop: 6,
    zIndex: 2,
  },

  headerSub: {
    color: "rgba(255,255,255,0.8)",
    textAlign: "center",
    marginTop: 4,
    fontSize: 13,
    zIndex: 2,
  },

  reviewBox: {
    backgroundColor: "#fff",
    margin: 16,
    marginTop: 18,
    padding: 16,
    borderRadius: 20,
    elevation: 4,
  },

  boxTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#222",
    marginBottom: 8,
  },

  starsSelector: {
    flexDirection: "row",
    marginVertical: 10,
  },

  bigStar: {
    fontSize: 34,
    marginRight: 4,
  },

  input: {
    backgroundColor: "#F7F7F7",
    borderRadius: 14,
    padding: 12,
    minHeight: 90,
    textAlignVertical: "top",
    fontSize: 14,
    color: "#333",
    borderWidth: 1,
    borderColor: "#eee",
  },

  btnSend: {
    backgroundColor: GREEN,
    padding: 14,
    borderRadius: 14,
    marginTop: 12,
    alignItems: "center",
  },

  btnText: {
    color: "#fff",
    fontWeight: "900",
    fontSize: 15,
  },

  alreadyBox: {
    backgroundColor: "#E8F8F0",
    margin: 16,
    marginTop: 18,
    padding: 16,
    borderRadius: 18,
    borderLeftWidth: 4,
    borderLeftColor: GREEN,
  },

  alreadyText: {
    color: DARK_GREEN,
    fontWeight: "800",
    textAlign: "center",
  },

  sectionHeader: {
    paddingHorizontal: 18,
    marginBottom: 8,
    flexDirection: "row",
    justifyContent: "space-between",
  },

  subtitle: {
    fontSize: 18,
    fontWeight: "900",
    color: "#222",
  },

  countText: {
    color: "#888",
    fontWeight: "700",
  },

  card: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 15,
    borderRadius: 18,
    elevation: 2,
  },

  cardTop: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },

  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#E8F8F0",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },

  avatarText: {
    color: DARK_GREEN,
    fontWeight: "900",
    fontSize: 17,
  },

  cardUser: {
    fontWeight: "900",
    color: "#222",
    fontSize: 14,
  },

  sourceText: {
    fontSize: 11,
    color: "#888",
    marginTop: 2,
  },

  cardStars: {
    fontSize: 13,
  },

  cardComment: {
    color: "#555",
    fontSize: 14,
    lineHeight: 20,
  },

  emptyBox: {
    alignItems: "center",
    marginTop: 40,
  },

  emptyIcon: {
    fontSize: 42,
    marginBottom: 8,
  },

  emptyText: {
    color: "#888",
    fontSize: 14,
  },
});
