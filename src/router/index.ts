import DefaultLayout from '@/layouts/DefaultLayout.vue';
import AuthView from '@/modules/auth/AuthView.vue';
import NotFoundView from '@/modules/shared/views/NotFoundView.vue';
import { createRouter, createWebHistory } from 'vue-router';
import authGuard from './authGuard';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/auth',
      name: 'auth',
      component: AuthView,
      beforeEnter: [authGuard]
    },
    {
      path: '/',
      component: DefaultLayout,
      beforeEnter: [authGuard],
      children: [
        {
          path: '',
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
              name: 'community-create',
              component: () => import('../modules/communities/CommunitiesCreateView.vue'),
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
              name: 'company-create',
              component: () => import('../modules/companies/CompaniesCreateView.vue'),
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
              name: 'cost-create',
              component: () => import('../modules/costs/CostsCreateView.vue'),
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
              name: 'extra-create',
              component: () => import('../modules/extras/ExtrasCreateView.vue'),
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
              name: 'service-create',
              component: () => import('../modules/services/ServicesCreateView.vue'),
            },
          ],
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
              name: 'status-create',
              component: () => import('../modules/statuses/StatusesCreateView.vue'),
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
              name: 'type-create',
              component: () => import('../modules/types/TypesCreateView.vue'),
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
              name: 'user-create',
              component: () => import('../modules/users/UsersCreateView.vue'),
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


export default router;

