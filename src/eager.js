// src/eager.js
// Only called when MODE === "eager". Pre-imports ONE section from env.
const eager = import.meta.env?.VITE_EAGER_SECTION;
if (eager) {
  const imp = [];
  // pre-import the section's primary views based on your explicit component paths
  switch (eager) {
    case "auth":
      imp.push(import("@/components/auth/log-in.vue"));
      imp.push(import("@/components/auth/sign-up.vue"));
      break;
    case "dashboard":
      imp.push(import("@/components/dashboard/index.vue"));
      break;
    case "profile":
      imp.push(import("@/components/profile/index.vue"));
      break;
    case "discover":
      imp.push(import("@/components/discover/index.vue"));
      break;
    case "shop":
      imp.push(import("@/components/shop/index.vue"));
      break;
  }
  Promise.allSettled(imp).then(() => {/* warmed */});
}