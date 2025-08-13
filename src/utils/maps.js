// Google Maps API utilities
export const loadGoogleMapsScript = () => {
  return new Promise((resolve, reject) => {
    if (window.google && window.google.maps) {
      resolve(window.google.maps);
      return;
    }

    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${
      import.meta.env.VITE_GOOGLE_MAPS_API_KEY
    }&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve(window.google.maps);
    script.onerror = reject;
    document.head.appendChild(script);
  });
};

// Calculate route using Google Directions API
export const calculateRoute = async (origin, destination, waypoints = []) => {
  const google = await loadGoogleMapsScript();
  const directionsService = new google.DirectionsService();

  return new Promise((resolve, reject) => {
    directionsService.route(
      {
        origin,
        destination,
        waypoints: waypoints.map((point) => ({
          location: point,
          stopover: true,
        })),
        travelMode: google.TravelMode.WALKING,
        unitSystem: google.UnitSystem.METRIC,
      },
      (result, status) => {
        if (status === google.DirectionsStatus.OK) {
          resolve(result);
        } else {
          reject(new Error(`Directions request failed: ${status}`));
        }
      }
    );
  });
};

// Generate automatic checkpoints based on route
export const generateCheckpoints = (route, numCheckpoints = 4) => {
  const legs = route.routes[0].legs;
  const totalSteps = legs.reduce((acc, leg) => acc + leg.steps.length, 0);
  const checkpoints = [];

  const stepInterval = Math.floor(totalSteps / (numCheckpoints + 1));
  let currentStepIndex = 0;

  for (let i = 1; i <= numCheckpoints; i++) {
    const targetStepIndex = i * stepInterval;

    for (const leg of legs) {
      for (const step of leg.steps) {
        currentStepIndex++;
        if (
          currentStepIndex >= targetStepIndex &&
          checkpoints.length < numCheckpoints
        ) {
          checkpoints.push({
            position: step.end_location,
            description: step.instructions.replace(/<[^>]*>/g, ""), // Remove HTML tags
            distance: step.distance.text,
            index: checkpoints.length + 1,
          });
          break;
        }
      }
      if (checkpoints.length >= numCheckpoints) break;
    }
  }

  return checkpoints;
};

// Calculate distance between two coordinates
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
      reject(new Error("Geolocation is not supported by this browser."));
      return;
    }

    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 60000,
      ...options,
    });
  });
};

// Watch user position for real-time tracking
export const watchPosition = (callback, errorCallback, options = {}) => {
  if (!navigator.geolocation) {
    errorCallback(new Error("Geolocation is not supported by this browser."));
    return null;
  }

  return navigator.geolocation.watchPosition(callback, errorCallback, {
    enableHighAccuracy: true,
    timeout: 15000,
    maximumAge: 5000,
    ...options,
  });
};
