import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { useNavigationState } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { Platform, StyleSheet, View, Text } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import HomeStackNavigator from "@/navigation/HomeStackNavigator";
import CommunityStackNavigator from "@/navigation/CommunityStackNavigator";
import ProfileStackNavigator from "@/navigation/ProfileStackNavigator";
import AdminStackNavigator from "@/navigation/AdminStackNavigator";
import MessagingStackNavigator from "@/navigation/MessagingStackNavigator";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/lib/AuthContext";
import { Colors, Spacing } from "@/constants/theme";

// Helper to get the current tab name
function getCurrentTabName(state: any): string | undefined {
  if (!state || !state.routes) return undefined;
  return state.routes[state.index]?.name;
}

export type MainTabParamList = {
  HomeTab: undefined;
  CommunityTab: undefined;
  ProfileTab: undefined;
  AdminTab: undefined;
  MessagesTab: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();

function CreditBadge() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const navigationState = useNavigationState((state) => state);
  const currentTab = getCurrentTabName(navigationState);

  // Show credit badge on Home tab (which has AI features)
  const aiTabs = ["HomeTab"];
  const isAITab = currentTab && aiTabs.includes(currentTab);

  if (!user || !isAITab) return null;

  const credits = user.credits ?? 0;
  const isUnlimited = credits >= 99999;

  return (
    <View
      style={[
        styles.creditBadge,
        {
          backgroundColor: theme.surface,
          bottom: insets.bottom + 78,
          borderColor: theme.border,
        },
      ]}
    >
      <Feather name="zap" size={14} color="#F59E0B" />
      <Text style={[styles.creditText, { color: theme.text }]}>
        {isUnlimited ? "Unlimited" : credits}
      </Text>
    </View>
  );
}

export default function MainTabNavigator() {
  const { theme, isDark } = useTheme();
  const { user } = useAuth();

  const isAdminOrModerator = user?.role === "admin" || user?.role === "moderator";

  const activeColor = isDark ? Colors.dark.heritage.gold : Colors.light.heritage.gold;
  const inactiveColor = theme.tabIconDefault;

  return (
    <View style={{ flex: 1 }}>
    <Tab.Navigator
      initialRouteName="HomeTab"
      screenOptions={{
        tabBarActiveTintColor: activeColor,
        tabBarInactiveTintColor: inactiveColor,
        tabBarShowLabel: true,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
          marginTop: 2,
        },
        tabBarStyle: {
          position: "absolute",
          backgroundColor: Platform.select({
            ios: "transparent",
            android: theme.backgroundRoot,
            web: theme.backgroundRoot,
          }),
          borderTopWidth: 0,
          elevation: 0,
          height: 70,
          paddingTop: 8,
          paddingHorizontal: 0,
        },
        tabBarItemStyle: {
          paddingHorizontal: 0,
          marginHorizontal: 0,
          flex: 1,
        },
        tabBarBackground: () =>
          Platform.OS === "ios" ? (
            <BlurView
              intensity={100}
              tint={isDark ? "dark" : "light"}
              style={StyleSheet.absoluteFill}
            />
          ) : null,
        headerShown: false,
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeStackNavigator}
        options={{
          tabBarLabel: "Home",
          tabBarIcon: ({ focused, color }) => (
            <Feather name="home" size={24} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="CommunityTab"
        component={CommunityStackNavigator}
        options={{
          tabBarLabel: "Community",
          tabBarIcon: ({ focused, color }) => (
            <Feather name="users" size={24} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileStackNavigator}
        options={{
          tabBarLabel: "Profile",
          tabBarIcon: ({ focused, color }) => (
            <Feather name="user" size={24} color={color} />
          ),
        }}
      />
      {/* Admin Tab - Hidden from tab bar, accessible via header icon for admin/moderator users */}
      {isAdminOrModerator && (
        <Tab.Screen
          name="AdminTab"
          component={AdminStackNavigator}
          options={{
            tabBarButton: () => null,
            tabBarItemStyle: { display: "none", width: 0, flex: 0 },
          }}
        />
      )}
      {/* Messages Tab - Hidden from tab bar, accessible via header icon */}
      <Tab.Screen
        name="MessagesTab"
        component={MessagingStackNavigator}
        options={{
          tabBarButton: () => null,
          tabBarItemStyle: { display: "none", width: 0, flex: 0 },
        }}
      />
    </Tab.Navigator>
    <CreditBadge />
    </View>
  );
}

const styles = StyleSheet.create({
  creditBadge: {
    position: "absolute",
    right: Spacing.md,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  creditText: {
    fontSize: 13,
    fontWeight: "600",
  },
});
