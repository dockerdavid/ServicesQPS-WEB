import type { MetaPagination } from "../meta-pagination.interface";

export interface Companies {
    data: Company[];
    meta: MetaPagination;
}

export interface Company {
    id: string;
    companyName: string;
    createdAt: Date;
    updatedAt: Date;
}

