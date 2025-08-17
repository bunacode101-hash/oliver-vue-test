import { defineStore } from "pinia";

const LS_KEY = "sectionsActivated";
const LS_VER_KEY = "sectionsActivatedVersion";

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
  }),
  actions: {
    hydrate(version) {
      console.log(
        `[HYDRATE] Hydrating sections store with version "${version}"`
      );
      const storedVer = localStorage.getItem(LS_VER_KEY);
      if (storedVer === version) {
        const stored = localStorage.getItem(LS_KEY);
        if (stored) {
          this.activated = { ...this.activated, ...JSON.parse(stored) };
          console.log(`[HYDRATE] Restored activated sections from storage`);
        } else {
          console.log(`[HYDRATE] No stored sections found`);
        }
      } else {
        console.log(`[HYDRATE] Version mismatch, resetting activated sections`);
        this.activated = {
          auth: false,
          dashboard: false,
          profile: false,
          discover: false,
          shop: false,
          misc: false,
        };
        localStorage.setItem(LS_VER_KEY, version);
        this.persist();
      }
    },
    persist() {
      localStorage.setItem(LS_KEY, JSON.stringify(this.activated));
      console.log(`[PERSIST] Sections state saved to localStorage`);
    },
    markActivated(section) {
      this.activated[section] = true;
      this.persist();
      console.log(
        `[CACHE] Section "${section}" marked as cached (compiled section ready).`
      );
    },
    isActivated(section) {
      if (this.activated[section]) {
        console.log(`[CACHE] Section "${section}" already cached`);
        return true;
      }
      console.log(
        `[CACHE] Section "${section}" not cached yet — will need to preload/lazy load.`
      );
      return false;
    },
  },
});
