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
    qaStartedAt?: string | null;
    kdsDay?:     'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | null;
    kdsOrder?:   number | null;
    kdsWeekOf?:  string | null;
    qaFlagged?:  boolean;
    assignmentExpiredAt?: string | null;
    refreshCount?: number | null;
    /** Fotos de la ultima revision de QA (0 si no mando fotos). */
    refreshPhotosCount?: number | null;
}

/** Respuesta de POST /reviews/photos/upload. */
export interface RefreshPhotoUpload {
    photoPath: string;
    url: string;
}

/** Ronda de refresh por fotos (GET /reviews/service/:id/refresh-photos). */
export interface RefreshPhotosRound {
    round: number;
    createdAt: string;
    qaUser: { id: string; name: string } | null;
    message: string | null;
    photos: Array<{ id: string; url: string }>;
}

/** La API puede devolver la URL relativa (/uploads/...) si no tiene base publica. */
export const resolveApiFileUrl = (url: string | null | undefined): string => {
    if (!url) return '';
    if (/^(https?:|blob:|data:)/i.test(url)) return url;
    const baseUrl = ((import.meta.env.VITE_API_URL as string) ?? '').replace(/\/$/, '');
    return `${baseUrl}${url.startsWith('/') ? '' : '/'}${url}`;
};

export interface Community {
    id:            string;
    communityName: string;
    useWax?:       boolean;
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
