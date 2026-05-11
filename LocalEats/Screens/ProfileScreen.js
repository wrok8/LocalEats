import React, {
  useEffect,
  useState
} from "react";

import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  ActivityIndicator
} from "react-native";

import { getAuth } from "firebase/auth";
import {
  doc,
  getDoc
} from "firebase/firestore";

import { db } from "../firebaseConfig";

import * as ImagePicker from "expo-image-picker";
import { updateDoc} from "firebase/firestore";


export default function ProfileScreen({
  navigation
}) {
  const [userData, setUserData] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    loadUser();
  }, []);

  async function pickProfileImage() {
  const result =
    await ImagePicker.launchImageLibraryAsync({
      mediaTypes:
        ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1
    });

  if (!result.canceled) {
    const imageUri = result.assets[0].uri;

    const user = getAuth().currentUser;

    await updateDoc(
      doc(db, "users", user.uid),
      {
        photoURL: imageUri
      }
    );

    setUserData({
      ...userData,
      photoURL: imageUri
    });
  }
}

  async function loadUser() {
    try {
      const auth = getAuth();
      const user = auth.currentUser;

      if (!user) return;

      const userRef = doc(
        db,
        "users",
        user.uid
      );

      const userSnap =
        await getDoc(userRef);

      if (userSnap.exists()) {
        setUserData(
          userSnap.data()
        );
      }
    } catch (error) {
      console.log(
        "Error cargando usuario:",
        error
      );
    } finally {
      setLoading(false);
    }
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
          color="#27AE60"
        />
      </View>
    );
  }

  if (!userData) {
    return (
      <View
        style={
          styles.loadingContainer
        }
      >
        <Text>
          No se pudo cargar el perfil
        </Text>
      </View>
    );
  }

  const isOwner =
    userData.role === "owner";

    const isAdmin =
  userData.role === "admin";

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{
        paddingBottom: 40
      }}
    >

      
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={pickProfileImage}>
        <Image
          source={{
            uri:
              userData.photoURL ||
              "https://via.placeholder.com/120"
          }}
          style={styles.profileImage}
        />
      </TouchableOpacity>

        <Text style={styles.name}>
          {userData.name ||
            "Usuario"}
        </Text>

        <Text style={styles.email}>
          {userData.email}
        </Text>
      </View>

      {/* CUENTA */}
      <View style={styles.section}>
        <Text
          style={
            styles.sectionTitle
          }
        >
          Mi cuenta
        </Text>

        <TouchableOpacity
          style={
            styles.cardButton
          }
          onPress={() =>
            navigation.navigate(
              "Favorites"
            )
          }
        >
          <Text
            style={
              styles.cardText
            }
          >
            ⭐ Mis favoritos
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={
            styles.cardButton
          }
          onPress={() =>
            navigation.navigate(
              "Preferences"
            )
          }
        >
          <Text
            style={
              styles.cardText
            }
          >
            ⚙ Configuración
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={
            styles.cardButton
          }
          onPress={() =>
            navigation.navigate(
              "CreateRestaurant"
            )
          }
        >
          <Text
            style={
              styles.cardText
            }
          >
            🏪 Registrar restaurante
          </Text>
        </TouchableOpacity>
      </View>

      {/* OWNER */}
      {isOwner && (
        <View
          style={styles.section}
        >
          <Text
            style={
              styles.sectionTitle
            }
          >
            Dashboard negocio
          </Text>

          {[
            {
              label:
                "🍽 Mi restaurante",
              screen:
                "MyRestaurant"
            },
            {
              label:
                "✏ Editar info",
              screen:
                "EditRestaurant"
            },
            {
              label:
                "📷 Cambiar fotos",
              screen:
                "ChangePhotos"
            },
            {
              label:
                "🔥 Promociones",
              screen:
                "Promotions"
            },
            {
              label:
                "📊 Estadísticas",
              screen:
                "Analytics"
            }
          ].map(
            (
              item,
              index
            ) => (
              <TouchableOpacity
                key={index}
                style={
                  styles.cardButton
                }
                onPress={() =>
                  navigation.navigate(
                    item.screen
                  )
                }
              >
                <Text
                  style={
                    styles.cardText
                  }
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            )
          )}
        </View>
      )}
      {/* ADMIN */}
{isAdmin && (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>
      Panel administrador
    </Text>

    <TouchableOpacity
      style={styles.cardButton}
      onPress={() =>
        navigation.navigate(
          "AdminRequests"
        )
      }
    >
      <Text style={styles.cardText}>
        🛡 Aprobar restaurantes
      </Text>
    </TouchableOpacity>
  </View>
)}

      {/* RESUMEN */}
      {isOwner && (
        <View
          style={
            styles.analyticsBox
          }
        >
          <Text
            style={
              styles.sectionTitle
            }
          >
            Resumen rápido
          </Text>

          <Text
            style={
              styles.analyticsText
            }
          >
            👁 Vistas:{" "}
            {userData.views || 0}
          </Text>

          <Text
            style={
              styles.analyticsText
            }
          >
            📍 Cómo llegar:{" "}
            {userData.directionsClicks ||
              0}
          </Text>

          <Text
            style={
              styles.analyticsText
            }
          >
            ⭐ Favoritos:{" "}
            {userData.favoritesCount ||
              0}
          </Text>

          <Text
            style={
              styles.analyticsText
            }
          >
            ⭐ Rating:{" "}
            {userData.averageRating ||
              "N/A"}
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles =
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor:
        "#f7f7f7"
    },

    loadingContainer: {
      flex: 1,
      justifyContent:
        "center",
      alignItems:
        "center"
    },

    header: {
      alignItems:
        "center",
      paddingTop: 50,
      paddingBottom: 30,
      backgroundColor:
        "#fff",
      marginBottom: 20
    },

    profileImage: {
      width: 110,
      height: 110,
      borderRadius: 55,
      marginBottom: 16
    },

    name: {
      fontSize: 24,
      fontWeight:
        "bold"
    },

    email: {
      fontSize: 14,
      color: "#777",
      marginTop: 4
    },

    section: {
      paddingHorizontal: 20,
      marginBottom: 24
    },

    sectionTitle: {
      fontSize: 18,
      fontWeight:
        "bold",
      marginBottom: 12
    },

    cardButton: {
      backgroundColor:
        "#fff",
      padding: 18,
      borderRadius: 16,
      marginBottom: 12,
      elevation: 3
    },

    cardText: {
      fontSize: 16,
      fontWeight:
        "600"
    },

    analyticsBox: {
      marginHorizontal: 20,
      backgroundColor:
        "#fff",
      padding: 20,
      borderRadius: 16,
      elevation: 3
    },

    analyticsText: {
      fontSize: 16,
      marginBottom: 8
    }
  });