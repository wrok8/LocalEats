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

const GOOGLE_MAPS_API_KEY =
  "AIzaSyB31oDUBv6iWG87Cco9YAju3MAKp01Tdqs";

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

  function handleRestaurantSelect(
    restaurant
  ) {
    setSelectedRestaurant(
      restaurant
    );
    setRouteInfo(null);
  }

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
              <Image
                source={{
                  uri: selectedRestaurant.image
                }}
                style={
                  styles.image
                }
              />
            )}

            <Text
              style={styles.name}
            >
              {
                selectedRestaurant.name
              }
            </Text>

            <Text
              style={
                styles.rating
              }
            >
              ⭐{" "}
              {selectedRestaurant.rating ||
                "N/A"}
            </Text>

            <Text
              style={
                styles.address
              }
            >
              {
                selectedRestaurant.address
              }
            </Text>

            <View
              style={
                styles.buttonsRow
              }
            >
              <TouchableOpacity
                style={[
                  styles.button,
                  {
                    backgroundColor:
                      "#ccc"
                  }
                ]}
                onPress={() =>
                  setSelectedRestaurant(
                    null
                  )
                }
              >
                <Text
                  style={
                    styles.buttonText
                  }
                >
                  Cerrar
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.button,
                  {
                    backgroundColor:
                      "#3498DB"
                  }
                ]}
                onPress={
                  startNavigation
                }
              >
                <Text
                  style={
                    styles.buttonText
                  }
                >
                  ¿Cómo llegar?
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.button,
                  {
                    backgroundColor:
                      "#27AE60"
                  }
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
      width: 18,
      height: 18,
      borderRadius: 9,
      backgroundColor:
        "#3498DB",
      borderWidth: 3,
      borderColor: "#fff"
    },

    cardContainer: {
      position: "absolute",
      bottom: 50,
      left: 16,
      right: 16,
      marginBottom: 30
    },

    card: {
      backgroundColor:
        "#fff",
      borderRadius: 16,
      padding: 12,
      elevation: 5
    },

    image: {
      width: "100%",
      height: 140,
      borderRadius: 12,
      marginBottom: 8
    },

    name: {
      fontSize: 18,
      fontWeight: "bold"
    },

    rating: {
      fontSize: 14,
      marginTop: 4
    },

    address: {
      fontSize: 13,
      color: "#555",
      marginTop: 4
    },

    buttonsRow: {
      flexDirection: "row",
      justifyContent:
        "space-between",
      marginTop: 12
    },

    button: {
      paddingVertical: 8,
      paddingHorizontal: 10,
      borderRadius: 12
    },

    buttonText: {
      color: "#fff",
      fontWeight: "bold",
      fontSize: 12
    },

    routeInfoBox: {
      position: "absolute",
      top: 60,
      left: 16,
      backgroundColor:
        "#fff",
      padding: 12,
      borderRadius: 12
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
      padding: 12,
      borderRadius: 12
    },

    followButton: {
      position: "absolute",
      bottom: 120,
      right: 16,
      backgroundColor:
        "#3498DB",
      padding: 12,
      borderRadius: 12
    }
  });