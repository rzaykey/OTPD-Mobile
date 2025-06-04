import AsyncStorage from '@react-native-async-storage/async-storage';

export const saveSession = async (token: string, role: string) => {
  await AsyncStorage.setItem('userToken', token);
  await AsyncStorage.setItem('userRole', role);
};

export const clearSession = async () => {
  await AsyncStorage.removeItem('userToken');
  await AsyncStorage.removeItem('userRole');
};

export const getSession = async () => {
  const token = await AsyncStorage.getItem('userToken');
  const role = await AsyncStorage.getItem('userRole');
  return {token, role};
};
