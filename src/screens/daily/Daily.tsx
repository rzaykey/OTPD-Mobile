import React, {useEffect, useState, useCallback} from 'react';
import {
  SafeAreaView,
  Text,
  FlatList,
  View,
  ActivityIndicator,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Platform,
  Alert,
} from 'react-native';
import {Picker} from '@react-native-picker/picker';
import {tabelStyles as styles} from '../../styles/tabelStyles';
import {useNavigation, useFocusEffect} from '@react-navigation/native';
import {StackNavigationProp} from '@react-navigation/stack';
import {RootStackParamList} from '../../navigation/types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {DailyActivity} from '../../navigation/types';
const pageSizeOptions = [5, 10, 50, 100];

type NavigationProp = StackNavigationProp<RootStackParamList, 'Daily'>;

export default function Daily() {
  const navigation = useNavigation<NavigationProp>();
  const [data, setData] = useState<DailyActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('http://10.0.2.2:8000/api/dayActivities');
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

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData]),
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const toggleExpand = (id: number) => {
    setExpandedId(prev => (prev === id ? null : id));
  };

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
                  `http://10.0.2.2:8000/api/dayActivities/${id}/delete`,
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

  const filteredData = data.filter(item => {
    const q = searchQuery.toLowerCase();
    return (
      item.employee_name.toLowerCase().includes(q) ||
      item.jde_no.toLowerCase().includes(q) ||
      item.site.toLowerCase().includes(q)
    );
  });

  const totalPages = Math.ceil(filteredData.length / pageSize);
  const paginatedData = filteredData.slice(
    (page - 1) * pageSize,
    page * pageSize,
  );

  useEffect(() => {
    if (totalPages > 0 && page > totalPages) {
      setPage(1);
    }
  }, [searchQuery, pageSize, totalPages, page]);

  const renderItem = ({item, index}: {item: DailyActivity; index: number}) => {
    const expanded = item.id === expandedId;
    const globalIndex = (page - 1) * pageSize + index + 1;
    return (
      <>
        <TouchableOpacity
          onPress={() => toggleExpand(item.id)}
          style={[styles.row, index % 2 === 0 ? styles.evenRow : null]}>
          <Text style={[styles.cellNo, styles.cellText]}>{globalIndex}</Text>
          <Text style={[styles.cell, styles.cellText]}>{item.jde_no}</Text>
          <Text style={[styles.cell, styles.cellText]}>
            {item.employee_name}
          </Text>
          <Text style={[styles.cell, styles.cellText]}>{item.site}</Text>
          <Text style={(styles.cell, styles.cellText)}>
            {item.date_activity.split(' ')[0]}
          </Text>
        </TouchableOpacity>
        {expanded && (
          <View style={styles.expandedArea}>
            <Text style={styles.expandedText}>
              Jenis KPI: {item.kpi_type} - {item.activity_name}
            </Text>
            <Text style={styles.expandedText}>
              Unit Detail: {item.unit_model}
            </Text>
            <Text style={styles.expandedText}>
              Jumlah Peserta: {item.total_participant}
            </Text>
            <Text style={styles.expandedText}>
              Total Hours: {item.total_hour}
            </Text>

            <View style={styles.actionButtonContainer}>
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
      </>
    );
  };

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color="#1E90FF" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{flex: 1, paddingHorizontal: 8, paddingTop: 20}}>
      <Text style={styles.pageTitle}>Daily Mentoring</Text>

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

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={true}
        style={{marginBottom: 20}}
        contentContainerStyle={{paddingRight: 16}}>
        <View style={{minWidth: 460}}>
          <View style={[styles.row, styles.headerRow]}>
            <Text style={[styles.cellNo, styles.headerCell]}>No</Text>
            <Text style={[styles.cell, styles.headerCell]}>JDE</Text>
            <Text style={[styles.cell, styles.headerCell]}>Nama</Text>
            <Text style={[styles.cell, styles.headerCell]}>Site</Text>
            <Text style={[styles.cell, styles.headerCell]}>Date</Text>
          </View>
          <FlatList
            data={paginatedData}
            keyExtractor={item => item.id.toString()}
            renderItem={renderItem}
            refreshing={refreshing}
            onRefresh={onRefresh}
            showsVerticalScrollIndicator={true}
          />
          {filteredData.length === 0 && (
            <Text
              style={{textAlign: 'center', marginVertical: 16, color: 'gray'}}>
              Tidak ada data ditemukan.
            </Text>
          )}
        </View>
      </ScrollView>

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
