<template>
    <RouterLink :to="{ name: props.route }" class="sidebar-item">
        <Icon :class="{ 'mr': sidebarState.isSidebarOpen }"
            :icon="props.icon ? props.icon : 'material-symbols:circle-outline'" />
        <span :class="[sidebarState.isSidebarOpen ? '' : 'none']">{{ label }}</span>
    </RouterLink>
</template>

<script setup lang="ts">
import type { RouteLink } from '@/interfaces/routeLink';
import { useSidebarStore } from '@/store/sidebar.store';

const sidebarState = useSidebarStore();

const props = defineProps<RouteLink>();

</script>

<style scoped lang="scss">
.sidebar-item {
    padding: .45rem .55rem;
    border-radius: 6px;
    display: flex;
    align-items: center;
    color: inherit;

    span {
        text-transform: capitalize;
        text-wrap: none;
    }

    .iconify {
        color: #cfcfcf;
    }

    &:hover {
        background-color: #e6e6e6;
    }

    &:hover>.iconify {
        color: black;
    }

    .none {
        display: none;
    }

    .mr {
        margin-right: 1rem;
    }
}

.router-link-active {
    span {
        color: red; 
    }

    .iconify {
        color: red; 
    }
}


</style>