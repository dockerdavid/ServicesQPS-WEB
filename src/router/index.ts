import DefaultLayout from '@/layouts/DefaultLayout.vue';
import AuthView from '../modules/auth/AuthView.vue';
import NotFoundView from '../modules/shared/views/NotFoundView.vue';
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
      redirect: '/dashboard',
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

export default router;
