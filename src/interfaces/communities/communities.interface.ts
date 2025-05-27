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
    user: User;
    company: Company;
}

export interface NewCommunity {
    communityName: string;
    userId: string;
    companyId: string;
<<<<<<< HEAD
/*     id:string */
=======
>>>>>>> 2b926e5a844007937b043a854ffb7d83b30c19e6
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
