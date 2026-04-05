import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import {
  Check,
  ChevronRight,
  Lightbulb,
  Loader2,
  Search,
  Sparkles,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import type { MuscleGroup, WorkoutLog } from "../backend.d";
import { useUnitPreference } from "../context/UnitContext";
import {
  useAddWorkoutLog,
  useGetAllWorkoutLogs,
  useGetCallerUserProfile,
} from "../hooks/useQueries";
import { EXERCISES, type Exercise } from "../lib/exercises";
import { ALL_MUSCLES, MUSCLE_LABELS } from "../lib/rankingUtils";
import { kgToLbs, lbsToKg } from "../lib/units";

type Phase = "browse" | "recommendations" | "log";

// Movement pattern categories for recommendations
const MOVEMENT_PATTERNS: Record<string, string[]> = {
  "Horizontal Push": [
    "Bench Press",
    "Incline Bench Press",
    "Decline Bench Press",
    "Push-Up",
    "Chest Dip",
    "Dumbbell Flye",
    "Cable Crossover",
  ],
  "Vertical Push": ["Overhead Press", "Arnold Press", "Front Raise"],
  "Horizontal Pull": [
    "Barbell Row",
    "Dumbbell Row",
    "T-Bar Row",
    "Seated Cable Row",
    "Face Pull",
  ],
  "Vertical Pull": [
    "Pull-Up",
    "Lat Pulldown",
    "Straight-Arm Pulldown",
    "Single-Arm Cable Row",
  ],
  Hinge: ["Deadlift", "Romanian Deadlift", "Good Morning", "Glute-Ham Raise"],
  Squat: [
    "Squat",
    "Front Squat",
    "Hack Squat",
    "Bulgarian Split Squat",
    "Leg Press",
  ],
  Isolation: [
    "Lateral Raise",
    "Reverse Flye",
    "Barbell Curl",
    "Dumbbell Curl",
    "Hammer Curl",
    "Preacher Curl",
    "Cable Curl",
    "Skull Crusher",
    "Tricep Pushdown",
    "Overhead Tricep Extension",
    "Close-Grip Bench Press",
    "Dip",
    "Leg Extension",
    "Leg Curl",
    "Hip Thrust",
    "Glute Bridge",
    "Cable Kickback",
    "Step-Up",
    "Standing Calf Raise",
    "Seated Calf Raise",
    "Donkey Calf Raise",
    "Single-Leg Calf Raise",
    "Wrist Curl",
    "Reverse Wrist Curl",
    "Farmer's Walk",
    "Plate Pinch",
    "Weighted Crunch",
    "Cable Crunch",
    "Hanging Leg Raise",
    "Plank",
    "Ab Wheel Rollout",
    "Russian Twist",
    "Barbell Shrug",
    "Dumbbell Shrug",
    "Rack Pull",
    "Upright Row",
    "Neck Flexion",
    "Neck Extension",
    "Lateral Neck Flexion",
    "Neck Rotation",
    "Weighted Neck Harness",
    "Nordic Hamstring Curl",
    "Sumo Deadlift",
  ],
};

function getPatternForExercise(name: string): string {
  for (const [pattern, exercises] of Object.entries(MOVEMENT_PATTERNS)) {
    if (exercises.includes(name)) return pattern;
  }
  return "Other";
}

function UnitToggle({
  options,
  value,
  onChange,
}: {
  options: [string, string];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex rounded-md overflow-hidden border border-border text-xs">
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          onClick={() => onChange(opt)}
          className={`px-2 py-0.5 font-medium transition-colors ${
            value === opt
              ? "text-[oklch(0.12_0.008_280)]"
              : "text-muted-foreground hover:text-foreground"
          }`}
          style={
            value === opt ? { background: "oklch(0.63 0.24 27)" } : undefined
          }
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

function RecommendationsScreen({
  muscle,
  logs,
  onBack,
  onSelectExercise,
}: {
  muscle: MuscleGroup;
  logs: WorkoutLog[];
  onBack: () => void;
  onSelectExercise: (ex: Exercise) => void;
}) {
  const muscleExercises = EXERCISES.filter((ex) => ex.muscleGroup === muscle);
  const muscleLogs = logs.filter((l) => l.muscleGroup === muscle);

  // Count usage per exercise
  const usageCounts: Record<string, number> = {};
  for (const log of muscleLogs) {
    usageCounts[log.exerciseName] = (usageCounts[log.exerciseName] ?? 0) + 1;
  }

  // Get patterns used recently (last 5 logs)
  const recentLogs = [...muscleLogs]
    .sort((a, b) => Number(b.timestamp - a.timestamp))
    .slice(0, 5);
  const recentPatterns = new Set(
    recentLogs.map((l) => getPatternForExercise(l.exerciseName)),
  );

  // Suggest exercises from different patterns, or least-used exercises
  const suggestions = muscleExercises
    .map((ex) => ({
      ex,
      count: usageCounts[ex.name] ?? 0,
      pattern: getPatternForExercise(ex.name),
      isVariety: !recentPatterns.has(getPatternForExercise(ex.name)),
    }))
    .sort((a, b) => {
      // Prioritise: variety (different pattern) first, then least used
      if (a.isVariety !== b.isVariety) return a.isVariety ? -1 : 1;
      return a.count - b.count;
    });

  const top3 = suggestions.slice(0, 3);
  const usedExercises = muscleExercises.filter(
    (ex) => (usageCounts[ex.name] ?? 0) > 0,
  );

  return (
    <motion.div
      key="recommendations"
      initial={{ opacity: 0, x: 16 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 16 }}
      transition={{ duration: 0.2 }}
      className="p-4 flex flex-col gap-5"
    >
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-1 text-muted-foreground text-sm hover:text-foreground transition-colors self-start"
      >
        ← Back
      </button>

      <div>
        <div className="flex items-center gap-2 mb-1">
          <Sparkles
            className="w-5 h-5"
            style={{ color: "oklch(0.75 0.18 42)" }}
          />
          <h2 className="font-display text-xl font-bold">
            {MUSCLE_LABELS[muscle]} Recommendations
          </h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Based on your current routine, here are exercises to vary your
          movement patterns.
        </p>
      </div>

      {/* Suggested exercises */}
      <div>
        <div className="flex items-center gap-1.5 mb-3">
          <Lightbulb className="w-4 h-4 text-amber-400" />
          <span className="text-sm font-semibold">Try These Next</span>
        </div>
        <div className="flex flex-col gap-2">
          {top3.map((item) => (
            <button
              type="button"
              key={item.ex.name}
              onClick={() => onSelectExercise(item.ex)}
              className="flex items-center justify-between p-3 rounded-lg border border-border bg-card hover:border-primary transition-all text-left group"
              style={{
                borderColor: item.isVariety
                  ? "oklch(0.75 0.18 42 / 0.4)"
                  : undefined,
              }}
            >
              <div>
                <div className="font-medium text-sm">{item.ex.name}</div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-muted-foreground">
                    {item.pattern}
                  </span>
                  {item.isVariety && (
                    <Badge
                      variant="outline"
                      className="text-xs py-0 h-4"
                      style={{
                        borderColor: "oklch(0.75 0.18 42)",
                        color: "oklch(0.75 0.18 42)",
                      }}
                    >
                      New pattern
                    </Badge>
                  )}
                  {item.count === 0 && (
                    <Badge variant="outline" className="text-xs py-0 h-4">
                      Never tried
                    </Badge>
                  )}
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground" />
            </button>
          ))}
        </div>
      </div>

      {/* Current routine */}
      {usedExercises.length > 0 && (
        <div>
          <div className="text-sm font-semibold mb-2 text-muted-foreground">
            Your Current Routine
          </div>
          <div className="flex flex-col gap-1.5">
            {usedExercises.map((ex) => (
              <button
                type="button"
                key={ex.name}
                onClick={() => onSelectExercise(ex)}
                className="flex items-center justify-between p-2.5 rounded-lg border border-border bg-card/50 hover:border-muted-foreground transition-all text-left"
              >
                <div>
                  <span className="text-sm">{ex.name}</span>
                  <span className="ml-2 text-xs text-muted-foreground">
                    {usageCounts[ex.name]}x logged
                  </span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* All exercises for this muscle */}
      <div>
        <div className="text-sm font-semibold mb-2 text-muted-foreground">
          All {MUSCLE_LABELS[muscle]} Exercises
        </div>
        <div className="flex flex-col gap-1.5">
          {muscleExercises
            .filter((ex) => !usedExercises.some((u) => u.name === ex.name))
            .map((ex) => (
              <button
                type="button"
                key={ex.name}
                onClick={() => onSelectExercise(ex)}
                className="flex items-center justify-between p-2.5 rounded-lg border border-border bg-card/50 hover:border-muted-foreground transition-all text-left"
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm">{ex.name}</span>
                  {ex.isBodyWeight && (
                    <Badge variant="outline" className="text-xs py-0 h-4">
                      Bodyweight
                    </Badge>
                  )}
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
              </button>
            ))}
        </div>
      </div>
    </motion.div>
  );
}

export default function LogWorkout() {
  const [phase, setPhase] = useState<Phase>("browse");
  const [search, setSearch] = useState("");
  const [selectedMuscle, setSelectedMuscle] = useState<MuscleGroup | "all">(
    "all",
  );
  const [selectedExercise, setSelectedExercise] = useState<
    (typeof EXERCISES)[0] | null
  >(null);
  const [sets, setSets] = useState("3");
  const [reps, setReps] = useState("10");
  const [weight, setWeight] = useState("");
  const [isBodyWeight, setIsBodyWeight] = useState(false);
  const [lastLogged, setLastLogged] = useState<string | null>(null);

  const addLogMutation = useAddWorkoutLog();
  const { data: profile } = useGetCallerUserProfile();
  const { data: allLogs = [] } = useGetAllWorkoutLogs();
  const { unitPreference, setUnitPreference } = useUnitPreference();

  const isImperial = unitPreference === "imperial";
  const weightUnit = isImperial ? "lbs" : "kg";

  // Body weight display in preferred unit
  const bodyWeightDisplay = profile?.weightKg
    ? isImperial
      ? kgToLbs(profile.weightKg)
      : profile.weightKg
    : null;

  const filteredExercises = useMemo(() => {
    return EXERCISES.filter((ex) => {
      const matchesMuscle =
        selectedMuscle === "all" || ex.muscleGroup === selectedMuscle;
      const matchesSearch = ex.name
        .toLowerCase()
        .includes(search.toLowerCase());
      return matchesMuscle && matchesSearch;
    });
  }, [search, selectedMuscle]);

  const handleSelectMuscle = (muscle: MuscleGroup | "all") => {
    setSelectedMuscle(muscle);
    // Only show recommendations if a specific muscle is selected
    if (muscle !== "all") {
      setPhase("recommendations");
    }
  };

  const handleSelectExercise = (ex: (typeof EXERCISES)[0]) => {
    setSelectedExercise(ex);
    setIsBodyWeight(ex.isBodyWeight);
    setWeight("");
    setPhase("log");
  };

  const handleWeightUnitToggle = (newUnit: string) => {
    const u = newUnit as "metric" | "imperial";
    if (u === unitPreference) return;
    // Convert existing weight input value
    const parsed = Number.parseFloat(weight);
    if (!Number.isNaN(parsed) && parsed > 0) {
      if (u === "imperial") {
        setWeight(String(kgToLbs(parsed)));
      } else {
        setWeight(String(lbsToKg(parsed)));
      }
    }
    setUnitPreference(u);
  };

  const handleSubmit = async () => {
    if (!selectedExercise) return;

    let effectiveWeightKg: number;
    if (isBodyWeight) {
      effectiveWeightKg = profile?.weightKg ?? 70;
    } else {
      const parsed = Number.parseFloat(weight);
      if (!weight || Number.isNaN(parsed)) {
        toast.error("Please enter a valid weight.");
        return;
      }
      // Convert lbs -> kg if imperial
      effectiveWeightKg = isImperial ? lbsToKg(parsed) : parsed;
    }

    const log: WorkoutLog = {
      exerciseName: selectedExercise.name,
      muscleGroup: selectedExercise.muscleGroup,
      sets: BigInt(Number.parseInt(sets) || 1),
      reps: BigInt(Number.parseInt(reps) || 1),
      weightKg: effectiveWeightKg,
      isBodyWeight,
      timestamp: BigInt(Date.now()) * BigInt(1_000_000),
    };

    try {
      await addLogMutation.mutateAsync(log);
      setLastLogged(selectedExercise.name);
      toast.success(`${selectedExercise.name} logged!`);
      setPhase("browse");
      setSelectedExercise(null);
      setSets("3");
      setReps("10");
      setWeight("");
    } catch {
      toast.error("Failed to log workout.");
    }
  };

  return (
    <div className="flex flex-col h-full">
      <AnimatePresence mode="wait">
        {phase === "recommendations" && selectedMuscle !== "all" ? (
          <RecommendationsScreen
            key="recommendations"
            muscle={selectedMuscle as MuscleGroup}
            logs={allLogs}
            onBack={() => setPhase("browse")}
            onSelectExercise={handleSelectExercise}
          />
        ) : phase === "browse" ? (
          <motion.div
            key="browse"
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col gap-4 p-4"
          >
            <div>
              <h2 className="font-display text-2xl font-bold mb-1">
                Log Workout
              </h2>
              {lastLogged && (
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Check className="w-3.5 h-3.5 text-green-400" />
                  <span>Last logged: {lastLogged}</span>
                </div>
              )}
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                data-ocid="workout.search_input"
                placeholder="Search exercises..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>

            <ScrollArea className="w-full" style={{ height: "52px" }}>
              <div className="flex gap-2 pb-1">
                <button
                  type="button"
                  data-ocid="workout.filter.tab"
                  onClick={() => {
                    setSelectedMuscle("all");
                    setPhase("browse");
                  }}
                  className={`shrink-0 px-3 py-1 rounded-full text-xs font-medium border transition-all ${
                    selectedMuscle === "all"
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:border-muted-foreground"
                  }`}
                >
                  All
                </button>
                {ALL_MUSCLES.map((m) => (
                  <button
                    type="button"
                    key={m}
                    data-ocid={`workout.${m}.tab`}
                    onClick={() => handleSelectMuscle(m)}
                    className={`shrink-0 px-3 py-1 rounded-full text-xs font-medium border transition-all ${
                      selectedMuscle === m
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-muted-foreground hover:border-muted-foreground"
                    }`}
                  >
                    {MUSCLE_LABELS[m]}
                  </button>
                ))}
              </div>
            </ScrollArea>

            <div className="flex flex-col gap-2">
              {filteredExercises.length === 0 ? (
                <div
                  data-ocid="workout.exercise.empty_state"
                  className="text-center py-12 text-muted-foreground"
                >
                  No exercises found
                </div>
              ) : (
                filteredExercises.map((ex, idx) => (
                  <button
                    type="button"
                    key={ex.name}
                    data-ocid={`workout.exercise.item.${idx + 1}`}
                    onClick={() => handleSelectExercise(ex)}
                    className="flex items-center justify-between p-3 rounded-lg border border-border bg-card hover:border-muted-foreground transition-all text-left"
                  >
                    <div>
                      <div className="font-medium text-sm">{ex.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {MUSCLE_LABELS[ex.muscleGroup]}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {ex.isBodyWeight && (
                        <Badge variant="outline" className="text-xs">
                          Bodyweight
                        </Badge>
                      )}
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </div>
                  </button>
                ))
              )}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="log"
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 16 }}
            transition={{ duration: 0.2 }}
            className="p-4"
          >
            <button
              type="button"
              onClick={() =>
                selectedMuscle !== "all"
                  ? setPhase("recommendations")
                  : setPhase("browse")
              }
              className="flex items-center gap-1 text-muted-foreground text-sm mb-4 hover:text-foreground transition-colors"
              data-ocid="workout.back.button"
            >
              ← Back
            </button>

            <div className="bg-card border border-border rounded-xl p-5">
              <div className="mb-6">
                <h2 className="font-display text-xl font-bold">
                  {selectedExercise?.name}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {selectedExercise
                    ? MUSCLE_LABELS[selectedExercise.muscleGroup]
                    : ""}
                </p>
              </div>

              <div className="flex flex-col gap-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs uppercase tracking-wide text-muted-foreground mb-1.5 block">
                      Sets
                    </Label>
                    <Input
                      data-ocid="workout.sets.input"
                      type="number"
                      min="1"
                      value={sets}
                      onChange={(e) => setSets(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label className="text-xs uppercase tracking-wide text-muted-foreground mb-1.5 block">
                      Reps
                    </Label>
                    <Input
                      data-ocid="workout.reps.input"
                      type="number"
                      min="1"
                      value={reps}
                      onChange={(e) => setReps(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                        Weight
                      </Label>
                      {!isBodyWeight && (
                        <UnitToggle
                          options={["kg", "lbs"]}
                          value={weightUnit}
                          onChange={(v) =>
                            handleWeightUnitToggle(
                              v === "kg" ? "metric" : "imperial",
                            )
                          }
                        />
                      )}
                    </div>
                    {selectedExercise?.isBodyWeight && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">
                          Body Weight
                        </span>
                        <Switch
                          data-ocid="workout.bodyweight.switch"
                          checked={isBodyWeight}
                          onCheckedChange={setIsBodyWeight}
                        />
                      </div>
                    )}
                  </div>
                  {isBodyWeight ? (
                    <div className="p-3 rounded-lg bg-secondary border border-border text-sm text-muted-foreground">
                      Using body weight:{" "}
                      {bodyWeightDisplay !== null
                        ? `${bodyWeightDisplay} ${weightUnit}`
                        : "—"}
                    </div>
                  ) : (
                    <div className="relative">
                      <Input
                        data-ocid="workout.weight.input"
                        type="number"
                        min="0"
                        step="0.5"
                        placeholder="0"
                        value={weight}
                        onChange={(e) => setWeight(e.target.value)}
                        className="pr-12"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                        {weightUnit}
                      </span>
                    </div>
                  )}
                </div>

                <Button
                  data-ocid="workout.submit.button"
                  onClick={handleSubmit}
                  disabled={addLogMutation.isPending}
                  className="w-full h-11 font-semibold mt-2"
                  style={{
                    background: "oklch(0.75 0.18 42)",
                    color: "oklch(0.12 0.008 280)",
                  }}
                >
                  {addLogMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />{" "}
                      Logging...
                    </>
                  ) : (
                    "Log Set"
                  )}
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
