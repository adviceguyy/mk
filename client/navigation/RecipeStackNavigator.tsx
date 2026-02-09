import { createNativeStackNavigator } from "@react-navigation/native-stack";
import RecipeScreen from "@/screens/RecipeScreen";
import SavedRecipesScreen from "@/screens/SavedRecipesScreen";
import CategoryRecipesScreen from "@/screens/CategoryRecipesScreen";
import RecipeDetailScreen from "@/screens/RecipeDetailScreen";
import { useScreenOptions } from "@/hooks/useScreenOptions";
import { HeaderTitle } from "@/components/HeaderTitle";
import { GlobalHeaderRight } from "@/components/GlobalHeaderRight";

export type RecipeStackParamList = {
  Recipe: undefined;
  SavedRecipes: undefined;
  CategoryRecipes: { categoryId: string; categoryName: string };
  RecipeDetail: { recipeId: string };
};

const Stack = createNativeStackNavigator<RecipeStackParamList>();

export default function RecipeStackNavigator() {
  const screenOptions = useScreenOptions();

  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen
        name="Recipe"
        component={RecipeScreen}
        options={{
          headerTitle: () => <HeaderTitle title="Food" showIcon={false} />,
          headerRight: () => <GlobalHeaderRight />,
        }}
      />
      <Stack.Screen
        name="SavedRecipes"
        component={SavedRecipesScreen}
        options={{
          headerTitle: () => <HeaderTitle title="My Recipes" showIcon={false} />,
          headerRight: () => <GlobalHeaderRight />,
        }}
      />
      <Stack.Screen
        name="CategoryRecipes"
        component={CategoryRecipesScreen}
        options={({ route }) => ({
          headerTitle: () => <HeaderTitle title={route.params.categoryName} showIcon={false} />,
          headerRight: () => <GlobalHeaderRight />,
        })}
      />
      <Stack.Screen
        name="RecipeDetail"
        component={RecipeDetailScreen}
        options={{
          headerTitle: () => <HeaderTitle title="Recipe" showIcon={false} />,
          headerRight: () => <GlobalHeaderRight />,
        }}
      />
    </Stack.Navigator>
  );
}
