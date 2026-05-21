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
import { LinearGradient } from "expo-linear-gradient";
import { logAudit } from "../Logs/FileManager";

// Preferencias locales de la cuenta y salida de sesion.
export default function PreferencesScreen({ navigation }) {

  const [darkMode, setDarkMode] = useState(false);
  const [notifications, setNotifications] = useState(true);

  useEffect(() => {
    loadPreferences();
  }, []);

  // Recupera ajustes guardados en el dispositivo.
  const loadPreferences = async () => {
    const savedTheme = await AsyncStorage.getItem("darkMode");
    const savedNotifications = await AsyncStorage.getItem("notifications");
    await logAudit({
      action: "Se consultaron preferencias locales",
      storage: "AsyncStorage",
      target: "darkMode,notifications",
      userId: auth.currentUser?.uid,
    });

    if (savedTheme !== null) setDarkMode(JSON.parse(savedTheme));
    if (savedNotifications !== null) setNotifications(JSON.parse(savedNotifications));
  };

  // Guarda el cambio de tema para futuras sesiones.
  const toggleTheme = async () => {
    const newValue = !darkMode;
    setDarkMode(newValue);
    await AsyncStorage.setItem("darkMode", JSON.stringify(newValue));
    await logAudit({
      action: "Se modifico preferencia de modo oscuro",
      storage: "AsyncStorage",
      target: "darkMode",
      detail: `valor: ${newValue}`,
      userId: auth.currentUser?.uid,
    });
  };

  // Mantiene la preferencia de notificaciones en almacenamiento local.
  const toggleNotifications = async () => {
    const newValue = !notifications;
    setNotifications(newValue);
    await AsyncStorage.setItem("notifications", JSON.stringify(newValue));
    await logAudit({
      action: "Se modifico preferencia de notificaciones",
      storage: "AsyncStorage",
      target: "notifications",
      detail: `valor: ${newValue}`,
      userId: auth.currentUser?.uid,
    });
  };

  // Cierra sesion despues de confirmar con el usuario.
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
              const currentUserId = auth.currentUser?.uid;
              await signOut(auth);
              await logAudit({
                action: "Cierre de sesion",
                storage: "Firebase Auth",
                target: "auth/session",
                userId: currentUserId,
              });
              await AsyncStorage.removeItem("userEmail");
              await AsyncStorage.removeItem("userPassword");
              await logAudit({
                action: "Se eliminaron credenciales recordadas",
                storage: "AsyncStorage",
                target: "userEmail,userPassword",
                userId: currentUserId,
              });
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
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 40 }}
      showsVerticalScrollIndicator={false}
    >

      {/* HEADER */}
      <LinearGradient
        colors={[
          "rgba(10, 65, 38, 0.97)",
          "rgba(39, 174, 96, 0.93)",
          "rgba(255, 185, 73, 0.78)",
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.decorCircle1} />
        <View style={styles.decorCircle2} />
        <Text style={styles.appName}>LocalEats</Text>
        <Text style={styles.title}>Preferencias</Text>
        <Text style={styles.subtitle}>Personaliza tu experiencia</Text>
      </LinearGradient>

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
  },

  header: {
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
    overflow: "hidden",
    position: "relative",
    alignItems: "center",
    marginBottom: 20,
  },

  decorCircle1: {
    position: "absolute",
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: "rgba(255,255,255,0.06)",
    top: -60,
    right: -50,
  },

  decorCircle2: {
    position: "absolute",
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: "rgba(255,255,255,0.06)",
    bottom: -40,
    left: -30,
  },

  appName: {
    color: "rgba(255,255,255,0.78)",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1,
    textTransform: "uppercase",
    zIndex: 2,
  },

  title: {
    fontSize: 26,
    fontWeight: "900",
    color: "#fff",
    marginTop: 6,
    zIndex: 2,
  },

  subtitle: {
    fontSize: 14,
    color: "rgba(255,255,255,0.84)",
    marginTop: 4,
    zIndex: 2,
  },

  card: {
    backgroundColor: "#fff",
    borderRadius: 15,
    padding: 15,
    marginHorizontal: 20,
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
