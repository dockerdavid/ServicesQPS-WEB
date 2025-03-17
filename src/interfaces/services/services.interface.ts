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

        return {
            id: service.id,
            date: service.date,
            schedule: service.schedule,
            comment: service.comment,
            userComment: service.userComment,
            unitySize: service.unitySize,
            unitNumber: service.unitNumber,
            communityId: service.communityId,
            typeId: service.typeId,
            statusId: service.statusId,
            userId: service.userId,
            createdAt: service.createdAt,
            updatedAt: service.updatedAt,
            community: service.community,
            extras: service.extrasByServices.map(extra => extra.extra.item).join('; '),
            type: {
                cleaningType: service.type.cleaningType,
                price: `$ ${service.type.price.toFixed(2)}`,
                commission: `$ ${service.type.commission}`,
            },
            status: service.status,
            user: service.user,
            extrasPrice: service.extrasByServices
                .map(extraService => `$${extraService.extra.itemPrice.toFixed(2)}`)
                .join('; '),

            extrasCommission: service.extrasByServices
                .map(extraService => `$${extraService.extra.commission.toFixed(2)}`)
                .join('; '),
            totalCleaner: `$ ${service.totalCleaner.toFixed(2)}`,
            totalParner: `$ ${service.totalParner.toFixed(2)}`,
            total: `$ ${service.total.toFixed(2)}`,
        }

    }

}