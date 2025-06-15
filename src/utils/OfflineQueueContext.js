import React, {createContext, useState, useEffect, useCallback} from 'react';
import {getOfflineQueueCount, pushOfflineQueue} from './offlineQueueHelper';
import NetInfo from '@react-native-community/netinfo';

// [1] Key dan endpoint queue mentoring (bisa tambah queue lain)
const QUEUES = [
  {
    key: 'mentoring_queue_offline',
    endpoint: '/mentoring/store',
  },
  // Tambah lagi kalau mau queue lain:
  // { key: 'daily_queue_offline', endpoint: '/daily/store' },
];

// [2] Context shape
export const OfflineQueueContext = createContext({
  queueCount: 0,
  syncing: false,
  refreshQueueCount: () => {},
  pushQueue: () => {},
});

// [3] Provider
export const OfflineQueueProvider = ({children}) => {
  const [queueCount, setQueueCount] = useState(0);
  const [syncing, setSyncing] = useState(false);

  // Refresh count dari semua queue (bisa dimodif untuk multiple queue)
  const refreshQueueCount = useCallback(async () => {
    let total = 0;
    for (const q of QUEUES) {
      const count = await getOfflineQueueCount(q.key);
      total += count;
    }
    setQueueCount(total);
  }, []);

  // Push semua queue yang ada
  const pushQueue = useCallback(async () => {
    setSyncing(true);
    for (const q of QUEUES) {
      await pushOfflineQueue(q.key, q.endpoint);
    }
    await refreshQueueCount();
    setSyncing(false);
  }, [refreshQueueCount]);

  // Pantau koneksi untuk auto-push, dan selalu refresh badge saat mount
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      if (state.isConnected) {
        pushQueue();
      }
    });
    refreshQueueCount();
    return unsubscribe;
  }, [pushQueue, refreshQueueCount]);

  // Kalau perlu: listen perubahan (misal window.dispatchEvent), boleh tambahkan event listener di sini

  return (
    <OfflineQueueContext.Provider
      value={{queueCount, syncing, refreshQueueCount, pushQueue}}>
      {children}
    </OfflineQueueContext.Provider>
  );
};
