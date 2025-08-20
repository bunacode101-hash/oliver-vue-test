<template>
  <div>
    <h1>Login</h1>
    <form @submit.prevent="handleLogin">
      <input v-model="email" type="email" placeholder="Email" required />
      <input
        v-model="password"
        type="password"
        placeholder="Password"
        required
      />
      <button type="submit">Login</button>
    </form>
    <p v-if="error">{{ error }}</p>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/useAuthStore";
import { authHandler } from "@/services/authHandler";

const email = ref("");
const password = ref("");
const error = ref("");
const router = useRouter();
const authStore = useAuthStore();

const assets = {
  critical: ["/css/auth.css"],
  high: [],
  normal: ["/images/auth-bg.jpg"],
};

async function handleLogin() {
  try {
    const session = await authHandler.login(email.value, password.value);
    authStore.setFromSession(session);
    router.push("/dashboard");
  } catch (err) {
    error.value = err.message || "Login failed";
  }
}
</script>

<style scoped>
/* Ensure CSS is applied */
@import "../../assets/css/auth.css";
</style>
