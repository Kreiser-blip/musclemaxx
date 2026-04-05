import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, LogOut } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Gender, Goal } from "../backend.d";
import type { UserProfile } from "../backend.d";
import { useUnitPreference } from "../context/UnitContext";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  useGetCallerUserProfile,
  useSaveCallerUserProfile,
} from "../hooks/useQueries";
import { cmToFtIn, ftInToCm, kgToLbs, lbsToKg, parseFtIn } from "../lib/units";

const GOAL_OPTIONS = [
  { value: Goal.buildMaxMuscle, label: "Build Max Muscle" },
  { value: Goal.buildLeanMuscle, label: "Build Lean Muscle" },
  { value: Goal.recomposition, label: "Body Recomposition" },
] as const;

const SKELETON_KEYS = ["a", "b", "c", "d", "e"];

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

export default function Profile() {
  const { data: profile, isLoading } = useGetCallerUserProfile();
  const saveMutation = useSaveCallerUserProfile();
  const { clear, identity } = useInternetIdentity();
  const qc = useQueryClient();
  const { unitPreference, setUnitPreference } = useUnitPreference();

  const [form, setForm] = useState<{
    age: string;
    gender: Gender;
    heightCm: string;
    weightKg: string;
    bodyFat: string;
    goal: Goal;
  } | null>(null);

  // Display values in user's preferred unit
  const [heightDisplay, setHeightDisplay] = useState("");
  const [weightDisplay, setWeightDisplay] = useState("");

  useEffect(() => {
    if (profile && !form) {
      const f = {
        age: String(profile.age),
        gender: profile.gender,
        heightCm: String(profile.heightCm),
        weightKg: String(profile.weightKg),
        bodyFat: String(profile.bodyFat),
        goal: profile.goal,
      };
      setForm(f);
      // Set display values based on current unit preference
      if (unitPreference === "imperial") {
        setHeightDisplay(cmToFtIn(profile.heightCm));
        setWeightDisplay(String(kgToLbs(profile.weightKg)));
      } else {
        setHeightDisplay(String(profile.heightCm));
        setWeightDisplay(String(profile.weightKg));
      }
    }
  }, [profile, form, unitPreference]);

  const handleHeightChange = (val: string) => {
    setHeightDisplay(val);
    if (unitPreference === "metric") {
      setForm((p) => (p ? { ...p, heightCm: val } : p));
    } else {
      const { ft, inches } = parseFtIn(val);
      if (ft > 0 || inches > 0) {
        const cm = ftInToCm(ft, inches);
        setForm((p) => (p ? { ...p, heightCm: String(cm) } : p));
      }
    }
  };

  const handleWeightChange = (val: string) => {
    setWeightDisplay(val);
    if (unitPreference === "metric") {
      setForm((p) => (p ? { ...p, weightKg: val } : p));
    } else {
      const kg = lbsToKg(Number.parseFloat(val));
      if (!Number.isNaN(kg)) {
        setForm((p) => (p ? { ...p, weightKg: String(kg) } : p));
      }
    }
  };

  const handleUnitToggle = (field: "height" | "weight", newUnit: string) => {
    const u = newUnit as "metric" | "imperial";
    if (u === unitPreference) return;

    if (field === "height") {
      if (u === "imperial" && form?.heightCm) {
        setHeightDisplay(cmToFtIn(Number.parseFloat(form.heightCm)));
      } else if (u === "metric" && form?.heightCm) {
        setHeightDisplay(form.heightCm);
      }
    } else {
      if (u === "imperial" && form?.weightKg) {
        setWeightDisplay(String(kgToLbs(Number.parseFloat(form.weightKg))));
      } else if (u === "metric" && form?.weightKg) {
        setWeightDisplay(form.weightKg);
      }
    }
    setUnitPreference(u);
  };

  const handleSave = async () => {
    if (!form) return;
    const updated: UserProfile = {
      age: BigInt(Number.parseInt(form.age)),
      gender: form.gender,
      heightCm: Number.parseFloat(form.heightCm),
      weightKg: Number.parseFloat(form.weightKg),
      bodyFat: Number.parseFloat(form.bodyFat),
      goal: form.goal,
    };
    try {
      await saveMutation.mutateAsync(updated);
      toast.success("Profile updated!");
    } catch {
      toast.error("Failed to update profile.");
    }
  };

  const handleLogout = async () => {
    await clear();
    qc.clear();
  };

  if (isLoading) {
    return (
      <div className="p-4" data-ocid="profile.loading_state">
        <Skeleton className="h-8 w-40 mb-6" />
        {SKELETON_KEYS.map((k) => (
          <Skeleton key={k} className="h-12 w-full mb-3 rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="p-4 pb-8"
    >
      <div className="mb-6">
        <h2 className="font-display text-2xl font-bold mb-1">Profile</h2>
        {identity && (
          <p className="text-muted-foreground text-xs font-mono truncate">
            {identity.getPrincipal().toString().slice(0, 20)}...
          </p>
        )}
      </div>

      {form && (
        <div className="flex flex-col gap-4">
          <div className="bg-card border border-border rounded-xl p-5">
            <h3 className="font-display font-semibold text-sm mb-4 text-muted-foreground uppercase tracking-wide">
              Personal Info
            </h3>
            <div className="flex flex-col gap-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs uppercase tracking-wide text-muted-foreground mb-1.5 block">
                    Age
                  </Label>
                  <Input
                    data-ocid="profile.age.input"
                    type="number"
                    value={form.age}
                    onChange={(e) =>
                      setForm((p) => (p ? { ...p, age: e.target.value } : p))
                    }
                  />
                </div>
                <div>
                  <Label className="text-xs uppercase tracking-wide text-muted-foreground mb-1.5 block">
                    Body Fat %
                  </Label>
                  <Input
                    data-ocid="profile.bodyfat.input"
                    type="number"
                    value={form.bodyFat}
                    onChange={(e) =>
                      setForm((p) =>
                        p ? { ...p, bodyFat: e.target.value } : p,
                      )
                    }
                  />
                </div>
              </div>

              {/* Height */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                    Height
                  </Label>
                  <UnitToggle
                    options={["cm", "ft"]}
                    value={unitPreference === "metric" ? "cm" : "ft"}
                    onChange={(v) =>
                      handleUnitToggle(
                        "height",
                        v === "cm" ? "metric" : "imperial",
                      )
                    }
                  />
                </div>
                <Input
                  data-ocid="profile.height.input"
                  type={unitPreference === "metric" ? "number" : "text"}
                  placeholder={
                    unitPreference === "metric" ? "e.g. 178" : "e.g. 5'11"
                  }
                  value={heightDisplay}
                  onChange={(e) => handleHeightChange(e.target.value)}
                />
              </div>

              {/* Weight */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                    Weight
                  </Label>
                  <UnitToggle
                    options={["kg", "lbs"]}
                    value={unitPreference === "metric" ? "kg" : "lbs"}
                    onChange={(v) =>
                      handleUnitToggle(
                        "weight",
                        v === "kg" ? "metric" : "imperial",
                      )
                    }
                  />
                </div>
                <Input
                  data-ocid="profile.weight.input"
                  type="number"
                  placeholder={
                    unitPreference === "metric" ? "e.g. 80" : "e.g. 176"
                  }
                  value={weightDisplay}
                  onChange={(e) => handleWeightChange(e.target.value)}
                />
              </div>

              <div>
                <Label className="text-xs uppercase tracking-wide text-muted-foreground mb-1.5 block">
                  Gender
                </Label>
                <div className="grid grid-cols-2 gap-2">
                  {(
                    [
                      { value: Gender.male, label: "Male" },
                      { value: Gender.female, label: "Female" },
                    ] as const
                  ).map(({ value, label }) => (
                    <button
                      type="button"
                      key={value}
                      data-ocid={`profile.gender.${value}.toggle`}
                      onClick={() =>
                        setForm((p) => (p ? { ...p, gender: value } : p))
                      }
                      className={`py-2.5 rounded-lg border text-sm font-medium transition-all ${
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
          </div>

          <div className="bg-card border border-border rounded-xl p-5">
            <h3 className="font-display font-semibold text-sm mb-4 text-muted-foreground uppercase tracking-wide">
              Training Goal
            </h3>
            <div className="flex flex-col gap-2">
              {GOAL_OPTIONS.map(({ value, label }) => (
                <button
                  type="button"
                  key={value}
                  data-ocid={`profile.goal.${value}.toggle`}
                  onClick={() =>
                    setForm((p) => (p ? { ...p, goal: value } : p))
                  }
                  className={`text-left p-3 rounded-lg border text-sm font-medium transition-all ${
                    form.goal === value
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:border-muted-foreground"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <Button
            data-ocid="profile.save.button"
            onClick={handleSave}
            disabled={saveMutation.isPending}
            className="w-full h-11 font-semibold"
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
              "Save Changes"
            )}
          </Button>

          <Button
            data-ocid="profile.logout.button"
            variant="outline"
            onClick={handleLogout}
            className="w-full h-11"
          >
            <LogOut className="w-4 h-4 mr-2" /> Logout
          </Button>
        </div>
      )}
    </motion.div>
  );
}
