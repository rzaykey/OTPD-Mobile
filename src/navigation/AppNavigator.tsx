import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {RootStackParamList} from './types';
import AuthLoadingScreen from '../screens/AuthLoadingScreen';
import LoginScreen from '../screens/LoginScreen';
import FullDashboard from '../screens/FullDashboard';
import AdminDashboard from '../screens/AdminDashboard';
import TrainerDashboard from '../screens/TrainerDashboard';
import Data from '../screens/mentoring/Data';
import TrainHours from '../screens/trainhours/TrainHours';
import EditDataMentoring from '../screens/mentoring/EditDataMentoring';
import AddDataMentoring from '../screens/mentoring/AddDataMentoring';
import DailyActivity from '../screens/daily/Daily';
import AddDailyActivity from '../screens/daily/AddDailyActivity';

const Stack = createNativeStackNavigator<RootStackParamList>();

const AppNavigator = () => (
  <Stack.Navigator
    initialRouteName="AuthLoading"
    screenOptions={{headerShown: false}}>
    <Stack.Screen name="AuthLoading" component={AuthLoadingScreen} />
    <Stack.Screen name="Login" component={LoginScreen} />
    <Stack.Screen name="FullDashboard" component={FullDashboard} />
    <Stack.Screen name="AdminDashboard" component={AdminDashboard} />
    <Stack.Screen name="TrainerDashboard" component={TrainerDashboard} />
    <Stack.Screen
      name="Data"
      component={Data}
      options={{title: 'Data Mentoring'}}
    />
    <Stack.Screen
      name="EditDataMentoring"
      component={EditDataMentoring}
      options={{title: 'Edit Data Mentoring'}}
    />
    <Stack.Screen
      name="AddDataMentoring"
      component={AddDataMentoring}
      options={{title: 'Add Data Mentoring'}}
    />
    <Stack.Screen name="DailyActivity" component={DailyActivity} />
    <Stack.Screen
      name="AddDailyActivity"
      component={AddDailyActivity}
      options={{title: 'Add Daily Activity'}}
    />
    <Stack.Screen name="TrainHours" component={TrainHours} />
  </Stack.Navigator>
);

export default AppNavigator;
