<script setup></script>

<script>
export const assets = {
  critical: ["/css/dashboard.css"],
  high: ["/js/vendor-charts.js"],
  normal: ["/images/above-the-fold-hero.jpg"],
};
</script>

<template>
  <section class="dashboard-overview-creator">
    <h2>Creator Dashboard Edit Settings</h2>
    <p>Creator-specific dashboard content.</p>
    <!-- <img
      src="/images/above-the-fold-hero.jpg"
      alt="Hero Image"
      style="width: 100%; height: auto"
    /> -->
  </section>
</template>

<style scoped>
/* Ensure CSS is applied */
@import "../../assets/css/dashboard.css";
</style>
