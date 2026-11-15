import type { ServiceChatMessage } from '../interfaces/chat/service-chat.interface';

/**
 * El chat siempre se muestra en orden DESC: el mensaje mas reciente arriba.
 * createdAt viene con precision de segundos, asi que el id (autoincremental,
 * bigint serializado como string) desempata mensajes del mismo segundo.
 */
const compareIdsDesc = (a: string, b: string) => {
  const aNumeric = /^\d+$/.test(a);
  const bNumeric = /^\d+$/.test(b);
  if (aNumeric && bNumeric) {
    if (a.length !== b.length) return b.length - a.length;
    return b < a ? -1 : b > a ? 1 : 0;
  }
  return b.localeCompare(a);
};

const toTime = (value: string) => {
  const time = Date.parse(value);
  return Number.isNaN(time) ? 0 : time;
};

export const compareChatMessagesDesc = (a: ServiceChatMessage, b: ServiceChatMessage) => {
  const diff = toTime(b.createdAt) - toTime(a.createdAt);
  if (diff !== 0) return diff;
  return compareIdsDesc(String(a.id), String(b.id));
};

/** Deduplica por id y ordena DESC (mas reciente primero). */
export const sortChatMessagesDesc = (messages: ServiceChatMessage[]) => {
  const byId = new Map<string, ServiceChatMessage>();
  messages.forEach((message) => byId.set(String(message.id), message));
  return Array.from(byId.values()).sort(compareChatMessagesDesc);
};

/** Inserta un mensaje nuevo (socket o envio propio) respetando el orden DESC. */
export const prependChatMessage = (
  messages: ServiceChatMessage[],
  message: ServiceChatMessage,
) => sortChatMessagesDesc([message, ...messages]);
