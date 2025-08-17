<script setup></script>

<script>
export const assets = {
  critical: ["/css/onboarding.css"],
  high: [],
  normal: ["/images/onboarding-bg.jpg"],
};
</script>

<template>
  <section class="onboarding-section">
    <h2>Onboarding</h2>
    <p>Complete your onboarding process.</p>
    <img
      src="/images/onboarding-bg.jpg"
      alt="Onboarding Background"
      style="width: 100%; height: auto"
    />
  </section>
</template>

<style scoped>
/* Ensure CSS is applied */
@import "../../assets/css/onboarding.css";
</style>
