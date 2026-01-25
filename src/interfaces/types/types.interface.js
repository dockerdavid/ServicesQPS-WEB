export class TypesAdapter {
    static fromExternalToInternal(externalType) {
        return {
            id: externalType.id,
            description: externalType.description,
            cleaningType: externalType.cleaningType,
            price: `$${externalType.price.toFixed(2)}`,
            commission: `$${externalType.commission}`,
            communityId: externalType.communityId,
            createdAt: externalType.createdAt,
            updatedAt: externalType.updatedAt,
            community: externalType.community,
        };
    }
}
