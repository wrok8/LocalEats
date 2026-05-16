import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Dimensions,
  TouchableOpacity,
} from "react-native";

import { getAuth } from "firebase/auth";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../firebaseConfig";
import { LineChart, BarChart } from "react-native-chart-kit";
import { LinearGradient } from "expo-linear-gradient";

const screenWidth = Dimensions.get("window").width;

/* =============================
   COLORES DE MARCA
==============================*/
const GREEN = "#27AE60";
const DARK_GREEN = "#1A5C35";
const LIGHT_GREEN = "#E8F8F0";

export default function AnalyticsScreen({ navigation }) {
  const [restaurant, setRestaurant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("resumen");

  useEffect(() => {
    loadAnalytics();
  }, []);

  async function loadAnalytics() {
    try {
      const user = getAuth().currentUser;
      if (!user) return;

      const q = query(
        collection(db, "restaurants"),
        where("ownerId", "==", user.uid)
      );
      const snapshot = await getDocs(q);

      if (!snapshot.empty) {
        setRestaurant(snapshot.docs[0].data());
      }
    } catch (error) {
      console.log("Error analytics:", error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={GREEN} />
      </View>
    );
  }

  if (!restaurant) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.emptyText}>No se encontró restaurante</Text>
        <TouchableOpacity onPress={() => navigation?.goBack()}>
          <Text style={styles.backLink}>← Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const views = restaurant.views || 0;
  const directions = restaurant.directionsClicks || 0;
  const favorites = restaurant.favoritesCount || 0;
  const rating = restaurant.averageRating || 0;
  const totalReviews = restaurant.totalReviews || restaurant.reviewsCount || 0;

  /* Datos simulados de tendencia semanal */
  const weeklyViews = [
    Math.max(0, views - 30),
    Math.max(0, views - 22),
    Math.max(0, views - 18),
    Math.max(0, views - 10),
    Math.max(0, views - 6),
    Math.max(0, views - 2),
    views,
  ];

  const weeklyFavorites = [
    Math.max(0, favorites - 12),
    Math.max(0, favorites - 9),
    Math.max(0, favorites - 7),
    Math.max(0, favorites - 4),
    Math.max(0, favorites - 2),
    Math.max(0, favorites - 1),
    favorites,
  ];

  const chartConfig = {
    backgroundGradientFrom: "#fff",
    backgroundGradientTo: "#fff",
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(39, 174, 96, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(80, 80, 80, ${opacity})`,
    propsForDots: {
      r: "5",
      strokeWidth: "2",
      stroke: DARK_GREEN,
    },
    propsForBackgroundLines: {
      strokeDasharray: "4",
      stroke: "#F0F0F0",
    },
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 60 }}
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
        <TouchableOpacity
          onPress={() => navigation?.goBack()}
          style={styles.backButton}
        >
          <Text style={styles.backButtonText}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.appName}>LocalEats</Text>
        <Text style={styles.headerTitle}>Estadísticas</Text>
        <Text style={styles.headerSubtitle}>{restaurant.name || "Mi restaurante"}</Text>
      </LinearGradient>

      {/* TABS */}
      <View style={styles.tabRow}>
        {["resumen", "vistas", "engagement"].map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ===== TAB: RESUMEN ===== */}
      {activeTab === "resumen" && (
        <View style={styles.section}>
          {/* Cards de métricas */}
          <View style={styles.cardsGrid}>
            <MetricCard icon="👁️" value={views} label="Vistas totales" color="#E8F4FD" accent="#3498DB" />
            <MetricCard icon="📍" value={directions} label="Cómo llegar" color={LIGHT_GREEN} accent={GREEN} />
            <MetricCard icon="❤️" value={favorites} label="Favoritos" color="#FFE8E8" accent="#E74C3C" />
            <MetricCard icon="⭐" value={rating > 0 ? rating.toFixed(1) : "—"} label="Rating promedio" color="#FFF3CD" accent="#F39C12" />
          </View>

          {/* Rating visual */}
          <View style={styles.ratingCard}>
            <Text style={styles.ratingTitle}>Calificación</Text>
            <View style={styles.ratingRow}>
              <Text style={styles.ratingBig}>{rating > 0 ? rating.toFixed(1) : "—"}</Text>
              <View style={styles.starsBlock}>
                {[1, 2, 3, 4, 5].map((s) => (
                  <Text key={s} style={[styles.star, s <= Math.round(rating) && styles.starActive]}>
                    ★
                  </Text>
                ))}
                <Text style={styles.reviewCount}>{totalReviews} reseñas</Text>
              </View>
            </View>
            <RatingBar percent={Math.min(100, (rating / 5) * 100)} />
          </View>

          {/* Conversión */}
          <View style={styles.conversionCard}>
            <Text style={styles.conversionTitle}>Tasa de conversión</Text>
            <Text style={styles.conversionSub}>
              De vistas a navegación
            </Text>
            <View style={styles.conversionRow}>
              <ConversionStat label="Vistas" value={views} color="#3498DB" />
              <Text style={styles.conversionArrow}>→</Text>
              <ConversionStat label="Cómo llegar" value={directions} color={GREEN} />
              <Text style={styles.conversionArrow}>→</Text>
              <ConversionStat label="Favoritos" value={favorites} color="#E74C3C" />
            </View>
            <View style={styles.conversionBar}>
              <View style={[styles.conversionFill, { width: `${views > 0 ? Math.min(100, (favorites / views) * 100) : 0}%`, backgroundColor: GREEN }]} />
            </View>
            <Text style={styles.conversionPercent}>
              {views > 0 ? ((favorites / views) * 100).toFixed(1) : 0}% de vistas se convierten en favoritos
            </Text>
          </View>
        </View>
      )}

      {/* ===== TAB: VISTAS ===== */}
      {activeTab === "vistas" && (
        <View style={styles.section}>
          <View style={styles.chartCard}>
            <Text style={styles.chartTitle}>Vistas esta semana</Text>
            <Text style={styles.chartSubtitle}>Tendencia de los últimos 7 días</Text>
            <LineChart
              data={{
                labels: ["L", "M", "M", "J", "V", "S", "D"],
                datasets: [{ data: weeklyViews }],
              }}
              width={screenWidth - 64}
              height={200}
              yAxisInterval={1}
              chartConfig={chartConfig}
              bezier
              style={styles.chartStyle}
            />
          </View>

          <View style={styles.chartCard}>
            <Text style={styles.chartTitle}>Favoritos acumulados</Text>
            <Text style={styles.chartSubtitle}>Crecimiento semanal</Text>
            <BarChart
              data={{
                labels: ["L", "M", "M", "J", "V", "S", "D"],
                datasets: [{ data: weeklyFavorites }],
              }}
              width={screenWidth - 64}
              height={200}
              chartConfig={{
                ...chartConfig,
                color: (opacity = 1) => `rgba(231, 76, 60, ${opacity})`,
              }}
              style={styles.chartStyle}
            />
          </View>
        </View>
      )}

      {/* ===== TAB: ENGAGEMENT ===== */}
      {activeTab === "engagement" && (
        <View style={styles.section}>
          <View style={styles.engagementCard}>
            <Text style={styles.engagementTitle}>Interacciones del usuario</Text>

            <EngagementRow icon="👁️" label="Vistas" value={views} max={Math.max(views, directions, favorites, 1)} color="#3498DB" />
            <EngagementRow icon="📍" label="Solicitudes de ruta" value={directions} max={Math.max(views, directions, favorites, 1)} color={GREEN} />
            <EngagementRow icon="❤️" label="Guardados en favoritos" value={favorites} max={Math.max(views, directions, favorites, 1)} color="#E74C3C" />
            <EngagementRow icon="⭐" label="Reseñas recibidas" value={totalReviews} max={Math.max(views, directions, favorites, totalReviews, 1)} color="#F39C12" />
          </View>

          {/* Consejos */}
          <View style={styles.tipsCard}>
            <Text style={styles.tipsTitle}>💡 Consejos para mejorar</Text>
            {views < 50 && (
              <TipRow text="Agrega más fotos de calidad para atraer más vistas." />
            )}
            {favorites < 10 && (
              <TipRow text="Ofrece promociones especiales para que más usuarios te guarden." />
            )}
            {rating < 4 && rating > 0 && (
              <TipRow text="Responde a los comentarios negativos para mejorar tu reputación." />
            )}
            {directions < 5 && (
              <TipRow text="Verifica que tu dirección esté correcta para facilitar la navegación." />
            )}
            {views >= 50 && favorites >= 10 && rating >= 4 && (
              <TipRow text="¡Excelente rendimiento! Sigue así y considera agregar promociones." />
            )}
          </View>
        </View>
      )}
    </ScrollView>
  );
}

/* =============================
   SUBCOMPONENTES
==============================*/

function MetricCard({ icon, value, label, color, accent }) {
  return (
    <View style={[styles.metricCard, { backgroundColor: color }]}>
      <Text style={styles.metricIcon}>{icon}</Text>
      <Text style={[styles.metricValue, { color: accent }]}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

function RatingBar({ percent }) {
  return (
    <View style={styles.ratingBarBg}>
      <View style={[styles.ratingBarFill, { width: `${percent}%` }]} />
    </View>
  );
}

function ConversionStat({ label, value, color }) {
  return (
    <View style={styles.conversionItem}>
      <Text style={[styles.conversionValue, { color }]}>{value}</Text>
      <Text style={styles.conversionLabel}>{label}</Text>
    </View>
  );
}

function EngagementRow({ icon, label, value, max, color }) {
  const percent = max > 0 ? (value / max) * 100 : 0;
  return (
    <View style={styles.engRow}>
      <Text style={styles.engIcon}>{icon}</Text>
      <View style={styles.engInfo}>
        <View style={styles.engLabelRow}>
          <Text style={styles.engLabel}>{label}</Text>
          <Text style={[styles.engValue, { color }]}>{value}</Text>
        </View>
        <View style={styles.engBarBg}>
          <View style={[styles.engBarFill, { width: `${percent}%`, backgroundColor: color }]} />
        </View>
      </View>
    </View>
  );
}

function TipRow({ text }) {
  return (
    <View style={styles.tipRow}>
      <View style={styles.tipDot} />
      <Text style={styles.tipText}>{text}</Text>
    </View>
  );
}

/* =============================
   ESTILOS
==============================*/

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F4F6F4",
  },

  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F4F6F4",
  },

  emptyText: { color: "#666", fontSize: 15, marginBottom: 12 },

  backLink: { color: GREEN, fontWeight: "700" },

  /* HEADER */
  header: {
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
    overflow: "hidden",
    position: "relative",
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

  backButton: {
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

  backButtonText: { color: "#fff", fontSize: 24, lineHeight: 28 },

  appName: {
    color: "rgba(255,255,255,0.78)",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1,
    textTransform: "uppercase",
    textAlign: "center",
    zIndex: 2,
  },

  headerTitle: {
    fontSize: 26,
    fontWeight: "900",
    color: "#fff",
    textAlign: "center",
    marginTop: 6,
    zIndex: 2,
  },

  headerSubtitle: {
    fontSize: 13,
    color: "rgba(255,255,255,0.75)",
    textAlign: "center",
    marginTop: 4,
    zIndex: 2,
  },

  /* TABS */
  tabRow: {
    flexDirection: "row",
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginTop: -16,
    borderRadius: 16,
    padding: 4,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    marginBottom: 16,
  },

  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: "center",
  },

  tabActive: { backgroundColor: GREEN },

  tabText: { fontSize: 13, fontWeight: "600", color: "#888" },
  tabTextActive: { color: "#fff" },

  section: { paddingHorizontal: 16 },

  /* METRICS GRID */
  cardsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 16,
  },

  metricCard: {
    width: (screenWidth - 52) / 2,
    borderRadius: 16,
    padding: 16,
    alignItems: "flex-start",
  },

  metricIcon: { fontSize: 22, marginBottom: 6 },
  metricValue: { fontSize: 28, fontWeight: "800" },
  metricLabel: { fontSize: 12, color: "#666", marginTop: 4 },

  /* RATING CARD */
  ratingCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
  },

  ratingTitle: { fontSize: 16, fontWeight: "700", marginBottom: 12 },

  ratingRow: { flexDirection: "row", alignItems: "center", marginBottom: 12 },

  ratingBig: { fontSize: 48, fontWeight: "800", color: GREEN, marginRight: 16 },

  starsBlock: { flexDirection: "column" },

  star: { fontSize: 22, color: "#DDD" },
  starActive: { color: "#F39C12" },

  reviewCount: { fontSize: 12, color: "#888", marginTop: 4 },

  ratingBarBg: {
    height: 8,
    backgroundColor: "#F0F0F0",
    borderRadius: 4,
    overflow: "hidden",
  },

  ratingBarFill: {
    height: "100%",
    backgroundColor: GREEN,
    borderRadius: 4,
  },

  /* CONVERSION */
  conversionCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
  },

  conversionTitle: { fontSize: 16, fontWeight: "700" },
  conversionSub: { fontSize: 12, color: "#888", marginBottom: 16 },

  conversionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    marginBottom: 16,
  },

  conversionItem: { alignItems: "center" },
  conversionValue: { fontSize: 22, fontWeight: "800" },
  conversionLabel: { fontSize: 11, color: "#888", marginTop: 2 },
  conversionArrow: { fontSize: 18, color: "#CCC" },

  conversionBar: {
    height: 8,
    backgroundColor: "#F0F0F0",
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 8,
  },

  conversionFill: { height: "100%", borderRadius: 4 },

  conversionPercent: { fontSize: 12, color: "#666", textAlign: "center" },

  /* CHARTS */
  chartCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
  },

  chartTitle: { fontSize: 16, fontWeight: "700", marginBottom: 4 },
  chartSubtitle: { fontSize: 12, color: "#888", marginBottom: 12 },
  chartStyle: { borderRadius: 12 },

  /* ENGAGEMENT */
  engagementCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
  },

  engagementTitle: { fontSize: 16, fontWeight: "700", marginBottom: 16 },

  engRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },

  engIcon: { fontSize: 22, width: 34 },
  engInfo: { flex: 1 },

  engLabelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },

  engLabel: { fontSize: 13, color: "#444", fontWeight: "500" },
  engValue: { fontSize: 13, fontWeight: "700" },

  engBarBg: {
    height: 6,
    backgroundColor: "#F0F0F0",
    borderRadius: 3,
    overflow: "hidden",
  },

  engBarFill: { height: "100%", borderRadius: 3 },

  /* TIPS */
  tipsCard: {
    backgroundColor: "#FFF9E6",
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: "#F39C12",
  },

  tipsTitle: { fontSize: 15, fontWeight: "700", marginBottom: 12, color: "#7D5A00" },

  tipRow: { flexDirection: "row", alignItems: "flex-start", marginBottom: 10 },

  tipDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#F39C12",
    marginTop: 6,
    marginRight: 10,
  },

  tipText: { flex: 1, fontSize: 13, color: "#555", lineHeight: 18 },
});
