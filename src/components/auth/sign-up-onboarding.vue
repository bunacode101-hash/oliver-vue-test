<script setup>
import { ref } from "vue";
const name = ref("");
function submit(e) {
  e.preventDefault();
  console.log("onboarding submit", name.value);
}
</script>

<script>
export const assets = {
  critical: ["/css/onboarding.css"],
  high: [],
  normal: [],
};
</script>

<template>
  <main>
    <h1>Onboarding</h1>
    <form @submit="submit" novalidate>
      <div>
        <label>Display name</label>
        <input v-model="name" required />
      </div>
      <button type="submit">Continue</button>
    </form>
  </main>
</template>
