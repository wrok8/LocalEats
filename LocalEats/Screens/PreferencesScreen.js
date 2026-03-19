import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Switch,
  StyleSheet,
  Alert,
  TouchableOpacity,
  ScrollView
} from "react-native";

import AsyncStorage from "@react-native-async-storage/async-storage";
import { signOut } from "firebase/auth";
import { auth } from "../firebaseConfig";

export default function PreferencesScreen({ navigation }) {

  const [darkMode, setDarkMode] = useState(false);
  const [notifications, setNotifications] = useState(true);

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    const savedTheme = await AsyncStorage.getItem("darkMode");
    const savedNotifications = await AsyncStorage.getItem("notifications");

    if (savedTheme !== null) setDarkMode(JSON.parse(savedTheme));
    if (savedNotifications !== null) setNotifications(JSON.parse(savedNotifications));
  };

  const toggleTheme = async () => {
    const newValue = !darkMode;
    setDarkMode(newValue);
    await AsyncStorage.setItem("darkMode", JSON.stringify(newValue));
  };

  const toggleNotifications = async () => {
    const newValue = !notifications;
    setNotifications(newValue);
    await AsyncStorage.setItem("notifications", JSON.stringify(newValue));
  };

  const handleLogout = () => {
    Alert.alert(
      "Cerrar sesión",
      "¿Estás seguro de que quieres cerrar sesión?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Cerrar sesión",
          style: "destructive",
          onPress: async () => {
            try {
              await signOut(auth);
              await AsyncStorage.removeItem("userEmail");
              await AsyncStorage.removeItem("userPassword");
              navigation.replace("Login");
            } catch (error) {
              Alert.alert("Error", "No se pudo cerrar sesión");
            }
          }
        }
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>

      {/* HEADER */}
      <Text style={styles.title}>Preferencias</Text>
      <Text style={styles.subtitle}>Personaliza tu experiencia</Text>

      {/* TARJETA CONFIG */}
      <View style={styles.card}>

        <View style={styles.row}>
          <View>
            <Text style={styles.label}>Modo oscuro</Text>
            <Text style={styles.description}>Cambia la apariencia</Text>
          </View>
          <Switch value={darkMode} onValueChange={toggleTheme} />
        </View>

        <View style={styles.divider} />

        <View style={styles.row}>
          <View>
            <Text style={styles.label}>Notificaciones</Text>
            <Text style={styles.description}>Recibir alertas</Text>
          </View>
          <Switch value={notifications} onValueChange={toggleNotifications} />
        </View>

      </View>

      {/* TARJETA CUENTA */}
      <View style={styles.card}>

        <Text style={styles.sectionTitle}>Cuenta</Text>

        <View style={styles.infoBox}>
          <Text style={styles.infoText}>Sesión activa</Text>
          <Text style={styles.subText}>Gestiona tu cuenta</Text>
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Cerrar sesión</Text>
        </TouchableOpacity>

      </View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: "#f1f1f1",
    padding: 20,
  },

  title: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#222",
  },

  subtitle: {
    fontSize: 14,
    color: "#666",
    marginBottom: 20,
  },

  card: {
    backgroundColor: "#fff",
    borderRadius: 15,
    padding: 15,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 3,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
  },

  label: {
    fontSize: 16,
    fontWeight: "500",
  },

  description: {
    fontSize: 12,
    color: "#777",
  },

  divider: {
    height: 1,
    backgroundColor: "#eee",
    marginVertical: 10,
  },

  infoBox: {
    marginTop: 10,
    marginBottom: 20,
  },

  infoText: {
    fontSize: 16,
    fontWeight: "bold",
  },

  subText: {
    fontSize: 13,
    color: "#777",
  },

  logoutButton: {
    backgroundColor: "#E74C3C",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
  },

  logoutText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },

});