// Audio service for Text-to-Speech using Web Speech API
class AudioService {
  constructor() {
    this.synthesis = window.speechSynthesis;
    this.currentUtterance = null;
    this.isPlaying = false;
    this.isPaused = false;
    this.voices = [];
    this.selectedVoice = null;
    this.onEndCallback = null;
    this.onErrorCallback = null;

    // Initialize voices
    this.loadVoices();

    // Handle voices changed event (especially important for Chrome)
    if (this.synthesis.onvoiceschanged !== undefined) {
      this.synthesis.onvoiceschanged = () => this.loadVoices();
    }
  }

  loadVoices() {
    this.voices = this.synthesis.getVoices();

    // Try to select a good default voice
    if (!this.selectedVoice && this.voices.length > 0) {
      // Prefer English voices
      const englishVoices = this.voices.filter((voice) =>
        voice.lang.startsWith("en")
      );

      this.selectedVoice =
        englishVoices.length > 0 ? englishVoices[0] : this.voices[0];
    }
  }

  getAvailableVoices() {
    return this.voices.map((voice) => ({
      name: voice.name,
      lang: voice.lang,
      localService: voice.localService,
      default: voice.default,
    }));
  }

  setVoice(voiceName) {
    const voice = this.voices.find((v) => v.name === voiceName);
    if (voice) {
      this.selectedVoice = voice;
      return true;
    }
    return false;
  }

  speak(text, options = {}) {
    return new Promise((resolve, reject) => {
      // Stop any current speech
      this.stop();

      const utterance = new SpeechSynthesisUtterance(text);

      // Set voice
      if (this.selectedVoice) {
        utterance.voice = this.selectedVoice;
      }

      // Set speech parameters
      utterance.rate = options.rate || 0.9; // Slightly slower for better comprehension while walking
      utterance.pitch = options.pitch || 1;
      utterance.volume = options.volume || 1;

      // Set up event handlers
      utterance.onstart = () => {
        this.isPlaying = true;
        this.isPaused = false;
        console.log("Speech started");
      };

      utterance.onend = () => {
        this.isPlaying = false;
        this.isPaused = false;
        this.currentUtterance = null;
        console.log("Speech ended");
        if (this.onEndCallback) {
          this.onEndCallback();
        }
        resolve();
      };

      utterance.onerror = (event) => {
        this.isPlaying = false;
        this.isPaused = false;
        this.currentUtterance = null;
        console.error("Speech error:", event.error);
        if (this.onErrorCallback) {
          this.onErrorCallback(event.error);
        }
        reject(new Error(`Speech synthesis error: ${event.error}`));
      };

      utterance.onpause = () => {
        this.isPaused = true;
        console.log("Speech paused");
      };

      utterance.onresume = () => {
        this.isPaused = false;
        console.log("Speech resumed");
      };

      this.currentUtterance = utterance;
      this.synthesis.speak(utterance);
    });
  }

  pause() {
    if (this.isPlaying && !this.isPaused) {
      this.synthesis.pause();
      return true;
    }
    return false;
  }

  resume() {
    if (this.isPlaying && this.isPaused) {
      this.synthesis.resume();
      return true;
    }
    return false;
  }

  stop() {
    if (this.isPlaying) {
      this.synthesis.cancel();
      this.isPlaying = false;
      this.isPaused = false;
      this.currentUtterance = null;
      return true;
    }
    return false;
  }

  getStatus() {
    return {
      isPlaying: this.isPlaying,
      isPaused: this.isPaused,
      currentVoice: this.selectedVoice?.name || "Default",
      isSupported: "speechSynthesis" in window,
    };
  }

  // Set callbacks for events
  setOnEndCallback(callback) {
    this.onEndCallback = callback;
  }

  setOnErrorCallback(callback) {
    this.onErrorCallback = callback;
  }

  // Estimate reading time (words per minute)
  estimateReadingTime(text, wpm = 150) {
    const words = text.split(" ").length;
    return Math.ceil(words / wpm); // minutes
  }

  // Pre-process text for better speech synthesis
  preprocessText(text) {
    return text
      .replace(/\n/g, ". ") // Replace newlines with pauses
      .replace(/\s+/g, " ") // Normalize spaces
      .replace(/([.!?])\s*([A-Z])/g, "$1 $2") // Ensure pauses after sentences
      .trim();
  }
}

// Create and export a singleton instance
export const audioService = new AudioService();

// Utility functions
export const checkSpeechSynthesisSupport = () => {
  return "speechSynthesis" in window;
};

export const requestAudioPermissions = async () => {
  // For future use if we need microphone access or other audio permissions
  try {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      // We don't actually need mic access, but this might be useful for future features
      return true;
    }
    return true;
  } catch (error) {
    console.warn("Audio permissions check failed:", error);
    return false;
  }
};
