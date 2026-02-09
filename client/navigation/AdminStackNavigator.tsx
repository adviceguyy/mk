import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import AdminDashboardScreen from "@/screens/admin/AdminDashboardScreen";
import AdminUsersScreen from "@/screens/admin/AdminUsersScreen";
import AdminReportsScreen from "@/screens/admin/AdminReportsScreen";
import AdminUsageReportsScreen from "@/screens/admin/AdminUsageReportsScreen";
import AdminGroupsScreen from "@/screens/admin/AdminGroupsScreen";
import IntegrationSettingsScreen from "@/screens/admin/IntegrationSettingsScreen";
import BillingSettingsScreen from "@/screens/admin/BillingSettingsScreen";
import AdminUtilitiesScreen from "@/screens/admin/AdminUtilitiesScreen";
import PromptsSettingsScreen from "@/screens/admin/PromptsSettingsScreen";
import { useScreenOptions } from "@/hooks/useScreenOptions";

export type AdminStackParamList = {
  AdminDashboard: undefined;
  AdminUsers: undefined;
  AdminReports: undefined;
  AdminUsageReports: undefined;
  AdminGroups: undefined;
  IntegrationSettings: undefined;
  BillingSettings: undefined;
  PromptsSettings: undefined;
  AdminUtilities: undefined;
};

const Stack = createNativeStackNavigator<AdminStackParamList>();

export default function AdminStackNavigator() {
  const screenOptions = useScreenOptions();

  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen
        name="AdminDashboard"
        component={AdminDashboardScreen}
        options={{ headerTitle: "Admin" }}
      />
      <Stack.Screen
        name="AdminUsers"
        component={AdminUsersScreen}
        options={{ headerTitle: "Users" }}
      />
      <Stack.Screen
        name="AdminReports"
        component={AdminReportsScreen}
        options={{ headerTitle: "Reports" }}
      />
      <Stack.Screen
        name="AdminUsageReports"
        component={AdminUsageReportsScreen}
        options={{ headerTitle: "Usage Analytics" }}
      />
      <Stack.Screen
        name="AdminGroups"
        component={AdminGroupsScreen}
        options={{ headerTitle: "Groups" }}
      />
      <Stack.Screen
        name="IntegrationSettings"
        component={IntegrationSettingsScreen}
        options={{ headerTitle: "Integration Settings" }}
      />
      <Stack.Screen
        name="BillingSettings"
        component={BillingSettingsScreen}
        options={{ headerTitle: "Billing Settings" }}
      />
      <Stack.Screen
        name="PromptsSettings"
        component={PromptsSettingsScreen}
        options={{ headerTitle: "AI Settings" }}
      />
      <Stack.Screen
        name="AdminUtilities"
        component={AdminUtilitiesScreen}
        options={{ headerTitle: "Utilities" }}
      />
    </Stack.Navigator>
  );
}
