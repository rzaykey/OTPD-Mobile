import React, {useEffect, useState} from 'react';
import {
  Text,
  TextInput,
  Button,
  Alert,
  View,
  Platform,
  TouchableOpacity,
  LayoutAnimation,
  UIManager,
} from 'react-native';
import RNPickerSelect from 'react-native-picker-select';
import axios from 'axios';
import {addDailyAct} from '../../styles/addDailyAct';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DropDownPicker from 'react-native-dropdown-picker';
import {KeyboardAwareScrollView} from 'react-native-keyboard-aware-scroll-view';
import DateTimePicker from '@react-native-community/datetimepicker';
import {useNavigation} from '@react-navigation/native';
import API_BASE_URL from '../../config';

// Enable LayoutAnimation for Android
if (Platform.OS === 'android') {
  UIManager.setLayoutAnimationEnabledExperimental &&
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

// Komponen collapsible untuk setiap card section
const CollapsibleCard = ({title, children}) => {
  const [expanded, setExpanded] = useState(true);
  const toggleExpand = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded(!expanded);
  };
  return (
    <View style={addDailyAct.card}>
      <TouchableOpacity onPress={toggleExpand} style={addDailyAct.cardHeader}>
        <Text style={addDailyAct.cardTitle}>{title}</Text>
      </TouchableOpacity>
      {expanded && <View style={addDailyAct.cardBody}>{children}</View>}
    </View>
  );
};

const EditDailyActivity = ({route}: {route: {params: {id: string}}}) => {
  // ======== NAVIGATION & PARAMETER ========
  const {id} = route.params;
  const navigation = useNavigation();

  // ======== STATE DEFINITIONS (DOKUMENTASI LENGKAP) ========
  // Menyimpan seluruh field form daily activity
  const [formData, setFormData] = useState({
    jde_no: '', // Nomor JDE (readonly, dari user)
    employee_name: '', // Nama employee (readonly, dari user)
    site: '', // Site (readonly, dari user)
    date_activity: '', // Tanggal aktivitas (format yyyy-mm-dd)
    kpi_type: '', // ID KPI terpilih
    activity: '', // ID Activity (bukan nama)
    unit_detail: '', // Detail Unit (ID)
    total_participant: '', // Jumlah peserta (string/number)
    total_hour: '', // Total jam (string/number)
  });

  // Role user saat ini (readonly)
  const [role, setRole] = useState('');

  // List opsi KPI, format: [{label, value}]
  const [kpiOptions, setKpiOptions] = useState([]);

  // List opsi activity, format: [{label, value}]
  const [activityOptions, setActivityOptions] = useState([]);

  // List opsi unit (DropDownPicker), format: [{label, value, modelOnly}]
  const [unitOptions, setUnitOptions] = useState([]);

  // State kontrol untuk DropDownPicker unit
  const [unitOpen, setUnitOpen] = useState(false);
  const [unitValue, setUnitValue] = useState(null);

  // Kontrol datepicker
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Simpan data header (raw API) untuk keperluan lanjut
  const [headerData, setHeaderData] = useState<any[]>([]);

  // Loading state (show/hide spinner)
  const [loading, setLoading] = useState(false);

  // ======== FUNCTION: SESSION HELPER ========
  const getSession = async () => {
    // Mengambil session token, role, user, site dari storage
    const token = await AsyncStorage.getItem('userToken');
    const role = await AsyncStorage.getItem('userRole');
    const userString = await AsyncStorage.getItem('userData');
    const user = userString ? JSON.parse(userString) : null;
    const site = user?.site || '';
    return {token, role, site};
  };

  // ======== FETCH DATA DETAIL AKTIVITAS UNTUK EDIT (by id) ========
  useEffect(() => {
    setLoading(true);
    const fetchData = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/dayActivities/${id}/edit`);
        const rawData = res.data?.data;
        if (!rawData) {
          alert('Data tidak ditemukan');
          return;
        }
        setHeaderData(rawData);
        // Set semua field form sesuai data dari API
        setFormData(prev => ({
          ...prev,
          jde_no: rawData.jde_no || '',
          employee_name: rawData.employee_name || '',
          site: rawData.site || '',
          date_activity: rawData.date_activity || '',
          kpi_type: rawData.kpi_type || '',
          kpi_name: rawData.kpi_name || '',
          activity: rawData.activity || '',
          unit_detail: rawData.unit_detail || '',
          total_participant: String(rawData.total_participant || ''),
          total_hour: String(rawData.total_hour || ''),
        }));
        setUnitValue(rawData.unit_detail || '');
        if (rawData.date_activity)
          setSelectedDate(new Date(rawData.date_activity));
      } catch (error) {
        console.error('Fetch data error:', error);
        alert('Gagal mengambil data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  // ======== FETCH INFO USER DAN SET KE FORM ========
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const {token, role, site} = await getSession();
        const userString = await AsyncStorage.getItem('userData');
        const user = userString ? JSON.parse(userString) : null;
        if (!token || !role || !site || !user) {
          Alert.alert(
            'Error',
            'Token, site, atau role tidak ditemukan. Silakan login ulang.',
          );
          return;
        }
        setRole(role);
        setFormData(prev => ({
          ...prev,
          jde_no: user.username || '',
          employee_name: user.name || '',
          site: site,
        }));
      } catch (error) {
        console.error('Error fetch initial data:', error);
        Alert.alert('Error', 'Terjadi kesalahan saat mengambil data awal');
      }
    };
    fetchInitialData();
  }, []);

  // ======== ON KPI CHANGE, FETCH ACTIVITY SESUAI KPI, ROLE, SITE ========
  const onKpiChange = async selectedKpi => {
    setFormData(prev => ({...prev, kpi_type: selectedKpi, activity: ''}));
    try {
      const {token, role, site} = await getSession();
      if (!token || !role || !site) return;
      // Panggil API getActivity, hasil harus diambil dari data.data (array)
      const activityResp = await axios.get(`${API_BASE_URL}/getActivity`, {
        headers: {Authorization: `Bearer ${token}`},
        params: {kpi: selectedKpi, role, site},
      });
      const actData = (activityResp.data?.data || []).map(act => ({
        label: act.activity,
        value: act.id,
      }));
      setActivityOptions(actData);
    } catch (error) {
      Alert.alert('Error', 'Gagal mengambil data activity');
    }
  };

  // ======== HANDLE FIELD CHANGE UNTUK formData ========
  const handleChange = (name, value) => {
    setFormData(prev => ({...prev, [name]: value}));
  };

  // ======== HANDLE GANTI TANGGAL AKTIVITAS ========
  const handleDateChange = (_event, selected) => {
    const currentDate = selected || selectedDate;
    setShowDatePicker(Platform.OS === 'ios');
    setSelectedDate(currentDate);
    const formatted = currentDate.toISOString().split('T')[0];
    handleChange('date_activity', formatted);
  };

  // ======== SUBMIT FORM (PUT UPDATE DATA) ========
  const handleSubmit = async () => {
    // Validasi semua field wajib diisi
    const requiredFields = [
      'jde_no',
      'employee_name',
      'site',
      'date_activity',
      'kpi_type',
      'activity',
      'unit_detail',
      'total_participant',
      'total_hour',
    ];
    for (const field of requiredFields) {
      if (!formData[field]) {
        Alert.alert('Validasi Gagal', `Field "${field}" wajib diisi.`);
        return;
      }
    }
    // Activity harus ID numerik
    if (!Number.isInteger(Number(formData.activity))) {
      Alert.alert('Validasi Gagal', 'Activity ID tidak valid.');
      return;
    }
    const payload = {
      edit_id: Number(id),
      edit_jde: formData.jde_no,
      edit_name: formData.employee_name,
      edit_site: formData.site,
      edit_date: formData.date_activity,
      edit_kpi: formData.kpi_type,
      edit_activity: Number(formData.activity),
      edit_unit_detail: Number(formData.unit_detail),
      edit_jml_peserta: Number(formData.total_participant),
      edit_total_hour: Number(formData.total_hour),
    };
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        Alert.alert('Error', 'Token tidak ditemukan. Silakan login ulang.');
        return;
      }
      const response = await axios.put(
        `${API_BASE_URL}/dayActivities/${id}/update`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
        },
      );
      if (response.data.success) {
        Alert.alert(
          'Sukses',
          response.data.message || 'Data berhasil disimpan',
        );
        setFormData(prev => ({
          ...prev,
          date_activity: '',
          kpi_type: '',
          activity: '',
          unit_detail: '',
          total_participant: '',
          total_hour: '',
        }));
        setUnitValue(null);
        navigation.navigate('DailyActivity');
      } else {
        Alert.alert('Gagal', response.data.message || 'Gagal menyimpan data');
      }
    } catch (error) {
      if (error.response?.data?.errors) {
        const messages = Object.values(error.response.data.errors)
          .flat()
          .join('\n');
        Alert.alert('Validasi Gagal', messages);
      } else {
        Alert.alert('Error', 'Terjadi kesalahan saat menyimpan data');
      }
    }
  };

  // ======== FETCH KPI, EDIT DATA, DAN ACTIVITY PERTAMA KALI (untuk dropdown) ========
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const {token, role, site} = await getSession();
        if (!token || !role || !site) return;

        // Fetch KPI list
        const kpiResp = await axios.get(`${API_BASE_URL}/getKPI`);
        const kpiData = (kpiResp.data?.data || []).map(kpi => ({
          label: kpi.kpi,
          value: kpi.id,
        }));
        setKpiOptions(kpiData);

        // Fetch edit data
        const editResp = await axios.get(
          `${API_BASE_URL}/dayActivities/${id}/edit`,
        );
        const rawData = editResp.data?.data;
        if (!rawData) {
          alert('Data tidak ditemukan');
          return;
        }
        setHeaderData(rawData);

        const selectedKpi = rawData.kpi_type || kpiData[0]?.value;
        setFormData(prev => ({
          ...prev,
          jde_no: rawData.jde_no || '',
          employee_name: rawData.employee_name || '',
          site: rawData.site || '',
          date_activity: rawData.date_activity || '',
          kpi_type: selectedKpi,
          total_participant: String(rawData.total_participant || ''),
          total_hour: String(rawData.total_hour || ''),
        }));
        setSelectedDate(new Date(rawData.date_activity));

        // Fetch activity list untuk KPI terpilih
        const activityResp = await axios.get(`${API_BASE_URL}/getActivity`, {
          params: {
            kpi: selectedKpi,
            role,
            site,
          },
        });
        const actData = (activityResp.data?.data || []).map(act => ({
          label: act.activity,
          value: act.id,
        }));
        setActivityOptions(actData);

        // Set value activity & unit dari rawData
        setFormData(prev => ({
          ...prev,
          activity: rawData.activity,
        }));
        setUnitValue(rawData.unit_detail || '');
        setFormData(prev => ({
          ...prev,
          unit_detail: rawData.unit_detail || '',
        }));
      } catch (error) {
        console.error('Error fetch initial data:', error);
        Alert.alert('Error', 'Terjadi kesalahan saat mengambil data awal');
      }
    };
    fetchInitialData();
  }, [id]);

  // ======== FETCH DATA LIST UNIT UNTUK DROPDOWN PICKER ========
  useEffect(() => {
    const fetchUnitOptions = async () => {
      try {
        const token = await AsyncStorage.getItem('userToken');
        const res = await axios.get(`${API_BASE_URL}/getModelUnit`, {
          headers: {Authorization: `Bearer ${token}`},
        });
        const unitData = res.data.map(u => ({
          label: u.model,
          value: String(u.id),
          modelOnly: u.model,
        }));
        setUnitOptions(unitData);
      } catch (err) {
        console.error('Error fetch unit options:', err);
      }
    };
    fetchUnitOptions();
  }, []);

  // Handler untuk perubahan Activity
  const onActivityChange = val => {
    handleChange('activity', val);
  };

  // ======== RENDER UI ========
  return (
    <View style={{flex: 1}}>
      <KeyboardAwareScrollView
        contentContainerStyle={addDailyAct.container}
        keyboardShouldPersistTaps="handled"
        extraScrollHeight={120}>
        <Text style={addDailyAct.header}>EDIT DAILY ACTIVITY</Text>

        {/* --- User Info Section --- */}
        <CollapsibleCard title="User Info">
          <Text style={addDailyAct.label}>JDE No</Text>
          <TextInput
            style={addDailyAct.input}
            value={formData.jde_no}
            editable={false}
          />
          <Text style={addDailyAct.label}>Employee Name</Text>
          <TextInput
            style={addDailyAct.input}
            value={formData.employee_name}
            editable={false}
          />
          <Text style={addDailyAct.label}>Site</Text>
          <TextInput
            style={addDailyAct.input}
            value={formData.site}
            editable={false}
          />
        </CollapsibleCard>

        {/* --- Activity Info Section --- */}
        <CollapsibleCard title="Activity Info">
          <Text style={addDailyAct.label}>Date Activity</Text>
          <TouchableOpacity onPress={() => setShowDatePicker(true)}>
            <TextInput
              style={addDailyAct.input}
              value={formData.date_activity}
              placeholder="YYYY-MM-DD"
              editable={false}
            />
          </TouchableOpacity>
          {showDatePicker && (
            <DateTimePicker
              value={selectedDate}
              mode="date"
              display="default"
              onChange={handleDateChange}
              maximumDate={new Date()}
            />
          )}

          <Text style={addDailyAct.label}>KPI Type</Text>
          <RNPickerSelect
            onValueChange={onKpiChange}
            value={formData.kpi_type}
            placeholder={{label: 'Pilih KPI', value: ''}}
            items={kpiOptions}
            style={{
              inputIOS: addDailyAct.pickerSelectIOS,
              inputAndroid: addDailyAct.pickerSelectAndroid,
            }}
          />

          <Text style={addDailyAct.label}>Activity</Text>
          <RNPickerSelect
            onValueChange={onActivityChange}
            value={formData.activity}
            placeholder={{label: 'Pilih Activity', value: ''}}
            items={activityOptions}
            style={{
              inputIOS: addDailyAct.pickerSelectIOS,
              inputAndroid: addDailyAct.pickerSelectAndroid,
            }}
          />
        </CollapsibleCard>

        {/* --- Unit Info Section --- */}
        <CollapsibleCard title="Unit Info">
          <Text style={addDailyAct.label}>Detail Unit</Text>
          <DropDownPicker
            open={unitOpen}
            value={unitValue}
            items={unitOptions}
            setOpen={setUnitOpen}
            setValue={setUnitValue}
            onChangeValue={val => {
              setUnitValue(val);
              handleChange('unit_detail', val);
            }}
            setItems={setUnitOptions}
            placeholder="Pilih Unit"
            searchable
            listMode="MODAL"
            modalTitle="Pilih Unit"
            modalProps={{animationType: 'slide'}}
            dropDownDirection="AUTO"
            zIndex={3000}
            zIndexInverse={1000}
          />
        </CollapsibleCard>

        {/* --- Participant Info Section --- */}
        <CollapsibleCard title="Participant Info">
          <Text style={addDailyAct.label}>Total Participant</Text>
          <TextInput
            style={addDailyAct.input}
            keyboardType="numeric"
            value={formData.total_participant}
            onChangeText={text => handleChange('total_participant', text)}
          />

          <Text style={addDailyAct.label}>Total Hour</Text>
          <TextInput
            style={addDailyAct.input}
            keyboardType="numeric"
            value={formData.total_hour}
            onChangeText={text => handleChange('total_hour', text)}
          />
        </CollapsibleCard>

        {/* --- Simpan Button --- */}
        <Button title="Simpan" onPress={handleSubmit} />
      </KeyboardAwareScrollView>
    </View>
  );
};

export default EditDailyActivity;
