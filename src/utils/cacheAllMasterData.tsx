import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import axios from 'axios';
import API_BASE_URL from '../config';

const TTL = 60 * 60 * 1000; // 1 jam
const unitTypes = [3, 2, 5, 4];

export const cacheAllMasterData = async () => {
  let result = {success: true, errors: []};
  try {
    const state = await NetInfo.fetch();
    if (!state.isConnected) return;

    const now = Date.now();
    const lastCache = await AsyncStorage.getItem('cache_master_last');
    if (lastCache && now - Number(lastCache) < TTL) return;

    // --- Cache indikator mentoring
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

    // --- Cache Model & Unit Dropdown
    try {
      const modelResp = await axios.get(`${API_BASE_URL}/getModelUnit`);
      const allModel = Array.isArray(modelResp.data)
        ? modelResp.data
        : modelResp.data.data || [];
      await AsyncStorage.setItem('cached_model_list', JSON.stringify(allModel));
      const unitList = allModel.map(u => ({
        label: u.model,
        value: String(u.id),
        modelOnly: u.id,
      }));
      await AsyncStorage.setItem('dropdown_unit', JSON.stringify(unitList));
    } catch (err) {
      console.log('Gagal cache MODEL/UNIT:', err?.message || err);
    }

    // --- Cache Activity
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

    // --- Cache Employee Login Info
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (token) {
        const empResp = await axios.get(
          `${API_BASE_URL}/dayActivities/createDailyAct`,
          {headers: {Authorization: `Bearer ${token}`}},
        );
        const emp = empResp.data?.data?.employee;
        if (emp) {
          await AsyncStorage.setItem(
            'cached_loggedin_employee',
            JSON.stringify(emp),
          );
        }
      }
    } catch (err) {
      console.log('Gagal cache EMPLOYEE:', err?.message || err);
    }

    // --- Cache lainnya
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

    try {
      const optResp = await axios.get(`${API_BASE_URL}/getEmployeeOperatorAll`);
      const allOpt = Array.isArray(optResp.data)
        ? optResp.data
        : optResp.data.data || [];
      await AsyncStorage.setItem('cached_opt_list', JSON.stringify(allOpt));
    } catch (err) {
      console.log('Gagal cache OPT LIST:', err?.message || err);
    }

    try {
      const siteResp = await axios.get(`${API_BASE_URL}/getSite`);
      await AsyncStorage.setItem(
        'mentoring_master_site',
        JSON.stringify(siteResp.data?.data || []),
      );
    } catch (e) {
      console.log('Error caching master mentoring site:', e?.message || e);
    }

    try {
      const unitResp = await axios.get(`${API_BASE_URL}/getMasterUnit`);
      const allUnit = Array.isArray(unitResp.data)
        ? unitResp.data
        : unitResp.data.data || [];
      await AsyncStorage.setItem('cached_unit_list', JSON.stringify(allUnit));
    } catch (err) {
      console.log('Gagal cache UNIT LIST:', err?.message || err);
    }

    // --- Cache Train Hours Master
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (token) {
        const trainResp = await axios.get(`${API_BASE_URL}/trainHours/create`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        await AsyncStorage.setItem(
          'trainhours_master',
          JSON.stringify(trainResp.data?.data || {}),
        );
        console.log('✅ Train Hours master cached');
      } else {
        console.log('❌ Tidak ada token saat cache Train Hours');
      }
    } catch (err) {
      console.log('Gagal cache TRAIN HOURS:', err?.message || err);
    }

    await AsyncStorage.setItem('cache_master_last', String(now));
    console.log('✅ Master data cached.');
  } catch (err) {
    result.success = false;
    result.errors.push(err?.message || err);
    console.log('Error caching master data:', err?.message || err);
  }
};
