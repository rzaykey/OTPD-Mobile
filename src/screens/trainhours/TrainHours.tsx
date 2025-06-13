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
import {tabelStyles as styles} from '../../styles/tabelStyles';
import {useNavigation, useFocusEffect} from '@react-navigation/native';
import type {StackNavigationProp} from '@react-navigation/stack';
import type {
  RootStackParamList,
  TrainHours as TrainHoursType,
} from '../../navigation/types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Animatable from 'react-native-animatable';
import Icon from 'react-native-vector-icons/Ionicons';
import API_BASE_URL from '../../config';

// Enable layout animation khusus Android
if (Platform.OS === 'android') {
  UIManager.setLayoutAnimationEnabledExperimental &&
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

// Pilihan jumlah item per halaman
const pageSizeOptions = [5, 10, 50, 100];

// Type untuk navigasi stack
type NavigationProp = StackNavigationProp<RootStackParamList, 'TrainHours'>;

const TrainHoursScreen: React.FC = () => {
  // State hooks
  const navigation = useNavigation<NavigationProp>();
  const [data, setData] = useState<TrainHoursType[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');

  // Ambil data dari API trainHours
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/trainHours`);
      const json = await res.json();
      console.log('RAW fetch json:', json);

      // Handle respons agar selalu array
      const arr = Array.isArray(json.data) ? json.data : [];
      setData(arr);
    } catch (err) {
      console.error('Fetch error:', err);
      setData([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Ambil data pertama kali saat komponen mount
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Fetch data setiap screen focus
  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData]),
  );

  // Handle refresh swipe-down
  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  // Expand/collapse detail data card
  const toggleExpand = (id: number) => {
    setExpandedId(prev => (prev === id ? null : id));
  };

  // Filter data berdasarkan pencarian
  const filteredData = data.filter(item => {
    const q = searchQuery.toLowerCase();
    return (
      item.employee_name.toLowerCase().includes(q) ||
      item.position.toLowerCase().includes(q) ||
      item.training_type.toLowerCase().includes(q) ||
      item.site.toLowerCase().includes(q)
    );
  });

  // Pagination logika
  const totalPages = Math.ceil(filteredData.length / pageSize);
  const paginatedData = filteredData.slice(
    (page - 1) * pageSize,
    page * pageSize,
  );

  // Reset page jika search atau pageSize berubah
  useEffect(() => {
    if (totalPages > 0 && page > totalPages) {
      setPage(1);
    }
  }, [searchQuery, pageSize, totalPages, page]);

  // Tutup expand card jika search/page berubah
  useEffect(() => {
    setExpandedId(null);
  }, [searchQuery, page, pageSize]);

  // Tampilkan loading spinner jika masih loading dan bukan saat refreshing
  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color="#1E90FF" />
      </SafeAreaView>
    );
  }

  // Navigasi ke halaman EditTrainHours
  const handleEdit = (item: TrainHoursType) => {
    Alert.alert(
      'Edit Train Hours',
      `Apakah Anda ingin mengedit data untuk ${item.employee_name}?`,
      [
        {text: 'Batal', style: 'cancel'},
        {
          text: 'Edit',
          onPress: () => {
            navigation.navigate('EditTrainHours', {id: item.id});
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView style={{flex: 1, paddingHorizontal: 8, paddingTop: 20}}>
      {/* Judul halaman */}
      <Text style={styles.pageTitle}>Train Hours</Text>

      {/* Search input */}
      <TextInput
        placeholder="Cari Nama, Position, Site..."
        value={searchQuery}
        onChangeText={text => {
          setSearchQuery(text);
          setPage(1); // Reset ke halaman 1 setelah search
        }}
        style={styles.searchInput}
        {...(Platform.OS === 'ios' ? {clearButtonMode: 'while-editing'} : {})}
      />

      {/* Picker untuk memilih jumlah data per halaman */}
      <View style={styles.pickerContainer}>
        <Text style={styles.pickerLabel}>Items per page:</Text>
        <View style={styles.pickerWrapper}>
          <Picker
            selectedValue={pageSize}
            onValueChange={itemValue => {
              setPageSize(itemValue);
              setPage(1); // Reset ke halaman 1 setelah ganti pageSize
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

      {/* List data */}
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
              {/* Header card */}
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
                    <Text style={styles.cardSubtitle}>{item.position}</Text>
                  </View>
                  <View style={{alignItems: 'flex-end'}}>
                    <Text style={styles.cardSite}>{item.site}</Text>
                    <Text style={{fontSize: 12, color: '#888'}}>
                      {item.date_activity.split(' ')[0]}
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

              {/* Detail card, tampil jika expanded */}
              {expanded && (
                <View style={styles.cardDetail}>
                  <Text style={styles.cardDetailText}>
                    Training: {item.training_type} | Unit Type:{' '}
                    {item.unit_class}
                  </Text>
                  <Text style={styles.cardDetailText}>
                    Type Class: {item.unit_type.split(' ')[0]}
                  </Text>
                  <Text style={styles.cardDetailText}>
                    HM Start: {item.hm_start} - HM End {item.hm_end}
                  </Text>
                  <Text style={styles.cardDetailText}>
                    Plan Total HM: {item.plan_total_hm} | Total HM:{' '}
                    {item.total_hm}
                  </Text>
                  <Text style={styles.cardDetailText}>
                    Progres: {item.progres}
                  </Text>
                  <Text style={styles.cardDetailText}>
                    Persentase Progres:{' '}
                    {item.plan_total_hm > 0
                      ? Math.round((item.progres / item.plan_total_hm) * 100)
                      : 0}
                    %
                  </Text>
                  {/* Tombol edit */}
                  <View style={styles.cardActionRow}>
                    <TouchableOpacity
                      style={styles.editButton}
                      onPress={() => handleEdit(item)}>
                      <Text style={styles.actionButtonText}>Edit</Text>
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

      {/* Pagination navigasi */}
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
};

export default TrainHoursScreen;
