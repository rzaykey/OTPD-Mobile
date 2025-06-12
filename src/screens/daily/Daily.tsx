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
} from 'react-native';
import {Picker} from '@react-native-picker/picker';
import {tabelStyles as styles} from '../../styles/tabelStyles';
import {useNavigation, useFocusEffect} from '@react-navigation/native';
import {StackNavigationProp} from '@react-navigation/stack';
import {RootStackParamList, DailyActivity} from '../../navigation/types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Animatable from 'react-native-animatable';
import Icon from 'react-native-vector-icons/Ionicons';
import API_BASE_URL from '../../config';

// Dropdown pilihan jumlah data per halaman
const pageSizeOptions = [5, 10, 50, 100];

// Aktifkan LayoutAnimation di Android
if (Platform.OS === 'android') {
  UIManager.setLayoutAnimationEnabledExperimental &&
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

type NavigationProp = StackNavigationProp<RootStackParamList, 'Daily'>;

export default function Daily() {
  const navigation = useNavigation<NavigationProp>();

  // === STATE ===
  const [data, setData] = useState<DailyActivity[]>([]); // Semua data daily
  const [loading, setLoading] = useState(true); // Loading state
  const [refreshing, setRefreshing] = useState(false); // Pull-to-refresh
  const [expandedId, setExpandedId] = useState<number | null>(null); // Card yg dibuka
  const [page, setPage] = useState(1); // Halaman aktif
  const [pageSize, setPageSize] = useState(10); // Jumlah item per halaman
  const [searchQuery, setSearchQuery] = useState(''); // Keyword pencarian

  // === Ambil Data Daily Activity dari API ===
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/dayActivities`);
      const json = await res.json();
      const arr = Array.isArray(json) ? json : json.data || [];
      setData(arr);
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Fetch on mount
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Fetch setiap kembali ke page ini
  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData]),
  );

  // Refresh handler (pull to refresh)
  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  // Expand/Collapse detail card
  const toggleExpand = (id: number) => {
    setExpandedId(prev => (prev === id ? null : id));
  };

  // Handler edit data (navigate ke Edit screen)
  const handleEdit = (item: DailyActivity) => {
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

  // Handler delete data
  const handleDelete = useCallback(
    async (id: number) => {
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
                console.error('Delete error:', err);
                Alert.alert('Error', 'Terjadi kesalahan saat menghapus.');
              }
            },
          },
        ]);
      } catch (err) {
        console.error(err);
        Alert.alert('Error', 'Terjadi kesalahan.');
      }
    },
    [fetchData],
  );

  // === FILTERING, PAGING ===
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

  // Reset ke page 1 saat query/paging berubah
  useEffect(() => {
    if (totalPages > 0 && page > totalPages) {
      setPage(1);
    }
  }, [searchQuery, pageSize, totalPages, page]);

  // Reset collapse saat filter/page berubah
  useEffect(() => {
    setExpandedId(null);
  }, [searchQuery, page, pageSize]);

  // === LOADING STATE ===
  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color="#1E90FF" />
      </SafeAreaView>
    );
  }

  // === UI RENDER ===
  return (
    <SafeAreaView style={{flex: 1, paddingHorizontal: 8, paddingTop: 20}}>
      <Text style={styles.pageTitle}>Daily Mentoring</Text>

      {/* --- SEARCH INPUT --- */}
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

      {/* --- PAGE SIZE PICKER --- */}
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

      {/* --- MAIN TABLE / LIST --- */}
      <FlatList
        data={paginatedData}
        keyExtractor={item => item.id.toString()}
        renderItem={({item, index}) => {
          const expanded = item.id === expandedId;
          const globalIndex = (page - 1) * pageSize + index + 1;
          return (
            <Animatable.View
              animation={expanded ? 'fadeInDown' : 'fadeInUp'}
              duration={350}
              style={[styles.cardContainer, expanded && styles.cardExpanded]}>
              <TouchableOpacity
                onPress={() => toggleExpand(item.id)}
                style={{paddingBottom: expanded ? 0 : 8}}
                activeOpacity={0.88}>
                <View style={styles.cardHeader}>
                  <View>
                    <View style={{flexDirection: 'row', alignItems: 'center'}}>
                      <Icon
                        name="person-circle-outline"
                        size={20}
                        color="#1E90FF"
                        style={{marginRight: 5}}
                      />
                      <Text style={styles.cardTitle}>{item.employee_name}</Text>
                    </View>
                    <Text style={styles.cardSubtitle}>JDE: {item.jde_no}</Text>
                  </View>
                  <View style={{alignItems: 'flex-end'}}>
                    <Text style={styles.cardSite}>{item.site}</Text>
                    <Text style={{fontSize: 12, color: '#888'}}>
                      {(item.date_activity || '').split(' ')[0]}
                    </Text>
                    <Icon
                      name={
                        expanded ? 'chevron-up-outline' : 'chevron-down-outline'
                      }
                      size={19}
                      color="#bbb"
                    />
                  </View>
                </View>
              </TouchableOpacity>
              {expanded && (
                <View style={styles.cardDetail}>
                  <Text style={styles.cardDetailText}>
                    Jenis KPI: {item.kpi_name} - {item.activity_name}
                  </Text>
                  <Text style={styles.cardDetailText}>
                    Unit Detail: {item.unit_model}
                  </Text>
                  <Text style={styles.cardDetailText}>
                    Jumlah Peserta: {item.total_participant}
                  </Text>
                  <Text style={styles.cardDetailText}>
                    Total Hours: {item.total_hour}
                  </Text>
                  <View style={styles.cardActionRow}>
                    <TouchableOpacity
                      style={styles.editButton}
                      onPress={() => handleEdit(item)}>
                      <Text style={styles.actionButtonText}>Edit</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={() => handleDelete(item.id)}>
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
        contentContainerStyle={{paddingBottom: 22}}
      />

      {/* --- PAGINATION CONTROL --- */}
      <View style={styles.paginationContainer}>
        <TouchableOpacity
          onPress={() => setPage(p => Math.max(1, p - 1))}
          disabled={page === 1}
          style={[styles.pageButton, page === 1 && styles.pageButtonDisabled]}>
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
    </SafeAreaView>
  );
}
