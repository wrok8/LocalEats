import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Image
} from "react-native";

import {
  collection,
  query,
  where,
  getDocs,
  doc,
  updateDoc
} from "firebase/firestore";

import { db } from "../firebaseConfig";

export default function AdminRestaurantRequestsScreen() {
  const [restaurants, setRestaurants] =
    useState([]);

  useEffect(() => {
    loadPendingRestaurants();
  }, []);

  async function loadPendingRestaurants() {
    const q = query(
      collection(db, "restaurants"),
      where("status", "==", "pending")
    );

    const snapshot = await getDocs(q);

    const data = snapshot.docs.map((docItem) => ({
      id: docItem.id,
      ...docItem.data()
    }));

    setRestaurants(data);
  }

  async function approveRestaurant(id) {
    await updateDoc(
      doc(db, "restaurants", id),
      {
        status: "approved"
      }
    );

    loadPendingRestaurants();
  }

  async function rejectRestaurant(id) {
    await updateDoc(
      doc(db, "restaurants", id),
      {
        status: "rejected"
      }
    );

    loadPendingRestaurants();
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={restaurants}
        keyExtractor={(item) =>
          item.id
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            {item.image && (
              <Image
                source={{
                  uri: item.image
                }}
                style={styles.image}
              />
            )}

            <Text style={styles.name}>
              {item.name}
            </Text>

            <Text>
              {item.address}
            </Text>

            <View style={styles.row}>
              <TouchableOpacity
                style={styles.approve}
                onPress={() =>
                  approveRestaurant(
                    item.id
                  )
                }
              >
                <Text>
                  Aprobar
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.reject}
                onPress={() =>
                  rejectRestaurant(
                    item.id
                  )
                }
              >
                <Text>
                  Rechazar
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles =
  StyleSheet.create({
    container: {
      flex: 1,
      padding: 20
    },
    card: {
      backgroundColor:
        "#fff",
      padding: 16,
      marginBottom: 16,
      borderRadius: 12
    },
    image: {
      width: "100%",
      height: 180,
      borderRadius: 12
    },
    name: {
      fontSize: 18,
      fontWeight: "bold",
      marginVertical: 8
    },
    row: {
      flexDirection: "row",
      marginTop: 12
    },
    approve: {
      backgroundColor:
        "#27AE60",
      padding: 10,
      borderRadius: 8,
      marginRight: 8
    },
    reject: {
      backgroundColor:
        "#E74C3C",
      padding: 10,
      borderRadius: 8
    }
  });