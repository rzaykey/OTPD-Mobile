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

const FullDashboard = ({navigation}: Props) => {
  const [user, setUser] = useState<any>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    null,
  );
  const [showMentoringForms, setShowMentoringForms] = useState(false);

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
  };

  const selectedCategory = categories.find(
    cat => cat.id === selectedCategoryId,
  );

  const handleItemPress = (item: string) => {
    if (item === 'Tambah Mentoring') {
      setShowMentoringForms(prev => !prev);
    } else if (item.startsWith('Form')) {
      // Ambil unitType dari nama tombol (misalnya: "Form Grader" -> "grader")
      const unitType = item.replace('Form ', '').toUpperCase();
      navigation.navigate('AddDataMentoring', {
        data: {unitType},
      });
    } else {
      const screenName = item.replace(/\s+/g, '') as keyof RootStackParamList;
      navigation.navigate(screenName);
    }
  };

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
        {selectedCategory?.title === 'Mentoring' && (
          <Animatable.View
            animation={showMentoringForms ? 'fadeInUp' : 'fadeOutDown'}
            duration={400}
            style={{overflow: 'hidden'}}>
            {showMentoringForms && (
              <FlatList
                data={[
                  'Form Digger',
                  'Form Hauler',
                  'Form Bulldozer',
                  'Form Grader',
                ]}
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
            )}
          </Animatable.View>
        )}

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
