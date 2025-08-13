import { useState, useEffect } from "react";
import { RouteSelector } from "./components/RouteSelector";
import { InteractiveMapSelector } from "./components/InteractiveMapSelector";
import { LeafletMapView } from "./components/LeafletMapView";
import { AudioPlayer } from "./components/AudioPlayer";
import { TripSummary } from "./components/TripSummary";
import { TripHistory } from "./components/TripHistory";
import { initDB } from "./utils/database";
import { audioService } from "./utils/audio";
import "./App.css";

function App() {
  const [currentScreen, setCurrentScreen] = useState("map-selection"); // map-selection, route-selection, walking, summary, history
  const [route, setRoute] = useState(null);
  const [story, setStory] = useState(null);
  const [currentPosition, setCurrentPosition] = useState(null);
  const [checkpoints, setCheckpoints] = useState([]);
  const [completedCheckpoints, setCompletedCheckpoints] = useState([]);
  const [currentChapter, setCurrentChapter] = useState(0);
  const [tripData, setTripData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Initialize database on app start
  useEffect(() => {
    initDB().catch(console.error);
  }, []);

  // Handle route selection
  const handleRouteSelected = (routeData) => {
    setRoute(routeData.route);
    setCheckpoints(routeData.checkpoints);
    setStory(routeData.story);
    setCurrentScreen("walking");
    setError(null);

    // Start the first chapter
    if (routeData.story?.chapters?.length > 0) {
      setCurrentChapter(0);
    }
  };

  // Handle checkpoint reached
  const handleCheckpointReached = (checkpointIndex) => {
    if (!completedCheckpoints.includes(checkpointIndex)) {
      setCompletedCheckpoints((prev) => [...prev, checkpointIndex]);

      // Move to next chapter
      const nextChapter = checkpointIndex + 1;
      if (story?.chapters && nextChapter < story.chapters.length) {
        setCurrentChapter(nextChapter);
      }
    }
  };

  // Handle trip completion
  const handleTripCompleted = (tripSummary) => {
    setTripData(tripSummary);
    setCurrentScreen("summary");
    audioService.stop();
  };

  // Handle navigation
  const handleNavigation = (screen) => {
    setCurrentScreen(screen);
    setError(null);
  };

  // Handle errors
  const handleError = (errorMessage) => {
    setError(errorMessage);
    setIsLoading(false);
  };

  // Reset app state
  const resetApp = () => {
    setRoute(null);
    setStory(null);
    setCurrentPosition(null);
    setCheckpoints([]);
    setCompletedCheckpoints([]);
    setCurrentChapter(0);
    setTripData(null);
    setCurrentScreen("map-selection");
    setError(null);
    audioService.stop();
  };

  return (
    <div className="App">
      {/* Header chỉ hiển thị khi không phải map-selection */}
      {currentScreen !== "map-selection" && (
        <header className="app-header">
          <div className="container flex justify-between items-center p-4">
            <h1 className="text-xl font-bold">🚶‍♂️ Walking Stories</h1>
            <nav className="flex gap-2">
              <button
                className="btn btn-secondary text-sm"
                onClick={() => handleNavigation("history")}
              >
                History
              </button>
              <button
                className="btn btn-secondary text-sm"
                onClick={() => handleNavigation("map-selection")}
              >
                Map Mode
              </button>
              <button
                className="btn btn-secondary text-sm"
                onClick={() => handleNavigation("route-selection")}
              >
                Text Mode
              </button>
              {currentScreen !== "route-selection" && (
                <button className="btn btn-secondary text-sm" onClick={resetApp}>
                  New Trip
                </button>
              )}
            </nav>
          </div>
        </header>
      )}

      <main className="app-main">
        {error && (
          <div className="error-banner">
            <div className="container p-4">
              <div
                className="card"
                style={{
                  backgroundColor: "#fef2f2",
                  borderColor: "#fecaca",
                  color: "#dc2626",
                }}
              >
                <p>{error}</p>
                <button
                  className="btn btn-secondary text-sm mt-4"
                  onClick={() => setError(null)}
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        )}

        {isLoading && (
          <div className="loading-overlay">
            <div className="container flex flex-col items-center justify-center h-screen gap-4">
              <div className="spinner"></div>
              <p>Preparing your walking adventure...</p>
            </div>
          </div>
        )}

        {!isLoading && currentScreen === "map-selection" && (
          <InteractiveMapSelector
            onRouteSelected={handleRouteSelected}
            onError={handleError}
            onLoading={setIsLoading}
          />
        )}

        {!isLoading && currentScreen === "route-selection" && (
          <RouteSelector
            onRouteSelected={handleRouteSelected}
            onError={handleError}
            onLoading={setIsLoading}
          />
        )}

        {!isLoading && currentScreen === "walking" && route && (
          <>
            <LeafletMapView
              route={route}
              checkpoints={checkpoints}
              currentPosition={currentPosition}
              completedCheckpoints={completedCheckpoints}
              onPositionUpdate={setCurrentPosition}
              onCheckpointReached={handleCheckpointReached}
              onTripCompleted={handleTripCompleted}
              onError={handleError}
            />

            {story && (
              <AudioPlayer
                story={story}
                currentChapter={currentChapter}
                onChapterChange={setCurrentChapter}
                onError={handleError}
              />
            )}
          </>
        )}

        {!isLoading && currentScreen === "summary" && tripData && (
          <TripSummary
            tripData={tripData}
            story={story}
            onNewTrip={resetApp}
            onViewHistory={() => handleNavigation("history")}
          />
        )}

        {!isLoading && currentScreen === "history" && (
          <TripHistory
            onBack={() => handleNavigation("map-selection")}
            onError={handleError}
          />
        )}
      </main>

      {/* Footer chỉ hiển thị khi không phải map-selection */}
      {currentScreen !== "map-selection" && (
        <footer className="app-footer">
          <div
            className="container p-4 text-center text-sm"
            style={{ color: "var(--text-secondary)" }}
          >
            <p>© 2024 Walking Stories App - Make every walk an adventure</p>
          </div>
        </footer>
      )}
    </div>
  );
}

export default App;
