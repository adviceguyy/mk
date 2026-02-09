# Mien Kingdom - Hybrid Social Community App

## Overview
Mien Kingdom is a niche social network designed as a "community overlay" for major social platforms (YouTube, TikTok, Instagram, Facebook, Twitter/X). It enables users to form a community by authenticating existing social accounts and syndicating external posts into a unified, curated feed, rather than uploading media directly. The project aims to provide a unique cultural hub, integrating advanced AI features for Mien translation, culinary assistance, and creative arts, catering specifically to the Mien community while offering broader appeal through its innovative content aggregation and AI capabilities.

## User Preferences
- I prefer simple language and clear, concise explanations.
- I want to follow an iterative development process, with frequent updates and feedback loops.
- Please ask for my approval before implementing any major changes or new features.
- I prefer detailed explanations for complex technical decisions.
- Do not make changes to the `lib/mockData.ts` file.
- Do not make changes to the `constants/` folder.

## System Architecture
Mien Kingdom utilizes a React Native with Expo frontend and an Express.js with TypeScript backend, backed by a PostgreSQL database with Drizzle ORM. The core design revolves around a dual-feed system (trending and following) and multi-provider authentication. AI functionalities, powered by Google Gemini, are central to the user experience, offering Mien language translation, AI-generated recipes with cultural context, and advanced creative tools for image and video manipulation, including "Dress Me" for Mien attire transformation, vintage photo restoration, and AI-generated cinematic videos.

A credit-based subscription model gates access to advanced AI features, managed by atomic credit deductions and integrated with a "Three Tears" billing webhook system. Image uploads are optimized (resized to 1200x1200, converted to WebP) and stored on Cloudflare R2, while videos are streamed via Bunny.net. The application features a comprehensive admin system with role-based access control and integrates with the "Three Tears" central management system for discovery, admin commands, and support, ensuring robust backend operations and scalability. UI/UX emphasizes a clean design with a red and silver color scheme, consistent typography, and rounded elements.

## AI Avatar Feature ("Talk to Ong")
The "Talk to Ong" feature allows users to have real-time conversations with an AI avatar named Ong. This feature integrates:
- **Simli**: Provides the AI avatar video rendering
- **LiveKit**: Real-time WebRTC communication backbone
- **Google Gemini**: Powers the conversational AI brain

### Architecture
The avatar system consists of two main components:
1. **Node.js Backend** (`server/routes.ts`): Handles session management, LiveKit room creation, and credit deduction
2. **Python Agent** (`avatar-agent/agent.py`): Runs the actual AI avatar using LiveKit's agents framework with Simli integration

### Running the Avatar Agent
The Python avatar agent now **auto-starts** when the Node.js server boots up. The server spawns the agent as a child process, so no manual startup is required.

If you need to run the agent manually (for debugging), use:
```bash
cd avatar-agent
python3 agent.py dev
```
The agent will automatically connect to LiveKit rooms when users start avatar sessions.

### Credit Consumption
- **Cost**: 16 credits per minute of conversation
- Credits are deducted at the start of each minute
- Rate limiting prevents abuse (minimum 55 seconds between deductions)

### Gemini API Key Rotation
For load balancing, the system rotates across 5 Gemini API keys:
- `GEMINI_API_KEY_1` through `GEMINI_API_KEY_5`
- Keys are assigned per user session with session affinity
- Round-robin selection based on usage count
- The assigned key index is passed to the Python agent via LiveKit room metadata

### Required Environment Variables
- `LIVEKIT_URL`: LiveKit WebSocket URL
- `LIVEKIT_API_KEY`: LiveKit API key
- `LIVEKIT_API_SECRET`: LiveKit API secret
- `SIMLI_API_KEY`: Simli API key
- `SIMLI_FACE_ID`: Simli face ID for Ong avatar
- `GEMINI_API_KEY_1` through `GEMINI_API_KEY_5`: 5 Google Gemini API keys

## External Dependencies
- **Authentication**: Google (OAuth), Twitter/X, Instagram, TikTok, Facebook
- **AI Services**: Google Gemini AI (via Replit AI Integrations)
- **AI Avatar**: Simli (avatar rendering), LiveKit (WebRTC), Google Gemini (conversational AI)
- **Cloud Storage**: Cloudflare R2 (S3-compatible)
- **Video Streaming**: Bunny.net
- **Billing/Subscription Management**: Three Tears (custom integration for webhooks and checkout)
- **Image Processing**: Sharp library
- **Database**: PostgreSQL
- **ORM**: Drizzle ORM
- **Frameworks**: React Native, Expo, Express.js