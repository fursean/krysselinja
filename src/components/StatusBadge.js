import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Caption } from './Typography';
import { theme } from '../theme';

export default function StatusBadge({ status, timestamp, style }) {
  if (!status) return null;

  const getStatusColor = (s) => {
    switch (s?.toLowerCase()) {
      case 'levert': return theme.colors.status.success;
      case 'hentet': return theme.colors.status.danger;
      case 'syk': return theme.colors.status.danger;
      case 'ferie': return theme.colors.status.warning;
      default: return theme.colors.text.secondary;
    }
  };

  const color = getStatusColor(status);
  
  // Format timestamp if provided
  let timeStr = '';
  if (timestamp) {
    try {
      const date = typeof timestamp.toDate === 'function' ? timestamp.toDate() : new Date(timestamp);
      timeStr = date.toLocaleTimeString('nb-NO', {
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (e) {
      // ignore parsing error
    }
  }

  return (
    <View 
      style={[styles.container, { backgroundColor: color }, style]}
      accessible={true}
      accessibilityRole="text"
      accessibilityLabel={`Status: ${status}${timeStr ? `, tidspunkt ${timeStr}` : ''}`}
    >
      <Caption style={styles.text}>
        {status.toUpperCase()}{timeStr ? ` • ${timeStr}` : ''}
      </Caption>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: theme.spacing.s,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.round,
    alignSelf: 'flex-start',
  },
  text: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
  },
});
