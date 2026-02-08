<script setup lang="ts">
import ItemNav from './ItemNav.vue';
import { computed, onMounted, ref, watchEffect } from 'vue';
import { useSidebarStore } from '../../../store/sidebar.store';
import { useUserStore } from '../../../store/user.store';
import type { RouteLink } from '../../../interfaces/routeLink';
import { resolveRoleKey } from '../../../router/role-routes';

const adminRoutes: RouteLink[] = [
  { route: 'dashboard', icon: 'ph:house-line', label: 'dashboard' },
  { route: 'calendar', icon: 'ph:calendar-dots', label: 'calendar' },
  { route: 'communities-default', icon: 'ph:fediverse-logo-duotone', label: 'communities' },
  { route: 'companies-default', icon: 'ph:briefcase-duotone', label: 'companies' },
  { route: 'costs-default', icon: 'ph:calculator-duotone', label: 'cost' },
  { route: 'recurring-costs-default', icon: 'ph:repeat-duotone', label: 'recurring costs' },
  { route: 'recurring-services-default', icon: 'ph:repeat-duotone', label: 'recurring services' },
  { route: 'extras-default', icon: 'ph:stack-plus-duotone', label: 'extras' },
  { route: 'services-default', icon: 'ph:folder-open-duotone', label: 'services' },
  { route: 'statuses-default', icon: 'ph:faders-duotone', label: 'statuses' },
  { route: 'types-default', icon: 'ph:shapes-duotone', label: 'types' },
  { route: 'users-default', icon: 'ph:users-three-duotone', label: 'users' },
]

const cleanerRoutes: RouteLink[] = [
  { route: 'services-default', icon: 'ph:folder-open-duotone', label: 'services' },
]

const managerRoutes: RouteLink[] = [
  { route: 'services-default', icon: 'ph:folder-open-duotone', label: 'services' },
]

const cheoRoutes: RouteLink[] = [
  { route: 'dashboard', icon: 'ph:house-line', label: 'dashboard' },
  { route: 'calendar', icon: 'ph:calendar-dots', label: 'calendar' },
  { route: 'costs-default', icon: 'ph:calculator-duotone', label: 'cost' },
  { route: 'recurring-costs-default', icon: 'ph:repeat-duotone', label: 'recurring costs' },
]

const qaRoutes: RouteLink[] = [
  { route: 'calendar', icon: 'ph:calendar-dots', label: 'calendar' },
  { route: 'services-default', icon: 'ph:folder-open-duotone', label: 'services' },
]



const store = useSidebarStore();
const userStore = useUserStore();
const windowWidth = ref(window.innerWidth);


const routes = computed(() => {
  const roleKey = resolveRoleKey(userStore?.userData?.role?.name, userStore?.userData?.roleId);

  switch (roleKey) {
    case "super_admin":
      return adminRoutes;
    case "manager":
      return managerRoutes;
    case "cleaner":
      return cleanerRoutes;
    case "cheo":
      return cheoRoutes;
    case "qa":
      return qaRoutes;
    case "supervisor":
      return managerRoutes;
    default:
      return [
        { route: 'services-default', icon: 'ph:folder-open-duotone', label: 'services' },
      ];
  }
});


onMounted(() => {
  store.isSidebarOpen = windowWidth.value > 992;
});

watchEffect(() => {
  if (windowWidth.value > 992) {
    store.isSidebarOpen = true;
  } else if (windowWidth.value <= 992) {
    store.isSidebarOpen = false;
  }
});

window.addEventListener('resize', () => {
  windowWidth.value = window.innerWidth;
});

</script>

<template>
  <aside class="relative" :class="['sidebar', store.isSidebarOpen ? 'sidebar--open' : 'sidebar--close']">

    <div class="flex">
      <Icon @click="store.toggleSidebar" v-if="store.isSidebarOpen" class="absolute right-5 icon-close" icon="ph:x">
      </Icon>
    </div>
    
    <ul v-if="userStore?.userData">
      <li v-for="route in routes" :key="route.route">
        <ItemNav :icon="route.icon" :label="route.label" :route="route.route" />
      </li>
    </ul>

  </aside>
</template>


<style scoped lang="scss">
.sidebar {
  position: relative;
  z-index: 10;
  height: 100vh;
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  background: linear-gradient(180deg, var(--surface-50) 0%, var(--surface-100) 100%);
  border-right: 1px solid var(--border-soft);
  box-shadow: var(--shadow-soft);
  overflow-x: hidden;

  img {
    height: 70px;
  }

  ul {
    margin-top: 48px;
    list-style: none;
    width: 100%;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 0.35rem;

    li {
      width: 100%;
    }
  }


  &--open {
    width: 14rem;
  }

  &--close {
    transition: width var(--sidebar-open-transition), transform var(--sidebar-open-transition);
    width: 4.6rem;
  }

  .icon-close {
    display: none;
    color: var(--ink-700);
  }

}


@media(max-width: 992px) {
  .sidebar {
    position: absolute;

    &--close {
      width: 5rem;
      transform: translateX(-100%);
    }

    &--open {
      width: 14rem;
      transform: translateX(0);
    }

    .icon-close {
      display: block;
    }
  }
}
</style>
