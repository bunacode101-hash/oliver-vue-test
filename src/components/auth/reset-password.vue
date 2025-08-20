<template>
  <div>
    <h1>Reset Password</h1>
    <form @submit.prevent="handleResetPassword">
      <input v-model="email" type="email" placeholder="Email" required />
      <input v-model="code" type="text" placeholder="Reset Code" required />
      <input
        v-model="newPassword"
        type="password"
        placeholder="New Password"
        required
      />
      <button type="submit">Reset Password</button>
    </form>
    <p v-if="error">{{ error }}</p>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import { authHandler } from "@/services/authHandler";

const email = ref("");
const code = ref("");
const newPassword = ref("");
const error = ref("");
const router = useRouter();

async function handleResetPassword() {
  try {
    await authHandler.confirmPassword(
      email.value,
      code.value,
      newPassword.value
    );
    router.push("/log-in");
  } catch (err) {
    error.value = err.message || "Password reset failed";
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
@import "../../assets/css/auth.css";
</style>
