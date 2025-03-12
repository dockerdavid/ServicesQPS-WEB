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

export class TypesAdapter {
    static fromExternalToInternal(externalType: Type) {
        return {
            id: externalType.id,
            description: externalType.description,
            cleaningType: externalType.cleaningType,
            price: `$${externalType.price.toFixed(2)}`,
            commission: `$${externalType.commission}`,
            communityId: externalType.communityId,
            createdAt: externalType.createdAt,
            updatedAt: externalType.updatedAt,
            community: externalType.community,
        }
    }
}