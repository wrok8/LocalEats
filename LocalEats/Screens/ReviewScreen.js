import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  FlatList,
  Keyboard
} from "react-native";
import { getAuth } from "firebase/auth";
import {
  collection,
  addDoc,
  query,
  onSnapshot,
  orderBy,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  increment,
  where,
  getDocs
} from "firebase/firestore";
import { db } from "../firebaseConfig";

export default function ReviewScreen({ route, navigation }) {
  const { restaurant } = route.params;
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasReviewed, setHasReviewed] = useState(false); // Estado para saber si ya opinó
  const [sending, setSending] = useState(false);

  const user = getAuth().currentUser;

  useEffect(() => {
    // 1. Escuchar reseñas de todos los usuarios
    const reviewsRef = collection(db, "restaurants", restaurant.id, "reviews");
    const q = query(reviewsRef, orderBy("createdAt", "desc"));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setReviews(docs);
      
      // 2. Verificar si el usuario actual está en la lista de reseñas
      const alreadyReviewed = docs.some(rev => rev.userId === user?.uid);
      setHasReviewed(alreadyReviewed);
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const sendReview = async () => {
    if (hasReviewed) {
      Alert.alert("Aviso", "Ya has escrito una reseña para este restaurante.");
      return;
    }

    if (comment.trim() === "") {
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
          reviewsCount: 1,
          totalRatingSum: rating,
          address: restaurant.address || ""
        });
      } else {
        const data = restSnap.data();
        const newCount = (data.reviewsCount || 0) + 1;
        const newSum = (data.totalRatingSum || 0) + rating;
        await updateDoc(restaurantRef, {
          reviewsCount: increment(1),
          totalRatingSum: increment(rating),
          averageRating: newSum / newCount
        });
      }

      await addDoc(reviewRef, {
        userId: user.uid,
        userName: user.displayName || user.email.split('@')[0],
        rating: rating,
        comment: comment,
        createdAt: new Date()
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
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Reseñas de {restaurant.name}</Text>

      {/* Formulario condicional */}
      {!hasReviewed ? (
        <View style={styles.addReviewBox}>
          <Text>¿Qué te pareció este lugar?</Text>
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
            value={comment} 
            onChangeText={setComment} 
            multiline 
          />
          <TouchableOpacity 
            style={[styles.btnSend, sending && { opacity: 0.6 }]} 
            onPress={sendReview}
            disabled={sending}
          >
            {sending ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Publicar Reseña</Text>}
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.alreadyReviewedBox}>
          <Text style={styles.alreadyText}>✅ Ya has publicado una reseña sobre este restaurante.</Text>
        </View>
      )}

      <Text style={styles.subtitle}>Opiniones de la comunidad:</Text>
      {loading ? <ActivityIndicator size="large" color="#27AE60" /> : (
        <FlatList
          data={reviews}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardUser}>{item.userName} {item.userId === user?.uid && "(Tú)"}</Text>
                <Text>{"⭐".repeat(item.rating)}</Text>
              </View>
              <Text style={styles.cardComment}>{item.comment}</Text>
            </View>
          )}
          ListEmptyComponent={<Text style={{ textAlign: 'center', marginTop: 20 }}>Sé el primero en opinar.</Text>}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", padding: 20 },
  title: { fontSize: 22, fontWeight: "bold", marginBottom: 15 },
  subtitle: { fontSize: 18, fontWeight: "bold", marginVertical: 15 },
  addReviewBox: { backgroundColor: "#f9f9f9", padding: 15, borderRadius: 10, elevation: 2 },
  alreadyReviewedBox: { backgroundColor: "#E8F5E9", padding: 15, borderRadius: 10, borderLeftWidth: 5, borderLeftColor: "#27AE60" },
  alreadyText: { color: "#2E7D32", fontWeight: "bold", textAlign: "center" },
  starsSelector: { flexDirection: "row", marginVertical: 10 },
  bigStar: { fontSize: 32 },
  input: { backgroundColor: "#fff", borderWidth: 1, borderColor: "#ddd", borderRadius: 8, padding: 10, height: 80, textAlignVertical: "top" },
  btnSend: { backgroundColor: "#27AE60", padding: 12, borderRadius: 8, marginTop: 10 },
  btnText: { color: "#fff", textAlign: "center", fontWeight: "bold" },
  card: { padding: 15, borderBottomWidth: 1, borderBottomColor: "#eee" },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 5 },
  cardUser: { fontWeight: "bold", color: "#333" },
  cardComment: { color: "#555" }
});