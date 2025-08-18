<script setup></script>

<script>
export const assets = {
  critical: ["/css/auth.css"],
  high: [],
  normal: ["/images/auth-bg.jpg"],
};
</script>

<template>
  <section class="auth-section">
    <h2>Lost Password</h2>
    <p>Recover your password.</p>
    <!-- <img
      src="/images/auth-bg.jpg"
      alt="Auth Background"
      style="width: 100%; height: auto"
    /> -->
  </section>
</template>

<style scoped>
/* Ensure CSS is applied */
@import "/css/auth.css";
</style>
