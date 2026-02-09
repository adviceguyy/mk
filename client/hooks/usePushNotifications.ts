import { useState, useEffect, useRef, useCallback } from "react";
import { Platform } from "react-native";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { useNavigation, CommonActions } from "@react-navigation/native";

import { useAuth } from "@/lib/AuthContext";
import { apiRequest, getApiUrl } from "@/lib/query-client";

// Configure how notifications are handled when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export function usePushNotifications() {
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<string | null>(null);
  const [notification, setNotification] = useState<Notifications.Notification | null>(null);
  const notificationListener = useRef<Notifications.Subscription>();
  const responseListener = useRef<Notifications.Subscription>();
  const navigation = useNavigation();
  const { user, sessionToken } = useAuth();

  // Register token with server
  const registerTokenWithServer = useCallback(async (token: string) => {
    if (!sessionToken) return;

    try {
      const platform = Platform.OS === "ios" ? "ios" : Platform.OS === "android" ? "android" : "web";
      await apiRequest("POST", "/api/push-tokens", { token, platform }, { token: sessionToken });
    } catch (error) {
      console.error("Failed to register push token with server:", error);
    }
  }, [sessionToken]);

  // Deactivate token on logout
  const deactivateToken = useCallback(async () => {
    if (!sessionToken || !expoPushToken) return;

    try {
      await apiRequest("DELETE", "/api/push-tokens", { token: expoPushToken }, { token: sessionToken });
    } catch (error) {
      console.error("Failed to deactivate push token:", error);
    }
  }, [sessionToken, expoPushToken]);

  // Request permissions and get push token
  const registerForPushNotifications = useCallback(async (): Promise<string | null> => {
    // Only works on physical devices
    if (!Device.isDevice) {
      console.log("Push notifications only work on physical devices");
      return null;
    }

    // Check current permission status
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    setPermissionStatus(existingStatus);

    // Request permission if not granted
    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
      setPermissionStatus(status);
    }

    if (finalStatus !== "granted") {
      console.log("Push notification permission not granted");
      return null;
    }

    // Get the Expo push token
    try {
      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId: "mien-kingdom", // Use your Expo project slug
      });

      // Set up Android notification channel
      if (Platform.OS === "android") {
        await Notifications.setNotificationChannelAsync("default", {
          name: "Default",
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: "#DC2626",
        });
      }

      return tokenData.data;
    } catch (error) {
      console.error("Failed to get push token:", error);
      return null;
    }
  }, []);

  // Handle notification response (when user taps on notification)
  const handleNotificationResponse = useCallback((response: Notifications.NotificationResponse) => {
    const data = response.notification.request.content.data;

    if (!data) return;

    // Navigate based on notification type
    if (data.type === "new_follower" && data.followerId) {
      navigation.dispatch(
        CommonActions.navigate({
          name: "HomeTab",
          params: {
            screen: "UserProfile",
            params: { userId: data.followerId },
          },
        })
      );
    } else if (data.type === "new_post" && data.postId) {
      navigation.dispatch(
        CommonActions.navigate({
          name: "HomeTab",
          params: {
            screen: "Home",
          },
        })
      );
    }
  }, [navigation]);

  // Set up notification listeners and register for push notifications
  useEffect(() => {
    // Only set up when user is logged in
    if (!user || !sessionToken) return;

    registerForPushNotifications().then((token) => {
      if (token) {
        setExpoPushToken(token);
        registerTokenWithServer(token);
      }
    });

    // Listen for incoming notifications (foreground)
    notificationListener.current = Notifications.addNotificationReceivedListener((notification) => {
      setNotification(notification);
    });

    // Listen for notification responses (user taps notification)
    responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
      handleNotificationResponse(response);
    });

    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, [user, sessionToken, registerForPushNotifications, registerTokenWithServer, handleNotificationResponse]);

  return {
    expoPushToken,
    permissionStatus,
    notification,
    deactivateToken,
    requestPermissions: registerForPushNotifications,
  };
}
