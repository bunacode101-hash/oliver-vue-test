<script setup>
import { useAuthStore } from "@/stores/useAuthStore";
const auth = useAuthStore();

// Simulate a Creator user for testing fallbacks
// auth.simulateRole("creator", { onboardingPassed: true, kycPassed: true});
</script>

<template>
  <!-- Navigation Bar with Buttons -->
  <nav
    style="padding: 1rem; background-color: #f0f0f0; display: flex; gap: 1rem"
  >
    <router-link to="/sign-up">
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
        Sign Up
      </button>
    </router-link>
    <router-link to="/log-in">
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
        Log In
      </button>
    </router-link>
    <router-link to="/dashboard">
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
        Dashboard
      </button>
    </router-link>
    <!-- <router-link to="/profile">
      <button style="padding: 0.5rem 1rem; background-color: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer;">
        Profile
      </button>
    </router-link> -->
    <router-link to="/discover">
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
        Discover
      </button>
    </router-link>
    <router-link to="/shop">
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
        Shop
      </button>
    </router-link>
    <!-- Button to toggle between creator and customer roles for testing -->
    <button
      @click="
        auth.simulateRole('creator', {
          onboardingPassed: false,
          kycPassed: false,
        })
      "
      style="
        padding: 0.5rem 1rem;
        background-color: #28a745;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
      "
    >
      Simulate Creator (Incomplete)
    </button>
    <button
      @click="auth.simulateRole('customer', { onboardingPassed: true })"
      style="
        padding: 0.5rem 1rem;
        background-color: #28a745;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
      "
    >
      Simulate Customer (Complete)
    </button>
  </nav>

  <!-- Main content -->
  <router-view />
</template>

<style scoped>
nav {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
}
button:hover {
  background-color: #0056b3;
}
</style>
