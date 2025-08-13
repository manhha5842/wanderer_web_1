import { useState, useEffect } from "react";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  Settings,
} from "lucide-react";
import { audioService } from "../utils/audio";
import { savePreference, getPreference } from "../utils/database";

export function AudioPlayer({
  story,
  currentChapter,
  onChapterChange,
  onError,
}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [voices, setVoices] = useState([]);
  const [selectedVoice, setSelectedVoice] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(0.9);
  const [volume, setVolume] = useState(1);

  const currentChapterData = story?.chapters?.[currentChapter];

  // Initialize audio service and load preferences
  useEffect(() => {
    const initAudio = async () => {
      try {
        // Load available voices
        const availableVoices = audioService.getAvailableVoices();
        setVoices(availableVoices);

        // Load saved preferences
        const savedVoice = await getPreference("selectedVoice");
        const savedRate = await getPreference("playbackRate");
        const savedVolume = await getPreference("volume");

        if (savedVoice && audioService.setVoice(savedVoice)) {
          setSelectedVoice(savedVoice);
        } else if (availableVoices.length > 0) {
          setSelectedVoice(availableVoices[0].name);
        }

        if (savedRate) {
          setPlaybackRate(savedRate);
        }

        if (savedVolume) {
          setVolume(savedVolume);
        }

        // Set up audio event handlers
        audioService.setOnEndCallback(() => {
          setIsPlaying(false);
          setIsPaused(false);
        });

        audioService.setOnErrorCallback((error) => {
          setIsPlaying(false);
          setIsPaused(false);
          onError(`Audio playback error: ${error}`);
        });
      } catch (error) {
        console.error("Failed to initialize audio:", error);
        onError("Failed to initialize audio system");
      }
    };

    initAudio();
  }, [onError]);

  // Auto-play new chapter when currentChapter changes
  useEffect(() => {
    const playChapter = async () => {
      if (!currentChapterData) return;

      try {
        setIsPlaying(true);
        setIsPaused(false);

        const processedText = audioService.preprocessText(
          currentChapterData.content
        );

        await audioService.speak(processedText, {
          rate: playbackRate,
          volume: volume,
        });

        setIsPlaying(false);
      } catch (error) {
        console.error("Playback failed:", error);
        setIsPlaying(false);
        setIsPaused(false);
        onError("Failed to play audio. Please try again.");
      }
    };

    if (currentChapterData && !isPlaying) {
      playChapter();
    }
  }, [
    currentChapter,
    currentChapterData,
    isPlaying,
    playbackRate,
    volume,
    onError,
  ]);

  const playCurrentChapter = async () => {
    if (!currentChapterData) return;

    try {
      setIsPlaying(true);
      setIsPaused(false);

      const processedText = audioService.preprocessText(
        currentChapterData.content
      );

      await audioService.speak(processedText, {
        rate: playbackRate,
        volume: volume,
      });

      setIsPlaying(false);
    } catch (error) {
      console.error("Playback failed:", error);
      setIsPlaying(false);
      setIsPaused(false);
      onError("Failed to play audio. Please try again.");
    }
  };

  const pausePlayback = () => {
    if (audioService.pause()) {
      setIsPaused(true);
    }
  };

  const resumePlayback = () => {
    if (audioService.resume()) {
      setIsPaused(false);
    }
  };

  const stopPlayback = () => {
    if (audioService.stop()) {
      setIsPlaying(false);
      setIsPaused(false);
    }
  };

  const handlePlayPause = () => {
    if (isPlaying && !isPaused) {
      pausePlayback();
    } else if (isPlaying && isPaused) {
      resumePlayback();
    } else {
      playCurrentChapter();
    }
  };

  const handlePreviousChapter = () => {
    if (currentChapter > 0) {
      stopPlayback();
      onChapterChange(currentChapter - 1);
    }
  };

  const handleNextChapter = () => {
    if (story?.chapters && currentChapter < story.chapters.length - 1) {
      stopPlayback();
      onChapterChange(currentChapter + 1);
    }
  };

  const handleVoiceChange = async (voiceName) => {
    if (audioService.setVoice(voiceName)) {
      setSelectedVoice(voiceName);
      await savePreference("selectedVoice", voiceName);

      // Restart current playback with new voice if playing
      if (isPlaying) {
        stopPlayback();
        setTimeout(playCurrentChapter, 100);
      }
    }
  };

  const handleRateChange = async (rate) => {
    setPlaybackRate(rate);
    await savePreference("playbackRate", rate);

    // Restart current playback with new rate if playing
    if (isPlaying) {
      stopPlayback();
      setTimeout(playCurrentChapter, 100);
    }
  };

  const handleVolumeChange = async (vol) => {
    setVolume(vol);
    await savePreference("volume", vol);
  };

  if (!story || !currentChapterData) {
    return null;
  }

  return (
    <div className="audio-player">
      <div className="flex flex-col gap-4">
        {/* Chapter Info */}
        <div className="text-center">
          <h3 className="font-bold text-lg">{currentChapterData.title}</h3>
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            Chapter {currentChapter + 1} of {story.chapters.length}
            {currentChapterData.estimatedReadingTime && (
              <span> • ~{currentChapterData.estimatedReadingTime} min</span>
            )}
          </p>
        </div>

        {/* Playback Controls */}
        <div className="flex items-center justify-center gap-4">
          <button
            className="btn btn-secondary"
            onClick={handlePreviousChapter}
            disabled={currentChapter === 0}
            title="Previous chapter"
          >
            <SkipBack className="w-5 h-5" />
          </button>

          <button
            className="btn btn-primary text-lg px-6"
            onClick={handlePlayPause}
            title={isPlaying ? (isPaused ? "Resume" : "Pause") : "Play"}
          >
            {isPlaying && !isPaused ? (
              <Pause className="w-6 h-6" />
            ) : (
              <Play className="w-6 h-6" />
            )}
          </button>

          <button
            className="btn btn-secondary"
            onClick={handleNextChapter}
            disabled={currentChapter >= story.chapters.length - 1}
            title="Next chapter"
          >
            <SkipForward className="w-5 h-5" />
          </button>

          <button
            className="btn btn-secondary"
            onClick={() => setShowSettings(!showSettings)}
            title="Audio settings"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>

        {/* Progress Indicator */}
        <div className="flex items-center gap-2 text-sm">
          <span>{currentChapter + 1}</span>
          <div className="flex-1 progress-bar">
            <div
              className="progress-fill"
              style={{
                width: `${
                  ((currentChapter + 1) / story.chapters.length) * 100
                }%`,
              }}
            />
          </div>
          <span>{story.chapters.length}</span>
        </div>

        {/* Audio Status */}
        {isPlaying && (
          <div className="flex items-center justify-center gap-2 text-sm">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="status-online">
              {isPaused ? "Paused" : "Playing"}
            </span>
          </div>
        )}

        {/* Settings Panel */}
        {showSettings && (
          <div className="card mt-4">
            <h4 className="font-bold mb-4 text-left">Audio Settings</h4>

            {/* Voice Selection */}
            <div className="mb-4">
              <label className="block text-sm font-bold mb-2 text-left">
                <Volume2 className="inline w-4 h-4 mr-1" />
                Voice
              </label>
              <select
                className="input text-sm"
                value={selectedVoice}
                onChange={(e) => handleVoiceChange(e.target.value)}
              >
                {voices.map((voice) => (
                  <option key={voice.name} value={voice.name}>
                    {voice.name} ({voice.lang})
                  </option>
                ))}
              </select>
            </div>

            {/* Playback Rate */}
            <div className="mb-4">
              <label className="block text-sm font-bold mb-2 text-left">
                Reading Speed: {playbackRate}x
              </label>
              <input
                type="range"
                min="0.5"
                max="2"
                step="0.1"
                value={playbackRate}
                onChange={(e) => handleRateChange(parseFloat(e.target.value))}
                className="w-full"
              />
              <div
                className="flex justify-between text-xs mt-1"
                style={{ color: "var(--text-secondary)" }}
              >
                <span>Slower</span>
                <span>Faster</span>
              </div>
            </div>

            {/* Volume */}
            <div className="mb-4">
              <label className="block text-sm font-bold mb-2 text-left">
                Volume: {Math.round(volume * 100)}%
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={volume}
                onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                className="w-full"
              />
            </div>

            <button
              className="btn btn-secondary w-full"
              onClick={() => setShowSettings(false)}
            >
              Close Settings
            </button>
          </div>
        )}

        {/* Chapter Preview */}
        <div className="text-left">
          <p
            className="text-sm line-clamp-3"
            style={{ color: "var(--text-secondary)" }}
          >
            {currentChapterData.content.substring(0, 150)}...
          </p>
        </div>
      </div>
    </div>
  );
}
