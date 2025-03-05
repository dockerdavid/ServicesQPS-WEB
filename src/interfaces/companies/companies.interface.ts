import type { MetaPagination } from "../meta-pagination.interface";

export interface Companies {
    data: Companie[];
    meta: MetaPagination;
}

export interface Companie {
    id:          string;
    companyName: string;
    createdAt:   Date;
    updatedAt:   Date;
}

