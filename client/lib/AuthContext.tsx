import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as AuthSession from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";
import { Platform } from "react-native";
import { AuthUser } from "./types";
import { getApiUrl, apiRequest, setOnUnauthorized } from "./query-client";
import { queryClient } from "./query-client";

// Complete any pending auth sessions when the module loads
WebBrowser.maybeCompleteAuthSession();

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  sessionToken: string | null;
  login: (provider: AuthUser["provider"]) => Promise<void>;
  logout: () => Promise<void>;
  connectAccount: (provider: AuthUser["connectedAccounts"][0]["provider"]) => void;
  disconnectAccount: (provider: AuthUser["connectedAccounts"][0]["provider"]) => void;
  updateUser: (updates: Partial<AuthUser>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_STORAGE_KEY = "@mien_kingdom_auth";
const SESSION_TOKEN_KEY = "@mien_kingdom_session";

const getRedirectUri = () => {
  // For Replit environments, construct redirect URI from the API URL
  // This handles both dev and deployed Replit domains
  if (getApiUrl().includes("replit.dev") || getApiUrl().includes("repl.co") || (process.env.NODE_ENV === "development" && (getApiUrl().includes("localhost") || getApiUrl().includes("127.0.0.1")))) {
    const baseUrl = getApiUrl().replace(/\/$/, "");
    // Remove port 5000 if it exists in the URL
    const cleanUrl = baseUrl.replace(/:\d+$/, "");
    return `${cleanUrl}/auth`;
  }

  if (Platform.OS === "web") {
    return AuthSession.makeRedirectUri({
      path: "auth",
    });
  }
  return AuthSession.makeRedirectUri({
    scheme: "mienkingdom",
    path: "auth",
    preferLocalhost: false,
  });
};

const oauthConfigs: Record<string, {
  authorizationEndpoint: string;
  tokenEndpoint: string;
  scopes: string[];
  usePKCE?: boolean;
}> = {
  google: {
    authorizationEndpoint: "https://accounts.google.com/o/oauth2/v2/auth",
    tokenEndpoint: "https://oauth2.googleapis.com/token",
    scopes: ["openid", "profile", "email"],
    usePKCE: true,
  },
  facebook: {
    authorizationEndpoint: "https://www.facebook.com/v18.0/dialog/oauth",
    tokenEndpoint: "https://graph.facebook.com/v18.0/oauth/access_token",
    scopes: ["public_profile", "email"],
  },
  twitter: {
    authorizationEndpoint: "https://twitter.com/i/oauth2/authorize",
    tokenEndpoint: "https://api.twitter.com/2/oauth2/token",
    scopes: ["tweet.read", "users.read", "offline.access"],
    usePKCE: true,
  },
  instagram: {
    authorizationEndpoint: "https://api.instagram.com/oauth/authorize",
    tokenEndpoint: "https://api.instagram.com/oauth/access_token",
    scopes: ["user_profile"],
  },
  tiktok: {
    authorizationEndpoint: "https://www.tiktok.com/v2/auth/authorize/",
    tokenEndpoint: "https://open.tiktokapis.com/v2/oauth/token/",
    scopes: ["user.info.basic"],
    usePKCE: true,
  },
};

// Storage key for pending OAuth state (code verifier)
const PENDING_AUTH_KEY = "@mien_kingdom_pending_auth";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sessionToken, setSessionToken] = useState<string | null>(null);

  // Handle OAuth callback from URL (for web full-page redirects)
  const handleOAuthCallback = useCallback(async () => {
    if (Platform.OS !== "web") return false;

    // Check if we're on the /auth callback path with a code
    const url = window.location.href;
    const urlObj = new URL(url);
    const code = urlObj.searchParams.get("code");
    const state = urlObj.searchParams.get("state");

    if (!code || !urlObj.pathname.endsWith("/auth")) return false;

    console.log("[Auth] Detected OAuth callback, processing...");

    try {
      // Retrieve stored pending auth data
      const pendingAuthStr = await AsyncStorage.getItem(PENDING_AUTH_KEY);
      if (!pendingAuthStr) {
        console.log("[Auth] No pending auth data found");
        // Clear URL params and return
        window.history.replaceState({}, document.title, "/");
        return false;
      }

      const pendingAuth = JSON.parse(pendingAuthStr);
      const { provider, codeVerifier, redirectUri } = pendingAuth;

      // Clear pending auth data
      await AsyncStorage.removeItem(PENDING_AUTH_KEY);

      // Exchange code for token via backend
      const callbackRes = await apiRequest("POST", `/api/auth/callback/${provider}`, {
        code,
        redirectUri,
        codeVerifier,
      });

      const callbackData = await callbackRes.json();
      const { sessionToken: newToken, user: userData } = callbackData;

      const authUser: AuthUser = {
        id: userData.id,
        email: userData.email,
        displayName: userData.displayName,
        avatar: userData.avatar,
        provider: userData.provider,
        role: userData.role || "user",
        connectedAccounts: userData.connectedAccounts,
        totalXp: userData.totalXp ?? 0,
        level: userData.level ?? 1,
      };

      await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authUser));
      await AsyncStorage.setItem(SESSION_TOKEN_KEY, newToken);

      setSessionToken(newToken);
      setUser(authUser);

      // Clear URL params after successful auth
      window.history.replaceState({}, document.title, "/");

      console.log("[Auth] OAuth callback processed successfully");
      return true;
    } catch (error) {
      console.error("[Auth] OAuth callback error:", error);
      // Clear URL params on error
      window.history.replaceState({}, document.title, "/");
      return false;
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      // First check if this is an OAuth callback
      const wasCallback = await handleOAuthCallback();
      if (!wasCallback) {
        // Not a callback, load existing user
        await loadUser();
      }
      setIsLoading(false);
    };
    init();
  }, [handleOAuthCallback]);

  // Register global 401 handler so any API call that gets a 401
  // automatically logs the user out and redirects to the login screen
  useEffect(() => {
    const handler = () => {
      console.log("[Auth] Received 401 - session expired, logging out");
      AsyncStorage.removeItem(AUTH_STORAGE_KEY);
      AsyncStorage.removeItem(SESSION_TOKEN_KEY);
      queryClient.clear();
      setUser(null);
      setSessionToken(null);
    };
    setOnUnauthorized(handler);
    return () => setOnUnauthorized(null);
  }, []);

  const loadUser = async () => {
    try {
      const storedUser = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
      const storedToken = await AsyncStorage.getItem(SESSION_TOKEN_KEY);
      
      if (storedUser && storedToken) {
        const parsedUser = JSON.parse(storedUser) as AuthUser;

        // Validate session by fetching fresh credits/tier from backend
        try {
          const response = await fetch(
            new URL("/api/subscription", getApiUrl()).toString(),
            {
              headers: { Authorization: `Bearer ${storedToken}` },
            }
          );
          if (response.status === 401) {
            // Session expired or invalid - clear stored auth and stay on login screen
            console.log("[Auth] Stored session is expired or invalid, clearing auth state");
            await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
            await AsyncStorage.removeItem(SESSION_TOKEN_KEY);
            return;
          }
          if (response.ok) {
            const data = await response.json();
            if (data.subscriptionCredits !== undefined) parsedUser.credits = data.subscriptionCredits;
            if (data.packCredits !== undefined) parsedUser.packCredits = data.packCredits;
            if (data.tierSlug !== undefined) parsedUser.tierSlug = data.tierSlug;
            await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(parsedUser));
          }
        } catch (error) {
          // If fetch fails (offline/network error), apply defaults only for dev bypass user
          if (process.env.NODE_ENV === "development" && parsedUser.id === "dev-admin-1") {
            if (parsedUser.credits === undefined) parsedUser.credits = 30;
            if (parsedUser.packCredits === undefined) parsedUser.packCredits = 0;
            if (parsedUser.tierSlug === undefined) parsedUser.tierSlug = "free";
            await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(parsedUser));
          }
        }

        setUser(parsedUser);
        setSessionToken(storedToken);
      } else if (false && process.env.NODE_ENV === "development") {
        // Dev bypass: DISABLED - enable to auto-login as admin
        const devUser: AuthUser = {
          id: "dev-admin-1",
          email: "dev-admin@mien.local",
          displayName: "Dev Admin",
          avatar: "",
          provider: "google",
          role: "admin",
          connectedAccounts: [],
          credits: 30,
          packCredits: 0,
          tierSlug: "free",
        };
        const devToken = "dev-bypass-token";

        setUser(devUser);
        setSessionToken(devToken);

        // Store for persistence
        await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(devUser));
        await AsyncStorage.setItem(SESSION_TOKEN_KEY, devToken);

        console.log("[Dev Mode] Bypassed login, logged in as admin");
      }
    } catch (error) {
      console.error("Failed to load user:", error);
    }
  };

  const login = async (provider: AuthUser["provider"]) => {
    setIsLoading(true);
    try {
      // Development bypass to allow testing without configured OAuth (localhost only)
      if (process.env.NODE_ENV === "development" && (getApiUrl().includes("localhost") || getApiUrl().includes("127.0.0.1"))) {
        const mockUser: AuthUser = {
          id: 1,
          email: "dev@mienkingdom.com",
          displayName: "Dev User",
          avatar: null,
          provider: "google",
          role: "admin",
          connectedAccounts: [
            { provider: "google", username: "dev@mienkingdom.com", connected: true },
            { provider: "youtube", username: "", connected: false },
            { provider: "tiktok", username: "", connected: false },
            { provider: "instagram", username: "", connected: false },
            { provider: "facebook", username: "", connected: false },
            { provider: "twitter", username: "", connected: false },
          ],
        };
        const mockToken = "dev-session-token";
        
        await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(mockUser));
        await AsyncStorage.setItem(SESSION_TOKEN_KEY, mockToken);
        
        setUser(mockUser);
        setSessionToken(mockToken);
        return;
      }

      const configRes = await fetch(new URL(`/api/auth/config/${provider}`, getApiUrl()).toString());
      const config = await configRes.json();

      if (!config.hasCredentials) {
        throw new Error(`${provider} login is not configured. Please add OAuth credentials.`);
      }

      const oauthConfig = oauthConfigs[provider];
      if (!oauthConfig) {
        throw new Error(`${provider} is not supported yet`);
      }

      const redirectUri = getRedirectUri();
      const discovery = {
        authorizationEndpoint: oauthConfig.authorizationEndpoint,
        tokenEndpoint: oauthConfig.tokenEndpoint,
      };

      const request = new AuthSession.AuthRequest({
        clientId: config.clientId,
        scopes: oauthConfig.scopes,
        redirectUri,
        usePKCE: oauthConfig.usePKCE ?? false,
        extraParams: provider === "twitter" ? { response_type: "code" } : undefined,
      });

      await request.makeAuthUrlAsync(discovery);

      // Store pending auth data for web full-page redirects
      // This is needed because on web, the OAuth flow may redirect the entire page
      // rather than using a popup, which would lose the promptAsync context
      if (Platform.OS === "web") {
        await AsyncStorage.setItem(PENDING_AUTH_KEY, JSON.stringify({
          provider,
          codeVerifier: request.codeVerifier,
          redirectUri,
        }));
        
        // Detect mobile browsers or Safari — popups open as new tabs on mobile
        // and can't communicate back, so use full-page redirect instead
        const isMobile = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
        const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

        if ((isMobile || isSafari) && request.url) {
          console.log("[Auth] Mobile/Safari detected, using full-page redirect");
          window.location.href = request.url;
          return; // Exit early - page will reload with auth callback
        }
      }

      const result = await request.promptAsync(discovery);

      // Clear pending auth data if we get here (popup flow worked)
      if (Platform.OS === "web") {
        await AsyncStorage.removeItem(PENDING_AUTH_KEY);
      }

      if (result.type === "success" && result.params.code) {
        const callbackRes = await apiRequest("POST", `/api/auth/callback/${provider}`, {
          code: result.params.code,
          redirectUri,
          codeVerifier: request.codeVerifier,
        });

        const callbackData = await callbackRes.json();
        const { sessionToken: newToken, user: userData } = callbackData;

        const authUser: AuthUser = {
          id: userData.id,
          email: userData.email,
          displayName: userData.displayName,
          avatar: userData.avatar,
          provider: userData.provider,
          role: userData.role || "user",
          connectedAccounts: userData.connectedAccounts,
          totalXp: userData.totalXp ?? 0,
          level: userData.level ?? 1,
        };

        await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authUser));
        await AsyncStorage.setItem(SESSION_TOKEN_KEY, newToken);

        setSessionToken(newToken);
        setUser(authUser);
      } else if (result.type === "error") {
        throw new Error(result.error?.message || "Authentication failed");
      }
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      if (sessionToken) {
        await fetch(new URL("/api/auth/logout", getApiUrl()).toString(), {
          method: "POST",
          headers: {
            Authorization: `Bearer ${sessionToken}`,
          },
        });
      }

      await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
      await AsyncStorage.removeItem(SESSION_TOKEN_KEY);
      queryClient.clear();
      setUser(null);
      setSessionToken(null);
    } catch (error) {
      console.error("Failed to logout:", error);
    }
  };

  const connectAccount = (provider: AuthUser["connectedAccounts"][0]["provider"]) => {
    if (!user) return;
    const updated = {
      ...user,
      connectedAccounts: user.connectedAccounts.map((acc) =>
        acc.provider === provider
          ? { ...acc, connected: true, username: `@${provider}_user` }
          : acc
      ),
    };
    setUser(updated);
    AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(updated));
  };

  const disconnectAccount = (provider: AuthUser["connectedAccounts"][0]["provider"]) => {
    if (!user) return;
    const updated = {
      ...user,
      connectedAccounts: user.connectedAccounts.map((acc) =>
        acc.provider === provider ? { ...acc, connected: false, username: "" } : acc
      ),
    };
    setUser(updated);
    AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(updated));
  };

  const updateUser = async (updates: Partial<AuthUser>) => {
    if (!user) return;
    const updated = { ...user, ...updates };
    setUser(updated);
    await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(updated));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        sessionToken,
        login,
        logout,
        connectAccount,
        disconnectAccount,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
