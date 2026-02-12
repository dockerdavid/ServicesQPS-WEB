<script setup lang="ts">
import { Button, InputText, Skeleton } from 'primevue';
import { computed, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useToast } from 'primevue/usetoast';

import ServiceChatPanel from '../services/components/ServiceChatPanel.vue';
import { ServiceChatServices } from '../services/service-chat.services';
import type { ServiceChatMessage } from '../../interfaces/chat/service-chat.interface';
import type {
  ServiceChatThread,
  ServiceChatThreads,
} from '../../interfaces/chat/service-chat-threads.interface';
import { useChatNotificationsStore } from '../../store/chat-notifications.store';
import { useUserStore } from '../../store/user.store';
import { resolveRoleKey } from '../../router/role-routes';
import { showToast } from '../../utils/show-toast';

const router = useRouter();
const route = useRoute();
const toast = useToast();
const userStore = useUserStore();
const chatNotificationsStore = useChatNotificationsStore();
const didInitialFetch = ref(false);

const search = ref('');
const threads = ref<ServiceChatThread[]>([]);
const meta = ref<ServiceChatThreads['meta'] | null>(null);
const isLoading = ref(false);
const isLoadingMore = ref(false);
const isSyncing = ref(false);
const page = ref(1);
const take = 150;

const canAccessChatHub = computed(() => {
  const roleKey = resolveRoleKey(userStore.userData?.role?.name, userStore.userData?.roleId);
  return roleKey === 'qa' || roleKey === 'super_admin';
});

const isRoleResolved = computed(() => {
  return Boolean(userStore.userData?.roleId || userStore.userData?.role?.name);
});

const isInitializing = computed(() => !isRoleResolved.value && !didInitialFetch.value);

const selectedServiceId = computed(() => {
  const raw = (route.params as any)?.serviceId;
  if (Array.isArray(raw)) return String(raw[0] ?? '');
  return String(raw ?? '');
});

const filteredThreads = computed(() => {
  const term = search.value.trim().toLowerCase();
  if (!term) return threads.value;

  return threads.value.filter((thread) => {
    const haystack = [
      thread.serviceId,
      thread.communityName ?? '',
      thread.unitNumber ?? '',
      thread.cleanerName ?? '',
    ]
      .join(' ')
      .toLowerCase();

    return haystack.includes(term);
  });
});

const selectedThread = computed(() => {
  if (!selectedServiceId.value) return null;
  return threads.value.find((thread) => thread.serviceId === selectedServiceId.value) ?? null;
});

const threadTitle = (thread: ServiceChatThread) => {
  const community = thread.communityName || 'Service';
  const unit = thread.unitNumber ? ` · Unit ${thread.unitNumber}` : '';
  return `${community}${unit}`;
};

const truncateText = (value: string, maxLength: number) => {
  if (value.length <= maxLength) return value;
  return `${value.slice(0, Math.max(0, maxLength - 3))}...`;
};

const lastMessagePreview = (thread: ServiceChatThread) => {
  const message = thread.lastMessage?.message?.trim() ?? '';
  if (message) return truncateText(message, 96);
  return thread.lastMessage?.hasAttachment ? 'Attachment' : '';
};

const formatTime = (value?: string) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

const notificationCount = (serviceId: string) => {
  return chatNotificationsStore.countForService(serviceId);
};

const openThread = (serviceId: string) => {
  if (!serviceId) return;
  router.push({ name: 'chat', params: { serviceId } });
};

const sortThreadsByLastMessage = (value: ServiceChatThread[]) => {
  return [...value].sort((a, b) => {
    const bTime = Date.parse(b.lastMessage?.createdAt ?? '') || 0;
    const aTime = Date.parse(a.lastMessage?.createdAt ?? '') || 0;
    return bTime - aTime;
  });
};

const mergeThreads = (incoming: ServiceChatThread[]) => {
  const map = new Map<string, ServiceChatThread>();
  threads.value.forEach((thread) => map.set(thread.serviceId, thread));
  incoming.forEach((thread) => map.set(thread.serviceId, thread));
  return Array.from(map.values());
};

const fetchThreads = async ({ reset }: { reset: boolean }) => {
  if (isLoading.value) return;

  if (reset) {
    page.value = 1;
    meta.value = null;
    threads.value = [];
  }

  isLoading.value = true;
  try {
    const result = await ServiceChatServices.getThreads(page.value, take);
    meta.value = result.meta;
    threads.value = sortThreadsByLastMessage(reset ? result.data : mergeThreads(result.data));
  } catch (error) {
    showToast(toast, { severity: 'error', summary: 'Unable to load chats.' });
  } finally {
    isLoading.value = false;
  }
};

const loadMore = async () => {
  if (!meta.value?.hasNextPage || isLoadingMore.value) {
    return;
  }

  isLoadingMore.value = true;
  try {
    page.value += 1;
    const result = await ServiceChatServices.getThreads(page.value, take);
    meta.value = result.meta;
    threads.value = sortThreadsByLastMessage(mergeThreads(result.data));
  } catch (error) {
    showToast(toast, { severity: 'error', summary: 'Unable to load more chats.' });
  } finally {
    isLoadingMore.value = false;
  }
};

const syncLatestThreads = async () => {
  if (isLoading.value || isLoadingMore.value || isSyncing.value) {
    return;
  }

  isSyncing.value = true;
  try {
    const result = await ServiceChatServices.getThreads(1, take);
    meta.value = result.meta;
    threads.value = sortThreadsByLastMessage(mergeThreads(result.data));
  } catch (error) {
    // ignore background sync errors
  } finally {
    isSyncing.value = false;
  }
};

const handlePanelMessage = (message: ServiceChatMessage) => {
  const serviceId = message?.serviceId;
  if (!serviceId) return;

  const idx = threads.value.findIndex((thread) => thread.serviceId === serviceId);
  if (idx === -1) {
    return;
  }

  const current = threads.value[idx];
  const updated: ServiceChatThread = {
    ...current,
    lastMessage: {
      id: message.id,
      userId: message.userId ?? null,
      userName: message.user?.name ?? null,
      message: message.message ?? null,
      hasAttachment: Boolean(message.attachmentPath),
      attachmentType: message.attachmentType ?? null,
      createdAt: message.createdAt,
    },
  };

  const next = [...threads.value];
  next.splice(idx, 1);
  next.unshift(updated);
  threads.value = next;
};

watch(
  () => selectedServiceId.value,
  (serviceId) => {
    if (serviceId) {
      chatNotificationsStore.clearService(serviceId);
    }
  },
  { immediate: true },
);

watch(
  () => chatNotificationsStore.lastNotifiedServiceId,
  async (serviceId) => {
    if (!serviceId) {
      return;
    }

    const meta = chatNotificationsStore.lastNotificationByServiceId[serviceId];
    if (!meta) {
      return;
    }

    const idx = threads.value.findIndex((thread) => thread.serviceId === serviceId);
    if (idx === -1) {
      await syncLatestThreads();
      const nextIdx = threads.value.findIndex((thread) => thread.serviceId === serviceId);
      if (nextIdx === -1) {
        return;
      }

      const current = threads.value[nextIdx];
      const updated: ServiceChatThread = {
        ...current,
        lastMessage: {
          ...current.lastMessage,
          userName: meta.senderName ?? current.lastMessage.userName,
          message: meta.message ?? null,
          hasAttachment: Boolean(meta.hasAttachment),
          attachmentType: current.lastMessage.attachmentType ?? null,
          createdAt: meta.receivedAt,
        },
      };

      const next = [...threads.value];
      next.splice(nextIdx, 1);
      next.unshift(updated);
      threads.value = next;
      return;
    }

    const current = threads.value[idx];
    const updated: ServiceChatThread = {
      ...current,
      lastMessage: {
        ...current.lastMessage,
        userName: meta.senderName ?? current.lastMessage.userName,
        message: meta.message ?? null,
        hasAttachment: Boolean(meta.hasAttachment),
        attachmentType: current.lastMessage.attachmentType ?? null,
        createdAt: meta.receivedAt,
      },
    };

    const next = [...threads.value];
    next.splice(idx, 1);
    next.unshift(updated);
    threads.value = next;
  },
);

watch(
  () => threads.value.length,
  (length) => {
    if (length > 0 && !selectedServiceId.value) {
      openThread(threads.value[0].serviceId);
    }
  },
);

watch(
  () => [isRoleResolved.value, canAccessChatHub.value] as const,
  async ([resolved, allowed]) => {
    if (!resolved) {
      return;
    }

    if (!allowed) {
      router.replace('/notFound');
      return;
    }

    if (!didInitialFetch.value) {
      didInitialFetch.value = true;
      await fetchThreads({ reset: true });
    }
  },
  { immediate: true },
);
</script>

<template>
  <div class="chat-hub">
    <aside class="chat-hub__sidebar">
      <div class="chat-hub__sidebar-header">
        <div class="chat-hub__sidebar-title">
          <h2>Chats</h2>
          <p v-if="meta" class="chat-hub__sidebar-subtitle">
            {{ meta.totalCount }} total
          </p>
        </div>
      </div>

      <div class="chat-hub__search">
        <InputText v-model="search" placeholder="Search chats..." />
      </div>

      <div class="chat-hub__list">
        <div v-if="isLoading || isInitializing" class="chat-hub__skeletons">
          <Skeleton v-for="i in 8" :key="i" height="3.1rem" />
        </div>

        <div v-else-if="filteredThreads.length === 0" class="chat-hub__empty">
          No chats yet.
        </div>

        <template v-else>
          <button
            v-for="thread in filteredThreads"
            :key="thread.serviceId"
            type="button"
            :class="[
              'chat-hub__item',
              { 'chat-hub__item--active': thread.serviceId === selectedServiceId },
            ]"
            @click="openThread(thread.serviceId)"
          >
            <div class="chat-hub__item-main">
              <p class="chat-hub__item-title">{{ threadTitle(thread) }}</p>
              <p class="chat-hub__item-subtitle">
                <span v-if="thread.cleanerName">{{ thread.cleanerName }}</span>
                <span v-if="thread.cleanerName && thread.date"> · </span>
                <span v-if="thread.date">{{ thread.date }}</span>
              </p>
              <p v-if="lastMessagePreview(thread)" class="chat-hub__item-preview">
                {{ lastMessagePreview(thread) }}
              </p>
            </div>

            <div class="chat-hub__item-meta">
              <span class="chat-hub__item-time">
                {{ formatTime(thread.lastMessage?.createdAt) }}
              </span>
              <span v-if="notificationCount(thread.serviceId) > 0" class="chat-hub__item-badge">
                {{ notificationCount(thread.serviceId) }}
              </span>
            </div>
          </button>
        </template>
      </div>

      <div v-if="meta?.hasNextPage" class="chat-hub__footer">
        <Button
          label="Load more"
          icon="pi pi-chevron-down"
          severity="secondary"
          :loading="isLoadingMore"
          :disabled="isLoading"
          @click="loadMore"
        />
      </div>
    </aside>

    <section class="chat-hub__content">
      <div v-if="!selectedThread" class="chat-hub__placeholder">
        <p>Select a chat to start.</p>
      </div>

      <ServiceChatPanel
        v-else
        :service="{
          id: selectedThread.serviceId,
          statusId: selectedThread.statusId,
          community: { communityName: selectedThread.communityName },
          unitNumber: selectedThread.unitNumber,
          user: { name: selectedThread.cleanerName },
        }"
        @message="handlePanelMessage"
      />
    </section>
  </div>
</template>

<style scoped>
.chat-hub {
  display: grid;
  grid-template-columns: minmax(280px, 360px) minmax(0, 1fr);
  gap: 1rem;
  width: 100%;
  max-width: 1400px;
  margin: 0 auto;
  height: min(760px, calc(100vh - 11rem));
  height: min(760px, calc(100dvh - 11rem));
}

.chat-hub__sidebar {
  display: flex;
  flex-direction: column;
  background: rgba(255, 255, 255, 0.92);
  border: 1px solid var(--border-soft);
  border-radius: 14px;
  box-shadow: var(--shadow-tight);
  overflow: hidden;
  min-height: 0;
}

.chat-hub__sidebar-header {
  padding: 1rem 1rem 0.75rem;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.75rem;
}

.chat-hub__sidebar-title h2 {
  font-size: 1.05rem;
  font-weight: 700;
  margin: 0;
  color: var(--ink-900);
}

.chat-hub__sidebar-subtitle {
  margin: 0.15rem 0 0;
  font-size: 0.82rem;
  color: var(--ink-500);
}

.chat-hub__search {
  padding: 0 1rem 0.9rem;
}

.chat-hub__list {
  flex: 1;
  overflow: auto;
  padding: 0 0.35rem 0.35rem;
  min-height: 0;
}

.chat-hub__skeletons {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  padding: 0.65rem;
}

.chat-hub__empty {
  padding: 2rem 1rem;
  text-align: center;
  color: var(--ink-500);
}

.chat-hub__item {
  width: 100%;
  text-align: left;
  border: 1px solid transparent;
  background: transparent;
  padding: 0.75rem 0.9rem;
  margin: 0.35rem;
  border-radius: 12px;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.75rem;
  cursor: pointer;
  transition: background-color 0.15s ease, border-color 0.15s ease;
}

.chat-hub__item:hover {
  background: var(--surface-50);
  border-color: var(--border-soft);
}

.chat-hub__item--active {
  background: var(--accent-100);
  border-color: var(--accent-200);
}

.chat-hub__item-title {
  margin: 0;
  font-weight: 700;
  color: var(--ink-900);
  font-size: 0.95rem;
}

.chat-hub__item-subtitle {
  margin: 0.2rem 0 0;
  color: var(--ink-500);
  font-size: 0.78rem;
}

.chat-hub__item-preview {
  margin: 0.35rem 0 0;
  color: var(--ink-700);
  font-size: 0.82rem;
}

.chat-hub__item-meta {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.45rem;
  min-width: 4.25rem;
  padding-top: 0.1rem;
}

.chat-hub__item-time {
  font-size: 0.72rem;
  color: var(--ink-500);
}

.chat-hub__item-badge {
  min-width: 1.25rem;
  height: 1.25rem;
  padding: 0 0.35rem;
  border-radius: 999px;
  background: #ef4444;
  color: #fff;
  font-size: 0.72rem;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.chat-hub__footer {
  padding: 0.85rem 1rem;
  border-top: 1px solid var(--border-soft);
  display: flex;
  justify-content: center;
}

.chat-hub__content {
  background: rgba(255, 255, 255, 0.92);
  border: 1px solid var(--border-soft);
  border-radius: 14px;
  box-shadow: var(--shadow-tight);
  padding: 1rem;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  min-height: 0;
  min-width: 0;
}

.chat-hub__content :deep(.service-chat) {
  flex: 1;
  min-height: 0;
}

.chat-hub__placeholder {
  height: 100%;
  min-height: 420px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--ink-500);
  font-weight: 600;
}

@media (max-width: 980px) {
  .chat-hub {
    grid-template-columns: 1fr;
    height: auto;
    max-width: none;
  }

  .chat-hub__content {
    padding: 0.75rem;
  }
}
</style>
