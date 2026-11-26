import type { MetaPagination } from "../meta-pagination.interface";

export interface Users {
    data: User[];
    meta: MetaPagination;
}

export interface User {
    id:          string;
    name:        string;
    email:       string;
    phoneNumber: string;
    roleId:      string;
    isActive:    boolean;
    /** Cleaners: tiene zona de trabajo (comunidades, compañías o geocerca). */
    hasWorkZone?: boolean;
    createdAt:   Date;
    role:        Role;
    /** Un admin pidió que cree una clave nueva (pendiente). */
    mustChangePassword?: boolean;
}

export interface Role {
    id:   string;
    name: string;
}

export interface NewUser {
    name:        string;
    email:       string;
    phoneNumber: string;
    roleId:      string;
    password: string
}


export interface UserRoles {
    id:        string;
    name:      string;
    createdAt: Date;
    updatedAt: Date;
}

