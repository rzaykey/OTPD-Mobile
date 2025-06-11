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
import {RootStackParamList} from '../../navigation/types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {MopData} from '../../navigation/types';
import * as Animatable from 'react-native-animatable';
import Icon from 'react-native-vector-icons/Ionicons';
import API_BASE_URL from '../../config';

const pageSizeOptions = [5, 10, 50, 100];

if (Platform.OS === 'android') {
  UIManager.setLayoutAnimationEnabledExperimental &&
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

type NavigationProp = StackNavigationProp<RootStackParamList, 'Mop'>;

export default function Mop() {
  const navigation = useNavigation<NavigationProp>();
  const [data, setData] = useState<MopData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/mopData`);
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

  // Agar collapse reset saat filter/page berubah
  useEffect(() => {
    setExpandedId(null);
  }, [searchQuery, page, pageSize]);

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color="#1E90FF" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{flex: 1, paddingHorizontal: 8, paddingTop: 20}}>
      <Text style={styles.pageTitle}>Mine Operator Performance</Text>

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
              style={[
                styles.cardContainer,
                expanded && styles.cardExpanded,
                {marginBottom: 14, borderRadius: 14, overflow: 'hidden'},
              ]}>
              <TouchableOpacity
                onPress={() => toggleExpand(item.id)}
                style={{paddingBottom: expanded ? 0 : 8}}
                activeOpacity={0.88}>
                <View style={styles.cardHeader}>
                  <View>
                    <View style={{flexDirection: 'row', alignItems: 'center'}}>
                      <Icon
                        name="person-circle-outline"
                        size={22}
                        color="#1E90FF"
                        style={{marginRight: 7}}
                      />
                      <Text style={styles.cardTitle}>{item.employee_name}</Text>
                    </View>
                    <Text
                      style={[
                        styles.cardSubtitle,
                        {marginTop: 2, fontSize: 13},
                      ]}>
                      JDE: {item.jde_no}
                    </Text>
                  </View>
                  <View style={{alignItems: 'flex-end'}}>
                    <Text style={[styles.cardSite, {fontWeight: 'bold'}]}>
                      {item.site}
                    </Text>
                    <Text style={{fontSize: 12, color: '#888'}}>
                      {item.month}/{item.year}
                    </Text>
                    <Icon
                      name={
                        expanded ? 'chevron-up-outline' : 'chevron-down-outline'
                      }
                      size={20}
                      color="#bbb"
                      style={{marginTop: 3}}
                    />
                  </View>
                </View>
              </TouchableOpacity>

              {expanded && (
                <View
                  style={[
                    styles.cardDetail,
                    {paddingTop: 6, borderTopWidth: 1, borderTopColor: '#eee'},
                  ]}>
                  <Text style={[styles.cardSectionTitle, {marginBottom: 2}]}>
                    KPI & Absensi
                  </Text>
                  <Text style={styles.cardDetailText}>
                    Absensi: {item.a_attendance_ratio}%
                  </Text>
                  <Text style={styles.cardDetailText}>
                    Disiplin: {item.b_discipline}
                  </Text>
                  <Text style={styles.cardDetailText}>
                    Safety Awareness: {item.c_safety_awareness}
                  </Text>

                  <Text style={[styles.cardSectionTitle, {marginTop: 10}]}>
                    WH Waste Equip
                  </Text>
                  {[1, 2, 3, 4, 5, 6].map(i => {
                    const val = item[`d_wh_waste_equiptype${i}`];
                    return val ? (
                      <Text key={`wh-waste-${i}`} style={styles.cardDetailText}>
                        Equip {i}: {val}
                      </Text>
                    ) : null;
                  })}

                  <Text style={[styles.cardSectionTitle, {marginTop: 10}]}>
                    PTY Equip
                  </Text>
                  {[1, 2, 3, 4, 5, 6].map(i => {
                    const val = item[`e_pty_equiptype${i}`];
                    return val ? (
                      <Text
                        key={`pty-equip-${i}`}
                        style={styles.cardDetailText}>
                        Equip {i}: {val}
                      </Text>
                    ) : null;
                  })}

                  <Text style={[styles.cardSectionTitle, {marginTop: 10}]}>
                    Point & Grade
                  </Text>
                  <Text style={styles.cardDetailText}>
                    Point Eligibilitas:{' '}
                    <Text style={{fontWeight: 'bold'}}>
                      {item.point_eligibilitas}
                    </Text>
                  </Text>
                  <Text style={styles.cardDetailText}>
                    Point Produksi:{' '}
                    <Text style={{fontWeight: 'bold'}}>
                      {item.point_produksi}
                    </Text>
                  </Text>
                  <Text style={styles.cardDetailText}>
                    Total Point:{' '}
                    <Text style={{fontWeight: 'bold', color: '#1E90FF'}}>
                      {item.total_point}
                    </Text>
                  </Text>
                  <Text style={styles.cardDetailText}>
                    Grade Bulanan:{' '}
                    <Text style={{fontWeight: 'bold', color: '#E67E22'}}>
                      {item.mop_bulanan_grade}
                    </Text>
                  </Text>

                  <Text style={[styles.cardSectionTitle, {marginTop: 10}]}>
                    Info Lain
                  </Text>
                  <Text style={styles.cardDetailText}>
                    Tipe MOP: {item.mop_type} | Target Avg HM:{' '}
                    {item.target_avg_hm}
                  </Text>
                  <Text style={styles.cardDetailText}>
                    Point: A {item.point_a} | B {item.point_b} | C{' '}
                    {item.point_c} | D {item.point_d} | E {item.point_e}
                  </Text>
                  <Text
                    style={[
                      styles.cardDetailText,
                      {marginBottom: 4, color: '#aaa', fontSize: 12},
                    ]}>
                    Input: {item.created_at && item.created_at.split('T')[0]}
                  </Text>
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
