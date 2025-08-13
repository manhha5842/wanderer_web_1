import { useState } from "react";
import { MapPin, Navigation, Plus, Loader } from "lucide-react";
import {
  calculateWalkingRoute,
  generateCheckpoints,
  reverseGeocode,
} from "../utils/leafletMaps";
import { generateStory, generateFallbackStory } from "../utils/gemini";
import { saveStory, getStory, generateRouteKey } from "../utils/database";

export function RouteSelector({ onRouteSelected, onError, onLoading }) {
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [isLoop, setIsLoop] = useState(false);
  const [manualCheckpoints] = useState([]); // For future feature - manual checkpoint selection
  const [numAutoCheckpoints, setNumAutoCheckpoints] = useState(4);
  const [isCalculating, setIsCalculating] = useState(false);

  // Handle current location
  const useCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const address = await reverseGeocode(
              position.coords.latitude,
              position.coords.longitude
            );
            setOrigin(address);
          } catch (error) {
            console.error('Failed to get current location address:', error);
            onError('Could not determine your current address');
          }
        },
        (error) => {
          onError('Geolocation error: ' + error.message);
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    } else {
      onError('Geolocation is not supported by this browser');
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!origin.trim()) {
      onError("Please enter a starting location");
      return;
    }

    if (!isLoop && !destination.trim()) {
      onError("Please enter a destination or select loop mode");
      return;
    }

    setIsCalculating(true);
    onLoading(true);

    try {
      // Use origin as destination for loop
      const finalDestination = isLoop ? origin : destination;

      // Calculate route using OSRM
      const routeResult = await calculateWalkingRoute(origin, finalDestination, manualCheckpoints);
      
      // Generate automatic checkpoints
      const autoCheckpoints = generateCheckpoints(routeResult, numAutoCheckpoints);
      const allCheckpoints = [...manualCheckpoints, ...autoCheckpoints];
      
      // Get route info
      const distance = routeResult.distance; // km
      const duration = routeResult.duration; // minutes

      // Generate or retrieve cached story
      const routeKey = generateRouteKey(
        origin,
        finalDestination,
        allCheckpoints
      );
      let story = null;

      try {
        // Try to get cached story first
        const cachedStory = await getStory(routeKey);
        if (cachedStory && cachedStory.story) {
          story = cachedStory.story;
        } else {
          // Generate new story
          try {
            story = await generateStory(
              origin,
              finalDestination,
              allCheckpoints,
              duration
            );
            // Cache the generated story
            await saveStory(routeKey, story);
          } catch (geminiError) {
            console.warn(
              "Gemini API failed, using fallback story:",
              geminiError
            );
            story = generateFallbackStory(
              origin,
              finalDestination,
              allCheckpoints
            );
          }
        }
      } catch (storyError) {
        console.warn("Story generation failed, using fallback:", storyError);
        story = generateFallbackStory(origin, finalDestination, allCheckpoints);
      }

      // Prepare route data
      const routeData = {
        route: routeResult,
        checkpoints: allCheckpoints,
        story,
        metadata: {
          origin,
          destination: finalDestination,
          isLoop,
          distance,
          duration,
          estimatedCalories: Math.round(distance * 50), // Rough estimate
        },
      };

      onRouteSelected(routeData);
    } catch (error) {
      console.error("Route calculation failed:", error);
      onError("Failed to calculate route: " + error.message);
    } finally {
      setIsCalculating(false);
      onLoading(false);
    }
  };

  return (
    <div className="route-selector">
      <div className="container p-4">
        <div className="card">
          <h2 className="text-2xl font-bold mb-4">
            Plan Your Walking Adventure
          </h2>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Origin Input */}
            <div>
              <label className="block text-sm font-bold mb-2 text-left">
                <MapPin className="inline w-4 h-4 mr-1" />
                Starting Location
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  className="input flex-1"
                  placeholder="Enter starting address..."
                  value={origin}
                  onChange={(e) => setOrigin(e.target.value)}
                />
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={useCurrentLocation}
                  title="Use current location"
                >
                  <Navigation className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Loop Mode Toggle */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="loop-mode"
                checked={isLoop}
                onChange={(e) => setIsLoop(e.target.checked)}
                className="w-4 h-4"
              />
              <label htmlFor="loop-mode" className="text-sm">
                Round trip (return to starting point)
              </label>
            </div>

            {/* Destination Input */}
            {!isLoop && (
              <div>
                <label className="block text-sm font-bold mb-2 text-left">
                  <MapPin className="inline w-4 h-4 mr-1" />
                  Destination
                </label>
                <input
                  type="text"
                  className="input"
                  placeholder="Enter destination address..."
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                />
              </div>
            )}

            {/* Checkpoint Options */}
            <div>
              <label className="block text-sm font-bold mb-2 text-left">
                Story Checkpoints
              </label>
              <div className="flex items-center gap-4 mb-2">
                <label className="flex items-center gap-2 text-sm">
                  Auto-generate:
                  <select
                    value={numAutoCheckpoints}
                    onChange={(e) =>
                      setNumAutoCheckpoints(Number(e.target.value))
                    }
                    className="input w-20"
                  >
                    <option value={2}>2</option>
                    <option value={3}>3</option>
                    <option value={4}>4</option>
                    <option value={5}>5</option>
                  </select>
                  checkpoints
                </label>
              </div>
              <p
                className="text-sm text-left"
                style={{ color: "var(--text-secondary)" }}
              >
                Checkpoints will be automatically placed along your route where
                story chapters will play.
              </p>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isCalculating}
            >
              {isCalculating ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  Calculating Route...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  Start Walking Adventure
                </>
              )}
            </button>
          </form>

          {/* Info Box */}
          <div
            className="mt-6 p-4 rounded-lg"
            style={{
              backgroundColor: "var(--surface)",
              border: "1px solid var(--border)",
            }}
          >
            <h3 className="font-bold mb-2 text-left">🗺️ How it works (Free Maps!):</h3>
            <ul
              className="text-sm text-left space-y-1"
              style={{ color: "var(--text-secondary)" }}
            >
              <li>• Using OpenStreetMap (completely free)</li>
              <li>• OSRM for walking route calculation</li>
              <li>• AI generates stories based on your route</li>
              <li>• GPS tracks your progress in real-time</li>
              <li>• No API registration required for maps!</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
