import { apiServicesQps } from '../../api/api';
export class ServiceChatServices {
    static async getHistory(serviceId) {
        const { data } = await apiServicesQps.get(`/service-chats/${serviceId}`);
        return data;
    }
    static async uploadEvidence(serviceId, file, message) {
        const payload = new FormData();
        payload.append('file', file);
        if (message) {
            payload.append('message', message);
        }
        const { data } = await apiServicesQps.post(`/service-chats/${serviceId}/evidence`, payload, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return data;
    }
}
