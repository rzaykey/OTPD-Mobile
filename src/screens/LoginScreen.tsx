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
import LinearGradient from 'react-native-linear-gradient';
import API_BASE_URL from '../config';
// OPTIONAL: gunakan icon jika sudah install
// import Icon from 'react-native-vector-icons/Feather';

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
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [focus, setFocus] = useState({user: false, pass: false});
  const [errors, setErrors] = useState({user: '', pass: ''});

  const handleLogin = async () => {
    let errUser = !username ? 'Username wajib diisi' : '';
    let errPass = !password ? 'Password wajib diisi' : '';
    setErrors({user: errUser, pass: errPass});
    if (errUser || errPass) return;

    setLoading(true);
    const payload = {
      username: username.trim(),
      password: password.trim(),
    };
    console.log('Payload yang dikirim ke backend:', payload);

    try {
      const response = await fetch(`${API_BASE_URL}/login`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      console.log('Login response:', data);
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

      {/* Username Input */}
      <View
        style={[
          styles.inputWrapper,
          focus.user && styles.inputFocus,
          errors.user ? styles.inputError : null,
        ]}>
        {/* <Icon name="user" size={20} color="#888" style={styles.inputIcon} /> */}
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
      {errors.user ? <Text style={styles.errorText}>{errors.user}</Text> : null}

      {/* Password Input */}
      <View
        style={[
          styles.inputWrapper,
          focus.pass && styles.inputFocus,
          errors.pass ? styles.inputError : null,
        ]}>
        {/* <Icon name="lock" size={20} color="#888" style={styles.inputIcon} /> */}
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
        <TouchableOpacity
          style={styles.iconBtn}
          onPress={() => setShowPassword(v => !v)}>
          {/* <Icon name={showPassword ? 'eye-off' : 'eye'} size={20} color="#888" /> */}
          <Text style={{color: '#888', fontSize: 16}}>
            {showPassword ? '🙈' : '👁️'}
          </Text>
        </TouchableOpacity>
      </View>
      {errors.pass ? <Text style={styles.errorText}>{errors.pass}</Text> : null}

      {/* Login Button */}
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
    </LinearGradient>
  );
};

export default LoginScreen;
