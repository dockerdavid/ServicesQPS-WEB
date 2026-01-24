<template>
    <RouterLink :to="{ name: props.route }" class="sidebar-item" :style="{ '--nav-accent': accentColor }">
        <Icon :class="{ 'mr': sidebarState.isSidebarOpen }"
            :icon="props.icon ? props.icon : 'material-symbols:circle-outline'" />
        <span :class="[sidebarState.isSidebarOpen ? '' : 'none']">{{ label }}</span>
    </RouterLink>
</template>

<script setup lang="ts">
import type { RouteLink } from '../../../interfaces/routeLink';
import { useSidebarStore } from '../../../store/sidebar.store';

const sidebarState = useSidebarStore();

const props = defineProps<RouteLink>();

const accentMap: Record<string, string> = {
    'dashboard': '#2d6cdf',
    'calendar': '#6d4dd8',
    'communities-default': '#168a8a',
    'companies-default': '#1f7a6d',
    'costs-default': '#c2410c',
    'recurring-costs-default': '#b45309',
    'extras-default': '#8b5cf6',
    'services-default': '#2563eb',
    'statuses-default': '#0f766e',
    'types-default': '#9333ea',
    'users-default': '#0ea5e9',
};

const accentColor = accentMap[props.route] ?? '#2d6cdf';

</script>

<style scoped lang="scss">
.sidebar-item {
    padding: .55rem .7rem;
    border-radius: 10px;
    display: flex;
    align-items: center;
    color: #e2e8f0;
    transition: background-color 0.2s ease, color 0.2s ease;
    position: relative;

    span {
        text-transform: capitalize;
        text-wrap: none;
    }

    .iconify {
        color: #94a3b8;
    }

    &:hover {
        background-color: rgba(45, 108, 223, 0.18);
    }

    &:hover>.iconify {
        color: #c7d2fe;
    }

    .none {
        display: none;
    }

    .mr {
        margin-right: 1rem;
    }
}

.router-link-active {

    background-color: color-mix(in srgb, var(--nav-accent) 25%, transparent);
    
    span {
        color: #eef2ff;  
    }

    .iconify {
        color: #e0e7ff; 
    }
}

.router-link-active::before {
    content: '';
    position: absolute;
    left: -0.5rem;
    width: 4px;
    height: 70%;
    background: var(--nav-accent);
    border-radius: 999px;
    box-shadow: 0 0 10px color-mix(in srgb, var(--nav-accent) 65%, transparent);
}


</style>
