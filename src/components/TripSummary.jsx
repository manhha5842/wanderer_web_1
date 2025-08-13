import { Clock, MapPin, Route, Zap, BookOpen, Share2 } from "lucide-react";

export function TripSummary({ tripData, story, onNewTrip, onViewHistory }) {
  const formatDuration = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = Math.floor(minutes % 60);
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const formatDistance = (km) => {
    return km < 1 ? `${Math.round(km * 1000)}m` : `${km.toFixed(2)}km`;
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const accuracyRating = () => {
    const timeDiff = Math.abs(
      tripData.actualDuration - tripData.estimatedDuration
    );
    const distanceDiff = Math.abs(
      tripData.actualDistance - tripData.estimatedDistance
    );

    if (timeDiff <= 5 && distanceDiff <= 0.2) return "Excellent";
    if (timeDiff <= 10 && distanceDiff <= 0.5) return "Good";
    if (timeDiff <= 20 && distanceDiff <= 1) return "Fair";
    return "Variable";
  };

  const handleShare = async () => {
    const shareData = {
      title: "My Walking Story Adventure",
      text: `I just completed a ${formatDistance(
        tripData.actualDistance
      )} walking adventure in ${formatDuration(tripData.actualDuration)}! 🚶‍♂️✨`,
      url: window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        // Fallback: copy to clipboard
        await navigator.clipboard.writeText(
          `${shareData.text}\n\nDistance: ${formatDistance(
            tripData.actualDistance
          )}\nTime: ${formatDuration(tripData.actualDuration)}\nCalories: ~${
            tripData.estimatedCalories
          }`
        );
        alert("Trip summary copied to clipboard!");
      }
    } catch (error) {
      console.error("Failed to share:", error);
    }
  };

  return (
    <div className="trip-summary">
      <div className="container p-4">
        <div className="space-y-6">
          {/* Header */}
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-2">🎉 Adventure Complete!</h1>
            <p className="text-lg" style={{ color: "var(--text-secondary)" }}>
              Well done on your walking story adventure
            </p>
          </div>

          {/* Main Stats */}
          <div className="card">
            <h2 className="font-bold text-xl mb-4 text-center">Trip Summary</h2>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div
                className="text-center p-4 rounded-lg"
                style={{ backgroundColor: "var(--surface)" }}
              >
                <Route className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                <div className="font-bold text-lg">
                  {formatDistance(tripData.actualDistance)}
                </div>
                <div
                  className="text-sm"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Distance
                </div>
                <div className="text-xs mt-1">
                  Est: {formatDistance(tripData.estimatedDistance)}
                </div>
              </div>

              <div
                className="text-center p-4 rounded-lg"
                style={{ backgroundColor: "var(--surface)" }}
              >
                <Clock className="w-8 h-8 mx-auto mb-2 text-green-600" />
                <div className="font-bold text-lg">
                  {formatDuration(tripData.actualDuration)}
                </div>
                <div
                  className="text-sm"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Duration
                </div>
                <div className="text-xs mt-1">
                  Est: {formatDuration(tripData.estimatedDuration)}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div
                className="text-center p-4 rounded-lg"
                style={{ backgroundColor: "var(--surface)" }}
              >
                <Zap className="w-8 h-8 mx-auto mb-2 text-orange-600" />
                <div className="font-bold text-lg">
                  {tripData.estimatedCalories}
                </div>
                <div
                  className="text-sm"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Calories
                </div>
              </div>

              <div
                className="text-center p-4 rounded-lg"
                style={{ backgroundColor: "var(--surface)" }}
              >
                <MapPin className="w-8 h-8 mx-auto mb-2 text-purple-600" />
                <div className="font-bold text-lg">
                  {tripData.checkpointsCompleted}/{tripData.totalCheckpoints}
                </div>
                <div
                  className="text-sm"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Checkpoints
                </div>
              </div>
            </div>
          </div>

          {/* Route Details */}
          <div className="card">
            <h3 className="font-bold text-lg mb-4">Route Details</h3>
            <div className="space-y-3">
              <div>
                <div className="font-semibold text-sm">From:</div>
                <div
                  className="text-sm"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {tripData.route.origin}
                </div>
              </div>
              <div>
                <div className="font-semibold text-sm">To:</div>
                <div
                  className="text-sm"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {tripData.route.destination}
                </div>
              </div>
              <div>
                <div className="font-semibold text-sm">Completed:</div>
                <div
                  className="text-sm"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {formatDate(tripData.endTime)}
                </div>
              </div>
              <div>
                <div className="font-semibold text-sm">Accuracy:</div>
                <div className="text-sm font-medium text-green-600">
                  {accuracyRating()}
                </div>
              </div>
            </div>
          </div>

          {/* Story Summary */}
          {story && (
            <div className="card">
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                Your Story: "{story.title}"
              </h3>
              <div className="text-sm space-y-2">
                <p>
                  You experienced a {story.chapters?.length}-chapter story
                  during your walk:
                </p>
                <div className="space-y-1">
                  {story.chapters?.map((chapter, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 p-2 rounded"
                      style={{
                        backgroundColor:
                          index < tripData.checkpointsCompleted
                            ? "rgba(16, 185, 129, 0.1)"
                            : "var(--surface)",
                      }}
                    >
                      <div
                        className={`w-2 h-2 rounded-full ${
                          index < tripData.checkpointsCompleted
                            ? "bg-green-500"
                            : "bg-gray-300"
                        }`}
                      ></div>
                      <span
                        className={
                          index < tripData.checkpointsCompleted
                            ? "text-green-700"
                            : ""
                        }
                      >
                        {chapter.title}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Performance Insights */}
          <div className="card">
            <h3 className="font-bold text-lg mb-4">Performance Insights</h3>
            <div className="space-y-3 text-sm">
              {tripData.actualDuration < tripData.estimatedDuration && (
                <div className="flex items-center gap-2 text-green-600">
                  <Zap className="w-4 h-4" />
                  <span>
                    You completed the route faster than expected! Great pace!
                  </span>
                </div>
              )}
              {tripData.actualDistance > tripData.estimatedDistance && (
                <div className="flex items-center gap-2 text-blue-600">
                  <Route className="w-4 h-4" />
                  <span>You covered extra distance during your adventure.</span>
                </div>
              )}
              {tripData.checkpointsCompleted === tripData.totalCheckpoints && (
                <div className="flex items-center gap-2 text-purple-600">
                  <MapPin className="w-4 h-4" />
                  <span>Perfect navigation! You hit all checkpoints.</span>
                </div>
              )}
              <div className="text-gray-600">
                Average walking speed:{" "}
                {(
                  tripData.actualDistance / (tripData.actualDuration / 60) || 0
                ).toFixed(1)}{" "}
                km/h
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <button className="btn btn-primary w-full" onClick={handleShare}>
              <Share2 className="w-4 h-4" />
              Share Your Adventure
            </button>

            <div className="grid grid-cols-2 gap-3">
              <button className="btn btn-secondary" onClick={onViewHistory}>
                View History
              </button>

              <button className="btn btn-success" onClick={onNewTrip}>
                New Adventure
              </button>
            </div>
          </div>

          {/* Motivational Message */}
          <div
            className="text-center p-4 rounded-lg"
            style={{
              backgroundColor: "var(--surface)",
              border: "1px solid var(--border)",
            }}
          >
            <p className="text-sm font-medium mb-2">
              🌟 Adventure Complete! 🌟
            </p>
            <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
              Every step tells a story. Every walk is an adventure waiting to
              unfold. Ready for your next journey?
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
