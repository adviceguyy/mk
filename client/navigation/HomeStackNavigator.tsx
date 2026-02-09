import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import HomeScreen from "@/screens/HomeScreen";
import TranslateScreen from "@/screens/TranslateScreen";
import DressMeScreen from "@/screens/DressMeScreen";
import RecipeScreen from "@/screens/RecipeScreen";
import LiteratureScreen from "@/screens/LiteratureScreen";
import GrammarBookScreen from "@/screens/GrammarBookScreen";
import EntertainmentScreen from "@/screens/EntertainmentScreen";
import PhotoRestorationScreen from "@/screens/PhotoRestorationScreen";
import TalkToOngScreen from "@/screens/TalkToOngScreen";
import MovieStarScreen from "@/screens/MovieStarScreen";
import TikTokDanceScreen from "@/screens/TikTokDanceScreen";
import CollectionsScreen from "@/screens/CollectionsScreen";
import SavedRecipesScreen from "@/screens/SavedRecipesScreen";
import CategoryRecipesScreen from "@/screens/CategoryRecipesScreen";
import RecipeDetailScreen from "@/screens/RecipeDetailScreen";
import ExploreScreen from "@/screens/ExploreScreen";
import StoryCatalogScreen from "@/screens/StoryCatalogScreen";
import StoryReaderScreen from "@/screens/StoryReaderScreen";
import DictionaryScreen from "@/screens/DictionaryScreen";
import WheelOfFortuneScreen from "@/screens/WheelOfFortuneScreen";
import WheelLeaderboardScreen from "@/screens/WheelLeaderboardScreen";
import VocabMatchScreen from "@/screens/VocabMatchScreen";
import VocabMatchLeaderboardScreen from "@/screens/VocabMatchLeaderboardScreen";
import MienWordleScreen from "@/screens/MienWordleScreen";
import MienWordleLeaderboardScreen from "@/screens/MienWordleLeaderboardScreen";
import { HeaderTitle } from "@/components/HeaderTitle";
import { GlobalHeaderRight } from "@/components/GlobalHeaderRight";
import { GlobalHeaderLeft } from "@/components/GlobalHeaderLeft";
import { useScreenOptions } from "@/hooks/useScreenOptions";

export type HomeStackParamList = {
  Home: undefined;
  // Feature screens
  Translate: undefined;
  Literature: undefined;
  MakeMeMien: undefined;
  MienFood: undefined;
  PhotoRestoration: undefined;
  Entertainment: undefined;
  TalkToOng: undefined;
  // DressMe sub-screens
  MovieStar: { imageUri?: string; imageBase64?: string } | undefined;
  TikTokDance: { imageUri?: string; imageBase64?: string } | undefined;
  Collections: undefined;
  // Recipe sub-screens
  SavedRecipes: undefined;
  CategoryRecipes: { categoryId: string; categoryName: string };
  RecipeDetail: { recipeId: string };
  // Literature sub-screens
  GrammarBook: undefined;
  StoryCatalog: undefined;
  StoryReader: { storyId: string };
  Dictionary: undefined;
  // Game
  WheelOfFortune: undefined;
  WheelLeaderboard: undefined;
  VocabMatch: undefined;
  VocabMatchLeaderboard: undefined;
  MienWordle: undefined;
  MienWordleLeaderboard: undefined;
  // Search
  Search: undefined;
};

const Stack = createNativeStackNavigator<HomeStackParamList>();

export default function HomeStackNavigator() {
  const screenOptions = useScreenOptions();

  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen
        name="Home"
        component={HomeScreen}
        options={{
          headerTitle: () => <HeaderTitle title="" />,
          headerLeft: () => null,
          headerRight: () => <GlobalHeaderRight />,
          headerBlurEffect: undefined,
          headerTransparent: true,
        }}
      />
      {/* Feature Screens */}
      <Stack.Screen
        name="Translate"
        component={TranslateScreen}
        options={{
          headerTitle: () => <HeaderTitle title="Mien Translation" showIcon={false} themed />,
          headerRight: () => <GlobalHeaderRight />,
        }}
      />
      <Stack.Screen
        name="Literature"
        component={LiteratureScreen}
        options={{
          headerTitle: () => <HeaderTitle title="Mien Literature" showIcon={false} themed />,
          headerRight: () => <GlobalHeaderRight />,
        }}
      />
      <Stack.Screen
        name="MakeMeMien"
        component={DressMeScreen}
        options={{
          headerTitle: () => <HeaderTitle title="Make Me Mien" showIcon={false} themed />,
          headerRight: () => <GlobalHeaderRight />,
        }}
      />
      <Stack.Screen
        name="MienFood"
        component={RecipeScreen}
        options={{
          headerTitle: () => <HeaderTitle title="Mien Food" showIcon={false} themed />,
          headerRight: () => <GlobalHeaderRight />,
        }}
      />
      <Stack.Screen
        name="PhotoRestoration"
        component={PhotoRestorationScreen}
        options={{
          headerTitle: () => <HeaderTitle title="Photo Restoration" showIcon={false} themed />,
          headerRight: () => <GlobalHeaderRight />,
        }}
      />
      <Stack.Screen
        name="Entertainment"
        component={EntertainmentScreen}
        options={{
          headerTitle: () => <HeaderTitle title="Entertainment" showIcon={false} themed />,
          headerRight: () => <GlobalHeaderRight />,
        }}
      />
      <Stack.Screen
        name="WheelOfFortune"
        component={WheelOfFortuneScreen}
        options={{
          headerTitle: () => <HeaderTitle title="Wheel of Fortune" showIcon={false} themed />,
          headerRight: () => <GlobalHeaderRight />,
        }}
      />
      <Stack.Screen
        name="WheelLeaderboard"
        component={WheelLeaderboardScreen}
        options={{
          headerTitle: () => <HeaderTitle title="Leaderboard" showIcon={false} themed />,
          headerRight: () => <GlobalHeaderRight />,
        }}
      />
      <Stack.Screen
        name="VocabMatch"
        component={VocabMatchScreen}
        options={{
          headerTitle: () => <HeaderTitle title="Vocab Match" showIcon={false} themed />,
          headerRight: () => <GlobalHeaderRight />,
        }}
      />
      <Stack.Screen
        name="VocabMatchLeaderboard"
        component={VocabMatchLeaderboardScreen}
        options={{
          headerTitle: () => <HeaderTitle title="Leaderboard" showIcon={false} themed />,
          headerRight: () => <GlobalHeaderRight />,
        }}
      />
      <Stack.Screen
        name="MienWordle"
        component={MienWordleScreen}
        options={{
          headerTitle: () => <HeaderTitle title="Mien Wordle" showIcon={false} themed />,
          headerRight: () => <GlobalHeaderRight />,
        }}
      />
      <Stack.Screen
        name="MienWordleLeaderboard"
        component={MienWordleLeaderboardScreen}
        options={{
          headerTitle: () => <HeaderTitle title="Leaderboard" showIcon={false} themed />,
          headerRight: () => <GlobalHeaderRight />,
        }}
      />
      <Stack.Screen
        name="TalkToOng"
        component={TalkToOngScreen}
        options={{
          headerTitle: () => <HeaderTitle title="Companion Guides" showIcon={false} themed />,
          headerRight: () => <GlobalHeaderRight />,
        }}
      />
      {/* Literature Sub-screens */}
      <Stack.Screen
        name="GrammarBook"
        component={GrammarBookScreen}
        options={{
          headerTitle: () => <HeaderTitle title="Mien Grammar Book" showIcon={false} themed />,
          headerRight: () => <GlobalHeaderRight />,
        }}
      />
      <Stack.Screen
        name="StoryCatalog"
        component={StoryCatalogScreen}
        options={{
          headerTitle: () => <HeaderTitle title="Mien Stories" showIcon={false} themed />,
          headerRight: () => <GlobalHeaderRight />,
        }}
      />
      <Stack.Screen
        name="StoryReader"
        component={StoryReaderScreen}
        options={{
          headerTitle: () => <HeaderTitle title="Reading" showIcon={false} themed />,
          headerRight: () => <GlobalHeaderRight />,
        }}
      />
      <Stack.Screen
        name="Dictionary"
        component={DictionaryScreen}
        options={{
          headerTitle: () => <HeaderTitle title="Mien Dictionary" showIcon={false} themed />,
          headerRight: () => <GlobalHeaderRight />,
        }}
      />
      {/* DressMe Sub-screens */}
      <Stack.Screen
        name="MovieStar"
        component={MovieStarScreen}
        options={{
          headerTitle: "Movie Star",
          headerRight: () => <GlobalHeaderRight />,
        }}
      />
      <Stack.Screen
        name="TikTokDance"
        component={TikTokDanceScreen}
        options={{
          headerTitle: "TikTok Dance",
          headerRight: () => <GlobalHeaderRight />,
        }}
      />
      <Stack.Screen
        name="Collections"
        component={CollectionsScreen}
        options={{
          headerTitle: "My Creations",
          headerRight: () => <GlobalHeaderRight />,
        }}
      />
      {/* Recipe Sub-screens */}
      <Stack.Screen
        name="SavedRecipes"
        component={SavedRecipesScreen}
        options={{
          headerTitle: "My Recipes",
          headerRight: () => <GlobalHeaderRight />,
        }}
      />
      <Stack.Screen
        name="CategoryRecipes"
        component={CategoryRecipesScreen}
        options={({ route }) => ({
          headerTitle: route.params.categoryName,
          headerRight: () => <GlobalHeaderRight />,
        })}
      />
      <Stack.Screen
        name="RecipeDetail"
        component={RecipeDetailScreen}
        options={{
          headerTitle: "Recipe",
          headerRight: () => <GlobalHeaderRight />,
        }}
      />
      {/* Search */}
      <Stack.Screen
        name="Search"
        component={ExploreScreen}
        options={{
          title: "Search",
          headerRight: () => <GlobalHeaderRight />,
        }}
      />
    </Stack.Navigator>
  );
}
