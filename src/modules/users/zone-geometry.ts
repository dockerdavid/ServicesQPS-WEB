/**
 * Utilidades de la geocerca en la web (mismo criterio que el API:
 * api/src/api/users/cleaner-zone.util.ts). Coordenadas GeoJSON [lng, lat].
 */
export type LngLat = [number, number];

export function pointInRing(point: LngLat, ring: LngLat[]): boolean {
    const [x, y] = point;
    let inside = false;
    const n = ring.length;
    if (n < 3) return false;
    for (let i = 0, j = n - 1; i < n; j = i++) {
        const [xi, yi] = ring[i];
        const [xj, yj] = ring[j];
        if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
    }
    return inside;
}

export interface ZoneCommunity {
    id: string;
    companyId: string | null;
    lat: number | null;
    lng: number | null;
}

export function isCommunityCovered(
    community: ZoneCommunity,
    communityIds: Set<string>,
    companyIds: Set<string>,
    rings: LngLat[][],
): 'community' | 'company' | 'zone' | null {
    if (communityIds.has(community.id)) return 'community';
    if (community.companyId && companyIds.has(community.companyId)) return 'company';
    if (community.lat === null || community.lng === null) return null;
    return rings.some((ring) => pointInRing([community.lng!, community.lat!], ring)) ? 'zone' : null;
}

export const toCoord = (value: unknown): number | null => {
    if (value === null || value === undefined || value === '') return null;
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
};
