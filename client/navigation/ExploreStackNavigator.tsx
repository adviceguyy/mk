import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import ExploreScreen from "@/screens/ExploreScreen";
import { useScreenOptions } from "@/hooks/useScreenOptions";

export type ExploreStackParamList = {
  Explore: undefined;
};

const Stack = createNativeStackNavigator<ExploreStackParamList>();

export default function ExploreStackNavigator() {
  const screenOptions = useScreenOptions();

  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen
        name="Explore"
        component={ExploreScreen}
        options={{
          headerTitle: "Discover",
        }}
      />
    </Stack.Navigator>
  );
}
