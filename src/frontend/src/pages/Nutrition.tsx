import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "motion/react";
import { Goal } from "../backend.d";
import {
  useGetCallerUserProfile,
  useGetProteinRequirements,
} from "../hooks/useQueries";

const GOAL_LABELS: Record<Goal, string> = {
  [Goal.buildMaxMuscle]: "Build Max Muscle",
  [Goal.buildLeanMuscle]: "Build Lean Muscle",
  [Goal.recomposition]: "Body Recomposition",
};

interface ProteinCardProps {
  label: string;
  value: number;
  unit?: string;
  color?: string;
  ocid: string;
  hero?: boolean;
}

function ProteinCard({
  label,
  value,
  unit = "g",
  color,
  ocid,
  hero = false,
}: ProteinCardProps) {
  return (
    <div
      data-ocid={ocid}
      className="relative bg-card border border-border rounded-xl p-4 flex flex-col gap-1 overflow-hidden"
      style={{
        borderColor: color ? `${color}55` : undefined,
        boxShadow: hero && color ? `0 0 24px ${color}22` : undefined,
      }}
    >
      {/* Left accent bar for hero */}
      {hero && color && (
        <div
          className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl"
          style={{ background: color }}
        />
      )}
      <div
        className={`text-xs uppercase tracking-wide text-muted-foreground ${hero ? "pl-2" : ""}`}
      >
        {label}
      </div>
      <div
        className={`font-display font-bold ${hero ? "text-4xl pl-2" : "text-3xl"}`}
        style={{ color: color ?? "oklch(0.95 0.005 280)" }}
      >
        {Math.round(value)}
        <span className="text-base font-normal text-muted-foreground ml-1">
          {unit}
        </span>
      </div>
      {hero && (
        <p className="text-xs text-muted-foreground pl-2 mt-0.5">
          per day target
        </p>
      )}
    </div>
  );
}

const SKELETON_KEYS = ["opt", "min", "tot", "ht", "sur", "def"];

export default function Nutrition() {
  const { data: protein, isLoading: proteinLoading } =
    useGetProteinRequirements();
  const { data: profile, isLoading: profileLoading } =
    useGetCallerUserProfile();

  const isLoading = proteinLoading || profileLoading;

  return (
    <div className="p-4 pb-8">
      <div className="mb-6">
        <h2 className="font-display text-2xl font-bold mb-1">Nutrition</h2>
        <p className="text-muted-foreground text-sm">
          Daily protein targets based on your profile and goals.
        </p>
      </div>

      {isLoading ? (
        <div
          className="grid grid-cols-2 gap-3"
          data-ocid="nutrition.loading_state"
        >
          {SKELETON_KEYS.map((k) => (
            <Skeleton key={k} className="h-24 rounded-xl" />
          ))}
        </div>
      ) : protein ? (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="flex flex-col gap-4"
        >
          <ProteinCard
            label="Optimal Daily Protein"
            value={protein.optimal}
            color="oklch(0.63 0.24 27)"
            ocid="nutrition.optimal.card"
            hero
          />
          <div className="grid grid-cols-2 gap-3">
            <ProteinCard
              label="Minimum"
              value={protein.minimum}
              ocid="nutrition.minimum.card"
            />
            <ProteinCard
              label="Total (All sources)"
              value={protein.total}
              ocid="nutrition.total.card"
            />
            <ProteinCard
              label="High Training Days"
              value={protein.onHighTrainingDays}
              color="oklch(0.78 0.12 200)"
              ocid="nutrition.high_training.card"
            />
            <ProteinCard
              label="Calorie Surplus"
              value={protein.inCalorieSurplus}
              color="oklch(0.85 0.16 85)"
              ocid="nutrition.surplus.card"
            />
            <ProteinCard
              label="Calorie Deficit"
              value={protein.inCalorieDeficit}
              ocid="nutrition.deficit.card"
            />
            <ProteinCard
              label="Maintenance"
              value={protein.inCalorieMaintenance}
              ocid="nutrition.maintenance.card"
            />
          </div>

          {profile && (
            <div className="bg-card border border-border rounded-xl p-4 mt-2">
              <h3 className="font-display font-semibold text-sm mb-3 text-muted-foreground uppercase tracking-wide">
                Profile Stats
              </h3>
              <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-sm">
                <div>
                  <div className="text-muted-foreground text-xs">Weight</div>
                  <div className="font-semibold">{profile.weightKg} kg</div>
                </div>
                <div>
                  <div className="text-muted-foreground text-xs">Height</div>
                  <div className="font-semibold">{profile.heightCm} cm</div>
                </div>
                <div>
                  <div className="text-muted-foreground text-xs">Body Fat</div>
                  <div className="font-semibold">{profile.bodyFat}%</div>
                </div>
                <div>
                  <div className="text-muted-foreground text-xs">Goal</div>
                  <div className="font-semibold">
                    {GOAL_LABELS[profile.goal]}
                  </div>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      ) : (
        <div
          data-ocid="nutrition.error_state"
          className="text-center py-16 text-muted-foreground"
        >
          <p>No protein data available.</p>
          <p className="text-xs mt-1">Complete your profile to see targets.</p>
        </div>
      )}
    </div>
  );
}
