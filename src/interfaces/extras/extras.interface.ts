import type { MetaPagination } from "../meta-pagination.interface";

export interface Extras {
    data: Extra[];
    meta: MetaPagination;
}

export interface Extra {
    id:         string;
    item:       string;
    itemPrice:  number;
    commission: string;
    createdAt:  Date;
    updatedAt:  Date;
}


