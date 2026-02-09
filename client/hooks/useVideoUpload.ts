import { useState, useCallback, useRef } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getApiUrl } from "@/lib/query-client";
import { VideoStatus } from "@/lib/types";

export type UploadPhase =
  | "idle"
  | "creating"      // Creating video record
  | "uploading"     // Uploading to Bunny
  | "processing"    // Waiting for encoding
  | "ready"
  | "error";

interface VideoUploadState {
  phase: UploadPhase;
  progress: number;        // 0-100 for upload progress
  videoId: string | null;
  playbackUrl: string | null;
  thumbnailUrl: string | null;
  error: string | null;
}

interface UseVideoUploadReturn {
  state: VideoUploadState;
  uploadVideo: (file: { uri: string; name: string; type: string }) => Promise<string | null>;
  cancelUpload: () => void;
  reset: () => void;
}

const SESSION_TOKEN_KEY = "@mien_kingdom_session";

export function useVideoUpload(): UseVideoUploadReturn {
  const [state, setState] = useState<VideoUploadState>({
    phase: "idle",
    progress: 0,
    videoId: null,
    playbackUrl: null,
    thumbnailUrl: null,
    error: null,
  });

  const abortControllerRef = useRef<AbortController | null>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const reset = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
    setState({
      phase: "idle",
      progress: 0,
      videoId: null,
      playbackUrl: null,
      thumbnailUrl: null,
      error: null,
    });
  }, []);

  const cancelUpload = useCallback(() => {
    reset();
  }, [reset]);

  const pollForStatus = useCallback(async (videoId: string): Promise<boolean> => {
    const token = await AsyncStorage.getItem(SESSION_TOKEN_KEY);
    const baseUrl = getApiUrl();

    return new Promise((resolve) => {
      const interval = setInterval(async () => {
        try {
          const response = await fetch(
            new URL(`/api/videos/${videoId}/status`, baseUrl).toString(),
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );

          if (!response.ok) {
            throw new Error("Failed to check status");
          }

          const data = await response.json();

          if (data.status === "ready") {
            clearInterval(interval);
            pollingIntervalRef.current = null;
            setState((prev) => ({
              ...prev,
              phase: "ready",
              progress: 100,
              playbackUrl: data.playbackUrl,
              thumbnailUrl: data.thumbnailUrl,
            }));
            resolve(true);
          } else if (data.status === "failed") {
            clearInterval(interval);
            pollingIntervalRef.current = null;
            setState((prev) => ({
              ...prev,
              phase: "error",
              error: data.failureReason || "Video encoding failed",
            }));
            resolve(false);
          } else {
            // Update progress for encoding status
            setState((prev) => ({
              ...prev,
              progress: Math.max(prev.progress, 50 + (data.encodingProgress || 0) / 2),
            }));
          }
        } catch (error) {
          console.error("Status poll error:", error);
        }
      }, 3000); // Poll every 3 seconds

      pollingIntervalRef.current = interval;

      // Timeout after 10 minutes
      setTimeout(() => {
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
          setState((prev) => {
            if (prev.phase === "processing") {
              return {
                ...prev,
                phase: "error",
                error: "Video processing timed out",
              };
            }
            return prev;
          });
          resolve(false);
        }
      }, 600000);
    });
  }, []);

  const uploadVideo = useCallback(async (
    file: { uri: string; name: string; type: string }
  ): Promise<string | null> => {
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      setState({
        phase: "creating",
        progress: 0,
        videoId: null,
        playbackUrl: null,
        thumbnailUrl: null,
        error: null,
      });

      const token = await AsyncStorage.getItem(SESSION_TOKEN_KEY);
      const baseUrl = getApiUrl();

      // Step 1: Create video record and get upload URL
      const createResponse = await fetch(
        new URL("/api/videos/create", baseUrl).toString(),
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            filename: file.name,
            mimeType: file.type,
          }),
          signal: controller.signal,
        }
      );

      if (!createResponse.ok) {
        const error = await createResponse.json();
        throw new Error(error.error || "Failed to create video upload");
      }

      const { videoId } = await createResponse.json();

      setState((prev) => ({
        ...prev,
        phase: "uploading",
        videoId,
        progress: 10,
      }));

      // Step 2: Fetch the file and upload via server proxy (API key stays server-side)
      const fileResponse = await fetch(file.uri);
      const videoBlob = await fileResponse.blob();

      setState((prev) => ({ ...prev, progress: 20 }));

      const uploadResponse = await fetch(
        new URL(`/api/videos/${videoId}/upload`, baseUrl).toString(),
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/octet-stream",
          },
          body: videoBlob,
          signal: controller.signal,
        }
      );

      if (!uploadResponse.ok) {
        throw new Error("Failed to upload video to storage");
      }

      setState((prev) => ({
        ...prev,
        phase: "processing",
        progress: 50,
      }));

      // Step 3: Poll for encoding completion
      const success = await pollForStatus(videoId);

      if (success) {
        return videoId;
      }
      return null;
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        return null;
      }

      setState((prev) => ({
        ...prev,
        phase: "error",
        error: error instanceof Error ? error.message : "Upload failed",
      }));
      return null;
    }
  }, [pollForStatus]);

  return {
    state,
    uploadVideo,
    cancelUpload,
    reset,
  };
}
