import { createApp } from "vue";
import { createPinia } from "pinia";
import piniaPluginPersistedstate from "pinia-plugin-persistedstate";
import { Amplify } from "aws-amplify";
import App from "./App.vue";
import router from "./router";
import { useAuthStore } from "./stores/useAuthStore";
import { useSectionsStore } from "./stores/sectionStore";
import { authHandler } from "./services/authHandler";

// Configure Amplify with region
Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId: import.meta.env.VITE_COGNITO_USER_POOL_ID,
      userPoolClientId: import.meta.env.VITE_COGNITO_CLIENT_ID,
    },
  },
});

(async () => {
  const app = createApp(App);
  const pinia = createPinia();
  pinia.use(piniaPluginPersistedstate);
  app.use(pinia);

  const authStore = useAuthStore();
  const sectionsStore = useSectionsStore();

  // Restore session
  try {
    const session = await authHandler.restoreSession();
    authStore.setFromSession(session);
  } catch (err) {
    console.error("Session restore failed:", err);
    authStore.logout();
  }

  // Existing logic
  sectionsStore.hydrate();

  // Start token refresh loop
  authStore.startTokenRefreshLoop();

  app.use(router);
  app.mount("#app");
})();
