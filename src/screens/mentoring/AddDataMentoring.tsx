import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  Platform,
  TouchableOpacity,
  TextInput,
  ScrollView,
  UIManager,
  FlatList,
  Button,
} from 'react-native';
import axios from 'axios';
import RNPickerSelect from 'react-native-picker-select';
import DateTimePicker from '@react-native-community/datetimepicker';
import Icon from 'react-native-vector-icons/Ionicons';
import CheckBox from '@react-native-community/checkbox';
import {editDataStyles as styles} from '../../styles/editDataStyles';
import {pickerSelectStyles} from '../../styles/pickerSelectStyles';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useNavigation} from '@react-navigation/native';
import API_BASE_URL from '../../config';

// Aktifkan LayoutAnimation untuk Android
if (Platform.OS === 'android') {
  UIManager.setLayoutAnimationEnabledExperimental &&
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

/**
 * Komponen Card yang bisa di-expand/collapse
 */
const ToggleCard = ({title, children, defaultExpanded = true}) => {
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

/**
 * Halaman Tambah Data Mentoring
 */
const AddDataMentoring = ({route}) => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);

  // --- State: Data & Form ---
  const [operatorJDE, setOperatorJDE] = useState(null);
  const [operatorName, setOperatorName] = useState(null);
  const [trainerName, setTrainerName] = useState(null);
  const [trainerJDE, setTrainerJDE] = useState(null);
  const [site, setSite] = useState(null);
  const [operatorQuery, setOperatorQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [rawSiteList, setRawSiteList] = useState([]);
  const [modelUnitRaw, setModelUnitRaw] = useState([]);
  const [unitRaw, setUnitRaw] = useState([]);
  const [unitTypes, setUnitTypes] = useState([]);
  const [modelUnits, setModelUnits] = useState([]);
  const [unitNumbers, setUnitNumbers] = useState([]);
  const {data} = route.params;
  const {unitType, unitTypeId} = data;
  const [unitModel, setUnitModel] = useState(null);
  const [unitNumber, setUnitNumber] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);
  const [visibleCategories, setVisibleCategories] = useState({});
  const [expanded, setExpanded] = useState(true);
  const [indicators, setIndicators] = useState({});
  const [dateMentoring, setDateMentoring] = useState(new Date());
  const [startTime, setStartTime] = useState(new Date());
  const [endTime, setEndTime] = useState(new Date());
  const [editableDetails, setEditableDetails] = React.useState([]);
  const [area, setArea] = useState(null);
  const [points, setPoints] = useState({});

  // --- Fetch indikator berdasarkan unitTypeId ---
  useEffect(() => {
    if (unitTypeId) {
      fetchIndicatorsByType(unitTypeId);
    }
  }, [unitTypeId]);

  // Ambil indikator per unit type dari API
  const fetchIndicatorsByType = async unitTypeId => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/mentoring/createData?type_mentoring=${unitTypeId}`,
      );
      const result = await response.json();
      if (result.success && typeof result?.data?.indicators === 'object') {
        setIndicators(result.data.indicators);
      } else {
        setIndicators({});
      }
    } catch (err) {
      setIndicators({});
    }
  };

  // Prefill info user login untuk trainer
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userString = await AsyncStorage.getItem('userData');
        if (userString) {
          const user = JSON.parse(userString);
          setTrainerJDE(user.username);
          setTrainerName(user.name);
          setSite(user.site);
        }
      } catch (error) {}
    };
    fetchUser();
  }, []);

  // Ambil data master: site, unit, model, dst
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/mentoring/createData`);
        const {
          siteList: site_list,
          models: model_unit,
          units: unit,
          details,
        } = res.data?.data || {};

        setRawSiteList(site_list || []);
        setModelUnitRaw(model_unit || []);
        setUnitRaw(unit || []);
        setEditableDetails(details || []);
        setPoints({});
      } catch (error) {
        alert('Gagal mengambil data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Unit Type dari modelUnitRaw
  useEffect(() => {
    if (!modelUnitRaw.length) return;
    const types = Array.from(
      new Set(modelUnitRaw.map(m => m.class.trim())),
    ).map(t => ({label: t, value: t}));
    setUnitTypes(types);
  }, [modelUnitRaw]);

  // Model Unit (filter by type)
  useEffect(() => {
    if (!unitTypeId || !modelUnitRaw.length) {
      setModelUnits([]);
      setUnitModel(null);
      return;
    }
    const filteredModels = modelUnitRaw
      .filter(m => m.class === String(unitTypeId))
      .map(m => ({label: m.model, value: String(m.id)}));
    setModelUnits(filteredModels);
    setUnitModel(null);
  }, [unitTypeId, modelUnitRaw]);

  // Unit Number (filter by model)
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

  // Search operator by query (API)
  const searchOperator = async text => {
    setOperatorQuery(text);
    setShowResults(true);
    if (text.length >= 2) {
      try {
        const response = await axios.get(
          `${API_BASE_URL}/getEmployeeOperator?q=${text}`,
        );
        setSearchResults(response.data);
      } catch (error) {}
    } else {
      setSearchResults([]);
    }
  };

  // Pilih operator dari hasil search
  const handleSelectOperator = item => {
    setOperatorJDE(item.employeeId);
    setOperatorName(item.EmployeeName);
    setOperatorQuery(`${item.employeeId} - ${item.EmployeeName}`);
    setShowResults(false);
  };

  // Checkbox per indikator
  const toggleCheckbox = (fid, field) => {
    setEditableDetails(prev => {
      const existing = prev.find(d => d.fid_indicator === fid);
      if (existing) {
        return prev.map(d =>
          d.fid_indicator === fid
            ? {...d, [field]: d[field] === '1' ? '0' : '1'}
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

  // Update note per indikator
  const updateNote = (fid, note) => {
    setEditableDetails(prev => {
      const existing = prev.find(d => d.fid_indicator === fid);
      if (existing) {
        return prev.map(d =>
          d.fid_indicator === fid ? {...d, note_observasi: note} : d,
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

  // Kalkulasi points per kategori (live)
  const calculatePoints = details => {
    const newPoints = {};
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
  }, [editableDetails, indicators]);

  // Handler Date/Time Picker
  const onChangeDate = (event, selectedDate) => {
    if (Platform.OS === 'android') setShowDatePicker(false);
    if (event.type === 'dismissed') return;
    if (selectedDate) setDateMentoring(selectedDate);
  };
  const onChangeStartTime = (event, selectedTime) => {
    if (Platform.OS === 'android') setShowStartTimePicker(false);
    if (event.type === 'dismissed') return;
    if (selectedTime) setStartTime(selectedTime);
  };
  const onChangeEndTime = (event, selectedTime) => {
    if (Platform.OS === 'android') setShowEndTimePicker(false);
    if (event.type === 'dismissed') return;
    if (selectedTime) setEndTime(selectedTime);
  };

  // Expand/collapse kategori indikator
  const toggleCategoryVisibility = kategori => {
    setVisibleCategories(prev => ({
      ...prev,
      [kategori]: !prev[kategori],
    }));
  };

  // Rekap points observasi/mentoring per kategori
  const renderLivePointsSection = type => {
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
    return (
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
    );
  };

  // --- Submit form ke backend
  const handleSubmit = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('userToken');
      if (!token)
        throw new Error('Sesi telah berakhir. Silakan login kembali.');
      if (!unitType || !unitModel || !unitNumber)
        throw new Error('Harap lengkapi semua informasi unit');
      if (!operatorJDE || !operatorName || !site || !area)
        throw new Error('Harap lengkapi semua informasi operator');

      // Kalkulasi poin
      const calcPoints = type => {
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

      const observasi = calcPoints('observasi');
      const mentoring = calcPoints('mentoring');

      // Payload API
      const payload = {
        IDTypeMentoring: unitTypeId,
        IDtrainer: trainerJDE,
        trainer: trainerName,
        IDoperator: operatorJDE,
        operator: operatorName,
        site: site,
        area: area,
        type: unitTypeId,
        model: unitModel,
        unit: unitNumber,
        date: dateMentoring.toISOString().split('T')[0],
        time_start: `${startTime.getHours()}:${String(
          startTime.getMinutes(),
        ).padStart(2, '0')}`,
        time_end: `${endTime.getHours()}:${String(
          endTime.getMinutes(),
        ).padStart(2, '0')}`,
        average_yscore_observation: observasi.totalYScore,
        average_point_observation: observasi.averagePoint,
        average_yscore_mentoring: mentoring.totalYScore,
        average_point_mentoring: mentoring.averagePoint,
        indicators: editableDetails.map(detail => ({
          fid_indicator: detail.fid_indicator,
          is_observasi: detail.is_observasi,
          is_mentoring: detail.is_mentoring,
          note_observasi: detail.note_observasi || '',
        })),
      };
      const response = await axios.post(
        `${API_BASE_URL}/mentoring/store`,
        payload,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
          },
        },
      );

      if (response.data.success) {
        alert('Data mentoring berhasil ditambahkan!');
        if (navigation.canGoBack()) navigation.goBack();
        else navigation.navigate('FullDashboard');
      } else {
        throw new Error(response.data.message || 'Gagal menambah data');
      }
    } catch (error) {
      if (error.response?.status === 401) {
        await AsyncStorage.removeItem('userToken');
        alert('Sesi telah berakhir. Silakan login kembali.');
        navigation.reset({index: 0, routes: [{name: 'Login'}]});
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

  // --- Loader
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1E90FF" />
      </View>
    );
  }

  // --- Render UI
  return (
    <ScrollView
      style={{flex: 1}}
      contentContainerStyle={{paddingBottom: 40}}
      keyboardShouldPersistTaps="handled">
      <View style={styles.container}>
        <Text style={styles.title}>Tambah Data Mentoring {unitType}</Text>

        {/* Header (trainer/operator/site) */}
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
              {/* Trainer Info */}
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
              {/* Operator Search & Select */}
              <View style={{padding: 1, marginBottom: 16}}>
                <Text style={{fontSize: 16, marginBottom: 8}}>Operator</Text>
                <View style={{position: 'relative'}}>
                  <TextInput
                    placeholder="Cari Operator JDE"
                    value={operatorQuery}
                    onChangeText={searchOperator}
                    style={[
                      styles.value,
                      {
                        paddingVertical: 10,
                        backgroundColor: '#fff',
                        borderWidth: 1,
                        borderColor: '#111',
                      },
                    ]}
                  />
                  {/* Dropdown Operator */}
                  {showResults && searchResults.length > 0 && (
                    <View style={styles.operatorDropdownBox}>
                      <FlatList
                        data={searchResults}
                        keyExtractor={item => item.employeeId}
                        renderItem={({item}) => (
                          <TouchableOpacity
                            onPress={() => handleSelectOperator(item)}
                            style={{
                              padding: 12,
                              borderBottomWidth: 1,
                              borderBottomColor: '#eee',
                            }}>
                            <Text
                              style={{
                                color: '#111',
                              }}>{`${item.employeeId} - ${item.EmployeeName}`}</Text>
                          </TouchableOpacity>
                        )}
                        keyboardShouldPersistTaps="handled"
                      />
                    </View>
                  )}
                </View>
                {/* Info Operator terpilih */}
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
              {/* Site & Lokasi */}
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
                  <TextInput
                    value={area}
                    onChangeText={setArea}
                    placeholder="Masukkan nama Site"
                    style={styles.input}
                  />
                </View>
              </View>
            </View>
          )}
        </View>

        {/* Unit dan Waktu */}
        <ToggleCard title="Unit dan Waktu" defaultExpanded={true}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Tipe Unit</Text>
            <View style={styles.staticInput}>
              <Text style={styles.staticText}>{unitType}</Text>
            </View>
          </View>
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
          {/* Waktu & Tanggal */}
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

        {/* Indikator */}
        <ToggleCard title="Indikator Mentoring" defaultExpanded={true}>
          {Object.entries(indicators).map(([kategori, list]) => (
            <View key={kategori} style={styles.indicatorCategory}>
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
                        {ind.param2 && (
                          <Text style={styles.indicatorParam}>
                            • {ind.param2}
                          </Text>
                        )}
                        <View style={styles.detailRow}>
                          <Text style={styles.detailLabel}>Observasi:</Text>
                          <View style={styles.checkBoxWrapper}>
                            <CheckBox
                              value={detail.is_observasi === '1'}
                              onValueChange={() =>
                                toggleCheckbox(
                                  detail.fid_indicator,
                                  'is_observasi',
                                )
                              }
                              tintColors={{true: '#111', false: '#111'}}
                              boxType="square"
                              style={{width: 20, height: 20}}
                            />
                          </View>
                        </View>
                        <View style={styles.detailRow}>
                          <Text style={styles.detailLabel}>Mentoring:</Text>
                          <View style={styles.checkBoxWrapper}>
                            <CheckBox
                              value={detail.is_mentoring === '1'}
                              onValueChange={() =>
                                toggleCheckbox(
                                  detail.fid_indicator,
                                  'is_mentoring',
                                )
                              }
                              tintColors={{true: '#111', false: '#111'}}
                              boxType="square"
                              style={{width: 20, height: 20}}
                            />
                          </View>
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
                  {/* Skor Kategori */}
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

        {/* Summary */}
        {renderLivePointsSection('observasi')}
        {renderLivePointsSection('mentoring')}

        <Button title="Simpan" onPress={handleSubmit} />
      </View>
    </ScrollView>
  );
};

export default AddDataMentoring;
