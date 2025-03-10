import type { NavigationGuardNext, RouteLocationNormalized } from 'vue-router';
import { useAuthStore } from '../store/auth.store';

const authGuard = (
  to: RouteLocationNormalized,
  from: RouteLocationNormalized,
  next: NavigationGuardNext
): void => {
  const authStore = useAuthStore();
  const isAuthenticated = authStore.token;

  if (isAuthenticated) {
    if (to.path === '/auth') {
      next('/');
    } else {
      next();
    }
  } else {
    if (to.path !== '/auth') {
      next('/auth');
    } else {
      next();
    }
  }
};

export default authGuard;