import "dotenv/config";
import express from "express";
import type { Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import * as fs from "fs";
import * as path from "path";
import { registerWithThreeTears } from "./integration/three-tears";
import { db, ensureTablesExist } from "./db";
import { users } from "./db/schema";
import { lt } from "drizzle-orm";

const app = express();
const log = console.log;

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

function setupSecurityHeaders(app: express.Application) {
  app.use((req, res, next) => {
    // Skip restrictive headers on OAuth callback path to avoid
    // XSS auditor false positives and CSP blocking the auth flow
    const isAuthCallback = req.path === "/auth" || req.path.startsWith("/auth?");

    // Prevent clickjacking
    res.setHeader("X-Frame-Options", "DENY");
    // Prevent MIME type sniffing
    res.setHeader("X-Content-Type-Options", "nosniff");
    // Disable XSS auditor — it's deprecated and causes false positives
    // on OAuth redirects where the code parameter is reflected in the URL
    res.setHeader("X-XSS-Protection", "0");
    // Control referrer information
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    // Prevent information leakage
    res.removeHeader("X-Powered-By");
    // Content Security Policy (unsafe-inline/unsafe-eval required for Expo Web bundled output)
    if (!isAuthCallback) {
      res.setHeader("Content-Security-Policy", [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' data: blob: https:",
        "font-src 'self' data:",
        "connect-src 'self' https://accounts.google.com https://oauth2.googleapis.com https://www.googleapis.com https://graph.facebook.com https://api.twitter.com https://api.instagram.com https://open.tiktokapis.com wss: ws:",
        "frame-src 'self' https://www.youtube.com",
        "media-src 'self' blob: https:",
        "object-src 'none'",
        "base-uri 'self'",
      ].join("; "));
    }
    // Strict Transport Security (only in production)
    if (process.env.NODE_ENV === "production") {
      res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
    }
    next();
  });
}

// Simple in-memory rate limiter
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

function rateLimit(windowMs: number, maxRequests: number) {
  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    // Don't count OPTIONS preflight requests against rate limits
    if (req.method === "OPTIONS") {
      return next();
    }

    const ip = req.ip || req.socket.remoteAddress || "unknown";
    const now = Date.now();
    const entry = rateLimitStore.get(ip);

    if (!entry || now > entry.resetAt) {
      rateLimitStore.set(ip, { count: 1, resetAt: now + windowMs });
      return next();
    }

    if (entry.count >= maxRequests) {
      res.setHeader("Retry-After", Math.ceil((entry.resetAt - now) / 1000).toString());
      return res.status(429).json({ error: "Too many requests, please try again later" });
    }

    entry.count++;
    next();
  };
}

// Clean up stale rate limit entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of rateLimitStore.entries()) {
    if (now > entry.resetAt) {
      rateLimitStore.delete(ip);
    }
  }
}, 5 * 60 * 1000);

// Auth rate limiter: 20 attempts per 15 minutes
const authRateLimit = rateLimit(15 * 60 * 1000, 20);
// General API rate limiter: 100 requests per minute
const apiRateLimit = rateLimit(60 * 1000, 100);

function setupCors(app: express.Application) {
  app.use((req, res, next) => {
    const origins = new Set<string>();

    if (process.env.REPLIT_DEV_DOMAIN) {
      origins.add(`https://${process.env.REPLIT_DEV_DOMAIN}`);
    }

    if (process.env.REPLIT_DOMAINS) {
      process.env.REPLIT_DOMAINS.split(",").forEach((d) => {
        origins.add(`https://${d.trim()}`);
      });
    }

    origins.add("http://localhost:3000");
    origins.add("http://127.0.0.1:3000");
    origins.add("http://localhost:8081");
    origins.add("http://127.0.0.1:8081");
    origins.add("http://localhost:9081");
    origins.add("http://127.0.0.1:9081");

    const origin = req.header("origin");

    if (origin && origins.has(origin)) {
      res.header("Access-Control-Allow-Origin", origin);
      res.header(
        "Access-Control-Allow-Methods",
        "GET, POST, PUT, PATCH, DELETE, OPTIONS",
      );
      res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
      res.header("Access-Control-Allow-Credentials", "true");
    }

    if (req.method === "OPTIONS") {
      return res.sendStatus(200);
    }

    next();
  });
}

function setupBodyParsing(app: express.Application) {
  // Default limit for JSON API requests (handles base64 images etc.)
  app.use(
    express.json({
      limit: "10mb",
      verify: (req, _res, buf) => {
        req.rawBody = buf;
      },
    }),
  );

  app.use(express.urlencoded({ extended: false, limit: "1mb" }));
}

function setupRequestLogging(app: express.Application) {
  app.use((req, res, next) => {
    const start = Date.now();
    const path = req.path;
    let capturedJsonResponse: Record<string, unknown> | undefined = undefined;

    const originalResJson = res.json;
    res.json = function (bodyJson, ...args) {
      capturedJsonResponse = bodyJson;
      return originalResJson.apply(res, [bodyJson, ...args]);
    };

    res.on("finish", () => {
      if (!path.startsWith("/api")) return;

      // Skip OPTIONS preflight requests
      if (req.method === "OPTIONS") return;

      // Skip noisy polling endpoints (these poll every few seconds)
      // Suppress successful responses (200, 304) and auth failures (401)
      // Still log errors (404, 500) to help debug issues
      const noisyEndpoints = [
        "/api/messages/unread-count",
        "/api/admin/avatar-agent/status",
        "/api/avatar/status",
        "/api/posts/trending",
      ];
      const isNoisy = noisyEndpoints.some(ep => path === ep || path.startsWith(ep + "?"));
      if (isNoisy && (res.statusCode === 200 || res.statusCode === 304 || res.statusCode === 401)) return;

      const duration = Date.now() - start;

      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        // Redact sensitive fields from logged response bodies
        const safeResponse = { ...capturedJsonResponse };
        for (const key of ["sessionToken", "token", "apiKey", "secret", "password"]) {
          if (key in safeResponse) safeResponse[key] = "[REDACTED]";
        }
        logLine += ` :: ${JSON.stringify(safeResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    });

    next();
  });
}

function getAppName(): string {
  try {
    const appJsonPath = path.resolve(process.cwd(), "app.json");
    const appJsonContent = fs.readFileSync(appJsonPath, "utf-8");
    const appJson = JSON.parse(appJsonContent);
    return appJson.expo?.name || "App Landing Page";
  } catch {
    return "App Landing Page";
  }
}

function serveExpoManifest(platform: string, res: Response) {
  const manifestPath = path.resolve(
    process.cwd(),
    "static-build",
    platform,
    "manifest.json",
  );

  if (!fs.existsSync(manifestPath)) {
    return res
      .status(404)
      .json({ error: `Manifest not found for platform: ${platform}` });
  }

  res.setHeader("expo-protocol-version", "1");
  res.setHeader("expo-sfv-version", "0");
  res.setHeader("content-type", "application/json");

  const manifest = fs.readFileSync(manifestPath, "utf-8");
  res.send(manifest);
}

async function serveLandingPage({
  req,
  res,
  landingPageTemplate,
  appName,
}: {
  req: Request;
  res: Response;
  landingPageTemplate: string;
  appName: string;
}) {
  const forwardedProto = req.header("x-forwarded-proto");
  const protocol = forwardedProto || req.protocol || "https";
  const forwardedHost = req.header("x-forwarded-host");
  const host = forwardedHost || req.get("host");
  const baseUrl = `${protocol}://${host}`;
  const expsUrl = `${host}`;

  log(`baseUrl`, baseUrl);
  log(`expsUrl`, expsUrl);

  let threTearsAppId = "";
  try {
    const { getAppId } = await import("./integration/three-tears");
    threTearsAppId = (await getAppId()) || "";
  } catch (error) {
    log("Could not fetch Three Tears app ID:", error);
  }

  const html = landingPageTemplate
    .replace(/BASE_URL_PLACEHOLDER/g, baseUrl)
    .replace(/EXPS_URL_PLACEHOLDER/g, expsUrl)
    .replace(/APP_NAME_PLACEHOLDER/g, appName)
    .replace(/THREE_TEARS_APP_ID_PLACEHOLDER/g, threTearsAppId);

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.status(200).send(html);
}

function configureExpoAndLanding(app: express.Application) {
  const templatePath = path.resolve(
    process.cwd(),
    "server",
    "templates",
    "landing-page.html",
  );
  const landingPageTemplate = fs.readFileSync(templatePath, "utf-8");
  const appName = getAppName();
  const webBuildPath = path.resolve(process.cwd(), "dist");
  const webIndexPath = path.resolve(webBuildPath, "index.html");

  log("Serving static Expo files with dynamic manifest routing");

  // Serve assets from dist first (production), fallback to root
  const distAssetsPath = path.resolve(process.cwd(), "dist", "assets");
  const rootAssetsPath = path.resolve(process.cwd(), "assets");
  
  const clientAssetsPath = path.resolve(process.cwd(), "client", "assets");
  const distClientAssetsPath = path.resolve(process.cwd(), "dist", "client", "assets");
  const nodeModulesPath = path.resolve(process.cwd(), "node_modules");
  
  app.use("/assets", (req, res, next) => {
    // Handle Expo web's unstable_path query parameter format
    const unstablePath = req.query.unstable_path as string;
    
    if (unstablePath) {
      // Decode and resolve the path
      const decodedPath = decodeURIComponent(unstablePath);

      // Block path traversal attempts
      if (decodedPath.includes("..") || decodedPath.includes("\\")) {
        return res.status(403).send("Forbidden");
      }

      let filePath: string;
      let altFilePath: string | null = null;

      if (decodedPath.startsWith("./client/assets/")) {
        const filename = decodedPath.replace("./client/assets/", "");
        // Check dist first for production, fallback to source
        filePath = path.join(distClientAssetsPath, filename);
        altFilePath = path.join(clientAssetsPath, filename);
      } else if (decodedPath.startsWith("./node_modules/")) {
        const relativePath = decodedPath.replace("./node_modules/", "");
        filePath = path.join(nodeModulesPath, relativePath);
      } else if (decodedPath.startsWith("./assets/")) {
        const filename = decodedPath.replace("./assets/", "");
        filePath = path.join(distAssetsPath, filename);
        altFilePath = path.join(rootAssetsPath, filename);
      } else {
        // Reject unknown path patterns to prevent path traversal
        return res.status(403).send("Forbidden");
      }
      
      if (fs.existsSync(filePath)) {
        return res.sendFile(filePath);
      }
      if (altFilePath && fs.existsSync(altFilePath)) {
        return res.sendFile(altFilePath);
      }
      return res.status(404).send("Asset not found");
    }
    
    // Original path-based handling for direct asset requests
    // Skip if path is just "/" (directory request without specific file)
    if (req.path === "/" || req.path === "") {
      return res.status(404).send("Asset not found");
    }

    // Block path traversal in direct asset requests
    if (req.path.includes("..") || req.path.includes("\\")) {
      return res.status(403).send("Forbidden");
    }
    
    const distFilePath = path.join(distAssetsPath, req.path);
    const rootFilePath = path.join(rootAssetsPath, req.path);
    const clientFilePath = path.join(clientAssetsPath, req.path);
    const distClientFilePath = path.join(distClientAssetsPath, req.path);
    
    if (fs.existsSync(distFilePath)) {
      return res.sendFile(distFilePath);
    } else if (fs.existsSync(rootFilePath)) {
      return res.sendFile(rootFilePath);
    } else if (fs.existsSync(distClientFilePath)) {
      return res.sendFile(distClientFilePath);
    } else if (fs.existsSync(clientFilePath)) {
      return res.sendFile(clientFilePath);
    }
    
    // Return 404 for asset requests that don't find a file
    // Prevents falling through to static middleware which would try to serve directories
    return res.status(404).send("Asset not found");
  });

  app.use("/uploads", express.static(path.resolve(process.cwd(), "uploads")));
  app.use("/generated", express.static(path.resolve(process.cwd(), "public/generated")));
  app.use(express.static(path.resolve(process.cwd(), "static-build")));

  if (fs.existsSync(webBuildPath)) {
    app.use(express.static(webBuildPath));
  }

  app.use((req: Request, res: Response, next: NextFunction) => {
    if (req.path.startsWith("/api")) {
      return next();
    }

    const platform = req.header("expo-platform");
    if (platform && (platform === "ios" || platform === "android")) {
      if (req.path === "/" || req.path === "/manifest") {
        return serveExpoManifest(platform, res);
      }
    }

    if (fs.existsSync(webIndexPath)) {
      const extname = path.extname(req.path);
      if (!extname || req.path === "/") {
        return res.sendFile(webIndexPath);
      }
    } else {
      if (req.path === "/") {
        serveLandingPage({
          req,
          res,
          landingPageTemplate,
          appName,
        });
        return;
      }
    }

    next();
  });

  log("Expo routing: Checking expo-platform header on / and /manifest");
}

function setupErrorHandler(app: express.Application) {
  app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    const error = err as {
      status?: number;
      statusCode?: number;
      message?: string;
    };

    const status = error.status || error.statusCode || 500;
    // Don't leak internal error details in production
    const message = status === 500 && process.env.NODE_ENV === "production"
      ? "Internal Server Error"
      : error.message || "Internal Server Error";

    console.error("Unhandled error:", err);
    res.status(status).json({ message });
  });
}

async function runCreditMigration() {
  try {
    const result = await db
      .update(users)
      .set({ credits: 30 })
      .where(lt(users.credits, 30))
      .returning({ id: users.id });
    
    if (result.length > 0) {
      log(`[Migration] Updated ${result.length} users to 30 credits`);
    }
  } catch (error) {
    console.error("[Migration] Failed to update credits:", error);
  }
}

import { startAvatarAgent, killAvatarAgentOnShutdown } from "./services/avatar-agent";

process.on("SIGTERM", () => {
  killAvatarAgentOnShutdown();
  process.exit(0);
});

process.on("SIGINT", () => {
  killAvatarAgentOnShutdown();
  process.exit(0);
});

(async () => {
  setupSecurityHeaders(app);
  setupCors(app);
  setupBodyParsing(app);
  setupRequestLogging(app);

  // Rate limiting on auth endpoints
  app.use("/api/auth", authRateLimit);
  // General API rate limiting (skip auth routes — they have their own limiter)
  app.use("/api", (req, res, next) => {
    if (req.path.startsWith("/auth")) return next();
    return apiRateLimit(req, res, next);
  });

  configureExpoAndLanding(app);

  await runCreditMigration();

  // Ensure all database tables exist (safe to run on every startup)
  await ensureTablesExist();

  const server = await registerRoutes(app);

  setupErrorHandler(app);

  const port = parseInt(process.env.PORT || "3000", 10);
  server.listen(port, () => {
      log(`express server serving on port ${port}`);
      
      registerWithThreeTears().catch((error) => {
        console.error("[Three Tears] Registration failed:", error);
      });
      
      startAvatarAgent();
    },
  );
})();
