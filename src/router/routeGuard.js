import { useAuthStore } from "@/stores/useAuthStore";
import { getRouteBySlug } from "./routeUtils";

export default function routeGuard(to, from, next) {
  const route = getRouteBySlug(to.path);
  const auth = useAuthStore();
  const user = auth.simulate || auth.currentUser;

  if (!route) return next("/404");

  // Temporary bypass: Comment out auth checks to set 'true' effectively
  // if (route.requiresAuth && !user) return next(route.redirectIfNotAuth || '/log-in');
  // if (route.redirectIfLoggedIn && user) return next(route.redirectIfLoggedIn);

  // Proceed with role and dependency checks (using simulate for testing)
  if (
    route.supportedRoles.length &&
    !["any", "all"].includes(route.supportedRoles[0]) &&
    !route.supportedRoles.includes(user?.role)
  ) {
    return next("/dashboard");
  }

  // Dependency checks (e.g., KYC, onboarding fallbacks)
  const parentDeps = getParentRouteDeps(to.path);
  const allDeps = [...parentDeps, route];
  for (const r of allDeps) {
    const deps = r.meta.dependencies || {};
    const roleDeps = deps.roles?.[user?.role] || {};
    for (const [key, val] of Object.entries(roleDeps)) {
      if (val.required && !user?.[key]) return next(val.fallbackSlug || "/404");
    }
    for (const [key, val] of Object.entries(deps)) {
      if (key !== "roles" && val.required && !user?.[key])
        return next(val.fallbackSlug || "/404");
    }
  }
  next();
}

function getParentRouteDeps(path) {
  const segments = path.split("/");
  const parents = [];
  while (segments.length > 1) {
    segments.pop();
    const parentPath = segments.join("/") || "/";
    const parent = getRouteBySlug(parentPath);
    if (parent?.meta.inheritConfigFromParent) parents.push(parent);
  }
  return parents.reverse();
}
