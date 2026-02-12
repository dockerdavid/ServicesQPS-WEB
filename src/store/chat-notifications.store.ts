import { defineStore } from 'pinia';

import type { ServiceChatNotificationPayload } from '../interfaces/chat/service-chat-notification.interface';

export interface ChatNotificationsState {
  countsByServiceId: Record<string, number>;
  lastNotifiedServiceId: string | null;
  lastNotificationByServiceId: Record<
    string,
    ServiceChatNotificationPayload & { receivedAt: string }
  >;
}

const STORAGE_MAX_COUNT = 999;

export const useChatNotificationsStore = defineStore('chatNotifications', {
  state: (): ChatNotificationsState => ({
    countsByServiceId: {},
    lastNotifiedServiceId: null,
    lastNotificationByServiceId: {},
  }),

  getters: {
    totalCount: (state): number => {
      return Object.values(state.countsByServiceId).reduce((sum, value) => {
        const safeValue = typeof value === 'number' && Number.isFinite(value) ? value : 0;
        return sum + safeValue;
      }, 0);
    },

    countForService: (state) => {
      return (serviceId: string): number => {
        if (!serviceId) return 0;
        return state.countsByServiceId[serviceId] ?? 0;
      };
    },
  },

  actions: {
    add(payload: ServiceChatNotificationPayload) {
      const serviceId = payload?.serviceId;
      if (!serviceId) {
        return;
      }

      const current = this.countsByServiceId[serviceId] ?? 0;
      const next = Math.min(STORAGE_MAX_COUNT, current + 1);
      this.countsByServiceId = { ...this.countsByServiceId, [serviceId]: next };
      this.lastNotifiedServiceId = serviceId;
      this.lastNotificationByServiceId = {
        ...this.lastNotificationByServiceId,
        [serviceId]: { ...payload, receivedAt: new Date().toISOString() },
      };
    },

    clearService(serviceId: string) {
      if (!serviceId || !(serviceId in this.countsByServiceId)) {
        return;
      }

      const { [serviceId]: _removed, ...rest } = this.countsByServiceId;
      this.countsByServiceId = rest;
      const { [serviceId]: _metaRemoved, ...metaRest } = this.lastNotificationByServiceId;
      this.lastNotificationByServiceId = metaRest;

      if (this.lastNotifiedServiceId === serviceId) {
        this.lastNotifiedServiceId = Object.keys(rest).slice(-1)[0] ?? null;
      }
    },

    clearAll() {
      this.countsByServiceId = {};
      this.lastNotifiedServiceId = null;
      this.lastNotificationByServiceId = {};
    },
  },

  persist: true,
});
