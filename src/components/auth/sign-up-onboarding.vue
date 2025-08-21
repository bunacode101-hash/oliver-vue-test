<template>
  <div>
    <h1>Onboarding</h1>
    <p>Complete your onboarding here (placeholder form).</p>
    <button @click="completeOnboarding">Complete Onboarding</button>
    <p v-if="error">{{ error }}</p>
  </div>
</template>

<script setup>
import { ref } from "vue"; // Added: Import ref
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/useAuthStore";

const router = useRouter();
const auth = useAuthStore();
const error = ref("");

function completeOnboarding() {
  try {
    auth.updateUserAttributesLocally({ onboardingPassed: true });
    if (auth.currentUser.role === "creator") {
      router.push("/sign-up/onboarding/kyc");
    } else {
      router.push("/dashboard");
    }
  } catch (err) {
    error.value = "Failed to complete onboarding";
  }
}
</script>
<script>
export const assets = {
  critical: ["/css/onboarding.css"],
  high: [],
  normal: ["/images/kyc-status-bg.jpg"],
};
</script>
