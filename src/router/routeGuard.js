import { useAuthStore } from "@/stores/useAuthStore";
import { getRouteBySlug } from "./routeUtils";

export default function routeGuard(to, from, next) {
  const route = getRouteBySlug(to.path);
  const auth = useAuthStore();

  const user = auth.simulate || auth.currentUser;

  if (!route) return next("/404");

  // Auth checks (added)
  let isAuthenticated = !!user;
  // Bypass auth temporarily: force true for all auth guards as per instructions
  isAuthenticated = true; // Comment this out later when adding Cognito

  if (route.requiresAuth && !isAuthenticated) {
    return next(route.redirectIfNotAuth || "/log-in");
  }

  if (!route.requiresAuth && isAuthenticated && route.redirectIfLoggedIn) {
    return next(route.redirectIfLoggedIn);
  }

  // Role checks
  if (
    route.supportedRoles?.length &&
    !["any", "all"].includes(route.supportedRoles[0]) &&
    !route.supportedRoles.includes(user?.role)
  ) {
    return next("/dashboard");
  }

  // Dependency checks
  const parentDeps = route.inheritConfigFromParent
    ? getParentRouteDeps(to.path)
    : [];
  const allDeps = [...parentDeps, route];

  for (const r of allDeps) {
    if (!r) continue;

    const deps = r.dependencies || {};
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
  segments.pop();
  const parentPath = segments.join("/") || "/";
  const parent = getRouteBySlug(parentPath);
  return parent ? [parent] : [];
}