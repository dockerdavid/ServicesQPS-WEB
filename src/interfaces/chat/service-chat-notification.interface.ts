export interface ServiceChatNotificationPayload {
  serviceId: string;
  senderId: string;
  senderName: string;
  message: string | null;
  hasAttachment: boolean;
  communityName: string | null;
  unitNumber: string | null;
}

