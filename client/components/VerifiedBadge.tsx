import React from "react";
import { Feather } from "@expo/vector-icons";
import { getCheckmarkForTier } from "../../shared/tier-config";

interface VerifiedBadgeProps {
  tierSlug?: string;
  size?: number;
}

export function VerifiedBadge({ tierSlug, size = 16 }: VerifiedBadgeProps) {
  const checkmark = getCheckmarkForTier(tierSlug);
  if (!checkmark) return null;

  return (
    <Feather name="check-circle" size={size} color={checkmark.color} />
  );
}
