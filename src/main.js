import { createApp } from "vue";
import { createPinia } from "pinia";
import piniaPluginPersistedstate from "pinia-plugin-persistedstate";
import App from "./App.vue";
import router from "./router";
import { useAuthStore } from "@/stores/useAuthStore";
import { authHandler } from "@/services/authHandler";
import { useSectionsStore } from "./stores/sectionStore";

const app = createApp(App);

const pinia = createPinia();
pinia.use(piniaPluginPersistedstate);
app.use(pinia);

const auth = useAuthStore();
const sectionsStore = useSectionsStore();
auth.refreshFromStorage();
sectionsStore.hydrate();

// Wait for router to be ready before restoring session
router.isReady().then(() => {
  const publicRoutes = [
    "/log-in",
    "/sign-up",
    "/lost-password",
    "/reset-password",
    "/confirm-email",
    "/",
  ];
  if (!publicRoutes.includes(router.currentRoute.value.path)) {
    authHandler
      .restoreSession()
      .then(({ idToken, accessToken, refreshToken }) => {
        console.log("[MAIN] Session restored, setting token");
        localStorage.setItem("idToken", idToken);
        localStorage.setItem("accessToken", accessToken);
        localStorage.setItem("refreshToken", refreshToken);
        auth.setTokenAndDecode(idToken);
        auth.startTokenRefreshLoop();
      })
      .catch((err) => {
        console.log("[MAIN] Session restoration failed:", err.message || err);
        auth.logout();
        if (!publicRoutes.includes(router.currentRoute.value.path)) {
          router.push("/log-in");
        }
      });
  } else {
    console.log(
      "[MAIN] Skipping session restoration on public route:",
      router.currentRoute.value.path
    );
  }
});

app.use(router).mount("#app");
