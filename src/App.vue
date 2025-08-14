<script setup>
import { useAuthStore } from "@/stores/useAuthStore";
const auth = useAuthStore();

// Simulate a Creator user for testing fallbacks
auth.simulateRole("creator", { onboardingPassed: false, kycPassed: true });
</script>

<template>
  <router-view />
</template>

<style scoped></style>
