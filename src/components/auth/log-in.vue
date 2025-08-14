<script setup>
import { ref } from "vue";
const email = ref("");
const password = ref("");
function submit(e) {
  e.preventDefault();
  console.log("log-in submit", email.value, password.value);
}
</script>

<script>
export const assets = {
  critical: ["/css/auth.css"],
  high: [],
  normal: [],
};
</script>

<template>
  <main>
    <h1>Log In</h1>
    <form @submit="submit" novalidate>
      <div>
        <label>Email</label>
        <input v-model="email" type="email" required />
      </div>
      <div>
        <label>Password</label>
        <input v-model="password" type="password" required />
      </div>
      <button type="submit">Log in</button>
    </form>
  </main>
</template>
