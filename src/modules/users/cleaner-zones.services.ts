import { apiServicesQps } from "../../api/api";

/** GeoJSON con coordenadas [lng, lat]. */
export interface ZoneFeatureCollection {
    type: 'FeatureCollection';
    features: Array<{
        type: 'Feature';
        properties: Record<string, unknown>;
        geometry: { type: 'Polygon'; coordinates: number[][][] } | { type: 'MultiPolygon'; coordinates: number[][][][] };
    }>;
}

export interface CleanerZoneStatus {
    /** false = periodo de gracia: aparecen todas las cleaners. */
    enforced: boolean;
    /** YYYY-MM-DD (Nueva York) desde el que se aplica. */
    enforceFrom: string;
}

export interface CleanerWorkZone extends CleanerZoneStatus {
    userId: string;
    communityIds: string[];
    companyIds: string[];
    zones: ZoneFeatureCollection;
    hasWorkZone: boolean;
}

export interface EligibleAssignee {
    id: string;
    name: string;
    roleId: string;
    hasWorkZone: boolean;
    eligible: boolean;
}

export interface EligibleAssigneesResponse extends CleanerZoneStatus {
    communityId: string;
    data: EligibleAssignee[];
}

export class CleanerZonesServices {
    static async getStatus(): Promise<CleanerZoneStatus | null> {
        try {
            const { data } = await apiServicesQps.get<CleanerZoneStatus>('/users/cleaner-zones/status');
            return data;
        } catch {
            return null;
        }
    }

    /** null si el API falla: en ese caso los selectores no filtran (el API valida igual). */
    static async getEligibleAssignees(communityId: string): Promise<EligibleAssigneesResponse | null> {
        try {
            const { data } = await apiServicesQps.get<EligibleAssigneesResponse>(
                `/users/eligible-cleaners?communityId=${encodeURIComponent(communityId)}`,
            );
            return data;
        } catch {
            return null;
        }
    }

    /** Lote para el balanceador del calendario. null si el API falla. */
    static async getEligibleByCommunities(communityIds: string[]): Promise<(CleanerZoneStatus & { eligibleByCommunity: Record<string, string[]> }) | null> {
        try {
            const { data } = await apiServicesQps.get(
                `/users/eligible-cleaners/by-community?communityIds=${encodeURIComponent(communityIds.join(','))}`,
            );
            return data;
        } catch {
            return null;
        }
    }

    static async getWorkZone(userId: string): Promise<CleanerWorkZone> {
        const { data } = await apiServicesQps.get<CleanerWorkZone>(`/users/${userId}/work-zone`);
        return data;
    }

    static async updateWorkZone(
        userId: string,
        payload: { communityIds: string[]; companyIds: string[]; zones: ZoneFeatureCollection | null },
    ): Promise<CleanerWorkZone> {
        const { data } = await apiServicesQps.patch<CleanerWorkZone>(`/users/${userId}/work-zone`, payload);
        return data;
    }
}

/** "2026-12-16" -> "16/12". */
export const formatEnforceFrom = (enforceFrom?: string | null) => {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(enforceFrom ?? '');
    return m ? `${m[3]}/${m[2]}` : '16/12';
};
