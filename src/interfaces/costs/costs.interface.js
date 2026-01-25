export class CostAdapter {
    static fromExternalToInternal(externalCost) {
        return {
            id: externalCost.id,
            date: externalCost.date,
            description: externalCost.description,
            amount: `$${externalCost.amount}`,
            createdAt: externalCost.createdAt,
            updatedAt: externalCost.updatedAt,
        };
    }
}
