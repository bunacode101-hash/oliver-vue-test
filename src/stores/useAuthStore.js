import { defineStore } from "pinia";
import { authHandler } from "@/services/authHandler";

export const useAuthStore = defineStore("auth", {
  state: () => ({
    idToken: null,
    currentUser: null,
    simulate: null,
    _refreshInterval: null,
  }),

  actions: {
    setFromSession(session) {
      const tokens = session.tokens;
      this.idToken = tokens.idToken.toString();
      const decoded = tokens.idToken.payload;
      this.currentUser = {
        email: decoded.email,
        role: decoded["custom:role"],
        kycPassed: decoded["custom:kycPassed"] === "true",
        onboardingPassed: decoded["custom:onboardingPassed"] === "true",
        awsDataCheck: decoded["custom:awsDataCheck"] === "true",
        raw: decoded,
      };
    },

    simulateRole(role, overrides = {}) {
      this.simulate = { role, ...overrides };
    },

    updateUserAttributesLocally(updates) {
      this.currentUser = { ...this.currentUser, ...updates };
    },

    logout() {
      authHandler.logout();
      localStorage.clear();
      this.$reset();
    },

    startTokenRefreshLoop() {
      clearInterval(this._refreshInterval);
      this._refreshInterval = setInterval(async () => {
        const exp = this.currentUser?.raw?.exp;
        if (!exp) return;
        const expiresIn = exp * 1000 - Date.now();
        if (expiresIn < 5 * 60 * 1000) {
          try {
            const session = await authHandler.restoreSession();
            this.setFromSession(session);
          } catch (err) {
            this.logout();
          }
        }
      }, 60 * 1000);
    },
  },

  persist: true,
});
