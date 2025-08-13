import { createRouter, createWebHistory } from 'vue-router'
import routeConfig from './routeConfig.json';
import routeGuard from './routeGuard';
import { useAuthStore } from '@/stores/useAuthStore';

const routes = routeConfig.map(route => ({
  path: route.slug,
  component: () => {
    const auth = useAuthStore();
    const role = auth.simulate?.role || auth.currentUser?.role;
    const finalPath = route.customComponentPath?.[role]?.componentPath || route.componentPath;
    return finalPath ? import(/* @vite-ignore */ finalPath) : import('@/components/NotFound.vue');
  },
  meta: route
}));

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

router.beforeEach(routeGuard);
export default router
