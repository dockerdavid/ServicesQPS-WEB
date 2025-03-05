import type { MetaPagination } from "../meta-pagination.interface";

export interface Types {
    data: Datum[];
    meta: MetaPagination;
}

export interface Datum {
    id:           string;
    description:  string;
    cleaningType: string;
    price:        number;
    commission:   string;
    communityId:  string;
    createdAt:    Date;
    updatedAt:    Date;
    community:    Community;
}



export interface Community {
    id:            string;
    communityName: string;
}
