// screens/ChildProfileScreen.js
import React, { useState, useEffect, useLayoutEffect } from "react";
import {
  View,
  StyleSheet,
  Alert,
  Image,
  ScrollView,
  TouchableOpacity,
  Modal,
  Pressable,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as ImagePicker from "expo-image-picker";
import { useAuth } from "../store/AuthContext";
import { db } from "../services/firebase";
import {
  doc,
  updateDoc,
  addDoc,
  collection,
  serverTimestamp,
  getDoc,
  setDoc,
  getDocs,
  query,
  where,
} from "firebase/firestore";

// UI Components
import ScreenContainer from "../components/ScreenContainer";
import Card from "../components/Card";
import Button from "../components/Button";
import Input from "../components/Input";
import Loading from "../components/Loading";
import EmptyState from "../components/EmptyState";
import StatusBadge from "../components/StatusBadge";
import {
  Heading1,
  Heading2,
  Heading3,
  Body,
  Caption,
} from "../components/Typography";
import { useTheme } from "../store/ThemeContext";

export default function ChildProfileScreen({ route, navigation }) {
  const { child: initialChild } = route.params || {};
  const [child, setChild] = useState(initialChild || null);

  const { theme } = useTheme();
  const styles = createStyles(theme);

  // Status / dagssammendrag
  const [savingStatus, setSavingStatus] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [dayNote, setDayNote] = useState("");
  const [loadingNote, setLoadingNote] = useState(false);
  const [dayPhotos, setDayPhotos] = useState([]);
  const [dayUpdatedAt, setDayUpdatedAt] = useState(null);

  // Profilbilde
  const [uploadingProfilePhoto, setUploadingProfilePhoto] = useState(false);
  const [photoModalVisible, setPhotoModalVisible] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState(null);

  // Varsler
  const [notificationCount, setNotificationCount] = useState(0);
  const [lastSeenMs, setLastSeenMs] = useState(0);
  const [notifModalVisible, setNotifModalVisible] = useState(false);
  const [notifText, setNotifText] = useState("");

  // Fravær (foreldre)
  const [sickModalVisible, setSickModalVisible] = useState(false);
  const [vacationModalVisible, setVacationModalVisible] = useState(false);
  const [selectedSickReason, setSelectedSickReason] = useState("Feber");
  const [vacationFrom, setVacationFrom] = useState(new Date());
  const [vacationTo, setVacationTo] = useState(new Date());
  const [showFromPicker, setShowFromPicker] = useState(false);
  const [showToPicker, setShowToPicker] = useState(false);

  // Planlagt søvn (foreldre)
  const [sleepPrefModalVisible, setSleepPrefModalVisible] = useState(false);
  const [wantsSleep, setWantsSleep] = useState(false);
  const [sleepMinutesInput, setSleepMinutesInput] = useState("");

  // Dagspåminnelse (begge veier)
  const [dayReminderModalVisible, setDayReminderModalVisible] = useState(false);
  const [dayReminderDraft, setDayReminderDraft] = useState("");

  const { user, profile, logout } = useAuth();
  const isStaff = profile?.role === "staff" || profile?.role === "admin";

  // Avdelingsbeskjeder
  const [announcements, setAnnouncements] = useState([]);
  const [loadingAnnouncements, setLoadingAnnouncements] = useState(false);

  // Kontaktinfo foresatte (Kun ansatte)
  const [parents, setParents] = useState([]);
  const [loadingParents, setLoadingParents] = useState(false);

  /*Hjelpefunksjoner*/

  const dateIdFromDate = (date) => date.toISOString().slice(0, 10); // YYYY-MM-DD

  const startOfDay = (d) =>
    new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const endOfDay = (d) =>
    new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);

  const isMaxSelectableDate = (date) => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return startOfDay(date).getTime() >= startOfDay(tomorrow).getTime();
  };

  const formatDateLabel = (date) =>
    date.toLocaleDateString("nb-NO", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });

  const tsToMillis = (value) => {
    if (!value) return 0;
    if (typeof value.toMillis === "function") return value.toMillis();
    const d = new Date(value);
    return isNaN(d.getTime()) ? 0 : d.getTime();
  };

  const formatStatusWithTime = (status, ts) => {
    if (!status) return "";
    if (!ts) return status;

    try {
      const date = typeof ts.toDate === "function" ? ts.toDate() : new Date(ts);
      const timeStr = date.toLocaleTimeString("nb-NO", {
        hour: "2-digit",
        minute: "2-digit",
      });
      return `${status} • ${timeStr}`;
    } catch {
      return status;
    }
  };

  const formatTime = (ts) => {
    if (!ts) return "";
    try {
      const date = typeof ts.toDate === "function" ? ts.toDate() : new Date(ts);
      return date.toLocaleTimeString("nb-NO", {
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "";
    }
  };

  const formatShortDate = (date) =>
    date.toLocaleDateString("nb-NO", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });

  const formatDuration = (start, end) => {
    const startMs = tsToMillis(start);
    const endMs = tsToMillis(end);
    if (!startMs || !endMs || endMs <= startMs) return "";

    const diffMinutes = Math.round((endMs - startMs) / 60000);
    const hours = Math.floor(diffMinutes / 60);
    const minutes = diffMinutes % 60;

    if (hours > 0) return `${hours} t ${minutes} min`;
    return `${minutes} min`;
  };

  /* Hent dagssammendrag og bilder */

  useEffect(() => {
    if (!child) return;

    const fetchSummary = async () => {
      try {
        setLoadingNote(true);
        const dateId = dateIdFromDate(selectedDate);
        const docRef = doc(db, "daySummaries", `${child.group}_${dateId}`);
        const snap = await getDoc(docRef);

        if (snap.exists()) {
          const data = snap.data();
          setDayNote(data.note || "");
          setDayPhotos(
            Array.isArray(data.base64Photos) ? data.base64Photos : []
          );
          setDayUpdatedAt(data.updatedAt || null);
        } else {
          setDayNote("");
          setDayPhotos([]);
          setDayUpdatedAt(null);
        }
      } catch (err) {
        console.warn("Feil ved henting av daySummary", err);
      } finally {
        setLoadingNote(false);
      }
    };

    fetchSummary();
  }, [child, selectedDate]);

  /* Hent avdelingsbeskjeder */
  useEffect(() => {
    if (!child) return;

    const fetchAnnouncements = async () => {
      try {
        setLoadingAnnouncements(true);

        const q = query(
          collection(db, "groupAnnouncements"),
          where("groupId", "==", child.group)
        );

        const snap = await getDocs(q);
        const items = [];
        snap.forEach((docSnap) => {
          items.push({ id: docSnap.id, ...docSnap.data() });
        });

        setAnnouncements(items);
      } catch (err) {
        console.warn("Feil ved henting av avdelingsinfo", err);
      } finally {
        setLoadingAnnouncements(false);
      }
    };

    fetchAnnouncements();
  }, [child]);

  /* Hent kontaktinfo foresatte (Ansatte) */
  useEffect(() => {
    if (!isStaff || !child?.parentIds || child.parentIds.length === 0) return;

    const fetchParents = async () => {
      setLoadingParents(true);
      try {
        const promises = child.parentIds.map((pid) =>
          getDoc(doc(db, "users", pid))
        );
        const snaps = await Promise.all(promises);
        const loadedParents = snaps
          .filter((s) => s.exists())
          .map((s) => ({ id: s.id, ...s.data() }));
        setParents(loadedParents);
      } catch (err) {
        console.warn("Feil ved henting av foreldre", err);
      } finally {
        setLoadingParents(false);
      }
    };

    fetchParents();
  }, [child, isStaff]);

  /* Sync lokale felt fra child */

  useEffect(() => {
    if (!child) return;

    setWantsSleep(child.sleepPlanned ?? false);
    setSleepMinutesInput(
      child.sleepPlannedMinutes != null ? String(child.sleepPlannedMinutes) : ""
    );
    setDayReminderDraft(child.dayReminder || "");
  }, [child]);

  /* Varsler */

  useEffect(() => {
    if (!child || !user) return;

    const fetchMeta = async () => {
      try {
        const metaRef = doc(db, "userChildMeta", `${user.uid}_${child.id}`);
        const snap = await getDoc(metaRef);

        let lastSeenAt = null;
        if (snap.exists()) {
          const meta = snap.data();
          lastSeenAt = meta.lastSeenAt || null;
        }

        const lastSeenMsLocal = tsToMillis(lastSeenAt);
        setLastSeenMs(lastSeenMsLocal);

        let count = 0;
        if (
          child.lastUpdated &&
          tsToMillis(child.lastUpdated) > lastSeenMsLocal
        ) {
          count++;
        }
        if (dayUpdatedAt && tsToMillis(dayUpdatedAt) > lastSeenMsLocal) {
          count++;
        }

        setNotificationCount(count);
      } catch (err) {
        console.warn("Feil ved henting av userChildMeta", err);
      }
    };

    fetchMeta();
  }, [child, user, dayUpdatedAt]);

  const handleNotificationsPress = async () => {
    if (!child || !user) return;

    try {
      const messages = [];

      if (child.lastUpdated && tsToMillis(child.lastUpdated) > lastSeenMs) {
        messages.push("Status (levert/hentet/syk/ferie) er oppdatert.");
      }
      if (dayUpdatedAt && tsToMillis(dayUpdatedAt) > lastSeenMs) {
        messages.push('"Dagen i dag" eller bilder er oppdatert.');
      }

      if (messages.length === 0) {
        messages.push("Ingen nye oppdateringer siden sist.");
      }

      setNotifText(messages.join("\n"));
      setNotifModalVisible(true);

      const metaRef = doc(db, "userChildMeta", `${user.uid}_${child.id}`);
      await setDoc(
        metaRef,
        {
          userId: user.uid,
          childId: child.id,
          lastSeenAt: serverTimestamp(),
        },
        { merge: true }
      );

      setNotificationCount(0);
      setLastSeenMs(Date.now());
    } catch (err) {
      console.warn("Feil ved oppdatering av userChildMeta", err);
    }
  };

  /* Header */

  useLayoutEffect(() => {
    navigation.setOptions({
      headerStyle: { backgroundColor: theme.colors.surface },
      headerTintColor: theme.colors.text.primary,
      headerTitleStyle: { color: theme.colors.text.primary },

      headerRight: () => (
        <View style={styles.headerRightContainer}>
          {/* Valgfritt */}
          {/* <ThemeToggleButton style={{ marginRight: theme.spacing.s }} /> */}

          <TouchableOpacity
            onPress={handleNotificationsPress}
            style={styles.iconButton}
          >
            <Body style={styles.bellIcon}>🔔</Body>
            {notificationCount > 0 && (
              <View style={styles.badge}>
                <Caption style={styles.badgeText}>
                  {notificationCount > 9 ? "9+" : notificationCount}
                </Caption>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={async () => {
              /* samme logout */
            }}
            style={styles.iconButton}
          >
            <Caption style={styles.logoutText}>Logg ut</Caption>
          </TouchableOpacity>
        </View>
      ),
    });
  }, [navigation, notificationCount, logout, theme, handleNotificationsPress]);

  /* Status (ansatte) */

  const handleStatusChange = async (newStatus, action) => {
    if (!isStaff || !child) return;

    try {
      setSavingStatus(true);

      const childRef = doc(db, "children", child.id);
      await updateDoc(childRef, {
        status: newStatus,
        lastUpdated: serverTimestamp(),
      });

      await addDoc(collection(db, "checkins"), {
        childId: child.id,
        action,
        status: newStatus,
        performedBy: user?.uid ?? null,
        timestamp: serverTimestamp(),
      });

      setChild((prev) => ({
        ...prev,
        status: newStatus,
        lastUpdated: new Date().toISOString(),
      }));
    } catch (err) {
      console.warn("Feil ved oppdatering av status", err);
      Alert.alert("Feil", "Kunne ikke oppdatere status. Prøv igjen.");
    } finally {
      setSavingStatus(false);
    }
  };

  /* Søvnlogging (ansatte) */

  const handleSleepStart = async () => {
    if (!isStaff || !child) return;

    try {
      const now = new Date();
      const sleepDateId = dateIdFromDate(selectedDate);
      const childRef = doc(db, "children", child.id);

      await updateDoc(childRef, {
        sleepStart: serverTimestamp(),
        sleepEnd: null,
        sleepDateId,
      });

      setChild((prev) => ({
        ...prev,
        sleepStart: now.toISOString(),
        sleepEnd: null,
        sleepDateId,
      }));
    } catch (err) {
      console.warn("Feil ved lagring av søvn-start", err);
      Alert.alert("Feil", "Kunne ikke starte søvnregistrering. Prøv igjen.");
    }
  };

  const handleSleepEnd = async () => {
    if (!isStaff || !child) return;

    try {
      const now = new Date();
      const childRef = doc(db, "children", child.id);

      await updateDoc(childRef, {
        sleepEnd: serverTimestamp(),
      });

      setChild((prev) => ({
        ...prev,
        sleepEnd: now.toISOString(),
      }));
    } catch (err) {
      console.warn("Feil ved lagring av søvn-slutt", err);
      Alert.alert("Feil", "Kunne ikke avslutte søvnregistrering. Prøv igjen.");
    }
  };

  /* Planlagt søvn (foreldre) */

  const handleSaveSleepPreferences = async () => {
    if (!child) return;

    const minutes = parseInt(sleepMinutesInput, 10);
    const validMinutes = !isNaN(minutes) && minutes > 0 ? minutes : null;

    if (wantsSleep && !validMinutes) {
      Alert.alert(
        "Ugyldig antall minutter",
        "Skriv inn hvor lenge barnet skal sove (i minutter)."
      );
      return;
    }

    try {
      const childRef = doc(db, "children", child.id);
      await updateDoc(childRef, {
        sleepPlanned: wantsSleep,
        sleepPlannedMinutes: wantsSleep ? validMinutes : null,
      });

      setChild((prev) => ({
        ...prev,
        sleepPlanned: wantsSleep,
        sleepPlannedMinutes: wantsSleep ? validMinutes : null,
      }));

      setSleepPrefModalVisible(false);
    } catch (err) {
      console.warn("Feil ved lagring av søvn-ønske", err);
      Alert.alert("Feil", "Kunne ikke lagre søvn-ønsket. Prøv igjen.");
    }
  };

  /* Dagspåminnelse (begge) */

  const handleSaveDayReminder = async () => {
    if (!child) return;

    const trimmed = dayReminderDraft.trim();

    try {
      const childRef = doc(db, "children", child.id);
      await updateDoc(childRef, {
        dayReminder: trimmed,
      });

      setChild((prev) => ({
        ...prev,
        dayReminder: trimmed,
      }));

      setDayReminderModalVisible(false);
    } catch (err) {
      console.warn("Feil ved lagring av dagspåminnelse", err);
      Alert.alert("Feil", "Kunne ikke lagre dagspåminnelsen. Prøv igjen.");
    }
  };

  /* Fravær (foreldre) */

  const handleConfirmSick = async () => {
    if (!child) return;

    const sickDateId = dateIdFromDate(selectedDate);

    try {
      const childRef = doc(db, "children", child.id);
      await updateDoc(childRef, {
        sickDate: sickDateId,
        sickReason: selectedSickReason,
        lastUpdated: serverTimestamp(),
      });

      setChild((prev) => ({
        ...prev,
        sickDate: sickDateId,
        sickReason: selectedSickReason,
        lastUpdated: new Date().toISOString(),
      }));

      setSickModalVisible(false);
    } catch (err) {
      console.warn("Feil ved lagring av syk-status", err);
      Alert.alert("Feil", "Kunne ikke lagre syk-status. Prøv igjen.");
    }
  };

  const handleConfirmVacation = async () => {
    if (!child) return;

    try {
      const childRef = doc(db, "children", child.id);
      await updateDoc(childRef, {
        vacationFrom: vacationFrom.toISOString(),
        vacationTo: vacationTo.toISOString(),
        lastUpdated: serverTimestamp(),
      });

      setChild((prev) => ({
        ...prev,
        vacationFrom: vacationFrom.toISOString(),
        vacationTo: vacationTo.toISOString(),
        lastUpdated: new Date().toISOString(),
      }));

      setVacationModalVisible(false);
    } catch (err) {
      console.warn("Feil ved lagring av ferie", err);
      Alert.alert("Feil", "Kunne ikke lagre ferie. Prøv igjen.");
    }
  };

  /* Profilbilde */

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

  const handleChangeProfilePhoto = async () => {
    if (!isStaff || !child) return;

    try {
      const base64 = await pickImageAsBase64();
      if (!base64) return;

      setUploadingProfilePhoto(true);

      const childRef = doc(db, "children", child.id);
      await updateDoc(childRef, { photoDataUrl: base64 });

      setChild((prev) => ({
        ...prev,
        photoDataUrl: base64,
      }));
    } catch (err) {
      console.warn("Feil ved lagring av profilbilde", err);
      Alert.alert("Feil", "Kunne ikke lagre profilbildet. Prøv igjen senere.");
    } finally {
      setUploadingProfilePhoto(false);
    }
  };

  /* Datovelger */

  const handlePrevDay = () => {
    setSelectedDate((prev) => {
      const d = new Date(prev);
      d.setDate(d.getDate() - 1);
      return d;
    });
  };

  const handleNextDay = () => {
    setSelectedDate((prev) => {
      const d = new Date(prev);
      d.setDate(d.getDate() + 1);

      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      if (startOfDay(d).getTime() > startOfDay(tomorrow).getTime()) {
        return prev;
      }
      return d;
    });
  };

  /* Rendering */

  if (!child) {
    return (
      <ScreenContainer centered>
        <Body>Kunne ikke laste inn barn.</Body>
      </ScreenContainer>
    );
  }

  const dateLabel = formatDateLabel(selectedDate);
  const defaultNote = "Kommer i løpet av dagen";
  const initial = child.name?.[0]?.toUpperCase() ?? "?";
  const currentDateId = dateIdFromDate(selectedDate);
  const announcementsForDay = announcements.filter((a) => {
    // 1) Faste beskjeder: alwaysVisible === true - vis alltid
    if (a.alwaysVisible === true) {
      return true;
    }

    // 2) Dato-styrte beskjeder
    if (!a.fromDate || !a.toDate) return false;

    const from = String(a.fromDate).trim().slice(0, 10); // "YYYY-MM-DD"
    const to = String(a.toDate).trim().slice(0, 10);

    if (from.length !== 10 || to.length !== 10) return false;

    return currentDateId >= from && currentDateId <= to;
  });

  // Status for valgt dato
  let displayStatus = child.status;
  let displayTimestamp = child.lastUpdated;

  const todayStart = startOfDay(new Date());
  if (startOfDay(selectedDate) > todayStart) {
    displayStatus = null;
    displayTimestamp = null;
  }

  if (child.vacationFrom && child.vacationTo) {
    try {
      const from = startOfDay(new Date(child.vacationFrom));
      const to = endOfDay(new Date(child.vacationTo));
      if (selectedDate >= from && selectedDate <= to) {
        displayStatus = "Ferie";
        displayTimestamp = null;
      }
    } catch {
      /* ignorer parsing-feil */
    }
  }

  if (child.sickDate && currentDateId === child.sickDate) {
    displayStatus = "Syk";
    displayTimestamp = null;
  }

  const statusText = formatStatusWithTime(displayStatus, displayTimestamp);

  // Søvnlogg for valgt dato
  const hasSleepForDay =
    child.sleepDateId && child.sleepDateId === currentDateId;

  let sleepText = "";
  if (hasSleepForDay) {
    const startText = formatTime(child.sleepStart);
    const endText = formatTime(child.sleepEnd);
    const durationText = formatDuration(child.sleepStart, child.sleepEnd);

    if (startText && endText && durationText) {
      sleepText = `${startText}–${endText} (${durationText})`;
    } else if (startText) {
      sleepText = `Startet ${startText}`;
    }
  }

  // Planlagt søvn (samme for alle dager)
  let plannedSleepText = "Ikke angitt";
  if (child.sleepPlanned === false) {
    plannedSleepText = "Skal ikke sove";
  } else if (child.sleepPlanned === true && child.sleepPlannedMinutes) {
    plannedSleepText = `Skal sove ca ${child.sleepPlannedMinutes} min`;
  } else if (child.sleepPlanned === true) {
    plannedSleepText = "Skal sove";
  }

  // Dagspåminnelse
  const dayReminderText =
    child.dayReminder && child.dayReminder.trim().length > 0
      ? child.dayReminder
      : "Ingen dagspåminnelse registrert.";

  return (
    <ScreenContainer style={{ padding: 0 }}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Datovelger */}
        <View style={styles.dateRow}>
          <Button
            title="‹ Forrige"
            onPress={handlePrevDay}
            variant="outline"
            size="small"
            accessibilityLabel="Forrige dag"
            accessibilityHint="Gå til forrige dato"
          />
          <Heading3
            style={styles.dateLabel}
            accessible={true}
            accessibilityRole="header"
          >
            {dateLabel}
          </Heading3>
          <Button
            title="Neste ›"
            onPress={handleNextDay}
            disabled={isMaxSelectableDate(selectedDate)}
            variant="outline"
            size="small"
            accessibilityLabel="Neste dag"
            accessibilityHint="Gå til neste dato"
          />
        </View>

        {/* Toppkort med navn og bilde */}
        <Card style={styles.card}>
          <View style={styles.cardLeft}>
            <Heading1 style={styles.name}>{child.name}</Heading1>

            <Caption style={styles.label}>Avdeling</Caption>
            <Body style={styles.value}>{child.group}</Body>

            <Caption style={styles.label}>Status</Caption>
            <StatusBadge status={displayStatus} timestamp={displayTimestamp} />

            <Caption style={styles.label}>Søvn</Caption>
            <Body style={styles.value}>{sleepText || "Ingen registrert"}</Body>

            <Caption style={styles.label}>Planlagt søvn</Caption>
            <Body style={styles.value}>{plannedSleepText}</Body>
          </View>

          <View style={styles.avatarContainer}>
            {child.photoDataUrl ? (
              <Image
                source={{
                  uri: `data:image/jpeg;base64,${child.photoDataUrl}`,
                }}
                style={styles.avatarImage}
              />
            ) : (
              <View style={styles.avatar}>
                <Heading1 style={styles.avatarInitial}>{initial}</Heading1>
              </View>
            )}

            {isStaff && (
              <TouchableOpacity
                onPress={handleChangeProfilePhoto}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel="Endre profilbilde"
                accessibilityHint="Trykk for å velge nytt bilde fra galleriet"
              >
                <Caption style={styles.changePhotoText}>
                  {uploadingProfilePhoto ? "Lagrer…" : "Endre bilde"}
                </Caption>
              </TouchableOpacity>
            )}
          </View>
        </Card>

        {/* Knapper for ansatte / foreldre */}
        {isStaff ? (
          <View style={styles.buttons}>
            {savingStatus ? (
              <Loading />
            ) : (
              <>
                {child.status === "Levert" ? (
                  <Button
                    title="Sjekk ut (Hentet)"
                    onPress={() => handleStatusChange("Hentet", "checkout")}
                    variant="danger"
                    style={{ marginBottom: theme.spacing.m }}
                    accessibilityLabel="Sjekk ut barnet, marker som hentet"
                  />
                ) : (
                  <Button
                    title="Sjekk inn (Levert)"
                    onPress={() => handleStatusChange("Levert", "checkin")}
                    variant="primary"
                    style={{ marginBottom: theme.spacing.m }}
                    accessibilityLabel="Sjekk inn barnet, marker som levert"
                  />
                )}

                <View style={styles.sleepButtonsRow}>
                  <View style={{ flex: 1 }}>
                    <Button
                      title="Startet å sove"
                      onPress={handleSleepStart}
                      variant="secondary"
                      accessibilityLabel="Registrer at barnet har startet å sove"
                    />
                  </View>
                  <View style={{ width: theme.spacing.s }} />
                  <View style={{ flex: 1 }}>
                    <Button
                      title="Sluttet å sove"
                      onPress={handleSleepEnd}
                      variant="outline"
                      accessibilityLabel="Registrer at barnet har våknet"
                    />
                  </View>
                </View>
              </>
            )}

            {/* Kontaktinfo foresatte */}
            <Card style={{ marginTop: theme.spacing.m }}>
              <Heading2 style={{ marginBottom: theme.spacing.s }}>
                Kontaktinfo foresatte
              </Heading2>
              {loadingParents ? (
                <Loading />
              ) : parents.length === 0 ? (
                <Body style={{ color: theme.colors.text.secondary }}>
                  Kontaktinfo ikke tilgjengelig i testdata.
                </Body>
              ) : (
                parents.map((p, index) => (
                  <View
                    key={p.id}
                    style={{
                      marginBottom:
                        index < parents.length - 1 ? theme.spacing.m : 0,
                      paddingBottom:
                        index < parents.length - 1 ? theme.spacing.s : 0,
                      borderBottomWidth: index < parents.length - 1 ? 1 : 0,
                      borderBottomColor: theme.colors.border,
                    }}
                  >
                    <Heading3>
                      {p.name || p.displayName || "Ukjent navn"}
                    </Heading3>
                    {p.phoneNumber ? (
                      <Body>Tlf: {p.phoneNumber}</Body>
                    ) : (
                      <Caption>Ingen telefon registrert</Caption>
                    )}
                    {p.email && <Caption>E-post: {p.email}</Caption>}
                  </View>
                ))
              )}
            </Card>
          </View>
        ) : (
          <>
            <View style={styles.absenceRow}>
              <TouchableOpacity
                style={styles.absenceButton}
                onPress={() => setSickModalVisible(true)}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel="Meld syk"
                accessibilityHint="Åpner skjema for å registrere sykdom"
              >
                <Heading3 style={styles.absenceText}>Syk</Heading3>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.absenceButton}
                onPress={() => setVacationModalVisible(true)}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel="Meld ferie"
                accessibilityHint="Åpner skjema for å registrere ferie"
              >
                <Heading3 style={styles.absenceText}>Ferie</Heading3>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.sleepPrefButton}
              onPress={() => setSleepPrefModalVisible(true)}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Registrer ønsket søvn"
              accessibilityHint="Angi hvor lenge barnet skal sove"
            >
              <Heading3 style={styles.sleepPrefTitle}>
                Registrer ønsket søvn for ditt barn
              </Heading3>
            </TouchableOpacity>
          </>
        )}

        {/* Dagspåminnelse – begge parter kan redigere */}
        <Card style={styles.dayReminderContainer}>
          <TouchableOpacity
            style={styles.dayReminderButton}
            onPress={() => {
              setDayReminderDraft(child.dayReminder || "");
              setDayReminderModalVisible(true);
            }}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Skriv beskjed til avdelingen"
            accessibilityHint="Endre dagens beskjed"
          >
            <Heading3 style={styles.dayReminderButtonText}>
              Skriv beskjed
            </Heading3>
          </TouchableOpacity>
          <Caption style={styles.dayReminderLabel}>Beskjed i dag:</Caption>
          <Body style={styles.dayReminderText}>{dayReminderText}</Body>
        </Card>

        {/* Avdelingsbeskjeder */}
        <View style={styles.section}>
          <Heading2 style={styles.sectionTitle}>Info fra avdelingen</Heading2>

          {loadingAnnouncements ? (
            <Loading />
          ) : announcementsForDay.length === 0 ? (
            <EmptyState
              title="Ingen info"
              message="Ingen info fra avdelingen denne dagen."
            />
          ) : (
            announcementsForDay.map((a) => (
              <Card key={a.id} style={styles.announcementCard}>
                <Heading3 style={styles.announcementTitle}>{a.title}</Heading3>
                <Body style={styles.announcementText}>{a.message}</Body>
              </Card>
            ))
          )}
        </View>

        {/* Dagen i dag */}
        <View style={styles.section}>
          <Heading2 style={styles.sectionTitle}>Dagen i dag</Heading2>
          {loadingNote ? (
            <Loading />
          ) : (
            <Body style={styles.sectionText}>
              {dayNote && dayNote.trim().length > 0 ? dayNote : defaultNote}
            </Body>
          )}
        </View>

        {/* Bilder fra dagen */}
        <View style={styles.section}>
          <Heading2 style={styles.sectionTitle}>Bilder fra dagen</Heading2>
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
                  accessible={true}
                  accessibilityRole="imagebutton"
                  accessibilityLabel={`Bilde ${idx + 1} fra dagen`}
                  accessibilityHint="Vis bilde i fullskjerm"
                >
                  <Image
                    source={{ uri: `data:image/jpeg;base64,${b64}` }}
                    style={styles.dayPhoto}
                  />
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>
      </ScrollView>

      {/* Fullskjerm-bilde */}
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

      {/* Varsling */}
      <Modal
        visible={notifModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setNotifModalVisible(false)}
      >
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setNotifModalVisible(false)}
        >
          <View style={styles.notifCard}>
            <Heading2 style={styles.notifTitle}>Varsler</Heading2>
            <Body style={styles.notifBody}>{notifText}</Body>
            <View style={{ marginTop: theme.spacing.m }}>
              <Button
                title="Lukk"
                onPress={() => setNotifModalVisible(false)}
              />
            </View>
          </View>
        </Pressable>
      </Modal>

      {/* Syk */}
      <Modal
        visible={sickModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setSickModalVisible(false)}
      >
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setSickModalVisible(false)}
        >
          <View style={styles.notifCard}>
            <Heading2 style={styles.notifTitle}>Meld barnet som syk</Heading2>
            <Body style={[styles.notifBody, { marginBottom: theme.spacing.s }]}>
              Velg årsak:
            </Body>

            {["Feber", "Forkjølet", "Omgangssyke", "Annet"].map((reason) => (
              <TouchableOpacity
                key={reason}
                style={[
                  styles.reasonOption,
                  selectedSickReason === reason && styles.reasonOptionSelected,
                ]}
                onPress={() => setSelectedSickReason(reason)}
                accessible={true}
                accessibilityRole="radio"
                accessibilityState={{ checked: selectedSickReason === reason }}
                accessibilityLabel={reason}
              >
                <Body
                  style={[
                    styles.reasonText,
                    selectedSickReason === reason && styles.reasonTextSelected,
                  ]}
                >
                  {reason}
                </Body>
              </TouchableOpacity>
            ))}

            <View style={{ marginTop: theme.spacing.m }}>
              <Button title="Lagre" onPress={handleConfirmSick} />
            </View>
          </View>
        </Pressable>
      </Modal>

      {/* Ferie */}
      <Modal
        visible={vacationModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setVacationModalVisible(false)}
      >
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setVacationModalVisible(false)}
        >
          <View style={styles.notifCard}>
            <Heading2 style={styles.notifTitle}>Meld ferie</Heading2>

            <View style={{ marginVertical: theme.spacing.s }}>
              <Body style={styles.notifBody}>Fra:</Body>
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => setShowFromPicker(true)}
              >
                <Body style={styles.dateButtonText}>
                  {formatShortDate(vacationFrom)}
                </Body>
              </TouchableOpacity>

              <Body style={[styles.notifBody, { marginTop: theme.spacing.s }]}>
                Til:
              </Body>
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => setShowToPicker(true)}
              >
                <Body style={styles.dateButtonText}>
                  {formatShortDate(vacationTo)}
                </Body>
              </TouchableOpacity>
            </View>

            {showFromPicker && (
              <DateTimePicker
                value={vacationFrom}
                mode="date"
                display="default"
                onChange={(_, date) => {
                  setShowFromPicker(false);
                  if (date) setVacationFrom(date);
                }}
              />
            )}

            {showToPicker && (
              <DateTimePicker
                value={vacationTo}
                mode="date"
                display="default"
                onChange={(_, date) => {
                  setShowToPicker(false);
                  if (date) setVacationTo(date);
                }}
              />
            )}

            <View style={{ marginTop: theme.spacing.m }}>
              <Button title="Lagre ferie" onPress={handleConfirmVacation} />
            </View>
          </View>
        </Pressable>
      </Modal>

      {/* Planlagt søvn (foreldre) */}
      <Modal
        visible={sleepPrefModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setSleepPrefModalVisible(false)}
      >
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setSleepPrefModalVisible(false)}
        >
          <View style={styles.notifCard}>
            <Heading2 style={styles.notifTitle}>Søvn i barnehagen</Heading2>

            <Body style={[styles.notifBody, { marginTop: 4 }]}>
              Skal barnet sove i barnehagen?
            </Body>

            <View style={styles.toggleRow}>
              <TouchableOpacity
                style={[
                  styles.toggleOption,
                  wantsSleep && styles.toggleOptionSelected,
                ]}
                onPress={() => setWantsSleep(true)}
              >
                <Body
                  style={[
                    styles.toggleText,
                    wantsSleep && styles.toggleTextSelected,
                  ]}
                >
                  Ja
                </Body>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.toggleOption,
                  !wantsSleep && styles.toggleOptionSelected,
                ]}
                onPress={() => setWantsSleep(false)}
              >
                <Body
                  style={[
                    styles.toggleText,
                    !wantsSleep && styles.toggleTextSelected,
                  ]}
                >
                  Nei
                </Body>
              </TouchableOpacity>
            </View>

            {wantsSleep && (
              <View style={{ marginTop: theme.spacing.m }}>
                <Body style={styles.notifBody}>
                  Hvor lenge skal barnet sove? (minutter)
                </Body>
                <Input
                  value={sleepMinutesInput}
                  onChangeText={setSleepMinutesInput}
                  keyboardType="number-pad"
                  style={styles.sleepMinutesInput}
                  placeholder="f.eks. 60"
                />
              </View>
            )}

            <View style={{ marginTop: theme.spacing.l }}>
              <Button title="Lagre" onPress={handleSaveSleepPreferences} />
            </View>
          </View>
        </Pressable>
      </Modal>

      {/* Dagspåminnelse */}
      <Modal
        visible={dayReminderModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setDayReminderModalVisible(false)}
      >
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setDayReminderModalVisible(false)}
        >
          <View style={styles.notifCard}>
            <Heading2 style={styles.notifTitle}>Dagspåminnelse</Heading2>
            <Body style={[styles.notifBody, { marginBottom: theme.spacing.s }]}>
              Kort beskjed mellom hjem og barnehage.
            </Body>

            <Input
              style={styles.dayReminderInput}
              value={dayReminderDraft}
              onChangeText={setDayReminderDraft}
              multiline
              placeholder="F.eks. «Trenger flere bleier» eller «Ta med kosebamse på tur»"
            />

            <View style={{ marginTop: theme.spacing.m }}>
              <Button title="Lagre" onPress={handleSaveDayReminder} />
            </View>
          </View>
        </Pressable>
      </Modal>
    </ScreenContainer>
  );
}

/* Styles */

const createStyles = (theme) =>
  StyleSheet.create({
    scrollContent: {
      padding: theme.spacing.m,
      paddingBottom: theme.spacing.xxl,
    },

    headerRightContainer: {
      flexDirection: "row",
      alignItems: "center",
      marginRight: theme.spacing.s,
    },
    iconButton: {
      marginLeft: theme.spacing.m,
    },
    bellIcon: {
      fontSize: 20,
    },
    badge: {
      position: "absolute",
      right: -4,
      top: -4,
      backgroundColor: theme.colors.status.danger,
      borderRadius: theme.borderRadius.round,
      paddingHorizontal: 4,
      minWidth: 16,
      height: 16,
      alignItems: "center",
      justifyContent: "center",
    },
    badgeText: {
      color: "#fff",
      fontSize: 10,
      fontWeight: "bold",
    },
    logoutText: {
      color: theme.colors.primary,
      fontWeight: "600",
    },

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

    card: {
      flexDirection: "row",
      justifyContent: "space-between",
    },
    cardLeft: {
      flex: 1,
      paddingRight: theme.spacing.m,
    },
    name: {
      marginBottom: theme.spacing.m,
    },
    label: {
      marginTop: theme.spacing.xs,
    },
    value: {
      marginBottom: theme.spacing.xs,
    },
    status: {
      marginBottom: theme.spacing.xs,
    },

    avatarContainer: {
      alignItems: "center",
      justifyContent: "center",
    },
    avatar: {
      width: 110,
      height: 110,
      borderRadius: 55,
      borderWidth: 1,
      borderColor: theme.colors.border,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: theme.spacing.xs,
    },
    avatarInitial: {
      fontSize: 40,
      fontWeight: "bold",
    },
    avatarImage: {
      width: 110,
      height: 110,
      borderRadius: 55,
      marginBottom: theme.spacing.xs,
    },
    changePhotoText: {
      color: theme.colors.primary,
      textDecorationLine: "underline",
    },

    buttons: {
      marginBottom: theme.spacing.m,
    },
    sleepButtonsRow: {
      flexDirection: "row",
      justifyContent: "space-between",
    },

    absenceRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: theme.spacing.s,
    },
    absenceButton: {
      flex: 1,
      paddingVertical: theme.spacing.m,
      borderRadius: theme.borderRadius.m,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
      alignItems: "center",
      marginHorizontal: theme.spacing.xs,
    },
    absenceText: {
      color: theme.colors.text.primary,
    },

    sleepPrefButton: {
      borderRadius: theme.borderRadius.m,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
      paddingVertical: theme.spacing.m,
      paddingHorizontal: theme.spacing.m,
      marginBottom: theme.spacing.m,
      alignItems: "center",
      justifyContent: "center",
    },
    sleepPrefTitle: {
      textAlign: "center",
      color: theme.colors.text.primary,
    },

    dayReminderContainer: {
      marginBottom: theme.spacing.m,
    },
    dayReminderButton: {
      backgroundColor: theme.colors.primary + "10", // Light primary background
      padding: theme.spacing.s,
      borderRadius: theme.borderRadius.s,
      alignItems: "center",
      marginBottom: theme.spacing.s,
    },
    dayReminderButtonText: {
      color: theme.colors.primary,
    },
    dayReminderLabel: {
      marginBottom: 2,
    },
    dayReminderText: {
      color: theme.colors.text.primary,
    },

    section: {
      marginTop: theme.spacing.m,
    },
    sectionTitle: {
      marginBottom: theme.spacing.s,
    },
    sectionText: {
      color: theme.colors.text.primary,
    },

    dayPhoto: {
      width: 120,
      height: 120,
      borderRadius: theme.borderRadius.m,
      marginRight: theme.spacing.s,
      backgroundColor: theme.colors.border,
    },

    announcementCard: {
      marginBottom: theme.spacing.s,
    },
    announcementTitle: {
      marginBottom: 2,
    },
    announcementText: {
      color: theme.colors.text.primary,
    },

    modalBackdrop: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.8)",
      justifyContent: "center",
      alignItems: "center",
    },
    fullscreenImage: {
      width: "90%",
      height: "80%",
    },

    notifCard: {
      width: "90%",
      maxWidth: 400,
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.l,
      padding: theme.spacing.l,
      ...theme.shadows.medium,
    },
    notifTitle: {
      marginBottom: theme.spacing.m,
    },
    notifBody: {
      color: theme.colors.text.primary,
    },

    reasonOption: {
      paddingVertical: theme.spacing.s,
      paddingHorizontal: theme.spacing.m,
      borderRadius: theme.borderRadius.m,
      borderWidth: 1,
      borderColor: theme.colors.border,
      marginBottom: theme.spacing.s,
    },
    reasonOptionSelected: {
      backgroundColor: theme.colors.primary + "20",
      borderColor: theme.colors.primary,
    },
    reasonText: {
      color: theme.colors.text.primary,
    },
    reasonTextSelected: {
      fontWeight: "600",
      color: theme.colors.primary,
    },

    dateButton: {
      paddingVertical: theme.spacing.s,
      paddingHorizontal: theme.spacing.m,
      borderRadius: theme.borderRadius.m,
      borderWidth: 1,
      borderColor: theme.colors.border,
      marginTop: theme.spacing.xs,
    },
    dateButtonText: {
      color: theme.colors.text.primary,
    },

    toggleRow: {
      flexDirection: "row",
      marginTop: theme.spacing.s,
    },
    toggleOption: {
      flex: 1,
      paddingVertical: theme.spacing.s,
      borderRadius: theme.borderRadius.m,
      borderWidth: 1,
      borderColor: theme.colors.border,
      alignItems: "center",
      marginRight: theme.spacing.s,
    },
    toggleOptionSelected: {
      backgroundColor: theme.colors.primary + "20",
      borderColor: theme.colors.primary,
    },
    toggleText: {
      color: theme.colors.text.primary,
    },
    toggleTextSelected: {
      fontWeight: "600",
      color: theme.colors.primary,
    },
    sleepMinutesInput: {
      marginTop: theme.spacing.xs,
    },

    dayReminderInput: {
      minHeight: 100,
    },
  });
