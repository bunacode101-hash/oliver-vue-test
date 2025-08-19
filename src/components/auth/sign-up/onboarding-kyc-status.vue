<script setup></script>

<script>
export const assets = {
  critical: ["/css/onboarding.css"],
  high: [],
  normal: ["/images/kyc-bg.jpg"],
};
</script>

<template>
  <section class="onboarding-section">
    <h2>KYC Status</h2>
    <p>Check the status of your KYC verification.</p>
    <!-- <img src="/images/kyc-status-bg.jpg" alt="KYC Status Background" style="width: 100%; height: auto;" /> -->
  </section>
</template>

<style scoped>
/* Ensure CSS is applied */
@import '../../../assets/css/onboarding.css';
</style>