/**
 * Extrae lat/lng de lo que el usuario tenga a mano: un link de Google Maps
 * (en cualquiera de sus formatos), uno de Apple Maps, o un par «lat, lng»
 * copiado. Devuelve null si no reconoce nada valido.
 */
export function extraerCoordenadas(texto: string): { lat: number; lng: number } | null {
    const t = (texto ?? '').trim();
    if (!t) return null;

    const patrones = [
        /@(-?\d{1,3}\.\d+),(-?\d{1,3}\.\d+)/,                    // /maps/@28.53,-81.37,17z
        /!3d(-?\d{1,3}\.\d+)!4d(-?\d{1,3}\.\d+)/,                // formato largo de Google
        /[?&]q=(-?\d{1,3}\.\d+),\s*(-?\d{1,3}\.\d+)/,            // ?q=28.53,-81.37
        /[?&]query=(-?\d{1,3}\.\d+),\s*(-?\d{1,3}\.\d+)/,        // ?api=1&query=28.53,-81.37
        /[?&]destination=(-?\d{1,3}\.\d+),\s*(-?\d{1,3}\.\d+)/,  // ?api=1&destination=...
        /[?&]ll=(-?\d{1,3}\.\d+),\s*(-?\d{1,3}\.\d+)/,           // Apple Maps ?ll=
        /^(-?\d{1,3}(?:\.\d+)?)\s*,\s*(-?\d{1,3}(?:\.\d+)?)$/,   // «28.53, -81.37»
    ];

    for (const patron of patrones) {
        const m = t.match(patron);
        if (m) {
            const lat = Number(m[1]);
            const lng = Number(m[2]);
            if (Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180) {
                return { lat, lng };
            }
        }
    }

    return null;
}
