import React, {useEffect, useState} from 'react';
import {
  SafeAreaView,
  Text,
  TouchableOpacity,
  View,
  ScrollView,
  FlatList,
  Image,
  UIManager,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {RootStackParamList} from '../navigation/types';
import Icon from 'react-native-vector-icons/Ionicons';
import * as Animatable from 'react-native-animatable';
import {dashboardStyles as styles} from '../styles/dashboardStyles';
import API_BASE_URL from '../config';
// Tambahkan untuk safe area bottom
import {useSafeAreaInsets} from 'react-native-safe-area-context';

if (!(global as any)._IS_NEW_ARCHITECTURE_ENABLED) {
  UIManager.setLayoutAnimationEnabledExperimental &&
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

// Tipe untuk props navigation stack
type Props = NativeStackScreenProps<RootStackParamList, 'AdminDashboard'>;

// Master menu untuk dashboard
const categories = [
  {
    id: '1',
    title: 'Mentoring',
    icon: 'school-outline',
    submenu: [
      {label: 'Data', icon: 'document-text-outline', screen: 'Data'},
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
        icon: 'calendar-outline',
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
          {label: 'Train Hours', icon: 'time-outline', screen: 'TrainHours'},
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

// Default summary agar field tidak pernah hilang meski API error
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

const AdminDashboard = ({navigation}: Props) => {
  // Safe area bottom, agar UI tidak ketutup navigation bar device
  const insets = useSafeAreaInsets();

  const [user, setUser] = useState<any>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState('1');
  const [activeSubmenu, setActiveSubmenu] = useState<string | null>(null);

  // Gunakan defaultSummary supaya summary selalu lengkap
  const [summary, setSummary] = useState(defaultSummary);
  const [loadingSummary, setLoadingSummary] = useState(true);

  // Ambil summary dashboard (mentoring, daily, dsb)
  useEffect(() => {
    fetchSummary();
  }, []);

  // Ambil summary dari API, fallback ke default jika error
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

  // Ambil user dari storage
  useEffect(() => {
    const fetchUser = async () => {
      const userString = await AsyncStorage.getItem('userData');
      if (userString) setUser(JSON.parse(userString));
    };
    fetchUser();
  }, []);

  // Logout handler
  const handleLogout = async () => {
    await AsyncStorage.multiRemove(['userToken', 'userRole', 'userData']);
    navigation.replace('Login');
  };

  // Handler pilih kategori (Mentoring, Trainer)
  const handleCategoryPress = (categoryId: string) => {
    setSelectedCategoryId(prev => (prev === categoryId ? null : categoryId));
    setActiveSubmenu(null);
  };

  // Handler submenu (misal Tambah Mentoring)
  const handleSubmenuPress = (item: any) => {
    if (item.subsubmenu) {
      setActiveSubmenu(prev => (prev === item.label ? null : item.label));
    } else if (item.screen) {
      setActiveSubmenu(null);
      navigation.navigate(item.screen);
    }
  };

  // Handler subsubmenu (misal Form Digger)
  const handleSubsubmenuPress = (item: any) => {
    if (item.screen === 'AddDataMentoring') {
      const unitType = item.label.replace('Form ', '').toUpperCase();
      navigation.navigate(item.screen, {data: {unitType}});
    } else {
      navigation.navigate(item.screen);
    }
  };

  const selectedCategory = categories.find(
    cat => cat.id === selectedCategoryId,
  );

  // Render subsubmenu dalam bentuk grid
  const renderSubsubmenu = (items: any[]) => (
    <Animatable.View animation="fadeInUp" duration={400} style={{marginTop: 6}}>
      <View
        style={{
          flexDirection: 'row',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          paddingHorizontal: 4,
          paddingBottom: 8,
        }}>
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

  // --- UI Render ---
  return (
    <SafeAreaView style={[styles.container, {paddingBottom: insets.bottom}]}>
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          {paddingBottom: Math.max(insets.bottom, 90)},
        ]}>
        {/* HEADER LOGO */}
        <View style={{alignItems: 'center', marginTop: 16, marginBottom: 2}}>
          <Image
            source={require('../assets/images/logo.jpg')}
            style={{
              width: 120,
              height: 60,
              resizeMode: 'contain',
            }}
          />
        </View>
        {/* HEADER User Info & Logout */}
        <Animatable.View
          animation="fadeInDown"
          delay={70}
          style={styles.headerCard}>
          <Text style={styles.headerText}>
            <Icon name="person-circle-outline" size={22} color="#fff" /> Selamat
            datang, {user?.username}!
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
        {/* SUMMARY DASHBOARD */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{paddingLeft: 14, paddingBottom: 6}}>
          <Animatable.View
            animation="fadeInUp"
            duration={600}
            delay={60}
            style={styles.summaryCardInteractive}>
            <TouchableOpacity onPress={() => navigation.navigate('Data')}>
              <Icon name="school-outline" size={32} color="#fff" />
              <Text style={styles.summaryLabel}>Mentoring</Text>
              <Text style={styles.summaryValue}>
                {loadingSummary ? '-' : summary.mentoringToday}
              </Text>
              <Text style={styles.summarySub}>Hari ini</Text>
            </TouchableOpacity>
          </Animatable.View>
          <Animatable.View
            animation="fadeInUp"
            duration={600}
            delay={100}
            style={[
              styles.summaryCardInteractive,
              {backgroundColor: '#16A085'},
            ]}>
            <TouchableOpacity
              onPress={() => navigation.navigate('DailyActivity')}>
              <Icon name="calendar-outline" size={32} color="#fff" />
              <Text style={styles.summaryLabel}>Daily</Text>
              <Text style={styles.summaryValue}>
                {loadingSummary ? '-' : summary.dailyToday}
              </Text>
              <Text style={styles.summarySub}>Hari ini</Text>
            </TouchableOpacity>
          </Animatable.View>
          <Animatable.View
            animation="fadeInUp"
            duration={600}
            delay={140}
            style={[
              styles.summaryCardInteractive,
              {backgroundColor: '#E67E22'},
            ]}>
            <TouchableOpacity onPress={() => navigation.navigate('TrainHours')}>
              <Icon name="barbell-outline" size={32} color="#fff" />
              <Text style={styles.summaryLabel}>Train Hours</Text>
              <Text style={styles.summaryValue}>
                {loadingSummary ? '-' : summary.trainHoursToday}
              </Text>
              <Text style={styles.summarySub}>Hari ini</Text>
            </TouchableOpacity>
          </Animatable.View>
          {/* Summary cards lainnya */}
          <Animatable.View
            animation="fadeInUp"
            duration={600}
            delay={180}
            style={[
              styles.summaryCardInteractive,
              {backgroundColor: '#9B59B6'},
            ]}>
            <TouchableOpacity>
              <Icon name="map-outline" size={32} color="#fff" />
              <Text style={styles.summaryLabel}>Site</Text>
              <Text style={styles.summaryValue}>
                {loadingSummary ? '-' : summary.siteTotal}
              </Text>
            </TouchableOpacity>
          </Animatable.View>
          <Animatable.View
            animation="fadeInUp"
            duration={600}
            delay={200}
            style={[
              styles.summaryCardInteractive,
              {backgroundColor: '#27AE60'},
            ]}>
            <TouchableOpacity>
              <Icon name="layers-outline" size={32} color="#fff" />
              <Text style={styles.summaryLabel}>Class Unit</Text>
              <Text style={styles.summaryValue}>
                {loadingSummary ? '-' : summary.classTotal}
              </Text>
            </TouchableOpacity>
          </Animatable.View>
          <Animatable.View
            animation="fadeInUp"
            duration={600}
            delay={220}
            style={[
              styles.summaryCardInteractive,
              {backgroundColor: '#2980B9'},
            ]}>
            <TouchableOpacity>
              <Icon name="grid-outline" size={32} color="#fff" />
              <Text style={styles.summaryLabel}>Type Unit</Text>
              <Text style={styles.summaryValue}>
                {loadingSummary ? '-' : summary.typeTotal}
              </Text>
            </TouchableOpacity>
          </Animatable.View>
          <Animatable.View
            animation="fadeInUp"
            duration={600}
            delay={260}
            style={[
              styles.summaryCardInteractive,
              {backgroundColor: '#F39C12'},
            ]}>
            <TouchableOpacity>
              <Icon name="construct-outline" size={32} color="#fff" />
              <Text style={styles.summaryLabel}>Model Unit</Text>
              <Text style={styles.summaryValue}>
                {loadingSummary ? '-' : summary.modelTotal}
              </Text>
            </TouchableOpacity>
          </Animatable.View>
          <Animatable.View
            animation="fadeInUp"
            duration={600}
            delay={300}
            style={[
              styles.summaryCardInteractive,
              {backgroundColor: '#C0392B'},
            ]}>
            <TouchableOpacity>
              <Icon name="cube-outline" size={32} color="#fff" />
              <Text style={styles.summaryLabel}>Unit</Text>
              <Text style={styles.summaryValue}>
                {loadingSummary ? '-' : summary.unitTotal}
              </Text>
            </TouchableOpacity>
          </Animatable.View>
        </ScrollView>

        {/* SUBMENU UTAMA */}
        {selectedCategory && (
          <Animatable.View animation="fadeInRight" delay={100}>
            <FlatList
              data={selectedCategory.submenu}
              horizontal
              keyExtractor={(item, idx) =>
                item.id ? String(item.id) : `${item.label}-${idx}`
              }
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{
                paddingHorizontal: 8,
                paddingVertical: 10,
              }}
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

        {/* SUBSUBMENU (GRID) */}
        {selectedCategory &&
          selectedCategory.submenu.map((item, idx) =>
            activeSubmenu === item.label && item.subsubmenu ? (
              <React.Fragment key={item.id ? item.id : `${item.label}-${idx}`}>
                {renderSubsubmenu(item.subsubmenu)}
              </React.Fragment>
            ) : null,
          )}
      </ScrollView>

      {/* BOTTOM BAR, diberi padding bottom safe area */}
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
