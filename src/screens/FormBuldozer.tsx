// src/screens/FormBuldozer.tsx
import React from 'react';
import {SafeAreaView, Text, StyleSheet} from 'react-native';

const FormBuldozer = () => (
  <SafeAreaView style={styles.container}>
    <Text style={styles.title}>Form Buldozer Screen</Text>
  </SafeAreaView>
);

const styles = StyleSheet.create({
  container: {flex: 1, justifyContent: 'center', alignItems: 'center'},
  title: {fontSize: 24, fontWeight: 'bold'},
});

export default FormBuldozer;
