import {
  collection,
  getDocs,
  query,
  where
} from "firebase/firestore";

import { db } from "../firebaseConfig";
import { logAudit } from "../Logs/FileManager";

// Trae solo restaurantes ya aprobados para mostrarlos en la app.
export async function getApprovedRestaurants() {
  try {
    const q = query(
      collection(db, "restaurants"),
      where("status", "==", "approved")
    );

    const snapshot = await getDocs(q);
    await logAudit({
      action: "Se consultaron restaurantes aprobados",
      storage: "Firestore",
      target: "restaurants",
      detail: `status == approved; resultados: ${snapshot.size}`,
    });

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
