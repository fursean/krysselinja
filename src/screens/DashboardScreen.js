// screens/DashboardScreen.js
import React, { useEffect, useState, useLayoutEffect, useMemo } from "react";
import { View, FlatList, TouchableOpacity, StyleSheet, Alert, Image } from "react-native";
import { useAuth } from "../store/AuthContext";
import { db } from "../services/firebase";
import { collection, getDocs, query, where } from "firebase/firestore";

import ThemeToggleButton from "../components/ThemeToggleButton";
import { useTheme } from "../store/ThemeContext";

// UI Components
import ScreenContainer from "../components/ScreenContainer";
import Card from "../components/Card";
import Loading from "../components/Loading";
import EmptyState from "../components/EmptyState";
import { Heading2, Heading3, Caption, Body } from "../components/Typography";

export default function DashboardScreen({ navigation }) {
  const { user, profile, logout } = useAuth();
  const [children, setChildren] = useState([]);
  const [loading, setLoading] = useState(true);

  const isStaff = profile?.role === "staff" || profile?.role === "admin";
  const isParentView = !isStaff;

  const { theme } = useTheme();

  const styles = useMemo(() => makeStyles(theme), [theme]);

  const getStatusColor = (status) => {
    switch ((status || "").toLowerCase()) {
      case "levert":
        return theme.colors.status.success;
      case "hentet":
      case "syk":
        return theme.colors.status.danger;
      case "ferie":
        return theme.colors.status.warning;
      default:
        return theme.colors.text.secondary;
    }
  };

  const handleLogout = async () => {
    try {
      if (logout) await logout();
      navigation.reset({ index: 0, routes: [{ name: "Login" }] });
    } catch (err) {
      console.warn("Feil ved utlogging", err);
      Alert.alert("Feil", "Kunne ikke logge ut. Prøv igjen.");
    }
  };

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <ThemeToggleButton style={{ marginRight: theme.spacing.s }} />

          {profile?.role === "admin" && (
            <TouchableOpacity
              onPress={() => navigation.navigate("Admin")}
              style={{ marginRight: theme.spacing.s, padding: theme.spacing.xs }}
              accessibilityRole="button"
              accessibilityLabel="Admin"
              accessibilityHint="Åpner admin-siden"
            >
              <Caption style={{ color: theme.colors.primary, fontWeight: "600" }}>
                Admin
              </Caption>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            onPress={handleLogout}
            style={styles.logoutButton}
            accessibilityRole="button"
            accessibilityLabel="Logg ut"
            accessibilityHint="Logger deg ut"
          >
            <Caption style={{ color: theme.colors.primary, fontWeight: "600" }}>
              Logg ut
            </Caption>
          </TouchableOpacity>
        </View>
      ),

      headerTitle: () => (
        <Image
          source={require("../../assets/krysselista-logo.png")}
          style={styles.headerLogo}
          resizeMode="contain"
        />
      ),

      headerTitleAlign: "left",
      headerStyle: { backgroundColor: theme.colors.surface },
      headerTintColor: theme.colors.text.primary,
    });
  }, [navigation, profile?.role, theme, styles, handleLogout]);

  useEffect(() => {
    const fetchChildren = async () => {
      if (!user) return;

      setLoading(true);
      try {
        const childrenRef = collection(db, "children");
        const q = isStaff
          ? childrenRef
          : query(childrenRef, where("parentIds", "array-contains", user.uid));

        const snap = await getDocs(q);
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setChildren(list);
      } catch (err) {
        console.warn("Feil ved henting av barn", err);
        Alert.alert("Feil", "Kunne ikke hente barnelista.");
      } finally {
        setLoading(false);
      }
    };

    fetchChildren();
  }, [user, isStaff]);

  const renderChildItem = ({ item }) => (
    <Card
      onPress={() => navigation.navigate("ChildProfile", { child: item })}
      style={styles.cardSpacing}
      accessible
      accessibilityRole="button"
      accessibilityLabel={`${item.name}, Status: ${item.status || "Ukjent"}, Avdeling: ${item.group}`}
      accessibilityHint="Dobbelttrykk for å se profil"
    >
      <View style={styles.row}>
        <Heading3>{item.name}</Heading3>
        <Body style={{ color: getStatusColor(item.status), fontWeight: "600" }}>
          {(item.status || "").toUpperCase()}
        </Body>
      </View>
      <Caption>Avdeling: {item.group}</Caption>
    </Card>
  );

  const groups = Array.from(new Set(children.map((c) => c.group))).sort();

  const renderGroupItem = ({ item }) => (
    <Card
      onPress={() => navigation.navigate("GroupChildren", { group: item })}
      style={styles.cardSpacing}
    >
      <View style={styles.row}>
        <Heading3>{item}</Heading3>
      </View>
      <Caption>Trykk for å se barna i avdelingen</Caption>
    </Card>
  );

  if (loading) {
    return (
      <ScreenContainer centered>
        <Loading />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <Heading2 style={styles.heading}>
        {isParentView ? "Velg barn" : "Velg avdeling"}
      </Heading2>

      {isParentView ? (
        children.length === 0 ? (
          <EmptyState
            title="Ingen barn å vise"
            message="Det ser ikke ut til at du har noen barn registrert ennå."
          />
        ) : (
          <FlatList
            data={children}
            keyExtractor={(item) => item.id}
            renderItem={renderChildItem}
            contentContainerStyle={styles.listContent}
          />
        )
      ) : groups.length === 0 ? (
        <EmptyState
          title="Ingen avdelinger"
          message="Fant ingen avdelinger med registrerte barn."
        />
      ) : (
        <FlatList
          data={groups}
          keyExtractor={(item) => item}
          renderItem={renderGroupItem}
          contentContainerStyle={styles.listContent}
        />
      )}
    </ScreenContainer>
  );
}

function makeStyles(theme) {
  return StyleSheet.create({
    heading: {
      marginBottom: theme.spacing.m,
      color: theme.colors.text.primary,
    },
    listContent: {
      paddingBottom: theme.spacing.xl,
    },
    cardSpacing: {
      marginBottom: theme.spacing.m,
    },
    row: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: theme.spacing.xs,
    },
    logoutButton: {
      marginRight: theme.spacing.s,
      padding: theme.spacing.xs,
    },
    headerLogo: {
      width: 140,
      height: 40,
      marginLeft: -16,
    },
  });
}
