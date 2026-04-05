import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { EXERCISES_BY_MUSCLE } from "@/lib/exercises";
import {
  AlertTriangle,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Loader2,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { MuscleGroup } from "../backend.d";
import type { InjuryLog } from "../backend.d";
import {
  useAddInjuryLog,
  useDeleteInjuryLog,
  useGetInjuryLogs,
  useResolveInjuryLog,
} from "../hooks/useQueries";

// --- Types ---
type Severity = "severe" | "moderate" | "mild";

type BodyArea =
  | MuscleGroup
  | "wrist"
  | "knee"
  | "shoulder_joint"
  | "elbow"
  | "ankle"
  | "hip"
  | "lower_back";

type CommonInjury = {
  name: string;
  description: string;
  severity: Severity;
};

// --- Maps ---
const MUSCLE_LABELS: Record<MuscleGroup, string> = {
  [MuscleGroup.abs]: "Abs",
  [MuscleGroup.traps]: "Traps",
  [MuscleGroup.triceps]: "Triceps",
  [MuscleGroup.shoulders]: "Shoulders",
  [MuscleGroup.back]: "Back",
  [MuscleGroup.chest]: "Chest",
  [MuscleGroup.lats]: "Lats",
  [MuscleGroup.neck]: "Neck",
  [MuscleGroup.hamstrings]: "Hamstrings",
  [MuscleGroup.quadriceps]: "Quadriceps",
  [MuscleGroup.glutes]: "Glutes",
  [MuscleGroup.calves]: "Calves",
  [MuscleGroup.forearms]: "Forearms",
  [MuscleGroup.biceps]: "Biceps",
};

const JOINT_LABELS: Record<string, string> = {
  wrist: "Wrist",
  knee: "Knee",
  shoulder_joint: "Shoulder Joint",
  elbow: "Elbow",
  ankle: "Ankle",
  hip: "Hip",
  lower_back: "Lower Back",
};

// Map joint areas to the closest muscle group for backend storage
const JOINT_TO_MUSCLE: Record<string, MuscleGroup> = {
  wrist: MuscleGroup.forearms,
  knee: MuscleGroup.quadriceps,
  shoulder_joint: MuscleGroup.shoulders,
  elbow: MuscleGroup.biceps,
  ankle: MuscleGroup.calves,
  hip: MuscleGroup.glutes,
  lower_back: MuscleGroup.back,
};

function getAreaLabel(area: BodyArea): string {
  if (area in MUSCLE_LABELS) return MUSCLE_LABELS[area as MuscleGroup];
  return JOINT_LABELS[area] ?? area;
}

// --- Common injuries by area ---
const COMMON_INJURIES: Partial<Record<BodyArea, CommonInjury[]>> = {
  wrist: [
    {
      name: "Wrist Sprain",
      description:
        "Wrist sprain — pain and swelling around the wrist joint after a twist or fall.",
      severity: "moderate",
    },
    {
      name: "Carpal Tunnel Syndrome",
      description:
        "Carpal tunnel syndrome — numbness and tingling in the hand and wrist from nerve compression.",
      severity: "moderate",
    },
    {
      name: "Tendinitis",
      description:
        "Wrist tendinitis — aching pain and tenderness along the tendons of the wrist.",
      severity: "mild",
    },
    {
      name: "De Quervain's",
      description:
        "De Quervain's tenosynovitis — painful inflammation of tendons on the thumb side of the wrist.",
      severity: "moderate",
    },
  ],
  knee: [
    {
      name: "Meniscus Tear",
      description:
        "Meniscus tear — sharp pain and swelling in the knee, often with a popping sensation.",
      severity: "severe",
    },
    {
      name: "Runner's Knee",
      description:
        "Runner's knee (patellofemoral pain) — aching pain around or behind the kneecap.",
      severity: "moderate",
    },
    {
      name: "ACL Strain",
      description:
        "ACL strain — instability and pain in the knee, may have felt a pop during injury.",
      severity: "severe",
    },
    {
      name: "Patellar Tendinitis",
      description:
        "Patellar tendinitis — throbbing pain just below the kneecap, especially when jumping.",
      severity: "moderate",
    },
    {
      name: "IT Band Syndrome",
      description:
        "IT band syndrome — sharp or burning pain on the outer side of the knee.",
      severity: "mild",
    },
  ],
  shoulder_joint: [
    {
      name: "Rotator Cuff Strain",
      description:
        "Rotator cuff strain — aching pain deep in the shoulder, worse when lifting the arm.",
      severity: "moderate",
    },
    {
      name: "Shoulder Impingement",
      description:
        "Shoulder impingement — painful pinching in the shoulder when raising the arm above shoulder height.",
      severity: "moderate",
    },
    {
      name: "Shoulder Dislocation",
      description:
        "Shoulder dislocation — severe pain and inability to move the arm, shoulder appears out of place.",
      severity: "severe",
    },
    {
      name: "Labrum Tear",
      description:
        "Labrum tear — deep shoulder pain and instability, often with a snapping sensation.",
      severity: "severe",
    },
    {
      name: "Bursitis",
      description:
        "Shoulder bursitis — inflammation and aching around the shoulder joint.",
      severity: "mild",
    },
  ],
  elbow: [
    {
      name: "Tennis Elbow",
      description:
        "Tennis elbow (lateral epicondylitis) — aching pain on the outer side of the elbow when gripping.",
      severity: "mild",
    },
    {
      name: "Golfer's Elbow",
      description:
        "Golfer's elbow (medial epicondylitis) — painful tenderness on the inner side of the elbow.",
      severity: "mild",
    },
    {
      name: "Elbow Bursitis",
      description:
        "Elbow bursitis — swelling and inflammation at the tip of the elbow.",
      severity: "mild",
    },
    {
      name: "UCL Sprain",
      description:
        "UCL sprain — inner elbow pain and instability, especially during throwing motions.",
      severity: "moderate",
    },
  ],
  ankle: [
    {
      name: "Ankle Sprain",
      description: "Ankle sprain — pain and swelling after rolling the ankle.",
      severity: "moderate",
    },
    {
      name: "Achilles Tendinitis",
      description:
        "Achilles tendinitis — aching and stiffness along the back of the ankle and lower leg.",
      severity: "moderate",
    },
    {
      name: "Achilles Tear",
      description:
        "Achilles tendon tear — sudden sharp pain and inability to push off the foot.",
      severity: "severe",
    },
    {
      name: "Plantar Fasciitis",
      description:
        "Plantar fasciitis — sharp heel pain, especially with the first steps in the morning.",
      severity: "mild",
    },
  ],
  hip: [
    {
      name: "Hip Flexor Strain",
      description:
        "Hip flexor strain — sharp or aching pain at the front of the hip when lifting the leg.",
      severity: "moderate",
    },
    {
      name: "Hip Bursitis",
      description:
        "Hip bursitis — aching pain on the outer side of the hip, tender to the touch.",
      severity: "mild",
    },
    {
      name: "Hip Labrum Tear",
      description:
        "Hip labrum tear — deep hip pain with clicking or locking sensations.",
      severity: "severe",
    },
    {
      name: "Groin Pull",
      description:
        "Groin pull — pain and tightness along the inner thigh and groin area.",
      severity: "moderate",
    },
  ],
  lower_back: [
    {
      name: "Muscle Strain",
      description:
        "Lower back muscle strain — aching tightness and pain in the lower back after lifting or sudden movement.",
      severity: "moderate",
    },
    {
      name: "Herniated Disc",
      description:
        "Herniated disc — sharp back pain that may radiate down the leg, with possible numbness.",
      severity: "severe",
    },
    {
      name: "Sciatica",
      description:
        "Sciatica — radiating pain from the lower back down one leg, sometimes with numbness.",
      severity: "moderate",
    },
    {
      name: "Lumbar Sprain",
      description:
        "Lumbar sprain — sudden sharp lower back pain from overstretching.",
      severity: "moderate",
    },
  ],
  [MuscleGroup.shoulders]: [
    {
      name: "Rotator Cuff Strain",
      description:
        "Rotator cuff strain — aching pain deep in the shoulder muscle, worse when lifting.",
      severity: "moderate",
    },
    {
      name: "Muscle Tear",
      description:
        "Shoulder muscle tear — sudden sharp pain and weakness in the shoulder.",
      severity: "severe",
    },
    {
      name: "DOMS",
      description:
        "Delayed onset muscle soreness — general aching and stiffness in the shoulder muscles after intense exercise.",
      severity: "mild",
    },
  ],
  [MuscleGroup.chest]: [
    {
      name: "Pec Strain",
      description:
        "Pectoral strain — pain in the chest muscle during pressing movements.",
      severity: "moderate",
    },
    {
      name: "Pec Tear",
      description:
        "Pectoral tear — sudden sharp pain with a snapping sensation in the chest.",
      severity: "severe",
    },
    {
      name: "DOMS",
      description:
        "Delayed onset muscle soreness — aching chest muscles after heavy pressing.",
      severity: "mild",
    },
  ],
  [MuscleGroup.back]: [
    {
      name: "Muscle Strain",
      description:
        "Back muscle strain — tightness and pain in the upper or mid back.",
      severity: "moderate",
    },
    {
      name: "Spasm",
      description:
        "Back muscle spasm — sudden painful tightening in the back muscles.",
      severity: "moderate",
    },
  ],
  [MuscleGroup.biceps]: [
    {
      name: "Bicep Strain",
      description:
        "Bicep strain — pain and tenderness in the bicep muscle during curling.",
      severity: "moderate",
    },
    {
      name: "Bicep Tendon Tear",
      description:
        "Bicep tendon tear — sudden pop and pain at the elbow or shoulder end of the bicep.",
      severity: "severe",
    },
  ],
  [MuscleGroup.triceps]: [
    {
      name: "Tricep Strain",
      description:
        "Tricep strain — aching pain in the back of the arm during extension exercises.",
      severity: "moderate",
    },
  ],
  [MuscleGroup.quadriceps]: [
    {
      name: "Quad Strain",
      description:
        "Quadricep strain — pain and tightness in the front thigh muscle.",
      severity: "moderate",
    },
    {
      name: "Quad Contusion",
      description:
        "Quad contusion — direct impact bruising causing pain and swelling in the thigh.",
      severity: "mild",
    },
  ],
  [MuscleGroup.hamstrings]: [
    {
      name: "Hamstring Strain",
      description:
        "Hamstring strain — sudden sharp pain in the back of the thigh.",
      severity: "moderate",
    },
    {
      name: "Hamstring Tear",
      description:
        "Hamstring tear — severe pain and inability to extend the leg.",
      severity: "severe",
    },
  ],
  [MuscleGroup.calves]: [
    {
      name: "Calf Strain",
      description:
        "Calf strain — sudden sharp pain in the calf muscle, like being struck.",
      severity: "moderate",
    },
    {
      name: "Calf Cramp",
      description:
        "Calf cramp — sudden painful involuntary contraction of the calf muscle.",
      severity: "mild",
    },
  ],
  [MuscleGroup.glutes]: [
    {
      name: "Glute Strain",
      description: "Gluteal strain — deep aching pain in the buttock area.",
      severity: "moderate",
    },
    {
      name: "Piriformis Syndrome",
      description:
        "Piriformis syndrome — deep pain in the glute that may radiate down the leg.",
      severity: "moderate",
    },
  ],
  [MuscleGroup.forearms]: [
    {
      name: "Forearm Strain",
      description:
        "Forearm muscle strain — aching tightness in the forearm muscles.",
      severity: "mild",
    },
    {
      name: "Tendinitis",
      description:
        "Forearm tendinitis — pain and inflammation along the forearm tendons.",
      severity: "mild",
    },
  ],
};

// --- Severity helpers ---
const SEVERE_KEYWORDS = [
  "sharp",
  "pop",
  "popping",
  "snap",
  "swelling",
  "can't move",
  "cannot move",
  "numbness",
  "torn",
  "fracture",
  "break",
  "dislocated",
  "radiating",
  "instability",
];
const MODERATE_KEYWORDS = [
  "ache",
  "aching",
  "painful",
  "hurts",
  "hurt",
  "inflamed",
  "inflammation",
  "tender",
  "throbbing",
  "pinching",
];

function getSeverity(description: string, preset?: Severity): Severity {
  if (preset) return preset;
  const lower = description.toLowerCase();
  if (SEVERE_KEYWORDS.some((kw) => lower.includes(kw))) return "severe";
  if (MODERATE_KEYWORDS.some((kw) => lower.includes(kw))) return "moderate";
  return "mild";
}

function getLighterExercises(muscleGroup: MuscleGroup) {
  const exercises = EXERCISES_BY_MUSCLE[muscleGroup] ?? [];
  const bodyWeight = exercises.filter((e) => e.isBodyWeight);
  if (bodyWeight.length > 0) return bodyWeight;
  return exercises.slice(0, 2);
}

function formatDate(nanoseconds: bigint): string {
  const ms = Number(nanoseconds / BigInt(1_000_000));
  return new Date(ms).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function SeverityBadge({ severity }: { severity: Severity }) {
  if (severity === "severe") {
    return (
      <Badge
        className="text-xs font-semibold"
        style={{ background: "oklch(0.40 0.20 27)", color: "oklch(0.95 0 0)" }}
      >
        Severe
      </Badge>
    );
  }
  if (severity === "moderate") {
    return (
      <Badge
        className="text-xs font-semibold"
        style={{ background: "oklch(0.65 0.18 65)", color: "oklch(0.10 0 0)" }}
      >
        Moderate
      </Badge>
    );
  }
  return (
    <Badge
      className="text-xs font-semibold"
      style={{ background: "oklch(0.55 0.15 145)", color: "oklch(0.95 0 0)" }}
    >
      Mild
    </Badge>
  );
}

function InjuryCard({ injury }: { injury: InjuryLog }) {
  const resolve = useResolveInjuryLog();
  const del = useDeleteInjuryLog();
  const severity = getSeverity(injury.description);
  const lighterExercises = getLighterExercises(injury.muscleGroup);

  // Try to detect if injury description starts with a joint label to display correct area
  const areaLabel = MUSCLE_LABELS[injury.muscleGroup];

  return (
    <Card
      data-ocid="injuries.item.1"
      className="border-border bg-card overflow-hidden"
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-col gap-1.5">
            <CardTitle className="text-base font-semibold">
              {areaLabel}
            </CardTitle>
            <div className="flex items-center gap-2 flex-wrap">
              <SeverityBadge severity={severity} />
              <Badge
                variant={injury.isResolved ? "outline" : "secondary"}
                className="text-xs"
              >
                {injury.isResolved ? "Resolved" : "Active"}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {formatDate(injury.dateOfInjury)}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {!injury.isResolved && (
              <Button
                data-ocid="injuries.resolve.button"
                size="sm"
                variant="outline"
                className="h-7 text-xs gap-1"
                onClick={() =>
                  resolve.mutate(injury.id, {
                    onSuccess: () => toast.success("Injury marked as resolved"),
                    onError: () => toast.error("Failed to resolve injury"),
                  })
                }
                disabled={resolve.isPending}
              >
                {resolve.isPending ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <CheckCircle className="w-3 h-3" />
                )}
                Resolved
              </Button>
            )}
            <Button
              data-ocid="injuries.delete_button"
              size="sm"
              variant="ghost"
              className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
              onClick={() =>
                del.mutate(injury.id, {
                  onSuccess: () => toast.success("Injury log deleted"),
                  onError: () => toast.error("Failed to delete injury"),
                })
              }
              disabled={del.isPending}
            >
              {del.isPending ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <Trash2 className="w-3 h-3" />
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0 flex flex-col gap-3">
        <p className="text-sm text-muted-foreground leading-relaxed">
          {injury.description}
        </p>

        {severity === "severe" && (
          <div
            data-ocid="injuries.error_state"
            className="flex items-start gap-2 rounded-md p-3 text-sm"
            style={{
              background: "oklch(0.18 0.06 27)",
              border: "1px solid oklch(0.40 0.20 27)",
              color: "oklch(0.85 0.08 27)",
            }}
          >
            <AlertTriangle
              className="w-4 h-4 mt-0.5 shrink-0"
              style={{ color: "oklch(0.63 0.24 27)" }}
            />
            <span>
              This may be a serious injury. We strongly recommend consulting a
              medical professional before continuing to exercise.
            </span>
          </div>
        )}

        {!injury.isResolved && lighterExercises.length > 0 && (
          <div className="flex flex-col gap-1.5">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Lighter exercises for {areaLabel}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {lighterExercises.map((ex) => (
                <span
                  key={ex.name}
                  className="text-xs px-2.5 py-1 rounded-full border border-border bg-secondary text-secondary-foreground"
                >
                  {ex.name}
                </span>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// --- Common Injury Picker ---
function CommonInjuryPicker({
  area,
  onSelect,
}: {
  area: BodyArea;
  onSelect: (injury: CommonInjury) => void;
}) {
  const [open, setOpen] = useState(false);
  const injuries = COMMON_INJURIES[area];
  if (!injuries || injuries.length === 0) return null;

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors"
        onClick={() => setOpen((p) => !p)}
      >
        <span>Common injuries for {getAreaLabel(area)}</span>
        {open ? (
          <ChevronUp className="w-3 h-3" />
        ) : (
          <ChevronDown className="w-3 h-3" />
        )}
      </button>
      {open && (
        <div
          className="flex flex-col gap-1.5 pr-1"
          style={{
            height: "calc(4 * 2.6rem)",
            overflowY: "auto",
            WebkitOverflowScrolling: "touch",
            overscrollBehavior: "contain",
          }}
        >
          {injuries.map((inj) => (
            <button
              key={inj.name}
              type="button"
              onClick={() => {
                onSelect(inj);
                setOpen(false);
              }}
              className="flex items-center justify-between text-left px-3 py-2 rounded-md border border-border bg-secondary hover:bg-secondary/70 transition-colors gap-3"
            >
              <span className="text-sm font-medium">{inj.name}</span>
              <SeverityBadge severity={inj.severity} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// --- Main page ---
export default function Injuries() {
  const { data: injuries = [], isLoading } = useGetInjuryLogs();
  const addInjury = useAddInjuryLog();

  const [area, setArea] = useState<BodyArea | "">("");
  const [date, setDate] = useState("");
  const [description, setDescription] = useState("");
  const [presetSeverity, setPresetSeverity] = useState<Severity | undefined>();

  const handleSelectCommon = (inj: CommonInjury) => {
    setDescription(inj.description);
    setPresetSeverity(inj.severity);
  };

  const getMuscleGroup = (a: BodyArea): MuscleGroup => {
    if (a in JOINT_TO_MUSCLE) return JOINT_TO_MUSCLE[a];
    return a as MuscleGroup;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!area || !date) return;

    const muscleGroup = getMuscleGroup(area);
    const dateMs = new Date(date).getTime();
    const dateNs = BigInt(dateMs) * BigInt(1_000_000);
    const desc = description.trim() || `${getAreaLabel(area)} injury logged.`;

    addInjury.mutate(
      { muscleGroup, dateOfInjury: dateNs, description: desc },
      {
        onSuccess: () => {
          toast.success("Injury logged");
          setArea("");
          setDate("");
          setDescription("");
          setPresetSeverity(undefined);
        },
        onError: () => toast.error("Failed to log injury"),
      },
    );
  };

  const active = injuries.filter((i) => !i.isResolved);
  const resolved = injuries.filter((i) => i.isResolved);

  const MUSCLE_SECTION: { label: string; value: MuscleGroup }[] = [
    { label: "Abs", value: MuscleGroup.abs },
    { label: "Back", value: MuscleGroup.back },
    { label: "Biceps", value: MuscleGroup.biceps },
    { label: "Calves", value: MuscleGroup.calves },
    { label: "Chest", value: MuscleGroup.chest },
    { label: "Forearms", value: MuscleGroup.forearms },
    { label: "Glutes", value: MuscleGroup.glutes },
    { label: "Hamstrings", value: MuscleGroup.hamstrings },
    { label: "Lats", value: MuscleGroup.lats },
    { label: "Neck", value: MuscleGroup.neck },
    { label: "Quadriceps", value: MuscleGroup.quadriceps },
    { label: "Shoulders", value: MuscleGroup.shoulders },
    { label: "Traps", value: MuscleGroup.traps },
    { label: "Triceps", value: MuscleGroup.triceps },
  ];

  const JOINT_SECTION: { label: string; value: string }[] = [
    { label: "Ankle", value: "ankle" },
    { label: "Elbow", value: "elbow" },
    { label: "Hip", value: "hip" },
    { label: "Knee", value: "knee" },
    { label: "Lower Back", value: "lower_back" },
    { label: "Shoulder Joint", value: "shoulder_joint" },
    { label: "Wrist", value: "wrist" },
  ];

  return (
    <div className="flex flex-col gap-6 px-4 py-6 pb-24 max-w-lg mx-auto">
      {/* Header */}
      <div>
        <h1 className="font-display text-2xl font-bold">Injuries</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Track and monitor your injuries to train smarter.
        </p>
      </div>

      {/* Log Form */}
      <Card className="border-border bg-card" data-ocid="injuries.panel">
        <CardHeader className="pb-4">
          <CardTitle className="text-base">Log an Injury</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Area / muscle selector */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="area-select" className="text-sm">
                Body Area / Muscle
              </Label>
              <Select
                value={area}
                onValueChange={(v) => {
                  setArea(v as BodyArea);
                  setDescription("");
                  setPresetSeverity(undefined);
                }}
              >
                <SelectTrigger
                  id="area-select"
                  data-ocid="injuries.select"
                  className="w-full"
                >
                  <SelectValue placeholder="Select area..." />
                </SelectTrigger>
                <SelectContent position="item-aligned" className="max-h-60">
                  <SelectItem
                    value="__disabled_joints"
                    disabled
                    className="text-xs font-semibold text-muted-foreground uppercase tracking-wider py-1 pointer-events-none"
                  >
                    — Joints &amp; Areas —
                  </SelectItem>
                  {JOINT_SECTION.map((j) => (
                    <SelectItem key={j.value} value={j.value}>
                      {j.label}
                    </SelectItem>
                  ))}
                  <SelectItem
                    value="__disabled_muscles"
                    disabled
                    className="text-xs font-semibold text-muted-foreground uppercase tracking-wider py-1 pointer-events-none"
                  >
                    — Muscle Groups —
                  </SelectItem>
                  {MUSCLE_SECTION.map((m) => (
                    <SelectItem key={m.value} value={m.value}>
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Common injuries for selected area */}
            {(area as string) !== "" && (
              <CommonInjuryPicker
                area={area as BodyArea}
                onSelect={handleSelectCommon}
              />
            )}

            {/* Date */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="injury-date" className="text-sm">
                Date of Injury
              </Label>
              <input
                id="injury-date"
                data-ocid="injuries.input"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                max={new Date().toISOString().split("T")[0]}
                className="flex h-9 w-full rounded-md border border-input bg-input px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>

            {/* Description (optional) */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="injury-desc" className="text-sm">
                Description{" "}
                <span className="text-muted-foreground font-normal">
                  (optional)
                </span>
              </Label>
              <Textarea
                id="injury-desc"
                data-ocid="injuries.textarea"
                value={description}
                onChange={(e) => {
                  setDescription(e.target.value);
                  setPresetSeverity(undefined);
                }}
                placeholder="Describe what happened, what it feels like..."
                rows={3}
                className="resize-none"
              />
              {presetSeverity && (
                <p className="text-xs text-muted-foreground">
                  Pre-filled from common injury. You can edit the description.
                </p>
              )}
            </div>

            <Button
              type="submit"
              data-ocid="injuries.submit_button"
              disabled={!area || !date || addInjury.isPending}
              className="w-full"
              style={{
                background: "oklch(0.63 0.24 27)",
                color: "oklch(0.98 0 0)",
              }}
            >
              {addInjury.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : null}
              {addInjury.isPending ? "Logging..." : "Log Injury"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Active injuries */}
      {isLoading ? (
        <div
          data-ocid="injuries.loading_state"
          className="flex justify-center py-8"
        >
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          {active.length > 0 && (
            <div className="flex flex-col gap-3">
              <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Active ({active.length})
              </h2>
              {active.map((injury) => (
                <InjuryCard key={String(injury.id)} injury={injury} />
              ))}
            </div>
          )}
          {resolved.length > 0 && (
            <div className="flex flex-col gap-3">
              <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Resolved ({resolved.length})
              </h2>
              {resolved.map((injury) => (
                <InjuryCard key={String(injury.id)} injury={injury} />
              ))}
            </div>
          )}
          {injuries.length === 0 && (
            <div
              data-ocid="injuries.empty_state"
              className="flex flex-col items-center gap-2 py-12 text-center"
            >
              <CheckCircle className="w-10 h-10 text-muted-foreground opacity-40" />
              <p className="text-sm text-muted-foreground">
                No injuries logged. Stay strong!
              </p>
            </div>
          )}
        </>
      )}

      <footer className="text-center text-xs text-muted-foreground pt-4">
        © {new Date().getFullYear()}. Built with ❤️ using{" "}
        <a
          href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
          target="_blank"
          rel="noreferrer"
          className="underline underline-offset-2 hover:text-foreground transition-colors"
        >
          caffeine.ai
        </a>
      </footer>
    </div>
  );
}
