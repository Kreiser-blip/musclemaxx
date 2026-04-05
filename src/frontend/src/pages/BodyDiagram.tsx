import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { AlertTriangle, ArrowLeft, Dumbbell, Loader2, X } from "lucide-react";
import type React from "react";
import { type ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import type { WorkoutLog } from "../backend.d";
import { MuscleGroup } from "../backend.d";
import RankBadge from "../components/RankBadge";
import { useUnitPreference } from "../context/UnitContext";
import {
  useAddWorkoutLog,
  useGetAllWorkoutLogs,
  useGetCallerUserProfile,
  useGetInjuryLogs,
} from "../hooks/useQueries";
import { EXERCISES, type Exercise } from "../lib/exercises";
import {
  ALL_MUSCLES,
  MUSCLE_LABELS,
  RANK_COLORS,
  RANK_TIERS,
  TEN_DAYS_NS,
  calculateVolumeScore,
  getNextRankThreshold,
  getProgressToNextRank,
  getRankColor,
  getRankIndex,
  getRankIndexForExercise,
  getRankName,
  getRankTier,
} from "../lib/rankingUtils";
import { kgToLbs, lbsToKg } from "../lib/units";

interface MuscleData {
  rankIdx: number;
  score: number;
  isInactive: boolean;
  rawRankIdx: number;
  lastTimestamp: bigint | undefined;
}

interface PopoutPos {
  x: number;
  y: number;
}

// const NEUTRAL = "#1c1c28"; // reserved

function MG({
  onClick,
  filter,
  children,
}: {
  onClick: (e: React.MouseEvent) => void;
  filter?: string;
  children: ReactNode;
}) {
  return (
    <g
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ")
          onClick(e as unknown as React.MouseEvent);
      }}
      style={{ cursor: "pointer" }}
      filter={filter}
    >
      {children}
    </g>
  );
}

export default function BodyDiagram() {
  const { data: logs } = useGetAllWorkoutLogs();
  const { data: profile } = useGetCallerUserProfile();
  const { data: injuryLogs } = useGetInjuryLogs();
  const hasActiveInjuries = (injuryLogs ?? []).some((i) => !i.isResolved);
  const { unitPreference } = useUnitPreference();
  const isImperial = unitPreference === "imperial";
  const [selectedMuscle, setSelectedMuscle] = useState<MuscleGroup | null>(
    null,
  );
  const [popoutPos, setPopoutPos] = useState<PopoutPos | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const addLogMutation = useAddWorkoutLog();

  // Logging panel state
  const [showLog, setShowLog] = useState(false);
  const [logExercise, setLogExercise] = useState<Exercise | null>(null);
  const [sets, setSets] = useState("3");
  const [reps, setReps] = useState("10");
  const [weight, setWeight] = useState("");
  const [isBodyWeight, setIsBodyWeight] = useState(false);

  // biome-ignore lint/correctness/useExhaustiveDependencies: reset form when selected muscle changes
  useEffect(() => {
    setShowLog(false);
    setLogExercise(null);
    setSets("3");
    setReps("10");
    setWeight("");
    setIsBodyWeight(false);
  }, [selectedMuscle]);

  const now = BigInt(Date.now()) * BigInt(1_000_000);

  const muscleStats = useMemo(() => {
    if (!logs)
      return {} as Record<
        string,
        {
          score: number;
          lastTimestamp: bigint;
          bestExerciseName: string;
          bestRankIdx: number;
        }
      >;
    const result: Record<
      string,
      {
        score: number;
        lastTimestamp: bigint;
        bestExerciseName: string;
        bestRankIdx: number;
      }
    > = {};
    for (const log of logs) {
      const key = log.muscleGroup as string;
      const effectiveWeight = log.isBodyWeight
        ? (profile?.weightKg ?? 70)
        : log.weightKg;
      const score = calculateVolumeScore(
        Number(log.sets),
        Number(log.reps),
        effectiveWeight,
      );
      const rankIdx = getRankIndexForExercise(log.exerciseName, score);
      const prev = result[key];
      // Track the most recent timestamp (for decay) separately from best rank
      const lastTimestamp =
        !prev || log.timestamp > prev.lastTimestamp
          ? log.timestamp
          : prev.lastTimestamp;
      // Best rank wins across all exercises for this muscle
      if (!prev || rankIdx > prev.bestRankIdx) {
        result[key] = {
          score,
          lastTimestamp,
          bestExerciseName: log.exerciseName,
          bestRankIdx: rankIdx,
        };
      } else {
        // Update only the timestamp if this log is more recent
        result[key] = { ...prev, lastTimestamp };
      }
    }
    return result;
  }, [logs, profile?.weightKg]);

  const muscleData = useMemo(() => {
    const result: Record<string, MuscleData & { bestExerciseName?: string }> =
      {};
    for (const m of ALL_MUSCLES) {
      const stats = muscleStats[m as string];
      const score = stats?.score ?? 0;
      const lastTimestamp = stats?.lastTimestamp;
      const isInactive =
        lastTimestamp !== undefined && now - lastTimestamp > TEN_DAYS_NS;
      // Use per-exercise rank index (best across all logs for this muscle)
      const rawRankIdx = stats?.bestRankIdx ?? getRankIndex(m, score);
      const rankIdx = isInactive ? Math.max(-1, rawRankIdx - 1) : rawRankIdx;
      result[m as string] = {
        rankIdx,
        score,
        isInactive,
        rawRankIdx,
        lastTimestamp,
        bestExerciseName: stats?.bestExerciseName,
      };
    }
    return result;
  }, [muscleStats, now]);

  const FRAME_STROKE = hasActiveInjuries ? "#8b1a1a" : "#6b0f0f";
  // const FRAME_FILL = "#06000e"; // reserved for future use
  const HEAD_FILL = hasActiveInjuries ? "#e8d5d5" : "#120008";
  const UNRANKED_COLOR = hasActiveInjuries ? "#c8c8d4" : "#2e2e3a";
  const PATTERN_BG = hasActiveInjuries ? "#f5eded" : "#000000";
  const PATTERN_LINE = hasActiveInjuries ? "#c8a8a8" : "#180028";
  const VIGNETTE_COLOR = hasActiveInjuries ? "#ffffff" : "#000";
  const MUSCLE_STROKE_UNSEL = hasActiveInjuries ? "#d0b0b0" : "#0a0a12";

  const mFill = (m: MuscleGroup) => {
    const rankIdx = muscleData[m as string]?.rankIdx ?? -1;
    return rankIdx < 0 ? UNRANKED_COLOR : getRankColor(rankIdx);
  };
  const isSel = (m: MuscleGroup) => selectedMuscle === m;
  const mStroke = (m: MuscleGroup) =>
    isSel(m) ? "#ffffff" : MUSCLE_STROKE_UNSEL;
  const mSW = (m: MuscleGroup) => (isSel(m) ? 2.5 : 1.5);
  const mFilt = (m: MuscleGroup) => (isSel(m) ? "url(#glow)" : undefined);

  const click = (m: MuscleGroup) => (e: React.MouseEvent) => {
    e.stopPropagation();
    if (selectedMuscle === m) {
      setSelectedMuscle(null);
      setPopoutPos(null);
      return;
    }
    setSelectedMuscle(m);
    const CARD_HEIGHT = 260;
    const CARD_WIDTH = 240;
    const margin = 10;
    const x = Math.min(
      Math.max(e.clientX - CARD_WIDTH / 2, margin),
      window.innerWidth - CARD_WIDTH - margin,
    );
    const yAbove = e.clientY - CARD_HEIGHT - 16;
    const y = yAbove > margin ? yAbove : e.clientY + 16;
    setPopoutPos({ x, y });
  };

  const closePopout = () => {
    setSelectedMuscle(null);
    setPopoutPos(null);
  };

  const selected = selectedMuscle ? muscleData[selectedMuscle as string] : null;
  const selectedColor = selected ? getRankColor(selected.rankIdx) : "#444";
  const selectedProgress =
    selectedMuscle && selected
      ? getProgressToNextRank(
          selectedMuscle,
          selected.score,
          selected.rankIdx,
          (selected as { bestExerciseName?: string }).bestExerciseName,
        )
      : 0;
  const nextThreshold =
    selectedMuscle && selected
      ? getNextRankThreshold(
          selectedMuscle,
          selected.rankIdx,
          (selected as { bestExerciseName?: string }).bestExerciseName,
        )
      : null;

  const tierLegend = [
    { label: "Unranked", color: UNRANKED_COLOR },
    ...RANK_TIERS.map((tier) => ({ label: tier, color: RANK_COLORS[tier] })),
  ];

  const B = 225;

  // Gothic frame accent color

  const svgDefs = (
    <defs>
      <filter id="glow" x="-40%" y="-40%" width="180%" height="180%">
        <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur" />
        <feMerge>
          <feMergeNode in="blur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
      <filter id="gothicDistort" x="-12%" y="-12%" width="124%" height="124%">
        <feTurbulence
          type="fractalNoise"
          baseFrequency="0.04 0.02"
          numOctaves="4"
          seed="13"
          result="noise"
        />
        <feDisplacementMap
          in="SourceGraphic"
          in2="noise"
          scale="7"
          xChannelSelector="R"
          yChannelSelector="B"
        />
      </filter>
      <filter id="frameGlow" x="-15%" y="-15%" width="130%" height="130%">
        <feGaussianBlur in="SourceGraphic" stdDeviation="2.5" result="blur" />
        <feMerge>
          <feMergeNode in="blur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
      <filter id="crackFilter" x="-5%" y="-5%" width="110%" height="110%">
        <feTurbulence
          type="fractalNoise"
          baseFrequency="0.08"
          numOctaves="2"
          seed="42"
          result="crack"
        />
        <feDisplacementMap
          in="SourceGraphic"
          in2="crack"
          scale="3"
          xChannelSelector="G"
          yChannelSelector="R"
        />
      </filter>
      <radialGradient id="vignetteGrad" cx="50%" cy="50%" r="70%">
        <stop offset="40%" stopColor={VIGNETTE_COLOR} stopOpacity="0" />
        <stop offset="100%" stopColor={VIGNETTE_COLOR} stopOpacity="0.85" />
      </radialGradient>
      <pattern
        id="gothicPattern"
        x="0"
        y="0"
        width="14"
        height="14"
        patternUnits="userSpaceOnUse"
      >
        <rect width="14" height="14" fill={PATTERN_BG} />
        <line
          x1="0"
          y1="0"
          x2="14"
          y2="14"
          stroke={PATTERN_LINE}
          strokeWidth="0.3"
          opacity="0.6"
        />
        <line
          x1="14"
          y1="0"
          x2="0"
          y2="14"
          stroke={PATTERN_LINE}
          strokeWidth="0.3"
          opacity="0.6"
        />
        <line
          x1="7"
          y1="0"
          x2="7"
          y2="14"
          stroke={PATTERN_LINE}
          strokeWidth="0.15"
          opacity="0.3"
        />
      </pattern>
    </defs>
  );

  // Gothic pointed-arch frame for a panel centered at cx, spanning y from yTop to yBot
  function GothicFrame({
    cx,
    halfW,
    yTop,
    yBot,
    variant = 0,
  }: {
    cx: number;
    halfW: number;
    yTop: number;
    yBot: number;
    variant?: number;
  }) {
    const lx = cx - halfW;
    const rx = cx + halfW;
    const h = yBot - yTop;

    const borderPath =
      variant === 0
        ? [
            `M ${lx - 3},${yTop + 18}`,
            `L ${lx + 5},${yTop + 2}`,
            `L ${cx - 22},${yTop - 8}`,
            `L ${cx},${yTop - 18}`,
            `L ${cx + 14},${yTop - 6}`,
            `L ${rx - 8},${yTop + 4}`,
            `L ${rx + 6},${yTop + 22}`,
            `L ${rx + 11},${yTop + h * 0.3}`,
            `L ${rx + 4},${yTop + h * 0.55}`,
            `L ${rx + 14},${yTop + h * 0.7}`,
            `L ${rx + 6},${yBot - 10}`,
            `L ${rx - 5},${yBot + 4}`,
            `L ${cx + 18},${yBot + 9}`,
            `L ${cx},${yBot + 14}`,
            `L ${cx - 30},${yBot + 6}`,
            `L ${lx + 8},${yBot + 3}`,
            `L ${lx - 5},${yBot - 14}`,
            `L ${lx - 12},${yTop + h * 0.68}`,
            `L ${lx - 4},${yTop + h * 0.45}`,
            `L ${lx - 14},${yTop + h * 0.25}`,
            "Z",
          ].join(" ")
        : [
            `M ${lx + 2},${yTop + 10}`,
            `L ${lx + 9},${yTop - 4}`,
            `L ${cx - 10},${yTop - 12}`,
            `L ${cx + 5},${yTop - 20}`,
            `L ${cx + 28},${yTop - 5}`,
            `L ${rx - 2},${yTop + 8}`,
            `L ${rx + 14},${yTop + 30}`,
            `L ${rx + 8},${yTop + h * 0.4}`,
            `L ${rx + 16},${yTop + h * 0.6}`,
            `L ${rx + 5},${yTop + h * 0.78}`,
            `L ${rx + 10},${yBot - 5}`,
            `L ${rx - 3},${yBot + 8}`,
            `L ${cx + 22},${yBot + 12}`,
            `L ${cx - 8},${yBot + 16}`,
            `L ${cx - 24},${yBot + 5}`,
            `L ${lx + 4},${yBot + 2}`,
            `L ${lx - 8},${yBot - 18}`,
            `L ${lx - 6},${yTop + h * 0.58}`,
            `L ${lx - 15},${yTop + h * 0.38}`,
            `L ${lx - 2},${yTop + h * 0.2}`,
            "Z",
          ].join(" ");

    const innerBorder =
      variant === 0
        ? [
            `M ${lx + 6},${yTop + 22}`,
            `L ${lx + 12},${yTop + 8}`,
            `L ${cx - 18},${yTop - 2}`,
            `L ${cx + 10},${yTop - 2}`,
            `L ${rx - 10},${yTop + 10}`,
            `L ${rx},${yTop + 28}`,
            `L ${rx + 2},${yTop + h * 0.55}`,
            `L ${rx - 2},${yBot - 16}`,
            `L ${cx + 12},${yBot + 2}`,
            `L ${cx - 20},${yBot + 1}`,
            `L ${lx + 10},${yBot - 10}`,
            `L ${lx + 4},${yTop + h * 0.5}`,
            "Z",
          ].join(" ")
        : [
            `M ${lx + 8},${yTop + 16}`,
            `L ${lx + 14},${yTop + 4}`,
            `L ${cx - 5},${yTop - 6}`,
            `L ${cx + 18},${yTop - 4}`,
            `L ${rx - 6},${yTop + 14}`,
            `L ${rx + 4},${yTop + 34}`,
            `L ${rx + 6},${yTop + h * 0.6}`,
            `L ${rx},${yBot - 12}`,
            `L ${cx + 14},${yBot + 4}`,
            `L ${cx - 14},${yBot + 3}`,
            `L ${lx + 6},${yBot - 8}`,
            `L ${lx + 2},${yTop + h * 0.45}`,
            "Z",
          ].join(" ");

    const sigil1x = variant === 0 ? lx - 18 : rx + 10;
    const sigil1y = yTop + h * 0.15;
    const invTriangle = `M ${sigil1x},${sigil1y - 10} L ${sigil1x + 16},${sigil1y - 10} L ${sigil1x + 8},${sigil1y + 2} Z`;
    const invTriangleLine = `M ${sigil1x + 2},${sigil1y - 10} L ${sigil1x + 14},${sigil1y - 10}`;

    const eye1x = variant === 0 ? rx + 8 : lx - 14;
    const eye1y = yTop + h * 0.42;
    const eyeR = 7;

    const runeLines =
      variant === 0
        ? [
            `M ${lx - 16},${yTop + h * 0.3} L ${lx - 6},${yTop + h * 0.3 + 8} L ${lx - 18},${yTop + h * 0.3 + 14}`,
            `M ${lx - 10},${yTop + h * 0.32} L ${lx - 4},${yTop + h * 0.32}`,
            `M ${rx + 7},${yTop + h * 0.65} L ${rx + 16},${yTop + h * 0.65 - 6} L ${rx + 9},${yTop + h * 0.65 + 8}`,
            `M ${cx - 8},${yBot + 10} L ${cx},${yBot + 6} L ${cx + 10},${yBot + 12}`,
            `M ${cx - 4},${yTop - 14} L ${cx + 2},${yTop - 8} L ${cx - 6},${yTop - 6}`,
          ]
        : [
            `M ${rx + 12},${yTop + h * 0.22} L ${rx + 4},${yTop + h * 0.22 + 10} L ${rx + 14},${yTop + h * 0.22 + 18}`,
            `M ${rx + 6},${yTop + h * 0.24} L ${rx + 12},${yTop + h * 0.24}`,
            `M ${lx - 14},${yTop + h * 0.55} L ${lx - 5},${yTop + h * 0.55 + 8} L ${lx - 12},${yTop + h * 0.55 + 16}`,
            `M ${cx + 6},${yBot + 10} L ${cx - 4},${yBot + 8} L ${cx + 12},${yBot + 14}`,
            `M ${cx + 5},${yTop - 16} L ${cx - 3},${yTop - 10} L ${cx + 8},${yTop - 5}`,
          ];

    const spikes =
      variant === 0
        ? [
            `M ${lx - 2},${yTop + h * 0.1} L ${lx + 8},${yTop + h * 0.1 + 6} L ${lx - 2},${yTop + h * 0.1 + 12}`,
            `M ${lx - 6},${yTop + h * 0.18} L ${lx + 11},${yTop + h * 0.18 + 9} L ${lx - 4},${yTop + h * 0.18 + 18}`,
            `M ${lx - 2},${yTop + h * 0.72} L ${lx + 9},${yTop + h * 0.72 + 5} L ${lx - 1},${yTop + h * 0.72 + 11}`,
            `M ${rx + 3},${yTop + h * 0.35} L ${rx - 10},${yTop + h * 0.35 + 7} L ${rx + 5},${yTop + h * 0.35 + 16}`,
            `M ${rx + 1},${yTop + h * 0.48} L ${rx - 14},${yTop + h * 0.48 + 5} L ${rx + 3},${yTop + h * 0.48 + 14}`,
            `M ${rx + 6},${yTop + h * 0.82} L ${rx - 8},${yTop + h * 0.82 + 9} L ${rx + 4},${yTop + h * 0.82 + 20}`,
          ]
        : [
            `M ${lx + 1},${yTop + h * 0.25} L ${lx + 12},${yTop + h * 0.25 + 8} L ${lx - 3},${yTop + h * 0.25 + 17}`,
            `M ${lx - 5},${yTop + h * 0.55} L ${lx + 9},${yTop + h * 0.55 + 6} L ${lx - 2},${yTop + h * 0.55 + 15}`,
            `M ${lx - 3},${yTop + h * 0.8} L ${lx + 13},${yTop + h * 0.8 + 10} L ${lx - 6},${yTop + h * 0.8 + 22}`,
            `M ${rx + 5},${yTop + h * 0.12} L ${rx - 9},${yTop + h * 0.12 + 6} L ${rx + 2},${yTop + h * 0.12 + 14}`,
            `M ${rx + 2},${yTop + h * 0.44} L ${rx - 12},${yTop + h * 0.44 + 8} L ${rx + 6},${yTop + h * 0.44 + 18}`,
            `M ${rx + 8},${yTop + h * 0.68} L ${rx - 7},${yTop + h * 0.68 + 5} L ${rx + 3},${yTop + h * 0.68 + 13}`,
          ];

    const cracks =
      variant === 0
        ? [
            `M ${lx + 2},${yTop + h * 0.38} L ${lx - 22},${yTop + h * 0.34} M ${lx - 12},${yTop + h * 0.35} L ${lx - 18},${yTop + h * 0.4}`,
            `M ${rx - 3},${yTop + h * 0.6} L ${rx + 24},${yTop + h * 0.58} M ${rx + 14},${yTop + h * 0.59} L ${rx + 20},${yTop + h * 0.65}`,
            `M ${cx},${yTop - 10} L ${cx - 8},${yTop - 24} M ${cx - 4},${yTop - 18} L ${cx - 12},${yTop - 20}`,
            `M ${cx + 5},${yBot + 6} L ${cx + 16},${yBot + 22} M ${cx + 12},${yBot + 16} L ${cx + 6},${yBot + 22}`,
          ]
        : [
            `M ${lx + 4},${yTop + h * 0.44} L ${lx - 20},${yTop + h * 0.42} M ${lx - 10},${yTop + h * 0.43} L ${lx - 15},${yTop + h * 0.49}`,
            `M ${rx - 2},${yTop + h * 0.32} L ${rx + 26},${yTop + h * 0.3} M ${rx + 16},${yTop + h * 0.31} L ${rx + 22},${yTop + h * 0.38}`,
            `M ${cx - 5},${yTop - 12} L ${cx + 10},${yTop - 26} M ${cx + 6},${yTop - 20} L ${cx + 14},${yTop - 22}`,
            `M ${cx - 8},${yBot + 8} L ${cx - 20},${yBot + 24} M ${cx - 14},${yBot + 18} L ${cx - 8},${yBot + 24}`,
          ];

    const sigilCx = variant === 0 ? cx - 30 : cx + 28;
    const sigilCy = variant === 0 ? yTop - 16 : yTop - 14;
    const sigilR = 9;
    const pentPts = Array.from({ length: 5 }, (_, i) => {
      const a = ((i * 72 - 90) * Math.PI) / 180;
      return [
        sigilCx + sigilR * 0.6 * Math.cos(a),
        sigilCy + sigilR * 0.6 * Math.sin(a),
      ];
    });
    const starPath = `${[0, 2, 4, 1, 3]
      .map(
        (i, j) =>
          `${j === 0 ? "M" : "L"} ${pentPts[i][0].toFixed(1)},${pentPts[i][1].toFixed(1)}`,
      )
      .join(" ")} Z`;

    return (
      <g filter="url(#frameGlow)">
        <path d={borderPath} fill="url(#gothicPattern)" opacity="0.92" />
        <path
          d={borderPath}
          fill="none"
          stroke={FRAME_STROKE}
          strokeWidth={2.2}
          filter="url(#crackFilter)"
        />
        <path
          d={innerBorder}
          fill="none"
          stroke={FRAME_STROKE}
          strokeWidth={0.8}
          opacity={0.5}
          strokeDasharray="3 3 1 4"
        />
        {spikes.map((d) => (
          <path
            key={d}
            d={d}
            fill="none"
            stroke={FRAME_STROKE}
            strokeWidth={1.2}
            opacity={0.75}
            strokeLinecap="round"
          />
        ))}
        {cracks.map((d) => (
          <path
            key={d}
            d={d}
            fill="none"
            stroke={FRAME_STROKE}
            strokeWidth={0.8}
            opacity={0.6}
            strokeLinecap="round"
          />
        ))}
        {runeLines.map((d) => (
          <path
            key={d}
            d={d}
            fill="none"
            stroke={FRAME_STROKE}
            strokeWidth={1}
            opacity={0.7}
            strokeLinecap="round"
          />
        ))}
        <path
          d={invTriangle}
          fill="none"
          stroke={FRAME_STROKE}
          strokeWidth={1}
          opacity={0.8}
        />
        <path
          d={invTriangleLine}
          fill="none"
          stroke={FRAME_STROKE}
          strokeWidth={1}
          opacity={0.8}
        />
        <circle
          cx={eye1x}
          cy={eye1y}
          r={eyeR}
          fill="none"
          stroke={FRAME_STROKE}
          strokeWidth={0.9}
          opacity={0.75}
        />
        <line
          x1={eye1x - eyeR}
          y1={eye1y}
          x2={eye1x + eyeR}
          y2={eye1y}
          stroke={FRAME_STROKE}
          strokeWidth={0.6}
          opacity={0.6}
        />
        <line
          x1={eye1x}
          y1={eye1y - eyeR}
          x2={eye1x}
          y2={eye1y + eyeR}
          stroke={FRAME_STROKE}
          strokeWidth={0.6}
          opacity={0.6}
        />
        <circle
          cx={eye1x}
          cy={eye1y}
          r={2.5}
          fill={FRAME_STROKE}
          opacity={0.7}
        />
        <circle
          cx={sigilCx}
          cy={sigilCy}
          r={sigilR}
          fill="none"
          stroke={FRAME_STROKE}
          strokeWidth={0.9}
          opacity={0.8}
        />
        <path
          d={starPath}
          fill="none"
          stroke={FRAME_STROKE}
          strokeWidth={0.7}
          opacity={0.7}
        />
      </g>
    );
  }

  // Gothic skull head element
  function GothicHead({ cx, cy }: { cx: number; cy: number }) {
    const rx = 29;
    const ry = 34;
    return (
      <g>
        <ellipse
          cx={cx}
          cy={cy}
          rx={rx}
          ry={ry}
          fill={HEAD_FILL}
          stroke={FRAME_STROKE}
          strokeWidth={1.5}
        />
      </g>
    );
  }
  return (
    <div className="flex flex-col" style={{ height: "calc(100vh - 130px)" }}>
      {/* Rank legend */}
      <div
        className="flex items-center gap-2 overflow-x-auto px-4 py-2 border-b border-border flex-shrink-0"
        data-ocid="body.legend.panel"
      >
        {tierLegend.map(({ label, color }) => (
          <div key={label} className="flex items-center gap-1 flex-shrink-0">
            <span
              className="w-3 h-3 rounded-full inline-block"
              style={{ background: color }}
            />
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              {label}
            </span>
          </div>
        ))}
      </div>

      <div className="text-center text-xs text-muted-foreground pt-2 flex-shrink-0">
        Tap a muscle to inspect
      </div>

      {/* SVG Diagram */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto"
        data-ocid="body.canvas_target"
        onClick={closePopout}
        onKeyDown={(e) => {
          if (e.key === "Escape") closePopout();
        }}
        role="presentation"
      >
        <svg
          role="img"
          aria-label="Interactive muscle diagram with front and back views"
          viewBox="0 0 528 756"
          width="100%"
          style={{ display: "block", background: PATTERN_BG }}
          xmlns="http://www.w3.org/2000/svg"
        >
          {svgDefs}

          <g transform="scale(1.2)">
            {/* ===== GOTHIC FRAMES ===== */}
            <GothicFrame cx={100} halfW={98} yTop={10} yBot={508} variant={0} />
            <GothicFrame
              cx={B + 100}
              halfW={98}
              yTop={10}
              yBot={508}
              variant={1}
            />

            {/* ===== GOTHIC SKULL HEADS ===== */}
            <GothicHead cx={100} cy={47} />
            <GothicHead cx={B + 100} cy={47} />

            {/* Panel labels */}
            <text
              x={100}
              y={496}
              textAnchor="middle"
              fill={FRAME_STROKE}
              fontSize={8}
              letterSpacing="4"
              fontFamily="serif"
              opacity={0.9}
            >
              FRONT
            </text>
            <text
              x={B + 100}
              y={496}
              textAnchor="middle"
              fill={FRAME_STROKE}
              fontSize={8}
              letterSpacing="4"
              fontFamily="serif"
              opacity={0.9}
            >
              BACK
            </text>

            {/* ===== MUSCLES (wrapped in gothic distortion) ===== */}
            <g filter="url(#gothicDistort)">
              {/* ===== FRONT PANEL MUSCLES ===== */}

              <MG
                onClick={click(MuscleGroup.neck)}
                filter={mFilt(MuscleGroup.neck)}
              >
                <path
                  d="M87,82 L91,80 L96,83 L100,81 L104,83 L109,80 L113,82 L111,88 L113,95 L110,100 L107,97 L104,103 L100,101 L96,103 L93,98 L90,101 L87,97 L89,90 Z"
                  fill={mFill(MuscleGroup.neck)}
                  stroke={mStroke(MuscleGroup.neck)}
                  strokeWidth={mSW(MuscleGroup.neck)}
                  strokeLinejoin="round"
                />
              </MG>

              <MG
                onClick={click(MuscleGroup.shoulders)}
                filter={mFilt(MuscleGroup.shoulders)}
              >
                <path
                  d="M35,105 L42,100 L50,102 L58,98 L64,104 L66,112 L68,120 L64,129 L57,134 L48,135 L39,131 L32,124 L30,115 Z"
                  fill={mFill(MuscleGroup.shoulders)}
                  stroke={mStroke(MuscleGroup.shoulders)}
                  strokeWidth={mSW(MuscleGroup.shoulders)}
                  strokeLinejoin="round"
                />
              </MG>

              <MG
                onClick={click(MuscleGroup.shoulders)}
                filter={mFilt(MuscleGroup.shoulders)}
              >
                <path
                  d="M165,105 L158,100 L150,102 L142,98 L136,104 L134,112 L132,120 L136,129 L143,134 L152,135 L161,131 L168,124 L170,115 Z"
                  fill={mFill(MuscleGroup.shoulders)}
                  stroke={mStroke(MuscleGroup.shoulders)}
                  strokeWidth={mSW(MuscleGroup.shoulders)}
                  strokeLinejoin="round"
                />
              </MG>

              <MG
                onClick={click(MuscleGroup.chest)}
                filter={mFilt(MuscleGroup.chest)}
              >
                <path
                  d="M67,117 L72,114 L78,116 L83,113 L89,115 L95,117 L98,122 L97,130 L94,138 L89,147 L83,153 L76,156 L69,152 L63,144 L60,135 L61,125 Z"
                  fill={mFill(MuscleGroup.chest)}
                  stroke={mStroke(MuscleGroup.chest)}
                  strokeWidth={mSW(MuscleGroup.chest)}
                  strokeLinejoin="round"
                />
              </MG>

              <MG
                onClick={click(MuscleGroup.chest)}
                filter={mFilt(MuscleGroup.chest)}
              >
                <path
                  d="M133,117 L128,114 L122,116 L117,113 L111,115 L105,117 L102,122 L103,130 L106,138 L111,147 L117,153 L124,156 L131,152 L137,144 L140,135 L139,125 Z"
                  fill={mFill(MuscleGroup.chest)}
                  stroke={mStroke(MuscleGroup.chest)}
                  strokeWidth={mSW(MuscleGroup.chest)}
                  strokeLinejoin="round"
                />
              </MG>

              <MG
                onClick={click(MuscleGroup.biceps)}
                filter={mFilt(MuscleGroup.biceps)}
              >
                <path
                  d="M25,150 L30,147 L36,149 L41,147 L45,152 L46,160 L44,170 L42,180 L39,188 L34,192 L28,190 L23,184 L20,174 L20,163 Z"
                  fill={mFill(MuscleGroup.biceps)}
                  stroke={mStroke(MuscleGroup.biceps)}
                  strokeWidth={mSW(MuscleGroup.biceps)}
                  strokeLinejoin="round"
                />
              </MG>

              <MG
                onClick={click(MuscleGroup.biceps)}
                filter={mFilt(MuscleGroup.biceps)}
              >
                <path
                  d="M175,150 L170,147 L164,149 L159,147 L155,152 L154,160 L156,170 L158,180 L161,188 L166,192 L172,190 L177,184 L180,174 L180,163 Z"
                  fill={mFill(MuscleGroup.biceps)}
                  stroke={mStroke(MuscleGroup.biceps)}
                  strokeWidth={mSW(MuscleGroup.biceps)}
                  strokeLinejoin="round"
                />
              </MG>

              {(
                [
                  [85, 190],
                  [115, 190],
                  [85, 214],
                  [115, 214],
                  [85, 238],
                  [115, 238],
                ] as [number, number][]
              ).map(([ax, ay], idx) => {
                const offsets =
                  idx % 2 === 0
                    ? [
                        [0, -12],
                        [6, -10],
                        [12, -8],
                        [13, 0],
                        [11, 10],
                        [6, 12],
                        [-1, 12],
                        [-6, 10],
                        [-12, 8],
                        [-13, 0],
                        [-11, -9],
                      ]
                    : [
                        [0, -12],
                        [7, -9],
                        [12, -6],
                        [13, 1],
                        [10, 11],
                        [5, 12],
                        [-2, 12],
                        [-7, 9],
                        [-12, 6],
                        [-13, -1],
                        [-10, -10],
                      ];
                const pts = offsets
                  .map(([dx, dy]) => `${ax + dx},${ay + dy}`)
                  .join(" ");
                return (
                  <MG
                    key={`abs-${ax}-${ay}`}
                    onClick={click(MuscleGroup.abs)}
                    filter={mFilt(MuscleGroup.abs)}
                  >
                    <polygon
                      points={pts}
                      fill={mFill(MuscleGroup.abs)}
                      stroke={mStroke(MuscleGroup.abs)}
                      strokeWidth={mSW(MuscleGroup.abs)}
                      strokeLinejoin="round"
                    />
                  </MG>
                );
              })}

              <MG
                onClick={click(MuscleGroup.forearms)}
                filter={mFilt(MuscleGroup.forearms)}
              >
                <path
                  d="M18,200 L22,197 L27,199 L32,197 L36,200 L38,208 L39,218 L38,228 L36,236 L32,241 L27,243 L22,241 L18,236 L16,226 L15,215 Z"
                  fill={mFill(MuscleGroup.forearms)}
                  stroke={mStroke(MuscleGroup.forearms)}
                  strokeWidth={mSW(MuscleGroup.forearms)}
                  strokeLinejoin="round"
                />
              </MG>

              <MG
                onClick={click(MuscleGroup.forearms)}
                filter={mFilt(MuscleGroup.forearms)}
              >
                <path
                  d="M182,200 L178,197 L173,199 L168,197 L164,200 L162,208 L161,218 L162,228 L164,236 L168,241 L173,243 L178,241 L182,236 L184,226 L185,215 Z"
                  fill={mFill(MuscleGroup.forearms)}
                  stroke={mStroke(MuscleGroup.forearms)}
                  strokeWidth={mSW(MuscleGroup.forearms)}
                  strokeLinejoin="round"
                />
              </MG>

              <MG
                onClick={click(MuscleGroup.quadriceps)}
                filter={mFilt(MuscleGroup.quadriceps)}
              >
                <path
                  d="M59,278 L66,274 L73,277 L80,273 L87,276 L93,280 L97,290 L98,304 L97,318 L95,333 L92,346 L87,357 L81,366 L74,370 L67,368 L60,362 L55,350 L53,336 L53,320 L55,304 L55,289 Z"
                  fill={mFill(MuscleGroup.quadriceps)}
                  stroke={mStroke(MuscleGroup.quadriceps)}
                  strokeWidth={mSW(MuscleGroup.quadriceps)}
                  strokeLinejoin="round"
                />
              </MG>

              <MG
                onClick={click(MuscleGroup.quadriceps)}
                filter={mFilt(MuscleGroup.quadriceps)}
              >
                <path
                  d="M141,278 L134,274 L127,277 L120,273 L113,276 L107,280 L103,290 L102,304 L103,318 L105,333 L108,346 L113,357 L119,366 L126,370 L133,368 L140,362 L145,350 L147,336 L147,320 L145,304 L145,289 Z"
                  fill={mFill(MuscleGroup.quadriceps)}
                  stroke={mStroke(MuscleGroup.quadriceps)}
                  strokeWidth={mSW(MuscleGroup.quadriceps)}
                  strokeLinejoin="round"
                />
              </MG>

              <MG
                onClick={click(MuscleGroup.calves)}
                filter={mFilt(MuscleGroup.calves)}
              >
                <path
                  d="M60,392 L65,388 L70,391 L75,387 L80,390 L84,397 L86,407 L85,420 L83,432 L80,444 L76,453 L71,458 L65,456 L60,450 L57,439 L55,427 L55,413 L57,401 Z"
                  fill={mFill(MuscleGroup.calves)}
                  stroke={mStroke(MuscleGroup.calves)}
                  strokeWidth={mSW(MuscleGroup.calves)}
                  strokeLinejoin="round"
                />
              </MG>

              <MG
                onClick={click(MuscleGroup.calves)}
                filter={mFilt(MuscleGroup.calves)}
              >
                <path
                  d="M140,392 L135,388 L130,391 L125,387 L120,390 L116,397 L114,407 L115,420 L117,432 L120,444 L124,453 L129,458 L135,456 L140,450 L143,439 L145,427 L145,413 L143,401 Z"
                  fill={mFill(MuscleGroup.calves)}
                  stroke={mStroke(MuscleGroup.calves)}
                  strokeWidth={mSW(MuscleGroup.calves)}
                  strokeLinejoin="round"
                />
              </MG>

              {/* ===== BACK PANEL MUSCLES ===== */}

              <MG
                onClick={click(MuscleGroup.neck)}
                filter={mFilt(MuscleGroup.neck)}
              >
                <path
                  d={`M${B + 87},82 L${B + 91},80 L${B + 96},83 L${B + 100},81 L${B + 104},83 L${B + 109},80 L${B + 113},82 L${B + 111},88 L${B + 113},95 L${B + 110},100 L${B + 107},97 L${B + 104},103 L${B + 100},101 L${B + 96},103 L${B + 93},98 L${B + 90},101 L${B + 87},97 L${B + 89},90 Z`}
                  fill={mFill(MuscleGroup.neck)}
                  stroke={mStroke(MuscleGroup.neck)}
                  strokeWidth={mSW(MuscleGroup.neck)}
                  strokeLinejoin="round"
                />
              </MG>

              <MG
                onClick={click(MuscleGroup.traps)}
                filter={mFilt(MuscleGroup.traps)}
              >
                <path
                  d={`M${B + 100},103 L${B + 112},107 L${B + 124},112 L${B + 135},117 L${B + 145},122 L${B + 151},128 L${B + 148},135 L${B + 141},140 L${B + 132},143 L${B + 120},140 L${B + 110},137 L${B + 100},136 L${B + 90},137 L${B + 80},140 L${B + 68},143 L${B + 59},140 L${B + 52},135 L${B + 49},128 L${B + 55},122 L${B + 65},117 L${B + 76},112 L${B + 88},107 Z`}
                  fill={mFill(MuscleGroup.traps)}
                  stroke={mStroke(MuscleGroup.traps)}
                  strokeWidth={mSW(MuscleGroup.traps)}
                  strokeLinejoin="round"
                />
              </MG>

              <MG
                onClick={click(MuscleGroup.back)}
                filter={mFilt(MuscleGroup.back)}
              >
                <path
                  d={`M${B + 70},153 L${B + 78},149 L${B + 88},151 L${B + 100},149 L${B + 112},151 L${B + 122},149 L${B + 130},153 L${B + 132},162 L${B + 130},170 L${B + 122},177 L${B + 112},180 L${B + 100},182 L${B + 88},180 L${B + 78},177 L${B + 70},170 L${B + 68},162 Z`}
                  fill={mFill(MuscleGroup.back)}
                  stroke={mStroke(MuscleGroup.back)}
                  strokeWidth={mSW(MuscleGroup.back)}
                  strokeLinejoin="round"
                />
              </MG>

              <MG
                onClick={click(MuscleGroup.lats)}
                filter={mFilt(MuscleGroup.lats)}
              >
                <path
                  d={`M${B + 56},145 L${B + 61},142 L${B + 63},148 L${B + 66},154 L${B + 68},162 L${B + 68},172 L${B + 66},182 L${B + 62},191 L${B + 56},200 L${B + 50},205 L${B + 43},206 L${B + 37},202 L${B + 34},194 L${B + 34},184 L${B + 37},172 L${B + 41},161 L${B + 47},151 Z`}
                  fill={mFill(MuscleGroup.lats)}
                  stroke={mStroke(MuscleGroup.lats)}
                  strokeWidth={mSW(MuscleGroup.lats)}
                  strokeLinejoin="round"
                />
              </MG>

              <MG
                onClick={click(MuscleGroup.lats)}
                filter={mFilt(MuscleGroup.lats)}
              >
                <path
                  d={`M${B + 144},145 L${B + 139},142 L${B + 137},148 L${B + 134},154 L${B + 132},162 L${B + 132},172 L${B + 134},182 L${B + 138},191 L${B + 144},200 L${B + 150},205 L${B + 157},206 L${B + 163},202 L${B + 166},194 L${B + 166},184 L${B + 163},172 L${B + 159},161 L${B + 153},151 Z`}
                  fill={mFill(MuscleGroup.lats)}
                  stroke={mStroke(MuscleGroup.lats)}
                  strokeWidth={mSW(MuscleGroup.lats)}
                  strokeLinejoin="round"
                />
              </MG>

              <MG
                onClick={click(MuscleGroup.triceps)}
                filter={mFilt(MuscleGroup.triceps)}
              >
                <path
                  d={`M${B + 25},150 L${B + 31},147 L${B + 36},149 L${B + 42},147 L${B + 47},151 L${B + 49},159 L${B + 48},169 L${B + 46},179 L${B + 43},188 L${B + 38},194 L${B + 32},196 L${B + 26},193 L${B + 21},186 L${B + 19},176 L${B + 19},165 L${B + 21},156 Z`}
                  fill={mFill(MuscleGroup.triceps)}
                  stroke={mStroke(MuscleGroup.triceps)}
                  strokeWidth={mSW(MuscleGroup.triceps)}
                  strokeLinejoin="round"
                />
              </MG>

              <MG
                onClick={click(MuscleGroup.triceps)}
                filter={mFilt(MuscleGroup.triceps)}
              >
                <path
                  d={`M${B + 175},150 L${B + 169},147 L${B + 164},149 L${B + 158},147 L${B + 153},151 L${B + 151},159 L${B + 152},169 L${B + 154},179 L${B + 157},188 L${B + 162},194 L${B + 168},196 L${B + 174},193 L${B + 179},186 L${B + 181},176 L${B + 181},165 L${B + 179},156 Z`}
                  fill={mFill(MuscleGroup.triceps)}
                  stroke={mStroke(MuscleGroup.triceps)}
                  strokeWidth={mSW(MuscleGroup.triceps)}
                  strokeLinejoin="round"
                />
              </MG>

              <MG
                onClick={click(MuscleGroup.glutes)}
                filter={mFilt(MuscleGroup.glutes)}
              >
                <path
                  d={`M${B + 60},262 L${B + 68},258 L${B + 76},261 L${B + 83},258 L${B + 90},263 L${B + 97},270 L${B + 100},280 L${B + 99},291 L${B + 96},301 L${B + 90},309 L${B + 82},313 L${B + 73},314 L${B + 64},311 L${B + 57},304 L${B + 53},294 L${B + 52},283 L${B + 54},272 Z`}
                  fill={mFill(MuscleGroup.glutes)}
                  stroke={mStroke(MuscleGroup.glutes)}
                  strokeWidth={mSW(MuscleGroup.glutes)}
                  strokeLinejoin="round"
                />
              </MG>

              <MG
                onClick={click(MuscleGroup.glutes)}
                filter={mFilt(MuscleGroup.glutes)}
              >
                <path
                  d={`M${B + 140},262 L${B + 132},258 L${B + 124},261 L${B + 117},258 L${B + 110},263 L${B + 103},270 L${B + 100},280 L${B + 101},291 L${B + 104},301 L${B + 110},309 L${B + 118},313 L${B + 127},314 L${B + 136},311 L${B + 143},304 L${B + 147},294 L${B + 148},283 L${B + 146},272 Z`}
                  fill={mFill(MuscleGroup.glutes)}
                  stroke={mStroke(MuscleGroup.glutes)}
                  strokeWidth={mSW(MuscleGroup.glutes)}
                  strokeLinejoin="round"
                />
              </MG>

              <MG
                onClick={click(MuscleGroup.hamstrings)}
                filter={mFilt(MuscleGroup.hamstrings)}
              >
                <path
                  d={`M${B + 61},326 L${B + 68},322 L${B + 75},325 L${B + 82},321 L${B + 89},325 L${B + 94},333 L${B + 97},344 L${B + 97},357 L${B + 95},370 L${B + 91},382 L${B + 86},393 L${B + 80},401 L${B + 73},406 L${B + 66},404 L${B + 59},398 L${B + 54},388 L${B + 52},375 L${B + 52},361 L${B + 53},347 L${B + 56},335 Z`}
                  fill={mFill(MuscleGroup.hamstrings)}
                  stroke={mStroke(MuscleGroup.hamstrings)}
                  strokeWidth={mSW(MuscleGroup.hamstrings)}
                  strokeLinejoin="round"
                />
              </MG>

              <MG
                onClick={click(MuscleGroup.hamstrings)}
                filter={mFilt(MuscleGroup.hamstrings)}
              >
                <path
                  d={`M${B + 139},326 L${B + 132},322 L${B + 125},325 L${B + 118},321 L${B + 111},325 L${B + 106},333 L${B + 103},344 L${B + 103},357 L${B + 105},370 L${B + 109},382 L${B + 114},393 L${B + 120},401 L${B + 127},406 L${B + 134},404 L${B + 141},398 L${B + 146},388 L${B + 148},375 L${B + 148},361 L${B + 147},347 L${B + 144},335 Z`}
                  fill={mFill(MuscleGroup.hamstrings)}
                  stroke={mStroke(MuscleGroup.hamstrings)}
                  strokeWidth={mSW(MuscleGroup.hamstrings)}
                  strokeLinejoin="round"
                />
              </MG>

              <MG
                onClick={click(MuscleGroup.calves)}
                filter={mFilt(MuscleGroup.calves)}
              >
                <path
                  d={`M${B + 60},420 L${B + 65},416 L${B + 71},419 L${B + 76},415 L${B + 82},419 L${B + 86},428 L${B + 88},440 L${B + 87},453 L${B + 85},466 L${B + 82},478 L${B + 77},488 L${B + 71},493 L${B + 65},491 L${B + 59},485 L${B + 55},474 L${B + 54},461 L${B + 54},447 L${B + 56},433 Z`}
                  fill={mFill(MuscleGroup.calves)}
                  stroke={mStroke(MuscleGroup.calves)}
                  strokeWidth={mSW(MuscleGroup.calves)}
                  strokeLinejoin="round"
                />
              </MG>

              <MG
                onClick={click(MuscleGroup.calves)}
                filter={mFilt(MuscleGroup.calves)}
              >
                <path
                  d={`M${B + 140},420 L${B + 135},416 L${B + 129},419 L${B + 124},415 L${B + 118},419 L${B + 114},428 L${B + 112},440 L${B + 113},453 L${B + 115},466 L${B + 118},478 L${B + 123},488 L${B + 129},493 L${B + 135},491 L${B + 141},485 L${B + 145},474 L${B + 146},461 L${B + 146},447 L${B + 144},433 Z`}
                  fill={mFill(MuscleGroup.calves)}
                  stroke={mStroke(MuscleGroup.calves)}
                  strokeWidth={mSW(MuscleGroup.calves)}
                  strokeLinejoin="round"
                />
              </MG>
            </g>
            {/* END gothic distort group */}

            {/* Vignette overlay */}
            <rect
              x={-20}
              y={-20}
              width={480}
              height={660}
              fill="url(#vignetteGrad)"
              style={{ pointerEvents: "none" }}
            />
          </g>
        </svg>
      </div>

      {/* Floating popout card */}
      {selectedMuscle && selected && popoutPos && (
        <div
          className="fixed z-50 rounded-2xl border border-border shadow-2xl overflow-y-auto"
          style={{
            top: popoutPos.y,
            left: popoutPos.x,
            width: 240,
            maxHeight: "70vh",
            background: "oklch(0.13 0.008 280)",
            borderColor: `${selectedColor}44`,
            boxShadow: `0 8px 32px 0 ${selectedColor}22`,
          }}
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
          data-ocid="body.muscle.panel"
        >
          {!showLog ? (
            /* Rank/stats view */
            <div className="p-4">
              <button
                type="button"
                className="absolute top-3 right-3 text-muted-foreground hover:text-foreground transition-colors"
                onClick={closePopout}
                data-ocid="body.panel.close_button"
              >
                <X className="w-4 h-4" />
              </button>

              <h3
                className="font-display font-bold text-base mb-1 pr-5"
                style={{ color: selectedColor }}
              >
                {MUSCLE_LABELS[selectedMuscle]}
              </h3>

              <div className="flex items-center gap-2 flex-wrap mb-3">
                <RankBadge rankIndex={selected.rankIdx} size="sm" />
                {selected.isInactive && selected.rawRankIdx >= 0 && (
                  <div className="flex items-center gap-1 text-amber-400 text-xs">
                    <AlertTriangle className="w-3 h-3" />
                    <span>Decayed</span>
                  </div>
                )}
              </div>

              <div className="mb-3">
                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                  <span>
                    {selected.score > 0
                      ? `${Math.round(selected.score)} vol`
                      : "No data"}
                  </span>
                  {nextThreshold && <span>→ {nextThreshold}</span>}
                </div>
                <Progress
                  value={selectedProgress}
                  className="h-1.5"
                  style={
                    { "--progress-color": selectedColor } as React.CSSProperties
                  }
                />
              </div>

              <div className="flex items-center justify-between gap-2">
                <div className="text-xs text-muted-foreground">
                  <span
                    className="font-medium"
                    style={{ color: selectedColor }}
                  >
                    {getRankName(selected.rankIdx)}
                  </span>
                  {selected.rankIdx >= 0 && (
                    <span className="ml-1 opacity-60">
                      · {getRankTier(selected.rankIdx)}
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  className="flex items-center gap-1 text-xs font-medium px-3 py-1 rounded-full transition-colors flex-shrink-0"
                  style={{
                    background: `${selectedColor}22`,
                    color: selectedColor,
                    border: `1px solid ${selectedColor}55`,
                  }}
                  onClick={() => setShowLog(true)}
                  data-ocid="body.log_workout.button"
                >
                  <Dumbbell className="w-3 h-3" />
                  Log
                </button>
              </div>
            </div>
          ) : !logExercise ? (
            /* Exercise selection view */
            <div className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <button
                  type="button"
                  onClick={() => setShowLog(false)}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  data-ocid="body.log.back_button"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <h3
                  className="font-display font-bold text-sm"
                  style={{ color: selectedColor }}
                >
                  {MUSCLE_LABELS[selectedMuscle]} Exercises
                </h3>
              </div>
              <div className="flex flex-col gap-1.5">
                {EXERCISES.filter(
                  (ex) => ex.muscleGroup === selectedMuscle,
                ).map((ex) => (
                  <button
                    type="button"
                    key={ex.name}
                    onClick={() => {
                      setLogExercise(ex);
                      setIsBodyWeight(ex.isBodyWeight);
                      setWeight("");
                    }}
                    className="text-left p-2.5 rounded-lg border border-border bg-card/50 hover:border-muted-foreground transition-all text-xs flex items-center justify-between"
                    data-ocid="body.exercise.button"
                  >
                    <span>{ex.name}</span>
                    {ex.isBodyWeight && (
                      <Badge variant="outline" className="text-xs py-0 h-4">
                        BW
                      </Badge>
                    )}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* Log form view */
            <div className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <button
                  type="button"
                  onClick={() => setLogExercise(null)}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  data-ocid="body.log.back_button"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <div>
                  <p className="font-semibold text-sm">{logExercise.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {MUSCLE_LABELS[selectedMuscle]}
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs text-muted-foreground mb-1 block">
                      Sets
                    </Label>
                    <Input
                      data-ocid="body.sets.input"
                      type="number"
                      min="1"
                      value={sets}
                      onChange={(e) => setSets(e.target.value)}
                      className="h-8 text-sm"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground mb-1 block">
                      Reps
                    </Label>
                    <Input
                      data-ocid="body.reps.input"
                      type="number"
                      min="1"
                      value={reps}
                      onChange={(e) => setReps(e.target.value)}
                      className="h-8 text-sm"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <Label className="text-xs text-muted-foreground">
                      Weight
                    </Label>
                    {logExercise.isBodyWeight && (
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs text-muted-foreground">
                          BW
                        </span>
                        <Switch
                          data-ocid="body.bodyweight.switch"
                          checked={isBodyWeight}
                          onCheckedChange={setIsBodyWeight}
                          className="scale-75"
                        />
                      </div>
                    )}
                  </div>
                  {isBodyWeight ? (
                    <div className="p-2 rounded-lg bg-secondary border border-border text-xs text-muted-foreground">
                      Body weight:{" "}
                      {isImperial
                        ? `${kgToLbs(profile?.weightKg ?? 0)} lbs`
                        : `${profile?.weightKg ?? "—"} kg`}
                    </div>
                  ) : (
                    <div className="relative">
                      <Input
                        data-ocid="body.weight.input"
                        type="number"
                        min="0"
                        step="0.5"
                        placeholder="0"
                        value={weight}
                        onChange={(e) => setWeight(e.target.value)}
                        className="h-8 text-sm pr-10"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">
                        {isImperial ? "lbs" : "kg"}
                      </span>
                    </div>
                  )}
                </div>

                <Button
                  data-ocid="body.log.submit_button"
                  onClick={async () => {
                    const effectiveWeight = isBodyWeight
                      ? (profile?.weightKg ?? 70)
                      : isImperial
                        ? lbsToKg(Number.parseFloat(weight))
                        : Number.parseFloat(weight);
                    if (
                      !isBodyWeight &&
                      (!weight || Number.isNaN(effectiveWeight))
                    ) {
                      toast.error("Please enter a valid weight.");
                      return;
                    }
                    const log: WorkoutLog = {
                      exerciseName: logExercise.name,
                      muscleGroup: logExercise.muscleGroup,
                      sets: BigInt(Number.parseInt(sets) || 1),
                      reps: BigInt(Number.parseInt(reps) || 1),
                      weightKg: effectiveWeight,
                      isBodyWeight,
                      timestamp: BigInt(Date.now()) * BigInt(1_000_000),
                    };
                    try {
                      await addLogMutation.mutateAsync(log);
                      toast.success(`${logExercise.name} logged!`);
                      setShowLog(false);
                      setLogExercise(null);
                      setSets("3");
                      setReps("10");
                      setWeight("");
                    } catch {
                      toast.error("Failed to log workout.");
                    }
                  }}
                  disabled={addLogMutation.isPending}
                  size="sm"
                  className="w-full font-semibold"
                  style={{
                    background: "oklch(0.63 0.24 27)",
                    color: "oklch(0.12 0.008 280)",
                  }}
                >
                  {addLogMutation.isPending ? (
                    <>
                      <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />{" "}
                      Logging...
                    </>
                  ) : (
                    "Log Set"
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
