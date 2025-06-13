import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import axios from 'axios';
import API_BASE_URL from '../config';

const TTL = 60 * 60 * 1000; // 1 jam

export const cacheAllMasterData = async () => {
  try {
    const state = await NetInfo.fetch();
    if (!state.isConnected) return;

    const now = Date.now();
    const lastCache = await AsyncStorage.getItem('cache_master_last');
    if (lastCache && now - Number(lastCache) < TTL) {
      // Cache masih fresh, tidak perlu fetch ulang
      return;
    }

    // --- KPI
    try {
      const kpiResp = await axios.get(`${API_BASE_URL}/getKPI`);
      const kpiList = (kpiResp.data?.data || []).map(kpi => ({
        label: kpi.kpi,
        value: kpi.id,
      }));
      await AsyncStorage.setItem('dropdown_kpi', JSON.stringify(kpiList));
    } catch (err) {
      console.log('Gagal cache KPI:', err);
    }

    // --- Unit
    try {
      const unitResp = await axios.get(`${API_BASE_URL}/getModelUnit`);
      const unitList = (unitResp.data || []).map(u => ({
        label: u.model,
        value: String(u.id),
      }));
      await AsyncStorage.setItem('dropdown_unit', JSON.stringify(unitList));
    } catch (err) {
      console.log('Gagal cache UNIT:', err);
    }

    // --- Activity Master
    try {
      const activityResp = await axios.get(`${API_BASE_URL}/getActivity/all`);
      const allActivity = activityResp.data?.data || [];
      await AsyncStorage.setItem(
        'cached_all_activity',
        JSON.stringify(allActivity),
      );
    } catch (err) {
      console.log('Gagal cache ACTIVITY:', err);
    }

    // --- Daily List
    try {
      const listResp = await axios.get(`${API_BASE_URL}/apiDayActAll`);
      const allDaily = Array.isArray(listResp.data)
        ? listResp.data
        : listResp.data.data || [];
      await AsyncStorage.setItem(
        'cached_daily_activity_list',
        JSON.stringify(allDaily),
      );
    } catch (err) {
      console.log('Gagal cache DAILY LIST:', err);
    }

    await AsyncStorage.setItem('cache_master_last', String(now));
    console.log('All master & list data cached/refreshed.');
  } catch (err) {
    console.log('Error caching master data:', err);
  }
};
