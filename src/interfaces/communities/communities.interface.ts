import type { MetaPagination } from "../meta-pagination.interface";


export interface Communities {
    data: Community[];
    meta: MetaPagination;
}

export interface Community {
    id: string;
    communityName: string;
    showInReports: boolean;
    /** El complex exige usar cera (wax) en sus servicios. */
    useWax?: boolean;
    /** Las comunidades inactivas no aparecen al crear servicios. */
    isActive: boolean;
    /** Vendedor asociado que consiguió el complex (null si no lo trajo nadie). */
    vendorUserId: string | null;
    vendorUser: { id: string; name: string } | null;
    vendorCommissionRate: string | null;
    /** TypeORM devuelve las columnas decimal como string. */
    latitude: string | null;
    longitude: string | null;
    // Contactos del complex que el cleaner puede llamar desde la app.
    maintenanceSupervisorName?: string | null;
    maintenanceSupervisorPhone?: string | null;
    technicianName?: string | null;
    technicianPhone?: string | null;
    managerContactName?: string | null;
    managerContactPhone?: string | null;
    showContactsInApp?: boolean;
    /** Managers y supervisores no pueden elegir hora en los servicios (quedan a las 00:00). */
    lockScheduleForStaff?: boolean;
    createdAt: Date;
    updatedAt: Date;
    managerUser: User | null;
    supervisorUser: User | null;
    company: Company;
}

export interface NewCommunity {
    communityName: string;
    showInReports: boolean;
    useWax?: boolean;
    isActive?: boolean;
    vendorUserId?: string | null;
    latitude?: number | null;
    longitude?: number | null;
    maintenanceSupervisorName?: string | null;
    maintenanceSupervisorPhone?: string | null;
    technicianName?: string | null;
    technicianPhone?: string | null;
    managerContactName?: string | null;
    managerContactPhone?: string | null;
    showContactsInApp?: boolean;
    lockScheduleForStaff?: boolean;
    managerUserId: string | null;
    supervisorUserId: string | null;
    companyId: string;
    id: string;
}

/** Contactos del complex (datos libres, no usuarios del sistema). */
export interface CommunityContacts {
    maintenanceSupervisorName: string | null;
    maintenanceSupervisorPhone: string | null;
    technicianName: string | null;
    technicianPhone: string | null;
    managerContactName: string | null;
    managerContactPhone: string | null;
    showContactsInApp: boolean;
}

export const emptyCommunityContacts = (): CommunityContacts => ({
    maintenanceSupervisorName: null,
    maintenanceSupervisorPhone: null,
    technicianName: null,
    technicianPhone: null,
    managerContactName: null,
    managerContactPhone: null,
    showContactsInApp: false,
});

export const pickCommunityContacts = (source: Partial<CommunityContacts>): CommunityContacts => ({
    maintenanceSupervisorName: source.maintenanceSupervisorName ?? null,
    maintenanceSupervisorPhone: source.maintenanceSupervisorPhone ?? null,
    technicianName: source.technicianName ?? null,
    technicianPhone: source.technicianPhone ?? null,
    managerContactName: source.managerContactName ?? null,
    managerContactPhone: source.managerContactPhone ?? null,
    showContactsInApp: source.showContactsInApp ?? false,
});

export interface Company {
    id: string;
    companyName: string;
}

export interface User {
    id: string;
    name: string;
    email: string;
    phoneNumber: string;
    role: Role;
}

export interface Role {
    id: string;
    name: Name;
}

export enum Name {
    Manager = "Manager",
    SuperAdmin = "super_admin",
}
