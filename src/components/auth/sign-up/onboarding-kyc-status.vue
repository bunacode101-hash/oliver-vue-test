<template>
  <div>
    <h1>KYC Status</h1>
    <p>
      Your KYC status: {{ auth.currentUser.kycPassed ? "DONE" : "PENDING" }}
    </p>
  </div>
</template>

<script setup>
import { useAuthStore } from "@/stores/useAuthStore";

const auth = useAuthStore();
</script>
