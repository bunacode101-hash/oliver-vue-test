<script setup>
import { ref } from "vue";
const code = ref("");
const password = ref("");
function submit(e) {
  e.preventDefault();
  console.log("reset", code.value, password.value);
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
    <h1>Reset Password</h1>
    <form @submit="submit" novalidate>
      <div>
        <label>Code</label>
        <input v-model="code" />
      </div>
      <div>
        <label>New password</label>
        <input v-model="password" type="password" />
      </div>
      <button type="submit">Reset</button>
    </form>
  </main>
</template>
