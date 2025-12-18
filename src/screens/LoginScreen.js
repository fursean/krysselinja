import React, { useState, useLayoutEffect } from "react";
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Image,
  Alert,
  ScrollView,
} from "react-native";
import { useAuth } from "../store/AuthContext";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../services/firebase";
import logo from "../../assets/krysselista-logo.png";

// UI Components
import ScreenContainer from "../components/ScreenContainer";
import Button from "../components/Button";
import Input from "../components/Input";
import Loading from "../components/Loading";
import DismissKeyboard from "../components/DismissKeyboard";
import { Heading2, Body, Caption } from "../components/Typography";

// ✅ NY
import { useTheme } from "../store/ThemeContext";

export default function LoginScreen({ navigation }) {
  const { theme } = useTheme();
  const styles = createStyles(theme);

  const { login, loading: authLoading } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [error, setError] = useState("");

  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  const handleLogin = async () => {
    setError("");

    if (!email || !password) {
      setError("Vennligst fyll ut både e-post og passord.");
      return;
    }

    setSubmitting(true);
    try {
      await login(email.trim(), password);
      navigation.replace("Dashboard");
    } catch (err) {
      console.log(err);
      setError("Feil e-post eller passord");
    } finally {
      setSubmitting(false);
    }
  };

  const handleForgotPassword = async () => {
    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      Alert.alert("Glemt passord", "Skriv inn e-postadressen din først.");
      return;
    }

    try {
      setResetting(true);
      await sendPasswordResetEmail(auth, trimmedEmail);
      Alert.alert(
        "Glemt passord",
        "Hvis e-posten er registrert, har vi sendt en lenke for å tilbakestille passordet."
      );
    } catch (err) {
      console.log(err);
      Alert.alert(
        "Glemt passord",
        "Noe gikk galt. Sjekk at e-posten er riktig og prøv igjen."
      );
    } finally {
      setResetting(false);
    }
  };

  if (authLoading) {
    return (
      <ScreenContainer centered>
        <Loading message="Laster..." />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        <DismissKeyboard>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.inner}>
              <Image source={logo} style={styles.logo} resizeMode="contain" />

              <View style={styles.header}>
                <Heading2 style={styles.title}>Velkommen</Heading2>
                <Body style={styles.subtitle}>Logg inn for å fortsette</Body>
              </View>

              <Input
                label="E-post"
                placeholder="din@epost.no"
                autoCapitalize="none"
                keyboardType="email-address"
                value={email}
                onChangeText={setEmail}
                error={error ? " " : null}
              />

              <Input
                label="Passord"
                placeholder="Ditt passord"
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                value={password}
                onChangeText={setPassword}
              />

              {error ? <Caption style={styles.errorText}>{error}</Caption> : null}

              <View style={styles.buttonContainer}>
                <Button
                  title="Logg inn"
                  onPress={handleLogin}
                  loading={submitting || authLoading}
                  size="large"
                />
              </View>

              <Button
                title={resetting ? "Sender e-post…" : "Glemt passord?"}
                onPress={handleForgotPassword}
                variant="outline"
                disabled={resetting}
                style={styles.forgotButton}
                textStyle={styles.forgotText}
              />
            </View>
          </ScrollView>
        </DismissKeyboard>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const createStyles = (theme) =>
  StyleSheet.create({
    container: {
      padding: 0,
      flex: 1,
    },
    scrollContent: {
      flexGrow: 1,
      justifyContent: "center",
    },
    inner: {
      padding: theme.spacing.l,
      maxWidth: 500,
      width: "100%",
      alignSelf: "center",
    },
    logo: {
      width: "80%",
      height: 100,
      alignSelf: "center",
      marginBottom: theme.spacing.xl,
    },
    header: {
      marginBottom: theme.spacing.l,
      alignItems: "center",
    },
    title: {
      color: theme.colors.primary,
      marginBottom: theme.spacing.xs,
    },
    subtitle: {
      color: theme.colors.text.secondary,
    },
    errorText: {
      color: theme.colors.status.danger,
      textAlign: "center",
      marginBottom: theme.spacing.m,
    },
    buttonContainer: {
      marginTop: theme.spacing.s,
      marginBottom: theme.spacing.m,
    },
    forgotButton: {
      borderWidth: 0,
      marginTop: theme.spacing.s,
    },
    forgotText: {
      color: theme.colors.text.secondary,
      fontWeight: "400",
      textDecorationLine: "underline",
    },
  });
