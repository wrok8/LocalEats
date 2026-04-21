import React, {
  useEffect,
  useState
} from "react";

import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Alert
} from "react-native";

import * as ImagePicker from "expo-image-picker";

import { getAuth } from "firebase/auth";

import {
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  doc
} from "firebase/firestore";

import { db } from "../firebaseConfig";

export default function EditRestaurantScreen() {
  const [restaurantId, setRestaurantId] =
    useState("");

  const [name, setName] =
    useState("");

  const [phone, setPhone] =
    useState("");

  const [address, setAddress] =
    useState("");

  const [image, setImage] =
    useState("");

  const [types, setTypes] =
    useState("");

  const [schedule, setSchedule] =
    useState("");

  useEffect(() => {
    loadRestaurant();
  }, []);

  async function loadRestaurant() {
    try {
      const user =
        getAuth().currentUser;

      const q = query(
        collection(
          db,
          "restaurants"
        ),
        where(
          "ownerId",
          "==",
          user.uid
        )
      );

      const snapshot =
        await getDocs(q);

      if (!snapshot.empty) {
        const docData =
          snapshot.docs[0];

        const data =
          docData.data();

        setRestaurantId(
          docData.id
        );

        setName(
          data.name || ""
        );

        setPhone(
          data.phone || ""
        );

        setAddress(
          data.address || ""
        );

        setImage(
          data.image || ""
        );

        setTypes(
          data.types?.join(
            ", "
          ) || ""
        );

        setSchedule(
          data
            .opening_hours?.join(
              "\n"
            ) || ""
        );
      }
    } catch (error) {
      console.log(error);
    }
  }

  async function pickImage() {
    const result =
      await ImagePicker.launchImageLibraryAsync(
        {
          mediaTypes:
            ImagePicker.MediaTypeOptions.Images,
          quality: 1
        }
      );

    if (!result.canceled) {
      setImage(
        result.assets[0].uri
      );
    }
  }

  async function saveChanges() {
    try {
      await updateDoc(
        doc(
          db,
          "restaurants",
          restaurantId
        ),
        {
          name,
          phone,
          address,
          image,
          types: types
            .split(",")
            .map((t) =>
              t.trim()
            ),
          opening_hours:
            schedule
              .split("\n")
              .map((s) =>
                s.trim()
              )
        }
      );

      Alert.alert(
        "Éxito",
        "Restaurante actualizado"
      );
    } catch (error) {
      console.log(error);
    }
  }

  return (
    <ScrollView
      style={
        styles.container
      }
    >
      <Text
        style={styles.title}
      >
        Editar restaurante
      </Text>

      <TextInput
        style={styles.input}
        placeholder="Nombre"
        value={name}
        onChangeText={setName}
      />

      <TextInput
        style={styles.input}
        placeholder="Teléfono"
        value={phone}
        onChangeText={setPhone}
      />

      <TextInput
        style={styles.input}
        placeholder="Dirección"
        value={address}
        onChangeText={
          setAddress
        }
      />

      <TextInput
        style={styles.input}
        placeholder="Tipos (coma)"
        value={types}
        onChangeText={setTypes}
      />

      <TextInput
        style={[
          styles.input,
          {
            height: 120
          }
        ]}
        multiline
        placeholder="Horario (uno por línea)"
        value={schedule}
        onChangeText={
          setSchedule
        }
      />

      {image ? (
        <Image
          source={{
            uri: image
          }}
          style={
            styles.image
          }
        />
      ) : null}

      <TouchableOpacity
        style={
          styles.button
        }
        onPress={
          pickImage
        }
      >
        <Text
          style={
            styles.buttonText
          }
        >
          Cambiar foto
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={
          styles.saveButton
        }
        onPress={
          saveChanges
        }
      >
        <Text
          style={
            styles.buttonText
          }
        >
          Guardar cambios
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles =
  StyleSheet.create({
    container: {
      flex: 1,
      padding: 16,
      backgroundColor:
        "#fff"
    },

    title: {
      fontSize: 24,
      fontWeight:
        "bold",
      marginBottom: 20
    },

    input: {
      borderWidth: 1,
      borderColor:
        "#ddd",
      borderRadius: 12,
      padding: 14,
      marginBottom: 16
    },

    image: {
      width: "100%",
      height: 200,
      borderRadius: 12,
      marginBottom: 16
    },

    button: {
      backgroundColor:
        "#3498DB",
      padding: 14,
      borderRadius: 12,
      marginBottom: 16
    },

    saveButton: {
      backgroundColor:
        "#27AE60",
      padding: 14,
      borderRadius: 12
    },

    buttonText: {
      color: "#fff",
      textAlign: "center",
      fontWeight:
        "bold"
    }
  });