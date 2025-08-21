import { useAuthStore } from "@/stores/useAuthStore";
import routesJson from "@/router/routeConfig.json";

// Normalize path (remove trailing slash, strip query/hash)
function normalize(path) {
  return path.replace(/\/+$/, "").split("?")[0].split("#")[0] || "/";
}

function getRouteBySlug(path) {
  const cleanPath = normalize(path);
  return routesJson.find(
    (route) =>
      normalize(route.slug) === cleanPath ||
      (route.dynamicRoute &&
        route.slug.includes("/:") &&
        cleanPath.match(new RegExp(route.slug.replace(/:[^/]+/g, "[^/]+"))))
  );
}

function getParentRouteDeps(path) {
  const segments = normalize(path).split("/");
  const parents = [];
  while (segments.length > 1) {
    segments.pop();
    const parentPath = segments.join("/") || "/";
    const parent = getRouteBySlug(parentPath);
    if (parent?.inheritConfigFromParent) parents.push(parent);
  }
  return parents.reverse();
}

export default function routeGuard(to, from, next) {
  const auth = useAuthStore();
  const user = auth.simulate || auth.currentUser;

  const route = getRouteBySlug(to.path);

  // --- 1. Token expiration check ---
  const now = Math.floor(Date.now() / 1000);
  if (user?.raw?.exp && now >= user.raw.exp) {
    auth.logout();
    return next("/log-in");
  }

  // --- 2. Auth checks before 404 ---
  if (route?.requiresAuth && !user) {
    return next(route.redirectIfNotAuth || "/log-in");
  }
  if (route?.redirectIfLoggedIn && user) {
    return next(route.redirectIfLoggedIn);
  }

  // --- 3. Route existence check ---
  if (!route) return next("/404");

  // --- 4. Role-based restrictions ---
  if (
    route.supportedRoles?.length &&
    !["any", "all"].includes(route.supportedRoles[0]) &&
    !route.supportedRoles.includes(user?.role)
  ) {
    return next("/dashboard");
  }

  // --- 5. Dependencies (from parents + self) ---
  const parentDeps = getParentRouteDeps(to.path);
  const allDeps = [...parentDeps, route];

  for (const r of allDeps) {
    const deps = r.dependencies || {};
    const roleDeps = deps.roles?.[user?.role] || {};

    for (const [key, val] of Object.entries(roleDeps)) {
      if (val?.required && !user?.[key]) {
        return next(val.fallbackSlug || "/404");
      }
    }

    for (const [key, val] of Object.entries(deps)) {
      if (key !== "roles" && val?.required && !user?.[key]) {
        return next(val.fallbackSlug || "/404");
      }
    }
  }

  // --- 6. Allow navigation ---
  next();
}
