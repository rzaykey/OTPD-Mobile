import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import API_BASE_URL from '../config';
import {ToastAndroid, Platform, Alert} from 'react-native';

const isPushingQueue = {};

export const addQueueOffline = async (queueKey, payload) => {
  const id_local =
    payload.id_local ||
    Date.now() + '_' + Math.random().toString(36).slice(2, 10);
  const fullPayload = {...payload, id_local};
  let arr = [];
  try {
    const str = await AsyncStorage.getItem(queueKey);
    if (str) arr = JSON.parse(str);
  } catch {}
  // Hindari duplikat based on isi selain id_local
  if (
    !arr.find(
      item =>
        JSON.stringify({...item, id_local: undefined}) ===
        JSON.stringify({...fullPayload, id_local: undefined}),
    )
  ) {
    arr.push(fullPayload);
    await AsyncStorage.setItem(queueKey, JSON.stringify(arr));
  }
  return arr.length;
};

function showSyncToast(message) {
  if (Platform.OS === 'android') {
    ToastAndroid.show(message, ToastAndroid.SHORT);
  } else {
    Alert.alert('Info', message);
  }
}

// offlineQueueHelper.js

export const pushOfflineQueue = async (queueKey, endpoint, onProgress) => {
  if (isPushingQueue[queueKey]) return 0;
  isPushingQueue[queueKey] = true;
  let queue = [];
  try {
    const str = await AsyncStorage.getItem(queueKey);
    if (str) queue = JSON.parse(str);
  } catch {}
  if (!queue.length) {
    isPushingQueue[queueKey] = false;
    return 0;
  }
  const token = await AsyncStorage.getItem('userToken');
  let failedData = [];
  let successCount = 0;
  for (let i = 0; i < queue.length; i++) {
    try {
      const {id_local, ...payload} = queue[i];
      const res = await axios.post(`${API_BASE_URL}${endpoint}`, payload, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      });
      if (res.data?.success || res.data?.status) {
        successCount += 1;
      } else {
        failedData.push(queue[i]);
      }
    } catch {
      failedData.push(queue[i]);
    }
    // <-- Panggil progress di sini!
    if (onProgress) onProgress(i + 1, queue.length);
  }
  if (successCount) {
    showSyncToast(`${successCount} data offline berhasil di-sync ke server!`);
  }
  await AsyncStorage.setItem(queueKey, JSON.stringify(failedData));
  if (failedData.length) {
    showSyncToast(
      `${failedData.length} data gagal dikirim. Cek koneksi/server!`,
    );
  }
  isPushingQueue[queueKey] = false;
  return successCount;
};


export const getOfflineQueueCount = async queueKey => {
  const data = await AsyncStorage.getItem(queueKey);
  if (!data) return 0;
  try {
    const arr = JSON.parse(data);
    return Array.isArray(arr) ? arr.length : 0;
  } catch {
    return 0;
  }
};

export const clearOfflineQueue = async queueKey => {
  await AsyncStorage.removeItem(queueKey);
};
