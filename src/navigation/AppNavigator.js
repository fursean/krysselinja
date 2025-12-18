// navigation/AppNavigator.js
import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import LoginScreen from "../screens/LoginScreen";
import DashboardScreen from "../screens/DashboardScreen";
import ChildProfileScreen from "../screens/ChildProfileScreen";
import GroupChildrenScreen from "../screens/GroupChildrenScreen";
import AdminScreen from "../screens/AdminScreen";
import { theme } from "../theme";

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      {/* Stack med alle skjermene i appen */}
      <Stack.Navigator
        initialRouteName="Login"
        screenOptions={{
          headerStyle: {
            backgroundColor: theme.colors.surface,
          },
          headerTintColor: theme.colors.primary,
          headerTitleStyle: {
            fontWeight: "600",
            color: theme.colors.text.primary,
          },
          contentStyle: {
            backgroundColor: theme.colors.background,
          },
        }}
      >
        {/* Innlogging */}
        <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={{ title: "Logg inn" }}
        />

        {/* Hovedskjerm etter innlogging */}
        <Stack.Screen
          name="Dashboard"
          component={DashboardScreen}
          options={{ title: "Krysselista" }}
        />

        {/* Barnets profil */}
        <Stack.Screen
          name="ChildProfile"
          component={ChildProfileScreen}
          options={{ title: "Barn" }}
        />

        {/* Avdeling med flere barn */}
        <Stack.Screen
          name="GroupChildren"
          component={GroupChildrenScreen}
          options={{ title: "Avdeling" }}
        />

        {/* Admin skjerm */}
        <Stack.Screen
          name="Admin"
          component={AdminScreen}
          options={{ title: "Admin" }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
