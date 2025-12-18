import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { theme } from '../theme';
import { Body } from './Typography';

export default function Loading({ message, fullscreen = false }) {
  return (
    <View style={[styles.container, fullscreen && styles.fullscreen]}>
      <ActivityIndicator size="large" color={theme.colors.primary} />
      {message && <Body style={styles.text}>{message}</Body>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: theme.spacing.l,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullscreen: {
    flex: 1,
  },
  text: {
    marginTop: theme.spacing.m,
    color: theme.colors.text.secondary,
  },
});
