<template>
  <div>
    <h1>Creator Dashboard</h1>
    <p>Welcome, {{ authStore.currentUser?.email }}!</p>
    <button @click="logout">Logout</button>

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
  </div>
</template>

<script setup>
import { useAuthStore } from "@/stores/useAuthStore";
import { useRouter } from "vue-router";

const authStore = useAuthStore();
const router = useRouter();

function logout() {
  authStore.logout();
  router.push("/log-in");
}
</script>
<script>
export const assets = {
  critical: ["/css/dashboard.css"],
  high: ["/js/vendor-charts.js"],
  normal: ["/images/image2.jpg"],
};
</script>

<style scoped>
/* Ensure CSS is applied */
@import "../../assets/css/dashboard.css";

nav {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
}
button:hover {
  background-color: #0056b3;
}
</style>
