<script setup></script>

<script>
export const assets = {
  critical: ["/css/dashboard.css", "/css/onboarding.css"],
  high: ["/js/vendor-charts.js"],
  normal: ["/images/image2.jpg"],
};
</script>

<template>
  <section class="dashboard-overview-creator">
    <h2>Creator Dashboard Overview</h2>
    <p>Creator-specific dashboard content.</p>
    <img
      src="/images/image2.jpg"
      alt="Dashboard Image"
      style="width: 100%; height: auto"
    />
    <nav style="margin-top: 1rem; display: flex; gap: 1rem">
      <router-link to="/dashboard/edit-profile">
        <button
          style="
            padding: 0.5rem 1rem;
            background-color: #007bff;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
          "
        >
          Edit Profile
        </button>
      </router-link>
      <router-link to="/dashboard/edit-settings">
        <button
          style="
            padding: 0.5rem 1rem;
            background-color: #007bff;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
          "
        >
          Edit Settings
        </button>
      </router-link>
      <router-link to="/dashboard/my-media">
        <button
          style="
            padding: 0.5rem 1rem;
            background-color: #007bff;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
          "
        >
          My Media
        </button>
      </router-link>
    </nav>
  </section>
</template>

<style scoped>
/* Ensure CSS is applied */
@import "../../assets/css/dashboard.css";
@import "../../assets/css/onboarding.css";

nav {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
}
button:hover {
  background-color: #0056b3;
}
</style>
