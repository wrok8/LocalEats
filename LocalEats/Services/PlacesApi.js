const API_KEY = "AIzaSyB31oDUBv6iWG87Cco9YAju3MAKp01Tdqs";

/**
 * Obtiene restaurantes cercanos usando Nearby Search
 * y luego pide detalles de cada uno con Place Details API
 */
export const getNearbyRestaurants = async (lat, lng) => {
  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=3000&type=restaurant&key=${API_KEY}`
    );

    const json = await response.json();

    const detailedRestaurants = await Promise.all(
      json.results.map(async (place) => {
        try {
          const detailsResponse = await fetch(
            `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place.place_id}&fields=name,rating,user_ratings_total,formatted_address,photos,types,formatted_phone_number,opening_hours,website,geometry,reviews&key=${API_KEY}`
          );

          const detailsJson = await detailsResponse.json();
          const details = detailsJson.result || {};

          const googlePhotos =
            details.photos?.map((photo) =>
              `https://maps.googleapis.com/maps/api/place/photo?maxwidth=900&photo_reference=${photo.photo_reference}&key=${API_KEY}`
            ) || [];

          return {
            id: place.place_id,
            place_id: place.place_id,
            source: "google",
            googleReviews: details.reviews || [],

            name: details.name || place.name,
            rating: details.rating || place.rating || 0,
            user_ratings_total:
              details.user_ratings_total ||
              place.user_ratings_total ||
              0,

            address: details.formatted_address || place.vicinity,
            vicinity: place.vicinity,

            image: googlePhotos[0] || null,
            photos: googlePhotos,

            location:
              details.geometry?.location ||
              place.geometry?.location ||
              null,

            types: details.types || place.types || [],
            phone: details.formatted_phone_number || "N/A",
            website: details.website || "N/A",

            // Google no usará descripción ni precio en tu DetailScreen
            description: "",
            price_level: null,

            opening_hours:
              details.opening_hours?.weekday_text || [],
          };
        } catch (err) {
          console.log("Error al obtener detalles del restaurante:", err);

          const fallbackPhotos =
            place.photos?.map((photo) =>
              `https://maps.googleapis.com/maps/api/place/photo?maxwidth=900&photo_reference=${photo.photo_reference}&key=${API_KEY}`
            ) || [];

          return {
            id: place.place_id,
            place_id: place.place_id,
            source: "google",

            name: place.name,
            rating: place.rating || 0,
            user_ratings_total: place.user_ratings_total || 0,

            address: place.vicinity,
            vicinity: place.vicinity,

            image: fallbackPhotos[0] || null,
            photos: fallbackPhotos,

            location: place.geometry?.location || null,

            types: place.types || [],
            phone: "N/A",
            website: "N/A",

            description: "",
            price_level: null,
            opening_hours: [],
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
