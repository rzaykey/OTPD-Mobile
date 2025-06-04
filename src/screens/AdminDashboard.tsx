import React, {useEffect, useState} from 'react';
import {
  SafeAreaView,
  Text,
  TouchableOpacity,
  View,
  ScrollView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {RootStackParamList} from '../navigation/types';
import {dashboardStyles as styles} from '../styles/dashboardStyles';

type Props = NativeStackScreenProps<RootStackParamList, 'AdminDashboard'>;

const AdminDashboard = ({navigation}: Props) => {
  const [user, setUser] = useState<any>(null);

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

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.welcome}>👋 Selamat datang, Admin!</Text>

        {user && (
          <View style={styles.card}>
            <Text style={styles.name}>
              {user.name} ({user.username})
            </Text>
            <Text style={styles.role}>📛 Role: {user.role}</Text>
            <Text style={styles.info}>🏢 Perusahaan: {user.company}</Text>
            <Text style={styles.info}>📍 Site: {user.site}</Text>
            <Text style={styles.info}>✉️ Email: {user.email}</Text>
          </View>
        )}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>🚪 Logout</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

export default AdminDashboard;
