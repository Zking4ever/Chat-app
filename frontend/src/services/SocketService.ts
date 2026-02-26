import { io, Socket } from 'socket.io-client';

const SOCKET_URL = 'http://localhost:3000'; // Should be from env in production

class SocketService {
    private socket: Socket | null = null;

    getSocket(userId?: number) {
        if (!this.socket) {
            this.socket = io(SOCKET_URL);
            if (userId) {
                this.socket.emit('join', userId);
            }
        } else if (userId) {
            this.socket.emit('join', userId);
        }
        return this.socket;
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
    }
}

export default new SocketService();
