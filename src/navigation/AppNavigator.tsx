import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {RootStackParamList} from './types';
import AuthLoadingScreen from '../screens/AuthLoadingScreen';
import LoginScreen from '../screens/LoginScreen';
import FullDashboard from '../screens/FullDashboard';
import AdminDashboard from '../screens/AdminDashboard';
import TrainerDashboard from '../screens/TrainerDashboard';
import Data from '../screens/Data';
import FormDigger from '../screens/FormDigger';
import FormHauler from '../screens/FormHauler';
import FormBuldozer from '../screens/FormBuldozer';
import FormGrader from '../screens/FormGrader';
import DailyActivity from '../screens/DailyActivity';
import TrainHours from '../screens/TrainHours';
import EditDataMentoring from '../screens/EditDataMentoring';
import AddDataMentoring from '../screens/AddDataMentoring';

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
    <Stack.Screen name="FormDigger" component={FormDigger} />
    <Stack.Screen name="FormHauler" component={FormHauler} />
    <Stack.Screen name="FormBuldozer" component={FormBuldozer} />
    <Stack.Screen name="FormGrader" component={FormGrader} />
    <Stack.Screen name="DailyActivity" component={DailyActivity} />
    <Stack.Screen name="TrainHours" component={TrainHours} />
  </Stack.Navigator>
);

export default AppNavigator;
