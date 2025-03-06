import type { MetaPagination } from "../meta-pagination.interface";

export interface Services {
    data: Service[];
    meta: MetaPagination;
}

export interface Service {
    id: string;
    date: Date;
    schedule: null;
    comment: null;
    userComment: null | string;
    unitySize: string;
    unitNumber: string;
    communityId: string;
    typeId: string;
    statusId: string;
    userId: null | string;
    createdAt: Date;
    updatedAt: Date;
    community: Community;
    type: Type;
    status: Status;
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
    AltonSerenoa = "Alton Serenoa",
    PrimeLuxuryApartments = "Prime Luxury Apartments",
    ZenApartments = "Zen Apartments",
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
    Housekeeping = "Housekeeping",
}

export default interface CreateService {
    date: string;
    schedule: string;
    comment: string;
    userComment: string;
    unitySize: string;
    unitNumber: string;
    communityId: string;
    typeId: string;
    statusId: string;
    userId: string;
    extraId: string;
}
