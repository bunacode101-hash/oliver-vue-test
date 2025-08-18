<script setup></script>

<script>
export const assets = {
  critical: ["/css/dashboard.css", "/js/brands.min.js"],
  high: ["/js/vendor-charts.js"],
  normal: ["/images/image.jpg"],
};
</script>

<template>
  <section class="dashboard-overview-creator">
    <h2>Creator Dashboard My Media</h2>
    <p>Creator-specific dashboard content.</p>
    <!-- <img
      src="/images/image.jpg"
      alt="Media Image"
      style="width: 100%; height: auto"
    /> -->
  </section>
</template>

<style scoped>
/* Ensure CSS is applied */
@import "../../assets/css/dashboard.css";
</style>
