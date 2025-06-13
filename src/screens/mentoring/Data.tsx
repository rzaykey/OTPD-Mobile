import React, {useEffect, useState, useCallback} from 'react';
import {
  SafeAreaView,
  Text,
  FlatList,
  View,
  ActivityIndicator,
  TouchableOpacity,
  TextInput,
  Alert,
  UIManager,
  Platform,
} from 'react-native';
import {Picker} from '@react-native-picker/picker';
import {useSafeAreaInsets} from 'react-native-safe-area-context'; // PENTING untuk bottom padding aman!
import {tabelStyles as styles} from '../../styles/tabelStyles';
import {useNavigation, useFocusEffect} from '@react-navigation/native';
import {StackNavigationProp} from '@react-navigation/stack';
import {RootStackParamList, MentoringData} from '../../navigation/types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Animatable from 'react-native-animatable';
import Icon from 'react-native-vector-icons/Ionicons';
import API_BASE_URL from '../../config';

// Enable LayoutAnimation untuk Android gesture/expand animation
if (Platform.OS === 'android') {
  UIManager.setLayoutAnimationEnabledExperimental &&
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

// Pilihan page size (jumlah data per halaman)
const pageSizeOptions = [5, 10, 50, 100];
type NavigationProp = StackNavigationProp<RootStackParamList, 'Data'>;

/**
 * Komponen utama Data Mentoring (list, search, pagination, edit, delete)
 */
export default function Data() {
  const navigation = useNavigation<NavigationProp>();
  const insets = useSafeAreaInsets(); // --> Supaya UI aman dari notch/gesture bar

  // State utama
  const [data, setData] = useState<MentoringData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');

  /**
   * Ambil data dari API
   */
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/mentoring-data`);
      const json = await res.json();
      // Pastikan response selalu array
      const arr = Array.isArray(json) ? json : json.data || [];
      setData(arr);
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Load data saat mount & setiap focus ke screen ini
  useEffect(() => {
    fetchData();
  }, [fetchData]);
  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData]),
  );

  // Pull to refresh handler
  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  // Expand/collapse card detail
  const toggleExpand = (id: number) => {
    setExpandedId(prev => (prev === id ? null : id));
  };

  // Handler tombol Edit
  const handleEdit = (item: MentoringData) => {
    Alert.alert(
      'Edit Data',
      `Apakah Anda ingin mengedit data untuk ${item.operator_name}?`,
      [
        {text: 'Batal', style: 'cancel'},
        {
          text: 'Edit',
          onPress: () =>
            navigation.navigate('EditDataMentoring', {id: item.id}),
        },
      ],
    );
  };

  // Handler tombol Hapus
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
                  `${API_BASE_URL}/mentoring/${id}/delete`,
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

  // Filter pencarian
  const filteredData = data.filter(item => {
    const q = searchQuery.toLowerCase();
    return (
      item.trainer_name.toLowerCase().includes(q) ||
      item.operator_name.toLowerCase().includes(q) ||
      item.site.toLowerCase().includes(q)
    );
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredData.length / pageSize);
  const paginatedData = filteredData.slice(
    (page - 1) * pageSize,
    page * pageSize,
  );

  // Reset page jika search/pageSize berubah
  useEffect(() => {
    if (totalPages > 0 && page > totalPages) {
      setPage(1);
    }
  }, [searchQuery, pageSize, totalPages, page]);

  // Reset expanded card saat search/pagination berubah
  useEffect(() => {
    setExpandedId(null);
  }, [searchQuery, page, pageSize]);

  // Loader/Spinner saat fetching
  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color="#1E90FF" />
      </SafeAreaView>
    );
  }

  // Main render
  return (
    <SafeAreaView style={{flex: 1, backgroundColor: '#fff'}}>
      <View style={{flex: 1, paddingHorizontal: 8, paddingTop: 20}}>
        {/* Judul halaman */}
        <Text style={styles.pageTitle}>Data Mentoring</Text>

        {/* Search input */}
        <TextInput
          placeholder="Cari Trainer, Operator, atau Site..."
          value={searchQuery}
          onChangeText={text => {
            setSearchQuery(text);
            setPage(1);
          }}
          style={styles.searchInput}
          {...(Platform.OS === 'ios' ? {clearButtonMode: 'while-editing'} : {})}
        />

        {/* Picker jumlah item per halaman */}
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
          renderItem={({item}) => {
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
                          {item.operator_name}
                        </Text>
                      </View>
                      <Text style={styles.cardSubtitle}>
                        {item.trainer_name}
                      </Text>
                    </View>
                    <View style={{alignItems: 'flex-end'}}>
                      <Text style={styles.cardSite}>{item.site}</Text>
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
                {/* Card Detail (expand) */}
                {expanded && (
                  <View style={styles.cardDetail}>
                    <Text style={styles.cardDetailText}>Area: {item.area}</Text>
                    <Text style={styles.cardDetailText}>
                      Unit Class: {item.class_name}
                    </Text>
                    <Text style={styles.cardDetailText}>
                      Date: {item.date_mentoring.split(' ')[0]}
                    </Text>
                    <Text style={styles.cardDetailText}>
                      Hour: {item.start_time} - {item.end_time}
                    </Text>
                    <Text style={styles.cardDetailText}>
                      Point Observasi: {item.average_point_observation}
                    </Text>
                    <Text style={styles.cardDetailText}>
                      Point Mentoring: {item.average_point_mentoring}
                    </Text>
                    {/* Tombol Aksi */}
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
          contentContainerStyle={{
            paddingBottom: 100 + insets.bottom, // Biar bawah tidak ketutup gesture bar/device navbar
          }}
        />

        {/* Pagination bar fix di bawah */}
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
