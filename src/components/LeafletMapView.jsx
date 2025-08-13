import { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, Popup, useMap } from 'react-leaflet';
import { MapPin, Navigation, Clock, Route, AlertTriangle } from 'lucide-react';
import { calculateDistance, watchPosition } from '../utils/leafletMaps';
import { saveTrip } from '../utils/database';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Custom component to center map on current position
function MapController({ center, zoom }) {
  const map = useMap();
  
  useEffect(() => {
    if (center) {
      map.setView(center, zoom);
    }
  }, [map, center, zoom]);
  
  return null;
}

// Custom marker icons
const createCustomIcon = (color = 'blue', completed = false) => {
  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="
      background-color: ${completed ? '#10b981' : color === 'blue' ? '#2563eb' : '#f59e0b'};
      width: 12px;
      height: 12px;
      border-radius: 50%;
      border: 2px solid white;
      box-shadow: 0 2px 4px rgba(0,0,0,0.2);
    "></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8]
  });
};

const currentPositionIcon = L.divIcon({
  className: 'current-position-marker',
  html: `<div style="
    background-color: #2563eb;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    border: 3px solid white;
    box-shadow: 0 2px 8px rgba(0,0,0,0.3);
    animation: pulse 2s infinite;
  "></div>
  <style>
    @keyframes pulse {
      0% { transform: scale(1); opacity: 1; }
      50% { transform: scale(1.2); opacity: 0.7; }
      100% { transform: scale(1); opacity: 1; }
    }
  </style>`,
  iconSize: [22, 22],
  iconAnchor: [11, 11]
});

export function LeafletMapView({ 
  route, 
  checkpoints, 
  currentPosition, 
  completedCheckpoints,
  onPositionUpdate, 
  onCheckpointReached, 
  onTripCompleted,
  onError 
}) {
  const [isTracking, setIsTracking] = useState(false);
  const [tripStartTime, setTripStartTime] = useState(null);
  const [totalDistance, setTotalDistance] = useState(0);
  const [mapCenter, setMapCenter] = useState([10.7769, 106.7029]); // Default to Ho Chi Minh City
  const [mapZoom, setMapZoom] = useState(13);
  const watchIdRef = useRef(null);
  const lastPositionRef = useRef(null);

  // Get route details
  const estimatedDistance = route?.distance || 0;
  const estimatedDuration = route?.duration || 0;

  // Start tracking when component mounts
  useEffect(() => {
    const startTracking = () => {
      if (!navigator.geolocation) {
        onError('Geolocation is not supported by this browser');
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

          // Update map center to follow user
          setMapCenter([newPosition.lat, newPosition.lng]);

          // Update total distance
          if (lastPositionRef.current) {
            const distance = calculateDistance(
              lastPositionRef.current.lat,
              lastPositionRef.current.lng,
              newPosition.lat,
              newPosition.lng
            );
            setTotalDistance(prev => prev + distance / 1000); // Convert to km
          }

          lastPositionRef.current = newPosition;
          onPositionUpdate(newPosition);
        },
        (error) => {
          console.error('Geolocation error:', error);
          onError(`Location tracking error: ${error.message}`);
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 5000,
        }
      );
    };

    if (!isTracking) {
      startTracking();
    }
    
    return () => {
      if (watchIdRef.current) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, [isTracking, onError, onPositionUpdate]);

  // Check for checkpoint proximity and completion
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
          origin: route?.origin || 'Unknown',
          destination: route?.destination || 'Unknown',
        },
        checkpointsCompleted: completedCheckpoints.length,
        totalCheckpoints: checkpoints.length,
        estimatedCalories: Math.round(totalDistance * 50),
      };

      try {
        await saveTrip(tripSummary);
      } catch (error) {
        console.error('Failed to save trip:', error);
      }

      // Stop tracking
      if (watchIdRef.current) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }

      setIsTracking(false);
      onTripCompleted(tripSummary);
    };

    if (!currentPosition || !checkpoints.length) return;

    // Check checkpoint proximity
    checkpoints.forEach((checkpoint, index) => {
      if (completedCheckpoints.includes(index)) return;

      const distance = calculateDistance(
        currentPosition.lat,
        currentPosition.lng,
        checkpoint.position.lat,
        checkpoint.position.lng
      );

      // Trigger checkpoint if within 50 meters
      if (distance <= 50) {
        onCheckpointReached(index);
      }
    });

    // Check if reached destination (when all checkpoints completed or very close to end)
    if (route && (completedCheckpoints.length === checkpoints.length || 
        calculateDistance(
          currentPosition.lat,
          currentPosition.lng,
          route.destCoords.lat,
          route.destCoords.lng
        ) <= 50)) {
      completeTrip();
    }
  }, [currentPosition, checkpoints, completedCheckpoints, route, onCheckpointReached, tripStartTime, estimatedDistance, totalDistance, estimatedDuration, onTripCompleted]);

  const centerOnUser = () => {
    if (currentPosition) {
      setMapCenter([currentPosition.lat, currentPosition.lng]);
      setMapZoom(18);
    }
  };

  const handleEndTrip = () => {
    if (watchIdRef.current) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setIsTracking(false);
    
    // Force complete trip
    const endTime = new Date();
    const actualDuration = tripStartTime ? (endTime - tripStartTime) / 1000 / 60 : 0;

    const tripSummary = {
      startTime: tripStartTime || endTime,
      endTime,
      estimatedDistance,
      actualDistance: totalDistance,
      estimatedDuration,
      actualDuration,
      route: {
        origin: route?.origin || 'Unknown',
        destination: route?.destination || 'Unknown',
      },
      checkpointsCompleted: completedCheckpoints.length,
      totalCheckpoints: checkpoints.length,
      estimatedCalories: Math.round(totalDistance * 50),
    };

    onTripCompleted(tripSummary);
  };

  // Prepare route coordinates for Polyline
  const routeCoordinates = route?.geometry?.coordinates?.map(([lng, lat]) => [lat, lng]) || [];

  return (
    <div className="leaflet-map-view">
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
                  <span>{completedCheckpoints.length}/{checkpoints.length}</span>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {isTracking && (
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-green-600">Tracking</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Map */}
      <div className="map-container">
        <MapContainer
          center={mapCenter}
          zoom={mapZoom}
          style={{ height: '100%', width: '100%' }}
          zoomControl={true}
        >
          <MapController center={mapCenter} zoom={mapZoom} />
          
          {/* OpenStreetMap tiles */}
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />

          {/* Route line */}
          {routeCoordinates.length > 0 && (
            <Polyline 
              positions={routeCoordinates}
              color="#2563eb"
              weight={4}
              opacity={0.8}
            />
          )}

          {/* Start marker */}
          {route?.originCoords && (
            <Marker 
              position={[route.originCoords.lat, route.originCoords.lng]}
              icon={createCustomIcon('green')}
            >
              <Popup>
                <div>
                  <strong>Start</strong><br />
                  {route.origin}
                </div>
              </Popup>
            </Marker>
          )}

          {/* End marker */}
          {route?.destCoords && (
            <Marker 
              position={[route.destCoords.lat, route.destCoords.lng]}
              icon={createCustomIcon('red')}
            >
              <Popup>
                <div>
                  <strong>Destination</strong><br />
                  {route.destination}
                </div>
              </Popup>
            </Marker>
          )}

          {/* Checkpoints */}
          {checkpoints.map((checkpoint, index) => (
            <Marker
              key={index}
              position={[checkpoint.position.lat, checkpoint.position.lng]}
              icon={createCustomIcon('orange', completedCheckpoints.includes(index))}
            >
              <Popup>
                <div>
                  <strong>Checkpoint {index + 1}</strong><br />
                  {checkpoint.description}<br />
                  {completedCheckpoints.includes(index) && 
                    <span style={{ color: '#10b981' }}>✓ Completed</span>
                  }
                </div>
              </Popup>
            </Marker>
          ))}

          {/* Current Position */}
          {currentPosition && (
            <Marker
              position={[currentPosition.lat, currentPosition.lng]}
              icon={currentPositionIcon}
            >
              <Popup>
                <div>
                  <strong>Your Location</strong><br />
                  Accuracy: ±{currentPosition.accuracy?.toFixed(0)}m
                </div>
              </Popup>
            </Marker>
          )}
        </MapContainer>
      </div>

      {/* Trip Controls */}
      <div className="trip-controls">
        <div className="container p-4">
          <div className="flex gap-2">
            <button
              className="btn btn-secondary flex-1"
              onClick={centerOnUser}
            >
              <Navigation className="w-4 h-4" />
              Center on Me
            </button>
            
            <button
              className="btn btn-warning"
              onClick={handleEndTrip}
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
