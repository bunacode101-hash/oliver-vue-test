<script setup>
import { ref } from "vue";
const code = ref("");
function submit(e) {
  e.preventDefault();
  console.log("confirm email", code.value);
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
    <h1>Confirm Email</h1>
    <form @submit="submit" novalidate>
      <div>
        <label>Code</label>
        <input v-model="code" />
      </div>
      <button type="submit">Confirm</button>
    </form>
  </main>
</template>
