// src/screens/AuthLoadingScreen.tsx
import React, {useEffect} from 'react';
import {ActivityIndicator, View, StyleSheet} from 'react-native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {RootStackParamList} from '../navigation/types';
import AsyncStorage from '@react-native-async-storage/async-storage';

type Props = NativeStackScreenProps<RootStackParamList, 'AuthLoading'>;

const AuthLoadingScreen = ({navigation}: Props) => {
  useEffect(() => {
    const checkAuth = async () => {
      const token = await AsyncStorage.getItem('userToken');
      const role = await AsyncStorage.getItem('userRole');

      if (token && role) {
        switch (role) {
          case 'Full':
            navigation.replace('FullDashboard');
            break;
          case 'Admin':
            navigation.replace('AdminDashboard');
            break;
          case 'Trainer':
            navigation.replace('TrainerDashboard');
            break;
          default:
            navigation.replace('Login');
        }
      } else {
        navigation.replace('Login');
      }
    };

    checkAuth();
  }, [navigation]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#1E90FF" />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, justifyContent: 'center', alignItems: 'center'},
});

export default AuthLoadingScreen;
