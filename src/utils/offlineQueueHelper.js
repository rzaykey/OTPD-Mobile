import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import API_BASE_URL from '../config';

let isPushingQueue = false;

// Tambah data ke antrian offline
export const addQueueOffline = async (queueKey, payload) => {
  const id_local = payload.id_local || Date.now() + '_' + Math.random();
  payload.id_local = id_local;
  let arr = [];
  try {
    const str = await AsyncStorage.getItem(queueKey);
    if (str) arr = JSON.parse(str);
  } catch {}
  if (!arr.find(item => item.id_local === id_local)) {
    arr.push(payload);
    await AsyncStorage.setItem(queueKey, JSON.stringify(arr));
  }
  return arr.length;
};

// Push antrian ke server
export const pushOfflineQueue = async (queueKey, endpoint) => {
  if (isPushingQueue) return 0;
  isPushingQueue = true;
  let queue = [];
  try {
    const str = await AsyncStorage.getItem(queueKey);
    if (str) queue = JSON.parse(str);
  } catch {}
  if (!queue.length) {
    isPushingQueue = false;
    return 0;
  }
  const token = await AsyncStorage.getItem('userToken');
  let failedData = [];
  let successCount = 0;
  for (let i = 0; i < queue.length; i++) {
    try {
      const res = await axios.post(`${API_BASE_URL}${endpoint}`, queue[i], {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      });
      if (res.data?.success) {
        successCount += 1;
      } else {
        failedData.push(queue[i]);
      }
    } catch {
      failedData.push(queue[i]);
    }
  }
  // HANYA failed yang disimpan
  await AsyncStorage.setItem(queueKey, JSON.stringify(failedData));
  isPushingQueue = false;
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
