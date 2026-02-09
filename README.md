# Mien Kingdom

**Preserving heritage, empowering community.**

Mien Kingdom is a mobile-first social community app built for the Iu Mien (Yao) diaspora. It aggregates content from major social platforms, provides AI-powered cultural tools, and serves as a digital home for Mien language preservation, education, and community connection.

Built by **Three Tears LLC** — a team of Mien people, for the Mien people.

> Available on iOS, Android, and Web.

---

## About Us

### The Mien People

The Iu Mien (also known as Yao) are an ethnic group with a rich history spanning thousands of years across the mountainous regions of China, Laos, Thailand, Vietnam, and beyond. Known for their intricate cross-stitch embroidery, vibrant ceremonial traditions, and a deeply rooted spiritual heritage, the Mien people carry a legacy of resilience and cultural richness. After the aftermath of the Vietnam War, many Mien families were displaced and resettled across the United States, France, Canada, and other nations, carrying their traditions with them into a new world.

### A Language and Culture at Risk

Today, the Mien language is considered endangered. As younger generations assimilate into the dominant cultures of their adopted countries, fewer and fewer children grow up speaking Mien at home. The oral traditions, folk stories, ceremonial chants, and everyday expressions that once defined Mien identity are fading with each passing generation.

### Our Mission

Mien Kingdom was created with a singular purpose: to preserve, celebrate, and enrich Mien culture for current and future generations. This app serves as a digital home where our people can connect, share stories and traditions, learn and practice the Mien language, explore our culinary heritage, and express themselves freely.

### AI as an Enabling Technology

What makes Mien Kingdom unique is our commitment to harnessing the power of artificial intelligence as a force for cultural preservation. For underrepresented and minority communities, AI is more than just a convenience — it is an enabling technology that levels the playing field. Through AI-powered translation, language learning tools, recipe analysis, photo restoration, and interactive avatars, we are building bridges between generations and making it easier than ever for Mien people to engage with their heritage.

---

## Features

### Community & Social

- **Home Feed** — Unified feed aggregating posts from YouTube, TikTok, Instagram, Facebook, and Twitter/X
- **Community Feed** — Discover trending posts and new users
- **Follow System** — Follow users with configurable notification preferences
- **Direct Messaging** — End-to-end encrypted private conversations (X25519 key exchange)
- **User Profiles** — View posts, connected accounts, follower lists
- **Mute & Block** — Mute users from trending; block users bidirectionally
- **Push Notifications** — Configurable alerts for follows, posts, and messages

### AI Translation & Language

- **Mien Translator** — Bidirectional translation between Mien and 11 languages (English, Vietnamese, Mandarin, Hmong, Cantonese, Thai, Lao, Burmese, French, Pinghua, Khmer)
- **Text, Document & Video Translation** — Translate plain text, uploaded PDFs, and transcribed audio
- **Translation History** — Track and revisit past translations
- **Mien Dictionary** — Searchable dictionary of Mien words with English definitions
- **Grammar Book** — Interactive Mien grammar reference

### AI Creative Tools (Make Me Mien)

- **Dress Me** — Transform photos into Mien traditional attire using AI image generation
- **Movie Star** — Generate movie poster-style images from your photos
- **TikTok Dance** — Create AI-generated dance videos
- **Photo Restoration** — Restore old or damaged family photos with AI
- **Art Gallery** — Browse all your AI-generated creations

### AI Companion

- **Talk to Ong** — Real-time AI avatar companion powered by LiveKit (WebRTC), Simli (avatar rendering), and Google Gemini (conversational AI). Credit-based usage at 20 credits/minute.

### Education & Games

- **Literature Hub** — Mien story catalog and interactive reader
- **Story Reader** — Read and complete Mien stories with progress tracking
- **Mien Wordle** — Word guessing game with Mien vocabulary
- **Vocab Match** — Vocabulary matching game
- **Wheel of Fortune** — Mien word guessing wheel game with leaderboards
- **Insights of the Day** — Daily cultural insights and proverbs
- **XP & Leveling System** — Earn experience points across features with level progression

### Food & Recipes

- **Recipe Generator** — AI-powered recipe generation with Mien cultural context
- **Saved Recipes** — Organize recipes into custom categories
- **Recipe Sharing** — Share recipes with the community

### Account & Settings

- **Multi-Provider OAuth** — Sign in with Google, Twitter, Instagram, TikTok, or Facebook
- **Privacy Controls** — Post visibility settings (public, followers, private)
- **Subscription Tiers** — Free, Weekly, Monthly, and Yearly plans with credit-based access
- **Support Tickets** — In-app help and support system

### Admin Panel

- **Dashboard** — App-wide metrics and analytics
- **User Management** — Role-based access control (user, moderator, admin)
- **Group Management** — Create and manage community groups
- **Reports & Moderation** — Review abuse reports
- **Usage Analytics** — Feature usage tracking, avatar session stats, AI usage reports
- **AI Prompt Configuration** — Customize system prompts for all AI features
- **Integration Settings** — Configure Three Tears central management, billing providers

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        MIEN KINGDOM                                 │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌──────────────────────────┐     ┌──────────────────────────────┐  │
│  │     CLIENT (Mobile)      │     │       SERVER (API)           │  │
│  │    React Native / Expo   │────▶│     Express + TypeScript     │  │
│  │   iOS / Android / Web    │◀────│       Port 5000              │  │
│  └──────────────────────────┘     └──────────────────────────────┘  │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### High-Level System Diagram

```
                              ┌─────────────┐
                              │   Client    │
                              │  (Expo RN)  │
                              └──────┬──────┘
                                     │  HTTP / WebSocket
                                     ▼
                              ┌─────────────┐
                              │   Server    │
                              │  (Express)  │
                              └──────┬──────┘
                                     │
            ┌────────────────────────┼────────────────────────┐
            │                        │                        │
            ▼                        ▼                        ▼
     ┌─────────────┐         ┌─────────────┐         ┌──────────────┐
     │ PostgreSQL  │         │ External    │         │   Storage    │
     │ (Drizzle)   │         │ AI / Media  │         │              │
     │             │         │ Services    │         │ Cloudflare R2│
     │ 60+ tables  │         │             │         │ Bunny.net    │
     └─────────────┘         │ Google Gemini│        └──────────────┘
                              │ LiveKit     │
                              │ Simli       │
                              │ Stripe      │
                              │ RevenueCat  │
                              └─────────────┘
```

### Directory Structure

```
workspace/
├── client/                     # React Native frontend (Expo)
│   ├── App.tsx                 # Root app component
│   ├── components/             # Reusable UI components
│   │   ├── PostCard.tsx        #   Post display card
│   │   ├── CreditIndicator.tsx #   Credit balance display
│   │   ├── VideoPlayer.tsx     #   Video playback
│   │   ├── XpProgressBar.tsx   #   XP/level progress
│   │   └── game/              #   Game-specific components
│   ├── screens/                # Screen components (one per route)
│   │   ├── HomeScreen.tsx      #   Main home feed
│   │   ├── CommunityScreen.tsx #   Community trending/following feed
│   │   ├── ExploreScreen.tsx   #   Search and discover
│   │   ├── ProfileScreen.tsx   #   User profile and settings menu
│   │   ├── TranslateScreen.tsx #   Mien translator
│   │   ├── RecipeScreen.tsx    #   AI recipe generator
│   │   ├── DressMeScreen.tsx   #   AI traditional attire transform
│   │   ├── TalkToOngScreen.tsx #   AI avatar companion
│   │   ├── LiteratureScreen.tsx#   Literature hub
│   │   ├── DictionaryScreen.tsx#   Mien dictionary
│   │   ├── MienWordleScreen.tsx#   Wordle game
│   │   ├── WheelOfFortuneScreen.tsx # Word wheel game
│   │   ├── admin/              #   Admin-only screens
│   │   └── messaging/          #   Direct messaging screens
│   ├── navigation/             # React Navigation structure
│   │   ├── RootStackNavigator.tsx    # Auth gate (Welcome vs Main)
│   │   ├── MainTabNavigator.tsx      # 4 visible + 2 hidden tabs
│   │   ├── HomeStackNavigator.tsx    # Home tab nested routes
│   │   ├── CommunityStackNavigator.tsx
│   │   ├── ProfileStackNavigator.tsx
│   │   ├── AdminStackNavigator.tsx   # Hidden admin tab
│   │   └── MessagingStackNavigator.tsx # Hidden messages tab
│   ├── lib/                    # Contexts, types, utilities
│   │   ├── AuthContext.tsx      #   Auth state management
│   │   ├── CreditContext.tsx    #   Credit balance management
│   │   ├── XpContext.tsx        #   XP/leveling system
│   │   ├── types.ts             #   TypeScript type definitions
│   │   └── query-client.ts      #   React Query configuration
│   ├── hooks/                  # Custom React hooks
│   ├── constants/              # Theme, colors, spacing
│   ├── data/                   # Static data (translations, vocab)
│   └── assets/                 # Images, icons, fonts
│
├── server/                     # Node.js backend
│   ├── index.ts                # Entry point, Express setup, middleware
│   ├── routes.ts               # 163+ API endpoint definitions
│   ├── db/
│   │   ├── index.ts            #   Database connection (PostgreSQL)
│   │   └── schema.ts           #   Drizzle ORM schema (60+ tables)
│   ├── middleware/
│   │   ├── auth.ts             #   JWT auth + role-based access
│   │   └── credits.ts          #   Credit deduction middleware
│   ├── services/
│   │   ├── ai-providers.ts     #   AI service configuration
│   │   ├── avatar-agent.ts     #   Avatar process management
│   │   ├── avatar-service.ts   #   Avatar session logic
│   │   ├── billing-providers.ts#   Stripe / RevenueCat integration
│   │   ├── gemini-keys.ts      #   API key rotation for Gemini
│   │   ├── messaging.ts        #   E2E encrypted messaging
│   │   ├── push-notifications.ts#  Push notification delivery
│   │   ├── r2.ts               #   Cloudflare R2 storage client
│   │   ├── tickets.ts          #   Support ticket system
│   │   ├── video.ts            #   Video upload/encoding (Bunny.net)
│   │   └── xp.ts              #   XP/leveling calculations
│   ├── websocket/
│   │   └── index.ts            #   WebSocket server setup
│   ├── prompts/
│   │   └── index.ts            #   AI system prompt templates
│   └── integration/
│       ├── three-tears.ts      #   Central management system
│       └── sync.ts             #   User sync with external systems
│
├── shared/                     # Code shared between client & server
│   ├── schema.ts               #   Zod validation schemas
│   ├── tier-config.ts          #   Subscription tier definitions
│   └── xp-config.ts            #   XP/leveling configuration
│
├── migrations/                 # Drizzle database migrations
├── scripts/                    # Build scripts
├── public/                     # Static web assets
└── package.json                # Dependencies and scripts
```

### Navigation Map

```
RootStackNavigator
│
├── WelcomeScreen (unauthenticated)
│
└── MainTabNavigator (authenticated)
    │
    ├── [Tab 1] Home ─── HomeStackNavigator
    │   ├── HomeScreen (feed + feature shortcuts)
    │   ├── TranslateScreen
    │   ├── LiteratureScreen → StoryCatalogScreen → StoryReaderScreen
    │   ├── GrammarBookScreen
    │   ├── DictionaryScreen
    │   ├── DressMeScreen (Make Me Mien)
    │   ├── MovieStarScreen
    │   ├── PhotoRestorationScreen
    │   ├── TikTokDanceScreen
    │   ├── RecipeScreen → RecipeDetailScreen
    │   ├── SavedRecipesScreen → CategoryRecipesScreen
    │   ├── TalkToOngScreen
    │   ├── EntertainmentScreen
    │   ├── WheelOfFortuneScreen → LeaderboardScreen
    │   ├── VocabMatchScreen → LeaderboardScreen
    │   ├── MienWordleScreen → LeaderboardScreen
    │   ├── CollectionsScreen
    │   └── HelpScreen
    │
    ├── [Tab 2] Community ─── CommunityStackNavigator
    │   ├── CommunityScreen (trending / following)
    │   ├── FollowingScreen
    │   ├── UserPostsScreen
    │   └── ExploreScreen
    │
    ├── [Tab 3] Profile ─── ProfileStackNavigator
    │   ├── ProfileScreen (menu)
    │   ├── EditProfileScreen
    │   ├── PrivacySettingsScreen
    │   ├── NotificationSettingsScreen
    │   ├── BlockedUsersScreen / MutedUsersScreen
    │   ├── SubscriptionScreen
    │   ├── SupportScreen → TicketListScreen → TicketDetailScreen
    │   └── AboutScreen
    │
    ├── [Hidden] Messages ─── MessagingStackNavigator
    │   ├── ConversationListScreen
    │   └── ChatScreen
    │
    └── [Hidden] Admin ─── AdminStackNavigator (admin/moderator only)
        ├── AdminDashboardScreen
        ├── AdminUsersScreen
        ├── AdminGroupsScreen
        ├── AdminReportsScreen
        ├── AdminUsageReportsScreen
        ├── BillingSettingsScreen
        ├── IntegrationSettingsScreen
        ├── PromptsSettingsScreen
        └── AdminUtilitiesScreen
```

### API Route Groups

| Group | Prefix | Endpoints | Description |
|-------|--------|-----------|-------------|
| Auth | `/api/auth` | 4 | OAuth login/logout, session management |
| Users | `/api/users` | 15+ | Profiles, follow, mute, block, search |
| Posts | `/api/posts` | 5+ | Feed, trending, create posts |
| Translate | `/api/translate` | 4 | Text/document/audio translation |
| AI Creative | `/api/dress-me`, `/api/movie-star`, etc. | 6 | AI image/video generation |
| Avatar | `/api/avatar` | 4 | Ong companion sessions, credit deduction |
| Recipes | `/api/saved-recipes`, `/api/recipe-categories` | 8+ | CRUD for recipes and categories |
| Messaging | `/api/messages` | 8+ | E2E encrypted conversations |
| Notifications | `/api/notifications`, `/api/push-tokens` | 9 | Push tokens, preferences, history |
| Games | `/api/game` | 6+ | Phrases, scores, leaderboards |
| Literature | `/api/literature` | 4 | Grammar book pages and viewer |
| Dictionary | `/api/dictionary` | 2 | Word search and count |
| Media | `/api/upload`, `/api/images`, `/api/videos` | 8+ | Image/video upload and retrieval |
| Admin | `/api/admin` | 30+ | Users, groups, metrics, config, usage |
| Webhooks | `/webhooks` | 1+ | Bunny.net video encoding callbacks |

### Tech Stack Summary

| Layer | Technology |
|-------|-----------|
| Mobile Framework | React Native 0.81 + Expo 54 |
| Navigation | React Navigation (native-stack, bottom-tabs) |
| State Management | TanStack React Query v5 + React Context |
| Backend | Express 4 + TypeScript |
| Database | PostgreSQL + Drizzle ORM |
| Auth | JWT + Multi-provider OAuth (Google, Twitter, Instagram, TikTok, Facebook) |
| AI | Google Gemini API (with key rotation) |
| Avatar | LiveKit (WebRTC) + Simli (rendering) + Gemini (conversation) |
| Image Storage | Cloudflare R2 (S3-compatible) |
| Video Streaming | Bunny.net (upload, encoding, CDN) |
| Image Processing | Sharp |
| Billing | Stripe (web) + RevenueCat (mobile IAP) |
| Encryption | X25519 key exchange for E2E messaging |
| Validation | Zod |
| Push Notifications | Expo Notifications |

### Database Schema Overview

The database contains **60+ tables** organized into these domains:

- **Users & Auth** — `users`, `sessions`, `settings`
- **Social** — `posts`, `likes`, `comments`, `follows`, `user_mutes`, `user_blocks`, `groups`, `group_members`
- **Messaging** — `direct_conversations`, `encrypted_messages`, `user_public_keys`, `conversation_keys`
- **Media** — `uploaded_videos`, `art_generations`
- **Education** — `dictionary_entries`, `game_scores`, `story_completions`
- **AI & Translation** — `translation_history`, `ai_service_configs`, `ai_prompts`, `avatar_settings`, `avatar_sessions`
- **Recipes** — `saved_recipes`, `recipe_categories`
- **Billing** — `credit_transactions`, `billing_providers`
- **Notifications** — `push_tokens`, `user_notification_settings`, `notification_preferences`, `notifications`
- **Analytics** — `feature_usage`, `feature_usage_daily`, `activity_logs`

### Key Enums

| Enum | Values |
|------|--------|
| `role` | user, moderator, admin |
| `post_visibility` | public, followers, private |
| `platform` | youtube, tiktok, instagram, facebook, twitter |
| `translation_direction` | to_mien, to_english, to_vietnamese, to_mandarin, to_hmong, to_cantonese, to_thai, to_lao, to_burmese, to_french, to_pinghua, to_khmer |
| `feature_category` | ai_generation, ai_translation, ai_assistant, avatar, social, messaging, media, account |

---

## Development

### Prerequisites

- Node.js 18+
- PostgreSQL database
- Expo CLI

### Scripts

```bash
# Start both Expo and server in dev mode
npm run all:dev

# Start Expo dev server only
npm run expo:dev

# Start backend server only
npm run server:dev

# Push database schema changes
npm run db:push

# Build for production
npm run expo:static:build
npm run server:build

# Start production server
npm run server:prod

# Lint and format
npm run lint
npm run format
```

### Environment Variables

The server requires environment variables for:

- `DATABASE_URL` — PostgreSQL connection string
- `JWT_SECRET` — JWT signing key
- OAuth credentials for each provider (Google, Twitter, Instagram, TikTok, Facebook)
- `GEMINI_API_KEY` — Google Gemini API key(s)
- `LIVEKIT_*` — LiveKit server credentials
- `R2_*` / `S3_*` — Cloudflare R2 storage credentials
- `BUNNY_*` — Bunny.net video API credentials
- `STRIPE_*` — Stripe billing keys
- `SIMLI_API_KEY` — Simli avatar service key
