<template>
  <div>
    <h1>Confirm Email</h1>
    <form @submit.prevent="handleConfirm">
      <input v-model="email" type="email" placeholder="Email" required />
      <input
        v-model="code"
        type="text"
        placeholder="Confirmation Code"
        required
      />
      <button type="submit">Confirm</button>
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
const error = ref("");
const router = useRouter();

async function handleConfirm() {
  try {
    await authHandler.confirmSignUp(email.value, code.value);
    router.push("/log-in"); // Redirect to login after confirmation
  } catch (err) {
    error.value = err.message || "Confirmation failed";
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
