import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import TranslateScreen from "@/screens/TranslateScreen";
import { useScreenOptions } from "@/hooks/useScreenOptions";
import { HeaderTitle } from "@/components/HeaderTitle";
import { GlobalHeaderRight } from "@/components/GlobalHeaderRight";

export type TranslateStackParamList = {
  Translate: undefined;
};

const Stack = createNativeStackNavigator<TranslateStackParamList>();

export default function TranslateStackNavigator() {
  const screenOptions = useScreenOptions();

  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen
        name="Translate"
        component={TranslateScreen}
        options={{
          headerTitle: () => <HeaderTitle title="Language" showIcon={false} />,
          headerRight: () => <GlobalHeaderRight />,
        }}
      />
    </Stack.Navigator>
  );
}
