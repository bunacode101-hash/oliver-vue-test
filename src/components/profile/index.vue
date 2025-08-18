<script>
import heavy from "@/assets/heavy.jpg";

export default {
  setup() {
    const assets = {
      critical: ["/css/profile.css"],
      high: [],
      normal: [heavy],
    };

    return { heavy, assets };
  },
};
</script>

<template>
  <div>
    <h1>Profile Page</h1>
    <img :src="heavy" alt="Heavy Image" />
  </div>
</template>

<style scoped></style>
