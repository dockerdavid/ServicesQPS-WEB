import type { MetaPagination } from "../meta-pagination.interface";

export interface Costs {
    data: Cost[];
    meta: MetaPagination;
}

export interface Cost {
    id:          string;
    date:        Date;
    category:    string;
    description: string;
    amount:      string;
    createdAt:   Date;
    updatedAt:   Date;
}

export interface NewCost {
    date:        string;
    category?:   string;
    description: string;
    amount:      string;
}

export class CostAdapter {
    static fromExternalToInternal(externalCost: Cost) {
        return {
            id: externalCost.id,
            date: externalCost.date,
            category: externalCost.category,
            description: externalCost.description,
            amount: `$${externalCost.amount}`,
            createdAt: externalCost.createdAt,
            updatedAt: externalCost.updatedAt,
        }
    }
}