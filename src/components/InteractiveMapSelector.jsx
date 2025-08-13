import { useState, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from "react-leaflet";
import { Search, Navigation, Target, MapPin, Play } from "lucide-react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix leaflet default markers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom marker icons
const createCustomIcon = (color) => {
  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="
      width: 24px; 
      height: 24px; 
      background: ${color}; 
      border: 3px solid white; 
      border-radius: 50%; 
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      display: flex;
      align-items: center;
      justify-content: center;
    ">
      <div style="
        width: 8px; 
        height: 8px; 
        background: white; 
        border-radius: 50%;
      "></div>
    </div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
};

const originIcon = createCustomIcon('#10b981'); // Green
const destinationIcon = createCustomIcon('#ef4444'); // Red

// Component to handle map clicks
function MapClickHandler({ onLocationSelect, mode }) {
  useMapEvents({
    click(e) {
      if (mode === 'select') {
        onLocationSelect(e.latlng);
      }
    },
  });
  return null;
}

export function InteractiveMapSelector({ onRouteSelected, onError }) {
  const [center, setCenter] = useState([10.8231, 106.6297]); // Ho Chi Minh City
  const [zoom, setZoom] = useState(13);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOrigin, setSelectedOrigin] = useState(null);
  const [selectedDestination, setSelectedDestination] = useState(null);
  const [selectMode, setSelectMode] = useState(null); // 'origin' or 'destination'
  const [missions] = useState([
    {
      id: 1,
      title: "Discover the nearest unidentified plant.",
      category: "Main",
      progress: "1/2",
      completed: false,
      icon: "🌱",
      reward: "Mourn 20k x 200"
    },
    {
      id: 2, 
      title: "Spot 3 species of wildflowers in bloom",
      category: "Daily",
      progress: "2/3",
      completed: false,
      icon: "🌸",
      reward: "Mourn 15k x 150"
    },
    {
      id: 3,
      title: "Find 3 trees with broad leaves", 
      category: "Weekly",
      progress: "2/3",
      completed: false,
      icon: "🌳",
      reward: "Mourn 10k x 100"
    },
    {
      id: 4,
      title: "Discover 2 different types of ferns",
      category: "Daily", 
      progress: "0/2",
      completed: false,
      icon: "🌿",
      reward: "Mourn 8k x 80"
    }
  ]);
  const [showMissions, setShowMissions] = useState(false);
  const mapRef = useRef();

  // Get current location
  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newCenter = [position.coords.latitude, position.coords.longitude];
          setCenter(newCenter);
          setZoom(16);
        },
        (error) => {
          onError('Could not get your location: ' + error.message);
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    } else {
      onError('Geolocation is not supported');
    }
  };

  // Handle location selection
  const handleLocationSelect = (latlng) => {
    if (selectMode === 'origin') {
      setSelectedOrigin(latlng);
      setSelectMode(null);
    } else if (selectMode === 'destination') {
      setSelectedDestination(latlng);
      setSelectMode(null);
    }
  };

  // Start mission/route
  const startRoute = () => {
    if (!selectedOrigin) {
      onError('Please select a starting point');
      return;
    }
    if (!selectedDestination) {
      onError('Please select a destination');
      return;
    }

    // Mock route data - in real app this would call your routing service
    const mockRouteData = {
      route: {
        coordinates: [selectedOrigin, selectedDestination],
        distance: 2.5, // km
        duration: 30, // minutes
      },
      checkpoints: [selectedOrigin, selectedDestination],
      story: {
        title: "Urban Exploration Adventure",
        chapters: [
          { title: "Starting Your Journey", content: "Welcome to your walking adventure..." },
          { title: "Arrival", content: "You've reached your destination..." }
        ]
      },
      metadata: {
        origin: `${selectedOrigin.lat.toFixed(4)}, ${selectedOrigin.lng.toFixed(4)}`,
        destination: `${selectedDestination.lat.toFixed(4)}, ${selectedDestination.lng.toFixed(4)}`,
        distance: 2.5,
        duration: 30,
        estimatedCalories: 125
      }
    };

    onRouteSelected(mockRouteData);
  };

  return (
    <div className="interactive-map-selector">
      {/* Top Search Bar */}
      <div className="absolute top-4 left-4 right-4 z-[1000]">
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-4 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search for places..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white shadow-xl border-0 text-base font-medium placeholder-gray-400"
              style={{ fontSize: '16px' }}
            />
          </div>
          <button
            onClick={getCurrentLocation}
            className="p-4 bg-white rounded-2xl shadow-xl hover:bg-gray-50 transition-all"
            title="Current location"
          >
            <Navigation className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Left Sidebar */}
      <div className="absolute left-4 top-28 bottom-4 z-[1000] w-16 flex flex-col gap-4">
        <button 
          onClick={() => setShowMissions(!showMissions)}
          className={`p-4 rounded-2xl shadow-xl transition-all ${
            showMissions ? 'bg-blue-600 text-white' : 'bg-white hover:bg-gray-50 text-gray-600'
          }`}
          title="Missions"
        >
          <Target className="w-6 h-6" />
        </button>
        
        <button 
          onClick={() => setSelectMode('origin')}
          className={`p-4 rounded-2xl shadow-xl transition-all ${
            selectMode === 'origin' ? 'bg-green-500 text-white' : 'bg-white hover:bg-gray-50 text-gray-600'
          }`}
          title="Select starting point"
        >
          <MapPin className="w-6 h-6" />
        </button>
        
        <button 
          onClick={() => setSelectMode('destination')}
          className={`p-4 rounded-2xl shadow-xl transition-all ${
            selectMode === 'destination' ? 'bg-red-500 text-white' : 'bg-white hover:bg-gray-50 text-gray-600'
          }`}
          title="Select destination"
        >
          <MapPin className="w-6 h-6" />
        </button>
      </div>

      {/* Map Container */}
      <div className="w-full h-screen relative">
        <MapContainer
          center={center}
          zoom={zoom}
          className="w-full h-full"
          ref={mapRef}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          
          <MapClickHandler 
            onLocationSelect={handleLocationSelect} 
            mode={selectMode ? 'select' : null}
          />
          
          {selectedOrigin && (
            <Marker position={selectedOrigin} icon={originIcon}>
              <Popup>
                <div className="text-center">
                  <div className="font-bold text-green-600">Starting Point</div>
                  <div className="text-sm text-gray-600">
                    {selectedOrigin.lat.toFixed(4)}, {selectedOrigin.lng.toFixed(4)}
                  </div>
                </div>
              </Popup>
            </Marker>
          )}
          
          {selectedDestination && (
            <Marker position={selectedDestination} icon={destinationIcon}>
              <Popup>
                <div className="text-center">
                  <div className="font-bold text-red-600">Destination</div>
                  <div className="text-sm text-gray-600">
                    {selectedDestination.lat.toFixed(4)}, {selectedDestination.lng.toFixed(4)}
                  </div>
                </div>
              </Popup>
            </Marker>
          )}
        </MapContainer>
      </div>

      {/* Mission Panel */}
      {showMissions && (
        <div className="absolute left-20 top-24 bottom-24 w-80 bg-white rounded-2xl shadow-2xl z-[1000] overflow-hidden flex flex-col">
          <div className="p-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
            <h2 className="text-2xl font-bold">Mission</h2>
            <p className="text-blue-100 text-sm mt-1">Complete tasks to earn rewards</p>
          </div>

          {/* Action buttons row */}
          <div className="flex items-center justify-center gap-4 p-4 bg-gray-50 border-b">
            <button className="p-3 bg-black text-white rounded-full hover:bg-gray-800 transition-all" title="Search">
              <Search className="w-4 h-4" />
            </button>
            <button className="p-3 bg-gray-200 text-gray-600 rounded-full hover:bg-gray-300 transition-all" title="Photo">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
            <button className="p-3 bg-gray-200 text-gray-600 rounded-full hover:bg-gray-300 transition-all" title="Calendar">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </button>
          </div>
          
          <div className="flex-1 p-4 space-y-4 overflow-y-auto">
            {missions.map((mission) => (
              <div key={mission.id} className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-all bg-white">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                      <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <div>
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full font-medium">
                        {mission.category}
                      </span>
                    </div>
                  </div>
                  <span className="text-xs text-gray-500 font-medium">{mission.progress}</span>
                </div>
                
                <p className="text-sm text-gray-800 mb-3 leading-relaxed font-medium">{mission.title}</p>
                
                <div className="mb-3">
                  <div className="text-xs text-gray-500 mb-1">Progress</div>
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-yellow-400 h-2 rounded-full transition-all duration-300" 
                      style={{ width: `${(parseInt(mission.progress.split('/')[0]) / parseInt(mission.progress.split('/')[1])) * 100}%` }}
                    ></div>
                  </div>
                </div>

                <div className="mb-3">
                  <div className="text-xs text-gray-500 mb-1">Reward</div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-yellow-400 rounded-full"></div>
                    <span className="text-xs text-gray-700 font-medium">{mission.reward}</span>
                  </div>
                </div>
                
                <div className="flex justify-between items-center">
                  <button className="text-xs text-blue-600 font-medium bg-blue-50 px-3 py-1 rounded-full hover:bg-blue-100 transition-all">
                    Continue to probe
                  </button>
                  <button className="p-2 bg-gray-900 text-white rounded-full hover:bg-gray-800 transition-all">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z"/>
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bottom Control Panel */}
      {(selectedOrigin || selectedDestination) && (
        <div className="absolute bottom-6 left-6 right-6 z-[1000]">
          <div className="bg-white rounded-2xl shadow-2xl p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-800">Route Planning</h3>
              <button 
                onClick={() => {
                  setSelectedOrigin(null);
                  setSelectedDestination(null);
                  setSelectMode(null);
                }}
                className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                Clear All
              </button>
            </div>
            
            <div className="space-y-3 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 bg-green-500 rounded-full flex-shrink-0"></div>
                <span className={`text-sm ${selectedOrigin ? 'text-gray-800 font-medium' : 'text-gray-400'}`}>
                  {selectedOrigin ? 'Starting point selected ✓' : 'Tap map to select starting point'}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 bg-red-500 rounded-full flex-shrink-0"></div>
                <span className={`text-sm ${selectedDestination ? 'text-gray-800 font-medium' : 'text-gray-400'}`}>
                  {selectedDestination ? 'Destination selected ✓' : 'Tap map to select destination'}
                </span>
              </div>
            </div>
            
            {selectedOrigin && selectedDestination && (
              <button
                onClick={startRoute}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 px-6 rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 flex items-center justify-center gap-3 transition-all duration-200 shadow-lg"
              >
                <Play className="w-5 h-5" />
                Start Walking Adventure
              </button>
            )}
          </div>
        </div>
      )}

      {/* Selection Instructions */}
      {selectMode && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-[1000]">
          <div className="bg-black bg-opacity-80 text-white px-6 py-3 rounded-xl text-base font-medium shadow-xl">
            {selectMode === 'origin' ? '📍 Tap map to select starting point' : '🎯 Tap map to select destination'}
          </div>
        </div>
      )}
    </div>
  );
}
