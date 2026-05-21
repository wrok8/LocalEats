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
import { logAudit } from "../Logs/FileManager";

// Guarda un restaurante en favoritos y actualiza su contador.
export async function addFavorite(userId, restaurantId) {
  await addDoc(collection(db, "favorites"), {
    userId,
    restaurantId,
    createdAt: new Date()
  });
  await logAudit({
    action: "Se agrego restaurante a favoritos",
    storage: "Firestore",
    target: "favorites",
    detail: `restaurantId: ${restaurantId}`,
    userId,
  });

  await updateDoc(doc(db, "restaurants", restaurantId), {
    favoritesCount: increment(1)
  });
  await logAudit({
    action: "Se incremento contador de favoritos",
    storage: "Firestore",
    target: `restaurants/${restaurantId}`,
    detail: "Campo modificado: favoritesCount +1",
    userId,
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
  await logAudit({
    action: "Se consulto favorito para eliminar",
    storage: "Firestore",
    target: "favorites",
    detail: `userId == ${userId}; restaurantId == ${restaurantId}; resultados: ${snapshot.size}`,
    userId,
  });

  snapshot.forEach(async (item) => {
    await deleteDoc(doc(db, "favorites", item.id));
    await logAudit({
      action: "Se elimino restaurante de favoritos",
      storage: "Firestore",
      target: `favorites/${item.id}`,
      detail: `restaurantId: ${restaurantId}`,
      userId,
    });
  });

  await updateDoc(doc(db, "restaurants", restaurantId), {
    favoritesCount: increment(-1)
  });
  await logAudit({
    action: "Se decremento contador de favoritos",
    storage: "Firestore",
    target: `restaurants/${restaurantId}`,
    detail: "Campo modificado: favoritesCount -1",
    userId,
  });
}
