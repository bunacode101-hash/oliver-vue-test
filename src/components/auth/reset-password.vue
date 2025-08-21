<template>
  <div>
    <h1>Reset Password</h1>
    <form @submit.prevent="handleReset">
      <input v-model="email" type="email" placeholder="Email" required />
      <input v-model="code" type="text" placeholder="Reset Code" required />
      <input
        v-model="newPassword"
        type="password"
        placeholder="New Password"
        required
      />
      <button type="submit">Reset</button>
    </form>
    <p v-if="message">{{ message }}</p>
    <p v-if="error">{{ error }}</p>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { authHandler } from "@/services/authHandler";
import { useRouter } from "vue-router";

const email = ref("");
const code = ref("");
const newPassword = ref("");
const message = ref("");
const error = ref("");
const router = useRouter();

async function handleReset() {
  try {
    await authHandler.confirmPassword(
      email.value,
      code.value,
      newPassword.value
    );
    message.value = "Password reset successful. Please log in.";
    router.push("/log-in");
  } catch (err) {
    error.value = err.message || "Reset failed";
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
