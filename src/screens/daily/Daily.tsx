/**
 * DailyActivity.tsx (Optimized)
 * -----------------------------
 * - Tidak ada auto-sync master/index saat halaman load/focus.
 * - Sync master/index hanya saat user klik tombol "Ambil Ulang dari Server".
 * - List dan create bisa tetap berjalan offline (cache).
 * - Edit/delete otomatis disable jika offline.
 * - State & proses lebih ringan, battery-friendly.
 *
 * @author [Nama Anda]
 * @created 2024-06-13
 */

import React, {useEffect, useState, useCallback} from 'react';
import {
  SafeAreaView,
  Text,
  FlatList,
  View,
  ActivityIndicator,
  TouchableOpacity,
  TextInput,
  Platform,
  Alert,
  UIManager,
  ToastAndroid,
} from 'react-native';
import {Picker} from '@react-native-picker/picker';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {tabelStyles as styles} from '../../styles/tabelStyles';
import {useNavigation, useFocusEffect} from '@react-navigation/native';
import {StackNavigationProp} from '@react-navigation/stack';
import {RootStackParamList, DailyActivity} from '../../navigation/types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Animatable from 'react-native-animatable';
import Icon from 'react-native-vector-icons/Ionicons';
import API_BASE_URL from '../../config';
import NetInfo from '@react-native-community/netinfo';

const pageSizeOptions = [5, 10, 50, 100];

// Aktifkan LayoutAnimation Android
if (Platform.OS === 'android') {
  UIManager.setLayoutAnimationEnabledExperimental &&
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

type NavigationProp = StackNavigationProp<RootStackParamList, 'Daily'>;

export default function Daily() {
  const navigation = useNavigation<NavigationProp>();
  const insets = useSafeAreaInsets();

  // Data utama
  const [data, setData] = useState<DailyActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [isConnected, setIsConnected] = useState(true);

  // Master cache
  const [kpiMaster, setKpiMaster] = useState([]);
  const [activityMaster, setActivityMaster] = useState([]);
  const [unitMaster, setUnitMaster] = useState([]);
  const [masterVersion, setMasterVersion] = useState(Date.now());

  // Status online/offline
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsConnected(state.isConnected === true);
    });
    NetInfo.fetch().then(state => setIsConnected(state.isConnected === true));
    return () => unsubscribe();
  }, []);

  /**
   * Refresh semua master data & index dari server (hanya saat user klik "Ambil Ulang dari Server")
   */
  const refreshMasterData = async () => {
    try {
      if (!isConnected) return;
      // --- Fetch KPI master
      const kpiResp = await fetch(`${API_BASE_URL}/getKPI`);
      const kpiJson = await kpiResp.json();
      const kpiArr = (kpiJson.data || []).map(kpi => ({
        label: kpi.kpi,
        value: kpi.id,
      }));
      await AsyncStorage.setItem('dropdown_kpi', JSON.stringify(kpiArr));
      setKpiMaster(kpiArr);

      // --- Fetch ALL Activity master
      const actResp = await fetch(`${API_BASE_URL}/getActivity/all`);
      const actJson = await actResp.json();
      const actArr = actJson.data || [];
      await AsyncStorage.setItem('cached_all_activity', JSON.stringify(actArr));
      setActivityMaster(actArr);

      // --- Fetch UNIT master
      const unitResp = await fetch(`${API_BASE_URL}/getModelUnit`);
      const unitArr = await unitResp.json();
      const unitData = unitArr.map(u => ({
        label: u.model,
        value: String(u.id),
        modelOnly: u.id,
      }));
      await AsyncStorage.setItem('dropdown_unit', JSON.stringify(unitData));
      setUnitMaster(unitData);

      // Paksa UI re-read master, biar flatlist update label
      setMasterVersion(Date.now());
    } catch (e) {
      ToastAndroid.show('Gagal update master data', ToastAndroid.SHORT);
    }
  };

  // Load Master Data (dari cache). Pakai masterVersion supaya re-read setelah force refresh.
  useEffect(() => {
    AsyncStorage.getItem('dropdown_kpi').then(d => {
      if (d) setKpiMaster(JSON.parse(d));
    });
    AsyncStorage.getItem('cached_all_activity').then(d => {
      if (d) setActivityMaster(JSON.parse(d));
    });
    AsyncStorage.getItem('dropdown_unit').then(d => {
      if (d) setUnitMaster(JSON.parse(d));
    });
  }, [masterVersion]);

  // Lookup helper (tidak berubah)
  function getKpiLabelById(id) {
    const found = kpiMaster.find(kpi => String(kpi.value) === String(id));
    return found ? found.label : id;
  }
  function getActivityLabelById(id) {
    const found = activityMaster.find(a => String(a.id) === String(id));
    return found ? found.activity : id;
  }
  function getUnitLabelById(id) {
    const found = unitMaster.find(
      u => String(u.value) === String(id) || String(u.modelOnly) === String(id),
    );
    return found ? found.label : id;
  }

  /**
   * Fetch index dari server (paksa update) HANYA saat user klik tombol
   */
  const fetchDataFromServer = async (showToast = true) => {
    try {
      setLoading(true);
      // Index utama
      const res = await fetch(`${API_BASE_URL}/apiDayActAll`);
      const json = await res.json();
      const arr = Array.isArray(json) ? json : json.data || [];
      setData(arr);
      await AsyncStorage.setItem(
        'cached_daily_activity_list',
        JSON.stringify(arr),
      );
      // --- Refresh master juga
      await refreshMasterData(); // <<== Ini otomatis update masterVersion!
      if (showToast)
        ToastAndroid.show('Data di-refresh dari server!', ToastAndroid.SHORT);
    } catch (err) {
      if (showToast)
        ToastAndroid.show(
          'Gagal fetch server! Menampilkan cache terakhir.',
          ToastAndroid.LONG,
        );
      const cache = await AsyncStorage.getItem('cached_daily_activity_list');
      if (cache) setData(JSON.parse(cache));
      else setData([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  /**
   * Fetch dari cache saja (tidak ada auto-refresh master/index, lebih ringan)
   */
  const fetchData = useCallback(async () => {
    const cache = await AsyncStorage.getItem('cached_daily_activity_list');
    if (cache) setData(JSON.parse(cache));
    setLoading(false);
    setRefreshing(false);
  }, []);

  // Initial fetch data (cache only, tidak auto-refresh master)
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData]),
  );

  // Pull to refresh (swipe down): juga hanya load dari cache
  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  // Expand/collapse
  const toggleExpand = (id: number) => {
    setExpandedId(prev => (prev === id ? null : id));
  };

  // Edit handler: hanya aktif saat online
  const handleEdit = (item: DailyActivity) => {
    if (!isConnected) {
      Alert.alert('Offline', 'Edit hanya tersedia saat online.');
      return;
    }
    Alert.alert(
      'Edit Daily',
      `Apakah Anda ingin mengedit data untuk ${item.employee_name}?`,
      [
        {text: 'Batal', style: 'cancel'},
        {
          text: 'Edit',
          onPress: () => {
            navigation.navigate('EditDailyActivity', {id: item.id});
          },
        },
      ],
    );
  };

  // Delete handler: hanya aktif saat online
  const handleDelete = useCallback(
    async (id: number) => {
      if (!isConnected) {
        Alert.alert('Offline', 'Hapus hanya tersedia saat online.');
        return;
      }
      try {
        const token = await AsyncStorage.getItem('userToken');
        if (!token) return Alert.alert('Sesi Habis', 'Silakan login kembali.');
        Alert.alert('Konfirmasi Hapus', 'Yakin ingin menghapus data ini?', [
          {text: 'Batal', style: 'cancel'},
          {
            text: 'Hapus',
            style: 'destructive',
            onPress: async () => {
              try {
                const res = await fetch(
                  `${API_BASE_URL}/dayActivities/${id}/delete`,
                  {
                    method: 'DELETE',
                    headers: {
                      Authorization: `Bearer ${token}`,
                      'Content-Type': 'application/json',
                      Accept: 'application/json',
                    },
                  },
                );
                const text = await res.text();
                const json = JSON.parse(text);
                if (json.success) {
                  Alert.alert('Sukses', json.message);
                  fetchData();
                } else {
                  Alert.alert('Gagal', json.message || 'Gagal menghapus data.');
                }
              } catch (err) {
                Alert.alert('Error', 'Terjadi kesalahan saat menghapus.');
              }
            },
          },
        ]);
      } catch (err) {
        Alert.alert('Error', 'Terjadi kesalahan.');
      }
    },
    [fetchData, isConnected],
  );

  // Filtering & paging
  const filteredData = data.filter(item => {
    const q = searchQuery.toLowerCase();
    return (
      item.employee_name?.toLowerCase().includes(q) ||
      item.jde_no?.toLowerCase().includes(q) ||
      item.site?.toLowerCase().includes(q)
    );
  });

  const totalPages = Math.ceil(filteredData.length / pageSize);

  const paginatedData = filteredData.slice(
    (page - 1) * pageSize,
    page * pageSize,
  );

  // Reset page jika search/paging berubah
  useEffect(() => {
    if (totalPages > 0 && page > totalPages) {
      setPage(1);
    }
  }, [searchQuery, pageSize, totalPages, page]);

  // Reset expand card saat filter/page berubah
  useEffect(() => {
    setExpandedId(null);
  }, [searchQuery, page, pageSize]);

  // Loading Spinner
  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color="#1E90FF" />
      </SafeAreaView>
    );
  }

  // --- UI ---
  return (
    <SafeAreaView style={{flex: 1, backgroundColor: '#fff'}}>
      <View style={{flex: 1, paddingHorizontal: 8, paddingTop: 20}}>
        {/* --- Judul halaman dan Force Refresh --- */}
        <View style={{marginBottom: 10, marginTop: 2}}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
            {/* Status Online/Offline */}
            <View style={{alignItems: 'flex-end', flex: 1}}>
              <Text
                style={{
                  backgroundColor: isConnected ? '#d4edda' : '#f8d7da',
                  color: isConnected ? '#155724' : '#721c24',
                  paddingHorizontal: 12,
                  paddingVertical: 4,
                  borderRadius: 16,
                  fontWeight: 'bold',
                  fontSize: 13,
                  alignSelf: 'flex-end',
                  marginBottom: 3,
                }}>
                {isConnected ? '🟢 Online' : '🔴 Offline'}
              </Text>
            </View>
            {/* Tombol Ambil Ulang dari Server */}
            {isConnected && (
              <TouchableOpacity
                style={{
                  backgroundColor: '#1E90FF',
                  borderRadius: 8,
                  paddingVertical: 7,
                  paddingHorizontal: 16,
                  alignSelf: 'flex-end',
                  marginLeft: 12,
                }}
                onPress={fetchDataFromServer}
                disabled={loading}>
                <Text style={{color: '#fff', fontWeight: 'bold', fontSize: 14}}>
                  Ambil Ulang dari Server
                </Text>
              </TouchableOpacity>
            )}
          </View>
          {/* Judul halaman */}
          <Text style={[styles.pageTitle, {marginBottom: 2}]}>
            Daily Activity
          </Text>
        </View>
        {/* Search */}
        <TextInput
          placeholder="Cari Nama, JDE, atau Site..."
          value={searchQuery}
          onChangeText={text => {
            setSearchQuery(text);
            setPage(1);
          }}
          style={styles.searchInput}
          {...(Platform.OS === 'ios' ? {clearButtonMode: 'while-editing'} : {})}
        />
        {/* Pilihan page size */}
        <View style={styles.pickerContainer}>
          <Text style={styles.pickerLabel}>Items per page:</Text>
          <View style={styles.pickerWrapper}>
            <Picker
              selectedValue={pageSize}
              onValueChange={itemValue => {
                setPageSize(itemValue);
                setPage(1);
              }}
              style={styles.picker}
              dropdownIconColor="#1E90FF"
              mode="dropdown">
              {pageSizeOptions.map(size => (
                <Picker.Item key={size} label={size.toString()} value={size} />
              ))}
            </Picker>
          </View>
        </View>
        {/* FlatList data */}
        <FlatList
          data={paginatedData}
          keyExtractor={item => item.id.toString()}
          renderItem={({item, index}) => {
            const expanded = item.id === expandedId;
            return (
              <Animatable.View
                animation={expanded ? 'fadeInDown' : 'fadeInUp'}
                duration={350}
                style={[styles.cardContainer, expanded && styles.cardExpanded]}>
                {/* Card Header */}
                <TouchableOpacity
                  onPress={() => toggleExpand(item.id)}
                  style={{paddingBottom: expanded ? 0 : 8}}
                  activeOpacity={0.88}>
                  <View style={styles.cardHeader}>
                    <View>
                      <View
                        style={{flexDirection: 'row', alignItems: 'center'}}>
                        <Icon
                          name="person-circle-outline"
                          size={20}
                          color="#1E90FF"
                          style={{marginRight: 5}}
                        />
                        <Text style={styles.cardTitle}>
                          {item.employee_name}
                        </Text>
                      </View>
                      <Text style={styles.cardSubtitle}>
                        JDE: {item.jde_no}
                      </Text>
                    </View>
                    <View style={{alignItems: 'flex-end'}}>
                      <Text style={styles.cardSite}>{item.site}</Text>
                      <Text style={{fontSize: 12, color: '#888'}}>
                        {(item.date_activity || '').split(' ')[0]}
                      </Text>
                      <Icon
                        name={
                          expanded
                            ? 'chevron-up-outline'
                            : 'chevron-down-outline'
                        }
                        size={19}
                        color="#bbb"
                      />
                    </View>
                  </View>
                </TouchableOpacity>
                {/* Card Detail */}
                {expanded && (
                  <View style={styles.cardDetail}>
                    <Text style={styles.cardDetailText}>
                      Jenis KPI: {getKpiLabelById(item.kpi_type)} -{' '}
                      {getActivityLabelById(item.activity)}
                    </Text>
                    <Text style={styles.cardDetailText}>
                      Unit Detail: {getUnitLabelById(item.unit_detail)}
                    </Text>
                    <Text style={styles.cardDetailText}>
                      Jumlah Peserta: {item.total_participant}
                    </Text>
                    <Text style={styles.cardDetailText}>
                      Total Hours: {item.total_hour}
                    </Text>
                    <View style={styles.cardActionRow}>
                      <TouchableOpacity
                        style={[
                          styles.editButton,
                          !isConnected && {opacity: 0.4},
                        ]}
                        onPress={() => handleEdit(item)}
                        disabled={!isConnected}>
                        <Text style={styles.actionButtonText}>Edit</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[
                          styles.deleteButton,
                          !isConnected && {opacity: 0.4},
                        ]}
                        onPress={() => handleDelete(item.id)}
                        disabled={!isConnected}>
                        <Text style={styles.actionButtonText}>Hapus</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </Animatable.View>
            );
          }}
          refreshing={refreshing}
          onRefresh={onRefresh}
          showsVerticalScrollIndicator={true}
          ListEmptyComponent={
            <Text
              style={{textAlign: 'center', marginVertical: 16, color: 'gray'}}>
              Tidak ada data ditemukan.
            </Text>
          }
          contentContainerStyle={{
            paddingBottom: 100 + insets.bottom,
          }}
        />

        {/* Pagination Bar */}
        <View
          style={[
            styles.paginationContainer,
            {
              paddingBottom: insets.bottom || 18,
              backgroundColor: '#fff',
              borderTopWidth: 0.5,
              borderColor: '#eee',
            },
          ]}>
          <TouchableOpacity
            onPress={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            style={[
              styles.pageButton,
              page === 1 && styles.pageButtonDisabled,
            ]}>
            <Text style={styles.pageButtonText}>Prev</Text>
          </TouchableOpacity>
          <Text style={styles.pageInfo}>
            Page {page} / {totalPages || 1}
          </Text>
          <TouchableOpacity
            onPress={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages || totalPages === 0}
            style={[
              styles.pageButton,
              (page === totalPages || totalPages === 0) &&
                styles.pageButtonDisabled,
            ]}>
            <Text style={styles.pageButtonText}>Next</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}
