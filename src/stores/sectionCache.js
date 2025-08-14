import { defineStore } from "pinia";

const LS_KEY = "sectionWarmState";
const LS_VER_KEY = "sectionWarmStateVersion";

function readJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}
function writeJSON(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

export const useSectionCache = defineStore("sectionCache", {
  state: () => ({
    appVersion: null,
    warmSections: {},
    warmComponents: {},
  }),
  actions: {
    hydrate(version) {
      console.log("Hydrating cache with version:", version); // Added debug
      const storedVersion = localStorage.getItem(LS_VER_KEY); // read as plain string
      if (storedVersion === version) {
        this.warmSections = readJSON(LS_KEY, {});
      } else {
        this.warmSections = {};
        localStorage.setItem(LS_VER_KEY, version); // store plain string
        writeJSON(LS_KEY, this.warmSections);
      }
      this.appVersion = version;
    },
    persist() {
      writeJSON(LS_KEY, this.warmSections);
    },
    isSectionWarm(section) {
      return !!this.warmSections?.[section];
    },
    markSectionWarm(section) {
      if (!section) return;
      // Debug log to see which sections are being warmed
      console.log("Warming:", section);

      this.warmSections[section] = true;
      this.persist();
    },
    markComponentWarm(key) {
      if (!key) return;
      this.warmComponents[key] = true;
    },
    clearAll(version) {
      this.warmSections = {};
      this.warmComponents = {};
      this.appVersion = version;
      localStorage.setItem(LS_VER_KEY, version);
      writeJSON(LS_KEY, this.warmSections);
    },
  },
});
