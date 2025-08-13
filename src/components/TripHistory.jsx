import { useState, useEffect } from "react";
import { ArrowLeft, Clock, Route, MapPin, Calendar } from "lucide-react";
import { getTrips, getTripById } from "../utils/database";

export function TripHistory({ onBack, onError }) {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTrip, setSelectedTrip] = useState(null);

  useEffect(() => {
    const loadTrips = async () => {
      try {
        setLoading(true);
        const allTrips = await getTrips();
        // Sort by date, newest first
        const sortedTrips = allTrips.sort(
          (a, b) => new Date(b.date) - new Date(a.date)
        );
        setTrips(sortedTrips);
      } catch (error) {
        console.error("Failed to load trips:", error);
        onError("Failed to load trip history");
      } finally {
        setLoading(false);
      }
    };

    loadTrips();
  }, [onError]);

  const formatDuration = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = Math.floor(minutes % 60);
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const formatDistance = (km) => {
    return km < 1 ? `${Math.round(km * 1000)}m` : `${km.toFixed(2)}km`;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return "Today";
    if (diffDays === 2) return "Yesterday";
    if (diffDays <= 7) return `${diffDays - 1} days ago`;

    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
    });
  };

  const handleTripClick = async (tripId) => {
    try {
      const tripDetails = await getTripById(tripId);
      setSelectedTrip(tripDetails);
    } catch (error) {
      console.error("Failed to load trip details:", error);
      onError("Failed to load trip details");
    }
  };

  const getTotalStats = () => {
    if (trips.length === 0)
      return { totalDistance: 0, totalTime: 0, totalCalories: 0 };

    return trips.reduce(
      (acc, trip) => ({
        totalDistance: acc.totalDistance + (trip.actualDistance || 0),
        totalTime: acc.totalTime + (trip.actualDuration || 0),
        totalCalories: acc.totalCalories + (trip.estimatedCalories || 0),
      }),
      { totalDistance: 0, totalTime: 0, totalCalories: 0 }
    );
  };

  const stats = getTotalStats();

  if (loading) {
    return (
      <div className="trip-history">
        <div className="container p-4">
          <div className="flex items-center justify-center h-64">
            <div className="spinner"></div>
          </div>
        </div>
      </div>
    );
  }

  if (selectedTrip) {
    return (
      <div className="trip-details">
        <div className="container p-4">
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
              <button
                className="btn btn-secondary"
                onClick={() => setSelectedTrip(null)}
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <h1 className="text-xl font-bold">Trip Details</h1>
            </div>

            {/* Trip Details Card */}
            <div className="card">
              <h2 className="font-bold text-lg mb-4">
                {formatDate(selectedTrip.date)}
              </h2>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div
                  className="text-center p-3 rounded-lg"
                  style={{ backgroundColor: "var(--surface)" }}
                >
                  <Route className="w-6 h-6 mx-auto mb-2 text-blue-600" />
                  <div className="font-bold">
                    {formatDistance(selectedTrip.actualDistance)}
                  </div>
                  <div
                    className="text-xs"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    Distance
                  </div>
                </div>

                <div
                  className="text-center p-3 rounded-lg"
                  style={{ backgroundColor: "var(--surface)" }}
                >
                  <Clock className="w-6 h-6 mx-auto mb-2 text-green-600" />
                  <div className="font-bold">
                    {formatDuration(selectedTrip.actualDuration)}
                  </div>
                  <div
                    className="text-xs"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    Duration
                  </div>
                </div>
              </div>

              <div className="space-y-3 text-sm">
                <div>
                  <div className="font-semibold">Route:</div>
                  <div style={{ color: "var(--text-secondary)" }}>
                    From: {selectedTrip.route?.origin || "Unknown"}
                    <br />
                    To: {selectedTrip.route?.destination || "Unknown"}
                  </div>
                </div>

                <div>
                  <div className="font-semibold">Checkpoints:</div>
                  <div style={{ color: "var(--text-secondary)" }}>
                    {selectedTrip.checkpointsCompleted || 0} of{" "}
                    {selectedTrip.totalCheckpoints || 0} completed
                  </div>
                </div>

                <div>
                  <div className="font-semibold">Estimated Calories:</div>
                  <div style={{ color: "var(--text-secondary)" }}>
                    ~{selectedTrip.estimatedCalories || 0} calories
                  </div>
                </div>

                <div>
                  <div className="font-semibold">Average Speed:</div>
                  <div style={{ color: "var(--text-secondary)" }}>
                    {(
                      selectedTrip.actualDistance /
                        (selectedTrip.actualDuration / 60) || 0
                    ).toFixed(1)}{" "}
                    km/h
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="trip-history">
      <div className="container p-4">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center gap-4">
            <button className="btn btn-secondary" onClick={onBack}>
              <ArrowLeft className="w-4 h-4" />
            </button>
            <h1 className="text-xl font-bold">Trip History</h1>
          </div>

          {/* Overall Stats */}
          {trips.length > 0 && (
            <div className="card">
              <h2 className="font-bold text-lg mb-4 text-center">
                Your Walking Stats
              </h2>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="font-bold text-lg text-blue-600">
                    {formatDistance(stats.totalDistance)}
                  </div>
                  <div
                    className="text-xs"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    Total Distance
                  </div>
                </div>

                <div className="text-center">
                  <div className="font-bold text-lg text-green-600">
                    {formatDuration(stats.totalTime)}
                  </div>
                  <div
                    className="text-xs"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    Total Time
                  </div>
                </div>

                <div className="text-center">
                  <div className="font-bold text-lg text-orange-600">
                    {stats.totalCalories}
                  </div>
                  <div
                    className="text-xs"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    Calories Burned
                  </div>
                </div>
              </div>

              <div
                className="mt-4 text-center text-sm"
                style={{ color: "var(--text-secondary)" }}
              >
                {trips.length} adventure{trips.length !== 1 ? "s" : ""}{" "}
                completed
              </div>
            </div>
          )}

          {/* Trip List */}
          {trips.length === 0 ? (
            <div className="card text-center">
              <MapPin
                className="w-12 h-12 mx-auto mb-4"
                style={{ color: "var(--text-secondary)" }}
              />
              <h3 className="font-bold mb-2">No Adventures Yet</h3>
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                Start your first walking story adventure to see your trip
                history here.
              </p>
              <button className="btn btn-primary mt-4" onClick={onBack}>
                Start First Adventure
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <h2 className="font-bold text-lg">Recent Adventures</h2>

              {trips.map((trip) => (
                <div
                  key={trip.id}
                  className="card cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => handleTripClick(trip.id)}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Calendar
                          className="w-4 h-4"
                          style={{ color: "var(--text-secondary)" }}
                        />
                        <span className="font-semibold text-sm">
                          {formatDate(trip.date)}
                        </span>
                      </div>

                      <div
                        className="text-xs space-y-1"
                        style={{ color: "var(--text-secondary)" }}
                      >
                        <div className="truncate">
                          {trip.route?.origin &&
                            trip.route?.destination &&
                            `${trip.route.origin.split(",")[0]} → ${
                              trip.route.destination.split(",")[0]
                            }`}
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-1">
                          <Route className="w-3 h-3" />
                          <span>
                            {formatDistance(trip.actualDistance || 0)}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>
                            {formatDuration(trip.actualDuration || 0)}
                          </span>
                        </div>
                      </div>

                      {trip.checkpointsCompleted !== undefined &&
                        trip.totalCheckpoints !== undefined && (
                          <div
                            className="text-xs mt-1"
                            style={{ color: "var(--text-secondary)" }}
                          >
                            {trip.checkpointsCompleted}/{trip.totalCheckpoints}{" "}
                            checkpoints
                          </div>
                        )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
