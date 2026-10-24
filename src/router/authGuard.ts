import type { NavigationGuardNext, RouteLocationNormalized } from 'vue-router';
import { useAuthStore } from '../store/auth.store';
import { useUserStore } from '../store/user.store';
import { homeRouteFor, resolveRoleRoutes } from './role-routes';


const authGuard = (
  to: RouteLocationNormalized,
  from: RouteLocationNormalized,
  next: NavigationGuardNext
): void => {
  const authStore = useAuthStore();
  const userStore = useUserStore();
  const isAuthenticated = authStore.token;

  const publicPaths = ['/auth', '/support'];

  if (!isAuthenticated) {
    if (!publicPaths.includes(to.path)) {
      next('/auth');
    } else {
      next();
    }
    return;
  }

  const roleName = userStore?.userData?.role?.name;
  const roleId = userStore?.userData?.roleId;
  if (!roleName && !roleId) {
    next();
    return;
  }

  // Rol que la web no conoce: la API sigue validando permisos, asi que es
  // mejor dejarlo pasar que encerrarlo en notFound.
  const allowedRoutes = resolveRoleRoutes(roleName, roleId);
  if (allowedRoutes.length === 0) {
    next();
    return;
  }

  if (to.name !== 'notFound' && allowedRoutes.includes(to.name as string)) {
    next();
    return;
  }

  /**
   * Ruta sin permiso o inexistente: antes caia en la pantalla 404, que en el
   * celular es un callejon sin salida (le paso al Cheo al tocar un servicio en
   * el calendario). Ahora vuelve a la primera pantalla de su rol, que siempre
   * esta permitida, asi que no puede formar un bucle.
   */
  const home = homeRouteFor(roleName, roleId);
  if (home && home !== to.name) {
    next({ name: home, replace: true });
    return;
  }

  next();
};

export default authGuard;
