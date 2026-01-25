import { apiServicesQps } from '../../api/api';
import type {
  ServiceChatHistory,
  ServiceChatMessage,
} from '../../interfaces/chat/service-chat.interface';

export class ServiceChatServices {
  static async getHistory(serviceId: string): Promise<ServiceChatHistory> {
    const { data } = await apiServicesQps.get<ServiceChatHistory>(
      `/service-chats/${serviceId}`
    );
    return data;
  }

  static async uploadEvidence(
    serviceId: string,
    file: File,
    message?: string,
  ): Promise<ServiceChatMessage> {
    const payload = new FormData();
    payload.append('file', file);
    if (message) {
      payload.append('message', message);
    }

    const { data } = await apiServicesQps.post<ServiceChatMessage>(
      `/service-chats/${serviceId}/evidence`,
      payload,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      },
    );

    return data;
  }
}
