import { getRankColor, getRankName, getRankTier } from "../lib/rankingUtils";

interface RankBadgeProps {
  rankIndex: number;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
}

export default function RankBadge({
  rankIndex,
  size = "md",
  showLabel = true,
}: RankBadgeProps) {
  const color = getRankColor(rankIndex);
  const name = getRankName(rankIndex);
  const tier = getRankTier(rankIndex);

  const sizeClasses = {
    sm: "px-2 py-0.5 text-xs",
    md: "px-3 py-1 text-sm",
    lg: "px-4 py-1.5 text-base",
  }[size];

  const tierEmoji: Record<string, string> = {
    Bronze: "🥉",
    Silver: "🥈",
    Gold: "🥇",
    Platinum: "💎",
    Diamond: "🔷",
    Master: "👑",
    Grandmaster: "🔥",
    Legendary: "⚡",
    Unranked: "—",
  };

  if (rankIndex < 0) {
    return (
      <span
        className={`inline-flex items-center gap-1 rounded-full font-semibold ${sizeClasses}`}
        style={{
          background: "#33333366",
          color: "#888",
          border: "1px solid #444",
        }}
      >
        Unranked
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-semibold ${sizeClasses}`}
      style={{
        background: `${color}22`,
        color,
        border: `1px solid ${color}66`,
        textShadow: `0 0 8px ${color}88`,
      }}
    >
      <span>{tierEmoji[tier] ?? ""}</span>
      {showLabel && <span>{name}</span>}
    </span>
  );
}
