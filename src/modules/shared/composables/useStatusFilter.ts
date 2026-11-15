import { ref } from "vue";

/** Filtro de estado para listados con isActive. Por defecto solo activos. */
export type StatusFilter = 'active' | 'inactive' | 'all';

export const useStatusFilter = (initial: StatusFilter = 'active') => {
    const selectedStatus = ref<StatusFilter>(initial);
    /** Valor para el query param `status` del API (undefined = todos). */
    const statusParam = (): 'active' | 'inactive' | undefined =>
        selectedStatus.value === 'all' ? undefined : selectedStatus.value;
    return { selectedStatus, statusParam };
};
