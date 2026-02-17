const API_KEY = "AIzaSyB31oDUBv6iWG87Cco9YAju3MAKp01Tdqs";

export const getNearbyRestaurants = async (lat, lng) => {

  try {

    const response = await fetch(
      `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=3000&type=restaurant&key=${API_KEY}`
    );

    const json = await response.json();

    return json.results.map(place => ({

      id: place.place_id,

      name: place.name,

      rating: place.rating || 0,

      address: place.vicinity,

      image: place.photos
        ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photo_reference=${place.photos[0].photo_reference}&key=${API_KEY}`
        : null

    }));

  } catch (error) {

    console.log(error);

    return [];

  }

};
