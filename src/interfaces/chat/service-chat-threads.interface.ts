import type { MetaPagination } from '../meta-pagination.interface';

export interface ServiceChatThreadLastMessage {
  id: string;
  userId: string | null;
  userName: string | null;
  message: string | null;
  hasAttachment: boolean;
  attachmentType: string | null;
  createdAt: string;
}

export interface ServiceChatThread {
  serviceId: string;
  statusId: string | null;
  date: string;
  schedule: string | null;
  communityName: string | null;
  unitNumber: string | null;
  cleanerName: string | null;
  lastMessage: ServiceChatThreadLastMessage;
}

export interface ServiceChatThreads {
  data: ServiceChatThread[];
  meta: MetaPagination;
}

