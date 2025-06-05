import AsyncStorage from '@react-native-async-storage/async-storage';

export const saveSession = async (
  token: string,
  role: string,
  site: string,
) => {
  await AsyncStorage.setItem('userToken', token);
  await AsyncStorage.setItem('userRole', role);
  await AsyncStorage.setItem('userSite', site);
};

export const clearSession = async () => {
  await AsyncStorage.removeItem('userToken');
  await AsyncStorage.removeItem('userRole');
  await AsyncStorage.removeItem('userSite'); // ⬅️ tambahkan jika diperlukan
};

export const getSession = async () => {
  const token = await AsyncStorage.getItem('userToken');
  const role = await AsyncStorage.getItem('userRole');
  const site = await AsyncStorage.getItem('userSite');
  return {token, role, site};
};
