import { ref, watch, type Ref } from 'vue';
import { CleanerZonesServices } from '../cleaner-zones.services';

/**
 * Filtra los selectores de cleaner por la zona de trabajo de cada cleaner.
 *
 * El API decide (GET /users/eligible-cleaners): en el periodo de gracia
 * `enforced` es false y no se filtra nada. Si el API falla tampoco se filtra
 * (el API valida igual al guardar). `keepUserId` mantiene visible al cleaner
 * ya asignado aunque no sea elegible, para no "perderlo" en la edicion.
 */
export function useEligibleAssignees(
    communityId: Ref<string | null | undefined>,
    keepUserId?: Ref<string | null | undefined>,
) {
    const eligibleIds = ref<Set<string> | null>(null);
    const enforced = ref(false);
    const loading = ref(false);
    let requestSeq = 0;

    const refresh = async () => {
        const id = communityId.value ? String(communityId.value) : '';
        const seq = ++requestSeq;
        if (!id) {
            eligibleIds.value = null;
            enforced.value = false;
            return;
        }
        loading.value = true;
        const response = await CleanerZonesServices.getEligibleAssignees(id);
        if (seq !== requestSeq) return;
        loading.value = false;
        enforced.value = Boolean(response?.enforced);
        eligibleIds.value = response?.enforced
            ? new Set(response.data.map((u) => String(u.id)))
            : null;
    };

    watch(communityId, refresh, { immediate: true });

    const isAllowed = (userId: string | number | null | undefined) => {
        if (!eligibleIds.value || userId === null || userId === undefined || userId === '') return true;
        const id = String(userId);
        return eligibleIds.value.has(id) || (Boolean(keepUserId?.value) && String(keepUserId!.value) === id);
    };

    const filterAssignees = <T extends { id: string | number }>(list: T[]): T[] =>
        eligibleIds.value ? list.filter((u) => isAllowed(u.id)) : list;

    return { eligibleIds, enforced, loading, isAllowed, filterAssignees, refresh };
}
