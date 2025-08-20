<template>
  <div>
    <h1>Forgot Password</h1>
    <form @submit.prevent="handleForgotPassword">
      <input v-model="email" type="email" placeholder="Email" required />
      <button type="submit">Send Reset Code</button>
    </form>
    <p v-if="error">{{ error }}</p>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import { authHandler } from "@/services/authHandler";

const email = ref("");
const error = ref("");
const router = useRouter();

async function handleForgotPassword() {
  try {
    await authHandler.forgotPassword(email.value);
    router.push("/reset-password");
  } catch (err) {
    error.value = err.message || "Failed to send reset code";
  }
}

const assets = {
  critical: ["/css/auth.css"],
  high: [],
  normal: ["/images/auth-bg.jpg"],
};
</script>

<style scoped>
/* Ensure CSS is applied */
@import "/css/auth.css";
</style>
