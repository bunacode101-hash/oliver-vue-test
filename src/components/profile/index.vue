<script>
import heavy from "@/assets/heavy.jpg";

export default {
  setup() {
    const assets = {
      critical: ["/css/profile.css"],
      high: [],
      normal: [heavy],
    };

    return { heavy, assets }; // ✅ expose to template
  },
  };
</script>

<template>
  <div>
    <h1>Profile Page</h1>
    <img :src="heavy" alt="Heavy Image" />
  </div>
</template>

<style scoped>
/* Add some CSS to increase bundle size */
.large-style {
  content: url("@/assets/heavy.jpg"); /* Reference asset */
}
</style>
