import type { MetaPagination } from "../meta-pagination.interface";

export interface Extras {
    data: Extra[];
    meta: MetaPagination;
}

export interface Extra {
    id: string;
    item: string;
    itemPrice: number;
    commission: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface NewExtra {
    item: string;
    itemPrice: number;
    commission: number;
}


export class ExtraAdapter {
    static fromExternalToInternal(externalExtra: Extra) {
        return {
            id: externalExtra.id,
            item: externalExtra.item,
            itemPrice: `$${externalExtra.itemPrice.toFixed(2)}`,
            commission: `$${externalExtra.commission}`,
            createdAt: externalExtra.createdAt,
            updatedAt: externalExtra.updatedAt,
        }
    }
}