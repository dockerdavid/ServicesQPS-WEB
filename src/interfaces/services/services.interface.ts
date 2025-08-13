import type { MetaPagination } from "../meta-pagination.interface";

export interface Services {
    data: Service[];
    meta: MetaPagination;
}

export interface Service {
    id: string;
    date: string;
    schedule: string;
    comment: null | string;
    userComment: null | string;
    unitySize: string;
    unitNumber: string;
    communityId: string;
    typeId: string;
    statusId: string;
    userId: string;
    createdAt: Date;
    updatedAt: Date;
    community: Community;
    type: Type;
    status: Status;
    user: User;
    extrasByServices: ExtrasByService[];
    totalCleaner: number;
    totalParner: number;
    total: number;
}

export interface ExternalService {
    id: string;
    date: string;
    schedule: string;
    comment: null | string;
    userComment: null | string;
    unitySize: string;
    unitNumber: string;
    communityId: string;
    typeId: string;
    statusId: string;
    userId: string;
    createdAt: string;
    updatedAt: string;
    community: Community;
    type: {
        cleaningType: string;
        price: string;
        commission: string;
    };
    status: Status;
    user: User;
    extras: string;
    extrasPrice: string;
    extrasCommission: string;
}

export interface Community {
    id: string;
    communityName: CommunityName;
    userId: string;
    companyId: string;
    createdAt: Date;
    updatedAt: Date;
}

export enum CommunityName {
    EditadoOk = "Editado ok",
    MosbyCitrusRidge = "Mosby Citrus Ridge",
    SoleilBlue = "Soleil Blue",
}

export interface ExtrasByService {
    id: string;
    serviceId: string;
    extraId: string;
    createdAt: Date;
    updatedAt: Date;
    extra: Extra;
}

export interface Status {
    id: string;
    statusName: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface Type {
    id: string;
    description: string;
    cleaningType: CleaningType;
    price: number;
    commission: string;
    communityId: string;
    createdAt: Date;
    updatedAt: Date;
}

export enum CleaningType {
    DeepClean = "Deep Clean",
    Housekeeping = "Housekeeping ",
    TouchupClean = "Touchup Clean",
}

export interface User {
    id: string;
    name: string;
    email: string;
    phoneNumber: string;
    roleId: string;
    password: string;
    createdAt: Date;
    updatedAt: Date;
}

export default interface CreateService {
    date: string;
    schedule?: string;
    comment?: string;
    userComment?: string;
    unitySize: string;
    unitNumber: string;
    communityId: string;
    typeId: string;
    statusId: string;
    userId?: string;
    extraId?: string[];
}

export interface EditService {
    date: string;
    schedule?: string;
    comment?: string;
    userComment?: string;
    unitySize: string;
    unitNumber: string;
    communityId: string;
    typeId: string;
    statusId: string;
    userId?: string;
    extraId?: string[];
}

export interface TypeByCommunity {
    id: string;
    description: string;
    cleaningType: string;
    price: number;
    commission: string;
    communityId: string;
    createdAt: Date;
    updatedAt: Date;
    community: Community;
}


export interface ExtraByService {
    id: string;
    serviceId: string;
    extraId: string;
    createdAt: Date;
    updatedAt: Date;
    extra: Extra;
}

export interface Extra {
    id: string;
    item: string;
    itemPrice: number;
    commission: number;
    createdAt: Date;
    updatedAt: Date;
}

export class ServiceAdapter {

    static internalToExternal(service: Service) {

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

    static internalToExternal(service: Service) {
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
            extras: extrasByServices.map((extra: any) => extra?.extra?.item ?? '').join(' / '),
            type: {
                cleaningType: service?.type?.cleaningType ?? '',
                price: service?.type?.price != null ? `$ ${service.type.price.toFixed(2)}` : '$ 0.00',
                commission: service?.type?.commission != null ? `$ ${service.type.commission}` : '$ 0.00',
            },
            status: service.status ?? '',
            user: service.user ?? '',
            extrasPrice: extrasByServices
                .map((extraService: any) => `$${extraService?.extra?.itemPrice?.toFixed(2) ?? '0.00'}`)
                .join('; '),
            extrasCommission: extrasByServices
                .map((extraService: any) => `$${extraService?.extra?.commission?.toFixed(2) ?? '0.00'}`)
                .join('; '),
        };
    }

}

export class CleanerServiceAdapterExternal {
    static externalToInternal(externalService: ExternalService): EditService {
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

    static internalToExternal(service: Service) {
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