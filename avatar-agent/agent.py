#!/usr/bin/env python3
"""
Simli Avatar Agent for Mien Kingdom
This agent powers the "Talk to Ong" feature using LiveKit and Simli
"""

import asyncio
import logging
import os
import sys
import aiohttp

# Configure logging BEFORE importing livekit to reduce noise from internal health checks
# These produce excessive "process is unresponsive" warnings that aren't actionable
logging.getLogger("livekit.agents").setLevel(logging.ERROR)
logging.getLogger("livekit").setLevel(logging.WARNING)

logger = logging.getLogger("ong-avatar-agent")
logger.setLevel(logging.INFO)

# Suppress local variables in tracebacks to prevent API key leakage
# Monkey-patch rich.traceback.install to always disable show_locals
# This must be done before importing livekit.agents which calls install()
def _patch_rich_traceback():
    try:
        import rich.traceback
        _orig_install = rich.traceback.install
        def _patched_install(*args, **kwargs):
            kwargs['show_locals'] = False
            return _orig_install(*args, **kwargs)
        rich.traceback.install = _patched_install
    except Exception:
        pass

_patch_rich_traceback()

from dotenv import load_dotenv

from livekit.agents import Agent, AgentSession, JobContext, WorkerOptions, WorkerType, cli
from livekit.plugins import google, simli

load_dotenv()

# Default instructions (fallback if API is unavailable)
DEFAULT_INSTRUCTIONS = """You are Ong, a friendly AI companion for the Mien Kingdom community.

Your role:
- Help users learn about Mien culture, traditions, and history
- Assist with Mien language translation and pronunciation
- Share knowledge about Mien cuisine, clothing, and customs
- Be warm, patient, and encouraging with users of all ages
- Speak naturally and conversationally, like a wise friend

Guidelines:
- Keep responses concise and conversational (1-3 sentences typically)
- Use simple, clear language
- Be respectful of Mien cultural traditions
- If you don't know something about Mien culture, admit it honestly
- Encourage users to explore and learn more about their heritage

Remember: You represent the Mien Kingdom community - be welcoming and inclusive!
"""

DEFAULT_VOICE = "Charon"


async def fetch_avatar_settings():
    """Fetch avatar settings from the API"""
    api_base_url = os.getenv("API_BASE_URL", "http://localhost:5000")
    settings_url = f"{api_base_url}/api/avatar/settings"

    try:
        async with aiohttp.ClientSession() as session:
            async with session.get(settings_url, timeout=aiohttp.ClientTimeout(total=5)) as response:
                if response.status == 200:
                    data = await response.json()
                    logger.info(f"Fetched avatar settings: voice={data.get('voice')}")
                    return {
                        "voice": data.get("voice", DEFAULT_VOICE),
                        "prompt": data.get("prompt", DEFAULT_INSTRUCTIONS),
                    }
                else:
                    logger.warning(f"Failed to fetch avatar settings: HTTP {response.status}")
    except Exception as e:
        logger.warning(f"Error fetching avatar settings: {e}")

    # Return defaults if fetch fails
    return {
        "voice": DEFAULT_VOICE,
        "prompt": DEFAULT_INSTRUCTIONS,
    }


async def entrypoint(ctx: JobContext):
    """Main entry point for the avatar agent"""
    
    # Connect to the room first - this is CRITICAL for keeping the agent alive
    await ctx.connect()
    
    logger.info(f"Starting Ong avatar agent for room: {ctx.room.name}")
    
    # Get API keys from environment
    simli_api_key = os.getenv("SIMLI_API_KEY")
    simli_face_id = os.getenv("SIMLI_FACE_ID")
    
    # Get Gemini key - support rotation via index passed in room metadata
    gemini_key_index = 0
    if ctx.room.metadata:
        try:
            import json
            metadata = json.loads(ctx.room.metadata)
            gemini_key_index = metadata.get("geminiKeyIndex", 0)
        except:
            pass
    
    # Select the appropriate Gemini key
    gemini_key = None
    for i in range(1, 6):
        key_name = f"GEMINI_API_KEY_{i}"
        key = os.getenv(key_name)
        if key and i - 1 == gemini_key_index:
            gemini_key = key
            break
    
    # Fallback to first available key
    if not gemini_key:
        for i in range(1, 6):
            key = os.getenv(f"GEMINI_API_KEY_{i}")
            if key:
                gemini_key = key
                break
    
    if not gemini_key:
        gemini_key = os.getenv("GOOGLE_AI_API_KEY")
    
    if not all([simli_api_key, simli_face_id, gemini_key]):
        logger.error("Missing required API keys for avatar agent")
        logger.error(f"SIMLI_API_KEY: {'set' if simli_api_key else 'missing'}")
        logger.error(f"SIMLI_FACE_ID: {'set' if simli_face_id else 'missing'}")
        logger.error(f"GEMINI_API_KEY: {'set' if gemini_key else 'missing'}")
        return
    
    logger.info(f"Using Gemini key index: {gemini_key_index}")

    # Fetch avatar settings from the API
    avatar_settings = await fetch_avatar_settings()
    voice = avatar_settings["voice"]
    instructions = avatar_settings["prompt"]

    logger.info(f"Using voice: {voice}")

    # Create agent session with Google Gemini
    session = AgentSession(
        llm=google.beta.realtime.RealtimeModel(
            api_key=gemini_key,
            voice=voice,
            instructions=instructions,
        ),
    )

    # Configure Simli avatar
    simli_avatar = simli.AvatarSession(
        simli_config=simli.SimliConfig(
            api_key=simli_api_key,
            face_id=simli_face_id,
            max_session_length=3600,  # 1 hour max
            max_idle_time=300,  # 5 minutes idle timeout
        ),
    )

    # Start the avatar - it will join the room as a separate participant
    try:
        await simli_avatar.start(session, room=ctx.room)
        logger.info("Simli avatar started successfully")
    except Exception as e:
        logger.error(f"Failed to start Simli avatar: {e}")
        return

    # Start the agent session
    try:
        await session.start(
            agent=Agent(instructions=instructions),
            room=ctx.room,
        )
        logger.info("Ong avatar agent is now active and ready to chat!")
    except Exception as e:
        logger.error(f"Failed to start agent session: {e}")
        return

    # Generate initial greeting using the persona from admin settings
    try:
        await session.generate_reply(
            instructions="Greet the user warmly and briefly introduce yourself based on your persona. Ask how you can help them today. Keep it natural and conversational."
        )
        logger.info(f"Agent session active for room: {ctx.room.name}")
    except Exception as e:
        logger.warning(f"Failed to generate initial greeting: {e}")
        # Continue anyway - greeting failure shouldn't crash the session

    # Wait for the session to close (user disconnects or room ends)
    close_event = asyncio.Event()

    @session.on("close")
    def on_session_close():
        logger.info(f"Session close event received for room: {ctx.room.name}")
        close_event.set()

    # Also handle errors during the session
    @session.on("error")
    def on_session_error(error):
        logger.error(f"Session error for room {ctx.room.name}: {error}")
        close_event.set()

    try:
        await close_event.wait()
    except asyncio.CancelledError:
        logger.info(f"Session cancelled for room: {ctx.room.name}")
    except Exception as e:
        logger.error(f"Error while waiting for session close: {e}")

    # Proper cleanup to prevent event loop crashes
    logger.info(f"Cleaning up session for room: {ctx.room.name}")
    try:
        # Close the Simli avatar first
        if simli_avatar:
            try:
                await simli_avatar.aclose()
            except Exception as e:
                logger.warning(f"Error closing Simli avatar: {e}")

        # Close the agent session
        if session:
            try:
                await session.aclose()
            except Exception as e:
                logger.warning(f"Error closing agent session: {e}")
    except asyncio.CancelledError:
        pass  # Ignore cancellation during cleanup
    except Exception as e:
        logger.warning(f"Cleanup error (non-fatal): {e}")

    logger.info(f"Agent session ended for room: {ctx.room.name}")


if __name__ == "__main__":
    # Validate required environment variables before starting
    required_vars = ["LIVEKIT_URL", "LIVEKIT_API_KEY", "LIVEKIT_API_SECRET"]
    missing = [v for v in required_vars if not os.getenv(v)]
    if missing:
        logger.error(f"Missing required environment variables: {', '.join(missing)}")
        logger.error("Avatar agent cannot start without LiveKit configuration")
        sys.exit(1)

    # Check for at least one Gemini key
    has_gemini = any(os.getenv(f"GEMINI_API_KEY_{i}") for i in range(1, 6)) or os.getenv("GOOGLE_AI_API_KEY")
    if not has_gemini:
        logger.error("Missing Gemini API key (GEMINI_API_KEY_1 through _5, or GOOGLE_AI_API_KEY)")
        sys.exit(1)

    # Check Simli config
    if not os.getenv("SIMLI_API_KEY") or not os.getenv("SIMLI_FACE_ID"):
        logger.error("Missing SIMLI_API_KEY or SIMLI_FACE_ID")
        sys.exit(1)

    logger.info("Environment validated, starting avatar agent...")

    # Run the agent with exception handling
    # Use port=0 to auto-assign available port, avoiding "address already in use" errors on restart
    # Use num_idle_processes=1 to reduce resource usage and "unresponsive" warnings
    try:
        cli.run_app(
            WorkerOptions(
                entrypoint_fnc=entrypoint,
                worker_type=WorkerType.ROOM,
                port=0,
                num_idle_processes=1,  # Default is 3 in prod, reduce to minimize resource usage
                shutdown_process_timeout=30.0,  # Kill unresponsive processes after 30s (default 60s)
            ),
        )
    except KeyboardInterrupt:
        logger.info("Avatar agent stopped by user")
    except AssertionError as e:
        # LiveKit worker sometimes throws AssertionError during shutdown
        logger.warning(f"Worker shutdown assertion (usually harmless): {e}")
    except Exception as e:
        logger.error(f"Avatar agent error: {e}")
        sys.exit(1)
