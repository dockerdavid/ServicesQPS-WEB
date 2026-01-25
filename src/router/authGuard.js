import { useAuthStore } from '../store/auth.store';
import { useUserStore } from '../store/user.store';
import roleRoutes from './role-routes';
const authGuard = (to, from, next) => {
    const authStore = useAuthStore();
    const userStore = useUserStore();
    const isAuthenticated = authStore.token;
    if (!isAuthenticated) {
        if (to.path !== '/auth') {
            next('/auth');
        }
        else {
            next();
        }
        return;
    }
    if (to.name === 'notFound') {
        next();
        return;
    }
    const roleName = userStore?.userData?.role?.name;
    if (!roleName) {
        next();
        return;
    }
    const userRole = roleName.toLowerCase();
    const allowedRoutes = roleRoutes[userRole] || [];
    if (allowedRoutes.includes(to.name)) {
        next();
    }
    else {
        next('/notFound');
    }
};
export default authGuard;
