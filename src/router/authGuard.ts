import type { NavigationGuardNext, RouteLocationNormalized } from 'vue-router';
import { useAuthStore } from '../store/auth.store';
import { useUserStore } from '../store/user.store';
import roleRoutes from './role-routes';


const authGuard = (
  to: RouteLocationNormalized,
  from: RouteLocationNormalized,
  next: NavigationGuardNext
): void => {
  const authStore = useAuthStore();
  const userStore = useUserStore();
  const isAuthenticated = authStore.token;

  if (!isAuthenticated) {
    if (to.path !== '/auth') {
      next('/auth');
    } else {
      next();
    }
    return;
  }

  const userRole = userStore?.userData?.role.name.toLowerCase() as keyof typeof roleRoutes;
  const allowedRoutes = roleRoutes[userRole] || [];
  if (allowedRoutes.includes(to.name as string)) {
    next();
  } else {

    next('/notFound');
  }
};

export default authGuard;