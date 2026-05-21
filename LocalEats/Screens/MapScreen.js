import React, { useEffect, useState, useRef } from "react";
import {
  View,
  StyleSheet,
  Text,
  Image,
  TouchableOpacity
} from "react-native";

import {
  doc,
  updateDoc,
  increment
} from "firebase/firestore";

import { db } from "../firebaseConfig";

import MapView, { Marker } from "react-native-maps";
import MapViewDirections from "react-native-maps-directions";
import * as Location from "expo-location";

import { getNearbyRestaurants } from "../Services/PlacesApi";
import { getApprovedRestaurants } from "../Services/FirebaseRestaurantsApi";
import { getAuth } from "firebase/auth";
import { logAudit } from "../Logs/FileManager";

const GOOGLE_MAPS_API_KEY =
  "AIzaSyB31oDUBv6iWG87Cco9YAju3MAKp01Tdqs";

// Mapa con restaurantes cercanos, seleccion y ruta hacia el destino.
export default function MapScreen({ navigation }) {
  const mapRef = useRef(null);

  const [location, setLocation] = useState(null);
  const [allRestaurants, setAllRestaurants] = useState([]);
  const [selectedRestaurant, setSelectedRestaurant] =
    useState(null);
  const [activeRoute, setActiveRoute] =
    useState(null);
  const [routeInfo, setRouteInfo] =
    useState(null);
  const [followUser, setFollowUser] =
    useState(false);

  // Mantener zoom fijo como Google Maps
  const lastRegionRef = useRef({
    latitudeDelta: 0.01,
    longitudeDelta: 0.01
  });

  useEffect(() => {
    let locationSubscription;

    // Carga ubicacion, restaurantes y seguimiento en tiempo real.
    async function loadMapData() {
      try {
        const { status } =
          await Location.requestForegroundPermissionsAsync();

        if (status !== "granted") {
          alert("Permiso requerido");
          return;
        }

        const loc =
          await Location.getCurrentPositionAsync({});

        setLocation(loc.coords);

        // GOOGLE RESTAURANTS
        const googleData =
          await getNearbyRestaurants(
            loc.coords.latitude,
            loc.coords.longitude
          );
        await logAudit({
          action: "Se consultaron restaurantes cercanos para mapa",
          storage: "Google Places API",
          target: "nearbySearch",
          detail: `resultados: ${googleData.length}`,
          userId: getAuth().currentUser?.uid,
        });

        // NORMALIZAR GOOGLE
        const normalizedGoogle =
          googleData.map((r, index) => ({
            ...r,
            id: r.id || `google-${index}`,
            location: {
              lat:
                r.location?.lat ||
                r.geometry?.location?.lat,
              lng:
                r.location?.lng ||
                r.geometry?.location?.lng
            }
          }));

        // FIREBASE RESTAURANTS
        const firebaseData =
          await getApprovedRestaurants();
        await logAudit({
          action: "Se cargaron restaurantes aprobados para mapa",
          storage: "Firestore",
          target: "restaurants",
          detail: `resultados: ${firebaseData.length}`,
          userId: getAuth().currentUser?.uid,
        });

        const mixedRestaurants = [
          ...normalizedGoogle,
          ...firebaseData
        ];

        setAllRestaurants(mixedRestaurants);

        // TRACKING SUAVE
        locationSubscription =
          await Location.watchPositionAsync(
            {
              accuracy:
                Location.Accuracy.BestForNavigation,
              timeInterval: 2000,
              distanceInterval: 5
            },
            (newLocation) => {
              const coords =
                newLocation.coords;

              setLocation(coords);

              // Seguimiento suave SIN cambiar zoom
              if (
                mapRef.current &&
                activeRoute &&
                followUser
              ) {
                mapRef.current.animateCamera(
                  {
                    center: {
                      latitude:
                        coords.latitude,
                      longitude:
                        coords.longitude
                    },
                    zoom: 17
                  },
                  {
                    duration: 1000
                  }
                );
              }
            }
          );
      } catch (error) {
        console.log(
          "Error mapa:",
          error
        );
      }
    }

    loadMapData();

    return () => {
      if (locationSubscription) {
        locationSubscription.remove();
      }
    };
  }, [activeRoute, followUser]);

  // Obtiene coordenadas aunque vengan de Google o Firestore.
  function getRestaurantCoordinates(
    restaurant
  ) {
    return {
      latitude:
        restaurant.location?.lat ||
        location.latitude,
      longitude:
        restaurant.location?.lng ||
        location.longitude
    };
  }

  // Abre la tarjeta inferior del restaurante elegido.
  function handleRestaurantSelect(
    restaurant
  ) {
    setSelectedRestaurant(
      restaurant
    );
    setRouteInfo(null);
  }

  // Inicia ruta y registra el click de "como llegar".
  async function startNavigation() {
  if (!selectedRestaurant) return;

  try {
    if (selectedRestaurant.id) {
      const restaurantRef = doc(
        db,
        "restaurants",
        selectedRestaurant.id
      );

      await updateDoc(
        restaurantRef,
        {
          directionsClicks:
            increment(1)
        }
      );
      await logAudit({
        action: "Se incremento contador de como llegar",
        storage: "Firestore",
        target: `restaurants/${selectedRestaurant.id}`,
        detail: "Campo modificado: directionsClicks +1",
        userId: getAuth().currentUser?.uid,
      });
    }
  } catch (error) {
    console.log(
      "Error sumando click ruta:",
      error
    );
  }

  setActiveRoute(
    selectedRestaurant
  );

  setSelectedRestaurant(
    null
  );

  setFollowUser(false);
}

  if (!location) return null;

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={{
          latitude:
            location.latitude,
          longitude:
            location.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01
        }}
        onRegionChangeComplete={(
          region
        ) => {
          lastRegionRef.current =
            {
              latitudeDelta:
                region.latitudeDelta,
              longitudeDelta:
                region.longitudeDelta
            };
        }}
        onPanDrag={() =>
          setFollowUser(false)
        }
      >
        {/* USUARIO */}
        <Marker
          coordinate={{
            latitude:
              location.latitude,
            longitude:
              location.longitude
          }}
          title="Tu ubicación"
        >
          <View
            style={
              styles.userMarker
            }
          />
        </Marker>

        {/* RESTAURANTES */}
        {allRestaurants.map(
          (r, index) => (
            <Marker
              key={`${r.id}-${index}`}
              coordinate={getRestaurantCoordinates(
                r
              )}
              title={r.name}
              onPress={() =>
                handleRestaurantSelect(
                  r
                )
              }
            />
          )
        )}

        {/* RUTA */}
        {activeRoute && (
          <MapViewDirections
            origin={{
              latitude:
                location.latitude,
              longitude:
                location.longitude
            }}
            destination={getRestaurantCoordinates(
              activeRoute
            )}
            apikey={
              GOOGLE_MAPS_API_KEY
            }
            strokeWidth={5}
            strokeColor="#27AE60"
            mode="DRIVING"
            onReady={(
              result
            ) => {
              setRouteInfo({
                distance:
                  result.distance,
                duration:
                  result.duration
              });
            }}
            onError={(error) =>
              console.log(
                "Ruta error:",
                error
              )
            }
          />
        )}
      </MapView>

      {/* INFO RUTA */}
      {activeRoute &&
        routeInfo && (
          <View
            style={
              styles.routeInfoBox
            }
          >
            <Text
              style={
                styles.routeInfoText
              }
            >
              🚗{" "}
              {routeInfo.duration.toFixed(
                0
              )}{" "}
              min · 📍{" "}
              {routeInfo.distance.toFixed(
                1
              )}{" "}
              km
            </Text>
          </View>
        )}

      {/* CANCELAR */}
      {activeRoute && (
        <TouchableOpacity
          style={
            styles.cancelRouteButton
          }
          onPress={() => {
            setActiveRoute(
              null
            );
            setRouteInfo(
              null
            );
            setFollowUser(
              false
            );
          }}
        >
          <Text
            style={
              styles.buttonText
            }
          >
            Cancelar ruta
          </Text>
        </TouchableOpacity>
      )}

      {/* FOLLOW */}
      {activeRoute && (
        <TouchableOpacity
          style={
            styles.followButton
          }
          onPress={() =>
            setFollowUser(
              !followUser
            )
          }
        >
          <Text
            style={
              styles.buttonText
            }
          >
            {followUser
              ? "Dejar de seguir"
              : "Seguir ubicación"}
          </Text>
        </TouchableOpacity>
      )}

      {/* TARJETA */}
      {selectedRestaurant && (
        <View
          style={
            styles.cardContainer
          }
        >
          <View
            style={styles.card}
          >
            {selectedRestaurant.image && (
              <View style={styles.imageWrapper}>
                <Image
                  source={{
                    uri: selectedRestaurant.image
                  }}
                  style={
                    styles.image
                  }
                />
                <View style={styles.ratingBadge}>
                  <Text style={styles.ratingBadgeText}>
                    ⭐ {selectedRestaurant.rating || "N/A"}
                  </Text>
                </View>
              </View>
            )}

            <View style={styles.cardBody}>
              <View style={styles.cardTopRow}>
                <View style={{ flex: 1 }}>
                  <Text
                    style={styles.name}
                    numberOfLines={1}
                  >
                    {selectedRestaurant.name}
                  </Text>
                  <Text
                    style={styles.address}
                    numberOfLines={2}
                  >
                    📍 {selectedRestaurant.address || selectedRestaurant.vicinity || "Sin dirección"}
                  </Text>
                </View>
              </View>
            </View>

            <View
              style={
                styles.buttonsRow
              }
            >
              <TouchableOpacity
                style={[
                  styles.button,
                  styles.closeButton
                ]}
                onPress={() =>
                  setSelectedRestaurant(
                    null
                  )
                }
              >
                <Text
                  style={styles.closeButtonText}
                >
                  Cerrar
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.button,
                  styles.routeButton
                ]}
                onPress={
                  startNavigation
                }
              >
                <Text
                  style={styles.routeButtonText}
                >
                  ¿Cómo llegar?
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.button,
                  styles.detailsButton
                ]}
                onPress={() =>
                  navigation.navigate(
                    "RestaurantDetail",
                    {
                      restaurant:
                        selectedRestaurant
                    }
                  )
                }
              >
                <Text
                  style={
                    styles.buttonText
                  }
                >
                  Detalles
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

const styles =
  StyleSheet.create({
    container: {
      flex: 1
    },

    map: {
      flex: 1
    },

    userMarker: {
      width: 20,
      height: 20,
      borderRadius: 10,
      backgroundColor:
        "#27AE60",
      borderWidth: 3,
      borderColor: "#fff",
      elevation: 4
    },

    cardContainer: {
      position: "absolute",
      bottom: 46,
      left: 16,
      right: 16,
      marginBottom: 30
    },

    card: {
      backgroundColor:
        "#fff",
      borderRadius: 20,
      padding: 0,
      overflow: "hidden",
      elevation: 6,
      shadowColor: "#1A5C35",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.14,
      shadowRadius: 10
    },

    imageWrapper: {
      position: "relative"
    },

    image: {
      width: "100%",
      height: 150
    },

    ratingBadge: {
      position: "absolute",
      bottom: 10,
      left: 12,
      backgroundColor: "rgba(0,0,0,0.62)",
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 18
    },

    ratingBadgeText: {
      color: "#fff",
      fontSize: 12,
      fontWeight: "800"
    },

    cardBody: {
      paddingHorizontal: 14,
      paddingTop: 14,
      paddingBottom: 2
    },

    cardTopRow: {
      flexDirection: "row",
      alignItems: "flex-start"
    },

    name: {
      fontSize: 18,
      fontWeight: "900",
      color: "#222",
      marginBottom: 4
    },

    address: {
      fontSize: 13,
      color: "#777",
      lineHeight: 18
    },

    buttonsRow: {
      flexDirection: "row",
      justifyContent:
        "space-between",
      gap: 8,
      padding: 14,
      paddingTop: 12
    },

    button: {
      flex: 1,
      paddingVertical: 11,
      paddingHorizontal: 8,
      borderRadius: 14,
      alignItems: "center",
      justifyContent: "center"
    },

    closeButton: {
      backgroundColor: "#F4F6F4",
      borderWidth: 1.2,
      borderColor: "#E0E0E0"
    },

    routeButton: {
      backgroundColor: "#E8F8F0",
      borderWidth: 1.2,
      borderColor: "#BFE8D0"
    },

    detailsButton: {
      backgroundColor: "#27AE60"
    },

    buttonText: {
      color: "#fff",
      fontWeight: "800",
      fontSize: 12
    },

    closeButtonText: {
      color: "#666",
      fontWeight: "800",
      fontSize: 12
    },

    routeButtonText: {
      color: "#1A5C35",
      fontWeight: "800",
      fontSize: 12
    },

    routeInfoBox: {
      position: "absolute",
      top: 60,
      left: 16,
      backgroundColor:
        "#fff",
      paddingVertical: 10,
      paddingHorizontal: 14,
      borderRadius: 16,
      elevation: 4,
      shadowColor: "#1A5C35",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.12,
      shadowRadius: 6
    },

    routeInfoText: {
      color: "#27AE60",
      fontWeight: "bold"
    },

    cancelRouteButton: {
      position: "absolute",
      top: 60,
      right: 16,
      backgroundColor:
        "#E74C3C",
      paddingVertical: 10,
      paddingHorizontal: 14,
      borderRadius: 16,
      elevation: 4
    },

    followButton: {
      position: "absolute",
      bottom: 120,
      right: 16,
      backgroundColor:
        "#1A5C35",
      paddingVertical: 11,
      paddingHorizontal: 14,
      borderRadius: 16,
      elevation: 4
    }
  });
