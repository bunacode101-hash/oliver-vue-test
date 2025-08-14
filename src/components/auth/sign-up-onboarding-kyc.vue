<script setup>
import { ref } from "vue";
const idNumber = ref("");
function submit(e) {
  e.preventDefault();
  console.log("kyc submit", idNumber.value);
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
    <h1>Onboarding — KYC</h1>
    <form @submit="submit" novalidate>
      <div>
        <label>ID / Passport</label>
        <input v-model="idNumber" required />
      </div>
      <button type="submit">Submit KYC</button>
    </form>
  </main>
</template>
