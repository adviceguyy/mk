export type SocialPlatform = "youtube" | "tiktok" | "instagram" | "facebook" | "twitter";
export type PostVisibility = "public" | "followers" | "private";
export type VideoStatus = "uploading" | "queued" | "processing" | "encoding" | "ready" | "failed";

export interface UploadedVideo {
  id: string;
  bunnyVideoId: string;
  title?: string;
  originalFilename?: string;
  fileSize?: number;
  duration?: number;
  width?: number;
  height?: number;
  playbackUrl?: string;
  thumbnailUrl?: string;
  previewUrl?: string;
  status: VideoStatus;
  encodingProgress?: number;
  failureReason?: string;
  createdAt: Date;
  readyAt?: Date;
}

export interface User {
  id: string;
  username: string;
  displayName: string;
  avatar: string;
  bio: string;
  connectedPlatforms: SocialPlatform[];
  followersCount: number;
  followingCount: number;
  postsCount?: number;
  isFollowing: boolean;
  tierSlug?: string;
  level?: number;
  role?: string;
}

export interface RichTextStyle {
  fontSize?: "small" | "medium" | "large";
  fontWeight?: "normal" | "bold";
  fontStyle?: "normal" | "italic";
  textColor?: string;
  backgroundColor?: string;
}

export interface CaptionRich {
  text: string;
  style: RichTextStyle;
}

export interface Post {
  id: string;
  userId: string;
  user: User;
  platform?: SocialPlatform | null;
  mediaUrl?: string | null;
  embedCode?: string | null;
  caption?: string | null;
  captionRich?: CaptionRich | null;
  images?: string[];
  video?: UploadedVideo | null;
  videoId?: string | null;
  visibility?: PostVisibility;
  likesCount: number;
  commentsCount: number;
  isLiked: boolean;
  createdAt: Date;
}

export interface Comment {
  id: string;
  userId: string;
  user: User;
  content: string;
  createdAt: Date;
}

export interface TranslationResult {
  id: string;
  originalText: string;
  translatedText: string;
  sourceType: "text" | "document" | "video";
  createdAt: Date;
}

export type UserRole = "user" | "moderator" | "admin";

export interface AuthUser {
  id: string;
  email: string;
  displayName: string;
  avatar: string;
  bio?: string;
  provider: "google" | "twitter" | "instagram" | "tiktok" | "facebook";
  role: UserRole;
  connectedAccounts: {
    provider: SocialPlatform | "google";
    username: string;
    connected: boolean;
  }[];
  tierSlug?: string;
  credits?: number;
  packCredits?: number;
  subscriptionEnd?: string;
  totalXp?: number;
  level?: number;
}
