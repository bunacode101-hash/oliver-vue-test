import { defineStore } from "pinia";

const LS_KEY = "sectionPreloadState";
const LS_VER_KEY = "sectionPreloadStateVersion";

function readJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    console.log(
      `[STORAGE_READ] Attempting to read key "${key}" from localStorage. Raw value retrieved: ${
        raw ? `"${raw}"` : "null (no value stored)"
      }`
    );
    return raw ? JSON.parse(raw) : fallback;
  } catch (e) {
    console.error(
      `[STORAGE_ERROR] Error occurred while trying to read and parse key "${key}" from localStorage:`,
      e
    );
    return fallback;
  }
}

function writeJSON(key, value) {
  try {
    const jsonValue = JSON.stringify(value);
    localStorage.setItem(key, jsonValue);
    console.log(
      `[STORAGE_WRITE] Successfully wrote key "${key}" to localStorage with value:`,
      value
    );
  } catch (e) {
    console.error(
      `[STORAGE_ERROR] Error occurred while trying to write key "${key}" to localStorage:`,
      e
    );
  }
}

export const useSectionPreloadCache = defineStore("sectionPreloadCache", {
  state: () => ({
    appVersion: null,
    preloadedSections: {},
    preloadedComponents: {},
  }),
  actions: {
    hydrate(version) {
      const startTime = performance.now();
      console.log(
        `[HYDRATE_START] Starting hydration of preload cache with current app version: "${version}"`
      );
      const storedVersion = readJSON(LS_VER_KEY, null);
      console.log(
        `[VERSION_CHECK] Compared stored version "${
          storedVersion ?? "none"
        }" with current version "${version}"`
      );
      if (storedVersion === version) {
        this.preloadedSections = readJSON(LS_KEY, {});
        console.log(
          `[HYDRATE_RESTORE] Versions match. Restored preloaded sections from localStorage:`,
          this.preloadedSections
        );
      } else {
        console.log(
          `[VERSION_MISMATCH] Version mismatch detected (stored: "${
            storedVersion ?? "none"
          }", current: "${version}"). Resetting preloaded sections to empty object.`
        );
        this.preloadedSections = {};
        writeJSON(LS_VER_KEY, version);
        writeJSON(LS_KEY, this.preloadedSections);
      }
      this.appVersion = version;
      console.log(
        `[HYDRATE_DONE] Hydration completed. Current app version set to "${version}". Duration: ${performance.now() - startTime}ms`
      );
    },
    persist() {
      const startTime = performance.now();
      console.log(
        `[PERSIST] Persisting current preloaded sections state to localStorage:`,
        this.preloadedSections
      );
      writeJSON(LS_KEY, this.preloadedSections);
      console.log(
        `[PERSIST_DONE] Persistence completed. Duration: ${performance.now() - startTime}ms`
      );
    },
    isSectionPreloaded(section) {
      console.log(
        `[COMPILE_SECTION_CHECK] Checking if compiled section exists for: "${section}"`
      );
      const isPreloaded = !!this.preloadedSections[section];
      console.log(
        `[PRELOAD_VERIFY] Verified preloaded section: "${section}" exists=${isPreloaded}`
      );
      console.log(
        `[CACHE_CHECK] Checking if section "${section}" is marked as preloaded in cache: ${
          isPreloaded
            ? "Yes (full section preloaded and cached)"
            : "No (section not fully preloaded yet, though individual components may be lazy-loaded)"
        }`
      );
      return isPreloaded;
    },
    markSectionPreloaded(section) {
      if (!section) {
        console.log(
          `[MARK_ERROR] Attempt to mark section as preloaded failed: section name is empty or undefined. Skipping.`
        );
        return;
      }
      console.log(
        `[COMPILED_SECTION_LOADED] Marking section "${section}" as preloaded in cache (all components and assets fully preloaded).`
      );
      this.preloadedSections[section] = true;
      this.persist();
    },
    markComponentPreloaded(key) {
      if (!key) {
        console.log(
          `[MARK_ERROR] Attempt to mark component as preloaded failed: component key is empty or undefined. Skipping.`
        );
        return;
      }
      console.log(
        `[COMPILED_SECTION_LOADED] Marking component with key "${key}" as preloaded (this component's chunk is downloaded and cached).`
      );
      this.preloadedComponents[key] = true;
    },
    clearAll(version) {
      const startTime = performance.now();
      console.log(
        `[CACHE_CLEAR] Clearing all preload cache data for new app version: "${version}"`
      );
      this.preloadedSections = {};
      this.preloadedComponents = {};
      this.appVersion = version;
      writeJSON(LS_VER_KEY, version);
      writeJSON(LS_KEY, this.preloadedSections);
      console.log(
        `[CACHE_CLEAR_DONE] Clear completed. Preloaded sections and components reset. Duration: ${performance.now() - startTime}ms`
      );
    },
  },
});