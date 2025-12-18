import React from 'react';
import { View, StyleSheet } from 'react-native';
import { theme } from '../theme';
import { Heading3, Body } from './Typography';
import Button from './Button';

export default function EmptyState({ 
  title = 'Ingen data', 
  message, 
  actionLabel, 
  onAction,
  style 
}) {
  return (
    <View style={[styles.container, style]}>
      <Heading3 style={styles.title}>{title}</Heading3>
      {message && <Body style={styles.message}>{message}</Body>}
      {actionLabel && onAction && (
        <Button 
          title={actionLabel} 
          onPress={onAction} 
          variant="outline"
          style={styles.button}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: theme.spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.l,
    marginVertical: theme.spacing.m,
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  title: {
    textAlign: 'center',
    marginBottom: theme.spacing.s,
    color: theme.colors.text.secondary,
  },
  message: {
    textAlign: 'center',
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.m,
  },
  button: {
    marginTop: theme.spacing.s,
  },
});
