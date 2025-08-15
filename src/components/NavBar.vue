
<template>
  <section >
    <div class="navigation-buttons">
      <button @click="goToSignUp">Go to Sign Up</button>
      <button @click="goToDashboard">Go to Dashboard</button>
      <button @click="goToProfile">Go to Profile</button>
    </div>
  </section>
</template>

<script setup>
import { useRouter } from 'vue-router';

const router = useRouter();

function goToSignUp() {
  router.push('/sign-up');
}

function goToDashboard() {
  router.push('/dashboard');
}

function goToProfile() {
  router.push('/profile');
}
</script>

<style scoped>
.navigation-buttons {
  margin-top: 20px;
  display: flex;
  gap: 10px;
}
button {
  padding: 8px 16px;
  cursor: pointer;
}
</style>
