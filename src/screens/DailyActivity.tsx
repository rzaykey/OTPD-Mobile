// src/screens/DailyActivity.tsx
import React from 'react';
import {SafeAreaView, Text, StyleSheet} from 'react-native';

const DailyActivity = () => (
  <SafeAreaView style={styles.container}>
    <Text style={styles.title}>Daily Activity Screen</Text>
  </SafeAreaView>
);

const styles = StyleSheet.create({
  container: {flex: 1, justifyContent: 'center', alignItems: 'center'},
  title: {fontSize: 24, fontWeight: 'bold'},
});

export default DailyActivity;
