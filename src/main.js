import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import router from './router';
import { useAuthStore } from './stores/useAuthStore';
import { useSectionsStore } from './stores/sectionStore';

const app = createApp(App);
const pinia = createPinia();
app.use(pinia);
app.use(router);

// Initialize stores after Pinia is set up
const authStore = useAuthStore();
const sectionsStore = useSectionsStore();
authStore.refreshFromStorage();
sectionsStore.hydrate();

app.mount('#app');