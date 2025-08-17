import { useAuthStore } from "@/stores/useAuthStore";

export default async function routeGuard(to, from, next) {
  const auth = useAuthStore();
  const role = auth.simulate?.role || auth.currentUser?.role || "default";
  console.log(`[GUARD] Checking route "${to.path}" for role "${role}"`);

  // Handle requiresAuth
  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    console.log(`[GUARD] Route "${to.path}" requires authentication. Redirecting to "${to.meta.redirectIfNotAuth || '/log-in'}".`);
    return next(to.meta.redirectIfNotAuth || "/log-in");
  }

  // Handle redirectIfLoggedIn
  if (to.meta.redirectIfLoggedIn && auth.isAuthenticated) {
    console.log(`[GUARD] User is authenticated. Redirecting from "${to.path}" to "${to.meta.redirectIfLoggedIn}".`);
    return next(to.meta.redirectIfLoggedIn);
  }

  // Handle supportedRoles
  if (to.meta.supportedRoles && to.meta.supportedRoles.length > 0) {
    if (!to.meta.supportedRoles.includes("any") && !to.meta.supportedRoles.includes(role)) {
      console.log(`[GUARD] Role "${role}" not supported for "${to.path}". Redirecting to /404.`);
      return next("/404");
    }
  }

  // Handle role-specific dependencies
  if (to.meta.dependencies?.roles?.[role]) {
    const deps = to.meta.dependencies.roles[role];
    for (const [key, { required, fallbackSlug }] of Object.entries(deps)) {
      if (required && !auth.simulate?.[key] && !auth.currentUser?.[key]) {
        console.log(`[GUARD] Dependency "${key}" not met for role "${role}" on "${to.path}". Redirecting to "${fallbackSlug}".`);
        return next(fallbackSlug);
      }
    }
  }

  console.log(`[GUARD] Route "${to.path}" access granted for role "${role}".`);
  next();
}