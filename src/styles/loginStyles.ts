// src/styles/loginStyles.ts
import {StyleSheet} from 'react-native';

export const loginStyles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 40, // Atur sesuai kebutuhan
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 180, // Sedikit dikurangi dari 200 agar lebih proporsional
    marginBottom: 10,
    marginTop: 100,
  },
  logo: {
    width: '70%',
    height: '100%',
    resizeMode: 'contain',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 24,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
    backgroundColor: '#fff', // supaya teks input terlihat di background gradasi
  },
  button: {
    backgroundColor: '#1E90FF',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  buttonDisabled: {
    backgroundColor: '#87b8ff',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
