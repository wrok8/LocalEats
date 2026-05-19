import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  deleteDoc,
  doc,
  increment,
  updateDoc
} from "firebase/firestore";

import { db } from "../firebaseConfig";

// Guarda un restaurante en favoritos y actualiza su contador.
export async function addFavorite(userId, restaurantId) {
  await addDoc(collection(db, "favorites"), {
    userId,
    restaurantId,
    createdAt: new Date()
  });

  await updateDoc(doc(db, "restaurants", restaurantId), {
    favoritesCount: increment(1)
  });
}

// Quita un favorito sin dejar el contador en numeros negativos.
export async function removeFavorite(userId, restaurantId) {
  const q = query(
    collection(db, "favorites"),
    where("userId", "==", userId),
    where("restaurantId", "==", restaurantId)
  );

  const snapshot = await getDocs(q);

  snapshot.forEach(async (item) => {
    await deleteDoc(doc(db, "favorites", item.id));
  });

  await updateDoc(doc(db, "restaurants", restaurantId), {
    favoritesCount: increment(-1)
  });
}
