import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import axios from 'axios';
import API_BASE_URL from '../config';

const TTL = 60 * 10 * 1000; // 1 jam
const unitTypes = [3, 2, 5, 4];

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
    for (let type of unitTypes) {
      try {
        const res = await axios.get(
          `${API_BASE_URL}/mentoring/createData?type_mentoring=${type}`,
        );
        const indicators = res.data?.data?.indicators || {};
        await AsyncStorage.setItem(
          `mentoring_indicators_${type}`,
          JSON.stringify(indicators),
        );
        // Optional: log
        console.log('Cached indikator', type, indicators);
      } catch (err) {
        console.log('Error prefetch indikator type', type, err);
      }
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

    try {
      const optResp = await axios.get(`${API_BASE_URL}/getEmployeeOperatorAll`);
      const allOpt = Array.isArray(optResp.data)
        ? optResp.data
        : optResp.data.data || [];
      await AsyncStorage.setItem('cached_opt_list', JSON.stringify(allOpt));
    } catch (err) {
      console.log('Gagal cache OPT LIST:', err);
    }

    try {
      const modelResp = await axios.get(`${API_BASE_URL}/getModelUnit`);
      const allModel = Array.isArray(modelResp.data)
        ? modelResp.data
        : modelResp.data.data || [];
      await AsyncStorage.setItem('cached_model_list', JSON.stringify(allModel));
    } catch (err) {
      console.log('Gagal cache MODEL LIST:', err);
    }

    try {
      const unitResp = await axios.get(`${API_BASE_URL}/getMasterUnit`);
      const allUnit = Array.isArray(unitResp.data)
        ? unitResp.data
        : unitResp.data.data || [];
      await AsyncStorage.setItem('cached_unit_list', JSON.stringify(allUnit));
    } catch (err) {
      console.log('Gagal cache UNIT LIST:', err);
    }

    // --- Master data untuk Add Mentoring
    try {
      const [siteResp] = await Promise.all([
        axios.get(`${API_BASE_URL}/getSite`),
      ]);
      await AsyncStorage.setItem(
        'mentoring_master_site',
        JSON.stringify(siteResp.data?.data || []),
      );
      console.log('Master data for Add Mentoring cached');
    } catch (e) {
      console.log('Error caching master mentoring data:', e);
    }

    await AsyncStorage.setItem('cache_master_last', String(now));
    console.log('All master & list data cached/refreshed.');

    // --- Debug log semua cache (for dev only)
    await logAllMasterCache();
  } catch (err) {
    console.log('Error caching master data:', err);
  }
};

// --- Utility untuk cek isi semua cache master (panggil manual jika mau)
export const logAllMasterCache = async () => {
  const keys = [
    'dropdown_kpi',
    'dropdown_unit',
    'cached_all_activity',
    'cached_daily_activity_list',
    'cached_opt_list',
    'mentoring_master_site',
    'cached_model_list',
    'cached_unit_list',
  ];
  console.log('========== CEK MASTER CACHE ==========');
  for (let key of keys) {
    try {
      const val = await AsyncStorage.getItem(key);
      console.log(`${key}:`, val ? JSON.parse(val) : null);
    } catch (err) {
      console.log(`${key}: error parsing`, err);
    }
  }
  console.log('======================================');
};
