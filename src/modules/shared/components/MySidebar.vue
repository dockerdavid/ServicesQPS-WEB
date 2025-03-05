<script setup lang="ts">
import ItemNav from './ItemNav.vue';
import { onMounted, ref, watchEffect } from 'vue';
import { useSidebarStore } from '@/store/sidebar.store';
import type { RouteLink } from '@/interfaces/routeLink';

const routes: RouteLink[] = [
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

const store = useSidebarStore();
const windowWidth = ref(window.innerWidth);

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
      <Icon @click="store.toggleSidebar" v-if="store.isSidebarOpen" class="absolute right-5 icon-close" icon="ph:x"></Icon>
    </div>

    <!-- <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTjsScWYmyfPv3XdkNdEFVJ1wlDKMOgcSWUcg&s"
      alt="qps-logo"> -->

    <ul>
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