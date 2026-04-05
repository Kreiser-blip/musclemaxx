import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { ChevronLeft, ChevronRight, Dumbbell, Loader2 } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import { Gender, Goal } from "../backend.d";
import type { UserProfile } from "../backend.d";
import { useUnitPreference } from "../context/UnitContext";
import { useSaveCallerUserProfile } from "../hooks/useQueries";
import { cmToFtIn, ftInToCm, kgToLbs, lbsToKg, parseFtIn } from "../lib/units";

interface FormData {
  age: string;
  gender: Gender | "";
  heightCm: string;
  weightKg: string;
  bodyFat: string;
  goal: Goal | "";
}

const STEP_TITLES = ["Who are you?", "Your body stats", "Your goal"];

const STEP_SUBTITLES = [
  "Basic info to personalize your experience",
  "Used to calculate your protein needs",
  "We'll tailor your journey around this",
];

const GOAL_OPTIONS = [
  {
    value: Goal.buildMaxMuscle,
    label: "Build Max Muscle",
    desc: "Maximize muscle hypertrophy and size",
  },
  {
    value: Goal.buildLeanMuscle,
    label: "Build Lean Muscle",
    desc: "Gain muscle while minimizing fat",
  },
  {
    value: Goal.recomposition,
    label: "Body Recomposition",
    desc: "Lose fat and gain muscle simultaneously",
  },
] as const;

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

export default function Onboarding() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormData>({
    age: "",
    gender: "",
    heightCm: "",
    weightKg: "",
    bodyFat: "",
    goal: "",
  });
  const [heightDisplay, setHeightDisplay] = useState("");
  const [weightDisplay, setWeightDisplay] = useState("");

  const { unitPreference, setUnitPreference } = useUnitPreference();
  const saveMutation = useSaveCallerUserProfile();

  const totalSteps = 3;
  const progress = ((step + 1) / totalSteps) * 100;

  const canProceedStep0 = form.age !== "" && form.gender !== "";
  const canProceedStep1 =
    form.heightCm !== "" && form.weightKg !== "" && form.bodyFat !== "";
  const canProceedStep2 = form.goal !== "";

  const canProceed = [canProceedStep0, canProceedStep1, canProceedStep2][step];

  const handleHeightChange = (val: string) => {
    setHeightDisplay(val);
    if (unitPreference === "metric") {
      setForm((p) => ({ ...p, heightCm: val }));
    } else {
      const { ft, inches } = parseFtIn(val);
      if (ft > 0 || inches > 0) {
        const cm = ftInToCm(ft, inches);
        setForm((p) => ({ ...p, heightCm: String(cm) }));
      } else {
        setForm((p) => ({ ...p, heightCm: "" }));
      }
    }
  };

  const handleWeightChange = (val: string) => {
    setWeightDisplay(val);
    if (unitPreference === "metric") {
      setForm((p) => ({ ...p, weightKg: val }));
    } else {
      const kg = lbsToKg(Number.parseFloat(val));
      if (!Number.isNaN(kg)) {
        setForm((p) => ({ ...p, weightKg: String(kg) }));
      } else {
        setForm((p) => ({ ...p, weightKg: "" }));
      }
    }
  };

  const handleUnitToggle = (newUnit: string) => {
    const u = newUnit as "metric" | "imperial";
    if (u === unitPreference) return;
    if (u === "imperial") {
      const cm = Number.parseFloat(form.heightCm);
      if (!Number.isNaN(cm) && cm > 0) setHeightDisplay(cmToFtIn(cm));
      const kg = Number.parseFloat(form.weightKg);
      if (!Number.isNaN(kg) && kg > 0) setWeightDisplay(String(kgToLbs(kg)));
    } else {
      if (form.heightCm) setHeightDisplay(form.heightCm);
      if (form.weightKg) setWeightDisplay(form.weightKg);
    }
    setUnitPreference(u);
  };

  const handleSubmit = async () => {
    if (!canProceedStep2 || !form.gender || !form.goal) return;
    const profile: UserProfile = {
      age: BigInt(Number.parseInt(form.age)),
      gender: form.gender as Gender,
      heightCm: Number.parseFloat(form.heightCm),
      weightKg: Number.parseFloat(form.weightKg),
      bodyFat: Number.parseFloat(form.bodyFat),
      goal: form.goal as Goal,
    };
    try {
      await saveMutation.mutateAsync(profile);
      toast.success("Profile saved! Let's get to work.");
    } catch {
      toast.error("Failed to save profile. Please try again.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="flex items-center gap-2 mb-8 justify-center">
          <Dumbbell
            className="w-6 h-6"
            style={{ color: "oklch(0.63 0.24 27)" }}
          />
          <span className="font-display text-xl font-bold">MuscleMaxx</span>
        </div>

        <div className="mb-6">
          <div className="flex justify-between text-xs text-muted-foreground mb-2">
            <span>
              Step {step + 1} of {totalSteps}
            </span>
            <span>{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-1" />
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25 }}
            className="bg-card border border-border rounded-xl p-6 shadow-card"
          >
            <h2 className="font-display text-2xl font-bold mb-1">
              {STEP_TITLES[step]}
            </h2>
            <p className="text-muted-foreground text-sm mb-6">
              {STEP_SUBTITLES[step]}
            </p>

            {step === 0 && (
              <div className="flex flex-col gap-4">
                <div>
                  <Label
                    htmlFor="age"
                    className="text-xs uppercase tracking-wide text-muted-foreground mb-1.5 block"
                  >
                    Age
                  </Label>
                  <Input
                    id="age"
                    data-ocid="onboarding.age.input"
                    type="number"
                    min="13"
                    max="100"
                    placeholder="e.g. 25"
                    value={form.age}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, age: e.target.value }))
                    }
                  />
                </div>
                <div>
                  <Label className="text-xs uppercase tracking-wide text-muted-foreground mb-1.5 block">
                    Gender
                  </Label>
                  <div className="grid grid-cols-2 gap-3">
                    {(
                      [
                        { value: Gender.male, label: "Male" },
                        { value: Gender.female, label: "Female" },
                      ] as const
                    ).map(({ value, label }) => (
                      <button
                        type="button"
                        key={value}
                        data-ocid={`onboarding.gender.${value}.toggle`}
                        onClick={() =>
                          setForm((p) => ({ ...p, gender: value }))
                        }
                        className={`py-3 rounded-lg border font-medium text-sm transition-all ${
                          form.gender === value
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border bg-secondary text-muted-foreground hover:border-muted-foreground"
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {step === 1 && (
              <div className="flex flex-col gap-4">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                      Height
                    </Label>
                    <UnitToggle
                      options={["cm", "ft"]}
                      value={unitPreference === "metric" ? "cm" : "ft"}
                      onChange={(v) =>
                        handleUnitToggle(v === "cm" ? "metric" : "imperial")
                      }
                    />
                  </div>
                  {unitPreference === "metric" ? (
                    <Input
                      data-ocid="onboarding.heightCm.input"
                      type="number"
                      min="0"
                      placeholder="e.g. 178"
                      value={heightDisplay}
                      onChange={(e) => handleHeightChange(e.target.value)}
                    />
                  ) : (
                    <Input
                      data-ocid="onboarding.heightCm.input"
                      type="text"
                      placeholder={"e.g. 5'11"}
                      value={heightDisplay}
                      onChange={(e) => handleHeightChange(e.target.value)}
                    />
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                      Weight
                    </Label>
                    <UnitToggle
                      options={["kg", "lbs"]}
                      value={unitPreference === "metric" ? "kg" : "lbs"}
                      onChange={(v) =>
                        handleUnitToggle(v === "kg" ? "metric" : "imperial")
                      }
                    />
                  </div>
                  <Input
                    data-ocid="onboarding.weightKg.input"
                    type="number"
                    min="0"
                    placeholder={
                      unitPreference === "metric" ? "e.g. 80" : "e.g. 176"
                    }
                    value={weightDisplay}
                    onChange={(e) => handleWeightChange(e.target.value)}
                  />
                </div>

                <div>
                  <Label className="text-xs uppercase tracking-wide text-muted-foreground mb-1.5 block">
                    Body Fat{" "}
                    <span className="text-muted-foreground/60">(%)</span>
                  </Label>
                  <Input
                    data-ocid="onboarding.bodyFat.input"
                    type="number"
                    min="0"
                    placeholder="e.g. 15"
                    value={form.bodyFat}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, bodyFat: e.target.value }))
                    }
                  />
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="flex flex-col gap-3">
                {GOAL_OPTIONS.map(({ value, label, desc }) => (
                  <button
                    type="button"
                    key={value}
                    data-ocid={`onboarding.goal.${value}.toggle`}
                    onClick={() => setForm((p) => ({ ...p, goal: value }))}
                    className={`text-left p-4 rounded-lg border transition-all ${
                      form.goal === value
                        ? "border-primary bg-primary/10"
                        : "border-border bg-secondary hover:border-muted-foreground"
                    }`}
                  >
                    <div
                      className={`font-semibold text-sm ${
                        form.goal === value ? "text-primary" : "text-foreground"
                      }`}
                    >
                      {label}
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {desc}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        <div className="flex gap-3 mt-4">
          {step > 0 && (
            <Button
              variant="outline"
              onClick={() => setStep((s) => s - 1)}
              className="flex-1"
              data-ocid="onboarding.back.button"
            >
              <ChevronLeft className="w-4 h-4 mr-1" /> Back
            </Button>
          )}
          {step < totalSteps - 1 ? (
            <Button
              onClick={() => setStep((s) => s + 1)}
              disabled={!canProceed}
              className="flex-1"
              data-ocid="onboarding.next.button"
              style={{
                background: "oklch(0.63 0.24 27)",
                color: "oklch(0.12 0.008 280)",
              }}
            >
              Next <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={!canProceed || saveMutation.isPending}
              className="flex-1"
              data-ocid="onboarding.submit.button"
              style={{
                background: "oklch(0.63 0.24 27)",
                color: "oklch(0.12 0.008 280)",
              }}
            >
              {saveMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
                </>
              ) : (
                <>
                  Start Training <ChevronRight className="w-4 h-4 ml-1" />
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
