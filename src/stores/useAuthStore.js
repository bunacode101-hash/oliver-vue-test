import { defineStore } from "pinia";
import { jwtDecode } from "jwt-decode";

export const useAuthStore = defineStore("auth", {
  state: () => ({
    idToken: null,
    currentUser: null,
    simulate: null,
  }),
  actions: {
    setTokenAndDecode(idToken) {
      this.idToken = idToken;
      const decoded = jwtDecode(idToken);
      this.currentUser = {
        email: decoded.email,
        role: decoded["custom:role"],
        kycPassed: decoded["custom:kycPassed"] === "true",
        onboardingPassed: decoded["custom:onboardingPassed"] === "true",
        awsDataCheck: decoded["custom:awsDataCheck"] === "true",
        raw: decoded,
      };
    },
    refreshFromStorage() {
      const token = localStorage.getItem("idToken");
      if (token) this.setTokenAndDecode(token);
    },
    simulateRole(role, overrides = {}) {
      this.simulate = { role, ...overrides };
    },
    updateUserAttributesLocally(updates) {
      this.currentUser = { ...this.currentUser, ...updates };
    },
    logout() {
      localStorage.clear();
      this.$reset();
    },
  },
  persist: true,
});
