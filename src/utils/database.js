import { openDB } from "idb";

const DB_NAME = "WalkingStoryDB";
const DB_VERSION = 1;

// Initialize the database
export const initDB = async () => {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Store for trip summaries
      if (!db.objectStoreNames.contains("trips")) {
        const tripStore = db.createObjectStore("trips", {
          keyPath: "id",
          autoIncrement: true,
        });
        tripStore.createIndex("date", "date");
        tripStore.createIndex("route", "route");
      }

      // Store for cached stories
      if (!db.objectStoreNames.contains("stories")) {
        const storyStore = db.createObjectStore("stories", {
          keyPath: "routeKey",
        });
        storyStore.createIndex("timestamp", "timestamp");
      }

      // Store for user preferences
      if (!db.objectStoreNames.contains("preferences")) {
        db.createObjectStore("preferences", {
          keyPath: "key",
        });
      }
    },
  });
};

// Trip operations
export const saveTrip = async (trip) => {
  const db = await initDB();
  return db.add("trips", {
    ...trip,
    date: new Date().toISOString(),
  });
};

export const getTrips = async () => {
  const db = await initDB();
  return db.getAll("trips");
};

export const getTripById = async (id) => {
  const db = await initDB();
  return db.get("trips", id);
};

// Story operations
export const saveStory = async (routeKey, story) => {
  const db = await initDB();
  return db.put("stories", {
    routeKey,
    story,
    timestamp: Date.now(),
  });
};

export const getStory = async (routeKey) => {
  const db = await initDB();
  return db.get("stories", routeKey);
};

// Preferences operations
export const savePreference = async (key, value) => {
  const db = await initDB();
  return db.put("preferences", { key, value });
};

export const getPreference = async (key) => {
  const db = await initDB();
  const result = await db.get("preferences", key);
  return result?.value;
};

// Utility function to generate route key for caching
export const generateRouteKey = (origin, destination, checkpoints) => {
  const key = `${origin}-${destination}-${checkpoints.length}`;
  return btoa(key).replace(/[^a-zA-Z0-9]/g, "");
};
