import React from "react";
import { Pressable, View, StyleSheet } from "react-native";
import { useTheme } from "../store/ThemeContext";

export default function Card({ children, style, onPress, ...props }) {
  const { theme } = useTheme();

  const Container = onPress ? Pressable : View;

  return (
    <Container
      onPress={onPress}
      style={[
        styles.base,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
          shadowColor: theme.colors.text.primary, // funker ok i web også
        },
        style,
      ]}
      {...props}
    >
      {children}
    </Container>
  );
}

const styles = StyleSheet.create({
  base: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,

    // RN shadow (iOS)
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 8,

    // Android
    elevation: 3,
  },
});
