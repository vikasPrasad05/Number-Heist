import { io, Socket } from 'socket.io-client';

export const socket: Socket = io(typeof window !== "undefined" ? window.location.origin : 'http://localhost:3000', {
    autoConnect: false
});
