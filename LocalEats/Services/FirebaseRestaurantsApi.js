import {
  collection,
  getDocs,
  query,
  where
} from "firebase/firestore";

import { db } from "../firebaseConfig";

// Trae solo restaurantes ya aprobados para mostrarlos en la app.
export async function getApprovedRestaurants() {
  try {
    const q = query(
      collection(db, "restaurants"),
      where("status", "==", "approved")
    );

    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      source: "firebase",
      ...doc.data()
    }));
  } catch (error) {
    console.log(
      "Error Firebase restaurantes:",
      error
    );
    return [];
  }
}
