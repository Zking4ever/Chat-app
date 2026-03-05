import axios from 'axios';

const BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL + '/api' || 'http://localhost:3000/api';

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
    sendMessage: (data: { conversation_id: number, sender_id: number, text: string, message_type?: string, metadata?: string }) => api.post('/chat/message', data),
    getOrCreateConvo: (user1: number, user2: number) => api.post('/chat/get-or-create', { user1, user2 }),
    uploadFile: (formData: FormData) => api.post('/chat/upload', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    }),
};

export const userAPI = {
    updateProfile: (userId: number, data: { name?: string; username?: string; profile_picture?: string }) =>
        api.patch(`/users/${userId}`, data),
    searchUsers: (query: string) =>
        api.get(`/users/search`, { params: { q: query } }),
    checkUsername: (username: string, excludeId: number) =>
        api.get(`/users/check-username`, { params: { username, exclude_id: excludeId } }),
};

export default api;
