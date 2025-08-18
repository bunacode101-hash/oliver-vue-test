import { useSectionsStore } from "@/stores/sections";
import { activateSection, isSectionActivated } from "@/utils/sectionActivator";
import { useAuthStore } from "@/stores/useAuthStore";

export function installSectionActivationGuard(router) {
  router.beforeEach(async (to, from, next) => {
    const section = to.meta?.section;
    if (!section) {
      console.log(`[ROUTING] No section defined for route "${to.path}"`);
      next();
      return;
    }

    console.log(`\n[ROUTING] Navigating to "${to.path}" in section "${section}"`);
    if (isSectionActivated(section)) {
      console.log(`[DONE] Callback "Assets and route completed" for "${to.path}"`);
      next();
      return;
    }

    console.log(`[LAZY] Lazy loading route "${to.path}"`);
    const ok = await activateSection(section);
    if (!ok) {
      console.error(`[ERROR] Failed to activate section "${section}"`);
    }

    next();
  });

  router.afterEach(async (to) => {
    const section = to.meta?.section;
    if (!section) {
      console.log(`[PRELOAD_SECTIONS] No section defined for "${to.path}", skipping preload`);
      return;
    }

    const routingStartTime = performance.now();

    // Handle preLoadSections with dynamic additions
    let preLoadSections = to.meta?.preLoadSections || [];
    const authStore = useAuthStore();
    const role = authStore.simulate?.role || authStore.currentUser?.role || "creator";
    const additional = ["auth"]; // Always keep auth warm
    if (section === "profile" && role === "creator") {
      additional.push("dashboard");
    }
    preLoadSections = [...new Set([...preLoadSections, ...additional])].filter(s => s !== section);

    if (preLoadSections.length > 0) {
      console.log(`[PRELOAD_SECTIONS] Starting preload for: ${preLoadSections.join(", ")}`);
      for (const otherSection of preLoadSections) {
        if (isSectionActivated(otherSection)) {
          console.log(`[PRELOAD_SECTIONS] Section "${otherSection}" already cached, skipping preload`);
        } else {
          console.log(`[PRELOAD_SECTIONS] Preloading section: ${otherSection}`);
          await activateSection(otherSection);
          console.log(`[PRELOAD_SECTIONS] Section "${otherSection}" preload completed`);
        }
      }
      console.log(`[PRELOAD_SECTIONS] All preloading completed in ${(performance.now() - routingStartTime).toFixed(2)}ms.`);
    } else {
      console.log(`[PRELOAD_SECTIONS] No additional sections to preload for "${to.path}"`);
    }
  });
}