// theme.js

export const lightTheme = {
  colors: {
    primary: "#5E9EA0",
    primaryDark: "#457B7D",
    secondary: "#F5A623",

    background: "#F3F4F6", // lys grå, ikke helt hvit
    surface: "#FFFFFF",    // kort/bokser hvite i lys modus
    surfaceAlt: "#F8FAFC",

    text: {
      primary: "#111827",   // mørkere tekst (viktig!)
      secondary: "#6B7280",
      light: "#FFFFFF",
      error: "#E74C3C",
    },

    status: {
      success: "#27AE60",
      danger: "#E74C3C",
      warning: "#F39C12",
      info: "#3498DB",
    },

    border: "#E5E7EB",
  },

  spacing: { xs: 4, s: 8, m: 16, l: 24, xl: 32, xxl: 48 },

  borderRadius: { s: 4, m: 8, l: 16, xl: 24, round: 9999 },

  typography: {
    h1: { fontSize: 28, fontWeight: "700", color: "#111827" },
    h2: { fontSize: 22, fontWeight: "600", color: "#111827" },
    h3: { fontSize: 18, fontWeight: "600", color: "#111827" },
    body: { fontSize: 16, lineHeight: 24, color: "#111827" },
    small: { fontSize: 14, color: "#6B7280" },
    button: { fontSize: 16, fontWeight: "600", color: "#FFFFFF" },
  },

  shadows: {
    small: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.08,
      shadowRadius: 2,
      elevation: 2,
    },
    medium: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.12,
      shadowRadius: 6,
      elevation: 4,
    },
  },
};

export const darkTheme = {
  ...lightTheme,
  colors: {
    ...lightTheme.colors,

    background: "#0F1115",
    surface: "#1A1D23",
    surfaceAlt: "#222632",

    text: {
      ...lightTheme.colors.text,
      primary: "#E6E8EC",
      secondary: "#A0A6B1",
      light: "#0F1115",
    },

    border: "#2A2F3A",

    primary: "#7BC7C9",
    primaryDark: "#5BA6A8",
  },

  typography: {
    ...lightTheme.typography,
    h1: { ...lightTheme.typography.h1, color: "#E6E8EC" },
    h2: { ...lightTheme.typography.h2, color: "#E6E8EC" },
    h3: { ...lightTheme.typography.h3, color: "#E6E8EC" },
    body: { ...lightTheme.typography.body, color: "#E6E8EC" },
    small: { ...lightTheme.typography.small, color: "#A0A6B1" },
  },

  shadows: {
    small: {
      ...lightTheme.shadows.small,
      shadowOpacity: 0.3,
    },
    medium: {
      ...lightTheme.shadows.medium,
      shadowOpacity: 0.4,
    },
  },
};

// ✅ viktig: default = light (så gamle imports ikke blir “tvunget dark”)
export const theme = lightTheme;

export function getTheme(mode = "light") {
  return mode === "dark" ? darkTheme : lightTheme;
}
