/**
 * Elimina las propiedades `updatedAt` y `createdAt` de un objeto si existen.
 * @param obj - El objeto del cual se eliminarán las propiedades.
 * @returns El objeto sin las propiedades `updatedAt` y `createdAt`.
 */
export function removeTimestamps(obj) {
    const { updatedAt, createdAt, ...rest } = obj;
    return rest;
}
