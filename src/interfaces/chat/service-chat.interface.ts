export interface ServiceChatUser {
  id: string;
  name: string;
  roleId: string | null;
}

export interface ServiceChatMessage {
  id: string;
  serviceId: string;
  userId: string;
  message: string | null;
  attachmentPath?: string | null;
  attachmentType?: string | null;
  attachmentMime?: string | null;
  attachmentName?: string | null;
  createdAt: string;
  user?: ServiceChatUser;
}

export interface ServiceChatHistory {
  serviceId: string;
  statusId: string | null;
  canSend: boolean;
  messages: ServiceChatMessage[];
}
