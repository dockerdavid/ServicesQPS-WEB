import type { MetaPagination } from "../meta-pagination.interface";

export interface Types {
    data: Type[];
    meta: MetaPagination;
}

export interface Type {
    id: string;
    description: string;
    cleaningType: string;
    price: number;
    commission: string;
    communityId: string;
    createdAt: Date;
    updatedAt: Date;
    community: Community;
}



export interface Community {
    id: string;
    communityName: string;
}


export interface NewType {
    description: string;
    cleaningType: string;
    price: number;
    commission: string;
    communityId: string;
}