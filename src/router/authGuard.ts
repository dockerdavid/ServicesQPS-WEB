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
<<<<<<< HEAD
    // Si no está autenticado, redirige a la página de autenticación
=======
>>>>>>> 2b926e5a844007937b043a854ffb7d83b30c19e6
    if (to.path !== '/auth') {
      next('/auth');
    } else {
      next();
    }
    return;
  }

  const userRole = userStore?.userData?.role.name.toLowerCase() as keyof typeof roleRoutes;
  const allowedRoutes = roleRoutes[userRole] || [];
<<<<<<< HEAD
  console.log(userRole);
  console.log(to.name);
=======
>>>>>>> 2b926e5a844007937b043a854ffb7d83b30c19e6
  if (allowedRoutes.includes(to.name as string)) {
    next();
  } else {

    next('/notFound');
  }
};

export default authGuard;