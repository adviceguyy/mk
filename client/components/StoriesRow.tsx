import React, { memo } from "react";
import { View, StyleSheet, ScrollView, Pressable } from "react-native";
import { Image } from "expo-image";
import { Feather } from "@expo/vector-icons";
import Animated, { FadeIn, useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";
import Svg from "react-native-svg";

import { ThemedText } from "@/components/ThemedText";
import { SteppedDiamond } from "@/components/MienPattern";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Colors } from "@/constants/theme";

interface Story {
  id: string;
  userId: string;
  userName: string;
  avatar: string | null;
  hasUnseenStory: boolean;
}

interface StoriesRowProps {
  stories: Story[];
  currentUserId?: string;
  onStoryPress: (userId: string) => void;
  onAddStoryPress: () => void;
}

interface StoryBubbleProps {
  story: Story;
  onPress: () => void;
  isCurrentUser?: boolean;
  onAddPress?: () => void;
}

const StoryBubble = memo(function StoryBubble({
  story,
  onPress,
  isCurrentUser,
  onAddPress,
}: StoryBubbleProps) {
  const { theme, isDark } = useTheme();
  const primaryColor = isDark ? Colors.dark.primary : Colors.light.primary;
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.95, { damping: 15, stiffness: 300 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
  };

  return (
    <Animated.View style={[styles.storyContainer, animatedStyle]}>
      <Pressable
        onPress={isCurrentUser ? onAddPress : onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        {/* Story ring */}
        <View
          style={[
            styles.storyRing,
            {
              borderColor: story.hasUnseenStory
                ? primaryColor
                : theme.border,
              borderWidth: story.hasUnseenStory ? 3 : 2,
            },
          ]}
        >
          {story.avatar ? (
            <Image
              source={{ uri: story.avatar }}
              style={styles.storyAvatar}
              contentFit="cover"
            />
          ) : (
            <View style={[styles.storyAvatarPlaceholder, { backgroundColor: theme.backgroundSecondary }]}>
              <Svg width={32} height={32} viewBox="0 0 32 32">
                <SteppedDiamond cx={16} cy={16} size={10} color={primaryColor} steps={3} />
              </Svg>
            </View>
          )}
        </View>

        {/* Add button for current user */}
        {isCurrentUser && (
          <View style={[styles.addButton, { backgroundColor: primaryColor }]}>
            <Feather name="plus" size={14} color="#FFFFFF" />
          </View>
        )}
      </Pressable>

      {/* Username */}
      <ThemedText
        style={[styles.storyName, { color: theme.textSecondary }]}
        numberOfLines={1}
      >
        {isCurrentUser ? "Your Story" : story.userName.split(" ")[0]}
      </ThemedText>
    </Animated.View>
  );
});

export const StoriesRow = memo(function StoriesRow({
  stories,
  currentUserId,
  onStoryPress,
  onAddStoryPress,
}: StoriesRowProps) {
  const { theme, isDark } = useTheme();

  // Create a "Your Story" item at the beginning
  const yourStory: Story = {
    id: "your-story",
    userId: currentUserId || "",
    userName: "Your Story",
    avatar: null,
    hasUnseenStory: false,
  };

  return (
    <Animated.View
      entering={FadeIn.duration(400)}
      style={[styles.container, { backgroundColor: theme.surface }]}
    >
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Your Story */}
        <StoryBubble
          story={yourStory}
          onPress={() => {}}
          isCurrentUser
          onAddPress={onAddStoryPress}
        />

        {/* Other stories */}
        {stories.map((story) => (
          <StoryBubble
            key={story.id}
            story={story}
            onPress={() => onStoryPress(story.userId)}
          />
        ))}
      </ScrollView>
    </Animated.View>
  );
});

const STORY_SIZE = 72;
const AVATAR_SIZE = STORY_SIZE - 8;

const styles = StyleSheet.create({
  container: {
    paddingVertical: Spacing.md,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
  },
  storyContainer: {
    alignItems: "center",
    width: STORY_SIZE + 8,
  },
  storyRing: {
    width: STORY_SIZE,
    height: STORY_SIZE,
    borderRadius: STORY_SIZE / 2,
    padding: 3,
    alignItems: "center",
    justifyContent: "center",
  },
  storyAvatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
  },
  storyAvatarPlaceholder: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    alignItems: "center",
    justifyContent: "center",
  },
  addButton: {
    position: "absolute",
    bottom: 0,
    right: 4,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  storyName: {
    fontSize: 11,
    marginTop: Spacing.xs,
    textAlign: "center",
  },
});

export default StoriesRow;
