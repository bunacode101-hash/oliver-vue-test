import { createRouter, createWebHistory } from "vue-router";
import routesJson from "@/router/routeConfig.json";
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
        ? lazy(compPath)()  // Call () here to return the Promise (keeps existing behavior; loader executes on route visit)
        : import("@/components/NotFound.vue");  // This is a Promise; if you want lazy, wrap in () => import(...)
    };
  } else {
    rec.component = r.componentPath
      ? lazy(r.componentPath)  // No ()! Assigns the loader function
      : () => import("@/components/NotFound.vue");  // Wrapped for lazy loading
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
  void SectionPrefetcher.ensureSectionWarm("auth", () => router.getRoutes());
});

router.beforeResolve(async (to, _from) => {
  const section = to.meta?.section || null;

  if (section) {
    void SectionPrefetcher.ensureSectionWarm(section, () => router.getRoutes());
  } else {
    void SectionPrefetcher.ensureSectionWarm("auth", () => router.getRoutes());
  }

  const auth = useAuthStore();
  const userRole = (auth.simulate?.role || auth.currentUser?.role) ?? null;

  for (const s of SectionPrefetcher.dynamicPreloadsForRoute(to, userRole)) {
    void SectionPrefetcher.ensureSectionWarm(s, () => router.getRoutes());
  }

  return true;
});

export default router;
