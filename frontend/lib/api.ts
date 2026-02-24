import axios from 'axios';

// Replace with your local IP for physical device testing
const BASE_URL = 'http://localhost:3000/api';

const api = axios.create({
    baseURL: BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

export const authAPI = {
    login: (phone: string, name?: string) => api.post('/auth/login', { phone, name }),
};

export const contactAPI = {
    detect: (phones: string[]) => api.post('/contacts/detect', { phones }),
    add: (userId: number, contactPhone: string) => api.post('/contacts/add', { user_id: userId, contact_phone: contactPhone }),
};

export const chatAPI = {
    getConversations: (userId: number) => api.get(`/chat/conversations/${userId}`),
    getMessages: (convoId: number) => api.get(`/chat/messages/${convoId}`),
    sendMessage: (data: { conversation_id: number, sender_id: number, text: string }) => api.post('/chat/message', data),
    getOrCreateConvo: (user1: number, user2: number) => api.post('/chat/get-or-create', { user1, user2 }),
};

export default api;
