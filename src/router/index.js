import { createRouter, createWebHistory } from "vue-router";
import routeConfig from "./routeConfig.json";
import routeGuard from "./routeGuard";
import { useAuthStore } from "@/stores/useAuthStore";
import { componentMap } from "./componentMap";

const routes = routeConfig.map((route) => {
  const r = {
    path: route.slug,
    meta: route,
  };

  // Handle redirects (added for /dashboard, catch-all, etc.)
  if (route.redirect) {
    r.redirect = route.redirect;
  } else {
    r.component = () => {
      const auth = useAuthStore();
      const role = auth.simulate?.role || auth.currentUser?.role;

      // Handle customComponentPath for dashboard overview roles
      if (route.customComponentPath?.[role]) {
        const slug = `/dashboard/overview/${role}`;
        return componentMap[slug] || componentMap["/404"];
      }

      return componentMap[route.slug] || componentMap["/404"];
    };
  }

  return r;
});

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

router.beforeEach(routeGuard);
export default router;
