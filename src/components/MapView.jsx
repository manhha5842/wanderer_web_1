import { useState, useEffect, useRef, useCallback } from "react";
import {
  GoogleMap,
  DirectionsRenderer,
  Marker,
  useJsApiLoader,
} from "@react-google-maps/api";
import { MapPin, Navigation, Clock, Route, AlertTriangle } from "lucide-react";
import { calculateDistance, watchPosition } from "../utils/maps";
import { saveTrip } from "../utils/database";

const libraries = ["places"];

const mapContainerStyle = {
  width: "100%",
  height: "100%",
};

const defaultMapOptions = {
  disableDefaultUI: true,
  zoomControl: true,
  mapTypeControl: false,
  streetViewControl: false,
  fullscreenControl: false,
  gestureHandling: "greedy",
};

export function MapView({
  route,
  checkpoints,
  currentPosition,
  completedCheckpoints,
  onPositionUpdate,
  onCheckpointReached,
  onTripCompleted,
  onError,
}) {
  const [map, setMap] = useState(null);
  const [isTracking, setIsTracking] = useState(false);
  const [tripStartTime, setTripStartTime] = useState(null);
  const [totalDistance, setTotalDistance] = useState(0);
  const [isOffRoute, setIsOffRoute] = useState(false);
  const watchIdRef = useRef(null);
  const lastPositionRef = useRef(null);

  const { isLoaded, loadError } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries,
  });

  // Get route details
  const routeDetails = route?.routes?.[0];
  const routeLeg = routeDetails?.legs?.[0];
  const estimatedDistance = routeLeg?.distance?.value / 1000 || 0; // km
  const estimatedDuration = routeLeg?.duration?.value / 60 || 0; // minutes

  // Start tracking when component mounts
  useEffect(() => {
    const startTracking = () => {
      if (!navigator.geolocation) {
        onError("Geolocation is not supported by this browser");
        return;
      }

      setIsTracking(true);
      setTripStartTime(new Date());

      watchIdRef.current = watchPosition(
        (position) => {
          const newPosition = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: position.timestamp,
          };

          // Update total distance
          if (lastPositionRef.current) {
            const distance = calculateDistance(
              lastPositionRef.current.lat,
              lastPositionRef.current.lng,
              newPosition.lat,
              newPosition.lng
            );
            setTotalDistance((prev) => prev + distance / 1000); // Convert to km
          }

          lastPositionRef.current = newPosition;
          onPositionUpdate(newPosition);
        },
        (error) => {
          console.error("Geolocation error:", error);
          onError(`Location tracking error: ${error.message}`);
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 5000,
        }
      );
    };

    if (isLoaded && !isTracking) {
      startTracking();
    }

    return () => {
      if (watchIdRef.current) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, [isLoaded, isTracking, onError, onPositionUpdate]);

  // Check for checkpoint proximity when position updates
  useEffect(() => {
    const completeTrip = async () => {
      if (!tripStartTime) return;

      const endTime = new Date();
      const actualDuration = (endTime - tripStartTime) / 1000 / 60; // minutes

      const tripSummary = {
        startTime: tripStartTime,
        endTime,
        estimatedDistance,
        actualDistance: totalDistance,
        estimatedDuration,
        actualDuration,
        route: {
          origin: routeLeg?.start_address,
          destination: routeLeg?.end_address,
        },
        checkpointsCompleted: completedCheckpoints.length,
        totalCheckpoints: checkpoints.length,
        estimatedCalories: Math.round(totalDistance * 50),
      };

      try {
        await saveTrip(tripSummary);
      } catch (error) {
        console.error("Failed to save trip:", error);
      }

      // Stop tracking
      if (watchIdRef.current) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }

      setIsTracking(false);
      onTripCompleted(tripSummary);
    };

    const checkCheckpointProximity = () => {
      if (!currentPosition) return;

      checkpoints.forEach((checkpoint, index) => {
        if (completedCheckpoints.includes(index)) return;

        const distance = calculateDistance(
          currentPosition.lat,
          currentPosition.lng,
          checkpoint.position.lat(),
          checkpoint.position.lng()
        );

        // Trigger checkpoint if within 50 meters
        if (distance <= 50) {
          onCheckpointReached(index);
        }
      });

      // Check if reached destination
      if (routeLeg) {
        const destDistance = calculateDistance(
          currentPosition.lat,
          currentPosition.lng,
          routeLeg.end_location.lat(),
          routeLeg.end_location.lng()
        );

        if (destDistance <= 50) {
          completeTrip();
        }
      }
    };

    const checkRouteAdherence = () => {
      if (!currentPosition || !routeDetails) return;

      // Simple check: see if current position is within reasonable distance of route
      const routePath = routeDetails.overview_path;
      let minDistance = Infinity;

      routePath.forEach((point) => {
        const distance = calculateDistance(
          currentPosition.lat,
          currentPosition.lng,
          point.lat(),
          point.lng()
        );
        minDistance = Math.min(minDistance, distance);
      });

      setIsOffRoute(minDistance > 100); // 100 meters tolerance
    };

    if (currentPosition && checkpoints.length > 0) {
      checkCheckpointProximity();
      checkRouteAdherence();
    }
  }, [
    currentPosition,
    checkpoints,
    completedCheckpoints,
    routeLeg,
    routeDetails,
    onCheckpointReached,
    tripStartTime,
    estimatedDistance,
    totalDistance,
    estimatedDuration,
    onTripCompleted,
  ]);

  const completeTrip = async () => {
    if (!tripStartTime) return;

    const endTime = new Date();
    const actualDuration = (endTime - tripStartTime) / 1000 / 60; // minutes

    const tripSummary = {
      startTime: tripStartTime,
      endTime,
      estimatedDistance,
      actualDistance: totalDistance,
      estimatedDuration,
      actualDuration,
      route: {
        origin: routeLeg?.start_address,
        destination: routeLeg?.end_address,
      },
      checkpointsCompleted: completedCheckpoints.length,
      totalCheckpoints: checkpoints.length,
      estimatedCalories: Math.round(totalDistance * 50),
    };

    try {
      await saveTrip(tripSummary);
    } catch (error) {
      console.error("Failed to save trip:", error);
    }

    // Stop tracking
    if (watchIdRef.current) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }

    setIsTracking(false);
    onTripCompleted(tripSummary);
  };

  if (loadError) {
    return (
      <div className="map-error">
        <div className="container p-4">
          <div className="card text-center">
            <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-red-500" />
            <h3 className="font-bold mb-2">Map Loading Error</h3>
            <p>
              Failed to load Google Maps. Please check your internet connection
              and API key.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="map-loading">
        <div className="container flex items-center justify-center h-64">
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="map-view">
      {/* Status Bar */}
      <div className="status-bar">
        <div className="container p-4">
          <div className="card">
            <div className="flex justify-between items-center text-sm">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  <Route className="w-4 h-4" />
                  <span>{totalDistance.toFixed(2)} km</span>
                </div>
                {tripStartTime && (
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <span>
                      {Math.floor((Date.now() - tripStartTime) / 1000 / 60)} min
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  <span>
                    {completedCheckpoints.length}/{checkpoints.length}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {isTracking && (
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-green-600">Tracking</span>
                  </div>
                )}
                {isOffRoute && (
                  <div className="flex items-center gap-1 text-orange-600">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Off Route</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Map */}
      <div className="map-container">
        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          zoom={16}
          center={
            currentPosition ||
            routeLeg?.start_location?.toJSON() || { lat: 0, lng: 0 }
          }
          options={defaultMapOptions}
          onLoad={setMap}
        >
          {/* Route */}
          {route && (
            <DirectionsRenderer
              directions={route}
              options={{
                suppressMarkers: false,
                polylineOptions: {
                  strokeColor: "#2563eb",
                  strokeWeight: 4,
                  strokeOpacity: 0.8,
                },
              }}
            />
          )}

          {/* Current Position */}
          {currentPosition && (
            <Marker
              position={currentPosition}
              icon={{
                path: window.google.maps.SymbolPath.CIRCLE,
                scale: 8,
                fillColor: "#2563eb",
                fillOpacity: 1,
                strokeColor: "#ffffff",
                strokeWeight: 2,
              }}
              title="Your current location"
            />
          )}

          {/* Checkpoints */}
          {checkpoints.map((checkpoint, index) => (
            <Marker
              key={index}
              position={{
                lat: checkpoint.position.lat(),
                lng: checkpoint.position.lng(),
              }}
              icon={{
                path: window.google.maps.SymbolPath.CIRCLE,
                scale: 6,
                fillColor: completedCheckpoints.includes(index)
                  ? "#10b981"
                  : "#f59e0b",
                fillOpacity: 1,
                strokeColor: "#ffffff",
                strokeWeight: 2,
              }}
              title={`Checkpoint ${index + 1}: ${checkpoint.description}`}
            />
          ))}
        </GoogleMap>
      </div>

      {/* Trip Controls */}
      <div className="trip-controls">
        <div className="container p-4">
          <div className="flex gap-2">
            <button
              className="btn btn-secondary flex-1"
              onClick={() => {
                if (map && currentPosition) {
                  map.panTo(currentPosition);
                  map.setZoom(18);
                }
              }}
            >
              <Navigation className="w-4 h-4" />
              Center on Me
            </button>

            <button
              className="btn btn-warning"
              onClick={completeTrip}
              disabled={!isTracking}
            >
              End Trip
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
