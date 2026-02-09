import React, { useState, useCallback } from "react";
import { View, FlatList, StyleSheet, RefreshControl, Pressable, Modal, TextInput, Platform, ActivityIndicator, ScrollView, Alert, KeyboardAvoidingView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { Image } from "expo-image";
import { Video, ResizeMode } from "expo-av";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/lib/AuthContext";
import { useVideoUpload } from "@/hooks/useVideoUpload";
import { Spacing, BorderRadius, Colors } from "@/constants/theme";
import { ThemedText } from "@/components/ThemedText";
import { PostCard } from "@/components/PostCard";
import { RichTextEditor, RichTextStyle } from "@/components/RichTextEditor";
import { FloatingActionButton } from "@/components/FloatingActionButton";
import { User, Post, SocialPlatform, PostVisibility } from "@/lib/types";
import { getApiUrl } from "@/lib/query-client";
import { useXp } from "@/lib/XpContext";
import { CommunityStackParamList } from "@/navigation/CommunityStackNavigator";

const backgroundTop = require("../../assets/images/background-top-transparent.png");
const backgroundBottom = require("../../assets/images/background-bottom-transparent.png");

type CommunityScreenNavigationProp = NativeStackNavigationProp<CommunityStackParamList, "Community">;

interface Comment {
  id: string;
  content: string;
  createdAt: Date;
  user: { id: string; displayName: string; avatar: string | null } | null;
}

const fetchTrendingPosts = async () => {
  const token = await AsyncStorage.getItem("@mien_kingdom_session");
  const response = await fetch(new URL("/api/posts/trending", getApiUrl()).toString(), {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) return { posts: [] };
  const data = await response.json();
  return data;
};

const uploadImages = async (images: ImagePicker.ImagePickerAsset[]): Promise<string[]> => {
  const token = await AsyncStorage.getItem("@mien_kingdom_session");
  const formData = new FormData();

  for (const image of images) {
    const filename = image.uri.split("/").pop() || `image-${Date.now()}.jpg`;

    if (Platform.OS === "web") {
      const response = await fetch(image.uri);
      const blob = await response.blob();
      formData.append("images", blob, filename);
    } else {
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : "image/jpeg";
      formData.append("images", {
        uri: image.uri,
        name: filename,
        type,
      } as unknown as Blob);
    }
  }

  const response = await fetch(new URL("/api/upload/images", getApiUrl()).toString(), {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to upload images");
  }

  const data = await response.json();
  return data.images;
};

const createPost = async (postData: { platform?: string | null; mediaUrl?: string; caption: string; captionRich?: any; images?: string[]; visibility?: string; videoId?: string }) => {
  const token = await AsyncStorage.getItem("@mien_kingdom_session");
  const response = await fetch(new URL("/api/posts", getApiUrl()).toString(), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(postData),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to create post");
  }
  return response.json();
};

const updatePost = async (postId: string, postData: { platform?: string | null; mediaUrl?: string; caption: string; captionRich?: any; images?: string[]; visibility?: string }) => {
  const token = await AsyncStorage.getItem("@mien_kingdom_session");
  const response = await fetch(new URL(`/api/posts/${postId}`, getApiUrl()).toString(), {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(postData),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to update post");
  }
  return response.json();
};

export default function CommunityScreen() {
  const navigation = useNavigation<CommunityScreenNavigationProp>();
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const { theme, isDark } = useTheme();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { notifyXpGain } = useXp();

  const [refreshing, setRefreshing] = useState(false);
  const [showPostModal, setShowPostModal] = useState(false);
  const [showMediaOptions, setShowMediaOptions] = useState(false);
  const [newPostPlatform, setNewPostPlatform] = useState<SocialPlatform | null>(null);
  const [newPostUrl, setNewPostUrl] = useState("");
  const [newPostCaption, setNewPostCaption] = useState("");
  const [postError, setPostError] = useState<string | null>(null);
  const [selectedImages, setSelectedImages] = useState<ImagePicker.ImagePickerAsset[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [showCommentsModal, setShowCommentsModal] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loadingComments, setLoadingComments] = useState(false);
  const [showRichEditor, setShowRichEditor] = useState(false);
  const [captionStyle, setCaptionStyle] = useState<RichTextStyle>({});
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editCaption, setEditCaption] = useState("");
  const [editUrl, setEditUrl] = useState("");
  const [editCaptionStyle, setEditCaptionStyle] = useState<RichTextStyle>({});
  const [showEditRichEditor, setShowEditRichEditor] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [isEditSubmitting, setIsEditSubmitting] = useState(false);
  const [postVisibility, setPostVisibility] = useState<PostVisibility>("public");
  const [editVisibility, setEditVisibility] = useState<PostVisibility>("public");
  const [selectedVideo, setSelectedVideo] = useState<{ uri: string; name: string; type: string } | null>(null);

  const { state: videoUploadState, uploadVideo, reset: resetVideoUpload } = useVideoUpload();

  const { data: postsData } = useQuery({
    queryKey: ["/api/posts/trending"],
    queryFn: fetchTrendingPosts,
  });

  const postMutation = useMutation({
    mutationFn: createPost,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts/trending"] });
      handleCloseModal();
      notifyXpGain(10, false);
    },
    onError: (error: Error) => {
      setPostError(error.message);
    },
  });

  const posts = postsData?.posts || [];

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    queryClient.invalidateQueries({ queryKey: ["/api/posts/trending"] });
    setTimeout(() => {
      setRefreshing(false);
    }, 1500);
  }, [queryClient]);


  const handleUserPress = (userId: string) => {
    const postUser = posts.find((p: Post) => p.userId === userId)?.user;
    navigation.navigate("UserPosts", { userId, userName: postUser?.displayName || "" });
  };

  const handleLike = async (postId: string) => {
    queryClient.setQueryData(["/api/posts/trending"], (oldData: any) => {
      if (!oldData?.posts) return oldData;
      return {
        ...oldData,
        posts: oldData.posts.map((p: any) =>
          p.id === postId
            ? { ...p, isLiked: !p.isLiked, likesCount: p.isLiked ? p.likesCount - 1 : p.likesCount + 1 }
            : p
        ),
      };
    });

    try {
      const token = await AsyncStorage.getItem("@mien_kingdom_session");
      const response = await fetch(new URL(`/api/posts/${postId}/like`, getApiUrl()).toString(), {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        queryClient.invalidateQueries({ queryKey: ["/api/posts/trending"] });
      }
    } catch (error) {
      console.error("Error liking post:", error);
      queryClient.invalidateQueries({ queryKey: ["/api/posts/trending"] });
    }
  };

  const handleDelete = async (postId: string) => {
    const deletePost = async () => {
      try {
        const token = await AsyncStorage.getItem("@mien_kingdom_session");
        const response = await fetch(new URL(`/api/posts/${postId}`, getApiUrl()).toString(), {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.ok) {
          queryClient.invalidateQueries({ queryKey: ["/api/posts/trending"] });
        } else {
          if (Platform.OS === "web") {
            window.alert("Failed to delete post");
          } else {
            Alert.alert("Error", "Failed to delete post");
          }
        }
      } catch (error) {
        console.error("Error deleting post:", error);
        if (Platform.OS === "web") {
          window.alert("Failed to delete post");
        } else {
          Alert.alert("Error", "Failed to delete post");
        }
      }
    };

    if (Platform.OS === "web") {
      if (window.confirm("Are you sure you want to delete this post?")) {
        deletePost();
      }
    } else {
      Alert.alert(
        "Delete Post",
        "Are you sure you want to delete this post?",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Delete", style: "destructive", onPress: deletePost },
        ]
      );
    }
  };

  const handleEdit = (post: Post) => {
    setEditingPost(post);
    setEditCaption(post.caption || "");
    setEditUrl(post.mediaUrl || "");
    setEditCaptionStyle(post.captionRich?.style || {});
    setEditVisibility(post.visibility || "public");
    setEditError(null);
    setShowEditModal(true);
  };

  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setEditingPost(null);
    setEditCaption("");
    setEditUrl("");
    setEditCaptionStyle({});
    setShowEditRichEditor(false);
    setEditError(null);
    setIsEditSubmitting(false);
    setEditVisibility("public");
  };

  const handleUpdatePost = async () => {
    if (!editingPost) return;
    
    const hasContent = editCaption.trim() || editUrl.trim() || (editingPost.images && editingPost.images.length > 0);
    if (!hasContent) {
      setEditError("Please add some text, images, or a video link");
      return;
    }
    setEditError(null);
    setIsEditSubmitting(true);

    try {
      const hasRichFormatting = editCaptionStyle.fontSize || editCaptionStyle.fontWeight === "bold" || 
        editCaptionStyle.fontStyle === "italic" || editCaptionStyle.textColor || editCaptionStyle.backgroundColor;

      await updatePost(editingPost.id, {
        platform: editUrl.trim() ? editingPost.platform : null,
        mediaUrl: editUrl.trim() || "",
        caption: editCaption.trim(),
        captionRich: hasRichFormatting ? { text: editCaption.trim(), style: editCaptionStyle } : undefined,
        images: editingPost.images || [],
        visibility: editVisibility,
      });

      queryClient.invalidateQueries({ queryKey: ["/api/posts/trending"] });
      handleCloseEditModal();
      
      if (Platform.OS === "web") {
        window.alert("Post updated successfully");
      } else {
        Alert.alert("Success", "Post updated successfully");
      }
    } catch (error) {
      console.error("Error updating post:", error);
      setEditError(error instanceof Error ? error.message : "Failed to update post");
    } finally {
      setIsEditSubmitting(false);
    }
  };

  const fetchComments = async (postId: string) => {
    setLoadingComments(true);
    try {
      const response = await fetch(new URL(`/api/posts/${postId}/comments`, getApiUrl()).toString());
      if (response.ok) {
        const data = await response.json();
        setComments(data.comments);
      }
    } catch (error) {
      console.error("Error fetching comments:", error);
    } finally {
      setLoadingComments(false);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || !selectedPostId) return;

    try {
      const token = await AsyncStorage.getItem("@mien_kingdom_session");
      const response = await fetch(new URL(`/api/posts/${selectedPostId}/comments`, getApiUrl()).toString(), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content: newComment.trim() }),
      });
      if (response.ok) {
        const data = await response.json();
        setComments((prev) => [data.comment, ...prev]);
        setNewComment("");
        queryClient.invalidateQueries({ queryKey: ["/api/posts/trending"] });
        notifyXpGain(1, false);
      }
    } catch (error) {
      console.error("Error adding comment:", error);
    }
  };

  const handlePickImages = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsMultipleSelection: true,
        quality: 0.8,
        selectionLimit: 10 - selectedImages.length,
      });

      if (!result.canceled && result.assets.length > 0) {
        const newImages = [...selectedImages, ...result.assets].slice(0, 10);
        setSelectedImages(newImages);
        setPostError(null);
      }
    } catch (error) {
      console.error("Error picking images:", error);
      if (Platform.OS !== "web") {
        Alert.alert("Error", "Failed to pick images. Please try again.");
      }
    }
  };

  const handleRemoveImage = (index: number) => {
    setSelectedImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handlePickVideo = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["videos"],
        allowsEditing: true,
        quality: 1,
        videoMaxDuration: 300, // 5 minutes max
      });

      if (!result.canceled && result.assets.length > 0) {
        const asset = result.assets[0];
        setSelectedVideo({
          uri: asset.uri,
          name: asset.fileName || `video-${Date.now()}.mp4`,
          type: asset.mimeType || "video/mp4",
        });
        setPostError(null);
      }
    } catch (error) {
      console.error("Error picking video:", error);
      if (Platform.OS !== "web") {
        Alert.alert("Error", "Failed to select video. Please try again.");
      }
    }
  };

  const handleRemoveVideo = () => {
    setSelectedVideo(null);
    resetVideoUpload();
  };

  const handleCreatePost = async () => {
    const hasContent = newPostCaption.trim() || newPostUrl.trim() || selectedImages.length > 0 || selectedVideo;
    if (!hasContent) {
      setPostError("Please add some text, images, or a video");
      return;
    }
    setPostError(null);
    setIsUploading(true);

    try {
      let uploadedImageUrls: string[] = [];
      let videoId: string | undefined;

      if (selectedImages.length > 0) {
        uploadedImageUrls = await uploadImages(selectedImages);
      }

      // Upload video if selected
      if (selectedVideo) {
        const uploadedVideoId = await uploadVideo(selectedVideo);
        if (!uploadedVideoId) {
          if (videoUploadState.error) {
            setPostError(videoUploadState.error);
          } else {
            setPostError("Video upload failed or was cancelled");
          }
          setIsUploading(false);
          return;
        }
        videoId = uploadedVideoId;
      }

      const hasRichFormatting = captionStyle.fontSize || captionStyle.fontWeight === "bold" ||
        captionStyle.fontStyle === "italic" || captionStyle.textColor || captionStyle.backgroundColor;

      await postMutation.mutateAsync({
        platform: newPostUrl.trim() ? newPostPlatform : null,
        mediaUrl: newPostUrl.trim() || "",
        caption: newPostCaption.trim(),
        captionRich: hasRichFormatting ? { text: newPostCaption.trim(), style: captionStyle } : undefined,
        images: uploadedImageUrls,
        visibility: postVisibility,
        videoId,
      });
    } catch (error) {
      console.error("Error creating post:", error);
      setPostError(error instanceof Error ? error.message : "Failed to create post");
    } finally {
      setIsUploading(false);
    }
  };

  const handleCloseModal = () => {
    setShowPostModal(false);
    setNewPostUrl("");
    setNewPostCaption("");
    setNewPostPlatform(null);
    setShowMediaOptions(false);
    setPostError(null);
    setSelectedImages([]);
    setSelectedVideo(null);
    resetVideoUpload();
    setIsUploading(false);
    setShowRichEditor(false);
    setCaptionStyle({});
    setPostVisibility("public");
  };

  const platforms: { key: SocialPlatform; label: string; icon: string }[] = [
    { key: "youtube", label: "YouTube", icon: "youtube" },
  ];

  const handleComment = (postId: string) => {
    setSelectedPostId(postId);
    fetchComments(postId);
    setShowCommentsModal(true);
  };

  const handleShare = (postId: string) => {
    console.log("Share post:", postId);
  };


  const isSubmitting = postMutation.isPending || isUploading || videoUploadState.phase === "uploading" || videoUploadState.phase === "processing";
  const isVideoProcessing = videoUploadState.phase !== "idle" && videoUploadState.phase !== "ready" && videoUploadState.phase !== "error";

  return (
    <View style={{ flex: 1, backgroundColor: isDark ? "#1a1a1a" : "#F5EDD8" }}>
      <Image source={backgroundTop} style={styles.backgroundTop} contentFit="cover" />
      <Image source={backgroundBottom} style={styles.backgroundBottom} contentFit="cover" />
      <FlatList
        style={{ flex: 1, zIndex: 1 }}
        contentContainerStyle={{
          paddingTop: headerHeight + Spacing.lg,
          paddingBottom: tabBarHeight + Spacing["3xl"] + 60,
          paddingHorizontal: Spacing.lg,
        }}
        scrollIndicatorInsets={{ bottom: insets.bottom }}
        data={posts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <PostCard
            post={item}
            onLike={handleLike}
            onComment={handleComment}
            onShare={handleShare}
            onUserPress={handleUserPress}
            onDelete={handleDelete}
            onEdit={handleEdit}
            currentUserId={user?.id}
            isAdmin={user?.role === "admin"}
          />
        )}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.textSecondary}
            progressViewOffset={headerHeight}
          />
        }
      />

      <FloatingActionButton
        onPress={() => setShowPostModal(true)}
        icon="plus"
        bottom={tabBarHeight + 20}
      />

      <Modal
        visible={showPostModal}
        transparent
        animationType="slide"
        onRequestClose={handleCloseModal}
      >
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <View style={styles.modalOverlay}>
            <Pressable style={StyleSheet.absoluteFill} onPress={handleCloseModal} />
            <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
              <View style={styles.modalHeader}>
                <ThemedText style={styles.modalTitle}>Create Post</ThemedText>
                <Pressable onPress={handleCloseModal}>
                  <Feather name="x" size={24} color={theme.text} />
                </Pressable>
              </View>

              <ScrollView style={styles.modalScroll} contentContainerStyle={styles.modalScrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <View style={styles.formatToggle}>
                <Pressable
                  style={[
                    styles.formatToggleButton,
                    { backgroundColor: showRichEditor ? (isDark ? Colors.dark.primary : Colors.light.primary) : theme.backgroundSecondary },
                  ]}
                  onPress={() => setShowRichEditor(!showRichEditor)}
                >
                  <Feather name="type" size={16} color={showRichEditor ? "#FFFFFF" : theme.text} />
                  <ThemedText style={[styles.formatToggleText, { color: showRichEditor ? "#FFFFFF" : theme.text }]}>
                    {showRichEditor ? "Formatting On" : "Add Formatting"}
                  </ThemedText>
                </Pressable>
              </View>

              {showRichEditor ? (
                <RichTextEditor
                  value={newPostCaption}
                  onChangeText={(text) => {
                    setNewPostCaption(text);
                    setPostError(null);
                  }}
                  style={captionStyle}
                  onStyleChange={setCaptionStyle}
                  placeholder="What's on your mind?"
                />
              ) : (
                <TextInput
                  style={[styles.textInput, styles.captionInput, { backgroundColor: theme.backgroundSecondary, color: theme.text, borderColor: theme.border }]}
                  placeholder="What's on your mind?"
                  placeholderTextColor={theme.textSecondary}
                  value={newPostCaption}
                  onChangeText={(text) => {
                    setNewPostCaption(text);
                    setPostError(null);
                  }}
                  multiline
                  numberOfLines={4}
                  autoFocus
                />
              )}

              {postError ? (
                <View style={[styles.errorContainer, { backgroundColor: theme.error + "20" }]}>
                  <Feather name="alert-circle" size={16} color={theme.error} />
                  <ThemedText style={[styles.errorText, { color: theme.error }]}>{postError}</ThemedText>
                </View>
              ) : null}

              <View style={styles.mediaButtons}>
                <Pressable
                  style={[styles.mediaButton, { backgroundColor: theme.backgroundSecondary }]}
                  onPress={handlePickImages}
                  disabled={selectedImages.length >= 10 || selectedVideo !== null}
                >
                  <Feather name="image" size={20} color={selectedImages.length >= 10 || selectedVideo ? theme.textSecondary : (isDark ? Colors.dark.primary : Colors.light.primary)} />
                  <ThemedText style={[styles.mediaButtonText, { color: selectedImages.length >= 10 || selectedVideo ? theme.textSecondary : theme.text }]}>
                    Add Photos {selectedImages.length > 0 ? `(${selectedImages.length}/10)` : ""}
                  </ThemedText>
                </Pressable>

                <Pressable
                  style={[styles.mediaButton, { backgroundColor: selectedVideo ? (isDark ? Colors.dark.primary + "20" : Colors.light.primary + "20") : theme.backgroundSecondary }]}
                  onPress={handlePickVideo}
                  disabled={selectedVideo !== null || selectedImages.length > 0 || isVideoProcessing}
                >
                  <Feather name="video" size={20} color={selectedVideo || selectedImages.length > 0 ? theme.textSecondary : (isDark ? Colors.dark.primary : Colors.light.primary)} />
                  <ThemedText style={[styles.mediaButtonText, { color: selectedVideo || selectedImages.length > 0 ? theme.textSecondary : theme.text }]}>
                    {selectedVideo ? "Video Added" : "Upload Video"}
                  </ThemedText>
                </Pressable>
              </View>

              <View style={styles.mediaButtons}>
                <Pressable
                  style={[styles.mediaButton, { backgroundColor: showMediaOptions ? (isDark ? Colors.dark.primary + "20" : Colors.light.primary + "20") : theme.backgroundSecondary }]}
                  onPress={() => setShowMediaOptions(!showMediaOptions)}
                  disabled={selectedVideo !== null}
                >
                  <Feather name="link" size={20} color={selectedVideo ? theme.textSecondary : (isDark ? Colors.dark.primary : Colors.light.primary)} />
                  <ThemedText style={[styles.mediaButtonText, { color: selectedVideo ? theme.textSecondary : theme.text }]}>YouTube Link</ThemedText>
                </Pressable>
              </View>

              {selectedImages.length > 0 ? (
                <View style={styles.imagePreviewContainer}>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {selectedImages.map((image, index) => (
                      <View key={index} style={styles.imagePreviewWrapper}>
                        <Image source={{ uri: image.uri }} style={styles.imagePreview} contentFit="cover" />
                        <Pressable
                          style={[styles.removeImageButton, { backgroundColor: theme.error }]}
                          onPress={() => handleRemoveImage(index)}
                        >
                          <Feather name="x" size={14} color="#FFFFFF" />
                        </Pressable>
                      </View>
                    ))}
                  </ScrollView>
                </View>
              ) : null}

              {selectedVideo ? (
                <View style={styles.videoPreviewContainer}>
                  <View style={styles.videoPreviewWrapper}>
                    <Video
                      source={{ uri: selectedVideo.uri }}
                      style={styles.videoPreview}
                      resizeMode={ResizeMode.COVER}
                      shouldPlay={false}
                      isMuted
                    />
                    {!isVideoProcessing && (
                      <Pressable
                        style={[styles.removeVideoButton, { backgroundColor: theme.error }]}
                        onPress={handleRemoveVideo}
                      >
                        <Feather name="x" size={14} color="#FFFFFF" />
                      </Pressable>
                    )}
                    {isVideoProcessing && (
                      <View style={styles.videoUploadOverlay}>
                        <ActivityIndicator color="#FFFFFF" />
                        <ThemedText style={styles.videoUploadText}>
                          {videoUploadState.phase === "creating" ? "Preparing..." :
                           videoUploadState.phase === "uploading" ? `Uploading ${videoUploadState.progress}%` :
                           videoUploadState.phase === "processing" ? `Processing ${videoUploadState.progress}%` :
                           "Please wait..."}
                        </ThemedText>
                      </View>
                    )}
                  </View>
                  <ThemedText style={[styles.videoFileName, { color: theme.textSecondary }]}>
                    {selectedVideo.name}
                  </ThemedText>
                </View>
              ) : null}

              {showMediaOptions ? (
                <View style={styles.mediaSection}>
                  <ThemedText style={[styles.inputLabel, { color: theme.textSecondary }]}>Video URL</ThemedText>
                  <TextInput
                    style={[styles.textInput, { backgroundColor: theme.backgroundSecondary, color: theme.text, borderColor: theme.border }]}
                    placeholder="Paste YouTube URL..."
                    placeholderTextColor={theme.textSecondary}
                    value={newPostUrl}
                    onChangeText={(text) => {
                      setNewPostUrl(text);
                      setPostError(null);
                    }}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>
              ) : null}

              <View style={styles.visibilitySection}>
                <ThemedText style={[styles.inputLabel, { color: theme.textSecondary }]}>Who can see this?</ThemedText>
                <View style={styles.visibilityOptions}>
                  {[
                    { key: "public" as PostVisibility, label: "Everyone", icon: "globe" as const },
                    { key: "followers" as PostVisibility, label: "Followers", icon: "users" as const },
                    { key: "private" as PostVisibility, label: "Only Me", icon: "lock" as const },
                  ].map((option) => (
                    <Pressable
                      key={option.key}
                      style={[
                        styles.visibilityOption,
                        {
                          backgroundColor: postVisibility === option.key
                            ? (isDark ? Colors.dark.primary : Colors.light.primary)
                            : theme.backgroundSecondary,
                        },
                      ]}
                      onPress={() => setPostVisibility(option.key)}
                    >
                      <Feather
                        name={option.icon}
                        size={14}
                        color={postVisibility === option.key ? "#FFFFFF" : theme.text}
                      />
                      <ThemedText
                        style={[
                          styles.visibilityOptionText,
                          { color: postVisibility === option.key ? "#FFFFFF" : theme.text },
                        ]}
                      >
                        {option.label}
                      </ThemedText>
                    </Pressable>
                  ))}
                </View>
              </View>
            </ScrollView>

            <Pressable
              style={[styles.submitButton, { backgroundColor: isDark ? Colors.dark.primary : Colors.light.primary, opacity: isSubmitting ? 0.6 : 1 }]}
              onPress={handleCreatePost}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator color="#FFFFFF" size="small" />
                  <ThemedText style={[styles.submitButtonText, { marginLeft: Spacing.sm }]}>
                    {isUploading ? "Uploading..." : "Posting..."}
                  </ThemedText>
                </View>
              ) : (
                <ThemedText style={styles.submitButtonText}>Share Post</ThemedText>
              )}
            </Pressable>
          </View>
        </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal
        visible={showCommentsModal}
        transparent
        animationType="slide"
        onRequestClose={() => {
          setShowCommentsModal(false);
          setSelectedPostId(null);
          setComments([]);
          setNewComment("");
        }}
      >
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <View style={styles.modalOverlay}>
            <Pressable
              style={StyleSheet.absoluteFill}
              onPress={() => {
                setShowCommentsModal(false);
                setSelectedPostId(null);
                setComments([]);
                setNewComment("");
              }}
            />
            <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
              <View style={styles.modalHeader}>
                <ThemedText style={styles.modalTitle}>Comments</ThemedText>
                <Pressable
                  onPress={() => {
                    setShowCommentsModal(false);
                    setSelectedPostId(null);
                    setComments([]);
                    setNewComment("");
                  }}
                >
                  <Feather name="x" size={24} color={theme.text} />
                </Pressable>
              </View>

              <View style={styles.commentInputRow}>
                <TextInput
                  style={[styles.commentInput, { backgroundColor: theme.backgroundSecondary, color: theme.text, borderColor: theme.border }]}
                  placeholder="Add a comment..."
                  placeholderTextColor={theme.textSecondary}
                  value={newComment}
                  onChangeText={setNewComment}
                />
                <Pressable
                  style={[styles.sendButton, { backgroundColor: isDark ? Colors.dark.primary : Colors.light.primary }]}
                  onPress={handleAddComment}
                  disabled={!newComment.trim()}
                >
                  <Feather name="send" size={18} color="#FFFFFF" />
                </Pressable>
              </View>

              {loadingComments ? (
                <View style={styles.loadingCommentsContainer}>
                  <ActivityIndicator color={theme.textSecondary} />
                </View>
              ) : (
                <ScrollView style={styles.commentsScroll} keyboardShouldPersistTaps="handled">
                  {comments.length === 0 ? (
                    <ThemedText style={[styles.noCommentsText, { color: theme.textSecondary }]}>
                      No comments yet. Be the first to comment!
                    </ThemedText>
                  ) : (
                    comments.map((comment) => (
                      <View key={comment.id} style={[styles.commentItem, { borderBottomColor: theme.border }]}>
                        <View style={styles.commentHeader}>
                          <ThemedText style={styles.commentAuthor}>
                            {comment.user?.displayName || "Unknown"}
                          </ThemedText>
                          <ThemedText style={[styles.commentTime, { color: theme.textSecondary }]}>
                            {new Date(comment.createdAt).toLocaleDateString()}
                          </ThemedText>
                        </View>
                        <ThemedText style={styles.commentContent}>{comment.content}</ThemedText>
                      </View>
                    ))
                  )}
                </ScrollView>
              )}
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal
        visible={showEditModal}
        transparent
        animationType="slide"
        onRequestClose={handleCloseEditModal}
      >
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <View style={styles.modalOverlay}>
            <Pressable style={StyleSheet.absoluteFill} onPress={handleCloseEditModal} />
            <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
              <View style={styles.modalHeader}>
                <ThemedText style={styles.modalTitle}>Edit Post</ThemedText>
                <Pressable onPress={handleCloseEditModal} style={styles.modalCloseButton}>
                  <Feather name="x" size={24} color={theme.text} />
                </Pressable>
              </View>

              <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              {editError ? (
                <View style={[styles.errorContainer, { backgroundColor: "rgba(220, 38, 38, 0.1)" }]}>
                  <Feather name="alert-circle" size={18} color={Colors.light.primary} />
                  <ThemedText style={[styles.errorText, { color: Colors.light.primary }]}>{editError}</ThemedText>
                </View>
              ) : null}

              {editingPost?.images && editingPost.images.length > 0 ? (
                <View style={styles.imagePreviewContainer}>
                  <ThemedText style={[styles.inputLabel, { color: theme.textSecondary }]}>Current Images (cannot be changed)</ThemedText>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {editingPost.images.map((image, index) => (
                      <View key={index} style={styles.imagePreviewWrapper}>
                        <Image source={{ uri: image.startsWith("http") ? image : new URL(image, getApiUrl()).toString() }} style={styles.imagePreview} />
                      </View>
                    ))}
                  </ScrollView>
                </View>
              ) : null}

              <View style={styles.formatToggle}>
                <Pressable
                  style={[styles.formatToggleButton, { backgroundColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)" }]}
                  onPress={() => setShowEditRichEditor(!showEditRichEditor)}
                >
                  <Feather name="type" size={16} color={theme.text} />
                  <ThemedText style={styles.formatToggleText}>
                    {showEditRichEditor ? "Hide Formatting" : "Show Formatting"}
                  </ThemedText>
                </Pressable>
              </View>

              {showEditRichEditor ? (
                <RichTextEditor
                  value={editCaption}
                  onChangeText={(text) => {
                    setEditCaption(text);
                    setEditError(null);
                  }}
                  style={editCaptionStyle}
                  onStyleChange={setEditCaptionStyle}
                />
              ) : null}

              <TextInput
                style={[
                  styles.textInput,
                  styles.captionInput,
                  { 
                    backgroundColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)",
                    borderColor: theme.border,
                    color: theme.text,
                  },
                ]}
                placeholder="What's on your mind?"
                placeholderTextColor={theme.textSecondary}
                value={editCaption}
                onChangeText={setEditCaption}
                multiline
              />

              {editingPost?.mediaUrl ? (
                <View style={styles.mediaSection}>
                  <ThemedText style={[styles.inputLabel, { color: theme.textSecondary }]}>Video URL</ThemedText>
                  <TextInput
                    style={[
                      styles.textInput,
                      {
                        backgroundColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)",
                        borderColor: theme.border,
                        color: theme.text,
                      },
                    ]}
                    placeholder="Paste video URL..."
                    placeholderTextColor={theme.textSecondary}
                    value={editUrl}
                    onChangeText={setEditUrl}
                    autoCapitalize="none"
                    keyboardType="url"
                  />
                </View>
              ) : null}

              <View style={styles.visibilitySection}>
                <ThemedText style={[styles.inputLabel, { color: theme.textSecondary }]}>Who can see this?</ThemedText>
                <View style={styles.visibilityOptions}>
                  {[
                    { key: "public" as PostVisibility, label: "Everyone", icon: "globe" as const },
                    { key: "followers" as PostVisibility, label: "Followers", icon: "users" as const },
                    { key: "private" as PostVisibility, label: "Only Me", icon: "lock" as const },
                  ].map((option) => (
                    <Pressable
                      key={option.key}
                      style={[
                        styles.visibilityOption,
                        {
                          backgroundColor: editVisibility === option.key
                            ? (isDark ? Colors.dark.primary : Colors.light.primary)
                            : theme.backgroundSecondary,
                        },
                      ]}
                      onPress={() => setEditVisibility(option.key)}
                    >
                      <Feather
                        name={option.icon}
                        size={14}
                        color={editVisibility === option.key ? "#FFFFFF" : theme.text}
                      />
                      <ThemedText
                        style={[
                          styles.visibilityOptionText,
                          { color: editVisibility === option.key ? "#FFFFFF" : theme.text },
                        ]}
                      >
                        {option.label}
                      </ThemedText>
                    </Pressable>
                  ))}
                </View>
              </View>
            </ScrollView>

            <Pressable
              style={[
                styles.submitButton,
                {
                  backgroundColor: isEditSubmitting
                    ? (isDark ? "rgba(220, 38, 38, 0.5)" : "rgba(220, 38, 38, 0.5)")
                    : (isDark ? Colors.dark.primary : Colors.light.primary)
                },
              ]}
              onPress={handleUpdatePost}
              disabled={isEditSubmitting}
            >
              {isEditSubmitting ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color="#FFFFFF" />
                  <ThemedText style={[styles.submitButtonText, { marginLeft: Spacing.sm }]}>Updating...</ThemedText>
                </View>
              ) : (
                <ThemedText style={styles.submitButtonText}>Update Post</ThemedText>
              )}
            </Pressable>
          </View>
        </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  backgroundTop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    width: "100%",
    height: 180,
    zIndex: 0,
  },
  backgroundBottom: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    width: "100%",
    height: 160,
    zIndex: 0,
  },
  headerSection: {
    marginBottom: Spacing.lg,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  seeAll: {
    fontSize: 14,
    fontWeight: "500",
  },
  suggestionsContainer: {
    paddingRight: Spacing.lg,
  },
  fab: {
    position: "absolute",
    right: Spacing.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: BorderRadius.lg,
    borderTopRightRadius: BorderRadius.lg,
    padding: Spacing.xl,
    maxHeight: "85%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
  },
  modalCloseButton: {
    padding: Spacing.xs,
  },
  modalScroll: {
    flex: 1,
  },
  modalScrollContent: {
    paddingBottom: Spacing.lg,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: Spacing.sm,
  },
  platformRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  platformButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
  },
  platformButtonText: {
    fontSize: 13,
    fontWeight: "500",
  },
  textInput: {
    borderWidth: 1,
    borderRadius: BorderRadius.sm,
    padding: Spacing.md,
    fontSize: 16,
    marginBottom: Spacing.md,
  },
  captionInput: {
    minHeight: 100,
    textAlignVertical: "top",
  },
  submitButton: {
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
    justifyContent: "center",
    marginTop: Spacing.md,
  },
  submitButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  errorText: {
    fontSize: 14,
    flex: 1,
  },
  mediaButtons: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  mediaButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    gap: Spacing.sm,
  },
  mediaButtonText: {
    fontSize: 14,
    fontWeight: "500",
  },
  imagePreviewContainer: {
    marginBottom: Spacing.md,
  },
  imagePreviewWrapper: {
    marginRight: Spacing.sm,
    position: "relative",
  },
  imagePreview: {
    width: 80,
    height: 80,
    borderRadius: BorderRadius.sm,
  },
  removeImageButton: {
    position: "absolute",
    top: -6,
    right: -6,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  mediaSection: {
    marginBottom: Spacing.sm,
  },
  formatToggle: {
    marginBottom: Spacing.md,
  },
  formatToggleButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
    gap: Spacing.sm,
    alignSelf: "flex-start",
  },
  formatToggleText: {
    fontSize: 14,
    fontWeight: "500",
  },
  commentInputRow: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  commentInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: BorderRadius.sm,
    padding: Spacing.md,
    fontSize: 14,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  commentsScroll: {
    maxHeight: 300,
  },
  loadingCommentsContainer: {
    padding: Spacing.xl,
    alignItems: "center",
  },
  noCommentsText: {
    textAlign: "center",
    padding: Spacing.xl,
    fontSize: 14,
  },
  commentItem: {
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  commentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: Spacing.xs,
  },
  commentAuthor: {
    fontSize: 14,
    fontWeight: "600",
  },
  commentTime: {
    fontSize: 12,
  },
  commentContent: {
    fontSize: 14,
    lineHeight: 20,
  },
  visibilitySection: {
    marginBottom: Spacing.md,
  },
  visibilityOptions: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  visibilityOption: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.xs,
    borderRadius: BorderRadius.sm,
    gap: Spacing.xs,
  },
  visibilityOptionText: {
    fontSize: 12,
    fontWeight: "500",
  },
  videoPreviewContainer: {
    marginBottom: Spacing.md,
  },
  videoPreviewWrapper: {
    position: "relative",
    width: "100%",
    aspectRatio: 2,
    borderRadius: BorderRadius.sm,
    overflow: "hidden",
    backgroundColor: "#000000",
  },
  videoPreview: {
    width: "100%",
    height: "100%",
  },
  removeVideoButton: {
    position: "absolute",
    top: Spacing.sm,
    right: Spacing.sm,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  videoUploadOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    alignItems: "center",
    justifyContent: "center",
  },
  videoUploadText: {
    color: "#FFFFFF",
    marginTop: Spacing.sm,
    fontSize: 14,
  },
  videoFileName: {
    marginTop: Spacing.xs,
    fontSize: 12,
  },
});
