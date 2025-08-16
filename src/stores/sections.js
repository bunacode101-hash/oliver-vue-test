import { defineStore } from "pinia";

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
    markActivated(section) {
      this.activated[section] = true;
      console.log(
        `[CACHE] Section "${section}" marked as cached (compiled section ready).`
      );
    },

    isActivated(section) {
      if (this.activated[section]) {
        console.log(
          `[CACHE] Section "${section}" already cached — no need to reload.`
        );
        return true;
      }
      console.log(
        `[CACHE] Section "${section}" not cached yet — will need to preload/lazy load.`
      );
      return false;
    },
  },
});
