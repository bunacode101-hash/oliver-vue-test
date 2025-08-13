# Vue Routing Project with Authentication and Dependency Checks

## Project Overview
This is a Vue.js application focused on implementing complex routing with role-based access, authentication guards, dependency checks (e.g., onboarding and KYC status), and fallbacks. It uses Vue Router, Pinia for state management, and a JSON-based route configuration.

- **Goal**: Achieve full routing as per the provided configuration, bypassing authentication temporarily (via forced `true` in guards). Cognito integration will be added later.
- **Key Features**:
  - Role-based routing (e.g., creator, vendor, customer, agent).
  - Dependency checks (e.g., require `onboardingPassed` or `kycPassed` for dashboard access, with fallbacks).
  - Auth guards for protected/public routes.
  - Simulated user data in Pinia for testing.
  - Basic HTML forms (no styling) for auth pages.
- **Deployment**: Use Vercel for hosting. Local dev: `npm run dev`.

## Setup Instructions
1. Install dependencies: `npm install`.
2. Run locally: `npm run dev`.
3. For testing, simulate users in `App.vue` via `auth.simulateRole(role, overrides)` (e.g., `{ onboardingPassed: false }`).
4. Bypass auth is enabled in `router/routeGuard.js` (force `isAuthenticated = true`); disable for real auth.
5. Data (user role, onboarding/KYC status) is stored/tested in Pinia (`useAuthStore`).

## Routes and How They Work
Routes are defined in `router/routeConfig.json` and dynamically loaded. Routing logic:
- **Guards**: Applied via `router.beforeEach(routeGuard)`.
  - **Auth Checks**: If `requiresAuth: true` and not authenticated, redirect to `redirectIfNotAuth` (e.g., `/log-in`). If logged in and `redirectIfLoggedIn` set, redirect (e.g., from public pages to `/dashboard`).
  - **Role Checks**: If `supportedRoles` specified (not "any"), must match user's role; else fallback to `/dashboard`.
  - **Dependency Checks**: For the route and parents (if `inheritConfigFromParent: true`), check user properties (from Pinia). E.g., if `required: true` and value false, redirect to `fallbackSlug`. Role-specific deps under `dependencies.roles[role]`.
- **Components**: Mapped in `router/componentMap.js`. Role-based for dashboards (e.g., `DashboardOverviewCreator.vue` for creator).
- **Fallbacks**: To `/404` for unknown routes or unmet deps.
- **Pinia Integration**: User state (role, `onboardingPassed`, `kycPassed`, etc.) from `useAuthStore`. Simulated for testing; persists via plugin.
- **Inheritance**: Child routes (e.g., `/dashboard/overview`) inherit configs from parent if flagged.

### List of Routes
- **/log-in**: Public login page. Redirects to `/dashboard` if logged in.
- **/sign-up**: Public sign-up page. Redirects to `/dashboard` if logged in.
- **/sign-up/onboarding**: Protected (requires auth, creator role). No KYC required.
- **/sign-up/onboarding/kyc**: Protected (requires auth, creator role). No KYC required (fallback to dashboard if issues).
- **/sign-up/onboarding/kyc/status**: Protected (requires auth, creator role). No KYC required.
- **/lost-password**: Public. Redirects to `/dashboard` if logged in.
- **/reset-password**: Public. Redirects to `/dashboard` if logged in.
- **/confirm-email**: Public. Redirects to `/dashboard` if logged in.
- **/dashboard**: Protected (requires auth, any role). Redirects to `/dashboard/overview`. Dependencies:
  - Creator: Requires `onboardingPassed` (fallback: `/sign-up/onboarding`), `kycPassed` (fallback: `/sign-up/onboarding/kyc`).
  - Vendor/Agent: Requires `onboardingPassed` (fallback: `/sign-up/onboarding`).
- **/dashboard/overview**: Inherits from `/dashboard`. Role-based component (e.g., Creator dashboard). Same dependencies as parent.
- **/404**: Not Found page.
- **Catch-all (/:pathMatch(.*)*)**: Redirects to `/404`.

## Testing
Test routing manually by navigating URLs and simulating user states in `App.vue`. Key scenarios:
- Incomplete onboarding/KYC: Redirects to fallbacks.
- Wrong role: Redirects to `/dashboard`.
- Auth bypass: All protected routes accessible (toggle off to test real auth redirects).
- Persistence: Refresh page; Pinia state should retain simulates.

Study `routeConfig.json` for dependencies before changes. For production, integrate Cognito and add styling to forms.

## Reference
- Use attached Cognito ZIP only for reference (not in code).
- Complexity: Routes have interdependencies; debug with console logs in guard.