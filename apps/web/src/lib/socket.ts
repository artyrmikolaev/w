import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export function connectSocket(token: string): Socket {
  if (socket?.connected) {
    return socket;
  }

  // Clean up old socket instance if it exists but is disconnected
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }

  // Always  // The Render backend was previously used, now switching to the Hostinger VPS backend
  // const socketUrl = 'https://w-e6gq.onrender.com';
  const socketUrl = 'https://messengertest.shop';

  socket = io(socketUrl, {
    auth: { token },
    transports: ['websocket', 'polling'],
  });

  socket.on('connect', () => {
    console.log('Socket подключён');
  });

  socket.on('connect_error', (err) => {
    console.error('Ошибка подключения Socket:', err.message);
  });

  return socket;
}

export function getSocket(): Socket | null {
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
