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
import { useAuthStore } from "@/stores/useAuthStore";
import { authHandler } from "@/services/authHandler";

const email = ref("");
const code = ref("");
const error = ref("");
const router = useRouter();
const authStore = useAuthStore();

async function handleConfirm() {
  try {
    await authHandler.confirmSignUp(email.value, code.value);
    const session = await authHandler.restoreSession();
    authStore.setFromSession(session);
    router.push("/sign-up/onboarding");
  } catch (err) {
    error.value = err.message || "Confirmation failed";
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
