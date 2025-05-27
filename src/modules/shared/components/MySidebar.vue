<script setup lang="ts">
import ItemNav from './ItemNav.vue';
import { computed, onMounted, ref, watchEffect } from 'vue';
import { useSidebarStore } from '../../../store/sidebar.store';
import { useUserStore } from '../../../store/user.store';
import type { RouteLink } from '../../../interfaces/routeLink';

const adminRoutes: RouteLink[] = [
  { route: 'dashboard', icon: 'ph:house-line', label: 'dashboard' },
  { route: 'calendar', icon: 'ph:calendar-dots', label: 'calendar' },
  { route: 'communities-default', icon: 'ph:fediverse-logo-duotone', label: 'communities' },
  { route: 'companies-default', icon: 'ph:briefcase-duotone', label: 'companies' },
  { route: 'costs-default', icon: 'ph:calculator-duotone', label: 'cost' },
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
]

const store = useSidebarStore();
const userStore = useUserStore();
const windowWidth = ref(window.innerWidth);


const routes = computed(() => {

  switch (userStore?.userData?.roleId) {
    case "1":
      return adminRoutes;
    case "3":
      return managerRoutes;
    case "4":
      return cleanerRoutes;
    case "5":
      return cheoRoutes;
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
<<<<<<< HEAD

    <!-- <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTjsScWYmyfPv3XdkNdEFVJ1wlDKMOgcSWUcg&s"
      alt="qps-logo"> -->

=======
    
>>>>>>> 2b926e5a844007937b043a854ffb7d83b30c19e6
    <ul v-if="userStore?.userData?.roleId">
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
  padding: 1rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  background-color: white;
  overflow-x: hidden;

  img {
    height: 70px;
  }

  ul {
    margin-top: 60px;
    list-style: none;
    width: 100%;
    padding: 0;

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