/** Mensaje legible de un error de axios: usa `message` del API (Nest manda un
 *  string o un arreglo de strings de validacion) y si no hay, el fallback. */
export const getApiErrorMessage = (error: any, fallback = 'Ocurrio un error inesperado.'): string => {
  const message = error?.response?.data?.message;
  if (Array.isArray(message) && message.length) return message.join('. ');
  if (typeof message === 'string' && message.trim()) return message;
  if (error instanceof Error && error.message && !/^AxiosError|Request failed with status code/.test(error.message)) {
    return error.message;
  }
  return fallback;
};
