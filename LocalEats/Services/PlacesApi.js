const API_KEY = "AIzaSyB31oDUBv6iWG87Cco9YAju3MAKp01Tdqs";

/**
 * Obtiene restaurantes cercanos usando Nearby Search
 * y luego pide detalles de cada uno con Place Details API
 */
export const getNearbyRestaurants = async (lat, lng) => {
  try {
    // 1️⃣ Llamada a Nearby Search
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=3000&type=restaurant&key=${API_KEY}`
    );

    const json = await response.json();

    // 2️⃣ Mapear los resultados y pedir detalles de cada lugar
    const detailedRestaurants = await Promise.all(
      json.results.map(async (place) => {
        try {
          const detailsResponse = await fetch(
            `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place.place_id}&fields=name,rating,formatted_address,photos,types,formatted_phone_number,opening_hours,website&key=${API_KEY}`
          );

          const detailsJson = await detailsResponse.json();
          const details = detailsJson.result;

          return {
            id: place.place_id,
            name: details.name || place.name,
            rating: details.rating || place.rating || 0,
            address: details.formatted_address || place.vicinity,
            image: details.photos
              ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photo_reference=${details.photos[0].photo_reference}&key=${API_KEY}`
              : null,
            location: place.geometry?.location,
            types: details.types || [],
            phone: details.formatted_phone_number || "N/A",
            website: details.website || "N/A",
            description: `${details.name || ""} - ${details.types?.join(", ") || ""}`,
            opening_hours: details.opening_hours?.weekday_text || []
          };
        } catch (err) {
          console.log("Error al obtener detalles del restaurante:", err);
          return {
            id: place.place_id,
            name: place.name,
            rating: place.rating || 0,
            address: place.vicinity,
            image: place.photos
              ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photo_reference=${place.photos[0].photo_reference}&key=${API_KEY}`
              : null,
            location: place.geometry?.location,
            types: place.types || [],
            phone: "N/A",
            website: "N/A",
            description: place.name,
            opening_hours: []
          };
        }
      })
    );

    return detailedRestaurants;
  } catch (error) {
    console.log("Error al obtener restaurantes:", error);
    return [];
  }
};
