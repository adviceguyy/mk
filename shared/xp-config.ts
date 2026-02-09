// XP Rewards mapping: activity type → XP amount
export const XP_REWARDS: Record<string, number> = {
  post_created: 10,
  comment_created: 1,
  ai_translation: 10,
  ai_image_dress_me: 20,
  ai_image_restore_photo: 20,
  ai_image_story_cover: 20,
  ai_video_movie_star: 20,
  ai_video_tiktok_dance: 20,
  story_completed: 20,
  game_wheel_of_fortune: 20,
  game_vocab_match: 20,
  game_mien_wordle: 20,
  game_leaderboard_top3: 40,
};

// Maximum number of XP-earning operations per activity type per day
export const DAILY_XP_CAP = 5;

// Level at which animated gradient border appears
export const ANIMATED_GRADIENT_LEVEL = 20;

/**
 * Returns cumulative XP required to reach a given level.
 * Level 1 = 0 XP, Level 2 = 20 XP, Level 3 = 40 XP, Level 4 = 80 XP, ...
 * Formula: level 1 = 0, level 2 = 20, level n (n>=3) = 20 * 2^(n-2)
 */
export function xpRequiredForLevel(level: number): number {
  if (level <= 1) return 0;
  if (level === 2) return 20;
  return 20 * Math.pow(2, level - 2);
}

/**
 * Calculate level from total XP.
 * Uses the inverse of xpRequiredForLevel.
 */
export function calculateLevelFromXp(totalXp: number): number {
  if (totalXp < 20) return 1;
  // level = floor(log2(totalXp / 20)) + 2
  const level = Math.floor(Math.log2(totalXp / 20)) + 2;
  return level;
}

/**
 * Calculate progress toward the next level.
 */
export function xpToNextLevel(totalXp: number): {
  currentLevel: number;
  xpForNext: number;
  xpIntoLevel: number;
  xpNeededForLevel: number;
  progressPercent: number;
} {
  const currentLevel = calculateLevelFromXp(totalXp);
  const currentLevelXp = xpRequiredForLevel(currentLevel);
  const nextLevelXp = xpRequiredForLevel(currentLevel + 1);
  const xpNeededForLevel = nextLevelXp - currentLevelXp;
  const xpIntoLevel = totalXp - currentLevelXp;
  const progressPercent = xpNeededForLevel > 0 ? Math.min((xpIntoLevel / xpNeededForLevel) * 100, 100) : 0;

  return {
    currentLevel,
    xpForNext: nextLevelXp - totalXp,
    xpIntoLevel,
    xpNeededForLevel,
    progressPercent,
  };
}

/**
 * Badge color tiers based on level (every 10 levels).
 */
export function getLevelBadgeColor(level: number): { bg: string; text: string; label: string; gradient: string[] } {
  if (level >= 100) return { bg: "#1a1a2e", text: "#ffd700", label: "Celestial", gradient: ["#ffd700", "#ff6b6b", "#4ecdc4", "#a855f7"] };
  if (level >= 90) return { bg: "#1a1a1a", text: "#e0e0e0", label: "Obsidian", gradient: ["#333333", "#666666", "#999999", "#333333"] };
  if (level >= 80) return { bg: "#e91e63", text: "#ffffff", label: "Rose", gradient: ["#e91e63", "#f06292", "#ec407a", "#e91e63"] };
  if (level >= 70) return { bg: "#ff8f00", text: "#ffffff", label: "Amber", gradient: ["#ff8f00", "#ffb300", "#ffa000", "#ff8f00"] };
  if (level >= 60) return { bg: "#2e7d32", text: "#ffffff", label: "Emerald", gradient: ["#2e7d32", "#43a047", "#66bb6a", "#2e7d32"] };
  if (level >= 50) return { bg: "#1565c0", text: "#ffffff", label: "Sapphire", gradient: ["#1565c0", "#1e88e5", "#42a5f5", "#1565c0"] };
  if (level >= 40) return { bg: "#7b1fa2", text: "#ffffff", label: "Amethyst", gradient: ["#7b1fa2", "#9c27b0", "#ab47bc", "#7b1fa2"] };
  if (level >= 30) return { bg: "#c62828", text: "#ffffff", label: "Ruby", gradient: ["#c62828", "#e53935", "#ef5350", "#c62828"] };
  if (level >= 20) return { bg: "#00695c", text: "#ffffff", label: "Jade", gradient: ["#00695c", "#00897b", "#26a69a", "#00695c"] };
  if (level >= 10) return { bg: "#f9a825", text: "#1a1a1a", label: "Gold", gradient: ["#f9a825", "#fdd835", "#ffee58", "#f9a825"] };
  return { bg: "#9e9e9e", text: "#ffffff", label: "Stone", gradient: ["#9e9e9e", "#bdbdbd", "#e0e0e0", "#9e9e9e"] };
}
