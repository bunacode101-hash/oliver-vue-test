import { createRouter, createWebHistory } from "vue-router";
import routesJson from "@/router/routeConfig.json";
import { lazy } from "@/utils/lazy";
import { SectionPrefetcher } from "@/utils/sectionPrefetcher";
import { useSectionPreloadCache } from "@/stores/sectionCache";
import { useAuthStore } from "@/stores/useAuthStore";
import routeGuard from "./routeGuard";

function toRouteRecord(r) {
  console.log(`[ROUTE_CONVERT] Converting JSON route config for slug "${r.slug}" to Vue Router record.`);
  const rec = {
    path: r.slug,
    meta: r,
  };

  if (r.redirect) {
    rec.redirect = r.redirect;
    console.log(`[ROUTE_REDIRECT] Route "${r.slug}" is a redirect to "${r.redirect}". No component needed.`);
  } else if (r.customComponentPath) {
    rec.component = () => {
      const auth = useAuthStore();
      const role = auth.simulate?.role || auth.currentUser?.role || "default";
      const compPath = r.customComponentPath[role]?.componentPath;
      console.log(`[COMPONENT_DYNAMIC] Loading dynamic component for route "${r.slug}" based on role "${role}": path "${compPath ?? 'not found'}".`);
      return compPath ? lazy(compPath)() : import("@/components/NotFound.vue");
    };
  } else {
    rec.component = r.componentPath
      ? lazy(r.componentPath)
      : () => import("@/components/NotFound.vue");
    console.log(`[COMPONENT_LAZY] Set lazy component for route "${r.slug}": ${r.componentPath ? `"${r.componentPath}"` : 'NotFound.vue (default)'}.`);
  }

  console.log(`[ROUTE_CREATED] Route record created for "${r.slug}".`);
  return rec;
}

const routeRecords = routesJson.map(toRouteRecord);
console.log(`[ROUTES_TOTAL] Created ${routeRecords.length} route records from JSON config.`);

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: routeRecords,
});

router.beforeEach(routeGuard);

router.isReady().then(() => {
  const cache = useSectionPreloadCache();
  const version = import.meta.env?.VITE_APP_VERSION ?? "dev";
  console.log(`[ROUTER_READY] Router is ready. Hydrating preload cache with version "${version}".`);
  cache.hydrate(version);
  SectionPrefetcher.ensureAssetHandlerVersion();
  console.log(`[BOOT_PRELOAD] Preloading "auth" section on app boot (background, non-blocking).`);
  SectionPrefetcher.ensureSectionPreloaded("auth", () => router.getRoutes());
});

router.beforeResolve((to, _from) => {
  const startTime = performance.now();
  if (to.path === "/404" || !to.matched.length) {
    console.log(`[NAV_INVALID] Navigation to invalid route "${to.path}". Skipping any preload checks.`);
    return true;
  }

  const section = to.meta?.section || null;
  console.log(`[NAV_BEFORE] Before resolve: Navigating to route "${to.path}", associated section: "${section ?? 'none'}". Lazy loading of current route component starting now (on-demand, may have slight delay if not cached). Preloading will start only after full load to avoid bandwidth competition.`);
  return true;
});

router.afterEach(async (to, _from) => {
  const startTime = performance.now();
  const maxSizeMB = 50; // Assumed max preload budget in MB
  let usedMB = 0; // Track bandwidth usage
  const section = to.meta?.section || null;
  console.log(`[NAV_AFTER] After navigation: Route "${to.path}" (section "${section ?? 'none'}") is fully loaded and mounted (lazy load complete). Now starting background preloading for current section's remaining parts and anticipated next sections.`);

  if (section) {
    console.log(`[CURRENT_PRELOAD] Starting preload for current section "${section}" (remaining components/assets after current route's lazy load).`);
    await SectionPrefetcher.ensureSectionPreloaded(section, () => router.getRoutes(), to.path);
    console.log(`[CURRENT_PRELOAD_DONE] Preloading for current section "${section}" completed. Navigation within this section will be instant.`);
    usedMB += 10; // Placeholder: assume 10MB per section preload
    console.log(`[BANDWIDTH] Preload budget: ${maxSizeMB}MB (used: ${usedMB}MB)`);
  } else {
    console.log(`[FALLBACK_PRELOAD] No section for route "${to.path}". Falling back to preloading "auth" section.`);
    await SectionPrefetcher.ensureSectionPreloaded("auth", () => router.getRoutes(), to.path);
    console.log(`[FALLBACK_PRELOAD_DONE] Fallback preloading for "auth" section completed.`);
    usedMB += 10; // Placeholder: assume 10MB for fallback
    console.log(`[BANDWIDTH] Preload budget: ${maxSizeMB}MB (used: ${usedMB}MB)`);
  }

  const auth = useAuthStore();
  const userRole = auth.simulate?.role || auth.currentUser?.role || null;
  console.log(`[ROLE_DETERMINE] User role determined for dynamic preloads: "${userRole ?? 'none'}".`);
  for (const s of SectionPrefetcher.dynamicPreloadsForRoute(to, userRole)) {
    if (s === section) {
      console.log(`[DYNAMIC_SKIP] Skipping dynamic preload for "${s}" as it is the current section (already handled).`);
      continue;
    }
    console.log(`[DYNAMIC_START] Starting dynamic preload for additional section "${s}" based on route "${to.path}" and role "${userRole}" (anticipated next).`);
    await SectionPrefetcher.ensureSectionPreloaded(s, () => router.getRoutes(), to.path);
    console.log(`[DYNAMIC_PRELOAD_DONE] Dynamic preload for section "${s}" completed.`);
    usedMB += 10; // Placeholder: assume 10MB per dynamic preload
    console.log(`[BANDWIDTH] Preload budget: ${maxSizeMB}MB (used: ${usedMB}MB)`);
  }
  console.log(`[NAV_PRELOADS_DONE] All background preloads for route "${to.path}" completed. Total duration: ${performance.now() - startTime}ms`);
});

export default router;