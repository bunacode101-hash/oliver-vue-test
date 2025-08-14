<script setup>
import { ref } from "vue";
const email = ref("");
function submit(e) {
  e.preventDefault();
  console.log("lost password for", email.value);
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
    <h1>Lost Password</h1>
    <form @submit="submit" novalidate>
      <div>
        <label>Email</label>
        <input v-model="email" type="email" required />
      </div>
      <button type="submit">Send reset</button>
    </form>
  </main>
</template>
