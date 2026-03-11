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

  // Use current page origin, but if we are in a native app (Electron/Capacitor) or local dev,
  // we must connect to the live remote server.
  const isLocalOrNative = window.location.origin.includes('localhost') ||
                        window.location.origin.includes('127.0.0.1') ||
                        window.location.protocol === 'file:' ||
                        window.location.protocol === 'capacitor:';
                        
  const socketUrl = isLocalOrNative ? 'https://messengertest.shop' : window.location.origin;

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
