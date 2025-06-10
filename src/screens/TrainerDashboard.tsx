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
if (!(global as any)._IS_NEW_ARCHITECTURE_ENABLED) {
  UIManager.setLayoutAnimationEnabledExperimental &&
    UIManager.setLayoutAnimationEnabledExperimental(true);
}
// Enable LayoutAnimation (Android only)

type Props = NativeStackScreenProps<RootStackParamList, 'FullDashboard'>;

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
          {
            label: 'Form Digger',
            icon: 'cog',
            screen: 'AddDataMentoring',
          },
          {
            label: 'Form Hauler',
            icon: 'cog',
            screen: 'AddDataMentoring',
          },
          {
            label: 'Form Bulldozer',
            icon: 'cog',
            screen: 'AddDataMentoring',
          },
          {
            label: 'Form Grader',
            icon: 'cog',
            screen: 'AddDataMentoring',
          },
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

const TrainerDashboard = ({navigation}: Props) => {
  const [user, setUser] = useState<any>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState('1');
  const [activeSubmenu, setActiveSubmenu] = useState<string | null>(null);

  const [summary, setSummary] = useState({
    mentoringToday: 0,
    dailyToday: 0,
    trainHoursToday: 0,
    unitTotal: 0,
    typeTotal: 0,
    modelTotal: 0,
    classTotal: 0,
    siteTotal: 0,
    // jika mau: mentoringAll, dsb
  });
  const [loadingSummary, setLoadingSummary] = useState(true);

  useEffect(() => {
    fetchSummary();
  }, []);

  const fetchSummary = async () => {
    try {
      setLoadingSummary(true);
      const res = await fetch('http://10.0.2.2:8000/api/dashboard');
      const json = await res.json();
      setSummary(json.data); // json.data: { mentoringToday, dailyToday, trainHoursToday }
    } catch (err) {
      // handle error (alert, dsb)
      setSummary({mentoringToday: 0, dailyToday: 0, trainHoursToday: 0});
    } finally {
      setLoadingSummary(false);
    }
  };

  useEffect(() => {
    const fetchUser = async () => {
      const userString = await AsyncStorage.getItem('userData');
      if (userString) setUser(JSON.parse(userString));
    };
    fetchUser();
  }, []);

  // Logout
  const handleLogout = async () => {
    await AsyncStorage.multiRemove(['userToken', 'userRole', 'userData']);
    navigation.replace('Login');
  };

  // Category (bottom menu) press
  const handleCategoryPress = (categoryId: string) => {
    setSelectedCategoryId(prev => (prev === categoryId ? null : categoryId));
    setActiveSubmenu(null);
  };

  // Submenu press
  const handleSubmenuPress = (item: any) => {
    if (item.subsubmenu) {
      setActiveSubmenu(prev => (prev === item.label ? null : item.label));
    } else if (item.screen) {
      setActiveSubmenu(null);
      navigation.navigate(item.screen);
    }
  };

  // Subsubmenu press
  const handleSubsubmenuPress = (item: any) => {
    if (item.screen === 'AddDataMentoring') {
      // Pass unitType for AddDataMentoring
      const unitType = item.label.replace('Form ', '').toUpperCase();
      navigation.navigate(item.screen, {data: {unitType}});
    } else {
      navigation.navigate(item.screen);
    }
  };

  const selectedCategory = categories.find(
    cat => cat.id === selectedCategoryId,
  );

  // Render Subsubmenu as Grid
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
            key={item.id ? item.id : `${item.label}-${idx}`} // <-- lebih aman
            style={[
              styles.subGridCard,
              {width: '47%'}, // 2 kolom responsif
            ]}
            activeOpacity={0.8}
            onPress={() => handleSubsubmenuPress(item)}>
            <Icon name={item.icon} size={34} color="#1E90FF" />
            <Text style={styles.subGridText}>{item.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </Animatable.View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={[styles.scroll, {paddingBottom: 90}]}>
        {/* HEADER */}
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
        <Animatable.View
          animation="fadeInDown"
          delay={70}
          style={styles.headerCard}>
          <Text style={styles.headerText}>
            <Icon name="person-circle-outline" size={22} color="#fff" /> Selamat
            datang, {user.role}!
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
              } // <-- aman
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

      {/* BOTTOM BAR */}
      <View style={styles.bottomMenuBar}>
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

export default TrainerDashboard;
