import type { NavigationGuardNext, RouteLocationNormalized } from 'vue-router';
import { useAuthStore } from '../store/auth.store';
import { useUserStore } from '../store/user.store';
import { resolveRoleRoutes } from './role-routes';


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

  if (to.name === 'notFound') {
    next();
    return;
  }

  const roleName = userStore?.userData?.role?.name;
  const roleId = userStore?.userData?.roleId;
  if (!roleName && !roleId) {
    next();
    return;
  }

  const allowedRoutes = resolveRoleRoutes(roleName, roleId);
  if (allowedRoutes.includes(to.name as string)) {
    next();
  } else {

    next('/notFound');
  }
};

export default authGuard;
