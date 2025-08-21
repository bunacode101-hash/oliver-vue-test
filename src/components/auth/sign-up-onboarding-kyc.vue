<template>
  <div>
    <h1>KYC</h1>
    <p>Complete your KYC here (placeholder form).</p>
    <button @click="completeKyc">Complete KYC</button>
    <p v-if="error">{{ error }}</p>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/useAuthStore";
import { authHandler } from "@/services/authHandler";

const router = useRouter();
const auth = useAuthStore();
const error = ref("");

async function completeKyc() {
  try {
    await authHandler.updateProfileAttributes({ "custom:kyc": "true" });
    const { idToken } = await authHandler.restoreSession();
    auth.setTokenAndDecode(idToken);
    router.push("/dashboard");
  } catch (err) {
    error.value = "Failed to complete KYC: " + (err.message || "Unknown error");
  }
}
</script>
<script>
export const assets = {
  critical: ["/css/onboarding.css"],
  high: [],
  normal: ["/images/kyc-bg.jpg"],
};
</script>
