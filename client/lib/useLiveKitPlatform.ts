import { useRef, useCallback, useEffect, useState } from "react";
import { Platform } from "react-native";

interface SessionData {
  sessionId: string;
  roomName: string;
  token: string;
  livekitUrl: string;
}

interface UseLiveKitPlatformReturn {
  connect: (sessionData: SessionData) => Promise<boolean>;
  disconnect: () => Promise<void>;
  remoteVideoTrack: any;
  remoteAudioTrack: any;
  isConnected: boolean;
  error: string | null;
  webVideoRef: React.RefObject<HTMLVideoElement | null> | null;
}

let NativeRoom: any = null;
let NativeRoomEvent: any = null;
let NativeVideoView: any = null;

if (Platform.OS !== "web") {
  try {
    const livekit = require("@livekit/react-native");
    NativeRoom = livekit.Room;
    NativeRoomEvent = livekit.RoomEvent;
    NativeVideoView = livekit.VideoView;
    const { registerGlobals } = require("@livekit/react-native-webrtc");
    registerGlobals?.();
  } catch (e) {
    console.log("Native LiveKit not available:", e);
  }
}

export function useLiveKitPlatform(): UseLiveKitPlatformReturn {
  const roomRef = useRef<any>(null);
  const [remoteVideoTrack, setRemoteVideoTrack] = useState<any>(null);
  const [remoteAudioTrack, setRemoteAudioTrack] = useState<any>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const webVideoRef = useRef<HTMLVideoElement>(null);
  const webAudioRef = useRef<HTMLAudioElement>(null);

  const connectNative = useCallback(async (sessionData: SessionData): Promise<boolean> => {
    if (!NativeRoom) {
      throw new Error("Native LiveKit not available");
    }

    const room = new NativeRoom();
    roomRef.current = room;

    room.on(NativeRoomEvent.TrackSubscribed, (track: any, publication: any, participant: any) => {
      console.log("[LiveKit Native] Track subscribed:", track.kind, "from", participant.identity);
      if (track.kind === "video") {
        setRemoteVideoTrack(track);
      }
      if (track.kind === "audio") {
        setRemoteAudioTrack(track);
      }
    });

    room.on(NativeRoomEvent.TrackUnsubscribed, (track: any) => {
      console.log("[LiveKit Native] Track unsubscribed:", track.kind);
      if (track.kind === "video") {
        setRemoteVideoTrack(null);
      }
      if (track.kind === "audio") {
        setRemoteAudioTrack(null);
      }
    });

    room.on(NativeRoomEvent.Disconnected, () => {
      console.log("[LiveKit Native] Disconnected from room");
      setRemoteVideoTrack(null);
      setRemoteAudioTrack(null);
      setIsConnected(false);
    });

    await room.connect(sessionData.livekitUrl, sessionData.token, {
      autoSubscribe: true,
    });

    console.log("[LiveKit Native] Connected to room:", sessionData.roomName);

    // Enable the local microphone to publish audio to the room
    await room.localParticipant.setMicrophoneEnabled(true);
    console.log("[LiveKit Native] Microphone enabled");

    setIsConnected(true);
    return true;
  }, []);

  const connectWeb = useCallback(async (sessionData: SessionData): Promise<boolean> => {
    try {
      const { Room, RoomEvent } = await import("livekit-client");
      
      const room = new Room({
        adaptiveStream: true,
        dynacast: true,
      });
      roomRef.current = room;

      room.on(RoomEvent.TrackSubscribed, (track, publication, participant) => {
        console.log("[LiveKit Web] Track subscribed:", track.kind, "from", participant.identity);
        
        if (track.kind === "video") {
          setRemoteVideoTrack(track);
          if (webVideoRef.current) {
            track.attach(webVideoRef.current);
          }
        }
        if (track.kind === "audio") {
          setRemoteAudioTrack(track);
          const audioElement = document.createElement("audio");
          audioElement.autoplay = true;
          audioElement.id = "livekit-audio";
          document.body.appendChild(audioElement);
          track.attach(audioElement);
        }
      });

      room.on(RoomEvent.TrackUnsubscribed, (track) => {
        console.log("[LiveKit Web] Track unsubscribed:", track.kind);
        track.detach();
        if (track.kind === "video") {
          setRemoteVideoTrack(null);
        }
        if (track.kind === "audio") {
          setRemoteAudioTrack(null);
          const audioEl = document.getElementById("livekit-audio");
          if (audioEl) {
            audioEl.remove();
          }
        }
      });

      room.on(RoomEvent.Disconnected, () => {
        console.log("[LiveKit Web] Disconnected from room");
        setRemoteVideoTrack(null);
        setRemoteAudioTrack(null);
        setIsConnected(false);
      });

      room.on(RoomEvent.ConnectionStateChanged, (state) => {
        console.log("[LiveKit Web] Connection state:", state);
      });

      await room.connect(sessionData.livekitUrl, sessionData.token);

      console.log("[LiveKit Web] Connected to room:", sessionData.roomName);

      // Enable the local microphone to publish audio to the room
      await room.localParticipant.setMicrophoneEnabled(true);
      console.log("[LiveKit Web] Microphone enabled");

      setIsConnected(true);
      return true;
    } catch (err) {
      console.error("[LiveKit Web] Connection error:", err);
      throw err;
    }
  }, []);

  const connect = useCallback(async (sessionData: SessionData): Promise<boolean> => {
    setError(null);
    try {
      if (Platform.OS === "web") {
        return await connectWeb(sessionData);
      } else {
        return await connectNative(sessionData);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to connect";
      setError(errorMessage);
      throw err;
    }
  }, [connectNative, connectWeb]);

  const disconnect = useCallback(async () => {
    if (roomRef.current) {
      try {
        if (Platform.OS === "web") {
          const audioEl = document.getElementById("livekit-audio");
          if (audioEl) {
            audioEl.remove();
          }
        }
        await roomRef.current.disconnect();
      } catch (e) {
        console.log("Error disconnecting:", e);
      }
      roomRef.current = null;
    }
    setRemoteVideoTrack(null);
    setRemoteAudioTrack(null);
    setIsConnected(false);
    setError(null);
  }, []);

  useEffect(() => {
    return () => {
      if (roomRef.current) {
        roomRef.current.disconnect?.();
      }
    };
  }, []);

  return {
    connect,
    disconnect,
    remoteVideoTrack,
    remoteAudioTrack,
    isConnected,
    error,
    webVideoRef: Platform.OS === "web" ? webVideoRef : null,
  };
}

export { NativeVideoView };
