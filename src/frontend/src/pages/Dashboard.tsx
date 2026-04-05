import { Skeleton } from "@/components/ui/skeleton";
import { ChevronRight, PersonStanding, Target, Zap } from "lucide-react";
import { motion } from "motion/react";
import { useMemo } from "react";
import {
  useGetAllWorkoutLogs,
  useGetCallerUserProfile,
  useGetProteinRequirements,
} from "../hooks/useQueries";
import {
  ALL_MUSCLES,
  MUSCLE_THRESHOLDS,
  calculateVolumeScore,
} from "../lib/rankingUtils";

export default function Dashboard() {
  const { data: logs, isLoading: logsLoading } = useGetAllWorkoutLogs();
  const { data: profile, isLoading: profileLoading } =
    useGetCallerUserProfile();
  const { data: protein } = useGetProteinRequirements();

  const muscleStats = useMemo(() => {
    if (!logs) return {} as Record<string, { score: number }>;
    const result: Record<string, { score: number }> = {};
    for (const log of logs) {
      const effectiveWeight = log.isBodyWeight
        ? (profile?.weightKg ?? 70)
        : log.weightKg;
      const score = calculateVolumeScore(
        Number(log.sets),
        Number(log.reps),
        effectiveWeight,
      );
      const key = log.muscleGroup as string;
      const prev = result[key];
      if (!prev || score > prev.score) {
        result[key] = { score };
      }
    }
    return result;
  }, [logs, profile?.weightKg]);

  const totalRanked = useMemo(() => {
    return ALL_MUSCLES.filter(
      (m) => (muscleStats[m]?.score ?? 0) >= MUSCLE_THRESHOLDS[m][0],
    ).length;
  }, [muscleStats]);

  const isLoading = logsLoading || profileLoading;

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Morning";
    if (hour < 17) return "Afternoon";
    return "Evening";
  }, []);

  if (isLoading) {
    return (
      <div className="p-4 flex flex-col gap-4">
        <Skeleton className="h-20 w-full rounded-2xl" />
        <div className="grid grid-cols-2 gap-3">
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
        </div>
        <Skeleton className="h-16 rounded-xl" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="p-4 pb-8 flex flex-col gap-4"
    >
      {/* Welcome header */}
      <div
        className="rounded-2xl p-5"
        style={{
          background:
            "linear-gradient(135deg, oklch(0.17 0.025 42 / 0.9) 0%, oklch(0.13 0.015 260) 100%)",
          border: "1px solid oklch(0.63 0.24 27 / 0.25)",
        }}
      >
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">
              Good {greeting}
            </p>
            <h1 className="font-display text-2xl font-bold">Ready to train?</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {totalRanked === 0
                ? "Log your first workout to start ranking."
                : `${totalRanked} muscle${totalRanked !== 1 ? "s" : ""} ranked — keep pushing.`}
            </p>
          </div>
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{
              background: "oklch(0.63 0.24 27 / 0.15)",
              border: "1px solid oklch(0.63 0.24 27 / 0.3)",
            }}
          >
            <Zap className="w-5 h-5" style={{ color: "oklch(0.63 0.24 27)" }} />
          </div>
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 gap-3">
        <div
          className="rounded-xl p-4 flex flex-col gap-2"
          style={{
            background: "oklch(var(--card))",
            border: "1px solid oklch(var(--border))",
          }}
        >
          <div className="flex items-center gap-2">
            <PersonStanding
              className="w-4 h-4"
              style={{ color: "oklch(0.63 0.24 27)" }}
            />
            <span className="text-xs text-muted-foreground uppercase tracking-wide">
              Ranked
            </span>
          </div>
          <div className="font-display text-3xl font-bold">
            {totalRanked}
            <span className="text-base font-normal text-muted-foreground">
              {" "}
              / {ALL_MUSCLES.length}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">muscles ranked</p>
        </div>

        <div
          className="rounded-xl p-4 flex flex-col gap-2"
          style={{
            background: "oklch(var(--card))",
            border: "1px solid oklch(var(--border))",
          }}
        >
          <div className="flex items-center gap-2">
            <Target
              className="w-4 h-4"
              style={{ color: "oklch(0.65 0.15 180)" }}
            />
            <span className="text-xs text-muted-foreground uppercase tracking-wide">
              Protein
            </span>
          </div>
          <div className="font-display text-3xl font-bold">
            {protein ? Math.round(protein.optimal) : "—"}
            <span className="text-base font-normal text-muted-foreground">
              {" "}
              g
            </span>
          </div>
          <p className="text-xs text-muted-foreground">daily target</p>
        </div>
      </div>

      {/* Tip card */}
      <div
        className="rounded-xl p-4 flex items-center justify-between gap-3"
        style={{
          background: "oklch(var(--card))",
          border: "1px solid oklch(var(--border))",
        }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: "oklch(0.63 0.24 27 / 0.12)" }}
          >
            <PersonStanding
              className="w-4 h-4"
              style={{ color: "oklch(0.63 0.24 27)" }}
            />
          </div>
          <p className="text-sm text-muted-foreground">
            Tap any muscle on the{" "}
            <span className="text-foreground font-medium">Body</span> tab to
            view rank and log a workout.
          </p>
        </div>
        <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
      </div>
    </motion.div>
  );
}
