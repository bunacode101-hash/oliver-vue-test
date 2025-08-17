<script setup></script>

<script>
export const assets = {
  critical: ["/css/dashboard.css"],
  high: ["/js/vendor-charts.js"],
  normal: ["/img/above-the-fold-hero.jpg"],
};
</script>

<template>
  <main>
    <h1>Dashboard (index)</h1>
    <p>Welcome to Dashboard. From here, navigate to overview.</p>
  </main>
</template>

<style scoped>
/* Ensure CSS is applied */
@import "../../assets/css/dashboard.css";
</style>
