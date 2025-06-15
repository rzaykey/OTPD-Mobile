import React, {
  createContext,
  useEffect,
  useState,
  useCallback,
  useRef,
} from 'react';
import NetInfo from '@react-native-community/netinfo';
import {
  pushOfflineQueue,
  getOfflineQueueCount,
  clearOfflineQueue,
} from './offlineQueueHelper';

export const OfflineQueueContext = createContext();

export const OfflineQueueProvider = ({children}) => {
  const mentoringKey = 'mentoring_queue_offline';
  const dailyKey = 'daily_queue_offline';

  const [mentoringQueueCount, setMentoringQueueCount] = useState(0);
  const [dailyQueueCount, setDailyQueueCount] = useState(0);
  const [syncing, setSyncing] = useState(false);

  const refreshQueueCount = useCallback(async () => {
    setMentoringQueueCount(await getOfflineQueueCount(mentoringKey));
    setDailyQueueCount(await getOfflineQueueCount(dailyKey));
  }, []);

  const pushMentoringQueue = useCallback(async () => {
    setSyncing(true);
    await pushOfflineQueue(mentoringKey, '/mentoring/store');
    setSyncing(false);
    refreshQueueCount();
  }, [refreshQueueCount]);

  const pushDailyQueue = useCallback(async () => {
    setSyncing(true);
    await pushOfflineQueue(dailyKey, '/dayActivities');
    setSyncing(false);
    refreshQueueCount();
  }, [refreshQueueCount]);

  // AUTO-PUSH saat online
  const lastIsConnected = useRef(true);
  useEffect(() => {
    refreshQueueCount();
    const unsubscribe = NetInfo.addEventListener(async state => {
      if (lastIsConnected.current === false && state.isConnected === true) {
        await pushMentoringQueue();
        await pushDailyQueue();
      }
      lastIsConnected.current = state.isConnected;
    });
    return () => unsubscribe();
  }, [pushMentoringQueue, pushDailyQueue, refreshQueueCount]);

  // Refresh count secara periodik (boleh dihapus jika ingin)
  useEffect(() => {
    const interval = setInterval(() => {
      refreshQueueCount();
    }, 5000);
    return () => clearInterval(interval);
  }, [refreshQueueCount]);

  return (
    <OfflineQueueContext.Provider
      value={{
        mentoringQueueCount,
        dailyQueueCount,
        syncing,
        refreshQueueCount,
        pushMentoringQueue,
        pushDailyQueue,
        clearOfflineQueue,
      }}>
      {children}
    </OfflineQueueContext.Provider>
  );
};
