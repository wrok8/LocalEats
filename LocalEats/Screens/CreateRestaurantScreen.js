import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  Image
} from "react-native";

import * as Location from "expo-location";
import * as ImagePicker from "expo-image-picker";

import {
  ref,
  uploadBytes,
  getDownloadURL
} from "firebase/storage";

import {
  auth,
  db,
  storage
} from "../firebaseConfig";

import {
  collection,
  addDoc
} from "firebase/firestore";

const DAYS = [
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
  "Domingo"
];

export default function CreateRestaurantScreen({ navigation }) {
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [website, setWebsite] = useState("");
  const [types, setTypes] = useState("");
  const [images, setImages] = useState([]);

  const [schedule, setSchedule] = useState(
    DAYS.map((day) => ({
      day,
      open: "",
      close: "",
      closed: false
    }))
  );

  function updateSchedule(index, field, value) {
    const updated = [...schedule];
    updated[index][field] = value;
    setSchedule(updated);
  }

  async function pickImage() {
    const result =
      await ImagePicker.launchImageLibraryAsync({
        mediaTypes:
          ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8
      });

    if (!result.canceled) {
      setImages((prev) => [
        ...prev,
        result.assets[0].uri
      ]);
    }
  }

  async function uploadImages() {
    const uploadedUrls = [];

    for (let i = 0; i < images.length; i++) {
      const imageUri = images[i];

      const response = await fetch(imageUri);
      const blob = await response.blob();

      const imageRef = ref(
        storage,
        `restaurants/${Date.now()}_${i}.jpg`
      );

      await uploadBytes(imageRef, blob);

      const downloadURL =
        await getDownloadURL(imageRef);

      uploadedUrls.push(downloadURL);
    }

    return uploadedUrls;
  }

  async function saveRestaurant() {
    try {
      const user = auth.currentUser;

      if (!user) {
        Alert.alert(
          "Error",
          "Debes iniciar sesión"
        );
        return;
      }

      const uploadedImages =
        await uploadImages();

      const location =
        await Location.getCurrentPositionAsync({});

      const formattedSchedule =
        schedule.map((item) =>
          item.closed
            ? `${item.day}: Cerrado`
            : `${item.day}: ${item.open} - ${item.close}`
        );

      await addDoc(
        collection(db, "restaurants"),
        {
          ownerId: user.uid,
          name,
          address,
          phone,
          website,
          rating: 0,
          types: types
            .split(",")
            .map((t) => t.trim()),
          opening_hours: formattedSchedule,
          image:
            uploadedImages[0] || null,
          images: uploadedImages,
          location: {
            lat:
              location.coords.latitude,
            lng:
              location.coords.longitude
          },
          status: "pending",
          createdAt: new Date()
        }
      );

      Alert.alert(
        "Éxito",
        "Solicitud enviada correctamente"
      );

      navigation.goBack();
    } catch (error) {
      console.log(error);

      Alert.alert(
        "Error",
        "No se pudo guardar"
      );
    }
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>
        Registrar restaurante
      </Text>

      <TextInput
        placeholder="Nombre"
        style={styles.input}
        value={name}
        onChangeText={setName}
      />

      <TextInput
        placeholder="Dirección"
        style={styles.input}
        value={address}
        onChangeText={setAddress}
      />

      <TextInput
        placeholder="Teléfono"
        style={styles.input}
        value={phone}
        onChangeText={setPhone}
      />

      <TextInput
        placeholder="Sitio web"
        style={styles.input}
        value={website}
        onChangeText={setWebsite}
      />

      <TextInput
        placeholder="Servicios / tipos"
        style={styles.input}
        value={types}
        onChangeText={setTypes}
      />

      <Text style={styles.sectionTitle}>
        Horario
      </Text>

      {schedule.map((item, index) => (
        <View
          key={item.day}
          style={styles.dayRow}
        >
          <Text style={styles.dayText}>
            {item.day}
          </Text>

          {item.closed ? (
            <Text style={styles.closedText}>
              Cerrado
            </Text>
          ) : (
            <>
              <TextInput
                placeholder="08:00"
                style={styles.timeInput}
                value={item.open}
                onChangeText={(text) =>
                  updateSchedule(
                    index,
                    "open",
                    text
                  )
                }
              />

              <TextInput
                placeholder="22:00"
                style={styles.timeInput}
                value={item.close}
                onChangeText={(text) =>
                  updateSchedule(
                    index,
                    "close",
                    text
                  )
                }
              />
            </>
          )}

          <TouchableOpacity
            style={styles.closedButton}
            onPress={() =>
              updateSchedule(
                index,
                "closed",
                !item.closed
              )
            }
          >
            <Text style={styles.closedButtonText}>
              {item.closed
                ? "Abrir"
                : "Cerrar"}
            </Text>
          </TouchableOpacity>
        </View>
      ))}

      <TouchableOpacity
        style={styles.photoButton}
        onPress={pickImage}
      >
        <Text style={styles.buttonText}>
          Agregar foto
        </Text>
      </TouchableOpacity>

      {images.map((img, index) => (
        <Image
          key={index}
          source={{ uri: img }}
          style={styles.previewImage}
        />
      ))}

      <TouchableOpacity
        style={styles.button}
        onPress={saveRestaurant}
      >
        <Text style={styles.buttonText}>
          Enviar solicitud
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    padding: 12,
    marginBottom: 16
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold"
  },
  dayRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 8
  },
  dayText: {
    width: 90
  },
  timeInput: {
    borderWidth: 1,
    width: 70,
    padding: 8,
    marginHorizontal: 4
  },
  closedButton: {
    backgroundColor: "#3498DB",
    padding: 8,
    borderRadius: 8
  },
  closedButtonText: {
    color: "#fff"
  },
  closedText: {
    color: "red",
    marginHorizontal: 8
  },
  photoButton: {
    backgroundColor: "#3498DB",
    padding: 14,
    borderRadius: 12,
    marginTop: 20
  },
  previewImage: {
    width: "100%",
    height: 180,
    borderRadius: 12,
    marginTop: 10
  },
  button: {
    backgroundColor: "#27AE60",
    padding: 14,
    borderRadius: 12,
    marginTop: 20
  },
  buttonText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "bold"
  }
});