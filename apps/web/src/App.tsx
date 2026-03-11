import { useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { App as CapacitorApp } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import { useAuthStore } from './stores/authStore';
import { useChatStore } from './stores/chatStore';
import { getSocket } from './lib/socket';
import AuthPage from './pages/AuthPage';
import ChatPage from './pages/ChatPage';
import NetworkBanner from './components/NetworkBanner';

export default function App() {
  const { token, user, checkAuth, isLoading } = useAuthStore();
  const { loadChats } = useChatStore();

  useEffect(() => {
    checkAuth();

    // Capacitor listener for background/foreground state
    const listener = CapacitorApp.addListener('appStateChange', ({ isActive }) => {
      if (isActive) {
        console.log('App returned to foreground, resyncing data...');
        // Re-authenticate and reload chats to ensure we didn't miss messages
        checkAuth().then(() => {
          const socket = getSocket();
          if (socket && !socket.connected) {
            socket.connect();
          }
          if (useAuthStore.getState().token) {
            loadChats();
          }
        });
      }
    });

    // Initialize Push Notifications if native
    if (Capacitor.isNativePlatform()) {
      PushNotifications.requestPermissions().then(result => {
        if (result.receive === 'granted') {
          PushNotifications.register();
        }
      });

      PushNotifications.addListener('registration', (token) => {
        console.log('Push registration success, token:', token.value);
        const socket = getSocket();
        if (socket && socket.connected) {
          socket.emit('register_device_token', { token: token.value, platform: Capacitor.getPlatform() });
        } else {
          // Retry later if socket isn't ready
          setTimeout(() => {
            const retrySocket = getSocket();
            if (retrySocket && retrySocket.connected) {
              retrySocket.emit('register_device_token', { token: token.value, platform: Capacitor.getPlatform() });
            }
          }, 3000);
        }
      });

      PushNotifications.addListener('pushNotificationReceived', (notification) => {
        console.log('Push received: ', notification);
      });

      PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
        console.log('Push action performed: ', notification);
      });
    }

    return () => {
      listener.then(l => l.remove());
      if (Capacitor.isNativePlatform()) {
        PushNotifications.removeAllListeners();
      }
    };
  }, [checkAuth, loadChats]);

  // Show loading only if we are loading and don't have a cached user
  if (isLoading && !user) {
    return (
      <div className="h-full flex items-center justify-center bg-surface">
        <div className="flex flex-col items-center gap-4">
          <VortexLoader />
          <p className="text-zinc-500 text-sm">Загрузка...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <NetworkBanner />
      <AnimatePresence mode="wait">
        {token && user ? (
          <ChatPage key="chat" />
        ) : (
          <AuthPage key="auth" />
        )}
      </AnimatePresence>
    </>
  );
}

function VortexLoader() {
  return (
    <div className="relative w-12 h-12">
      <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-vortex-500 animate-spin" />
      <div
        className="absolute inset-1 rounded-full border-2 border-transparent border-t-vortex-400 animate-spin"
        style={{ animationDuration: '0.8s', animationDirection: 'reverse' }}
      />
      <div
        className="absolute inset-2 rounded-full border-2 border-transparent border-t-vortex-300 animate-spin"
        style={{ animationDuration: '0.6s' }}
      />
    </div>
  );
}
