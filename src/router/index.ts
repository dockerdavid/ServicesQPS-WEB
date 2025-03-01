import { createRouter, createWebHistory } from 'vue-router';
import DefaultLayout from '@/layouts/DefaultLayout.vue';
import authGuard from './authGuard';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      component: DefaultLayout,
      /*  beforeEnter:[authGuard], */
      children: [
        {
          path: '/',
          component: () => import('../modules/dashboard/Dashboard.vue')
        },
        {
          path: '/calendar',
          component: () => import('../modules/calendar/CalendarView.vue')
        },
        {
          path: '/communities',
          component: () => import('../modules/communities/CommunitiesDataView.vue')
        },
        {
          path: '/companies',
          component: () => import('../modules/companies/CompaniesView.vue')
        },
        {
          path: '/costs',
          component: () => import('../modules/costs/CostsView.vue')
        },
        {
          path: '/extras',
          component: () => import('../modules/extras/ExtrasView.vue')
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
              component: () => import('../modules/services/CreateServiceView.vue'),
            },

          ]
        },
        {
          path: '/statuses',
          component: () => import('../modules/statuses/StatusesView.vue')
        },
        {
          path: '/types',
          component: () => import('../modules/types/TypesView.vue')
        },
        {
          path: '/users',
          component: () => import('../modules/users/UsersView.vue')
        },

      ]
    }
  ],
})

export default router
