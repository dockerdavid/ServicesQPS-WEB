<template>
    <form class="form-grid">
        <slot name="inputs"></slot>
    </form>
</template>

<script setup lang="ts"></script>

<style scoped lang="scss">
.form-grid {

    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 1rem;
}


@media (max-width: 768px) {
    .form-grid {
        grid-template-columns: 1fr;
        grid-auto-flow: dense;
    }
}
</style>