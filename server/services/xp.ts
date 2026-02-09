import { db, pool } from "../db";
import { users, xpTransactions, dailyXpCaps } from "../db/schema";
import { eq, and, sql } from "drizzle-orm";
import { XP_REWARDS, DAILY_XP_CAP, calculateLevelFromXp } from "../../shared/xp-config";
import type { XpActivityType } from "../db/schema";

interface AwardXpResult {
  awarded: boolean;
  reason?: string;
  xpAwarded?: number;
  totalXp?: number;
  level?: number;
  leveledUp?: boolean;
}

/**
 * Award XP to a user for a given activity.
 * Handles daily caps, level calculation, and transaction logging.
 * Designed to never throw - XP failure should never block the parent operation.
 */
export async function awardXp(
  userId: string,
  activityType: XpActivityType,
  metadata?: Record<string, unknown>
): Promise<AwardXpResult> {
  try {
    const xpAmount = XP_REWARDS[activityType];
    if (!xpAmount) {
      return { awarded: false, reason: "unknown_activity" };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // Upsert daily cap counter
      const capResult = await client.query(
        `INSERT INTO daily_xp_caps (id, user_id, activity_type, date, count, created_at, updated_at)
         VALUES (gen_random_uuid(), $1, $2, $3, 1, NOW(), NOW())
         ON CONFLICT (user_id, activity_type, date)
         DO UPDATE SET count = daily_xp_caps.count + 1, updated_at = NOW()
         RETURNING count`,
        [userId, activityType, today]
      );

      const currentCount = capResult.rows[0].count;

      if (currentCount > DAILY_XP_CAP) {
        // Over the cap - rollback the increment and return
        await client.query(
          `UPDATE daily_xp_caps SET count = count - 1, updated_at = NOW()
           WHERE user_id = $1 AND activity_type = $2 AND date = $3`,
          [userId, activityType, today]
        );
        await client.query("COMMIT");
        return { awarded: false, reason: "daily_cap_reached" };
      }

      // Update user's total XP
      const userResult = await client.query(
        `UPDATE users SET total_xp = total_xp + $1 WHERE id = $2 RETURNING total_xp, level`,
        [xpAmount, userId]
      );

      if (userResult.rows.length === 0) {
        await client.query("ROLLBACK");
        return { awarded: false, reason: "user_not_found" };
      }

      const newTotalXp = userResult.rows[0].total_xp;
      const oldLevel = userResult.rows[0].level;
      const newLevel = calculateLevelFromXp(newTotalXp);
      const leveledUp = newLevel > oldLevel;

      // Update level if it changed
      if (leveledUp) {
        await client.query(
          `UPDATE users SET level = $1 WHERE id = $2`,
          [newLevel, userId]
        );
      }

      // Insert XP transaction
      await client.query(
        `INSERT INTO xp_transactions (id, user_id, activity_type, xp_amount, total_xp_after, level_after, leveled_up, metadata, created_at)
         VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, NOW())`,
        [userId, activityType, xpAmount, newTotalXp, newLevel, leveledUp, metadata ? JSON.stringify(metadata) : null]
      );

      await client.query("COMMIT");

      return {
        awarded: true,
        xpAwarded: xpAmount,
        totalXp: newTotalXp,
        level: newLevel,
        leveledUp,
      };
    } catch (innerError) {
      await client.query("ROLLBACK").catch(() => {});
      throw innerError;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("[XP] Failed to award XP:", error);
    return { awarded: false, reason: "internal_error" };
  }
}
