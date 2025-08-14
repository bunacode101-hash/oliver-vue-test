# Vue Routing Project with Authentication, Dependency Checks, and Section-Aware Preloading

## Project Overview
This is a Vue.js application (Vue 3 + Vite) focused on implementing complex routing with role-based access, authentication guards, dependency checks (e.g., onboarding and KYC status), fallbacks, and section-aware preloading for optimized performance. It uses Vue Router, Pinia for state management, a JSON-based route configuration, and utilities for lazy loading, asset preloading, and persistent warming states.

- **Goal**: Achieve full routing with auth/role/dependency logic, while enabling opportunistic preloading of code and assets for "sections" (groups of routes). Supports lazy and eager builds. Cognito integration pending.
- **Key Features**:
  - Role-based routing (e.g., creator, vendor, customer, agent) with dynamic components.
  - Dependency checks (e.g., require `onboardingPassed` or `kycPassed`, with fallbacks).
  - Auth guards for protected/public routes.
  - Simulated user data in Pinia for testing.
  - Basic HTML forms (no styling) for auth pages.
  - Section-aware preloading: Warms code (lazy imports) and assets (via AssetHandler) based on current route and graph (e.g., from auth → dashboard).
  - Persistent, versioned warm cache in LocalStorage to survive browser restarts.
  - Two build modes: lazy (code-split) and eager (pre-import one section at build-time).
  - Asset declaration in components for prioritized preloading (critical/high/normal).
- **Deployment**: Use Vercel for hosting. Local dev: `npm run dev`. Set `VITE_APP_VERSION` in `.env` for versioning.

## Setup Instructions
1. Install dependencies: `npm install`.
2. Run locally: `npm run dev`.
3. For testing, simulate users in `App.vue` via `auth.simulateRole(role, overrides)` (e.g., `{ onboardingPassed: false, kycPassed: true }`).
4. Bypass auth is enabled in `router/routeGuard.js` (force `isAuthenticated = true`); disable for real auth.
5. Data (user role, onboarding/KYC status) is stored/tested in Pinia (`useAuthStore`).
6. Builds:
   - Lazy: `npm run build:lazy`.
   - Eager (one section): `npm run build:eager:auth`, `npm run build:eager:dashboard`, etc.
   - Preview: `npm run preview`.

## Routes and How They Work
Routes are defined in `router/routeConfig.json` (or `routes.json`) and dynamically loaded. Sections: auth, dashboard, profile, discover, shop.

- **Guards**: Applied via `router.beforeEach(routeGuard)` and `beforeResolve` (for preloading).
  - **Auth Checks**: If `requiresAuth: true` and not authenticated, redirect to `redirectIfNotAuth` (e.g., `/log-in`). If logged in and `redirectIfLoggedIn` set, redirect (e.g., from public pages to `/dashboard`).
  - **Role Checks**: If `supportedRoles` specified (not "any"), must match user's role; else fallback to `/dashboard`.
  - **Dependency Checks**: For the route and parents (if `inheritConfigFromParent: true`), check user properties (from Pinia). E.g., if `required: true` and value false, redirect to `fallbackSlug`. Role-specific deps under `dependencies.roles[role]`.
- **Components**: Lazy-loaded via `utils/lazy.ts` (with `import.meta.glob` for build compatibility). Role-based for some (e.g., dashboard/overview variants).
- **Preloading Graph**:
  - On auth: Warm dashboard.
  - On dashboard: Warm profile.
  - On profile (if creator): Warm dashboard.
  - Always: Keep auth warmed on boot and every navigation.
  - Configured via route meta `preLoadSections` and role-aware hook in `sectionPrefetcher.ts`.
- **Assets**: Declared in components as `export const assets = { critical: [...], high: [...], normal: [...] };`. Preloaded via AssetHandler with section/route flags.
- **Fallbacks**: To `/404` for unknown routes or unmet deps.
- **Pinia Integration**: User state in `useAuthStore`; warm state in `useSectionCache` (persists via LocalStorage, versioned by `VITE_APP_VERSION`).
- **Inheritance**: Child routes inherit configs from parent if flagged.

### List of Routes
- **/log-in**: Public (auth section). Redirects to `/dashboard` if logged in. Preloads: dashboard.
- **/sign-up**: Public (auth). Redirects to `/dashboard` if logged in. Preloads: dashboard.
- **/sign-up/onboarding**: Protected (auth, creator role). Preloads: dashboard. Deps: Creator onboarding (fallback if incomplete).
- **/sign-up/onboarding/kyc**: Protected (auth, creator).
- **/sign-up/onboarding/kyc/status**: Protected (auth, creator).
- **/lost-password**: Public. Redirects to `/dashboard` if logged in.
- **/reset-password**: Public. Redirects to `/dashboard` if logged in.
- **/confirm-email**: Public. Redirects to `/dashboard` if logged in.
- **/dashboard**: Protected (dashboard section, any role). Redirects to `/dashboard/overview`. Preloads: profile. Deps: Role-specific (e.g., creator: onboardingPassed, kycPassed with fallbacks).
- **/dashboard/overview**: Inherits from `/dashboard`. Role-based component.
- **/profile**: Protected (profile section, any role). Preloads: [] (but role-aware: dashboard if creator).
- **/discover**: Public (discover section).
- **/shop**: Public (shop section).
- **/404**: Not Found page.
- **Catch-all (/:pathMatch(.*)*)**: Redirects to `/404`.

## Testing
Test routing and preloading manually by navigating URLs and simulating user states in `App.vue`. Key scenarios:
- Incomplete onboarding/KYC: Redirects to fallbacks.
- Wrong role: Redirects to `/dashboard`.
- Auth bypass: All protected routes accessible (toggle off to test real auth redirects).
- Preloading: Navigate auth → dashboard → profile; check Network Tab for background fetches (zero on subsequent visits). Use slow throttle to verify instant loads.
- Persistence: Refresh/close browser; warm state persists if version unchanged.
- Version bump: Change `VITE_APP_VERSION`; state resets, assets re-fetch with new query param.
- Eager builds: Compare bundle sizes and load behavior in preview.
- Edge cases: Invalid sections, role changes, no assets declared—no errors.

Study `routeConfig.json` for details. For production, integrate Cognito, add styling, and consider Service Worker for advanced caching.

## Reference
- Use attached Cognito ZIP only for reference (not in code).
- Complexity: Routes have interdependencies; debug with console logs in guards/prefetcher. AssetHandler handles preloads—address known issues (e.g., duplicates) as needed.