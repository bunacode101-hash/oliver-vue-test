// stores/sectionStore.js
import { defineStore } from "pinia";
const LS_KEY = "sectionsActivated";
const LS_VER_KEY = "sectionsActivatedVersion";
const appVersion = import.meta.env.VITE_APP_VERSION || "dev";
export const useSectionsStore = defineStore("sections", {
  state: () => ({
    activated: {
      auth: false,
      dashboard: false,
      profile: false,
      discover: false,
      shop: false,
      misc: false,
    },
    activating: {},
  }),
  actions: {
    hydrate() {
      const storedVer = localStorage.getItem(LS_VER_KEY);
      if (storedVer === appVersion) {
        const stored = localStorage.getItem(LS_KEY);
        if (stored) {
          this.activated = { ...this.activated, ...JSON.parse(stored) };
          // console.log(
          //   `[HYDRATE] Restored activated sections: ${JSON.stringify(
          //     this.activated
          //   )}`
          // );
        } else {
          console.log(`[HYDRATE] No stored sections found`);
        }
      } else {
        console.log(`[HYDRATE] Version mismatch, resetting activated sections`);
        this.reset();
        localStorage.setItem(LS_VER_KEY, appVersion);
      }
    },
    reset() {
      this.activated = {
        auth: false,
        dashboard: false,
        profile: false,
        discover: false,
        shop: false,
        misc: false,
      };
      this.persist();
    },
    persist() {
      localStorage.setItem(LS_KEY, JSON.stringify(this.activated));
      console.log(
        `[PERSIST] Sections state saved to localStorage: ${JSON.stringify(
          this.activated
        )}`
      );
    },
    markActivated(section) {
      if (!this.activated[section]) {
        this.activated[section] = true;
        console.log(`[SECTION] Marked "${section}" as activated`);
        this.persist();
      } else {
        console.log(`[SECTION] "${section}" already activated, no change`);
      }
    },
    isActivated(section) {
      const activated = this.activated[section];
      console.log(
        `[SECTION] Checking activation for "${section}": ${
          activated ? "activated" : "not activated"
        }`
      );
      return activated;
    },
    async activateSection(section, preloadFn) {
      console.log(`[ACTIVATE] Attempting to activate "${section}"`);
      if (this.isActivated(section)) {
        console.log(`[ACTIVATE] "${section}" already activated`);
        return;
      }
      if (this.activating[section]) {
        console.log(`[ACTIVATE] Waiting for ongoing activation of "${section}"`);
        await this.activating[section];
        return;
      }
      console.log(`[ACTIVATE] Starting activation for "${section}"`);
      const promise = preloadFn()
        .then(() => {
          this.markActivated(section);
        })
        .catch((err) => {
          console.error(`[ACTIVATE] Error activating "${section}":`, err);
        })
        .finally(() => {
          delete this.activating[section];
        });
      this.activating[section] = promise;
      await promise;
    },
  },
});