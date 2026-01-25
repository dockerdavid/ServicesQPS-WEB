export var CommunityName;
(function (CommunityName) {
    CommunityName["EditadoOk"] = "Editado ok";
    CommunityName["MosbyCitrusRidge"] = "Mosby Citrus Ridge";
    CommunityName["SoleilBlue"] = "Soleil Blue";
})(CommunityName || (CommunityName = {}));
export var CleaningType;
(function (CleaningType) {
    CleaningType["DeepClean"] = "Deep Clean";
    CleaningType["Housekeeping"] = "Housekeeping ";
    CleaningType["TouchupClean"] = "Touchup Clean";
})(CleaningType || (CleaningType = {}));
export class ServiceAdapter {
    static internalToExternal(service) {
        const extrasByServices = service.extrasByServices || [];
        return {
            id: service.id ?? '',
            date: service.date ?? '',
            schedule: service.schedule ?? '',
            comment: service.comment ?? '',
            userComment: service.userComment ?? '',
            unitySize: service.unitySize ?? '',
            unitNumber: service.unitNumber ?? '',
            communityId: service.communityId ?? '',
            typeId: service.typeId ?? '',
            statusId: service.statusId ?? '',
            userId: service.userId ?? '',
            createdAt: service.createdAt ?? '',
            updatedAt: service.updatedAt ?? '',
            community: service.community ?? '',
            extras: extrasByServices.map(extra => extra?.extra?.item ?? '').join('; '),
            type: {
                cleaningType: service?.type?.cleaningType ?? '',
                price: service?.type?.price != null ? `$ ${service.type.price.toFixed(2)}` : '$ 0.00',
                commission: service?.type?.commission != null ? `$ ${service.type.commission}` : '$ 0.00',
            },
            status: service.status ?? '',
            user: service.user ?? '',
            extrasPrice: extrasByServices
                .map(extraService => `$${extraService?.extra?.itemPrice?.toFixed(2) ?? '0.00'}`)
                .join('; '),
            extrasCommission: extrasByServices
                .map(extraService => `$${extraService?.extra?.commission?.toFixed(2) ?? '0.00'}`)
                .join('; '),
        };
    }
}
export class CleanerServiceAdapter {
    static internalToExternal(service) {
        const extrasByServices = service.extrasByServices || [];
        return {
            id: service.id ?? '',
            date: service.date ?? '',
            schedule: service.schedule ?? '',
            comment: service.comment ?? '',
            userComment: service.userComment ?? '',
            unitySize: service.unitySize ?? '',
            unitNumber: service.unitNumber ?? '',
            communityId: service.communityId ?? '',
            typeId: service.typeId ?? '',
            statusId: service.statusId ?? '',
            userId: service.userId ?? '',
            createdAt: service.createdAt ?? '',
            updatedAt: service.updatedAt ?? '',
            community: service.community ?? '',
            extras: extrasByServices.map((extra) => extra?.extra?.item ?? '').join(' / '),
            type: {
                cleaningType: service?.type?.cleaningType ?? '',
                price: service?.type?.price != null ? `$ ${service.type.price.toFixed(2)}` : '$ 0.00',
                commission: service?.type?.commission != null ? `$ ${service.type.commission}` : '$ 0.00',
            },
            status: service.status ?? '',
            user: service.user ?? '',
            extrasPrice: extrasByServices
                .map((extraService) => `$${extraService?.extra?.itemPrice?.toFixed(2) ?? '0.00'}`)
                .join('; '),
            extrasCommission: extrasByServices
                .map((extraService) => `$${extraService?.extra?.commission?.toFixed(2) ?? '0.00'}`)
                .join('; '),
        };
    }
}
export class CleanerServiceAdapterExternal {
    static externalToInternal(externalService) {
        return {
            date: externalService.date,
            schedule: externalService.schedule,
            comment: externalService.comment || undefined,
            userComment: externalService.userComment || undefined,
            unitySize: externalService.unitySize,
            unitNumber: externalService.unitNumber,
            communityId: externalService.communityId,
            typeId: externalService.typeId,
            statusId: externalService.statusId,
            userId: externalService.userId || undefined,
            extraId: externalService.extras ? externalService.extras.split('; ').map(extra => extra.trim()) : [],
        };
    }
}
export class ManagerServiceAdapter {
    static internalToExternal(service) {
        const extrasByServices = service.extrasByServices || [];
        return {
            id: service.id ?? '',
            date: service.date ?? '',
            schedule: service.schedule ?? '',
            comment: service.comment ?? '',
            userComment: service.userComment ?? '',
            unitySize: service.unitySize ?? '',
            unitNumber: service.unitNumber ?? '',
            communityId: service.communityId ?? '',
            typeId: service.typeId ?? '',
            statusId: service.statusId ?? '',
            userId: service.userId ?? '',
            createdAt: service.createdAt ?? '',
            updatedAt: service.updatedAt ?? '',
            community: service.community ?? '',
            extras: extrasByServices.map(extra => extra?.extra?.item ?? '').join(' / '),
            type: {
                cleaningType: service?.type?.cleaningType ?? '',
                price: service?.type?.price != null ? `$ ${service.type.price.toFixed(2)}` : '$ 0.00',
                commission: service?.type?.commission != null ? `$ ${service.type.commission}` : '$ 0.00',
            },
            status: service.status ?? '',
            user: service.user ?? '',
            extrasPrice: extrasByServices
                .map(extraService => `$${extraService?.extra?.itemPrice?.toFixed(2) ?? '0.00'}`)
                .join('; '),
            extrasCommission: extrasByServices
                .map(extraService => `$${extraService?.extra?.commission?.toFixed(2) ?? '0.00'}`)
                .join('; '),
        };
    }
}
