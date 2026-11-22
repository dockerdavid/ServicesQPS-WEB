import type { MetaPagination } from "../meta-pagination.interface";

export interface NewsAudienceUser {
    id: string;
    roleId: string;
}

export interface News {
    id: string;
    title: string;
    body: string;
    imageUrl: string | null;
    /** null = todos los usuarios de la app */
    audienceRoles: string[] | null;
    /** Usuarios específicos: si un rol tiene elegidos, de ese rol solo ellos la ven. */
    audienceUsers?: NewsAudienceUser[] | null;
    isPublished: boolean;
    publishedAt: string | null;
    createdByUserId: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface NewsList {
    data: News[];
    meta: MetaPagination;
}

export interface NewsPayload {
    title?: string;
    body?: string;
    imageUrl?: string | null;
    audienceRoles?: string[] | null;
    audienceUserIds?: string[] | null;
    isPublished?: boolean;
}

/** Roles que se pueden elegir como audiencia (mismo mapeo que role-routes.ts). */
export const NEWS_AUDIENCE_OPTIONS = [
    { label: 'Cleaner', value: '4' },
    { label: 'QA', value: '7' },
    { label: 'Manager', value: '3' },
    { label: 'Supervisor', value: '6' },
    { label: 'Cheo', value: '5' },
    { label: 'Vendedor', value: '8' },
    { label: 'Super admin', value: '1' },
];

export const formatNewsAudience = (
    audienceRoles: string[] | null | undefined,
    audienceUsers?: NewsAudienceUser[] | null,
) => {
    if (!audienceRoles || audienceRoles.length === 0) return 'All';
    return audienceRoles
        .map((role) => {
            const label = NEWS_AUDIENCE_OPTIONS.find((option) => option.value === String(role))?.label ?? `Role ${role}`;
            const count = (audienceUsers ?? []).filter((u) => String(u.roleId) === String(role)).length;
            return count ? `${label} (${count} ${count === 1 ? 'usuario' : 'usuarios'})` : label;
        })
        .join(', ');
};

/** Convierte la ruta relativa que devuelve la API (/uploads/news/x.jpg) en URL absoluta. */
export const resolveNewsImageUrl = (imageUrl: string | null | undefined) => {
    if (!imageUrl) return '';
    if (/^https?:\/\//i.test(imageUrl)) return imageUrl;
    const baseUrl = ((import.meta.env.VITE_API_URL as string) ?? '').replace(/\/$/, '');
    return `${baseUrl}${imageUrl.startsWith('/') ? '' : '/'}${imageUrl}`;
};
