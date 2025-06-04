import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  Platform,
  TouchableOpacity,
  TextInput,
  ScrollView,
} from 'react-native';
import axios from 'axios';
import RNPickerSelect from 'react-native-picker-select';
import DateTimePicker from '@react-native-community/datetimepicker';
import Icon from 'react-native-vector-icons/Ionicons';
import CheckBox from '@react-native-community/checkbox';

import {editDataStyles as styles} from '../styles/editDataStyles';
import {pickerSelectStyles} from '../styles/pickerSelectStyles';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useNavigation} from '@react-navigation/native';
import {RootStackParamList} from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'AddDataMentoring'>;

// --- Type definitions ---
type IndicatorDetail = {
  fid_indicator: string | number;
  is_observasi?: '0' | '1';
  is_mentoring?: '0' | '1';
  note_observasi?: string;
  [key: string]: any;
};

type IndicatorList = {
  [category: string]: {
    id: string | number;
    param1: string;
    [key: string]: any;
  }[];
};

type Points = {
  [category: string]: {
    indicator: string;
    yscore: number;
    point: number;
    [key: string]: any;
  };
};

type Penilaian = {
  id: number;
  fid_mentoring: string;
  indicator: string;
  yscore: string;
  point: string;
  created_at: string;
  created_by: string;
  updated_at: string | null;
  updated_by: string | null;
  type_penilaian: 'observasi' | 'mentoring';
}[];

type ToggleCardProps = {
  title: string;
  children: React.ReactNode;
  defaultExpanded?: boolean;
};

const ToggleCard: React.FC<ToggleCardProps> = ({
  title,
  children,
  defaultExpanded = true,
}) => {
  const [expanded, setExpanded] = useState(defaultExpanded);

  return (
    <View style={styles.card}>
      <TouchableOpacity
        style={styles.toggleButton}
        onPress={() => setExpanded(!expanded)}>
        <Icon
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={20}
          color="#007AFF"
        />
        <Text style={styles.sectionTitle}>{title}</Text>
      </TouchableOpacity>
      {expanded && <View style={styles.sectionContent}>{children}</View>}
    </View>
  );
};

const AddDataMentoring = ({route}: Props) => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);

  const [operatorJDE, setOperatorJDE] = useState<string | null>(null);
  const [operatorName, setOperatorName] = useState<string | null>(null);

  const [trainerName, setTrainerName] = useState<string | null>(null);
  const [trainerJDE, setTrainerJDE] = useState<string | null>(null);
  const [site, setSite] = useState<string | null>(null);

  const [operatorQuery, setOperatorQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showResults, setShowResults] = useState(false);

  const [headerData, setHeaderData] = useState<any | null>(null);
  const [rawSiteList, setRawSiteList] = useState<any[]>([]);
  const [siteList, setSiteList] = useState<{label: string; value: string}[]>(
    [],
  );
  const [selectedSite, setSelectedSite] = useState<string | null>(null);

  const [modelUnitRaw, setModelUnitRaw] = useState<any[]>([]);
  const [unitRaw, setUnitRaw] = useState<any[]>([]);

  const [unitTypes, setUnitTypes] = useState<{label: string; value: string}[]>(
    [],
  );
  const [modelUnits, setModelUnits] = useState<
    {label: string; value: string}[]
  >([]);
  const [unitNumbers, setUnitNumbers] = useState<
    {label: string; value: string}[]
  >([]);

  // const [unitType, setUnitType] = useState<string | null>(null);
  const {data} = route.params;
  const {unitType} = data;

  const [unitModel, setUnitModel] = useState<string | null>(null);
  const [unitNumber, setUnitNumber] = useState<string | null>(null);

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);
  const [visibleCategories, setVisibleCategories] = useState<{
    [key: string]: boolean;
  }>({});

  const [expanded, setExpanded] = useState(true);
  const [indicators, setIndicators] = useState<IndicatorList>({});
  // const [editableDetails, setEditableDetails] = useState<IndicatorDetail[]>([]);
  const [dateMentoring, setDateMentoring] = useState(new Date());
  const [startTime, setStartTime] = useState(new Date());
  const [endTime, setEndTime] = useState(new Date());
  const [editableDetails, setEditableDetails] = React.useState([]);

  const [points, setPoints] = useState<Points>({});

  // Gunakan unitType, karena itu yang sesuai dengan API
  useEffect(() => {
    if (unitType) {
      fetchIndicatorsByType(unitType);
    }
  }, [unitType]);

  const fetchIndicatorsByType = async (unitType: string) => {
    try {
      const upperType = unitType.toUpperCase();
      const response = await fetch(
        `http://10.0.2.2:8000/api/mentoring/createData?type_mentoring=${upperType}`,
      );
      const result = await response.json();

      if (result.success && typeof result?.data?.indicators === 'object') {
        setIndicators(result.data.indicators); // format { [indicator_type]: IndicatorItem[] }
      } else {
        console.warn('Format indikator tidak sesuai:', result);
        setIndicators({});
      }
    } catch (err) {
      console.error('Gagal mengambil indikator:', err);
      setIndicators({});
    }
  };

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userString = await AsyncStorage.getItem('userData');
        if (userString) {
          const user = JSON.parse(userString);
          console.log('User login data:', user);
          setTrainerJDE(user.username); // Set JDE dari username
          setTrainerName(user.name); // Set nama trainer dari name
          setSite(user.site); // Set nama trainer dari name
        } else {
          console.log('Tidak ada data user login');
        }
      } catch (error) {
        console.error('Error membaca data user:', error);
      }
    };

    fetchUser();
  }, []);

  // FETCH SEMUA DATA YANG TIDAK TERGANTUNG UNIT TYPE
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get(
          'http://10.0.2.2:8000/api/mentoring/createData',
        );
        const {
          header,
          siteList: site_list,
          models: model_unit,
          units: unit,
          details,
        } = res.data?.data || {};

        if (!header) {
          console.log('Header kosong, create mode aktif');
          setHeaderData(header);
        }

        setRawSiteList(site_list || []);
        setModelUnitRaw(model_unit || []);
        setUnitRaw(unit || []);
        setEditableDetails(details || []);
        setPoints({});
      } catch (error) {
        console.error('Fetch data error:', error);
        alert('Gagal mengambil data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Update unitTypes dari modelUnitRaw (ambil distinct class)
  useEffect(() => {
    if (!modelUnitRaw.length) return;
    const types = Array.from(
      new Set(modelUnitRaw.map(m => m.class.trim())),
    ).map(t => ({label: t, value: t}));
    setUnitTypes(types);
  }, [modelUnitRaw]);

  // Update modelUnits saat unitType berubah
  useEffect(() => {
    if (!unitType || !modelUnitRaw.length) {
      setModelUnits([]);
      setUnitModel(null);
      return;
    }

    const filteredModels = modelUnitRaw
      .filter(
        m => m.class.trim().toLowerCase() === unitType.trim().toLowerCase(),
      )
      .map(m => ({label: m.model, value: String(m.id)}));

    setModelUnits(filteredModels);
    setUnitModel(null);
  }, [unitType, modelUnitRaw]);

  // Update unitNumbers saat unitModel berubah
  useEffect(() => {
    if (!unitModel || !unitRaw.length) {
      setUnitNumbers([]);
      setUnitNumber(null);
      return;
    }

    const filteredUnits = unitRaw
      .filter(u => String(u.fid_model) === String(unitModel))
      .map(u => ({label: u.no_unit, value: String(u.id)}));

    setUnitNumbers(filteredUnits);
    setUnitNumber(null);
  }, [unitModel, unitRaw]);

  // Operator search function tetap sama
  const searchOperator = async (text: string) => {
    setOperatorQuery(text);
    setShowResults(true);
    if (text.length >= 2) {
      try {
        const response = await axios.get(
          `http://10.0.2.2:8000/api/getEmployeeOperator?q=${text}`,
        );
        setSearchResults(response.data);
      } catch (error) {
        console.error('Gagal mencari operator:', error);
      }
    } else {
      setSearchResults([]);
    }
  };

  const handleSelectOperator = (item: any) => {
    setOperatorJDE(item.employeeId);
    setOperatorName(item.EmployeeName);
    setOperatorQuery(`${item.employeeId} - ${item.EmployeeName}`);
    setShowResults(false);
  };

  useEffect(() => {
    if (rawSiteList.length > 0) {
      const sites = rawSiteList
        .filter(site => site.active === '1')
        .map(site => ({
          label: site.code_site,
          value: site.code_site,
        }));
      setSiteList(sites);

      if (headerData !== null && headerData?.site) {
        setSelectedSite(headerData.site);
      }
    }
  }, [rawSiteList, headerData]); // Tambahkan dependency

  // Toggle checkbox values
  const toggleCheckbox = (fid, field) => {
    setEditableDetails(prev => {
      const existing = prev.find(d => d.fid_indicator === fid);
      if (existing) {
        return prev.map(d =>
          d.fid_indicator === fid
            ? {
                ...d,
                [field]: d[field] === '1' ? '0' : '1', // toggle antara '1' dan '0'
              }
            : d,
        );
      } else {
        return [
          ...prev,
          {
            fid_indicator: fid,
            is_observasi: field === 'is_observasi' ? '1' : '0',
            is_mentoring: field === 'is_mentoring' ? '1' : '0',
            note_observasi: '',
          },
        ];
      }
    });
  };

  const updateNote = (fid, note) => {
    setEditableDetails(prev => {
      const existing = prev.find(d => d.fid_indicator === fid);
      if (existing) {
        return prev.map(d =>
          d.fid_indicator === fid
            ? {
                ...d,
                note_observasi: note,
              }
            : d,
        );
      } else {
        return [
          ...prev,
          {
            fid_indicator: fid,
            is_observasi: '0',
            is_mentoring: '0',
            note_observasi: note,
          },
        ];
      }
    });
  };

  const calculatePoints = (details: IndicatorDetail[]) => {
    const newPoints: {
      [kategori: string]: {
        indicator: string;
        yscoreObservasi: number;
        pointObservasi: number;
        yscoreMentoring: number;
        pointMentoring: number;
      };
    } = {};

    for (const kategori in indicators) {
      const indicatorList = indicators[kategori];

      let yObs = 0;
      let yMentor = 0;

      indicatorList.forEach(ind => {
        const detail = details.find(
          d => String(d.fid_indicator) === String(ind.id),
        );
        if (detail) {
          if (detail.is_observasi === '1') yObs += 1;
          if (detail.is_mentoring === '1') yMentor += 1;
        }
      });

      newPoints[kategori] = {
        indicator: kategori,
        yscoreObservasi: yObs,
        pointObservasi: yObs * 12.5,
        yscoreMentoring: yMentor,
        pointMentoring: yMentor * 12.5,
      };
    }

    return newPoints;
  };

  useEffect(() => {
    const updatedPoints = calculatePoints(editableDetails);
    setPoints(updatedPoints);
  }, [editableDetails]);

  // Date and time pickers handlers
  const onChangeDate = (event, selectedDate) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    if (event.type === 'dismissed') return;
    if (selectedDate) setDateMentoring(selectedDate);
  };

  const onChangeStartTime = (event, selectedTime) => {
    if (Platform.OS === 'android') {
      setShowStartTimePicker(false);
    }
    if (event.type === 'dismissed') return;
    if (selectedTime) setStartTime(selectedTime);
  };

  const onChangeEndTime = (event, selectedTime) => {
    if (Platform.OS === 'android') {
      setShowEndTimePicker(false);
    }
    if (event.type === 'dismissed') return;
    if (selectedTime) setEndTime(selectedTime);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1E90FF" />
      </View>
    );
  }

  if (loading) {
    return (
      <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
        <ActivityIndicator size="large" />
        <Text>Loading data...</Text>
      </View>
    );
  }

  const toggleCategoryVisibility = (kategori: string) => {
    setVisibleCategories(prev => ({
      ...prev,
      [kategori]: !prev[kategori],
    }));
  };

  const renderLivePointsSection = (type: 'observasi' | 'mentoring') => {
    const isObs = type === 'observasi';
    const dataFiltered = Object.values(points);

    const totalYScore = dataFiltered.reduce(
      (sum, p) => sum + (isObs ? p.yscoreObservasi : p.yscoreMentoring),
      0,
    );
    const totalPoint = dataFiltered.reduce(
      (sum, p) => sum + (isObs ? p.pointObservasi : p.pointMentoring),
      0,
    );
    const averagePoint =
      dataFiltered.length && !isNaN(totalPoint)
        ? (totalPoint / dataFiltered.length).toFixed(1)
        : '0.0';

    return {
      totalYScore,
      totalPoint,
      averagePoint,
      jsx: (
        <ToggleCard
          title={isObs ? 'Rekap Point Observasi' : 'Rekap Point Mentoring'}>
          <View style={styles.pointsGrid}>
            {dataFiltered.map((item, index) => (
              <View key={index} style={styles.pointCard}>
                <Text style={styles.pointCategory}>{item.indicator}</Text>
                <View style={styles.pointRow}>
                  <Text style={styles.pointLabel}>Y Score:</Text>
                  <Text style={styles.pointValue}>
                    {isObs ? item.yscoreObservasi : item.yscoreMentoring}
                  </Text>
                </View>
                <View style={styles.pointRow}>
                  <Text style={styles.pointLabel}>Point:</Text>
                  <Text style={styles.pointValue}>
                    {isObs ? item.pointObservasi : item.pointMentoring}
                  </Text>
                </View>
              </View>
            ))}

            <View style={[styles.pointCard, styles.summaryCard]}>
              <Text style={[styles.pointCategory, {fontWeight: 'bold'}]}>
                AVERAGE POINT
              </Text>
              <View style={styles.pointRow}>
                <Text style={styles.pointLabel}>Total Y Score:</Text>
                <Text style={styles.pointValue}>{totalYScore}</Text>
              </View>
              <View style={styles.pointRow}>
                <Text style={styles.pointLabel}>Average Point:</Text>
                <Text style={styles.pointValue}>{averagePoint}</Text>
              </View>
            </View>
          </View>
        </ToggleCard>
      ),
    };
  };

  const observasiPoints = renderLivePointsSection('observasi');
  const mentoringPoints = renderLivePointsSection('mentoring');

  const handleSubmit = async () => {
    try {
      setLoading(true);

      // 1. Authentication Check
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        throw new Error('Sesi telah berakhir. Silakan login kembali.');
      }

      // 2. Field Validation
      if (!unitType || !unitModel || !unitNumber) {
        throw new Error('Harap lengkapi semua informasi unit');
      }

      // 3. Calculate Points Data
      const calculatePoints = (type: 'observasi' | 'mentoring') => {
        const isObs = type === 'observasi';
        const dataFiltered = Object.values(points);

        const totalYScore = dataFiltered.reduce(
          (sum, p) => sum + (isObs ? p.yscoreObservasi : p.yscoreMentoring),
          0,
        );

        const totalPoint = dataFiltered.reduce(
          (sum, p) => sum + (isObs ? p.pointObservasi : p.pointMentoring),
          0,
        );

        const averagePoint =
          dataFiltered.length && !isNaN(totalPoint)
            ? parseFloat((totalPoint / dataFiltered.length).toFixed(1))
            : 0;

        return {totalYScore, averagePoint};
      };

      const observasiPoints = calculatePoints('observasi');
      const mentoringPoints = calculatePoints('mentoring');

      // 4. Prepare Payload
      const payload = {
        IDTypeMentoring: unitType, // pastikan ini sesuai dengan kebutuhan backend
        IDtrainer: trainerJDE,
        trainer: trainerName,
        IDoperator: operatorJDE,
        operator: operatorName,
        site: site,
        area: selectedSite || '',

        type: unitType,
        model: unitModel,
        unit: unitNumber,

        date: dateMentoring.toISOString().split('T')[0],
        time_start: `${startTime.getHours()}:${String(
          startTime.getMinutes(),
        ).padStart(2, '0')}`,
        time_end: `${endTime.getHours()}:${String(
          endTime.getMinutes(),
        ).padStart(2, '0')}`,

        // Calculated Points
        average_yscore_observation: observasiPoints.totalYScore,
        average_point_observation: observasiPoints.averagePoint,
        average_yscore_mentoring: mentoringPoints.totalYScore,
        average_point_mentoring: mentoringPoints.averagePoint,

        // Indicators
        indicators: editableDetails.map(detail => ({
          fid_indicator: detail.fid_indicator,
          is_observasi: detail.is_observasi,
          is_mentoring: detail.is_mentoring,
          note_observasi: detail.note_observasi || '',
          yscore: detail.yscore, // jika dipakai
          point: detail.point, // jika dipakai
        })),
      };

      console.log('Payload to be submitted:', payload);

      // 5. API Call
      const response = await axios.post(
        `http://10.0.2.2:8000/api/mentoring/store`,
        payload,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
          },
          withCredentials: true,
        },
      );

      // 6. Handle Response
      if (response.data.success) {
        alert('Data mentoring berhasil diperbarui!');

        if (navigation.canGoBack()) {
          navigation.goBack();
        } else {
          navigation.navigate('FullDashboard'); // fallback
        }
      } else {
        throw new Error(response.data.message || 'Gagal memperbarui data');
      }
    } catch (error: any) {
      console.error('Submission error:', error);

      if (error.response?.status === 401) {
        await AsyncStorage.removeItem('userToken');
        alert('Sesi telah berakhir. Silakan login kembali.');
        navigation.reset({
          index: 0,
          routes: [{name: 'Login'}],
        });
      } else {
        alert(
          `Error: ${
            error.response?.data?.message ||
            error.message ||
            'Terjadi kesalahan'
          }`,
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView
      style={{flex: 1}}
      contentContainerStyle={{paddingBottom: 40}}
      keyboardShouldPersistTaps="handled">
      <View style={styles.container}>
        <Text style={styles.title}>Tambah Data Mentoring {unitType}</Text>

        {/* Header */}
        <View style={styles.card}>
          {/* TOGGLE HEADER */}
          <TouchableOpacity
            style={styles.toggleButton}
            onPress={() => setExpanded(!expanded)}>
            <Icon
              name={expanded ? 'chevron-up' : 'chevron-down'}
              size={20}
              color="#007AFF"
            />
            <Text style={styles.sectionTitle}>Header</Text>
          </TouchableOpacity>

          {/* EXPANDABLE CONTENT */}
          {expanded && (
            <View style={styles.sectionContent}>
              {/* ROW: Trainer Info */}
              <View style={styles.row}>
                <View style={styles.half}>
                  <Text style={styles.label}>Trainer JDE</Text>
                  <TextInput
                    value={trainerJDE}
                    editable={false}
                    style={styles.input}
                  />
                </View>
                <View style={styles.half}>
                  <Text style={styles.label}>Nama Trainer</Text>
                  <TextInput
                    value={trainerName}
                    editable={false}
                    style={styles.input}
                  />
                </View>
              </View>

              {/* OPERATOR SECTION */}
              <View style={{padding: 1}}>
                <Text style={{fontSize: 16, marginBottom: 8}}>Operator</Text>
                <TextInput
                  placeholder="Cari Operator JDE"
                  value={operatorQuery}
                  onChangeText={searchOperator}
                  style={[styles.value, {paddingVertical: 10}]}
                />

                {/* Search Results */}
                {showResults && searchResults.length > 0 && (
                  <View style={[styles.indicatorDetail, {maxHeight: 150}]}>
                    {searchResults.map(item => (
                      <TouchableOpacity
                        key={item.employeeId}
                        onPress={() => handleSelectOperator(item)}
                        style={[styles.pointCard, {paddingVertical: 10}]}>
                        <Text>{`${item.employeeId} - ${item.EmployeeName}`}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}

                {/* Selected Operator Info */}
                <View style={styles.operatorBox}>
                  <Text style={{fontSize: 16, marginBottom: 8}}>
                    Operator JDE: {operatorJDE}
                  </Text>
                  <View
                    style={{
                      height: 1,
                      backgroundColor: '#e0e0e0',
                      marginVertical: 8,
                    }}
                  />
                  <Text style={{fontSize: 16}}>
                    Nama Operator: {operatorName}
                  </Text>
                </View>
              </View>

              <View
                style={{
                  height: 1,
                  backgroundColor: '#e0e0e0',
                  marginVertical: 12,
                }}
              />
              {/* ROW: Site & Lokasi */}
              <View style={styles.row}>
                <View style={styles.half}>
                  <Text style={styles.label}>Site</Text>
                  <TextInput
                    value={site}
                    editable={false}
                    style={styles.input}
                  />
                </View>
                <View style={styles.half}>
                  <Text style={styles.label}>Lokasi</Text>
                  <RNPickerSelect
                    onValueChange={value => setSelectedSite(value)}
                    items={siteList}
                    value={selectedSite}
                    placeholder={{label: 'Pilih Site', value: null}}
                    style={pickerSelectStyles}
                    useNativeAndroidPickerStyle={false}
                  />
                </View>
              </View>
            </View>
          )}
        </View>

        {/* Unit dan Waktu */}
        <ToggleCard title="Unit dan Waktu" defaultExpanded={true}>
          {/* Informasi Unit Type dari route */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Tipe Unit</Text>
            <View style={styles.staticInput}>
              <Text style={styles.staticText}>{unitType}</Text>
            </View>
          </View>

          {/* Unit Model */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Model Unit</Text>
            <RNPickerSelect
              onValueChange={setUnitModel}
              items={modelUnits}
              value={unitModel}
              placeholder={{label: 'Pilih Model Unit', value: null}}
              style={pickerSelectStyles}
              useNativeAndroidPickerStyle={false}
              Icon={() => (
                <Icon name="chevron-down" size={20} color="#9ca3af" />
              )}
            />
          </View>

          {/* Unit Number */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Nomor Unit</Text>
            <RNPickerSelect
              onValueChange={setUnitNumber}
              items={unitNumbers}
              value={unitNumber}
              placeholder={{label: 'Pilih Nomor Unit', value: null}}
              style={pickerSelectStyles}
              useNativeAndroidPickerStyle={false}
              Icon={() => (
                <Icon name="chevron-down" size={20} color="#9ca3af" />
              )}
            />
          </View>

          {/* Waktu dan Tanggal */}
          <View style={styles.timeDateGroup}>
            {/* Tanggal */}
            <View style={styles.timeDateInput}>
              <Text style={styles.label}>Tanggal</Text>
              <TouchableOpacity
                onPress={() => setShowDatePicker(true)}
                style={styles.datePickerButton}>
                <Icon name="calendar" size={18} color="#6366f1" />
                <Text style={styles.datePickerText}>
                  {dateMentoring.toLocaleDateString('id-ID')}
                </Text>
              </TouchableOpacity>
              {showDatePicker && (
                <DateTimePicker
                  value={dateMentoring}
                  mode="date"
                  display="default"
                  onChange={onChangeDate}
                />
              )}
            </View>

            {/* Waktu Mulai */}
            <View style={styles.timeDateInput}>
              <Text style={styles.label}>Waktu Mulai</Text>
              <TouchableOpacity
                onPress={() => setShowStartTimePicker(true)}
                style={styles.datePickerButton}>
                <Icon name="time" size={18} color="#6366f1" />
                <Text style={styles.datePickerText}>
                  {startTime.toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
              </TouchableOpacity>
              {showStartTimePicker && (
                <DateTimePicker
                  value={startTime}
                  mode="time"
                  display="default"
                  onChange={onChangeStartTime}
                />
              )}
            </View>

            {/* Waktu Selesai */}
            <View style={styles.timeDateInput}>
              <Text style={styles.label}>Waktu Selesai</Text>
              <TouchableOpacity
                onPress={() => setShowEndTimePicker(true)}
                style={styles.datePickerButton}>
                <Icon name="time" size={18} color="#6366f1" />
                <Text style={styles.datePickerText}>
                  {endTime.toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
              </TouchableOpacity>
              {showEndTimePicker && (
                <DateTimePicker
                  value={endTime}
                  mode="time"
                  display="default"
                  onChange={onChangeEndTime}
                />
              )}
            </View>
          </View>
        </ToggleCard>

        {/* Indicators */}
        <ToggleCard title="Indikator Mentoring" defaultExpanded={true}>
          {Object.entries(indicators).map(([kategori, list]) => (
            <View key={kategori} style={styles.indicatorCategory}>
              {/* KATEGORI HEADER (DITEKAN UNTUK SHOW/HIDE) */}
              <TouchableOpacity
                onPress={() => toggleCategoryVisibility(kategori)}
                style={styles.categoryHeader}>
                <Text style={styles.categoryTitle}>{kategori}</Text>
                <Icon
                  name={
                    visibleCategories[kategori] ? 'chevron-up' : 'chevron-down'
                  }
                  size={18}
                  color="#6b7280"
                />
              </TouchableOpacity>

              {/* DETAIL INDIKATOR */}
              {visibleCategories[kategori] && (
                <>
                  {list.map(ind => {
                    const detail = editableDetails.find(
                      d => String(d.fid_indicator) === String(ind.id),
                    ) || {
                      is_observasi: '0',
                      is_mentoring: '0',
                      note_observasi: '',
                      fid_indicator: ind.id,
                    };

                    return (
                      <View key={ind.id} style={styles.indicatorItem}>
                        <Text style={styles.indicatorParam}>
                          • {ind.param1}
                        </Text>
                        <Text style={styles.indicatorParam}>
                          • {ind.param2}
                        </Text>

                        <View style={styles.detailRow}>
                          <Text style={styles.detailLabel}>Observasi:</Text>
                          <CheckBox
                            value={detail.is_observasi === '1'}
                            onValueChange={() =>
                              toggleCheckbox(
                                detail.fid_indicator,
                                'is_observasi',
                              )
                            }
                          />
                        </View>

                        <View style={styles.detailRow}>
                          <Text style={styles.detailLabel}>Mentoring:</Text>
                          <CheckBox
                            value={detail.is_mentoring === '1'}
                            onValueChange={() =>
                              toggleCheckbox(
                                detail.fid_indicator,
                                'is_mentoring',
                              )
                            }
                          />
                        </View>

                        <View style={styles.detailRow}>
                          <Text style={styles.detailLabel}>Catatan:</Text>
                          <TextInput
                            style={[styles.detailValue, styles.noteInput]}
                            multiline
                            placeholder="Masukkan catatan..."
                            value={detail.note_observasi || ''}
                            onChangeText={text =>
                              updateNote(detail.fid_indicator, text)
                            }
                          />
                        </View>
                      </View>
                    );
                  })}

                  {/* NILAI POINT PER KATEGORI */}
                  <View style={styles.categoryScore}>
                    <Text style={styles.scoreText}>
                      Observasi : Y Score:{' '}
                      {points[kategori]?.yscoreObservasi ?? 0} | Point:{' '}
                      {points[kategori]?.pointObservasi ?? 0}
                    </Text>
                    <Text style={styles.scoreText}>
                      Mentoring : Y Score:{' '}
                      {points[kategori]?.yscoreMentoring ?? 0} | Point:{' '}
                      {points[kategori]?.pointMentoring ?? 0}
                    </Text>
                  </View>
                </>
              )}
            </View>
          ))}
        </ToggleCard>

        {/* Summary Observasi & Mentoring Points */}
        {observasiPoints.jsx}
        {mentoringPoints.jsx}

        <TouchableOpacity
          style={styles.submitButton}
          onPress={handleSubmit}
          disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>Simpan Data</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

export default AddDataMentoring;
