export class ExtraAdapter {
    static fromExternalToInternal(externalExtra) {
        return {
            id: externalExtra.id,
            item: externalExtra.item,
            itemPrice: `$${externalExtra.itemPrice.toFixed(2)}`,
            commission: `$${Number(externalExtra.commission).toFixed(2)}`,
            createdAt: externalExtra.createdAt,
            updatedAt: externalExtra.updatedAt,
        };
    }
}
