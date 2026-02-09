import { db } from "../db";
import { uploadedVideos, posts } from "../db/schema";
import { eq } from "drizzle-orm";
import { maskApiKey } from "../utils/encryption";

// File size and format limits
export const VIDEO_MAX_SIZE_BYTES = 500 * 1024 * 1024; // 500MB
export const VIDEO_ALLOWED_TYPES = [
  "video/mp4",
  "video/quicktime",
  "video/x-msvideo",
  "video/webm",
  "video/x-matroska",
];

interface CreateVideoResult {
  videoId: string;
  bunnyVideoId: string;
  uploadUrl: string;
}

/**
 * Creates a video record in Bunny.net and local database
 * Returns upload URL for direct client upload
 */
export async function createVideoUpload(
  userId: string,
  filename: string,
  title?: string
): Promise<CreateVideoResult> {
  const libraryId = process.env.BUNNY_LIBRARY_ID;
  const apiKey = process.env.BUNNY_API_KEY;

  console.log("[Video Debug] === CREATE VIDEO UPLOAD START ===");
  console.log("[Video Debug] userId:", userId);
  console.log("[Video Debug] filename:", filename);
  console.log("[Video Debug] BUNNY_LIBRARY_ID:", libraryId || "NOT SET");
  console.log("[Video Debug] BUNNY_API_KEY:", maskApiKey(apiKey || null));
  console.log("[Video Debug] BUNNY_CDN_HOSTNAME:", process.env.BUNNY_CDN_HOSTNAME || "NOT SET");

  if (!libraryId || !apiKey) {
    console.error("[Video Debug] MISSING CONFIG - libraryId:", !!libraryId, "apiKey:", !!apiKey);
    throw new Error("Bunny.net configuration missing");
  }

  // Step 1: Create video object in Bunny.net
  const bunnyUrl = `https://video.bunnycdn.com/library/${libraryId}/videos`;
  console.log("[Video Debug] Calling Bunny API:", bunnyUrl);

  const bunnyResponse = await fetch(
    bunnyUrl,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "AccessKey": apiKey,
      },
      body: JSON.stringify({
        title: title || filename,
      }),
    }
  );

  console.log("[Video Debug] Bunny API response status:", bunnyResponse.status);
  console.log("[Video Debug] Bunny API response ok:", bunnyResponse.ok);

  if (!bunnyResponse.ok) {
    const error = await bunnyResponse.text();
    console.error("[Video Debug] Bunny.net video creation failed:");
    console.error("[Video Debug] Status:", bunnyResponse.status);
    console.error("[Video Debug] Response:", error);
    throw new Error(`Bunny.net video creation failed: ${error}`);
  }

  const bunnyVideo = await bunnyResponse.json();
  console.log("[Video Debug] Bunny API success response:", JSON.stringify(bunnyVideo, null, 2));
  const bunnyVideoId = bunnyVideo.guid;
  console.log("[Video Debug] Got bunnyVideoId:", bunnyVideoId);

  // Step 2: Create local database record
  const [video] = await db
    .insert(uploadedVideos)
    .values({
      userId,
      bunnyVideoId,
      bunnyLibraryId: parseInt(libraryId),
      title: title || filename,
      originalFilename: filename,
      status: "uploading",
    })
    .returning();

  // Step 3: Generate upload URL
  const uploadUrl = `https://video.bunnycdn.com/library/${libraryId}/videos/${bunnyVideoId}`;

  console.log(`[Video] Created video record: ${video.id} (Bunny: ${bunnyVideoId})`);

  return {
    videoId: video.id,
    bunnyVideoId,
    uploadUrl,
  };
}

/**
 * Proxy upload video data to Bunny.net (keeps API key server-side)
 */
export async function proxyVideoUpload(
  videoId: string,
  userId: string,
  videoBuffer: Buffer
): Promise<{ success: boolean; error?: string }> {
  const video = await getVideoById(videoId, userId);
  if (!video) {
    return { success: false, error: "Video not found or access denied" };
  }

  const apiKey = process.env.BUNNY_API_KEY;
  const libraryId = process.env.BUNNY_LIBRARY_ID;
  if (!apiKey || !libraryId) {
    return { success: false, error: "Bunny.net configuration missing" };
  }

  const uploadUrl = `https://video.bunnycdn.com/library/${libraryId}/videos/${video.bunnyVideoId}`;

  const response = await fetch(uploadUrl, {
    method: "PUT",
    headers: {
      "AccessKey": apiKey,
      "Content-Type": "application/octet-stream",
    },
    body: videoBuffer,
  });

  if (!response.ok) {
    const error = await response.text();
    console.error(`[Video] Proxy upload failed: ${response.status} ${error}`);
    return { success: false, error: "Upload to storage failed" };
  }

  console.log(`[Video] Proxy upload successful for video ${videoId}`);
  return { success: true };
}

/**
 * Get video by ID with optional ownership check
 */
export async function getVideoById(videoId: string, userId?: string) {
  const [video] = await db
    .select()
    .from(uploadedVideos)
    .where(eq(uploadedVideos.id, videoId))
    .limit(1);

  if (!video) {
    return null;
  }

  // If userId provided, check ownership
  if (userId && video.userId !== userId) {
    return null;
  }

  return video;
}

/**
 * Get video by Bunny video ID
 */
export async function getVideoByBunnyId(bunnyVideoId: string) {
  const [video] = await db
    .select()
    .from(uploadedVideos)
    .where(eq(uploadedVideos.bunnyVideoId, bunnyVideoId))
    .limit(1);

  return video || null;
}

/**
 * Fetch video details from Bunny.net API
 */
async function fetchBunnyVideoDetails(libraryId: number, videoId: string) {
  const apiKey = process.env.BUNNY_API_KEY;
  if (!apiKey) return null;

  try {
    const response = await fetch(
      `https://video.bunnycdn.com/library/${libraryId}/videos/${videoId}`,
      {
        headers: {
          "AccessKey": apiKey,
        },
      }
    );

    if (!response.ok) {
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error("[Video] Failed to fetch Bunny video details:", error);
    return null;
  }
}

/**
 * Update video status from webhook
 */
export async function updateVideoFromWebhook(
  bunnyVideoId: string,
  bunnyLibraryId: number,
  status: number
): Promise<void> {
  const cdnHostname = process.env.BUNNY_CDN_HOSTNAME;

  // Map Bunny status codes to our status enum
  // Reference: https://docs.bunny.net/docs/stream-webhook
  const statusMap: Record<number, {
    status: "uploading" | "queued" | "processing" | "encoding" | "ready" | "failed";
    isTerminal: boolean;
  }> = {
    0: { status: "queued", isTerminal: false },
    1: { status: "processing", isTerminal: false },
    2: { status: "encoding", isTerminal: false },
    3: { status: "ready", isTerminal: true },      // Finished
    4: { status: "encoding", isTerminal: false },  // Resolution finished (partial)
    5: { status: "failed", isTerminal: true },
    6: { status: "uploading", isTerminal: false }, // PresignedUploadStarted
    7: { status: "queued", isTerminal: false },    // PresignedUploadFinished
    8: { status: "failed", isTerminal: true },     // PresignedUploadFailed
  };

  const mapped = statusMap[status];
  if (!mapped) {
    console.warn(`[Video Webhook] Unknown status code: ${status}`);
    return;
  }

  const updateData: Record<string, any> = {
    status: mapped.status,
  };

  // If video is ready, fetch full details from Bunny to get URLs
  if (mapped.status === "ready" && cdnHostname) {
    updateData.readyAt = new Date();

    // Fetch video details from Bunny to get metadata
    const videoDetails = await fetchBunnyVideoDetails(bunnyLibraryId, bunnyVideoId);
    if (videoDetails) {
      updateData.playbackUrl = `https://${cdnHostname}/${bunnyVideoId}/playlist.m3u8`;
      updateData.thumbnailUrl = `https://${cdnHostname}/${bunnyVideoId}/thumbnail.jpg`;
      updateData.previewUrl = `https://${cdnHostname}/${bunnyVideoId}/preview.webp`;
      updateData.duration = videoDetails.length;
      updateData.width = videoDetails.width;
      updateData.height = videoDetails.height;
    }
  } else if (mapped.status === "encoding") {
    updateData.encodingStartedAt = new Date();
  } else if (mapped.status === "failed") {
    updateData.failureReason = `Encoding failed with status ${status}`;
  }

  await db
    .update(uploadedVideos)
    .set(updateData)
    .where(eq(uploadedVideos.bunnyVideoId, bunnyVideoId));

  console.log(`[Video Webhook] Updated video ${bunnyVideoId} to status: ${mapped.status}`);
}

/**
 * Delete video from Bunny.net and local database
 */
export async function deleteVideo(videoId: string, userId: string): Promise<boolean> {
  const video = await getVideoById(videoId, userId);
  if (!video) {
    return false;
  }

  const apiKey = process.env.BUNNY_API_KEY;

  // Delete from Bunny.net
  if (apiKey) {
    try {
      await fetch(
        `https://video.bunnycdn.com/library/${video.bunnyLibraryId}/videos/${video.bunnyVideoId}`,
        {
          method: "DELETE",
          headers: {
            "AccessKey": apiKey,
          },
        }
      );
      console.log(`[Video] Deleted from Bunny: ${video.bunnyVideoId}`);
    } catch (error) {
      console.error("[Video] Failed to delete from Bunny:", error);
      // Continue with local deletion even if Bunny fails
    }
  }

  // Remove video reference from any posts
  await db
    .update(posts)
    .set({ videoId: null })
    .where(eq(posts.videoId, videoId));

  // Delete local record
  await db.delete(uploadedVideos).where(eq(uploadedVideos.id, videoId));

  console.log(`[Video] Deleted video record: ${videoId}`);
  return true;
}

/**
 * Get video status for polling - includes server-side check to Bunny.net
 * as a fallback when webhooks can't reach the server (e.g., localhost)
 */
export async function getVideoStatus(videoId: string) {
  const [video] = await db
    .select()
    .from(uploadedVideos)
    .where(eq(uploadedVideos.id, videoId))
    .limit(1);

  if (!video) {
    return null;
  }

  // If video is not in a terminal state, poll Bunny.net directly
  // This handles the case where webhooks can't reach localhost
  const terminalStates = ["ready", "failed"];
  if (!terminalStates.includes(video.status)) {
    console.log(`[Video] Polling Bunny.net for video ${videoId} (current status: ${video.status})`);

    const bunnyDetails = await fetchBunnyVideoDetails(video.bunnyLibraryId, video.bunnyVideoId);
    if (bunnyDetails) {
      // Bunny.net status codes: 0=queued, 1=processing, 2=encoding, 3=finished, 4=resolution_finished, 5=failed
      const bunnyStatus = bunnyDetails.status;
      console.log(`[Video] Bunny.net status for ${videoId}: ${bunnyStatus}`);

      // If Bunny says it's ready (status 3 or 4) but our DB doesn't reflect that, update it
      if (bunnyStatus === 3 || bunnyStatus === 4) {
        const cdnHostname = process.env.BUNNY_CDN_HOSTNAME;
        const updateData: Record<string, any> = {
          status: "ready",
          readyAt: new Date(),
        };

        if (cdnHostname) {
          updateData.playbackUrl = `https://${cdnHostname}/${video.bunnyVideoId}/playlist.m3u8`;
          updateData.thumbnailUrl = `https://${cdnHostname}/${video.bunnyVideoId}/thumbnail.jpg`;
          updateData.previewUrl = `https://${cdnHostname}/${video.bunnyVideoId}/preview.webp`;
        }
        updateData.duration = bunnyDetails.length;
        updateData.width = bunnyDetails.width;
        updateData.height = bunnyDetails.height;

        await db
          .update(uploadedVideos)
          .set(updateData)
          .where(eq(uploadedVideos.id, videoId));

        console.log(`[Video] Updated video ${videoId} to ready (from polling)`);

        return {
          status: "ready",
          encodingProgress: 100,
          playbackUrl: updateData.playbackUrl,
          thumbnailUrl: updateData.thumbnailUrl,
          failureReason: null,
        };
      } else if (bunnyStatus === 5) {
        // Failed
        await db
          .update(uploadedVideos)
          .set({ status: "failed", failureReason: "Encoding failed" })
          .where(eq(uploadedVideos.id, videoId));

        return {
          status: "failed",
          encodingProgress: 0,
          playbackUrl: null,
          thumbnailUrl: null,
          failureReason: "Encoding failed",
        };
      } else if (bunnyStatus === 1 || bunnyStatus === 2) {
        // Processing/encoding - update status
        const newStatus = bunnyStatus === 2 ? "encoding" : "processing";
        if (video.status !== newStatus) {
          await db
            .update(uploadedVideos)
            .set({ status: newStatus, encodingProgress: bunnyDetails.encodeProgress || 0 })
            .where(eq(uploadedVideos.id, videoId));
        }

        return {
          status: newStatus,
          encodingProgress: bunnyDetails.encodeProgress || 0,
          playbackUrl: null,
          thumbnailUrl: null,
          failureReason: null,
        };
      }
    }
  }

  return {
    status: video.status,
    encodingProgress: video.encodingProgress,
    playbackUrl: video.playbackUrl,
    thumbnailUrl: video.thumbnailUrl,
    failureReason: video.failureReason,
  };
}
