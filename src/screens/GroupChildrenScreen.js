// screens/GroupChildrenScreen.js
import React, { useEffect, useState, useLayoutEffect } from "react";
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  Image,
  Modal,
  Pressable,
} from "react-native";
import { db } from "../services/firebase";
import {
  collection,
  getDocs,
  query,
  where,
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
  arrayUnion,
} from "firebase/firestore";
import * as ImagePicker from "expo-image-picker";
import { useAuth } from "../store/AuthContext";

// UI Components
import ScreenContainer from "../components/ScreenContainer";
import Card from "../components/Card";
import Button from "../components/Button";
import Input from "../components/Input";
import Loading from "../components/Loading";
import EmptyState from "../components/EmptyState";
import StatusBadge from "../components/StatusBadge";
import { Heading2, Heading3, Body, Caption } from "../components/Typography";
import { useTheme } from "../store/ThemeContext";

export default function GroupChildrenScreen({ route, navigation }) {
  const { group } = route.params || {};
  const { logout } = useAuth();

  const { theme } = useTheme();
  const styles = createStyles(theme);

  const [children, setChildren] = useState([]);
  const [loadingChildren, setLoadingChildren] = useState(true);

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [dayNote, setDayNote] = useState("");
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [editingNote, setEditingNote] = useState(false);

  const [dayPhotos, setDayPhotos] = useState([]);
  const [uploadingDayPhoto, setUploadingDayPhoto] = useState(false);

  const [photoModalVisible, setPhotoModalVisible] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState(null);

  const defaultNote = "Kommer i løpet av dagen";

  // Hjelpefunksjon: lager ID av dato (YYYY-MM-DD)
  const dateIdFromDate = (date) => date.toISOString().slice(0, 10);

  // Sjekker om en dato er i dag
  const isToday = (date) => {
    const today = new Date();
    return (
      date.getFullYear() === today.getFullYear() &&
      date.getMonth() === today.getMonth() &&
      date.getDate() === today.getDate()
    );
  };

  // Vennlig dato-tekst på norsk
  const formatDateLabel = (date) =>
    date.toLocaleDateString("nb-NO", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });

  // Utlogging fra header
  const handleLogout = async () => {
    try {
      if (logout) await logout();
      navigation.reset({
        index: 0,
        routes: [{ name: "Login" }],
      });
    } catch (err) {
      console.warn("Feil ved utlogging", err);
      Alert.alert("Feil", "Kunne ikke logge ut. Prøv igjen.");
    }
  };

  // Setter tittel + logg ut-knapp i header
  useLayoutEffect(() => {
    navigation.setOptions({
      title: group || "Avdeling",
      headerStyle: { backgroundColor: theme.colors.surface },
      headerTintColor: theme.colors.text.primary,
      headerTitleStyle: { color: theme.colors.text.primary },

      headerRight: () => (
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          {/* Valgfritt */}
          {/* <ThemeToggleButton style={{ marginRight: theme.spacing.s }} /> */}

          <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
            <Caption style={styles.logoutText}>Logg ut</Caption>
          </TouchableOpacity>
        </View>
      ),
    });
  }, [navigation, group, theme, handleLogout]);

  // Henter barn i avdelingen
  useEffect(() => {
    const fetchChildren = async () => {
      if (!group) return;

      setLoadingChildren(true);
      try {
        const q = query(
          collection(db, "children"),
          where("group", "==", group)
        );
        const snap = await getDocs(q);
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setChildren(list);
      } catch (err) {
        console.warn("Feil ved henting av barn for avdeling", err);
        Alert.alert("Feil", "Kunne ikke hente barna for avdelingen.");
      } finally {
        setLoadingChildren(false);
      }
    };

    fetchChildren();
  }, [group]);

  // Henter "Dagen i dag"-tekst og bilder for valgt dato
  useEffect(() => {
    const fetchSummary = async () => {
      if (!group) return;

      setLoadingSummary(true);
      try {
        const dateId = dateIdFromDate(selectedDate);
        const docRef = doc(db, "daySummaries", `${group}_${dateId}`);
        const snap = await getDoc(docRef);

        if (snap.exists()) {
          const data = snap.data();
          setDayNote(data.note || "");
          setDayPhotos(
            Array.isArray(data.base64Photos) ? data.base64Photos : []
          );
        } else {
          setDayNote("");
          setDayPhotos([]);
        }
      } catch (err) {
        console.warn("Feil ved henting av daySummary for avdeling", err);
      } finally {
        setLoadingSummary(false);
      }
    };

    fetchSummary();
  }, [group, selectedDate]);

  // Åpner bildegalleri og henter base64
  const pickImageAsBase64 = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Tilgang nektet",
        "Vi trenger tilgang til bildene dine for å kunne laste opp."
      );
      return null;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.4,
      base64: true,
    });

    if (result.canceled) return null;

    const asset = result.assets[0];
    if (!asset.base64) return null;

    return asset.base64;
  };

  // Lagrer tekst for avdelingen for valgt dato
  const handleSaveNote = async () => {
    if (!group) return;

    try {
      const dateId = dateIdFromDate(selectedDate);
      const docRef = doc(db, "daySummaries", `${group}_${dateId}`);

      await setDoc(
        docRef,
        {
          group,
          date: dateId,
          note: dayNote,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      setEditingNote(false);
      Alert.alert("Lagret", "Teksten er oppdatert for avdelingen.");
    } catch (err) {
      console.warn("Feil ved lagring av daySummary for avdeling", err);
      Alert.alert("Feil", "Kunne ikke lagre teksten. Prøv igjen.");
    }
  };

  // Legger til bilde for avdelingen for valgt dato
  const handleAddDayPhoto = async () => {
    if (!group) return;

    try {
      const base64 = await pickImageAsBase64();
      if (!base64) return;

      setUploadingDayPhoto(true);

      const dateId = dateIdFromDate(selectedDate);
      const docRef = doc(db, "daySummaries", `${group}_${dateId}`);

      await setDoc(
        docRef,
        {
          group,
          date: dateId,
          base64Photos: arrayUnion(base64),
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      setDayPhotos((prev) => [...prev, base64]);
    } catch (err) {
      console.warn("Feil ved lagring av dagsbilde for avdeling", err);
      Alert.alert("Feil", "Kunne ikke lagre bildet. Prøv igjen.");
    } finally {
      setUploadingDayPhoto(false);
    }
  };

  // Går til forrige dag
  const handlePrevDay = () => {
    setSelectedDate((prev) => {
      const d = new Date(prev);
      d.setDate(d.getDate() - 1);
      return d;
    });
  };

  // Går til neste dag (ikke forbi i dag)
  const handleNextDay = () => {
    setSelectedDate((prev) => {
      const d = new Date(prev);
      d.setDate(d.getDate() + 1);
      return d;
    });
  };

  const dateLabel = formatDateLabel(selectedDate);

  // Kort for ett barn
  const renderChildCard = (child) => (
    <Card
      key={child.id}
      onPress={() => navigation.navigate("ChildProfile", { child })}
      style={[
        styles.childCard,
        {
          borderLeftWidth: 6,
          borderLeftColor: getStatusColor(theme, child.status),
        },
      ]}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={`${child.name}, Status: ${child.status || "Ukjent"}`}
      accessibilityHint="Dobbelttrykk for å se profil"
    >
      <View style={styles.row}>
        <Heading3>{child.name}</Heading3>
        <StatusBadge status={child.status} />
      </View>
      <Caption>Avdeling: {child.group}</Caption>
    </Card>
  );

  // Vis spinner hvis begge deler laster
  if (loadingChildren && loadingSummary) {
    return (
      <ScreenContainer centered>
        <Loading />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer style={{ padding: 0 }}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Dato-navigasjon */}
        <View style={styles.dateRow}>
          <Button
            title="‹ Forrige"
            onPress={handlePrevDay}
            variant="outline"
            size="small"
            accessibilityLabel="Forrige dag"
            accessibilityHint="Gå til forrige dato"
          />
          <Heading3 style={styles.dateLabel}>{dateLabel}</Heading3>
          <Button
            title="Neste ›"
            onPress={handleNextDay}
            disabled={isToday(selectedDate)}
            variant="outline"
            size="small"
            accessibilityLabel="Neste dag"
            accessibilityHint="Gå til neste dato"
          />
        </View>

        {/* Dagen i dag-tekst */}
        <Card>
          <Heading2>Dagen i dag</Heading2>

          {loadingSummary ? (
            <Loading />
          ) : editingNote ? (
            <>
              <Input
                multiline
                value={dayNote}
                onChangeText={setDayNote}
                placeholder={defaultNote}
                style={{ marginBottom: theme.spacing.m }}
              />
              <Button
                title="Lagre for avdelingen"
                onPress={handleSaveNote}
                style={{ marginBottom: theme.spacing.s }}
              />
              <Button
                title="Avbryt"
                variant="outline"
                onPress={() => setEditingNote(false)}
              />
            </>
          ) : (
            <>
              <Body style={styles.sectionText}>
                {dayNote && dayNote.trim().length > 0 ? dayNote : defaultNote}
              </Body>
              <View style={{ marginTop: theme.spacing.m }}>
                <Button
                  title="Rediger tekst for avdelingen"
                  variant="secondary"
                  onPress={() => setEditingNote(true)}
                />
              </View>
            </>
          )}
        </Card>

        {/* Bilder fra dagen */}
        <Card>
          <Heading2>Bilder fra dagen</Heading2>

          {dayPhotos.length === 0 ? (
            <EmptyState
              title="Ingen bilder"
              message="Ingen bilder lastet opp for denne dagen ennå."
            />
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={{ marginVertical: theme.spacing.s }}
            >
              {dayPhotos.map((b64, idx) => (
                <TouchableOpacity
                  key={idx}
                  onPress={() => {
                    setSelectedPhoto(b64);
                    setPhotoModalVisible(true);
                  }}
                >
                  <Image
                    source={{ uri: `data:image/jpeg;base64,${b64}` }}
                    style={styles.dayPhoto}
                  />
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}

          <View style={{ marginTop: theme.spacing.s }}>
            <Button
              title="Legg til bilde for avdelingen"
              onPress={handleAddDayPhoto}
              loading={uploadingDayPhoto}
              variant="secondary"
            />
          </View>
        </Card>

        {/* Liste over barn i avdelingen */}
        <View style={styles.section}>
          <Heading2 style={styles.heading}>Barn i {group}</Heading2>
          {loadingChildren ? (
            <Loading />
          ) : children.length === 0 ? (
            <EmptyState
              title="Ingen barn"
              message="Ingen barn registrert i denne avdelingen."
            />
          ) : (
            children.map(renderChildCard)
          )}
        </View>

        {/* Fullskjermsvisning av bilde */}
        {selectedPhoto && (
          <Modal
            visible={photoModalVisible}
            transparent
            animationType="fade"
            onRequestClose={() => setPhotoModalVisible(false)}
          >
            <Pressable
              style={styles.modalBackdrop}
              onPress={() => setPhotoModalVisible(false)}
            >
              <Image
                source={{ uri: `data:image/jpeg;base64,${selectedPhoto}` }}
                style={styles.fullscreenImage}
                resizeMode="contain"
              />
            </Pressable>
          </Modal>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}

const getStatusColor = (theme, status) => {
  switch (status?.toLowerCase()) {
    case "levert":
      return theme.colors.status.success;
    case "hentet":
      return theme.colors.status.danger;
    case "syk":
      return theme.colors.status.danger;
    case "ferie":
      return theme.colors.status.warning;
    default:
      return theme.colors.text.secondary;
  }
};

const createStyles = (theme) =>
  StyleSheet.create({
    scrollContent: {
      padding: theme.spacing.m,
      paddingBottom: theme.spacing.xxl,
    },
    logoutButton: { marginRight: theme.spacing.s },
    logoutText: { color: theme.colors.primary, fontWeight: "600" },

    dateRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: theme.spacing.m,
      backgroundColor: theme.colors.surface,
      padding: theme.spacing.s,
      borderRadius: theme.borderRadius.m,
      ...theme.shadows.small,
    },
    dateLabel: {
      flex: 1,
      textAlign: "center",
      marginHorizontal: theme.spacing.s,
      textTransform: "capitalize",
    },

    section: { marginTop: theme.spacing.l },
    sectionText: {
      marginBottom: theme.spacing.s,
      color: theme.colors.text.primary,
    },

    dayPhoto: {
      width: 120,
      height: 120,
      borderRadius: theme.borderRadius.m,
      marginRight: theme.spacing.s,
      backgroundColor: theme.colors.border,
    },

    heading: {
      marginBottom: theme.spacing.m,
    },

    childCard: {
      marginBottom: theme.spacing.m,
    },
    row: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: theme.spacing.xs,
    },

    modalBackdrop: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.9)",
      justifyContent: "center",
      alignItems: "center",
    },
    fullscreenImage: {
      width: "100%",
      height: "80%",
    },
  });
