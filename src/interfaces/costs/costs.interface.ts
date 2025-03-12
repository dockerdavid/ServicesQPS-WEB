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

export interface NewCost {
    date:        string;
    description: string;
    amount:      string;
}

export class CostAdapter {
    static fromExternalToInternal(externalCost: Cost) {
        return {
            id: externalCost.id,
            date: externalCost.date,
            description: externalCost.description,
            amount: `$${externalCost.amount}`,
            createdAt: externalCost.createdAt,
            updatedAt: externalCost.updatedAt,
        }
    }
}