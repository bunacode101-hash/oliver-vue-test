import { describe, it, expect, beforeEach, vi } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import { createRouter, createWebHistory } from "vue-router";
import { useAuthStore } from "@/stores/useAuthStore";
import routeConfig from "@/router/routeConfig.json";
import routeGuard from "@/router/routeGuard";
import { componentMap } from "@/router/componentMap";

function makeRouter() {
  const routes = routeConfig.map((route) => {
    const r = { path: route.slug, meta: route };
    if (route.redirect) {
      r.redirect = route.redirect;
    } else {
      r.component = componentMap[route.slug] || componentMap["/404"];
    }
    return r;
  });

  const router = createRouter({
    history: createWebHistory(),
    routes,
  });
  router.beforeEach(routeGuard);
  return router;
}

describe("Route Guard", () => {
  let auth;

  beforeEach(() => {
    setActivePinia(createPinia());
    auth = useAuthStore();
  });

  it("redirects creator without onboarding to onboarding step", async () => {
    auth.simulateRole("creator", { onboardingPassed: false, kycPassed: true });

    const router = makeRouter();
    const next = vi.fn();

    await routeGuard({ path: "/dashboard", meta: {} }, {}, next);
    expect(next).toHaveBeenCalledWith("/sign-up/onboarding");
  });

  it("redirects creator without KYC to KYC step", async () => {
    auth.simulateRole("creator", { onboardingPassed: true, kycPassed: false });

    const router = makeRouter();
    const next = vi.fn();

    await routeGuard({ path: "/dashboard", meta: {} }, {}, next);
    expect(next).toHaveBeenCalledWith("/sign-up/onboarding/kyc");
  });

  it("lets vendor with all requirements access dashboard", async () => {
    auth.simulateRole("vendor", { onboardingPassed: true, kycPassed: true });

    const router = makeRouter();
    const next = vi.fn();

    await routeGuard({ path: "/dashboard", meta: {} }, {}, next);
    expect(next).toHaveBeenCalledWith();
  });

  it("redirects unknown routes to /404", async () => {
    auth.simulateRole("vendor", { onboardingPassed: true, kycPassed: true });

    const next = vi.fn();
    await routeGuard({ path: "/non-existent" }, {}, next);
    expect(next).toHaveBeenCalledWith("/404");
  });
});
