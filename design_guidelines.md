# Mien Kingdom - Design Guidelines

## Architecture Decisions

### Authentication
**Auth Required**: Multi-provider SSO
- **Providers**: Gmail, Twitter/X, Instagram, TikTok, Facebook
- **Implementation**:
  - Welcome screen with 5 SSO buttons, vertically stacked
  - Each button displays provider logo + "Continue with [Provider]"
  - After first login, link additional accounts from Profile > Settings > Connected Accounts
  - Mock the OAuth flow in prototype using local state
  - Account screen includes:
    - Log out (confirmation alert required)
    - Delete account (nested: Settings > Account > Delete with double confirmation)
    - Manage connected accounts (view/unlink social accounts)

### Navigation Structure
**Root Navigation**: Tab Bar (4 tabs)
- **Home** (Feed icon): Main syndicated content feed
- **Explore** (Search icon): Discover users and trending content
- **Translate** (Language/Globe icon): Mien translation feature
- **Profile** (User icon): User profile and settings

### Screen Specifications

#### 1. Home Feed Screen
**Purpose**: Display unified feed of syndicated posts from connected platforms
**Layout**:
- **Header**: Transparent, logo-centered
  - Right button: Notifications bell icon
  - No search bar (search is in Explore tab)
- **Main Content**: Scrollable feed (FlatList)
  - Friend suggestions carousel at top (horizontal scroll, 3-4 visible cards)
  - Post cards below (infinite scroll)
  - Pull-to-refresh enabled
- **Safe Area**: 
  - Top: headerHeight + Spacing.xl
  - Bottom: tabBarHeight + Spacing.xl
- **Components**:
  - Friend suggestion cards (avatar, name, "Follow" button)
  - Post cards containing:
    - User header (avatar, username, platform badge/icon, timestamp)
    - External media embed (YouTube player, Instagram embed, TikTok embed)
    - Interaction bar (like count, comment count, share button)
    - "View on [Platform]" link
  - Floating "Add Connection" button (bottom-right, above tab bar)

#### 2. Explore Screen
**Purpose**: Discover new users and trending content
**Layout**:
- **Header**: Default navigation header with search bar
  - Search bar placeholder: "Search users, posts..."
- **Main Content**: Scrollable view
  - Trending topics/hashtags section
  - Suggested users grid
  - Popular posts feed
- **Safe Area**:
  - Top: Spacing.xl
  - Bottom: tabBarHeight + Spacing.xl

#### 3. Mien Translation Screen
**Purpose**: Translate content between Mien and English (bidirectional)
**Layout**:
- **Header**: Transparent, title "Mien Translation"
  - Right button: Settings icon (for AI system prompts configuration)
- **Main Content**: Scrollable form
  - Three input modes (segmented control): Text, Document, Video Link
  - **Text Mode**: 
    - Large text input area (multiline, 5+ lines visible)
    - Placeholder: "Enter text to translate..."
    - Character counter
  - **Document Mode**:
    - File picker button "Select PDF or Word Document"
    - Selected file preview card (filename, size, remove button)
    - Text paste area for document content
  - **Video Mode**:
    - Text input for YouTube URL
    - URL validation indicator
  - **Two translation buttons** (side by side):
    - "Translate to Mien" (primary red) - Uses IuMiNR romanization
    - "Translate to English" (secondary silver)
  - Translation result card (appears after processing):
    - Original text preview
    - Translated text (labeled "Mien (IuMiNR):" or "English:" based on direction)
    - Copy button
- **Safe Area**:
  - Top: headerHeight + Spacing.xl
  - Bottom: tabBarHeight + Spacing.xl

#### 4. Profile Screen
**Purpose**: User profile, settings, and account management
**Layout**:
- **Header**: Default navigation header
  - Right button: Settings gear icon
- **Main Content**: Scrollable view
  - Profile section (avatar, name, bio)
  - Connected accounts grid (shows linked platforms with badges)
  - User's syndicated posts grid
- **Safe Area**:
  - Top: Spacing.xl
  - Bottom: tabBarHeight + Spacing.xl

## Design System

### Color Palette
**Primary**: Deep Red (#DC2626) - represents strength and cultural vibrancy
**Primary Dark Mode**: Light Red (#F87171) - for dark mode visibility
**Secondary**: Silver (#C0C0C0) - for secondary actions and accents
**Background**: 
- Light mode: Soft gray (#F9FAFB)
- Dark mode: Deep charcoal (#111827)
**Surface**: 
- Light mode: White (#FFFFFF)
- Dark mode: Dark gray (#1F2937)
**Text**:
- Primary: #111827 (light) / #F9FAFB (dark)
- Secondary: #6B7280 (light) / #9CA3AF (dark)
**Platform Badge Colors**:
- YouTube: #FF0000
- TikTok: #000000
- Instagram: Gradient (#833AB4, #FD1D1D, #FCAF45)
- Facebook: #1877F2
- Twitter/X: #000000

### Typography
**Font Family**: System default (San Francisco for iOS, Roboto for Android)
**Sizes**:
- H1: 32pt, Bold (screen titles)
- H2: 24pt, Semibold (section headers)
- H3: 18pt, Semibold (card titles)
- Body: 16pt, Regular (post content, comments)
- Caption: 14pt, Regular (timestamps, metadata)
- Small: 12pt, Regular (labels, hints)

### Visual Design
**Icons**: Feather icons from @expo/vector-icons
**Platform Badges**: Use platform brand colors as small circular badges (12pt diameter) on user avatars in posts
**Interaction Feedback**: 
- Buttons: Scale to 0.96 on press, opacity 0.8
- Cards: Subtle press feedback, no shadow
**Border Radius**: 12pt for cards, 8pt for buttons, 20pt for floating action button
**Spacing Scale**: xs: 4, sm: 8, md: 12, lg: 16, xl: 24, 2xl: 32

### Critical Assets
1. **App Logo**: Stylized crown icon with red and silver color scheme
2. **Welcome Screen Illustration**: Abstract representation of connected social platforms
3. **Platform Icons**: YouTube, TikTok, Instagram, Facebook, Twitter/X logos

### Accessibility
- Minimum touch target: 44x44pt
- Color contrast ratio: 4.5:1 for text, 3:1 for UI components
- Screen reader labels for all interactive elements
- Support Dynamic Type (text scaling)
- Keyboard navigation support for translation input

## Translation Feature

### Bidirectional Translation
The app supports translation in both directions:
1. **To Mien**: Uses Iu Mien language structure with IuMiNR (Iu Mien New Romanization) script
2. **To English**: Translates Mien text to clear, natural English

### AI System Prompts
- **Mien Translation**: "Use the Iu Mien language structure and vocabulary from the IuMiNR (Iu Mien New Romanization) script to translate into Mien"
- **Video to Mien**: "Transcribe the video using the Iu Mien language structure and vocabulary from the IuMiNR (Iu Mien New Romanization) script to translate into Mien"
- **English Translation**: Standard Mien-to-English translation with cultural context

### AI Models
- **Translate to Mien**: Gemini 2.0 Flash
- **Translate to English**: Gemini 2.5 Flash
