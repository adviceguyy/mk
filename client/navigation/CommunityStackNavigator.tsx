import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import CommunityScreen from "@/screens/CommunityScreen";
import FollowingScreen from "@/screens/FollowingScreen";
import UserPostsScreen from "@/screens/UserPostsScreen";
import ExploreScreen from "@/screens/ExploreScreen";
import TalkToOngScreen from "@/screens/TalkToOngScreen";
import { HeaderTitle } from "@/components/HeaderTitle";
import { GlobalHeaderRight } from "@/components/GlobalHeaderRight";
import { GlobalHeaderLeft } from "@/components/GlobalHeaderLeft";
import { useScreenOptions } from "@/hooks/useScreenOptions";

export type CommunityStackParamList = {
  Community: undefined;
  Following: undefined;
  UserPosts: { userId: string; userName: string };
  Search: undefined;
  TalkToOng: undefined;
};

const Stack = createNativeStackNavigator<CommunityStackParamList>();

export default function CommunityStackNavigator() {
  const screenOptions = useScreenOptions();

  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen
        name="Community"
        component={CommunityScreen}
        options={{
          headerTitle: () => <HeaderTitle title="Mien Kingdom" />,
          headerLeft: () => null,
          headerRight: () => <GlobalHeaderRight />,
        }}
      />
      <Stack.Screen
        name="Following"
        component={FollowingScreen}
        options={{
          headerTitle: "Following",
          headerRight: () => <GlobalHeaderRight />,
        }}
      />
      <Stack.Screen
        name="UserPosts"
        component={UserPostsScreen}
        options={({ route }) => ({
          headerTitle: route.params.userName || "Posts",
          headerRight: () => <GlobalHeaderRight />,
        })}
      />
      <Stack.Screen
        name="Search"
        component={ExploreScreen}
        options={{
          title: "Search",
          headerRight: () => <GlobalHeaderRight />,
        }}
      />
      <Stack.Screen
        name="TalkToOng"
        component={TalkToOngScreen}
        options={{
          headerTitle: "Talk to Ong",
          headerRight: () => <GlobalHeaderRight />,
        }}
      />
    </Stack.Navigator>
  );
}
