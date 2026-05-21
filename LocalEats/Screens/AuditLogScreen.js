import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import {
  clearAuditLog,
  deleteAuditEntry,
  logAudit,
  readAuditEntries,
  shareAuditLog,
} from "../Logs/FileManager";

const GREEN = "#27AE60";
const DARK_GREEN = "#1A5C35";

// Muestra el archivo audit_log.txt como historial legible dentro de la app.
export default function AuditLogScreen({ navigation }) {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      loadEntries();
    }, [])
  );

  async function loadEntries() {
    try {
      setLoading(true);
      const data = await readAuditEntries();
      setEntries(data);
    } finally {
      setLoading(false);
    }
  }

  async function handleShare() {
    await logAudit({
      action: "Se compartio el archivo de auditoria",
      storage: "FileSystem",
      target: "logs/audit_log.txt",
    });
    await shareAuditLog();
    await loadEntries();
  }

  function handleClear() {
    Alert.alert(
      "Limpiar auditoria",
      "Se borraran los registros actuales del archivo audit_log.txt.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Limpiar",
          style: "destructive",
          onPress: async () => {
            await clearAuditLog();
            await loadEntries();
          },
        },
      ]
    );
  }

  function handleDeleteEntry(item) {
    Alert.alert(
      "Eliminar auditoria",
      `Se eliminara solo el registro #${item.number}.`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            await deleteAuditEntry(item);
            await loadEntries();
          },
        },
      ]
    );
  }

  return (
    <View style={styles.container}>
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
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.appName}>LocalEats</Text>
        <Text style={styles.headerTitle}>Auditoria</Text>
        <Text style={styles.headerSub}>Consultas y acciones guardadas en TXT</Text>
      </LinearGradient>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.actionButton} onPress={loadEntries}>
          <Text style={styles.actionText}>Actualizar</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
          <Text style={styles.actionText}>Compartir TXT</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionButton, styles.clearButton]} onPress={handleClear}>
          <Text style={[styles.actionText, styles.clearText]}>Limpiar</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={GREEN} />
        </View>
      ) : (
        <FlatList
          data={entries}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Text style={styles.emptyTitle}>Sin registros</Text>
              <Text style={styles.emptyText}>
                Las acciones apareceran aqui cuando uses la app.
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <AuditCard item={item} onDelete={() => handleDeleteEntry(item)} />
          )}
        />
      )}
    </View>
  );
}

function AuditCard({ item, onDelete }) {
  return (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        <View style={styles.cardTitleGroup}>
          <View style={styles.numberBadge}>
            <Text style={styles.numberText}>#{item.number}</Text>
          </View>
          <Text style={styles.date}>{item.date}</Text>
        </View>
        <Text style={styles.storage}>{item.storage || "LocalEats"}</Text>
      </View>
      <Text style={styles.action}>{item.action}</Text>
      <TouchableOpacity style={styles.deleteEntryButton} onPress={onDelete}>
        <Text style={styles.deleteEntryText}>Eliminar este registro</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F4F6F4",
  },
  header: {
    paddingTop: 58,
    paddingBottom: 22,
    paddingHorizontal: 20,
    overflow: "hidden",
  },
  backBtn: {
    position: "absolute",
    top: 56,
    left: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  backBtnText: {
    color: "#fff",
    fontSize: 24,
    lineHeight: 28,
  },
  appName: {
    color: "rgba(255,255,255,0.78)",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1,
    textTransform: "uppercase",
    textAlign: "center",
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: "#fff",
    textAlign: "center",
    marginTop: 6,
  },
  headerSub: {
    fontSize: 13,
    color: "rgba(255,255,255,0.75)",
    textAlign: "center",
    marginTop: 4,
  },
  actions: {
    flexDirection: "row",
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  actionButton: {
    flex: 1,
    backgroundColor: "transparent",
    borderRadius: 8,
    paddingVertical: 9,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#D8DED8",
  },
  clearButton: {
    borderColor: "#FFBDBD",
  },
  actionText: {
    color: GREEN,
    fontWeight: "800",
    fontSize: 11,
  },
  clearText: {
    color: "#E74C3C",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  listContent: {
    padding: 16,
    paddingTop: 2,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#E5E9E5",
  },
  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    marginBottom: 7,
  },
  cardTitleGroup: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  numberBadge: {
    minWidth: 36,
    borderRadius: 8,
    backgroundColor: "#F1F5F1",
    paddingHorizontal: 7,
    paddingVertical: 4,
    alignItems: "center",
  },
  numberText: {
    color: "#4B5B4F",
    fontSize: 11,
    fontWeight: "900",
  },
  date: {
    flex: 1,
    color: "#666",
    fontSize: 11,
    fontWeight: "700",
  },
  storage: {
    color: DARK_GREEN,
    fontSize: 11,
    fontWeight: "900",
  },
  action: {
    color: "#222",
    fontSize: 14,
    fontWeight: "800",
  },
  deleteEntryButton: {
    alignSelf: "flex-start",
    marginTop: 10,
    borderWidth: 1,
    borderColor: "#E8C5C5",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  deleteEntryText: {
    color: "#E74C3C",
    fontSize: 11,
    fontWeight: "800",
  },
  emptyBox: {
    alignItems: "center",
    paddingVertical: 50,
    paddingHorizontal: 28,
  },
  emptyTitle: {
    fontSize: 18,
    color: "#333",
    fontWeight: "900",
    marginBottom: 6,
  },
  emptyText: {
    color: "#777",
    textAlign: "center",
    lineHeight: 20,
  },
});
