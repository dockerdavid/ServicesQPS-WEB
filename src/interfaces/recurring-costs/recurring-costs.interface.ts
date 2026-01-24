import type { MetaPagination } from "../meta-pagination.interface";

export interface RecurringCosts {
  data: RecurringCost[];
  meta: MetaPagination;
}

export interface RecurringCost {
  id: string;
  description: string;
  amount: string;
  startDate: string;
  endDate: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface NewRecurringCost {
  description: string;
  amount: string;
  startDate: string;
  endDate?: string | null;
  isActive?: boolean;
}

export class RecurringCostAdapter {
  static fromExternalToInternal(externalCost: RecurringCost) {
    return {
      id: externalCost.id,
      description: externalCost.description,
      amount: `$${externalCost.amount}`,
      startDate: externalCost.startDate,
      endDate: externalCost.endDate,
      isActive: externalCost.isActive,
      createdAt: externalCost.createdAt,
      updatedAt: externalCost.updatedAt,
    };
  }
}
