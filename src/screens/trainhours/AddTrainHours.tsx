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
import axios from 'axios';
import {addDailyAct} from '../../styles/addDailyAct';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DropDownPicker from 'react-native-dropdown-picker';
import {KeyboardAwareScrollView} from 'react-native-keyboard-aware-scroll-view';
import DateTimePicker from '@react-native-community/datetimepicker';
import {useNavigation} from '@react-navigation/native';
import API_BASE_URL from '../../config';

// Enable layout animation khusus Android
if (Platform.OS === 'android') {
  UIManager.setLayoutAnimationEnabledExperimental &&
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

/**
 * Komponen kartu collapsible untuk grouping setiap blok form
 */
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

/**
 * Form Input Train Hours - Tambah Data
 */
const AddTrainHours = () => {
  const navigation = useNavigation();

  // State utama form
  const [formData, setFormData] = useState({
    jde_no: '',
    employee_name: '',
    position: '',
    training_type: '', // gunakan value ID
    unit_class: '',
    unit_type: '',
    code: '',
    batch: '',
    plan_total_hm: '',
    hm_start: '',
    hm_end: '',
    total_hm: '',
    progres: '',
    site: '',
    date_activity: '',
  });

  // State dropdown & opsi
  const [trainingTypeOptions, setTrainingTypeOptions] = useState([]);
  const [trainingTypeOpen, setTrainingTypeOpen] = useState(false);
  const [trainingTypeValue, setTrainingTypeValue] = useState(null);

  const [filteredClassUnitOptions, setFilteredClassUnitOptions] = useState([]);
  const [classUnitArr, setClassUnitArr] = useState([]);
  const [allCodeUnitArr, setAllCodeUnitArr] = useState([]);
  const [unitClassOpen, setUnitClassOpen] = useState(false);

  const [unitTypeOptions, setUnitTypeOptions] = useState([]);
  const [unitTypeOpen, setUnitTypeOpen] = useState(false);

  const [codeOptions, setCodeOptions] = useState([]);
  const [codeOpen, setCodeOpen] = useState(false);

  const [batchOptions, setBatchOptions] = useState([
    {label: 'Batch 1', value: 'Batch 1'},
    {label: 'Batch 2', value: 'Batch 2'},
    {label: 'Batch 3', value: 'Batch 3'},
    {label: 'Batch 4', value: 'Batch 4'},
    {label: 'Batch 5', value: 'Batch 5'},
    {label: 'Batch 6', value: 'Batch 6'},
    {label: 'Batch 7', value: 'Batch 7'},
    {label: 'Batch 8', value: 'Batch 8'},
    {label: 'Batch 9', value: 'Batch 9'},
    {label: 'Batch 10', value: 'Batch 10'},
  ]);
  const [batchOpen, setBatchOpen] = useState(false);

  // State tanggal
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());

  /**
   * Helper ambil data session user
   */
  const getSession = async () => {
    const token = await AsyncStorage.getItem('userToken');
    const userString = await AsyncStorage.getItem('userData');
    const user = userString ? JSON.parse(userString) : null;
    const site = user?.site || '';
    return {token, user, site};
  };

  /**
   * Ambil master data & prefill employee info
   */
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const {token, user, site} = await getSession();
        if (!token || !user) {
          Alert.alert('Error', 'Session habis. Silakan login ulang.');
          return;
        }

        // Set data employee dari user login
        setFormData(prev => ({
          ...prev,
          jde_no: user.username || '',
          employee_name: user.name || '',
          site: site,
        }));

        // Get master data dari API
        const response = await axios.get(`${API_BASE_URL}/trainHours/create`, {
          headers: {Authorization: `Bearer ${token}`},
        });
        if (response.data.status) {
          const emp = response.data.data.employeeAuth;
          setFormData(prev => ({
            ...prev,
            jde_no: emp.EmployeeId || '',
            employee_name: emp.EmployeeName || '',
            position: emp.JobTtlName || emp.PositionName || '',
            site: site || '',
          }));

          // Data Unit Type (class)
          const typeUnitArr = (response.data.data.typeUnit || []).map(item => ({
            label: item.class,
            value: item.id, // value id
          }));
          setUnitTypeOptions(typeUnitArr);

          // Data Class Unit (model)
          const classUnitArr = (response.data.data.classUnit || []).map(
            item => ({
              label: item.model,
              value: item.id,
              type: item.type,
              class: item.class, // class = id typeUnit
            }),
          );
          setClassUnitArr(classUnitArr);
          setFilteredClassUnitOptions([]);

          // Data Kode Unit (code)
          const codeUnitArr = (response.data.data.codeUnit || []).map(item => ({
            label: item.no_unit || item.NO_UNIT || item.code,
            value: item.id,
            fid_model: item.fid_model,
          }));
          setAllCodeUnitArr(codeUnitArr);
          setCodeOptions([]);

          // Data KPI (training type)
          const kpiArr = (response.data.data.kpi || []).map(item => ({
            label: item.kpi,
            value: item.id,
          }));
          setTrainingTypeOptions(kpiArr);
        } else {
          Alert.alert(
            'Error',
            response.data.message || 'Gagal ambil data master',
          );
        }
      } catch (error) {
        console.error('Error fetch initial data:', error);
        Alert.alert('Error', 'Terjadi kesalahan saat ambil data awal');
      }
    };

    fetchInitialData();
  }, []);

  /**
   * Handler cascading: ketika user pilih Unit Type (ID class)
   */
  const onChangeUnitType = val => {
    setFormData(prev => ({
      ...prev,
      unit_type: val,
      unit_class: '',
      code: '',
    }));

    // Filter classUnitArr berdasarkan class === val
    const filtered = classUnitArr.filter(
      item => String(item.class) === String(val),
    );
    setFilteredClassUnitOptions(filtered);
    setCodeOptions([]);
  };

  /**
   * Handler cascading: ketika user pilih Unit Class (model)
   */
  const onChangeUnitClass = val => {
    setFormData(prev => ({
      ...prev,
      unit_class: val,
      code: '',
    }));

    // Filter code berdasarkan fid_model === unit_class
    const filteredCode = allCodeUnitArr.filter(
      code => String(code.fid_model) === String(val),
    );
    setCodeOptions(filteredCode);
  };

  /**
   * Handler training_type (KPI) dropdown
   */
  const onChangeTrainingType = val => {
    setTrainingTypeValue(val);
    setFormData(prev => ({
      ...prev,
      training_type: val,
    }));
  };

  /**
   * Handler umum perubahan text input
   */
  const handleChange = (name, value) => {
    setFormData(prev => ({...prev, [name]: value}));
  };

  /**
   * Handler perubahan tanggal dari DateTimePicker
   */
  const handleDateChange = (_event, selected) => {
    const currentDate = selected || selectedDate;
    setShowDatePicker(Platform.OS === 'ios');
    setSelectedDate(currentDate);
    const formatted = currentDate.toISOString().split('T')[0];
    handleChange('date_activity', formatted);
  };

  /**
   * Hitung otomatis total_hm & progres setiap hm_start/hm_end berubah
   */
  useEffect(() => {
    const start = Number(formData.hm_start) || 0;
    const end = Number(formData.hm_end) || 0;
    const plan = Number(formData.plan_total_hm) || 0;
    const total = end - start;
    setFormData(prev => ({
      ...prev,
      total_hm: total ? String(total) : '',
      progres: plan > 0 ? String(total) : '',
    }));
  }, [formData.hm_start, formData.hm_end, formData.plan_total_hm]);

  /**
   * Validasi dan submit form ke backend
   */
  const handleSubmit = async () => {
    const requiredFields = [
      'jde_no',
      'employee_name',
      'position',
      'training_type',
      'unit_class',
      'unit_type',
      'code',
      'batch',
      'plan_total_hm',
      'hm_start',
      'hm_end',
      'total_hm',
      'progres',
      'site',
      'date_activity',
    ];
    for (const field of requiredFields) {
      if (!formData[field]) {
        Alert.alert(
          'Validasi Gagal',
          `Field "${field.replace('_', ' ')}" wajib diisi.`,
        );
        return;
      }
    }
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        Alert.alert('Error', 'Token tidak ditemukan. Silakan login ulang.');
        return;
      }
      const response = await axios.post(
        `${API_BASE_URL}/trainHours/store`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
        },
      );
      if (response.data.status) {
        Alert.alert(
          'Sukses',
          response.data.message || 'Data berhasil disimpan',
        );
        setFormData({
          jde_no: '',
          employee_name: '',
          position: '',
          training_type: '',
          unit_class: '',
          unit_type: '',
          code: '',
          batch: '',
          plan_total_hm: '',
          hm_start: '',
          hm_end: '',
          total_hm: '',
          progres: '',
          site: '',
          date_activity: '',
        });
        navigation.navigate('TrainHours');
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

  // ------------------- RENDER FORM -------------------
  return (
    <View style={{flex: 1}}>
      <KeyboardAwareScrollView
        contentContainerStyle={addDailyAct.container}
        keyboardShouldPersistTaps="handled"
        extraScrollHeight={120}>
        <Text style={addDailyAct.header}>INPUT TRAIN HOURS</Text>

        {/* Employee Info Section */}
        <CollapsibleCard title="Employee Info">
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
          <Text style={addDailyAct.label}>Position</Text>
          <TextInput
            style={addDailyAct.input}
            value={formData.position}
            editable={false}
          />
        </CollapsibleCard>

        {/* Training Info Section */}
        <CollapsibleCard title="Training Info">
          <Text style={addDailyAct.label}>Training Type</Text>
          <DropDownPicker
            listMode="MODAL"
            open={trainingTypeOpen}
            value={trainingTypeValue}
            items={trainingTypeOptions}
            setOpen={setTrainingTypeOpen}
            setValue={val => onChangeTrainingType(val())}
            setItems={setTrainingTypeOptions}
            placeholder="Pilih Training Type"
            searchable
            zIndex={3500}
            zIndexInverse={3000}
          />
          <Text style={addDailyAct.label}>Batch</Text>
          <DropDownPicker
            listMode="MODAL"
            open={batchOpen}
            value={formData.batch}
            items={batchOptions}
            setOpen={setBatchOpen}
            setValue={val => {
              setBatchOpen(false);
              handleChange('batch', val());
            }}
            setItems={setBatchOptions}
            placeholder="Pilih Batch"
            searchable
            zIndex={3000}
            zIndexInverse={1000}
          />
        </CollapsibleCard>

        {/* Unit Info Section */}
        <CollapsibleCard title="Unit Info">
          <Text style={addDailyAct.label}>Unit Type</Text>
          <DropDownPicker
            listMode="MODAL"
            open={unitTypeOpen}
            value={formData.unit_type}
            items={unitTypeOptions}
            setOpen={setUnitTypeOpen}
            setValue={val => onChangeUnitType(val())}
            setItems={setUnitTypeOptions}
            placeholder="Pilih Unit Type"
            searchable
            zIndex={2000}
            zIndexInverse={2500}
          />
          <Text style={addDailyAct.label}>Unit Class</Text>
          <DropDownPicker
            listMode="MODAL"
            open={unitClassOpen}
            value={formData.unit_class}
            items={filteredClassUnitOptions}
            setOpen={setUnitClassOpen}
            setValue={val => onChangeUnitClass(val())}
            setItems={setFilteredClassUnitOptions}
            placeholder={
              !formData.unit_type
                ? 'Pilih Unit Type dahulu'
                : 'Pilih Unit Class'
            }
            searchable
            disabled={!formData.unit_type}
            zIndex={2500}
            zIndexInverse={2000}
          />
          <Text style={addDailyAct.label}>Code</Text>
          <DropDownPicker
            listMode="MODAL"
            open={codeOpen}
            value={formData.code}
            items={codeOptions}
            setOpen={setCodeOpen}
            setValue={val => {
              setCodeOpen(false);
              handleChange('code', val());
            }}
            setItems={setCodeOptions}
            placeholder={
              !formData.unit_class ? 'Pilih Unit Class dahulu' : 'Pilih Code'
            }
            searchable
            disabled={!formData.unit_class}
            zIndex={1500}
            zIndexInverse={1000}
          />
        </CollapsibleCard>

        {/* Hour Info Section */}
        <CollapsibleCard title="Hour Info">
          <Text style={addDailyAct.label}>Plan Total HM</Text>
          <TextInput
            style={addDailyAct.input}
            value={formData.plan_total_hm}
            onChangeText={text => handleChange('plan_total_hm', text)}
            keyboardType="numeric"
          />
          <Text style={addDailyAct.label}>HM Start</Text>
          <TextInput
            style={addDailyAct.input}
            value={formData.hm_start}
            onChangeText={text => handleChange('hm_start', text)}
            keyboardType="numeric"
          />
          <Text style={addDailyAct.label}>HM End</Text>
          <TextInput
            style={addDailyAct.input}
            value={formData.hm_end}
            onChangeText={text => handleChange('hm_end', text)}
            keyboardType="numeric"
          />
          <Text style={addDailyAct.label}>Total HM</Text>
          <TextInput
            style={addDailyAct.input}
            value={formData.total_hm}
            onChangeText={text => handleChange('total_hm', text)}
            keyboardType="numeric"
            editable={false}
          />
          <Text style={addDailyAct.label}>Progres</Text>
          <TextInput
            style={addDailyAct.input}
            value={formData.progres}
            onChangeText={text => handleChange('progres', text)}
            keyboardType="numeric"
            editable={false}
          />
        </CollapsibleCard>

        {/* Tanggal Section */}
        <CollapsibleCard title="Tanggal">
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
        </CollapsibleCard>

        <Button title="Simpan" onPress={handleSubmit} />
      </KeyboardAwareScrollView>
    </View>
  );
};

export default AddTrainHours;
