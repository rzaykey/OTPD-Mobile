// src/screens/TrainHours.tsx
import React from 'react';
import {SafeAreaView, Text, StyleSheet} from 'react-native';

const TrainHours = () => (
  <SafeAreaView style={styles.container}>
    <Text style={styles.title}>Train Hours Screen</Text>
  </SafeAreaView>
);

const styles = StyleSheet.create({
  container: {flex: 1, justifyContent: 'center', alignItems: 'center'},
  title: {fontSize: 24, fontWeight: 'bold'},
});

export default TrainHours;
