import DefaultLayout from '../layouts/DefaultLayout.vue';
import AuthView from '../modules/auth/AuthView.vue';
import NotFoundView from '../modules/shared/views/NotFoundView.vue';
import SupportView from '../modules/shared/views/SupportView.vue';
import { createRouter, createWebHashHistory } from 'vue-router';
import authGuard from './authGuard';
import { resolveRoleRoutes } from './role-routes';
import { useUserStore } from '../store/user.store';

/**
 * A donde mandar la raiz. Antes apuntaba fijo a /dashboard, que solo pueden ver
 * algunos roles: al vendedor lo rebotaba el guard a notFound apenas entraba o
 * refrescaba, sin manera de salir de ahi. Ahora cada rol aterriza en su primera
 * pantalla permitida. El store esta persistido, asi que el rol sobrevive al
 * refresco; si aun asi no se puede resolver, queda el dashboard de siempre.
 */
const inicioSegunRol = () => {
  try {
    const userData = useUserStore().userData;
    const permitidas = resolveRoleRoutes(userData?.role?.name, userData?.roleId)
      .filter((name) => name !== 'notFound');

    if (permitidas.length > 0) return { name: permitidas[0] };
  } catch {
    // el store todavia no existe (arranque en frio): cae al valor por defecto
  }

  return '/dashboard';
};

const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/auth',
      name: 'auth',
      component: AuthView,
    },
    {
      path: '/support',
      name: 'support',
      component: SupportView,
    },
    {
      path: '/',
      component: DefaultLayout,
      redirect: inicioSegunRol,
      children: [
        {
          path: 'dashboard',
          name: 'dashboard',
          component: () => import('../modules/dashboard/DashboardView.vue'),
        },
        {
          path: 'calendar',
          name: 'calendar',
          component: () => import('../modules/calendar/CalendarView.vue'),
        },
        {
          path: 'communities',
          name: 'communities',
          component: () => import('../modules/communities/CommunitiesView.vue'),
          children: [
            {
              path: '',
              name: 'communities-default',
              component: () => import('../modules/communities/CommunitiesDataView.vue'),
            },
            {
              path: 'create',
              name: 'communities-create',
              component: () => import('../modules/communities/CommunitiesCreateView.vue'),
            },
            {
              path: 'edit/:id',
              name: 'communities-edit',
              component: () => import('../modules/communities/CommunitiesEditView.vue'),
            },
          ],
        },
        {
          path: 'companies',
          name: 'companies',
          component: () => import('../modules/companies/CompaniesView.vue'),
          children: [
            {
              path: '',
              name: 'companies-default',
              component: () => import('../modules/companies/CompaniesDataView.vue'),
            },
            {
              path: 'create',
              name: 'companies-create',
              component: () => import('../modules/companies/CompaniesCreateView.vue'),
            },
            {
              path: 'edit/:id',
              name: 'companies-edit',
              component: () => import('../modules/companies/CompaniesEditView.vue'),
            },
          ],
        },
        {
          path: 'costs',
          name: 'costs',
          component: () => import('../modules/costs/CostsView.vue'),
          children: [
            {
              path: '',
              name: 'costs-default',
              component: () => import('../modules/costs/CostsDataView.vue'),
            },
            {
              path: 'create',
              name: 'costs-create',
              component: () => import('../modules/costs/CostsCreateView.vue'),
            },
            {
              path: 'edit/:id',
              name: 'costs-edit',
              component: () => import('../modules/costs/CostsEditView.vue'),
            },
          ],
        },
        {
          path: 'recurring-costs',
          name: 'recurring-costs',
          component: () => import('../modules/recurring-costs/RecurringCostsView.vue'),
          children: [
            {
              path: '',
              name: 'recurring-costs-default',
              component: () => import('../modules/recurring-costs/RecurringCostsDataView.vue'),
            },
            {
              path: 'create',
              name: 'recurring-costs-create',
              component: () => import('../modules/recurring-costs/RecurringCostsCreateView.vue'),
            },
            {
              path: 'edit/:id',
              name: 'recurring-costs-edit',
              component: () => import('../modules/recurring-costs/RecurringCostsEditView.vue'),
            },
          ],
        },
        {
          path: 'recurring-services',
          name: 'recurring-services',
          component: () => import('../modules/recurring-services/RecurringServicesView.vue'),
          children: [
            {
              path: '',
              name: 'recurring-services-default',
              component: () => import('../modules/recurring-services/RecurringServicesDataView.vue'),
            },
            {
              path: 'create',
              name: 'recurring-services-create',
              component: () => import('../modules/recurring-services/RecurringServicesCreateView.vue'),
            },
            {
              path: 'edit/:id',
              name: 'recurring-services-edit',
              component: () => import('../modules/recurring-services/RecurringServicesEditView.vue'),
            },
          ],
        },
        {
          path: 'extras',
          name: 'extras',
          component: () => import('../modules/extras/ExtrasView.vue'),
          children: [
            {
              path: '',
              name: 'extras-default',
              component: () => import('../modules/extras/ExtrasDataView.vue'),
            },
            {
              path: 'create',
              name: 'extras-create',
              component: () => import('../modules/extras/ExtrasCreateView.vue'),
            },
            {
              path: 'edit/:id',
              name: 'extras-edit',
              component: () => import('../modules/extras/ExtrasEditView.vue'),
            },
          ],
        },
        {
          path: 'services',
          name: 'services',
          component: () => import('../modules/services/ServicesView.vue'),
          children: [
            {
              path: '',
              name: 'services-default',
              component: () => import('../modules/services/ServicesDataView.vue'),
            },
            {
              path: 'create',
              name: 'services-create',
              component: () => import('../modules/services/ServicesCreateView.vue'),
            },
            {
              path: 'edit/:id',
              name: 'services-edit',
              component: () => import('../modules/services/ServicesEditView.vue'),
            },
            {
              path: 'tracking',
              name: 'services-tracking',
              component: () => import('../modules/services/ServicesTrackingView.vue'),
            },
          ],
        },
        {
          path: 'vendedor',
          children: [
            {
              path: '',
              name: 'vendedor-comisiones',
              component: () => import('../modules/vendedores/VendedorComisionesView.vue'),
            },
          ],
        },
        {
          path: 'kds-admin',
          name: 'kds-admin',
          component: () => import('../modules/kds/KdsAdminView.vue'),
          children: [
            { path: '', name: 'kds-admin-default', component: () => import('../modules/kds/KdsAdminDataView.vue') },
          ],
        },
        {
          path: 'kds-qa',
          name: 'kds-qa',
          component: () => import('../modules/kds/KdsQaView.vue'),
          children: [
            { path: '', name: 'kds-qa-default', component: () => import('../modules/kds/KdsQaDataView.vue') },
          ],
        },
        {
          path: 'chat/:serviceId?',
          name: 'chat',
          component: () => import('../modules/chat/ChatView.vue'),
        },
        {
          path: 'statuses',
          name: 'statuses',
          component: () => import('../modules/statuses/StatusesView.vue'),
          children: [
            {
              path: '',
              name: 'statuses-default',
              component: () => import('../modules/statuses/StatusesDataView.vue'),
            },
            {
              path: 'create',
              name: 'statuses-create',
              component: () => import('../modules/statuses/StatusesCreateView.vue'),
            },
            {
              path: 'edit/:id',
              name: 'statuses-edit',
              component: () => import('../modules/statuses/StatusesEditView.vue'),
            },
          ],
        },
        {
          path: 'types',
          name: 'types',
          component: () => import('../modules/types/TypesView.vue'),
          children: [
            {
              path: '',
              name: 'types-default',
              component: () => import('../modules/types/TypesDataView.vue'),
            },
            {
              path: 'create',
              name: 'types-create',
              component: () => import('../modules/types/TypesCreateView.vue'),
            },
            {
              path: 'edit/:id',
              name: 'types-edit',
              component: () => import('../modules/types/TypesEditView.vue'),
            },
          ],
        },
        {
          path: 'users',
          name: 'users',
          component: () => import('../modules/users/UsersView.vue'),
          children: [
            {
              path: '',
              name: 'users-default',
              component: () => import('../modules/users/UsersDataView.vue'),
            },
            {
              path: 'create',
              name: 'users-create',
              component: () => import('../modules/users/UsersCreateView.vue'),
            },
            {
              path: 'edit/:id',
              name: 'users-edit',
              component: () => import('../modules/users/UsersEditView.vue'),
            },
          ],
        },
      ],
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'notFound',
      component: NotFoundView,
    },
  ],
});

router.beforeEach(authGuard);

// Respaldo para fallos de imports dinamicos que algunos Safari no reportan con
// `vite:preloadError`. Una sola recarga por destino evita cualquier bucle.
router.onError((error, to) => {
  const message = error instanceof Error ? error.message : String(error);
  const isChunkError = /Failed to fetch dynamically imported module|Importing a module script failed|error loading dynamically imported module|Load failed/i.test(message);
  if (!isChunkError) return;

  const reloadKey = `chunk-reload:${to.fullPath}`;
  const lastReload = Number(sessionStorage.getItem(reloadKey) ?? 0);
  if (Date.now() - lastReload < 30_000) return;

  sessionStorage.setItem(reloadKey, Date.now().toString());
  const url = new URL(window.location.href);
  url.searchParams.set('_appv', Date.now().toString());
  window.location.replace(url.toString());
});

export default router;
