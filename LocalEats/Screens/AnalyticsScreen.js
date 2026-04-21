import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Dimensions
} from "react-native";

import { getAuth } from "firebase/auth";
import {
  collection,
  query,
  where,
  getDocs
} from "firebase/firestore";

import { db } from "../firebaseConfig";

import { LineChart } from "react-native-chart-kit";

const screenWidth =
  Dimensions.get("window").width;

export default function AnalyticsScreen() {
  const [restaurant, setRestaurant] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    loadRestaurantAnalytics();
  }, []);

  async function loadRestaurantAnalytics() {
    try {
      const user =
        getAuth().currentUser;

      if (!user) return;

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
        const restaurantData =
          snapshot.docs[0].data();

        setRestaurant(
          restaurantData
        );
      }
    } catch (error) {
      console.log(
        "Error analytics:",
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
        />
      </View>
    );
  }

  if (!restaurant) {
    return (
      <View
        style={
          styles.loadingContainer
        }
      >
        <Text>
          No se encontró restaurante
        </Text>
      </View>
    );
  }

  const views =
    restaurant.views || 0;

  const directions =
    restaurant
      .directionsClicks ||
    0;

  const favorites =
    restaurant
      .favoritesCount ||
    0;

  const rating =
    restaurant
      .averageRating ||
    0;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{
        paddingBottom: 40
      }}
    >
      <Text
        style={styles.title}
      >
        📊 Estadísticas
      </Text>

      {/* CARDS */}
      <View
        style={styles.cardsGrid}
      >
        <View
          style={styles.card}
        >
          <Text
            style={styles.cardNumber}
          >
            {views}
          </Text>
          <Text
            style={styles.cardLabel}
          >
            👁️ Vistas
          </Text>
        </View>

        <View
          style={styles.card}
        >
          <Text
            style={styles.cardNumber}
          >
            {directions}
          </Text>
          <Text
            style={styles.cardLabel}
          >
            📍 Cómo llegar
          </Text>
        </View>

        <View
          style={styles.card}
        >
          <Text
            style={styles.cardNumber}
          >
            {favorites}
          </Text>
          <Text
            style={styles.cardLabel}
          >
            ⭐ Favoritos
          </Text>
        </View>

        <View
          style={styles.card}
        >
          <Text
            style={styles.cardNumber}
          >
            {rating}
          </Text>
          <Text
            style={styles.cardLabel}
          >
            ⭐ Rating
          </Text>
        </View>
      </View>

      {/* GRAFICA */}
      <Text
        style={
          styles.chartTitle
        }
      >
        Tendencia semanal
      </Text>

      <LineChart
        data={{
          labels: [
            "L",
            "M",
            "M",
            "J",
            "V",
            "S",
            "D"
          ],
          datasets: [
            {
              data: [
                5,
                8,
                6,
                12,
                10,
                15,
                views
              ]
            }
          ]
        }}
        width={
          screenWidth - 32
        }
        height={220}
        yAxisInterval={1}
        chartConfig={{
          backgroundGradientFrom:
            "#fff",
          backgroundGradientTo:
            "#fff",
          decimalPlaces: 0,
          color: (
            opacity = 1
          ) =>
            `rgba(39, 174, 96, ${opacity})`,
          labelColor: (
            opacity = 1
          ) =>
            `rgba(0,0,0,${opacity})`
        }}
        bezier
        style={
          styles.chart
        }
      />
    </ScrollView>
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
      fontSize: 26,
      fontWeight:
        "bold",
      marginBottom: 20
    },

    cardsGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent:
        "space-between"
    },

    card: {
      width: "48%",
      backgroundColor:
        "#fff",
      padding: 20,
      borderRadius: 16,
      marginBottom: 16,
      elevation: 3
    },

    cardNumber: {
      fontSize: 28,
      fontWeight:
        "bold",
      color: "#27AE60"
    },

    cardLabel: {
      fontSize: 14,
      marginTop: 8,
      color: "#555"
    },

    chartTitle: {
      fontSize: 18,
      fontWeight:
        "bold",
      marginTop: 20,
      marginBottom: 12
    },

    chart: {
      borderRadius: 16
    }
  });