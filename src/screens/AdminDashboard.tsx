import React, {useEffect, useState, useContext} from 'react';
import {
  SafeAreaView,
  Text,
  TouchableOpacity,
  View,
  ScrollView,
  FlatList,
  Image,
  UIManager,
  Alert,
  ToastAndroid,
  ActivityIndicator,
  Modal,
  Platform,
  ProgressBarAndroid,
  ProgressViewIOS,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {RootStackParamList} from '../navigation/types';
import Icon from 'react-native-vector-icons/Ionicons';
import * as Animatable from 'react-native-animatable';
import {dashboardStyles as styles} from '../styles/dashboardStyles';
import dayjs from 'dayjs';
import API_BASE_URL from '../config';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import NetInfo from '@react-native-community/netinfo';
import {useQueryClient} from '@tanstack/react-query';
import {cacheAllMasterData} from '../utils/cacheAllMasterData';
import {OfflineQueueContext} from '../utils/OfflineQueueContext';

if (!(global as any)._IS_NEW_ARCHITECTURE_ENABLED) {
  UIManager.setLayoutAnimationEnabledExperimental &&
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

type Props = NativeStackScreenProps<RootStackParamList, 'AdminDashboard'>;

const categories = [
  {
    id: '1',
    title: 'Mentoring',
    icon: 'school-outline',
    submenu: [
      {label: 'Index Mentoring', icon: 'document-text-outline', screen: 'Data'},
      {
        label: 'Tambah Mentoring',
        icon: 'add-circle-outline',
        subsubmenu: [
          {label: 'Form Digger', icon: 'cog', screen: 'AddDataMentoring'},
          {label: 'Form Hauler', icon: 'cog', screen: 'AddDataMentoring'},
          {label: 'Form Bulldozer', icon: 'cog', screen: 'AddDataMentoring'},
          {label: 'Form Grader', icon: 'cog', screen: 'AddDataMentoring'},
        ],
      },
    ],
  },
  {
    id: '2',
    title: 'Trainer',
    icon: 'barbell-outline',
    submenu: [
      {
        label: 'Daily Activity',
        icon: 'document-text-outline',
        subsubmenu: [
          {label: 'Index Daily', icon: 'list-outline', screen: 'DailyActivity'},
          {
            label: 'Tambah Daily',
            icon: 'add-circle-outline',
            screen: 'AddDailyActivity',
          },
        ],
      },
      {
        label: 'Train Hours',
        icon: 'time-outline',
        subsubmenu: [
          {
            label: 'Index Train Hours',
            icon: 'time-outline',
            screen: 'TrainHours',
          },
          {
            label: 'Tambah Train Hours',
            icon: 'add-circle-outline',
            screen: 'AddTrainHours',
          },
        ],
      },
    ],
  },
];

const defaultSummary = {
  mentoringToday: 0,
  dailyToday: 0,
  trainHoursToday: 0,
  unitTotal: 0,
  typeTotal: 0,
  modelTotal: 0,
  classTotal: 0,
  siteTotal: 0,
};

const summaryCardColors = [
  '#1E90FF',
  '#16A085',
  '#E67E22',
  '#9B59B6',
  '#27AE60',
  '#2980B9',
  '#F39C12',
  '#C0392B',
];

const AdminDashboard = ({navigation}: Props) => {
  const insets = useSafeAreaInsets();
  const [user, setUser] = useState<any>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState('1');
  const [activeSubmenu, setActiveSubmenu] = useState<string | null>(null);
  const [dateTime, setDateTime] = useState(new Date());
  const [summary, setSummary] = useState(defaultSummary);
  const [loadingSummary, setLoadingSummary] = useState(true);
  const [isConnected, setIsConnected] = useState(true);
  const [isCachingMaster, setIsCachingMaster] = useState(false);

  // PROGRESS SYNC MODAL STATE
  const [syncVisible, setSyncVisible] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);
  const [syncTotal, setSyncTotal] = useState(0);
  const [syncLabel, setSyncLabel] = useState('');

  // OFFLINE QUEUE BADGES
  const {
    mentoringQueueCount,
    dailyQueueCount,
    trainHoursQueueCount,
    syncing,
    pushMentoringQueue,
    pushDailyQueue,
    pushTrainHoursQueue,
  } = useContext(OfflineQueueContext);

  // Load user info
  useEffect(() => {
    const fetchUser = async () => {
      const userString = await AsyncStorage.getItem('userData');
      if (userString) setUser(JSON.parse(userString));
    };
    fetchUser();
  }, []);

  // Fetch summary (dashboard counters)
  useEffect(() => {
    fetchSummary();
  }, []);
  const fetchSummary = async () => {
    try {
      setLoadingSummary(true);
      const res = await fetch(`${API_BASE_URL}/dashboard`);
      const json = await res.json();
      setSummary(
        json.data && typeof json.data === 'object'
          ? {...defaultSummary, ...json.data}
          : defaultSummary,
      );
    } catch (err) {
      setSummary(defaultSummary);
    } finally {
      setLoadingSummary(false);
    }
  };

  // Category handler
  const handleCategoryPress = (categoryId: string) => {
    setSelectedCategoryId(prev => (prev === categoryId ? null : categoryId));
    setActiveSubmenu(null);
  };
  const handleSubmenuPress = (item: any) => {
    if (item.subsubmenu) {
      setActiveSubmenu(prev => (prev === item.label ? null : item.label));
    } else if (item.screen) {
      setActiveSubmenu(null);
      navigation.navigate(item.screen);
    }
  };
  const unitTypeMapping: {[key: string]: number} = {
    DIGGER: 3,
    BULLDOZER: 2,
    GRADER: 5,
    HAULER: 4,
  };
  const handleSubsubmenuPress = (item: any) => {
    if (item.screen === 'AddDataMentoring') {
      const unitType = item.label.replace('Form ', '').toUpperCase();
      const unitTypeId = unitTypeMapping[unitType];
      navigation.navigate(item.screen, {data: {unitType, unitTypeId}});
    } else {
      navigation.navigate(item.screen);
    }
  };
  const selectedCategory = categories.find(
    cat => cat.id === selectedCategoryId,
  );

  // Logout
  const handleLogout = () => {
    Alert.alert(
      'Konfirmasi Logout',
      'Yakin ingin logout?',
      [
        {text: 'Batal', style: 'cancel'},
        {
          text: 'Ya',
          onPress: async () => {
            await AsyncStorage.removeItem('userToken');
            await AsyncStorage.removeItem('userData');
            await AsyncStorage.removeItem('userRole');
            ToastAndroid.show('Logout berhasil!', ToastAndroid.SHORT);
            Alert.alert('Logout', 'Anda berhasil logout!', [
              {
                text: 'OK',
                onPress: () => navigation.replace('Login'),
              },
            ]);
          },
          style: 'destructive',
        },
      ],
      {cancelable: true},
    );
  };

  // DateTime clock
  useEffect(() => {
    const interval = setInterval(() => setDateTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Subsubmenu render
  const renderSubsubmenu = (items: any[]) => (
    <Animatable.View animation="fadeInUp" duration={400} style={{marginTop: 6}}>
      <View style={styles.subsubmenuGrid}>
        {items.map((item, idx) => (
          <TouchableOpacity
            key={item.id ? item.id : `${item.label}-${idx}`}
            style={[styles.subGridCard, {width: '47%'}]}
            activeOpacity={0.8}
            onPress={() => handleSubsubmenuPress(item)}>
            <Icon name={item.icon} size={34} color="#1E90FF" />
            <Text style={styles.subGridText}>{item.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </Animatable.View>
  );

  // Network status
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsConnected(state.isConnected === true);
    });
    NetInfo.fetch().then(state => setIsConnected(state.isConnected === true));
    return () => unsubscribe();
  }, []);

  // Query client: sync master
  const queryClient = useQueryClient();
  useEffect(() => {
    let shown = false;
    const unsubscribe = NetInfo.addEventListener(async state => {
      if (state.isConnected) {
        const mutations = queryClient.getMutationCache().getAll();
        const hasPaused = mutations.some(m => m.state.status === 'paused');
        if (hasPaused && !shown) {
          shown = true;
          Alert.alert('Info', 'Sedang mengirim data yang tersimpan offline...');
        }
      }
    });
    return () => unsubscribe();
  }, [queryClient]);

  // Auto cache master
  useEffect(() => {
    cacheAllMasterData();
  }, []);

  // Force update master
  const handleForceUpdateMaster = async () => {
    try {
      setIsCachingMaster(true);
      await cacheAllMasterData();
      setIsCachingMaster(false);
      ToastAndroid.show('Master data berhasil di-refresh!', ToastAndroid.SHORT);
    } catch (err) {
      setIsCachingMaster(false);
      Alert.alert('Gagal', 'Refresh master gagal.\n' + (err?.message || ''));
    }
  };

  return (
    <SafeAreaView style={[styles.container, {paddingBottom: insets.bottom}]}>
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          {paddingBottom: Math.max(insets.bottom, 100)},
        ]}>
        {/* HEADER */}
        <View style={styles.headerWrap}>
          <Image
            source={require('../assets/images/logo.jpg')}
            style={styles.logo}
          />
          {/* Status jaringan + jam */}
          <View style={styles.statusContainer}>
            <Text
              style={[
                styles.statusIndicator,
                isConnected ? styles.statusOnline : styles.statusOffline,
              ]}>
              {isConnected ? '🟢 Online' : '🔴 Offline'}
            </Text>
            <Text style={styles.statusTime}>
              {dayjs(dateTime).format('dddd, DD MMMM YYYY HH:mm:ss')}
            </Text>
            {/* FORCE UPDATE BUTTON */}
            <View style={styles.forceUpdateWrap}>
              <TouchableOpacity
                style={[
                  styles.forceUpdateButton,
                  isCachingMaster && styles.forceUpdateButtonDisabled,
                ]}
                onPress={handleForceUpdateMaster}
                disabled={isCachingMaster}>
                <Icon name="refresh-outline" size={18} color="#fff" />
                <Text style={styles.forceUpdateButtonText}>
                  Force Update Data
                </Text>
                {isCachingMaster && (
                  <ActivityIndicator
                    size={14}
                    color="#fff"
                    style={{marginLeft: 8}}
                  />
                )}
              </TouchableOpacity>
              {isCachingMaster && (
                <Text style={styles.forceUpdateStatus}>Syncing data...</Text>
              )}
            </View>
          </View>
        </View>
        {/* USER HEADER */}
        <Animatable.View
          animation="fadeInDown"
          delay={70}
          style={styles.headerCard}>
          <Text style={styles.headerText}>
            <Icon name="person-circle-outline" size={22} color="#fff" /> Selamat
            datang, {user?.role || '-'} !
          </Text>
          <TouchableOpacity
            onPress={handleLogout}
            style={styles.logoutIconBtn}
            activeOpacity={0.8}>
            <Icon name="log-out-outline" size={22} color="#fff" />
          </TouchableOpacity>
          {user && (
            <View style={styles.userCard}>
              <Text style={styles.name}>
                {user.name} ({user.username})
              </Text>
              <Text style={styles.info}>Perusahaan: {user.company}</Text>
              <Text style={styles.info}>Site: {user.site}</Text>
            </View>
          )}
        </Animatable.View>

        {/* --- BADGE PUSH OFFLINE QUEUE --- */}
        {(mentoringQueueCount > 0 ||
          dailyQueueCount > 0 ||
          trainHoursQueueCount > 0) && (
          <View style={styles.pushQueueBadge}>
            {mentoringQueueCount > 0 && (
              <View style={styles.pushQueueRow}>
                <Text style={styles.pushQueueText}>
                  {mentoringQueueCount} data Mentoring offline belum terkirim!
                </Text>
                <TouchableOpacity
                  style={styles.pushQueueButton}
                  onPress={pushMentoringQueue}>
                  <Text style={styles.pushQueueButtonText}>Push Sekarang</Text>
                </TouchableOpacity>
              </View>
            )}
            {dailyQueueCount > 0 && (
              <View style={styles.pushQueueRow}>
                <Text style={styles.pushQueueText}>
                  {dailyQueueCount} data Daily offline belum terkirim!
                </Text>
                <TouchableOpacity
                  style={styles.pushQueueButton}
                  onPress={pushDailyQueue}>
                  <Text style={styles.pushQueueButtonText}>Push Sekarang</Text>
                </TouchableOpacity>
              </View>
            )}
            {trainHoursQueueCount > 0 && (
              <View style={styles.pushQueueRow}>
                <Text style={styles.pushQueueText}>
                  {trainHoursQueueCount} data Train Hours offline belum
                  terkirim!
                </Text>
                <TouchableOpacity
                  style={styles.pushQueueButton}
                  onPress={pushTrainHoursQueue}>
                  <Text style={styles.pushQueueButtonText}>Push Sekarang</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {/* --- SYNC PROGRESS MODAL --- */}
        <Modal visible={syncVisible} transparent animationType="fade">
          <View style={styles.modalBackground}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Sinkronisasi {syncLabel}</Text>
              {Platform.OS === 'android' ? (
                <ProgressBarAndroid
                  styleAttr="Horizontal"
                  indeterminate={false}
                  progress={syncProgress}
                  style={styles.progressBar}
                />
              ) : (
                <ProgressViewIOS
                  progress={syncProgress}
                  style={styles.progressBar}
                />
              )}
              <Text style={styles.modalProgressText}>
                {Math.round(syncProgress * 100)}% (
                {Math.round(syncProgress * syncTotal)}/{syncTotal})
              </Text>
              <Text style={styles.modalDesc}>
                Mohon tunggu, data offline sedang dikirim ke server...
              </Text>
            </View>
          </View>
        </Modal>

        {/* --- SUMMARY CARDS --- */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.summaryCardScroll}>
          {[
            {
              label: 'Mentoring',
              value: summary.mentoringToday,
              sub: 'Hari ini',
            },
            {label: 'Daily', value: summary.dailyToday, sub: 'Hari ini'},
            {
              label: 'Train Hours',
              value: summary.trainHoursToday,
              sub: 'Hari ini',
            },
            {label: 'Site', value: summary.siteTotal},
            {label: 'Class Unit', value: summary.classTotal},
            {label: 'Type Unit', value: summary.typeTotal},
            {label: 'Model Unit', value: summary.modelTotal},
            {label: 'Unit', value: summary.unitTotal},
          ].map((item, idx) => (
            <Animatable.View
              key={item.label}
              animation="fadeInUp"
              duration={600}
              delay={60 + idx * 40}
              style={[
                styles.summaryCardInteractive,
                {backgroundColor: summaryCardColors[idx]},
              ]}>
              <TouchableOpacity
                onPress={
                  item.label === 'Mentoring'
                    ? () => navigation.navigate('Data')
                    : item.label === 'Daily'
                    ? () => navigation.navigate('DailyActivity')
                    : item.label === 'Train Hours'
                    ? () => navigation.navigate('TrainHours')
                    : undefined
                }>
                <Icon
                  name={
                    item.label === 'Mentoring'
                      ? 'school-outline'
                      : item.label === 'Daily'
                      ? 'calendar-outline'
                      : item.label === 'Train Hours'
                      ? 'barbell-outline'
                      : item.label === 'Site'
                      ? 'map-outline'
                      : item.label === 'Class Unit'
                      ? 'layers-outline'
                      : item.label === 'Type Unit'
                      ? 'grid-outline'
                      : item.label === 'Model Unit'
                      ? 'construct-outline'
                      : 'cube-outline'
                  }
                  size={32}
                  color="#fff"
                />
                <Text style={styles.summaryLabel}>{item.label}</Text>
                <Text style={styles.summaryValue}>
                  {loadingSummary ? '-' : item.value}
                </Text>
                {item.sub && <Text style={styles.summarySub}>{item.sub}</Text>}
              </TouchableOpacity>
            </Animatable.View>
          ))}
        </ScrollView>

        {/* --- SUBMENU UTAMA --- */}
        {selectedCategory && (
          <Animatable.View animation="fadeInRight" delay={100}>
            <FlatList
              data={selectedCategory.submenu}
              horizontal
              keyExtractor={(item, idx) =>
                item.id ? String(item.id) : `${item.label}-${idx}`
              }
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.menuListContainer}
              renderItem={({item}) => (
                <TouchableOpacity
                  style={[
                    styles.menuCard,
                    activeSubmenu === item.label ? styles.menuCardActive : {},
                  ]}
                  onPress={() => handleSubmenuPress(item)}
                  activeOpacity={0.8}>
                  <Icon name={item.icon} size={28} color="#1E90FF" />
                  <Text style={styles.menuCardText}>{item.label}</Text>
                  {item.subsubmenu && (
                    <Icon
                      name={
                        activeSubmenu === item.label
                          ? 'chevron-up'
                          : 'chevron-down'
                      }
                      size={18}
                      color="#bbb"
                      style={{marginLeft: 4, marginTop: 2}}
                    />
                  )}
                </TouchableOpacity>
              )}
            />
          </Animatable.View>
        )}

        {/* --- SUBSUBMENU (GRID) --- */}
        {selectedCategory &&
          selectedCategory.submenu.map((item, idx) =>
            activeSubmenu === item.label && item.subsubmenu ? (
              <React.Fragment key={item.id ? item.id : `${item.label}-${idx}`}>
                {renderSubsubmenu(item.subsubmenu)}
              </React.Fragment>
            ) : null,
          )}
      </ScrollView>

      {/* --- BOTTOM BAR --- */}
      <View
        style={[
          styles.bottomMenuBar,
          {paddingBottom: insets.bottom > 0 ? insets.bottom : 10},
        ]}>
        {categories.map(category => (
          <TouchableOpacity
            key={category.id}
            style={[
              styles.bottomMenuItem,
              selectedCategoryId === category.id &&
                styles.bottomMenuItemSelected,
            ]}
            onPress={() => handleCategoryPress(category.id)}>
            <Icon
              name={category.icon}
              size={24}
              color={selectedCategoryId === category.id ? '#fff' : '#1E90FF'}
            />
            <Text
              style={[
                styles.bottomMenuText,
                selectedCategoryId === category.id && {color: '#fff'},
              ]}>
              {category.title}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
  );
};

export default AdminDashboard;
