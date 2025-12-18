import React from "react";
import { Text } from "react-native";
import { useTheme } from "../store/ThemeContext";

export const Heading1 = ({ children, style, ...props }) => {
  const { theme } = useTheme();
  return (
    <Text
      style={[
        {
          fontSize: theme.typography.h1.fontSize,
          fontWeight: theme.typography.h1.fontWeight,
          color: theme.colors.text.primary,
          marginBottom: theme.spacing.s,
        },
        style,
      ]}
      {...props}
    >
      {children}
    </Text>
  );
};

export const Heading2 = ({ children, style, ...props }) => {
  const { theme } = useTheme();
  return (
    <Text
      style={[
        {
          fontSize: theme.typography.h2.fontSize,
          fontWeight: theme.typography.h2.fontWeight,
          color: theme.colors.text.primary,
          marginBottom: theme.spacing.s,
        },
        style,
      ]}
      {...props}
    >
      {children}
    </Text>
  );
};

export const Heading3 = ({ children, style, ...props }) => {
  const { theme } = useTheme();
  return (
    <Text
      style={[
        {
          fontSize: theme.typography.h3.fontSize,
          fontWeight: theme.typography.h3.fontWeight,
          color: theme.colors.text.primary,
          marginBottom: theme.spacing.xs,
        },
        style,
      ]}
      {...props}
    >
      {children}
    </Text>
  );
};

export const Body = ({ children, style, ...props }) => {
  const { theme } = useTheme();
  return (
    <Text
      style={[
        {
          fontSize: theme.typography.body.fontSize,
          lineHeight: theme.typography.body.lineHeight,
          color: theme.colors.text.primary,
        },
        style,
      ]}
      {...props}
    >
      {children}
    </Text>
  );
};

export const Caption = ({ children, style, ...props }) => {
  const { theme } = useTheme();
  return (
    <Text
      style={[
        {
          fontSize: theme.typography.small.fontSize,
          color: theme.colors.text.secondary,
        },
        style,
      ]}
      {...props}
    >
      {children}
    </Text>
  );
};
