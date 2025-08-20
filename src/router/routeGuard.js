import { useAuthStore } from "@/stores/useAuthStore";
import routesJson from "@/router/routeConfig.json";

function getRouteBySlug(path) {
  return routesJson.find(
    (route) =>
      route.slug === path ||
      (route.dynamicRoute &&
        route.slug.includes("/:") &&
        path.match(new RegExp(route.slug.replace(/:[^/]+/g, "[^/]+"))))
  );
}

function getParentRouteDeps(path) {
  const segments = path.split("/");
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
  const route = getRouteBySlug(to.path);
  const auth = useAuthStore();
  const user = auth.simulate || auth.currentUser;

  // Check if token expired
  const now = Math.floor(Date.now() / 1000);
  if (user?.raw?.exp && now >= user.raw.exp) {
    auth.logout();
    return next("/log-in");
  }

  if (!route) return next("/404");
  if (route.redirectIfLoggedIn && user) return next(route.redirectIfLoggedIn);
  if (route.requiresAuth && !user)
    return next(route.redirectIfNotAuth || "/log-in");

  if (
    route.supportedRoles?.length &&
    !["any", "all"].includes(route.supportedRoles[0]) &&
    !route.supportedRoles.includes(user?.role)
  ) {
    return next("/dashboard");
  }

  const parentDeps = getParentRouteDeps(to.path);
  const allDeps = [...parentDeps, route];

  for (const r of allDeps) {
    const deps = r.dependencies || {};
    const roleDeps = deps.roles?.[user?.role] || {};

    for (const [key, val] of Object.entries(roleDeps)) {
      if (val?.required && !user?.[key])
        return next(val.fallbackSlug || "/404");
    }

    for (const [key, val] of Object.entries(deps)) {
      if (key !== "roles" && val?.required && !user?.[key]) {
        return next(val.fallbackSlug || "/404");
      }
    }
  }

  next();
}
