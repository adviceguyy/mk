import { createNativeStackNavigator } from "@react-navigation/native-stack";
import DressMeScreen from "@/screens/DressMeScreen";
import MovieStarScreen from "@/screens/MovieStarScreen";
import TikTokDanceScreen from "@/screens/TikTokDanceScreen";
import CollectionsScreen from "@/screens/CollectionsScreen";
import { useScreenOptions } from "@/hooks/useScreenOptions";
import { HeaderTitle } from "@/components/HeaderTitle";
import { GlobalHeaderRight } from "@/components/GlobalHeaderRight";

export type DressMeStackParamList = {
  DressMe: undefined;
  MovieStar: { imageUri?: string; imageBase64?: string } | undefined;
  TikTokDance: { imageUri?: string; imageBase64?: string } | undefined;
  Collections: undefined;
};

const Stack = createNativeStackNavigator<DressMeStackParamList>();

export default function DressMeStackNavigator() {
  const screenOptions = useScreenOptions();

  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen
        name="DressMe"
        component={DressMeScreen}
        options={{
          headerTitle: () => <HeaderTitle title="Arts" showIcon={false} />,
          headerRight: () => <GlobalHeaderRight />,
        }}
      />
      <Stack.Screen
        name="MovieStar"
        component={MovieStarScreen}
        options={{
          headerTitle: () => <HeaderTitle title="Movie Star" showIcon={false} />,
          headerRight: () => <GlobalHeaderRight />,
        }}
      />
      <Stack.Screen
        name="TikTokDance"
        component={TikTokDanceScreen}
        options={{
          headerTitle: () => <HeaderTitle title="TikTok Dance" showIcon={false} />,
          headerRight: () => <GlobalHeaderRight />,
        }}
      />
      <Stack.Screen
        name="Collections"
        component={CollectionsScreen}
        options={{
          headerTitle: () => <HeaderTitle title="My Creations" showIcon={false} />,
          headerRight: () => <GlobalHeaderRight />,
        }}
      />
    </Stack.Navigator>
  );
}
