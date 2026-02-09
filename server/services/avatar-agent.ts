import { spawn, ChildProcess, execSync } from "child_process";
import path from "path";
import fs from "fs";

let avatarAgentProcess: ChildProcess | null = null;
let avatarAgentIntentionalStop = false;
let avatarAgentRestartCount = 0;
let avatarAgentLastCrashTime = 0;
let avatarAgentStartTime = 0;
let avatarAgentDisabled = false;
let avatarAgentDisabledReason: string | null = null;
const AVATAR_AGENT_MAX_RESTARTS = 3;
const AVATAR_AGENT_RESTART_WINDOW_MS = 600000; // 10 minutes

function log(message: string) {
  console.log(message);
}

export function startAvatarAgent() {
  if (avatarAgentDisabled) {
    log(`[Avatar Agent] Agent is disabled: ${avatarAgentDisabledReason}`);
    return;
  }

  const agentPath = path.join(process.cwd(), "avatar-agent");

  if (!fs.existsSync(path.join(agentPath, "agent.py"))) {
    log("[Avatar Agent] agent.py not found, skipping avatar agent startup");
    return;
  }

  log("[Avatar Agent] Starting Python avatar agent...");

  const agentMode = process.env.NODE_ENV === "production" ? "start" : "dev";
  log(`[Avatar Agent] Spawning agent in mode: ${agentMode}`);

  const agentScriptPath = path.join(agentPath, "agent.py");

  // Only pass the specific env vars the Python agent needs (not all server secrets)
  const agentEnv: Record<string, string | undefined> = {
    PYTHONUNBUFFERED: "1",
    PATH: process.env.PATH,
    PYTHONPATH: agentPath,
    HOME: process.env.HOME,
    NODE_ENV: process.env.NODE_ENV,
    API_BASE_URL: process.env.API_BASE_URL || `http://localhost:${process.env.PORT || 5000}`,
    // LiveKit (required by agent)
    LIVEKIT_URL: process.env.LIVEKIT_URL,
    LIVEKIT_API_KEY: process.env.LIVEKIT_API_KEY,
    LIVEKIT_API_SECRET: process.env.LIVEKIT_API_SECRET,
    // Gemini keys (agent supports GEMINI_API_KEY_1-5 and GOOGLE_AI_API_KEY)
    GEMINI_API_KEY_1: process.env.GEMINI_API_KEY_1,
    GEMINI_API_KEY_2: process.env.GEMINI_API_KEY_2,
    GEMINI_API_KEY_3: process.env.GEMINI_API_KEY_3,
    GEMINI_API_KEY_4: process.env.GEMINI_API_KEY_4,
    GEMINI_API_KEY_5: process.env.GEMINI_API_KEY_5,
    GOOGLE_AI_API_KEY: process.env.GOOGLE_AI_API_KEY,
    // Simli avatar
    SIMLI_API_KEY: process.env.SIMLI_API_KEY,
    SIMLI_FACE_ID: process.env.SIMLI_FACE_ID,
  };

  avatarAgentStartTime = Date.now();
  avatarAgentProcess = spawn("python3", [agentScriptPath, agentMode], {
    cwd: agentPath,
    stdio: ["ignore", "pipe", "pipe"],
    env: agentEnv,
  });

  avatarAgentProcess.stdout?.on("data", (data) => {
    const lines = data.toString().trim().split("\n");
    lines.forEach((line: string) => {
      if (line.trim()) {
        log(`[Avatar Agent] ${line}`);
      }
    });
  });

  avatarAgentProcess.stderr?.on("data", (data) => {
    const lines = data.toString().trim().split("\n");
    lines.forEach((line: string) => {
      if (line.trim()) {
        console.error(`[Avatar Agent] ${line}`);
      }
    });
  });

  avatarAgentProcess.on("error", (error) => {
    console.error("[Avatar Agent] Failed to start:", error.message);
  });

  avatarAgentProcess.on("exit", (code, signal) => {
    const uptime = avatarAgentStartTime > 0 ? Date.now() - avatarAgentStartTime : 0;
    if (code !== null) {
      log(`[Avatar Agent] Process exited with code ${code} (uptime: ${uptime}ms)`);
    } else if (signal) {
      log(`[Avatar Agent] Process killed with signal ${signal} (uptime: ${uptime}ms)`);
    }
    avatarAgentProcess = null;

    // Auto-restart logic if not intentionally stopped
    if (!avatarAgentIntentionalStop) {
      const now = Date.now();

      // Only count as a crash if the process ran for less than 60 seconds
      // Longer runs that exit are considered normal shutdowns
      const isRapidCrash = uptime < 60000;

      // Reset restart count if outside the crash window
      if (now - avatarAgentLastCrashTime > AVATAR_AGENT_RESTART_WINDOW_MS) {
        avatarAgentRestartCount = 0;
      }

      if (isRapidCrash) {
        if (avatarAgentRestartCount < AVATAR_AGENT_MAX_RESTARTS) {
          avatarAgentRestartCount++;
          avatarAgentLastCrashTime = now;
          const delay = Math.min(1000 * Math.pow(2, avatarAgentRestartCount - 1), 30000);
          log(`[Avatar Agent] Crashed after ${uptime}ms, restarting in ${delay}ms (attempt ${avatarAgentRestartCount}/${AVATAR_AGENT_MAX_RESTARTS})...`);
          setTimeout(() => {
            if (!avatarAgentIntentionalStop && !avatarAgentDisabled) {
              startAvatarAgent();
            }
          }, delay);
        } else {
          avatarAgentDisabled = true;
          avatarAgentDisabledReason = `Crashed ${AVATAR_AGENT_MAX_RESTARTS} times within ${AVATAR_AGENT_RESTART_WINDOW_MS / 60000} minutes`;
          console.error(`[Avatar Agent] DISABLED: ${avatarAgentDisabledReason}. Manual restart required via admin panel.`);
        }
      } else {
        // Normal shutdown after running for a while - restart without counting as crash
        log(`[Avatar Agent] Process ended normally after ${Math.round(uptime / 1000)}s, restarting...`);
        avatarAgentRestartCount = 0; // Reset crash count
        setTimeout(() => {
          if (!avatarAgentIntentionalStop && !avatarAgentDisabled) {
            startAvatarAgent();
          }
        }, 2000);
      }
    }
  });
}

export function stopAvatarAgent(): boolean {
  if (avatarAgentProcess) {
    avatarAgentIntentionalStop = true;
    avatarAgentProcess.kill();
    log("[Avatar Agent] Stopping agent...");
    return true;
  }
  return false;
}

export function restartAvatarAgent(): { success: boolean; message: string } {
  avatarAgentIntentionalStop = true;

  // Clear our managed process reference
  if (avatarAgentProcess) {
    try {
      avatarAgentProcess.kill();
    } catch (error) {
      // Process might already be dead
    }
    avatarAgentProcess = null;
  }

  // Kill ALL running avatar agent processes (handles multiple instances, stale PIDs, etc.)
  let killedCount = 0;
  try {
    const result = execSync("pkill -f 'python.*agent\\.py' 2>/dev/null; echo $?", {
      encoding: "utf-8",
      timeout: 5000,
    });
    // pkill returns 0 if processes were killed, 1 if none found
    if (result.trim() === "0") {
      killedCount = 1; // At least one was killed
    }
    log(`[Avatar Agent] Killed all existing avatar agent processes`);
  } catch (error) {
    // pkill failed or no processes found - that's fine
    log(`[Avatar Agent] No existing processes to kill (or pkill failed)`);
  }

  // Wait a moment for processes to fully terminate, then start fresh
  setTimeout(() => {
    avatarAgentIntentionalStop = false;
    avatarAgentRestartCount = 0;
    avatarAgentDisabled = false;
    avatarAgentDisabledReason = null;
    startAvatarAgent();
  }, 1500);

  return {
    success: true,
    message: killedCount > 0
      ? "Avatar agent is restarting..."
      : "Starting avatar agent..."
  };
}

export function getAvatarAgentStatus(): {
  running: boolean;
  pid: number | null;
  restartCount: number;
  managedByServer: boolean;
  disabled: boolean;
  disabledReason: string | null;
} {
  // First check if we have a managed process
  if (avatarAgentProcess !== null) {
    return {
      running: true,
      pid: avatarAgentProcess.pid || null,
      restartCount: avatarAgentRestartCount,
      managedByServer: true,
      disabled: avatarAgentDisabled,
      disabledReason: avatarAgentDisabledReason,
    };
  }

  // Check for any running avatar agent process (started externally)
  try {
    const result = execSync("pgrep -f 'python.*agent\\.py' 2>/dev/null || true", {
      encoding: "utf-8",
      timeout: 5000,
    }).trim();

    if (result) {
      const pids = result.split("\n").filter(p => p.trim());
      if (pids.length > 0) {
        return {
          running: true,
          pid: parseInt(pids[0], 10),
          restartCount: avatarAgentRestartCount,
          managedByServer: false,
          disabled: avatarAgentDisabled,
          disabledReason: avatarAgentDisabledReason,
        };
      }
    }
  } catch (error) {
    // pgrep failed, assume not running
  }

  return {
    running: false,
    pid: null,
    restartCount: avatarAgentRestartCount,
    managedByServer: false,
    disabled: avatarAgentDisabled,
    disabledReason: avatarAgentDisabledReason,
  };
}

export function killAvatarAgentOnShutdown(): void {
  if (avatarAgentProcess) {
    avatarAgentProcess.kill();
  }
}
