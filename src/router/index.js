import { createRouter, createWebHistory } from "vue-router";
import routesJson from "@/router/routeConfig.json";
import { lazy } from "@/utils/lazy";
import { installSectionActivationGuard } from "./guards/sectionActivationGuard";
import routeGuard from "./routeGuard";
import { useAuthStore } from "@/stores/useAuthStore";

// Cache resolved components to avoid repeated imports
const componentCache = new Map();

function toRouteRecord(r) {
  const rec = {
    path: r.slug,
    meta: r,
  };
  if (r.redirect) {
    rec.redirect = r.redirect;
  } else if (r.customComponentPath) {
    rec.component = async () => {
      const auth = useAuthStore();
      const role = auth.simulate?.role || auth.currentUser?.role || "default";
      const compPath = r.customComponentPath[role]?.componentPath;
      const cacheKey = `${r.slug}:${role}`;
      if (componentCache.has(cacheKey)) {
        return componentCache.get(cacheKey);
      }
      if (!r._cachedCompPath) {
        // console.log(
        //   `[ROUTE] Resolving component for "${r.slug}" with role "${role}": ${
        //     compPath || "NotFound"
        //   }`
        // );
        r._cachedCompPath = compPath || "@/components/NotFound.vue";
      }
      const component = compPath
        ? await lazy(compPath)()
        : await import("@/components/NotFound.vue");
      componentCache.set(cacheKey, component);
      return component;
    };
  } else {
    rec.component = async () => {
      const cacheKey = r.slug;
      if (componentCache.has(cacheKey)) {
        return componentCache.get(cacheKey);
      }
      const component = r.componentPath
        ? await lazy(r.componentPath)()
        : await import("@/components/NotFound.vue");
      componentCache.set(cacheKey, component);
      return component;
    };
  }
  return rec;
}

const routeRecords = routesJson.map(toRouteRecord);
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: routeRecords,
});

let navigationStartTime;
let isNavigating = false;

router.beforeEach((to, from, next) => {
  navigationStartTime = performance.now();
  console.log(`[ROUTE] Incoming navigation request: "${to.path}"`);
  console.log(`[CHECK] Looking for matching route configuration...`);
  const matchedRoute = routeRecords.find((r) => r.path === to.path);
  if (!matchedRoute) {
    console.log(`[404] No route found for "${to.path}". Redirecting to /404.`);
    return next("/404");
  }
  console.log(`[FOUND] Route configuration located for "${to.path}".`);
  console.log(`[CONFIG] Route metadata: ${JSON.stringify(matchedRoute.meta)}`);
  const section = matchedRoute.meta?.section;
  if (section) {
    console.log(
      `[SECTION] Route "${to.path}" belongs to section "${section}".`
    );
  } else {
    console.log(`[SECTION] Route "${to.path}" does not specify a section.`);
  }
  isNavigating = true;
  next();
});

router.afterEach((to) => {
  if (!isNavigating) return;
  const duration = (performance.now() - navigationStartTime).toFixed(2);
  console.log(`[DONE] Navigation to "${to.path}" finished in ${duration}ms.`);
  isNavigating = false;
});

router.beforeEach(routeGuard);
installSectionActivationGuard(router);

export default router;