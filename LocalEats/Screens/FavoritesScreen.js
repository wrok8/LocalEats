import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert
} from "react-native";

import { getAuth } from "firebase/auth";

import {
  collection,
  getDocs,
  doc,
  deleteDoc
} from "firebase/firestore";

import { db } from "../firebaseConfig";

export default function FavoritesScreen({
  navigation
}) {
  const [favorites, setFavorites] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    loadFavorites();

    const unsubscribe =
      navigation.addListener(
        "focus",
        () => {
          loadFavorites();
        }
      );

    return unsubscribe;
  }, [navigation]);

  async function loadFavorites() {
    try {
      setLoading(true);

      const user =
        getAuth().currentUser;

      if (!user) return;

      const favoritesRef =
        collection(
          db,
          "users",
          user.uid,
          "favorites"
        );

      const snapshot =
        await getDocs(
          favoritesRef
        );

      const data =
        snapshot.docs.map(
          (docItem) => ({
            id: docItem.id,
            ...docItem.data()
          })
        );

      setFavorites(data);
    } catch (error) {
      console.log(
        "Error cargando favoritos:",
        error
      );
    } finally {
      setLoading(false);
    }
  }

  async function removeFavorite(
    restaurantId
  ) {
    try {
      const user =
        getAuth().currentUser;

      if (!user) return;

      await deleteDoc(
        doc(
          db,
          "users",
          user.uid,
          "favorites",
          restaurantId
        )
      );

      setFavorites((prev) =>
        prev.filter(
          (item) =>
            item.id !==
            restaurantId
        )
      );

      Alert.alert(
        "Eliminado",
        "Se quitó de favoritos"
      );
    } catch (error) {
      console.log(
        "Error eliminando favorito:",
        error
      );
    }
  }

  function renderItem({
    item
  }) {
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() =>
          navigation.navigate(
            "RestaurantDetail",
            {
              restaurant:
                item
            }
          )
        }
      >
        {item.image && (
          <Image
            source={{
              uri: item.image
            }}
            style={
              styles.image
            }
          />
        )}

        <View
          style={
            styles.infoContainer
          }
        >
          <Text
            style={
              styles.name
            }
          >
            {item.name}
          </Text>

          <Text
            style={
              styles.rating
            }
          >
            ⭐{" "}
            {item.rating ||
              "N/A"}
          </Text>

          <Text
            style={
              styles.address
            }
          >
            {item.address ||
              "Sin dirección"}
          </Text>

          <TouchableOpacity
            style={
              styles.removeButton
            }
            onPress={() =>
              removeFavorite(
                item.id
              )
            }
          >
            <Text
              style={
                styles.removeText
              }
            >
              ❌ Quitar
            </Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  }

  if (loading) {
    return (
      <View
        style={
          styles.loadingContainer
        }
      >
        <ActivityIndicator
          size="large"
        />
      </View>
    );
  }

  return (
    <View
      style={
        styles.container
      }
    >
      <Text
        style={styles.title}
      >
        ❤️ Mis favoritos
      </Text>

      {favorites.length ===
      0 ? (
        <View
          style={
            styles.emptyContainer
          }
        >
          <Text
            style={
              styles.emptyText
            }
          >
            No tienes favoritos aún
          </Text>
        </View>
      ) : (
        <FlatList
          data={favorites}
          keyExtractor={(
            item
          ) => item.id}
          renderItem={
            renderItem
          }
          contentContainerStyle={{
            paddingBottom: 30
          }}
        />
      )}
    </View>
  );
}

const styles =
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor:
        "#f7f7f7",
      padding: 16
    },

    loadingContainer: {
      flex: 1,
      justifyContent:
        "center",
      alignItems:
        "center"
    },

    title: {
      fontSize: 24,
      fontWeight:
        "bold",
      marginBottom: 20
    },

    emptyContainer: {
      flex: 1,
      justifyContent:
        "center",
      alignItems:
        "center"
    },

    emptyText: {
      fontSize: 16,
      color: "#777"
    },

    card: {
      backgroundColor:
        "#fff",
      borderRadius: 16,
      marginBottom: 16,
      elevation: 3,
      overflow:
        "hidden"
    },

    image: {
      width: "100%",
      height: 160
    },

    infoContainer: {
      padding: 14
    },

    name: {
      fontSize: 18,
      fontWeight:
        "bold"
    },

    rating: {
      fontSize: 14,
      marginTop: 4,
      color: "#f1c40f"
    },

    address: {
      fontSize: 13,
      marginTop: 6,
      color: "#666"
    },

    removeButton: {
      marginTop: 12,
      backgroundColor:
        "#E74C3C",
      padding: 10,
      borderRadius: 10
    },

    removeText: {
      color: "#fff",
      textAlign: "center",
      fontWeight:
        "bold"
    }
  });