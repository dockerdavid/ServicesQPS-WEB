import type { MetaPagination } from "../meta-pagination.interface";


export interface Communities {
    data: Community[];
    meta: MetaPagination;
}

export interface Community {
    id: string;
    communityName: string;
    createdAt: Date;
    updatedAt: Date;
    managerUser: User | null;
    supervisorUser: User | null;
    company: Company;
}

export interface NewCommunity {
    communityName: string;
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
