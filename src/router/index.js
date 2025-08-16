import { createRouter, createWebHistory } from "vue-router";
import routesJson from "@/router/routeConfig.json";
import { lazy } from "@/utils/lazy";
import { installSectionActivationGuard } from "./guards/sectionActivation";
import { useSectionsStore } from "@/stores/sections";
import routeGuard from "./routeGuard";
import { useAuthStore } from "@/stores/useAuthStore";

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
      return compPath ? lazy(compPath)() : import("@/components/NotFound.vue");
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

router.beforeEach((to, from, next) => {
  const startTime = performance.now();

  console.log(`[ROUTE] Incoming navigation request: "${to.path}"`);
  console.log(`[CHECK] Looking for matching route configuration...`);

  const matchedRoute = routeRecords.find((r) => r.path === to.path);
  if (!matchedRoute) {
    console.log(`[404] No route found for "${to.path}".`);
    console.log(`[STOP] Navigation aborted. Redirecting to /404.`);

    return next("/404");
  }

  console.log(`[FOUND] Route configuration located.`);
  console.log(`[CONFIG] Route metadata: ${JSON.stringify(matchedRoute.meta)}`);

  const section = matchedRoute.meta?.section;
  if (section) {
    console.log(`[SECTION] This route belongs to section "${section}".`);
  } else {
    console.log(`[SECTION] This route does not specify a section.`);
  }

  // log completion after navigation is ready
  next();

  router.afterEach(() => {
    const duration = ((performance.now() - startTime) / 1000).toFixed(2);
    console.log(
      `[DONE] Navigation to "${to.path}" finished successfully in ${duration} seconds.`
    );
  });
});

router.beforeEach(routeGuard);
installSectionActivationGuard(router);

router.isReady().then(() => {
  const store = useSectionsStore();
  const auth = useAuthStore();
  auth.refreshFromStorage();
  console.log(`[READY] Router is ready. Section cache initialized.`);
});

export default router;
