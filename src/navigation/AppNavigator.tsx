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
import EditDailyActivity from '../screens/daily/EditDailyActivity';
import AddTrainHours from '../screens/trainhours/AddTrainHours';
import EditTrainHours from '../screens/trainhours/EditTrainHours';
import Mop from '../screens/mop/Mop';
import AddMop from '../screens/mop/AddMop';

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
    <Stack.Screen
      name="EditDailyActivity"
      component={EditDailyActivity}
      options={{title: 'Edit Daily Activity'}}
    />
    <Stack.Screen name="TrainHours" component={TrainHours} />
    <Stack.Screen
      name="AddTrainHours"
      component={AddTrainHours}
      options={{title: 'Add Train Hours'}}
    />
    <Stack.Screen
      name="EditTrainHours"
      component={EditTrainHours}
      options={{title: 'Edit Train Hours'}}
    />
    <Stack.Screen
      name="Mop"
      component={Mop}
      options={{title: 'Data Mine Operator Performance '}}
    />
    <Stack.Screen
      name="AddMop"
      component={AddMop}
      options={{title: 'Add MOP'}}
    />
  </Stack.Navigator>
);

export default AppNavigator;
