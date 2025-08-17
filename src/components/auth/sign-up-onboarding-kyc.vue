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
    <h2>KYC Verification</h2>
    <p>Submit your KYC details.</p>
    <img src="/images/kyc-bg.jpg" alt="KYC Background" style="width: 100%; height: auto;" />
  </section>
</template>

<style scoped>
/* Ensure CSS is applied */
@import '../../assets/css/onboarding.css';
</style>