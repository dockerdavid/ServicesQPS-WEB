import { createRouter, createWebHistory } from 'vue-router';
import DefaultLayout from '@/layouts/DefaultLayout.vue';
import authGuard from './authGuard';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      component: DefaultLayout,
      /* beforeEnter: [authGuard], */
      children: [
        {
          path: '/',
          component: () => import('../modules/dashboard/DashboardView.vue'),
        },
        {
          path: '/calendar',
          component: () => import('../modules/calendar/CalendarView.vue'),
        },

        {
          path: '/communities',
          component: () => import('../modules/communities/CommunitiesView.vue'),
          children: [
            {
              path: '',
              component: () => import('../modules/communities/CommunitiesDataView.vue'),
            },
            {
              path: 'create',
              component: () => import('../modules/communities/CommunitiesCreateView.vue'),
            },
          ],
        },

        {
          path: '/companies',
          component: () => import('../modules/companies/CompaniesView.vue'),
          children: [
            {
              path: '',
              component: () => import('../modules/companies/CompaniesDataView.vue'),
            },
            {
              path: 'create',
              component: () => import('../modules/companies/CompaniesCreateView.vue'),
            },
          ],
        },

        {
          path: '/costs',
          component: () => import('../modules/costs/CostsView.vue'),
          children: [
            {
              path: '',
              component: () => import('../modules/costs/CostsDataView.vue'),
            },
            {
              path: 'create',
              component: () => import('../modules/costs/CostsCreateView.vue'),
            },
          ],
        },

        {
          path: '/extras',
          component: () => import('../modules/extras/ExtrasView.vue'),
          children: [
            {
              path: '',
              component: () => import('../modules/extras/ExtrasDataView.vue'),
            },
            {
              path: 'create',
              component: () => import('../modules/extras/ExtrasCreateView.vue'),
            },
          ],
        },

        {
          path: '/services',
          component: () => import('../modules/services/ServicesView.vue'),
          children: [
            {
              path: '',
              component: () => import('../modules/services/ServicesDataView.vue'),
            },
            {
              path: 'create',
              component: () => import('../modules/services/ServicesCreateView.vue'),
            },
          ],
        },

        {
          path: '/statuses',
          component: () => import('../modules/statuses/StatusesView.vue'),
          children: [
            {
              path: '',
              component: () => import('../modules/statuses/StatusesDataView.vue'),
            },
            {
              path: 'create',
              component: () => import('../modules/statuses/StatusesCreateView.vue'),
            },
          ],
        },

        {
          path: '/types',
          component: () => import('../modules/types/TypesView.vue'),
          children: [
            {
              path: '',
              component: () => import('../modules/types/TypesDataView.vue'),
            },
            {
              path: 'create',
              component: () => import('../modules/types/TypesCreateView.vue'),
            },
          ],
        },
        
        {
          path: '/users',
          component: () => import('../modules/users/UsersView.vue'),
          children: [
            {
              path: '',
              component: () => import('../modules/users/UsersDataView.vue'),
            },
            {
              path: 'create',
              component: () => import('../modules/users/UsersCreateView.vue'),
            },
          ],
        },
      ],
    },
  ],
});

export default router;