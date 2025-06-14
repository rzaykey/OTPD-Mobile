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
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {RootStackParamList} from '../navigation/types';
import {loginStyles as styles} from '../styles/loginStyles';
import LinearGradient from 'react-native-linear-gradient';
import API_BASE_URL from '../config';
import {useSafeAreaInsets} from 'react-native-safe-area-context'; // Untuk safe area bawah
import NetInfo from '@react-native-community/netinfo';
import {useEffect} from 'react';

// Tipe props navigation (stack)
type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

// Helper untuk redirect sesuai role user yang diterima dari backend
const roleBasedDashboardName = (role: string) => {
  // Pastikan case-insensitive
  switch ((role || '').toLowerCase()) {
    case 'full':
      return 'FullDashboard';
    case 'admin':
      return 'AdminDashboard';
    case 'trainer':
      return 'TrainerDashboard';
    default:
      return 'Login';
  }
};

const LoginScreen = ({navigation}: Props) => {
  // State input dan UI
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [focus, setFocus] = useState({user: false, pass: false});
  const [errors, setErrors] = useState({user: '', pass: ''});

  // Safe area bottom (agar konten login tidak ketutup navigation gesture)
  const insets = useSafeAreaInsets();

  // Handler untuk proses login ke backend
  const handleLogin = async () => {
    // Validasi form sederhana
    let errUser = !username ? 'Username wajib diisi' : '';
    let errPass = !password ? 'Password wajib diisi' : '';
    setErrors({user: errUser, pass: errPass});
    if (errUser || errPass) return;

    setLoading(true);
    const payload = {
      username: username.trim(),
      password: password.trim(),
    };
    // Debug payload (hapus di produksi)

    try {
      // Kirim ke API backend
      const response = await fetch(`${API_BASE_URL}/login`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      // Debug response (hapus di produksi)

      const token = data.access_token;
      const user = data.user;

      if (token && user) {
        // Simpan ke local storage
        await AsyncStorage.setItem('userToken', token);
        await AsyncStorage.setItem('userRole', user.role);
        await AsyncStorage.setItem('userData', JSON.stringify(user));

        // Redirect sesuai role user
        navigation.replace(roleBasedDashboardName(user.role));
      } else {
        // Jika login gagal (token/user tidak ada)
        Alert.alert('Login gagal', data.message || 'Cek username & password');
      }
    } catch (error) {
      // Jika server tidak bisa diakses
      Alert.alert('Error', 'Tidak dapat terhubung ke server');
    } finally {
      setLoading(false);
    }
  };
  const [isConnected, setIsConnected] = useState(true);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsConnected(state.isConnected === true);
    });

    // Initial fetch (untuk memastikan status awal)
    NetInfo.fetch().then(state => setIsConnected(state.isConnected === true));

    return () => unsubscribe();
  }, []);

  // Render UI
  return (
    // Gunakan LinearGradient untuk background, dan paddingBottom dari safe area
    <LinearGradient
      colors={['#FFD700', '#1E90FF']}
      start={{x: 0, y: 0}}
      end={{x: 1, y: 0}}
      style={[styles.container, {paddingBottom: insets.bottom}]}
      // paddingBottom agar form tidak kepotong navigation bar
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{flex: 1}}
        keyboardVerticalOffset={20}>
        {/* Indikator Jaringan */}
        <View style={styles.statusWrapper}>
          <Text
            style={[
              styles.statusLabel,
              isConnected ? styles.statusOnline : styles.statusOffline,
            ]}>
            {isConnected ? '🟢 Online' : '🔴 Offline'}
          </Text>
        </View>

        {/* Logo aplikasi */}
        <View style={styles.logoContainer}>
          <Image
            source={require('../assets/images/logo.jpg')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        {/* Judul aplikasi */}
        <Text style={styles.title}>OTPD Apps - Login</Text>

        {/* Input Username */}
        <View
          style={[
            styles.inputWrapper,
            focus.user && styles.inputFocus,
            errors.user ? styles.inputError : null,
          ]}>
          <TextInput
            style={styles.input}
            placeholder="Username"
            autoCapitalize="none"
            value={username}
            onFocus={() => setFocus(f => ({...f, user: true}))}
            onBlur={() => setFocus(f => ({...f, user: false}))}
            onChangeText={text => {
              setUsername(text);
              if (text) setErrors(e => ({...e, user: ''}));
            }}
            returnKeyType="next"
          />
        </View>
        {errors.user ? (
          <Text style={styles.errorText}>{errors.user}</Text>
        ) : null}

        {/* Input Password */}
        <View
          style={[
            styles.inputWrapper,
            focus.pass && styles.inputFocus,
            errors.pass ? styles.inputError : null,
          ]}>
          <TextInput
            style={styles.input}
            placeholder="Password"
            secureTextEntry={!showPassword}
            value={password}
            autoCapitalize="none"
            onFocus={() => setFocus(f => ({...f, pass: true}))}
            onBlur={() => setFocus(f => ({...f, pass: false}))}
            onChangeText={text => {
              setPassword(text);
              if (text) setErrors(e => ({...e, pass: ''}));
            }}
            returnKeyType="done"
          />
          {/* Tombol toggle show/hide password */}
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => setShowPassword(v => !v)}>
            <Text style={{color: '#888', fontSize: 16}}>
              {showPassword ? '🙈' : '👁️'}
            </Text>
          </TouchableOpacity>
        </View>
        {errors.pass ? (
          <Text style={styles.errorText}>{errors.pass}</Text>
        ) : null}

        {/* Tombol login */}
        <TouchableOpacity
          style={[
            styles.button,
            (loading || !username || !password) && styles.buttonDisabled,
          ]}
          onPress={handleLogin}
          disabled={loading || !username || !password}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Masuk</Text>
          )}
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
};

export default LoginScreen;
