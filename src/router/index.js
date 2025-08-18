import { createRouter, createWebHistory } from "vue-router";
import routesJson from "@/router/routeConfig.json";
import { lazy } from "@/utils/lazy";
import { installSectionActivationGuard } from "./guards/sectionActivationGuard";
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
      console.log(
        `[ROUTE] Resolving component for "${r.slug}" with role "${role}": ${
          compPath || "NotFound"
        }`
      );
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

router.beforeEach(routeGuard);
installSectionActivationGuard(router);

router.isReady().then(() => {
  const auth = useAuthStore();
  auth.refreshFromStorage();
});

export default router;
