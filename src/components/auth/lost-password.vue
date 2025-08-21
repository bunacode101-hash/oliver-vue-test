<template>
  <div>
    <h1>Lost Password</h1>
    <form @submit.prevent="handleForgot">
      <input v-model="email" type="email" placeholder="Email" required />
      <button type="submit">Send Reset Code</button>
    </form>
    <p v-if="message">{{ message }}</p>
    <p v-if="error">{{ error }}</p>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { authHandler } from "@/services/authHandler";

const email = ref("");
const message = ref("");
const error = ref("");

async function handleForgot() {
  try {
    await authHandler.forgotPassword(email.value);
    message.value = "Reset code sent to your email.";
  } catch (err) {
    error.value = err.message || "Failed to send code";
  }
}
</script>
<script>
export const assets = {
  critical: ["/css/auth.css"],
  high: [],
  normal: ["/images/auth-bg.jpg"],
};
</script>
