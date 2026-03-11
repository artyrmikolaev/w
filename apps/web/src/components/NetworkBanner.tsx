import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { WifiOff, Wifi } from 'lucide-react';
import { useLang } from '../lib/i18n';

export default function NetworkBanner() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showReconnected, setShowReconnected] = useState(false);
  const { t } = useLang();

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowReconnected(true);
      setTimeout(() => setShowReconnected(false), 3000);
    };
    const handleOffline = () => {
      setIsOnline(false);
      setShowReconnected(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <AnimatePresence>
      {!isOnline && (
        <motion.div
           initial={{ y: -100, opacity: 0 }}
           animate={{ y: 0, opacity: 1 }}
           exit={{ y: -100, opacity: 0 }}
           transition={{ type: 'spring', damping: 20, stiffness: 200 }}
           className="fixed top-4 left-0 right-0 z-[99999] flex justify-center pointer-events-none"
        >
          <div className="bg-red-500/90 text-white px-5 py-2 rounded-full text-sm font-medium flex items-center gap-2 shadow-[0_8px_30px_rgba(239,68,68,0.4)] ring-1 ring-white/20 backdrop-blur-xl">
            <WifiOff size={16} />
            <span>{t('offlineMessage' as any) || 'Нет подключения к сети...'}</span>
          </div>
        </motion.div>
      )}
      {showReconnected && isOnline && (
        <motion.div
           initial={{ y: -100, opacity: 0 }}
           animate={{ y: 0, opacity: 1 }}
           exit={{ y: -100, opacity: 0 }}
           transition={{ type: 'spring', damping: 20, stiffness: 200 }}
           className="fixed top-4 left-0 right-0 z-[99999] flex justify-center pointer-events-none"
        >
          <div className="bg-emerald-500/90 text-white px-5 py-2 rounded-full text-sm font-medium flex items-center gap-2 shadow-[0_8px_30px_rgba(16,185,129,0.4)] ring-1 ring-white/20 backdrop-blur-xl">
            <Wifi size={16} />
            <span>{t('onlineMessage' as any) || 'Соединение восстановлено'}</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
