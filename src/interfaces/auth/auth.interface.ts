export interface AuthResponse {
    token: string;
    id:    string;
    email: string;
    name?: string;
    mustChangePassword?: boolean;
}
