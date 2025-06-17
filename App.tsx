import React, {useEffect, useContext} from 'react';
import {NavigationContainer} from '@react-navigation/native';
import AppNavigator from './src/navigation/AppNavigator';

import {
  QueryClient,
  QueryClientProvider,
  onlineManager,
} from '@tanstack/react-query';
import {persistQueryClient} from '@tanstack/react-query-persist-client';
import {createAsyncStoragePersister} from '@tanstack/query-async-storage-persister';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';

import {OfflineQueueProvider} from './src/utils/OfflineQueueContext';
import {
  MasterCacheProvider,
  MasterCacheContext,
} from './src/utils/MasterCacheContext';

// Setup React Query client & persistor
const queryClient = new QueryClient();
const asyncStoragePersister = createAsyncStoragePersister({
  storage: AsyncStorage,
});

persistQueryClient({
  queryClient,
  persister: asyncStoragePersister,
});

onlineManager.setEventListener(setOnline => {
  return NetInfo.addEventListener(state => {
    setOnline(Boolean(state.isConnected));
  });
});

// 🔄 Wrapper component to call forceUpdateMaster inside provider
const AppInitWrapper = () => {
  const {forceUpdateMaster} = useContext(MasterCacheContext);

  useEffect(() => {
    forceUpdateMaster();
  }, []);

  return (
    <NavigationContainer>
      <AppNavigator />
    </NavigationContainer>
  );
};

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <OfflineQueueProvider>
        <MasterCacheProvider>
          <AppInitWrapper />
        </MasterCacheProvider>
      </OfflineQueueProvider>
    </QueryClientProvider>
  );
};

export default App;
