import { MuscleGroup } from "../backend.d";

export interface Exercise {
  name: string;
  muscleGroup: MuscleGroup;
  isBodyWeight: boolean;
}

export const EXERCISES: Exercise[] = [
  // Chest
  { name: "Bench Press", muscleGroup: MuscleGroup.chest, isBodyWeight: false },
  {
    name: "Incline Bench Press",
    muscleGroup: MuscleGroup.chest,
    isBodyWeight: false,
  },
  {
    name: "Decline Bench Press",
    muscleGroup: MuscleGroup.chest,
    isBodyWeight: false,
  },
  {
    name: "Dumbbell Flye",
    muscleGroup: MuscleGroup.chest,
    isBodyWeight: false,
  },
  {
    name: "Cable Crossover",
    muscleGroup: MuscleGroup.chest,
    isBodyWeight: false,
  },
  { name: "Push-Up", muscleGroup: MuscleGroup.chest, isBodyWeight: true },
  { name: "Chest Dip", muscleGroup: MuscleGroup.chest, isBodyWeight: true },
  // Back
  { name: "Deadlift", muscleGroup: MuscleGroup.back, isBodyWeight: false },
  { name: "Barbell Row", muscleGroup: MuscleGroup.back, isBodyWeight: false },
  { name: "Dumbbell Row", muscleGroup: MuscleGroup.back, isBodyWeight: false },
  { name: "T-Bar Row", muscleGroup: MuscleGroup.back, isBodyWeight: false },
  {
    name: "Seated Cable Row",
    muscleGroup: MuscleGroup.back,
    isBodyWeight: false,
  },
  { name: "Face Pull", muscleGroup: MuscleGroup.back, isBodyWeight: false },
  // Lats
  { name: "Pull-Up", muscleGroup: MuscleGroup.lats, isBodyWeight: true },
  { name: "Lat Pulldown", muscleGroup: MuscleGroup.lats, isBodyWeight: false },
  {
    name: "Single-Arm Cable Row",
    muscleGroup: MuscleGroup.lats,
    isBodyWeight: false,
  },
  {
    name: "Straight-Arm Pulldown",
    muscleGroup: MuscleGroup.lats,
    isBodyWeight: false,
  },
  // Shoulders
  {
    name: "Overhead Press",
    muscleGroup: MuscleGroup.shoulders,
    isBodyWeight: false,
  },
  {
    name: "Arnold Press",
    muscleGroup: MuscleGroup.shoulders,
    isBodyWeight: false,
  },
  {
    name: "Lateral Raise",
    muscleGroup: MuscleGroup.shoulders,
    isBodyWeight: false,
  },
  {
    name: "Front Raise",
    muscleGroup: MuscleGroup.shoulders,
    isBodyWeight: false,
  },
  {
    name: "Reverse Flye",
    muscleGroup: MuscleGroup.shoulders,
    isBodyWeight: false,
  },
  // Biceps
  {
    name: "Barbell Curl",
    muscleGroup: MuscleGroup.biceps,
    isBodyWeight: false,
  },
  {
    name: "Dumbbell Curl",
    muscleGroup: MuscleGroup.biceps,
    isBodyWeight: false,
  },
  { name: "Hammer Curl", muscleGroup: MuscleGroup.biceps, isBodyWeight: false },
  {
    name: "Preacher Curl",
    muscleGroup: MuscleGroup.biceps,
    isBodyWeight: false,
  },
  { name: "Cable Curl", muscleGroup: MuscleGroup.biceps, isBodyWeight: false },
  // Triceps
  {
    name: "Skull Crusher",
    muscleGroup: MuscleGroup.triceps,
    isBodyWeight: false,
  },
  {
    name: "Tricep Pushdown",
    muscleGroup: MuscleGroup.triceps,
    isBodyWeight: false,
  },
  {
    name: "Overhead Tricep Extension",
    muscleGroup: MuscleGroup.triceps,
    isBodyWeight: false,
  },
  {
    name: "Close-Grip Bench Press",
    muscleGroup: MuscleGroup.triceps,
    isBodyWeight: false,
  },
  { name: "Dip", muscleGroup: MuscleGroup.triceps, isBodyWeight: true },
  // Forearms
  {
    name: "Wrist Curl",
    muscleGroup: MuscleGroup.forearms,
    isBodyWeight: false,
  },
  {
    name: "Reverse Wrist Curl",
    muscleGroup: MuscleGroup.forearms,
    isBodyWeight: false,
  },
  {
    name: "Farmer's Walk",
    muscleGroup: MuscleGroup.forearms,
    isBodyWeight: false,
  },
  {
    name: "Plate Pinch",
    muscleGroup: MuscleGroup.forearms,
    isBodyWeight: false,
  },
  // Quadriceps
  { name: "Squat", muscleGroup: MuscleGroup.quadriceps, isBodyWeight: false },
  {
    name: "Front Squat",
    muscleGroup: MuscleGroup.quadriceps,
    isBodyWeight: false,
  },
  {
    name: "Leg Press",
    muscleGroup: MuscleGroup.quadriceps,
    isBodyWeight: false,
  },
  {
    name: "Hack Squat",
    muscleGroup: MuscleGroup.quadriceps,
    isBodyWeight: false,
  },
  {
    name: "Leg Extension",
    muscleGroup: MuscleGroup.quadriceps,
    isBodyWeight: false,
  },
  {
    name: "Bulgarian Split Squat",
    muscleGroup: MuscleGroup.quadriceps,
    isBodyWeight: false,
  },
  // Hamstrings
  {
    name: "Romanian Deadlift",
    muscleGroup: MuscleGroup.hamstrings,
    isBodyWeight: false,
  },
  {
    name: "Leg Curl",
    muscleGroup: MuscleGroup.hamstrings,
    isBodyWeight: false,
  },
  {
    name: "Good Morning",
    muscleGroup: MuscleGroup.hamstrings,
    isBodyWeight: false,
  },
  {
    name: "Nordic Hamstring Curl",
    muscleGroup: MuscleGroup.hamstrings,
    isBodyWeight: true,
  },
  {
    name: "Glute-Ham Raise",
    muscleGroup: MuscleGroup.hamstrings,
    isBodyWeight: true,
  },
  // Glutes
  { name: "Hip Thrust", muscleGroup: MuscleGroup.glutes, isBodyWeight: false },
  { name: "Glute Bridge", muscleGroup: MuscleGroup.glutes, isBodyWeight: true },
  {
    name: "Cable Kickback",
    muscleGroup: MuscleGroup.glutes,
    isBodyWeight: false,
  },
  {
    name: "Sumo Deadlift",
    muscleGroup: MuscleGroup.glutes,
    isBodyWeight: false,
  },
  { name: "Step-Up", muscleGroup: MuscleGroup.glutes, isBodyWeight: false },
  // Calves
  {
    name: "Standing Calf Raise",
    muscleGroup: MuscleGroup.calves,
    isBodyWeight: false,
  },
  {
    name: "Seated Calf Raise",
    muscleGroup: MuscleGroup.calves,
    isBodyWeight: false,
  },
  {
    name: "Donkey Calf Raise",
    muscleGroup: MuscleGroup.calves,
    isBodyWeight: false,
  },
  {
    name: "Single-Leg Calf Raise",
    muscleGroup: MuscleGroup.calves,
    isBodyWeight: true,
  },
  // Abs
  {
    name: "Weighted Crunch",
    muscleGroup: MuscleGroup.abs,
    isBodyWeight: false,
  },
  { name: "Cable Crunch", muscleGroup: MuscleGroup.abs, isBodyWeight: false },
  {
    name: "Hanging Leg Raise",
    muscleGroup: MuscleGroup.abs,
    isBodyWeight: true,
  },
  { name: "Plank", muscleGroup: MuscleGroup.abs, isBodyWeight: true },
  {
    name: "Ab Wheel Rollout",
    muscleGroup: MuscleGroup.abs,
    isBodyWeight: true,
  },
  { name: "Russian Twist", muscleGroup: MuscleGroup.abs, isBodyWeight: false },
  // Traps
  {
    name: "Barbell Shrug",
    muscleGroup: MuscleGroup.traps,
    isBodyWeight: false,
  },
  {
    name: "Dumbbell Shrug",
    muscleGroup: MuscleGroup.traps,
    isBodyWeight: false,
  },
  { name: "Rack Pull", muscleGroup: MuscleGroup.traps, isBodyWeight: false },
  { name: "Upright Row", muscleGroup: MuscleGroup.traps, isBodyWeight: false },
  // Neck
  { name: "Neck Flexion", muscleGroup: MuscleGroup.neck, isBodyWeight: false },
  {
    name: "Neck Extension",
    muscleGroup: MuscleGroup.neck,
    isBodyWeight: false,
  },
  {
    name: "Lateral Neck Flexion",
    muscleGroup: MuscleGroup.neck,
    isBodyWeight: false,
  },
  { name: "Neck Rotation", muscleGroup: MuscleGroup.neck, isBodyWeight: false },
  {
    name: "Weighted Neck Harness",
    muscleGroup: MuscleGroup.neck,
    isBodyWeight: false,
  },
];

export const EXERCISES_BY_MUSCLE: Record<MuscleGroup, Exercise[]> =
  EXERCISES.reduce(
    (acc, ex) => {
      if (!acc[ex.muscleGroup]) acc[ex.muscleGroup] = [];
      acc[ex.muscleGroup].push(ex);
      return acc;
    },
    {} as Record<MuscleGroup, Exercise[]>,
  );
