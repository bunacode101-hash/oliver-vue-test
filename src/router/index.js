import { createRouter, createWebHistory } from "vue-router";
import routesJson from "@/router/routes.json";
import { lazy } from "@/utils/lazy";
import { SectionPrefetcher } from "@/utils/sectionPrefetcher";
import { useSectionCache } from "@/stores/sectionCache";
import { useAuthStore } from "@/stores/useAuthStore";
import routeGuard from "./routeGuard";

function toRouteRecord(r) {
  const rec = {
    path: r.slug,
    meta: r,
  };

  if (r.redirect) {
    rec.redirect = r.redirect;
  } else if (r.customComponentPath) {
    rec.component = () => {
      const auth = useAuthStore();
      const role = auth.simulate?.role || auth.currentUser?.role || "default";
      const compPath = r.customComponentPath[role]?.componentPath;
      return compPath
        ? lazy(compPath)
        : () => import("@/components/NotFound.vue");
    };
  } else {
    rec.component = r.componentPath
      ? lazy(r.componentPath)
      : () => import("@/components/NotFound.vue");
  }

  return rec;
}

const routeRecords = routesJson.map(toRouteRecord);

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: routeRecords,
});

router.beforeEach(routeGuard);

router.isReady().then(() => {
  const cache = useSectionCache();
  const version = import.meta.env?.VITE_APP_VERSION ?? "dev";
  cache.hydrate(version);
  SectionPrefetcher.ensureAssetHandlerVersion();
  // Always start warming 'auth' asap (non-blocking)
  void SectionPrefetcher.ensureSectionWarm("auth", () => router.getRoutes());
});

router.beforeResolve(async (to, _from) => {
  // Defensive: ensure meta present
  const section = to.meta?.section || null;

  // Kick background warm for current section
  if (section) {
    void SectionPrefetcher.ensureSectionWarm(section, () => router.getRoutes());
  } else {
    // Still ensure auth hot as a base
    void SectionPrefetcher.ensureSectionWarm("auth", () => router.getRoutes());
  }

  // Role-aware proactive warms
  const auth = useAuthStore();
  const userRole = (auth.simulate?.role || auth.currentUser?.role) ?? null;
  for (const s of SectionPrefetcher.dynamicPreloadsForRoute(to, userRole)) {
    void SectionPrefetcher.ensureSectionWarm(s, () => router.getRoutes());
  }

  return true;
});

export default router;
