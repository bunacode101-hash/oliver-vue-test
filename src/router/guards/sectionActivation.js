import { useSectionsStore } from "@/stores/sections";
import { activateSection, isSectionActivated } from "@/utils/sectionActivator";

export function installSectionActivationGuard(router) {
  router.afterEach(async (to) => {
    const section = to.meta?.section;
    if (!section) return;

    const routingStartTime = performance.now();

    console.log(`\n[ROUTING] Section activation check for "${section}"`);

    // Check if section is already activated
    if (await isSectionActivated(section)) {
      console.log(`[CACHE] Section "${section}" exists in cache.`);
      console.log(
        `[CACHE] Proceeding to load cached section (instant navigation).`
      );
      console.log(`[DONE] Callback "Assets and route completed"`);
      const routingDuration = (performance.now() - routingStartTime).toFixed(2);
      console.log(`[DONE] Vue routing completed in ${routingDuration}ms`);
      return;
    }

    // Section not cached, lazy load current route
    console.log(`[CACHE] Section "${section}" does not exist in cache.`);
    console.log(
      `[LAZY] Proceeding to lazy load the current route "${to.path}"`
    );

    const loadSection = async () => {
      const ok = await activateSection(section);
      if (ok) {
        useSectionsStore().markActivated(section);
        const routingDuration = (performance.now() - routingStartTime).toFixed(
          2
        );
        console.log(`[DONE] Vue routing completed in ${routingDuration}ms`);
      }
    };

    requestIdleCallback
      ? requestIdleCallback(loadSection)
      : setTimeout(loadSection, 0);

    // Handle preLoadSections
    const preLoadSections = to.meta?.preLoadSections || [];
    if (preLoadSections.length > 0) {
      console.log(
        `[PRELOAD] Checking other sections to cache for this route: ${preLoadSections.join(
          ", "
        )}`
      );

      for (const otherSection of preLoadSections) {
        if (await isSectionActivated(otherSection)) {
          console.log(`[CACHE] Section "${otherSection}" already cached.`);
        } else {
          console.log(`[CACHE] Section "${otherSection}" is not cached yet.`);
          console.log(
            `[PRELOAD] Preloading section "${otherSection}" and its assets...`
          );
          await activateSection(otherSection);
          console.log(
            `[DONE] Callback "Preload ${otherSection} Assets and section ${otherSection} cached"`
          );
        }
      }

      const totalPreloadDuration = (
        performance.now() - routingStartTime
      ).toFixed(2);
      console.log(
        `[PRELOAD] Preloading completed in ${totalPreloadDuration}ms.`
      );
    }
  });
}
