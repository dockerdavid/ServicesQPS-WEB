export interface CalendarReviewItem {
    value: number;
    reviewItemId: string;
    reviewItemName: string;
    reviewClassId: string;
    reviewClassName: string;
}

export interface CalendarInterface {
    id:          string;
    date:        Date;
    schedule:    string;
    comment:     string;
    userComment: string;
    unitySize:   string;
    unitNumber:  string;
    communityId: string;
    typeId:      string;
    statusId:    string;
    userId:      string;
    createdAt:   Date;
    updatedAt:   Date;
    community:   Community | null;
    type:        Type;
    status:      Status;
    user:        User;
    reviews?:    CalendarReviewItem[];
}

export interface Community {
    id:            string;
    communityName: string;
    userId:        string;
    companyId:     string;
    createdAt:     Date;
    updatedAt:     Date;
}

export interface Status {
    id:         string;
    statusName: string;
    createdAt:  Date;
    updatedAt:  Date;
}

export interface Type {
    id:           string;
    description:  string;
    cleaningType: string;
    price:        number;
    commission:   string;
    communityId:  string;
    createdAt:    Date;
    updatedAt:    Date;
}

export interface User {
    id:          string;
    name:        string;
    email:       string;
    phoneNumber: string;
    roleId:      string;
    createdAt:   Date;
    updatedAt:   Date;
}
