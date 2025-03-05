import type { MetaPagination } from "../meta-pagination.interface";

export interface Costs {
    data: Cost[];
    meta: MetaPagination;
}

export interface Cost {
    id:          string;
    date:        Date;
    description: string;
    amount:      string;
    createdAt:   Date;
    updatedAt:   Date;
}

