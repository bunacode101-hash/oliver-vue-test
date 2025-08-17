import { useSectionsStore } from "@/stores/sections";
import { activateSection, isSectionActivated } from "@/utils/sectionActivator";
import { useAuthStore } from "@/stores/useAuthStore";

export function installSectionActivationGuard(router) {
  router.afterEach(async (to) => {
    const section = to.meta?.section;
    if (!section) {
      console.log(`[ROUTING] No section defined for route "${to.path}"`);
      return;
    }

    const routingStartTime = performance.now();
    console.log(`\n[ROUTING] Section activation check for "${section}"`);

    // Wait for DOM and assets before loading
    await new Promise((resolve) => {
      if (document.readyState === "complete") {
        console.log("[DOM] Document already fully loaded");
        resolve();
      } else {
        window.addEventListener(
          "load",
          () => {
            console.log("[DOM] Document fully loaded");
            resolve();
          },
          { once: true }
        );
      }
    });

    if (isSectionActivated(section)) {
      console.log(`[Activated] Section "${section}" already activated.`);
      console.log(`[DONE] Callback "Assets and route completed"`);
      const routingDuration = (performance.now() - routingStartTime).toFixed(2);
      console.log(`[DONE] Vue routing completed in ${routingDuration}ms`);
      return;
    }

    console.log(`[CACHE] Section "${section}" not in cache.`);
    console.log(`[LAZY] Lazy loading route "${to.path}"`);

    // Only load one section at a time
    console.log(`[LOAD] Starting section load for "${section}"`);
    const ok = await activateSection(section);
    if (ok) {
      useSectionsStore().markActivated(section);
      console.log(`[DONE] Section "${section}" fully loaded and cached.`);
      const routingDuration = (performance.now() - routingStartTime).toFixed(2);
      console.log(`[DONE] Vue routing completed in ${routingDuration}ms`);
    } else {
      console.error(`[ERROR] Failed to activate section "${section}"`);
    }

    // Handle preLoadSections with dynamic additions
    let preLoadSections = to.meta?.preLoadSections || [];
    const authStore = useAuthStore();
    const role =
      authStore.simulate?.role || authStore.currentUser?.role || "creator";
    const additional = ["auth"]; // Always keep auth warm
    if (section === "profile" && role === "creator") {
      additional.push("dashboard");
    }
    preLoadSections = [...new Set([...preLoadSections, ...additional])].filter(
      (s) => s !== section
    );

    if (preLoadSections.length > 0) {
      console.log(
        `[PRELOAD] Preloading sections for route "${
          to.path
        }": ${preLoadSections.join(", ")}`
      );
      for (const otherSection of preLoadSections) {
        if (isSectionActivated(otherSection)) {
          console.log(`[CACHE] Section "${otherSection}" already cached.`);
        } else {
          console.log(
            `[PRELOAD] Initiating preload for section "${otherSection}"`
          );
          // Sequential preload to avoid overloading
          await activateSection(otherSection);
          console.log(`[DONE] Preload completed for section "${otherSection}"`);
        }
      }
      const totalPreloadDuration = (
        performance.now() - routingStartTime
      ).toFixed(2);
      console.log(
        `[PRELOAD] All preloading completed in ${totalPreloadDuration}ms.`
      );
    }
  });
}
