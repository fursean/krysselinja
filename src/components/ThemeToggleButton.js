import React from "react";
import { TouchableOpacity } from "react-native";
import { Caption } from "./Typography";
import { useTheme } from "../store/ThemeContext";

export default function ThemeToggleButton({ style }) {
  const { isDark, toggleTheme, theme } = useTheme();

  return (
    <TouchableOpacity
      onPress={toggleTheme}
      style={[{ paddingHorizontal: 10, paddingVertical: 6 }, style]}
      accessibilityRole="button"
      accessibilityLabel="Bytt tema"
      accessibilityHint="Slår av/på mørk modus"
    >
      <Caption style={{ color: theme.colors.primary, fontWeight: "700" }}>
        {isDark ? "☀️" : "🌙"}
      </Caption>
    </TouchableOpacity>
  );
}
