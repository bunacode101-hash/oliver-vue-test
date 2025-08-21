<template>
  <div>
    <h1>Sign Up</h1>
    <form @submit.prevent="handleSignUp">
      <input v-model="name" type="text" placeholder="Name" required />
      <input v-model="email" type="email" placeholder="Email" required />
      <input
        v-model="password"
        type="password"
        placeholder="Password"
        required
      />
      <select v-model="role" required>
        <option value="creator">Creator</option>
        <option value="vendor">Vendor</option>
        <option value="customer">Customer</option>
        <option value="agent">Agent</option>
      </select>
      <button type="submit">Sign Up</button>
    </form>
    <p v-if="error">{{ error }}</p>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/useAuthStore";
import { authHandler } from "@/services/authHandler";

const name = ref("");
const email = ref("");
const password = ref("");
const role = ref("creator");
const error = ref("");
const router = useRouter();
const authStore = useAuthStore();

async function handleSignUp() {
  try {
    console.log("Attempting signup with:", {
      email: email.value,
      role: role.value,
    });
    await authHandler.register(email.value, password.value, {
      email: email.value, // Added: Explicitly set email attribute
      name: name.value,
      "custom:role": role.value,
    });
    console.log("Signup successful, redirecting to confirm-email");
    router.push("/confirm-email");
  } catch (err) {
    console.error("Signup error:", err);
    error.value = err.message || "Sign up failed";
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
