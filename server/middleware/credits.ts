import { Request, Response, NextFunction } from "express";
import { db } from "../db";
import { users, activityLogs, creditTransactions } from "../db/schema";
import { eq, sql } from "drizzle-orm";
import type { AuthenticatedRequest } from "./auth";

export interface CreditRequest extends AuthenticatedRequest {
  creditCost?: number;
  creditFeature?: string;
}

export function requireCredits(cost: number = 1, feature: string = "unknown") {
  return async (req: CreditRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ error: "unauthorized" });
      }

      // Get current credit balance and subscription status
      const [user] = await db
        .select({
          credits: users.credits,
          tierSlug: users.tierSlug,
          subscriptionActive: users.subscriptionActive
        })
        .from(users)
        .where(eq(users.id, userId));

      if (!user) {
        return res.status(401).json({ error: "user_not_found" });
      }

      // Check if user has enough credits
      if (user.credits < cost) {
        await db.insert(activityLogs).values({
          userId,
          action: "insufficient_credits",
          metadata: {
            required: cost,
            credits: user.credits,
            tierSlug: user.tierSlug,
            subscriptionActive: user.subscriptionActive,
            feature
          },
        });

        return res.status(402).json({
          error: "insufficient_credits",
          message: "You don't have enough credits for this action",
          required: cost,
          available: user.credits,
          redirect_url: "/subscription",
        });
      }

      // Atomic credit deduction: UPDATE ... SET credits = credits - cost WHERE credits >= cost
      const [updated] = await db
        .update(users)
        .set({
          credits: sql`${users.credits} - ${cost}`
        })
        .where(sql`${users.id} = ${userId} AND ${users.credits} >= ${cost}`)
        .returning({ credits: users.credits });

      if (!updated) {
        // Race condition: credits were spent between check and deduction
        return res.status(402).json({
          error: "insufficient_credits",
          message: "You don't have enough credits for this action",
          required: cost,
          available: 0,
          redirect_url: "/subscription",
        });
      }

      const newCredits = updated.credits;

      await db.insert(creditTransactions).values({
        userId,
        type: "deduction",
        amount: -cost,
        balanceAfter: newCredits,
        feature,
        description: `Used ${cost} credit${cost > 1 ? "s" : ""} for ${feature}`,
      });

      await db.insert(activityLogs).values({
        userId,
        action: "credits_deducted",
        metadata: {
          cost,
          creditsRemaining: newCredits,
          feature
        },
      });

      req.creditCost = cost;
      req.creditFeature = feature;
      next();
    } catch (error) {
      console.error("[Credits] Error checking credits:", error);
      return res.status(500).json({ error: "internal_error" });
    }
  };
}
