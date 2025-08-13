import L from 'leaflet';

// Fix default marker icons in Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

// Geocoding using Nominatim (OpenStreetMap) - completely free
export const geocodeAddress = async (address) => {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`
    );
    const data = await response.json();
    
    if (data && data.length > 0) {
      return {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon),
        address: data[0].display_name
      };
    }
    throw new Error('Address not found');
  } catch (error) {
    console.error('Geocoding error:', error);
    throw new Error('Failed to find address coordinates');
  }
};

// Get walking route using OSRM (completely free)
export const calculateWalkingRoute = async (origin, destination, waypoints = []) => {
  try {
    // Convert addresses to coordinates
    const originCoords = typeof origin === 'string' ? await geocodeAddress(origin) : origin;
    const destCoords = typeof destination === 'string' ? await geocodeAddress(destination) : destination;
    
    // Build coordinates string for OSRM
    let coordinates = `${originCoords.lng},${originCoords.lat}`;
    
    // Add waypoints if any
    if (waypoints.length > 0) {
      const waypointCoords = await Promise.all(
        waypoints.map(wp => typeof wp === 'string' ? geocodeAddress(wp) : Promise.resolve(wp))
      );
      coordinates += ';' + waypointCoords.map(wp => `${wp.lng},${wp.lat}`).join(';');
    }
    
    coordinates += `;${destCoords.lng},${destCoords.lat}`;

    // Call OSRM API for walking route
    const response = await fetch(
      `https://router.project-osrm.org/route/v1/foot/${coordinates}?overview=full&geometries=geojson&steps=true`
    );

    if (!response.ok) {
      throw new Error(`OSRM API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.routes || data.routes.length === 0) {
      throw new Error('No route found');
    }

    const route = data.routes[0];
    
    return {
      geometry: route.geometry,
      distance: route.distance / 1000, // Convert to km
      duration: route.duration / 60, // Convert to minutes
      steps: route.legs[0]?.steps || [],
      origin: originCoords.address || origin,
      destination: destCoords.address || destination,
      originCoords,
      destCoords
    };
  } catch (error) {
    console.error('Route calculation failed:', error);
    throw new Error('Failed to calculate walking route: ' + error.message);
  }
};

// Generate checkpoints along the route
export const generateCheckpoints = (route, numCheckpoints = 4) => {
  if (!route.geometry || !route.geometry.coordinates) {
    return [];
  }

  const coordinates = route.geometry.coordinates;
  const totalPoints = coordinates.length;
  const interval = Math.floor(totalPoints / (numCheckpoints + 1));
  
  const checkpoints = [];
  for (let i = 1; i <= numCheckpoints; i++) {
    const pointIndex = i * interval;
    if (pointIndex < totalPoints) {
      const [lng, lat] = coordinates[pointIndex];
      checkpoints.push({
        position: { lat, lng },
        description: `Checkpoint ${i}`,
        index: i
      });
    }
  }
  
  return checkpoints;
};

// Calculate distance between two points (Haversine formula)
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
};

// Get user's current position
export const getCurrentPosition = (options = {}) => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by this browser.'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      resolve,
      reject,
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
        ...options
      }
    );
  });
};

// Watch user position for real-time tracking
export const watchPosition = (callback, errorCallback, options = {}) => {
  if (!navigator.geolocation) {
    errorCallback(new Error('Geolocation is not supported by this browser.'));
    return null;
  }

  return navigator.geolocation.watchPosition(
    callback,
    errorCallback,
    {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 5000,
      ...options
    }
  );
};

// Reverse geocoding (get address from coordinates)
export const reverseGeocode = async (lat, lng) => {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
    );
    const data = await response.json();
    
    if (data && data.display_name) {
      return data.display_name;
    }
    throw new Error('Address not found');
  } catch (error) {
    console.error('Reverse geocoding error:', error);
    throw new Error('Failed to get address from coordinates');
  }
};

// Search for places (like autocomplete)
export const searchPlaces = async (query, limit = 5) => {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=${limit}&addressdetails=1`
    );
    const data = await response.json();
    
    return data.map(place => ({
      name: place.display_name,
      lat: parseFloat(place.lat),
      lng: parseFloat(place.lon),
      type: place.type,
      importance: place.importance
    }));
  } catch (error) {
    console.error('Places search error:', error);
    throw new Error('Failed to search places');
  }
};
