import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { View, Pressable } from "react-native";
import { Image } from "expo-image";
import { Feather } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

import ConversationListScreen from "@/screens/messaging/ConversationListScreen";
import ChatScreen from "@/screens/messaging/ChatScreen";
import { useScreenOptions } from "@/hooks/useScreenOptions";
import { GlobalHeaderRight } from "@/components/GlobalHeaderRight";
import { useTheme } from "@/hooks/useTheme";

export type MessagingStackParamList = {
  Conversations: undefined;
  Chat: {
    conversationId: string;
    participantName: string;
    participantId: string;
    participantAvatar?: string;
  };
};

const Stack = createNativeStackNavigator<MessagingStackParamList>();

function ChatHeaderTitle({ name, avatar }: { name: string; avatar?: string }) {
  const { theme } = useTheme();

  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
      {avatar ? (
        <Image
          source={{ uri: avatar }}
          style={{ width: 32, height: 32, borderRadius: 16 }}
          contentFit="cover"
        />
      ) : (
        <View
          style={{
            width: 32,
            height: 32,
            borderRadius: 16,
            backgroundColor: theme.backgroundSecondary,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Feather name="user" size={16} color={theme.textSecondary} />
        </View>
      )}
      <View>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
          <Feather name="lock" size={10} color={theme.textSecondary} />
        </View>
      </View>
    </View>
  );
}

export default function MessagingStackNavigator() {
  const screenOptions = useScreenOptions();
  const navigation = useNavigation();
  const { theme } = useTheme();

  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen
        name="Conversations"
        component={ConversationListScreen}
        options={{
          title: "Messages",
          headerRight: () => <GlobalHeaderRight />,
        }}
      />
      <Stack.Screen
        name="Chat"
        component={ChatScreen}
        options={({ route }) => ({
          title: route.params.participantName,
          headerBackTitle: "Back",
          headerRight: () => (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
              <Feather name="lock" size={14} color={theme.textSecondary} />
            </View>
          ),
        })}
      />
    </Stack.Navigator>
  );
}
