// src/screens/LoginScreen.tsx
import React, {useState} from 'react';
import {
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {RootStackParamList} from '../navigation/types';
import {loginStyles as styles} from '../styles/loginStyles';
import LinearGradient from 'react-native-linear-gradient'; // ← Tambahkan ini

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

const roleBasedDashboardName = (role: string) => {
  switch (role) {
    case 'Full':
      return 'FullDashboard';
    case 'Admin':
      return 'AdminDashboard';
    case 'Trainer':
      return 'TrainerDashboard';
    default:
      return 'Login';
  }
};

const LoginScreen = ({navigation}: Props) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!username || !password) {
      Alert.alert('Error', 'Username dan Password wajib diisi');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('http://10.0.2.2:8000/api/login', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({username, password}),
      });

      const data = await response.json();
      const token = data.access_token;
      const user = data.user;

      if (token && user) {
        await AsyncStorage.setItem('userToken', token);
        await AsyncStorage.setItem('userRole', user.role);
        await AsyncStorage.setItem('userData', JSON.stringify(user));

        navigation.replace(roleBasedDashboardName(user.role));
      } else {
        Alert.alert('Login gagal', data.message || 'Cek username & password');
      }
    } catch (error) {
      console.error('Login Error:', error);
      Alert.alert('Error', 'Tidak dapat terhubung ke server');
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={['#FFD700', '#1E90FF']}
      start={{x: 0, y: 0}}
      end={{x: 1, y: 0}}
      style={styles.container}>
      <View style={styles.logoContainer}>
        <Image
          source={require('../assets/images/logo.jpg')}
          style={styles.logo}
          resizeMode="contain"
        />
      </View>

      <Text style={styles.title}>OTPD Apps - Login</Text>

      <TextInput
        style={styles.input}
        placeholder="Username"
        autoCapitalize="none"
        value={username}
        onChangeText={setUsername}
      />

      <TextInput
        style={styles.input}
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleLogin}
        disabled={loading}>
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Masuk</Text>
        )}
      </TouchableOpacity>
    </LinearGradient>
  );
};

export default LoginScreen;
