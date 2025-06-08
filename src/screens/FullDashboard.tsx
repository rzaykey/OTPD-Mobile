import React, {useEffect, useState} from 'react';
import {
  SafeAreaView,
  Text,
  TouchableOpacity,
  View,
  ScrollView,
  FlatList,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {RootStackParamList} from '../navigation/types';
import Icon from 'react-native-vector-icons/Ionicons';
import * as Animatable from 'react-native-animatable';
import {dashboardStyles as styles} from '../styles/dashboardStyles';

type Props = NativeStackScreenProps<RootStackParamList, 'FullDashboard'>;

type SubmenuItem = {
  label: string;
  screen: keyof RootStackParamList;
};

const categories = [
  {
    id: '1',
    title: 'Mentoring',
    items: ['Data', 'Tambah Mentoring'],
  },
  {
    id: '2',
    title: 'Trainer',
    items: ['Daily Activity', 'Train Hours'],
  },
];

// Submenu data terpisah
const mentoringSubmenuItems: SubmenuItem[] = [
  {label: 'Form Digger', screen: 'AddDataMentoring'},
  {label: 'Form Hauler', screen: 'AddDataMentoring'},
  {label: 'Form Bulldozer', screen: 'AddDataMentoring'},
  {label: 'Form Grader', screen: 'AddDataMentoring'},
];

const dailySubmenuItems: SubmenuItem[] = [
  {label: 'Index Daily', screen: 'DailyActivity'},
  {label: 'Tambah Daily', screen: 'AddDailyActivity'},
];

const trainHoursSubmenuItems: SubmenuItem[] = [
  {label: 'Train Hours', screen: 'TrainHours'},
  {label: 'Tambah Train Hours', screen: 'AddTrainHours'},
];

const FullDashboard = ({navigation}: Props) => {
  const [user, setUser] = useState<any>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    null,
  );
  // Hanya satu submenu aktif sekaligus: 'mentoring' | 'daily' | null
  const [activeSubmenu, setActiveSubmenu] = useState<
    'mentoring' | 'daily' | 'train' | null
  >(null);

  useEffect(() => {
    const fetchUser = async () => {
      const userString = await AsyncStorage.getItem('userData');
      if (userString) {
        setUser(JSON.parse(userString));
      }
    };
    fetchUser();
  }, []);

  const handleLogout = async () => {
    await AsyncStorage.multiRemove(['userToken', 'userRole', 'userData']);
    navigation.replace('Login');
  };

  const handleCategoryPress = (categoryId: string) => {
    setSelectedCategoryId(prev => (prev === categoryId ? null : categoryId));
    // Reset submenu ketika ganti kategori
    setActiveSubmenu(null);
  };

  const selectedCategory = categories.find(
    cat => cat.id === selectedCategoryId,
  );

  const handleItemPress = (item: string) => {
    if (item === 'Tambah Mentoring') {
      setActiveSubmenu(prev => (prev === 'mentoring' ? null : 'mentoring'));
    } else if (item === 'Daily Activity') {
      setActiveSubmenu(prev => (prev === 'daily' ? null : 'daily'));
    } else if (item === 'Train Hours') {
      setActiveSubmenu(prev => (prev === 'train' ? null : 'train'));
    } else {
      setActiveSubmenu(null);
      // Mapping screen name secara dinamis
      const screenName = item.replace(/\s+/g, '') as keyof RootStackParamList;
      navigation.navigate(screenName);
    }
  };

  // Render submenu items secara reusable dengan callback onPressItem opsional
  const renderSubmenu = (
    items: SubmenuItem[],
    onPressItem?: (item: SubmenuItem) => void,
  ) => (
    <Animatable.View
      animation="fadeInUp"
      duration={400}
      style={{overflow: 'hidden'}}>
      <FlatList
        data={items}
        keyExtractor={item => item.label}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.itemList}
        renderItem={({item}) => (
          <TouchableOpacity
            onPress={() => {
              if (onPressItem) onPressItem(item);
              else navigation.navigate(item.screen);
            }}
            style={styles.itemCard}>
            <Text style={styles.itemText}>{item.label}</Text>
          </TouchableOpacity>
        )}
      />
    </Animatable.View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Header */}
        <Animatable.View
          animation="fadeInDown"
          delay={100}
          style={styles.headerCard}>
          <Text style={styles.headerText}>
            <Icon name="person-circle-outline" size={22} color="#fff" /> Selamat
            datang, Full User!
          </Text>

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

        {/* Categories */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Kategori</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {categories.map(category => (
              <TouchableOpacity
                key={category.id}
                style={[
                  styles.categoryItem,
                  selectedCategoryId === category.id &&
                    styles.categoryItemSelected,
                ]}
                onPress={() => handleCategoryPress(category.id)}>
                <Icon
                  name="albums-outline"
                  size={18}
                  color={
                    selectedCategoryId === category.id ? '#fff' : '#1E90FF'
                  }
                />
                <Text
                  style={[
                    styles.categoryText,
                    selectedCategoryId === category.id &&
                      styles.categoryTextSelected,
                  ]}>
                  {category.title}
                </Text>
                <Icon
                  name={
                    selectedCategoryId === category.id
                      ? 'chevron-up'
                      : 'chevron-down'
                  }
                  size={18}
                  color={
                    selectedCategoryId === category.id ? '#fff' : '#1E90FF'
                  }
                  style={{marginLeft: 5}}
                />
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Submenu Items */}
        {selectedCategory && selectedCategory.items.length > 0 && (
          <Animatable.View animation="fadeInUp" delay={100}>
            <FlatList
              data={selectedCategory.items}
              keyExtractor={(item, index) => `${item}-${index}`}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.itemList}
              renderItem={({item}) => (
                <TouchableOpacity
                  onPress={() => handleItemPress(item)}
                  style={styles.itemCard}>
                  <Text style={styles.itemText}>{item}</Text>
                </TouchableOpacity>
              )}
            />
          </Animatable.View>
        )}

        {/* Mentoring submenu dengan param unitType */}
        {activeSubmenu === 'mentoring' &&
          renderSubmenu(mentoringSubmenuItems, item => {
            const unitType = item.label.replace('Form ', '').toUpperCase();
            navigation.navigate('AddDataMentoring', {data: {unitType}});
          })}

        {/* Daily submenu */}
        {activeSubmenu === 'daily' && renderSubmenu(dailySubmenuItems)}

        {/* Train Hours submenu */}
        {activeSubmenu === 'train' && renderSubmenu(trainHoursSubmenuItems)}

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Icon name="log-out-outline" size={18} color="#fff" />
          <Text style={styles.logoutText}> Logout</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

export default FullDashboard;
