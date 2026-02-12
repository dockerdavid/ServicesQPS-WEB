<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue';
import { io, type Socket } from 'socket.io-client';
import { useToast } from 'primevue/usetoast';

import { useAuthStore } from '../../../store/auth.store';
import { useUserStore } from '../../../store/user.store';
import { ServiceChatServices } from '../service-chat.services';
import type {
  ServiceChatHistory,
  ServiceChatMessage,
} from '../../../interfaces/chat/service-chat.interface';
import { ServiceStatusId, isChatOpenStatus } from '../../../constants/service-status';
import { showToast } from '../../../utils/show-toast';

interface ServiceChatContext {
  id: string;
  statusId?: string | null;
  community?: { communityName?: string | null };
  unitNumber?: string | null;
  user?: { name?: string | null };
}

const props = defineProps<{ service: ServiceChatContext }>();
const emit = defineEmits<{
  (event: 'message', message: ServiceChatMessage): void;
}>();

const authStore = useAuthStore();
const userStore = useUserStore();
const toast = useToast();

const messages = ref<ServiceChatMessage[]>([]);
const newMessage = ref('');
const isLoading = ref(false);
const isUploading = ref(false);
const canSend = ref(false);
const statusId = ref<string | null>(null);
const socket = ref<Socket | null>(null);
const messagesContainer = ref<HTMLElement | null>(null);
const fileInput = ref<HTMLInputElement | null>(null);

const serviceTitle = computed(() => {
  const communityName = props.service?.community?.communityName || 'Service';
  const unitNumber = props.service?.unitNumber ? ` · Unit ${props.service.unitNumber}` : '';
  return `${communityName}${unitNumber}`;
});

const isChatOpen = computed(() =>
  isChatOpenStatus(statusId.value ?? props.service?.statusId ?? null),
);

const chatStatusMessage = computed(() => {
  if (messages.value.some((message) => message.userId === '0')) {
    return '';
  }

  const currentStatus = statusId.value ?? props.service?.statusId ?? null;
  if (isChatOpenStatus(currentStatus)) {
    return '';
  }

  if (currentStatus === ServiceStatusId.Finished) {
    return 'Chat closed because the service is Finished.';
  }

  return 'Chat will open once the service is Approved.';
});

const socketUrl = computed(() => {
  const baseUrl = import.meta.env.VITE_API_URL as string;
  return baseUrl?.replace(/\/$/, '');
});

const scrollToBottom = async () => {
  await nextTick();
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
  }
};

const appendMessage = (message: ServiceChatMessage) => {
  if (messages.value.some((existing) => existing.id === message.id)) {
    return;
  }

  messages.value = [...messages.value, message];
  emit('message', message);
  scrollToBottom();
};

const connectSocket = () => {
  if (socket.value || !authStore.token) {
    return;
  }

  socket.value = io(socketUrl.value, {
    auth: {
      token: authStore.token,
    },
    transports: ['websocket'],
  });

  socket.value.on('serviceChat:new', (message: ServiceChatMessage) => {
    if (message.serviceId !== props.service.id) {
      return;
    }

    appendMessage(message);
  });

  socket.value.on('serviceChat:error', (payload: { message?: string }) => {
    if (payload?.message) {
      showToast(toast, { severity: 'error', summary: payload.message });
    }
  });
};

const joinRoom = (serviceId: string) => {
  if (!socket.value) {
    return;
  }
  socket.value.emit('serviceChat:join', { serviceId });
};

const leaveRoom = (serviceId: string) => {
  if (!socket.value) {
    return;
  }
  socket.value.emit('serviceChat:leave', { serviceId });
};

const fetchHistory = async (serviceId: string) => {
  if (!serviceId) {
    return;
  }

  isLoading.value = true;
  try {
    const history: ServiceChatHistory = await ServiceChatServices.getHistory(serviceId);
    messages.value = history.messages ?? [];
    canSend.value = history.canSend;
    statusId.value = history.statusId;
    await scrollToBottom();
  } catch (error) {
    showToast(toast, { severity: 'error', summary: 'Unable to load chat history.' });
  } finally {
    isLoading.value = false;
  }
};

const sendMessage = async () => {
  const serviceId = props.service.id;
  const trimmedMessage = newMessage.value.trim();

  if (!serviceId || !trimmedMessage || !socket.value) {
    return;
  }

  if (!isChatOpen.value || !canSend.value) {
    showToast(toast, { severity: 'warn', summary: 'Chat is closed for this service.' });
    return;
  }

  socket.value.emit('serviceChat:send', {
    serviceId,
    message: trimmedMessage,
  });

  newMessage.value = '';
};

const openFilePicker = () => {
  if (fileInput.value) {
    fileInput.value.value = '';
    fileInput.value.click();
  }
};

const handleFileSelected = async (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (!file) {
    return;
  }

  if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
    showToast(toast, { severity: 'warn', summary: 'Only images and videos are allowed.' });
    return;
  }

  if (!isChatOpen.value || !canSend.value) {
    showToast(toast, { severity: 'warn', summary: 'Chat is closed for this service.' });
    return;
  }

  isUploading.value = true;
  try {
    const messageText = newMessage.value.trim();
    const createdMessage = await ServiceChatServices.uploadEvidence(
      props.service.id,
      file,
      messageText || undefined,
    );
    newMessage.value = '';
    appendMessage(createdMessage);
  } catch (error) {
    showToast(toast, { severity: 'error', summary: 'Unable to upload evidence.' });
  } finally {
    isUploading.value = false;
  }
};

const formatTime = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

const isOwnMessage = (message: ServiceChatMessage) => {
  return message.userId === userStore.userData?.id;
};

const attachmentUrl = (message: ServiceChatMessage) => {
  const baseUrl = socketUrl.value || '';
  const token = authStore.token;

  if (!baseUrl || !token) {
    return '';
  }

  return `${baseUrl}/service-chats/${message.serviceId}/evidence/${message.id}?token=${encodeURIComponent(token)}`;
};

watch(
  () => props.service.id,
  async (newId, oldId) => {
    if (!newId) {
      return;
    }

    connectSocket();

    if (oldId) {
      leaveRoom(oldId);
    }

    await fetchHistory(newId);
    joinRoom(newId);
  },
  { immediate: true },
);

onBeforeUnmount(() => {
  if (props.service?.id) {
    leaveRoom(props.service.id);
  }

  if (socket.value) {
    socket.value.disconnect();
    socket.value = null;
  }
});
</script>

<template>
  <div class="service-chat">
    <header class="service-chat__header">
      <div>
        <p class="service-chat__title">{{ serviceTitle }}</p>
        <p v-if="chatStatusMessage" class="service-chat__status">{{ chatStatusMessage }}</p>
      </div>
    </header>

    <div ref="messagesContainer" class="service-chat__messages">
      <p v-if="isLoading" class="service-chat__loading">Loading chat...</p>

      <p v-else-if="messages.length === 0" class="service-chat__empty">
        No messages yet. Start the conversation once the service is Approved.
      </p>

      <div v-else class="service-chat__list">
        <div
          v-for="message in messages"
          :key="message.id"
          :class="['service-chat__bubble', { 'service-chat__bubble--own': isOwnMessage(message) }]"
        >
          <p class="service-chat__author">
            {{ message.user?.name || 'Unknown' }}
            <span class="service-chat__time">{{ formatTime(message.createdAt) }}</span>
          </p>
          <p v-if="message.message" class="service-chat__text">{{ message.message }}</p>
          <img
            v-if="message.attachmentType === 'image' && message.attachmentPath"
            class="service-chat__media"
            :src="attachmentUrl(message)"
            :alt="message.attachmentName || 'evidence'"
          />
          <video
            v-if="message.attachmentType === 'video' && message.attachmentPath"
            class="service-chat__media"
            controls
            :src="attachmentUrl(message)"
          />
        </div>
      </div>
    </div>

    <div class="service-chat__composer">
      <textarea
        v-model="newMessage"
        class="service-chat__input"
        :disabled="!isChatOpen || !canSend"
        placeholder="Write a message..."
        rows="2"
      />
      <input
        ref="fileInput"
        type="file"
        class="service-chat__file"
        accept="image/*,video/*"
        @change="handleFileSelected"
      />
      <button
        class="service-chat__attach"
        :disabled="!isChatOpen || !canSend || isUploading"
        @click="openFilePicker"
        type="button"
      >
        Attach
      </button>
      <button class="service-chat__send" :disabled="!newMessage.trim() || !isChatOpen || !canSend" @click="sendMessage">
        Send
      </button>
    </div>
  </div>
</template>

<style scoped>
.service-chat {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  height: 100%;
}

.service-chat__header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.service-chat__title {
  font-size: 1.1rem;
  font-weight: 600;
  margin: 0;
}

.service-chat__status {
  font-size: 0.85rem;
  color: #64748b;
  margin: 0.2rem 0 0;
}

.service-chat__messages {
  flex: 1;
  background: #f8fafc;
  border-radius: 12px;
  padding: 1rem;
  overflow-y: auto;
  min-height: 240px;
}

.service-chat__loading,
.service-chat__empty {
  text-align: center;
  color: #94a3b8;
  margin: 0;
}

.service-chat__list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.service-chat__bubble {
  background: #ffffff;
  padding: 0.75rem 1rem;
  border-radius: 12px;
  max-width: 80%;
  box-shadow: 0 4px 12px rgba(15, 23, 42, 0.08);
}

.service-chat__bubble--own {
  align-self: flex-end;
  background: #e0f2fe;
}

.service-chat__author {
  font-size: 0.75rem;
  font-weight: 600;
  color: #475569;
  margin: 0 0 0.35rem;
  display: flex;
  justify-content: space-between;
  gap: 0.75rem;
}

.service-chat__time {
  font-weight: 500;
  color: #94a3b8;
}

.service-chat__text {
  margin: 0;
  color: #0f172a;
  white-space: pre-wrap;
}

.service-chat__composer {
  display: flex;
  gap: 0.75rem;
  align-items: center;
}

.service-chat__input {
  flex: 1;
  border-radius: 10px;
  border: 1px solid #e2e8f0;
  padding: 0.75rem;
  resize: none;
  font-family: inherit;
}

.service-chat__input:disabled {
  background: #f1f5f9;
  color: #94a3b8;
}

.service-chat__send {
  background: #0f172a;
  color: #fff;
  border: none;
  padding: 0.65rem 1.4rem;
  border-radius: 999px;
  font-weight: 600;
  cursor: pointer;
}

.service-chat__attach {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  color: #0f172a;
  padding: 0.65rem 1.2rem;
  border-radius: 999px;
  font-weight: 600;
  cursor: pointer;
}

.service-chat__attach:disabled {
  color: #94a3b8;
  cursor: not-allowed;
}

.service-chat__send:disabled {
  background: #cbd5f5;
  cursor: not-allowed;
}

.service-chat__file {
  display: none;
}

.service-chat__media {
  margin-top: 0.5rem;
  max-width: 100%;
  border-radius: 10px;
  border: 1px solid #e2e8f0;
}

@media (max-width: 768px) {
  .service-chat__composer {
    flex-direction: column;
    align-items: stretch;
  }

  .service-chat__send {
    width: 100%;
  }
}
</style>
