// screens/AdminScreen.js
import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  Alert,
  TouchableOpacity,
  Modal,
  Pressable,
  ScrollView,
  useWindowDimensions,
} from "react-native";
import {
  collection,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  query,
  orderBy,
} from "firebase/firestore";
import { db } from "../services/firebase";
import { useAuth } from "../store/AuthContext";

import ScreenContainer from "../components/ScreenContainer";
import Card from "../components/Card";
import Button from "../components/Button";
import Input from "../components/Input";
import Loading from "../components/Loading";
import EmptyState from "../components/EmptyState";
import { Heading2, Heading3, Body, Caption } from "../components/Typography";
import { useTheme } from "../store/ThemeContext";

const ROLES = ["parent", "staff", "admin"];

export default function AdminScreen() {
  const { profile } = useAuth();
  const isAdmin = profile?.role === "admin";

  const { theme } = useTheme();
  const styles = createStyles(theme);

  const { height } = useWindowDimensions();
  // Høyere lister på mobil, men ikke “tar hele skjermen”
  const LIST_HEIGHT = Math.max(300, Math.min(520, Math.round(height * 0.38)));

  const [loading, setLoading] = useState(true);

  const [users, setUsers] = useState([]);
  const [children, setChildren] = useState([]);

  // UI toggles
  const [showUsers, setShowUsers] = useState(false);
  const [showChildren, setShowChildren] = useState(true);

  // Create child form
  const [childName, setChildName] = useState("");
  const [childGroup, setChildGroup] = useState("Harehiet");

  // Parent picker
  const [parentPickerOpen, setParentPickerOpen] = useState(false);
  const [parentSearch, setParentSearch] = useState("");
  const [selectedParentIds, setSelectedParentIds] = useState([]);

  useEffect(() => {
    if (!isAdmin) return;

    const load = async () => {
      setLoading(true);
      try {
        const usersSnap = await getDocs(collection(db, "users"));
        const userList = usersSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setUsers(userList);

        const childrenSnap = await getDocs(
          query(collection(db, "children"), orderBy("group", "asc"))
        );
        const childList = childrenSnap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }));
        setChildren(childList);
      } catch (e) {
        console.warn(e);
        Alert.alert("Feil", "Kunne ikke hente admin-data.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [isAdmin]);

  const refresh = async () => {
    try {
      const usersSnap = await getDocs(
        query(collection(db, "users"), orderBy("createdAt", "desc"))
      );
      setUsers(usersSnap.docs.map((d) => ({ id: d.id, ...d.data() })));

      const childrenSnap = await getDocs(
        query(collection(db, "children"), orderBy("group", "asc"))
      );
      setChildren(childrenSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (e) {
      console.warn(e);
    }
  };

  const parentUsers = useMemo(() => {
    const q = parentSearch.trim().toLowerCase();
    return (users || [])
      .filter((u) => (u.role || "parent") === "parent")
      .filter((u) => {
        if (!q) return true;
        const hay = `${u.name || ""} ${u.email || ""} ${u.id || ""}`.toLowerCase();
        return hay.includes(q);
      });
  }, [users, parentSearch]);

  const selectedParentsPreview = useMemo(() => {
    const map = new Map(users.map((u) => [u.id, u]));
    return selectedParentIds.map((id) => map.get(id)).filter(Boolean);
  }, [users, selectedParentIds]);

  const toggleParent = (uid) => {
    setSelectedParentIds((prev) => {
      if (prev.includes(uid)) return prev.filter((x) => x !== uid);
      return [...prev, uid];
    });
  };

  const clearSelectedParents = () => setSelectedParentIds([]);

  const setRole = async (uid, role) => {
    try {
      await updateDoc(doc(db, "users", uid), { role });
      await refresh();
    } catch (e) {
      console.warn(e);
      Alert.alert("Feil", "Kunne ikke oppdatere rolle.");
    }
  };

  const deleteUserDoc = async (uid) => {
    Alert.alert(
      "Slett bruker (Firestore)",
      "Dette sletter kun profilen i Firestore (ikke selve auth-brukeren). Fortsette?",
      [
        { text: "Avbryt", style: "cancel" },
        {
          text: "Slett",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteDoc(doc(db, "users", uid));
              await refresh();
            } catch (e) {
              console.warn(e);
              Alert.alert("Feil", "Kunne ikke slette bruker-dokument.");
            }
          },
        },
      ]
    );
  };

  const createChild = async () => {
    const name = childName.trim();
    const group = childGroup.trim();

    if (!name || !group) {
      Alert.alert("Mangler info", "Fyll inn navn og avdeling.");
      return;
    }
    if (selectedParentIds.length === 0) {
      Alert.alert("Mangler foreldre", "Velg minst én forelder.");
      return;
    }

    try {
      await addDoc(collection(db, "children"), {
        name,
        group,
        parentIds: selectedParentIds,
        status: null,
        lastUpdated: null,
        createdAt: serverTimestamp(),
      });

      setChildName("");
      setChildGroup("Harehiet");
      clearSelectedParents();
      setParentSearch("");
      await refresh();

      Alert.alert("OK", "Barn opprettet.");
    } catch (e) {
      console.warn(e);
      Alert.alert("Feil", "Kunne ikke opprette barn.");
    }
  };

  const deleteChild = async (childId) => {
    Alert.alert("Slett barn", "Er du sikker?", [
      { text: "Avbryt", style: "cancel" },
      {
        text: "Slett",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteDoc(doc(db, "children", childId));
            await refresh();
          } catch (e) {
            console.warn(e);
            Alert.alert("Feil", "Kunne ikke slette barn.");
          }
        },
      },
    ]);
  };

  if (!isAdmin) {
    return (
      <ScreenContainer centered>
        <Heading2>Ingen tilgang</Heading2>
        <Body>Du må være admin for å bruke denne siden.</Body>
      </ScreenContainer>
    );
  }

  if (loading) {
    return (
      <ScreenContainer centered>
        <Loading />
      </ScreenContainer>
    );
  }

  // --- Render helpers (ikke Card inni lista – bare rader) ---
  const renderUser = ({ item }) => {
    const role = item.role || "parent";
    const title = item.name || item.email || item.id;

    return (
      <View style={styles.listRow}>
        <View style={{ flex: 1 }}>
          <Heading3 numberOfLines={1}>{title}</Heading3>
          {item.email ? <Caption>{item.email}</Caption> : null}
          <Caption numberOfLines={1}>UID: {item.id}</Caption>
          <Caption>Rolle: {role}</Caption>

          <View style={styles.roleRow}>
            {ROLES.map((r) => (
              <TouchableOpacity
                key={r}
                onPress={() => setRole(item.id, r)}
                style={[
                  styles.rolePill,
                  role === r && {
                    borderColor: theme.colors.primary,
                    backgroundColor: theme.colors.primary + "20",
                  },
                ]}
              >
                <Caption
                  style={{
                    color:
                      role === r
                        ? theme.colors.primary
                        : theme.colors.text.secondary,
                  }}
                >
                  {r}
                </Caption>
              </TouchableOpacity>
            ))}
          </View>

          <View style={{ marginTop: theme.spacing.s }}>
            <Button
              title="Slett brukerprofil (Firestore)"
              variant="danger"
              onPress={() => deleteUserDoc(item.id)}
            />
          </View>
        </View>
      </View>
    );
  };

  const renderChild = ({ item }) => {
    const parentNames = (item.parentIds || [])
      .map((pid) => {
        const u = users.find((x) => x.id === pid);
        return u?.name || u?.email || pid;
      })
      .join(", ");

    return (
      <View style={styles.listRow}>
        <View style={{ flex: 1 }}>
          <Heading3>{item.name}</Heading3>
          <Caption>Avdeling: {item.group}</Caption>
          <Caption numberOfLines={2}>Foreldre: {parentNames || "Ingen"}</Caption>

          <View style={{ marginTop: theme.spacing.s }}>
            <Button
              title="Slett barn"
              variant="danger"
              onPress={() => deleteChild(item.id)}
            />
          </View>
        </View>
      </View>
    );
  };

  const renderParentPickItem = ({ item }) => {
    const checked = selectedParentIds.includes(item.id);
    const title = item.name || item.email || "Ukjent";

    return (
      <TouchableOpacity
        onPress={() => toggleParent(item.id)}
        style={[
          styles.pickRow,
          checked && {
            borderColor: theme.colors.primary,
            backgroundColor: theme.colors.primary + "10",
          },
        ]}
      >
        <View style={{ flex: 1 }}>
          <Body style={{ fontWeight: "600" }} numberOfLines={1}>
            {title}
          </Body>
          {item.email ? (
            <Caption numberOfLines={1} style={{ color: theme.colors.text.secondary }}>
              {item.email}
            </Caption>
          ) : null}
          <Caption numberOfLines={1} style={{ color: theme.colors.text.secondary }}>
            UID: {item.id}
          </Caption>
        </View>

        <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
          {checked ? <Caption style={styles.checkboxText}>✓</Caption> : null}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={{ paddingBottom: theme.spacing.xxl }}>
        <Heading2 style={{ marginBottom: theme.spacing.m }}>Admin</Heading2>

        <Card style={styles.infoBox}>
          <Caption style={styles.infoTitle}>Tips</Caption>
          <Caption style={styles.infoText}>
            Foreldre/ansatte må finnes i Firestore collection{" "}
            <Caption style={{ fontWeight: "700" }}>users</Caption> (med rolle), og
            barn lagres i{" "}
            <Caption style={{ fontWeight: "700" }}>children</Caption>. Hvis en
            bruker kun finnes i Authentication men ikke i Firestore, vil den ikke
            dukke opp her.
          </Caption>
        </Card>

        {/* Opprett barn */}
        <Card style={styles.sectionCard}>
          <Heading3 style={{ marginBottom: theme.spacing.s }}>Opprett barn</Heading3>

          <Input
            label="Navn"
            value={childName}
            onChangeText={setChildName}
            placeholder="F.eks. Ola"
          />

          <View style={{ height: theme.spacing.s }} />

          <Input
            label="Avdeling"
            value={childGroup}
            onChangeText={setChildGroup}
            placeholder="F.eks. Harehiet"
          />

          <View style={{ height: theme.spacing.s }} />

          <Button
            title={
              selectedParentIds.length > 0
                ? `Foreldre valgt: ${selectedParentIds.length}`
                : "Velg foreldre"
            }
            variant="outline"
            onPress={() => setParentPickerOpen(true)}
          />

          {selectedParentsPreview.length > 0 ? (
            <View style={{ marginTop: theme.spacing.s }}>
              <Caption style={{ marginBottom: 6, color: theme.colors.text.secondary }}>
                Valgte foreldre:
              </Caption>
              {selectedParentsPreview.slice(0, 3).map((p) => (
                <Caption key={p.id} numberOfLines={1}>
                  • {p.name || p.email || p.id}
                </Caption>
              ))}
              {selectedParentsPreview.length > 3 ? (
                <Caption style={{ color: theme.colors.text.secondary }}>
                  … +{selectedParentsPreview.length - 3} til
                </Caption>
              ) : null}

              <TouchableOpacity onPress={clearSelectedParents} style={{ marginTop: 8 }}>
                <Caption style={{ color: theme.colors.primary, textDecorationLine: "underline" }}>
                  Fjern valgte
                </Caption>
              </TouchableOpacity>
            </View>
          ) : null}

          <View style={{ marginTop: theme.spacing.m }}>
            <Button title="Opprett barn" onPress={createChild} />
          </View>
        </Card>

        {/* Toggles */}
        <View style={styles.toggleRow}>
          <Button
            title={showUsers ? "Skjul brukere" : "Vis brukere"}
            variant="outline"
            onPress={() => setShowUsers((p) => !p)}
            style={{ flex: 1 }}
          />
          <View style={{ width: theme.spacing.s }} />
          <Button
            title={showChildren ? "Skjul barn" : "Vis barn"}
            variant="outline"
            onPress={() => setShowChildren((p) => !p)}
            style={{ flex: 1 }}
          />
        </View>

        {/* Brukere */}
        {showUsers ? (
          <>
            <Heading3 style={{ marginTop: theme.spacing.m, marginBottom: theme.spacing.s }}>
              Brukere
            </Heading3>

            {users.length === 0 ? (
              <EmptyState title="Ingen brukere" message="Fant ingen dokumenter i users-collection." />
            ) : (
              <Card style={[styles.listCard, { height: LIST_HEIGHT }]}>
                <FlatList
                  data={users}
                  keyExtractor={(u) => u.id}
                  renderItem={renderUser}
                  showsVerticalScrollIndicator
                  contentContainerStyle={{ paddingBottom: theme.spacing.m }}
                />
              </Card>
            )}
          </>
        ) : null}

        {/* Barn */}
        {showChildren ? (
          <>
            <Heading3 style={{ marginTop: theme.spacing.m, marginBottom: theme.spacing.s }}>
              Barn
            </Heading3>

            {children.length === 0 ? (
              <EmptyState title="Ingen barn" message="Fant ingen dokumenter i children-collection." />
            ) : (
              <Card style={[styles.listCard, { height: LIST_HEIGHT }]}>
                <FlatList
                  data={children}
                  keyExtractor={(c) => c.id}
                  renderItem={renderChild}
                  showsVerticalScrollIndicator
                  contentContainerStyle={{ paddingBottom: theme.spacing.m }}
                />
              </Card>
            )}
          </>
        ) : null}
      </ScrollView>

      {/* Parent Picker Modal */}
      <Modal
        visible={parentPickerOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setParentPickerOpen(false)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setParentPickerOpen(false)}>
          <Pressable style={styles.modalCard} onPress={() => {}}>
            <View style={styles.modalHeader}>
              <Heading3>Velg foreldre</Heading3>
              <TouchableOpacity onPress={() => setParentPickerOpen(false)}>
                <Caption style={{ color: theme.colors.primary, fontWeight: "600" }}>
                  Lukk
                </Caption>
              </TouchableOpacity>
            </View>

            <Input
              label="Søk"
              value={parentSearch}
              onChangeText={setParentSearch}
              placeholder="Søk på navn, e-post eller UID"
            />

            <Caption style={{ marginTop: theme.spacing.s, color: theme.colors.text.secondary }}>
              {parentUsers.length} foreldre funnet
            </Caption>

            <View style={{ marginTop: theme.spacing.s }}>
              {parentUsers.length === 0 ? (
                <EmptyState
                  title="Ingen foreldre"
                  message="Ingen brukere med rolle 'parent' i users-collection."
                />
              ) : (
                <FlatList
                  data={parentUsers}
                  keyExtractor={(u) => u.id}
                  renderItem={renderParentPickItem}
                  contentContainerStyle={{ paddingBottom: theme.spacing.m }}
                  style={{ maxHeight: 380 }}
                />
              )}
            </View>

            <View style={{ marginTop: theme.spacing.s }}>
              <Button
                title={`Ferdig (${selectedParentIds.length} valgt)`}
                onPress={() => setParentPickerOpen(false)}
              />
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </ScreenContainer>
  );
}

const createStyles = (theme) =>
  StyleSheet.create({
    sectionCard: {
      marginBottom: theme.spacing.m,
    },

    infoBox: {
      marginBottom: theme.spacing.m,
      padding: theme.spacing.m,
      borderRadius: theme.borderRadius.m,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
    },
    infoTitle: { fontWeight: "600", marginBottom: 6 },
    infoText: { color: theme.colors.text.secondary, lineHeight: 18 },

    toggleRow: {
      flexDirection: "row",
      alignItems: "center",
      marginTop: theme.spacing.s,
    },

    // ✅ En “stor” boks som inneholder lista
    listCard: {
      padding: theme.spacing.s,
      borderRadius: theme.borderRadius.l,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
    },

    // ✅ Rad i lista (ikke Card)
    listRow: {
      padding: theme.spacing.m,
      borderRadius: theme.borderRadius.m,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.background,
      marginBottom: theme.spacing.s,
    },

    roleRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      marginTop: theme.spacing.s,
      gap: 8,
    },
    rolePill: {
      paddingVertical: 6,
      paddingHorizontal: 10,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 999,
      backgroundColor: theme.colors.surface,
    },

    modalBackdrop: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.6)",
      justifyContent: "center",
      alignItems: "center",
      padding: theme.spacing.m,
    },
    modalCard: {
      width: "100%",
      maxWidth: 520,
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.l,
      padding: theme.spacing.l,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    modalHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: theme.spacing.s,
    },

    pickRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      padding: theme.spacing.m,
      borderRadius: theme.borderRadius.m,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.background,
      marginBottom: theme.spacing.s,
    },
    checkbox: {
      width: 26,
      height: 26,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: theme.colors.border,
      alignItems: "center",
      justifyContent: "center",
    },
    checkboxChecked: {
      borderColor: theme.colors.primary,
      backgroundColor: theme.colors.primary + "20",
    },
    checkboxText: {
      color: theme.colors.primary,
      fontWeight: "700",
    },
  });
