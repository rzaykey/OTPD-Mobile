import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  Platform,
  TouchableOpacity,
  TextInput,
  FlatList,
  ScrollView,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Keyboard,
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

const EditDataMentoring = ({route}: {route: {params: {id: string}}}) => {
  const {id} = route.params;

  const [loading, setLoading] = useState(true);
  const [headerData, setHeaderData] = useState<any | null>(null);

  const [operatorJDE, setOperatorJDE] = useState<string | null>(null);
  const [operatorName, setOperatorName] = useState<string | null>(null);

  const [operatorQuery, setOperatorQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showResults, setShowResults] = useState(false);

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

  const [unitType, setUnitType] = useState<string | null>(null);
  const [unitModel, setUnitModel] = useState<string | null>(null);
  const [unitNumber, setUnitNumber] = useState<string | null>(null);

  const [dateMentoring, setDateMentoring] = useState(new Date());
  const [startTime, setStartTime] = useState(new Date());
  const [endTime, setEndTime] = useState(new Date());

  const [showDatePicker, setShowDatePicker] = React.useState(false);
  const [showStartTimePicker, setShowStartTimePicker] = React.useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = React.useState(false);

  const [expanded, setExpanded] = useState(true);

  const [indicators, setIndicators] = useState<IndicatorList>({});
  const [visibleCategories, setVisibleCategories] = useState<{
    [key: string]: boolean;
  }>({});

  const [editableDetails, setEditableDetails] = useState<IndicatorDetail[]>([]);
  const [points, setPoints] = useState<Points>({});
  // const [penilaian, setPenilaian] = useState<PenilaianItem[]>([]);
  const [penilaian, setPenilaian] = useState<Penilaian>([]);
  const navigation = useNavigation();
  // Fetch data
  useEffect(() => {
    console.log('Running fetchData useEffect');
    const fetchData = async () => {
      try {
        const res = await axios.get(
          `http://10.0.2.2:8000/api/mentoring/${id}/edit`,
        );
        console.log('Data from API:', res.data);

        const {header, model_unit, unit, indicators, details, penilaian} =
          res.data?.data || {};

        setModelUnitRaw(model_unit || []);
        setUnitRaw(unit || []);
        setIndicators(indicators || {});
        setEditableDetails(details || []);
        // setPoints(penilaianAPI || {});
        setPenilaian(penilaian || []);

        if (!header) {
          alert('Data header tidak ditemukan');
          setLoading(false);
          return;
        }

        const {siteList: apiSiteList} = res.data.data || {};
        if (apiSiteList) {
          setRawSiteList(apiSiteList); // Simpan data mentah dulu
        }

        const classes = Array.from(
          new Set(
            model_unit.map((item: any) => item.class?.trim()).filter(Boolean),
          ),
        );
        const classOptions = classes.map((c: string) => ({label: c, value: c}));

        const headerUnitType = header.unit_type?.trim();
        if (headerUnitType && !classes.includes(headerUnitType)) {
          classOptions.push({label: headerUnitType, value: headerUnitType});
        }

        setUnitTypes(classOptions);
        setHeaderData(header);
        setUnitType(headerUnitType || null);
        setOperatorJDE(header.operator_jde);
        setOperatorName(header.operator_name);
        setOperatorQuery(`${header.operator_jde} - ${header.operator_name}`);

        if (header.date_mentoring) {
          setDateMentoring(new Date(header.date_mentoring.split(' ')[0]));
        }
        if (header.start_time) {
          const [sh, sm] = header.start_time.split(':').map(Number);
          const now = new Date();
          setStartTime(new Date(now.setHours(sh, sm, 0, 0)));
        }
        if (header.end_time) {
          const [eh, em] = header.end_time.split(':').map(Number);
          const now = new Date();
          setEndTime(new Date(now.setHours(eh, em, 0, 0)));
        }
      } catch (error) {
        console.error('Fetch data error:', error);
        alert('Gagal mengambil data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

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
          label: site.name_site,
          value: site.code_site,
        }));
      setSiteList(sites);

      // Set selected site default dari headerData
      if (headerData?.site) {
        setSelectedSite(headerData.site);
      }
    }
  }, [rawSiteList, headerData]);

  // Update modelUnits when unitType changes
  useEffect(() => {
    if (!unitType || !modelUnitRaw.length) return;

    const filteredModels = modelUnitRaw
      .filter(
        (m: any) =>
          m.class?.trim().toLowerCase() === unitType.trim().toLowerCase(),
      )
      .map((m: any) => ({label: m.model, value: String(m.id)}));

    setModelUnits(filteredModels);

    const headerUnitModel = String(headerData?.unit_model);
    const found = filteredModels.find(m => m.value === headerUnitModel);
    setUnitModel(found ? headerUnitModel : null);
  }, [unitType, modelUnitRaw, headerData]);

  // Update unitNumbers when unitModel changes
  useEffect(() => {
    if (!unitModel || !unitRaw.length) return;

    const filteredUnits = unitRaw
      .filter(u => String(u.fid_model) === String(unitModel))
      .map(u => ({label: u.no_unit, value: String(u.id)}));

    // Jika unit dari headerData masih valid, set. Jika tidak, reset.
    const headerUnitNumberId = String(headerData?.unit_number);
    if (
      headerUnitNumberId &&
      filteredUnits.some(u => u.value === headerUnitNumberId)
    ) {
      setUnitNumber(headerUnitNumberId);
    } else {
      setUnitNumber(null);
    }

    setUnitNumbers(filteredUnits);
  }, [unitModel, unitRaw, headerData]);

  // ✅ Tambahkan preload hanya SEKALI setelah headerData muncul (hindari overwrite setiap kali model berubah)
  useEffect(() => {
    if (headerData?.unit_number) {
      setUnitNumber(String(headerData.unit_number));
    }
  }, [headerData?.unit_number]);

  const updateSite = newSite => {
    setHeaderData(prev => ({
      ...prev,
      site: newSite,
    }));
  };

  const updateNote = (fid, note) => {
    setEditableDetails(prev => {
      const existing = prev.find(d => d.fid_indicator === fid);
      if (existing) {
        return prev.map(d =>
          d.fid_indicator === fid ? {...d, note_observasi: note} : d,
        );
      }
      return [
        ...prev,
        {
          fid_indicator: fid,
          is_observasi: '0',
          is_mentoring: '0',
          note_observasi: note,
        },
      ];
    });
  };

  const toggleCheckbox = (fid, field) => {
    setEditableDetails(prev => {
      const existing = prev.find(d => d.fid_indicator === fid);
      if (existing) {
        return prev.map(d =>
          d.fid_indicator === fid
            ? {...d, [field]: existing[field] === '1' ? '0' : '1'}
            : d,
        );
      }
      return [
        ...prev,
        {
          fid_indicator: fid,
          is_observasi: field === 'is_observasi' ? '1' : '0',
          is_mentoring: field === 'is_mentoring' ? '1' : '0',
          note_observasi: '',
        },
      ];
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

  if (!headerData) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>Data tidak ditemukan</Text>
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

  const calculateScores = (
    points: Record<string, any>,
    type: 'observasi' | 'mentoring',
  ) => {
    const data = Object.values(points);
    const totalIndicators = data.length;

    // Hitung jumlah checklist yang dicentang
    const totalChecked = data.reduce((sum, item) => {
      const isChecked =
        type === 'observasi'
          ? item.is_observasi === '1' || item.is_observasi === true
          : item.is_mentoring === '1' || item.is_mentoring === true;
      return sum + (isChecked ? 1 : 0);
    }, 0);

    // Hitung total point
    const totalPoint = data.reduce((sum, item) => {
      const point =
        type === 'observasi'
          ? item.pointObservasi || 0
          : item.pointMentoring || 0;
      return sum + point;
    }, 0);

    const averageYScore =
      totalIndicators > 0
        ? (totalChecked / totalIndicators).toFixed(2)
        : '0.00';

    const averagePoint =
      totalIndicators > 0 ? (totalPoint / totalIndicators).toFixed(2) : '0.00';

    return {
      averageYScore,
      averagePoint,
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
        // Basic Information

        // Operator info tambahan
        operator_jde: operatorJDE,
        operator_name: operatorName,
        unit_type: unitType,
        unit_model: unitModel,
        unit_number: unitNumber,
        site: headerData.site,
        date_mentoring: dateMentoring.toISOString().split('T')[0],
        start_time: `${startTime.getHours()}:${String(
          startTime.getMinutes(),
        ).padStart(2, '0')}`,
        end_time: `${endTime.getHours()}:${String(
          endTime.getMinutes(),
        ).padStart(2, '0')}`,

        // Calculated Points
        average_yscore_observation: observasiPoints.totalYScore,
        average_point_observation: observasiPoints.averagePoint,
        average_yscore_mentoring: mentoringPoints.totalYScore,
        average_point_mentoring: mentoringPoints.averagePoint,

        // Indicator Details
        indicators: Object.values(indicators)
          .flat()
          .map(ind => {
            const detail = editableDetails.find(
              d => d.fid_indicator === ind.id,
            );
            return {
              fid_indicator: ind.id,
              is_observasi: detail?.is_observasi ?? '0',
              is_mentoring: detail?.is_mentoring ?? '0',
              note_observasi: detail?.note_observasi ?? '',
            };
          }),
      };

      console.log('Payload to be submitted:', payload);
      console.log('Payload:', payload); // pastikan ini valid

      // 5. API Call
      const response = await axios.put(
        `http://10.0.2.2:8000/api/mentoring/${id}/update`,
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
        navigation.goBack();
      } else {
        throw new Error(response.data.message || 'Gagal memperbarui data');
      }
    } catch (error: any) {
      console.error('Submission error:', error);
      console.log('Status:', error.response?.status);
      console.log('Message:', error.response?.data); // LIHAT INI
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
    <KeyboardAvoidingView
      style={{flex: 1}}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{paddingBottom: 40}}>
          <View style={styles.container}>
            <Text style={styles.title}>Edit Data Mentoring</Text>

            {/* Header */}
            <View style={styles.card}>
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

              {expanded && (
                <View style={styles.sectionContent}>
                  <View style={styles.row}>
                    <View style={styles.half}>
                      <Text style={styles.label}>Trainer JDE</Text>
                      <Text style={styles.value}>{headerData.trainer_jde}</Text>
                    </View>
                    <View style={styles.half}>
                      <Text style={styles.label}>Nama Trainer</Text>
                      <Text style={styles.value}>
                        {headerData.trainer_name}
                      </Text>
                    </View>
                  </View>

                  <View style={{padding: 16}}>
                    <Text style={{fontSize: 16, marginBottom: 8}}>
                      Operator
                    </Text>

                    <TextInput
                      placeholder="Cari Operator JDE"
                      value={operatorQuery}
                      onChangeText={searchOperator}
                      style={[styles.value, {paddingVertical: 10}]}
                    />

                    {/* Search Results */}
                    {showResults && searchResults.length > 0 && (
                      <View style={[styles.indicatorDetail, {maxHeight: 150}]}>
                        <FlatList
                          data={searchResults}
                          keyExtractor={item => item.employeeId}
                          renderItem={({item}) => (
                            <TouchableOpacity
                              onPress={() => handleSelectOperator(item)}
                              style={[styles.pointCard, {paddingVertical: 10}]}>
                              <Text>{`${item.employeeId} - ${item.EmployeeName}`}</Text>
                            </TouchableOpacity>
                          )}
                          nestedScrollEnabled={true} // supaya scrollable di dalam header
                        />
                      </View>
                    )}

                    <Text style={{marginTop: 20, fontSize: 16}}>
                      Operator JDE: {operatorJDE}
                    </Text>
                    <Text style={{fontSize: 16}}>
                      Nama Operator: {operatorName}
                    </Text>
                  </View>

                  <Text style={styles.label}>Site</Text>
                  <RNPickerSelect
                    onValueChange={value => {
                      setSelectedSite(value);
                      updateSite(value);
                    }}
                    items={siteList}
                    value={selectedSite}
                    placeholder={{label: 'Pilih Site', value: null}}
                    style={pickerSelectStyles}
                    useNativeAndroidPickerStyle={false}
                  />
                </View>
              )}
            </View>

            {/* Unit dan Waktu */}
            <ToggleCard title="Unit dan Waktu" defaultExpanded={true}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Unit Type</Text>
                <RNPickerSelect
                  onValueChange={setUnitType}
                  items={unitTypes}
                  value={unitType}
                  placeholder={{label: 'Pilih Tipe Unit', value: null}}
                  style={pickerSelectStyles}
                  useNativeAndroidPickerStyle={false}
                  Icon={() => (
                    <Icon name="chevron-down" size={20} color="#9ca3af" />
                  )}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Unit Model</Text>
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

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Unit Number</Text>
                <RNPickerSelect
                  onValueChange={setUnitNumber}
                  items={unitNumbers}
                  value={unitNumber}
                  placeholder={{label: 'Pilih Unit Number', value: null}}
                  style={pickerSelectStyles}
                  useNativeAndroidPickerStyle={false}
                  Icon={() => (
                    <Icon name="chevron-down" size={20} color="#9ca3af" />
                  )}
                />
              </View>

              <View style={styles.timeDateGroup}>
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
                  <TouchableOpacity
                    onPress={() => toggleCategoryVisibility(kategori)}
                    style={styles.categoryHeader}>
                    <Text style={styles.categoryTitle}>{kategori}</Text>
                    <Icon
                      name={
                        visibleCategories[kategori]
                          ? 'chevron-up'
                          : 'chevron-down'
                      }
                      size={18}
                      color="#6b7280"
                    />
                  </TouchableOpacity>

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

                            <View style={styles.indicatorDetail}>
                              <View style={styles.detailRow}>
                                <Text style={styles.detailLabel}>
                                  Observasi:
                                </Text>
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
                                <Text style={styles.detailLabel}>
                                  Mentoring:
                                </Text>
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
                                  style={[
                                    styles.detailValue,
                                    {
                                      borderWidth: 1,
                                      borderColor: '#ccc',
                                      padding: 5,
                                      borderRadius: 5,
                                      flex: 1,
                                      minHeight: 40,
                                    },
                                  ]}
                                  multiline
                                  placeholder="Masukkan catatan..."
                                  value={detail.note_observasi || ''}
                                  onChangeText={
                                    text =>
                                      updateNote(detail.fid_indicator, text) // update parent state
                                  }
                                />
                              </View>
                            </View>
                          </View>
                        );
                      })}

                      {/* Skor per kategori */}
                      <View style={styles.categoryScore}>
                        <Text style={styles.scoreText}>
                          Y Score: {points[kategori]?.yscore ?? 0} | Point:{' '}
                          {points[kategori]?.point ?? 0}
                        </Text>
                      </View>
                    </>
                  )}
                </View>
              ))}
            </ToggleCard>

            {observasiPoints.jsx}
            {mentoringPoints.jsx}

            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleSubmit}
              disabled={loading}>
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitButtonText}>Simpan Perubahan</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
};

export default EditDataMentoring;
