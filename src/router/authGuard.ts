import type { NavigationGuardNext, RouteLocationNormalized} from 'vue-router';

const authGuard = (to: RouteLocationNormalized, from: RouteLocationNormalized, next: NavigationGuardNext): void => {
    
  const isAuthenticated = localStorage.getItem('userToken');

  if (isAuthenticated) {
    next(); 
  } else {
    next('/login'); 
  }
};

export default authGuard;
