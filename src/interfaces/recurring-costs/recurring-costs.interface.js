export class RecurringCostAdapter {
    static fromExternalToInternal(externalCost) {
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
