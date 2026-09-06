import type { MetaPagination } from "../meta-pagination.interface";


export interface Communities {
    data: Community[];
    meta: MetaPagination;
}

export interface Community {
    id: string;
    communityName: string;
    showInReports: boolean;
    /** Las comunidades inactivas no aparecen al crear servicios. */
    isActive: boolean;
    /** Vendedor asociado que consiguió el complex (null si no lo trajo nadie). */
    vendorUserId: string | null;
    vendorUser: { id: string; name: string } | null;
    vendorCommissionRate: string | null;
    /** TypeORM devuelve las columnas decimal como string. */
    latitude: string | null;
    longitude: string | null;
    createdAt: Date;
    updatedAt: Date;
    managerUser: User | null;
    supervisorUser: User | null;
    company: Company;
}

export interface NewCommunity {
    communityName: string;
    showInReports: boolean;
    isActive?: boolean;
    vendorUserId?: string | null;
    latitude?: number | null;
    longitude?: number | null;
    managerUserId: string | null;
    supervisorUserId: string | null;
    companyId: string;
    id: string;
}

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
