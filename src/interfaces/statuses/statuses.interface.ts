import type { MetaPagination } from "../meta-pagination.interface";

export interface Statuses {
    data: Status[];
    meta: MetaPagination;
}

export interface Status {
    id:         string;
    statusName: string;
    createdAt:  Date;
    updatedAt:  Date;
}

