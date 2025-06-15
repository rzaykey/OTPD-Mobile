import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import axios from 'axios';
import API_BASE_URL from '../config';

const TTL = 60 * 60 * 1000; // 1 jam (sebelumnya 10 menit)
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

    // --- Prefetch semua indikator mentoring per tipe
    await Promise.all(
      unitTypes.map(async type => {
        try {
          const res = await axios.get(
            `${API_BASE_URL}/mentoring/createData?type_mentoring=${type}`,
          );
          const indicators = res.data?.data?.indicators || {};
          await AsyncStorage.setItem(
            `mentoring_indicators_${type}`,
            JSON.stringify(indicators),
          );
          // Log singkat, bisa dihapus di production
          console.log('Cached indikator type', type);
        } catch (err) {
          console.log('Error cache indikator type', type, err?.message || err);
        }
      }),
    );

    // --- Cache KPI
    try {
      const kpiResp = await axios.get(`${API_BASE_URL}/getKPI`);
      const kpiList = (kpiResp.data?.data || []).map(kpi => ({
        label: kpi.kpi,
        value: kpi.id,
      }));
      await AsyncStorage.setItem('dropdown_kpi', JSON.stringify(kpiList));
    } catch (err) {
      console.log('Gagal cache KPI:', err?.message || err);
    }

    // --- Cache Model dan Unit (hindari fetch ganda)
    try {
      const modelResp = await axios.get(`${API_BASE_URL}/getModelUnit`);
      const allModel = Array.isArray(modelResp.data)
        ? modelResp.data
        : modelResp.data.data || [];
      await AsyncStorage.setItem('cached_model_list', JSON.stringify(allModel));
      // Dropdown unit (jika format sama, tinggal mapping ulang, tanpa fetch lagi)
      const unitList = allModel.map(u => ({
        label: u.model,
        value: String(u.id),
      }));
      await AsyncStorage.setItem('dropdown_unit', JSON.stringify(unitList));
    } catch (err) {
      console.log('Gagal cache MODEL/UNIT:', err?.message || err);
    }

    // --- Cache Activity Master
    try {
      const activityResp = await axios.get(`${API_BASE_URL}/getActivity/all`);
      const allActivity = activityResp.data?.data || [];
      await AsyncStorage.setItem(
        'cached_all_activity',
        JSON.stringify(allActivity),
      );
    } catch (err) {
      console.log('Gagal cache ACTIVITY:', err?.message || err);
    }

    // --- Cache Daily List
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
      console.log('Gagal cache DAILY LIST:', err?.message || err);
    }

    // --- Cache All Operator
    try {
      const optResp = await axios.get(`${API_BASE_URL}/getEmployeeOperatorAll`);
      const allOpt = Array.isArray(optResp.data)
        ? optResp.data
        : optResp.data.data || [];
      await AsyncStorage.setItem('cached_opt_list', JSON.stringify(allOpt));
    } catch (err) {
      console.log('Gagal cache OPT LIST:', err?.message || err);
    }

    // --- Cache Site (Master data untuk Add Mentoring)
    try {
      const siteResp = await axios.get(`${API_BASE_URL}/getSite`);
      await AsyncStorage.setItem(
        'mentoring_master_site',
        JSON.stringify(siteResp.data?.data || []),
      );
    } catch (e) {
      console.log('Error caching master mentoring site:', e?.message || e);
    }

    // --- Cache Unit List (all master unit)
    try {
      const unitResp = await axios.get(`${API_BASE_URL}/getMasterUnit`);
      const allUnit = Array.isArray(unitResp.data)
        ? unitResp.data
        : unitResp.data.data || [];
      await AsyncStorage.setItem('cached_unit_list', JSON.stringify(allUnit));
    } catch (err) {
      console.log('Gagal cache UNIT LIST:', err?.message || err);
    }

    await AsyncStorage.setItem('cache_master_last', String(now));
    console.log('All master & list data cached/refreshed.');
  } catch (err) {
    console.log('Error caching master data:', err?.message || err);
  }
};
