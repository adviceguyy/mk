import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import ProfileScreen from "@/screens/ProfileScreen";
import EditProfileScreen from "@/screens/EditProfileScreen";
import HelpScreen from "@/screens/HelpScreen";
import SupportScreen from "@/screens/SupportScreen";
import SubscriptionScreen from "@/screens/SubscriptionScreen";
import TicketListScreen from "@/screens/TicketListScreen";
import TicketDetailScreen from "@/screens/TicketDetailScreen";
import UserPostsScreen from "@/screens/UserPostsScreen";
import PrivacySettingsScreen from "@/screens/PrivacySettingsScreen";
import NotificationSettingsScreen from "@/screens/NotificationSettingsScreen";
import MutedUsersScreen from "@/screens/MutedUsersScreen";
import BlockedUsersScreen from "@/screens/BlockedUsersScreen";
import AboutScreen from "@/screens/AboutScreen";
import { useScreenOptions } from "@/hooks/useScreenOptions";
import { HeaderTitle } from "@/components/HeaderTitle";
import { GlobalHeaderRight } from "@/components/GlobalHeaderRight";

export type ProfileStackParamList = {
  Menu: undefined;
  EditProfile: undefined;
  NotificationSettings: undefined;
  Privacy: undefined;
  MutedUsers: undefined;
  BlockedUsers: undefined;
  Help: undefined;
  Support: undefined;
  Subscription: undefined;
  TicketList: undefined;
  TicketDetail: { ticketId: string; subject: string };
  MyProfile: { userId: string; userName: string };
  About: undefined;
};

const Stack = createNativeStackNavigator<ProfileStackParamList>();

export default function ProfileStackNavigator() {
  const screenOptions = useScreenOptions();

  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen
        name="Menu"
        component={ProfileScreen}
        options={{
          headerTitle: () => <HeaderTitle title="Menu" />,
          headerRight: () => <GlobalHeaderRight />,
        }}
      />
      <Stack.Screen
        name="EditProfile"
        component={EditProfileScreen}
        options={{
          title: "Edit Profile",
          headerRight: () => <GlobalHeaderRight />,
        }}
      />
      <Stack.Screen
        name="NotificationSettings"
        component={NotificationSettingsScreen}
        options={{
          title: "Notifications",
          headerRight: () => <GlobalHeaderRight />,
        }}
      />
      <Stack.Screen
        name="Privacy"
        component={PrivacySettingsScreen}
        options={{
          title: "Privacy Settings",
          headerRight: () => <GlobalHeaderRight />,
        }}
      />
      <Stack.Screen
        name="MutedUsers"
        component={MutedUsersScreen}
        options={{
          title: "Muted Users",
          headerRight: () => <GlobalHeaderRight />,
        }}
      />
      <Stack.Screen
        name="BlockedUsers"
        component={BlockedUsersScreen}
        options={{
          title: "Blocked Users",
          headerRight: () => <GlobalHeaderRight />,
        }}
      />
      <Stack.Screen
        name="Help"
        component={HelpScreen}
        options={{
          title: "Help",
          headerRight: () => <GlobalHeaderRight />,
        }}
      />
      <Stack.Screen
        name="Support"
        component={SupportScreen}
        options={{
          title: "Contact Us",
          headerRight: () => <GlobalHeaderRight />,
        }}
      />
      <Stack.Screen
        name="Subscription"
        component={SubscriptionScreen}
        options={{
          title: "My Subscription",
          headerRight: () => <GlobalHeaderRight />,
        }}
      />
      <Stack.Screen
        name="TicketList"
        component={TicketListScreen}
        options={{
          title: "My Tickets",
          headerRight: () => <GlobalHeaderRight />,
        }}
      />
      <Stack.Screen
        name="TicketDetail"
        component={TicketDetailScreen}
        options={({ route }) => ({
          title: route.params.subject,
          headerRight: () => <GlobalHeaderRight />,
        })}
      />
      <Stack.Screen
        name="MyProfile"
        component={UserPostsScreen}
        options={({ route }) => ({
          title: route.params.userName,
          headerRight: () => <GlobalHeaderRight />,
        })}
      />
      <Stack.Screen
        name="About"
        component={AboutScreen}
        options={{
          title: "About Mien Kingdom",
          headerRight: () => <GlobalHeaderRight />,
        }}
      />
    </Stack.Navigator>
  );
}
