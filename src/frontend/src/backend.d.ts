import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface InjuryLog {
    id: bigint;
    description: string;
    isResolved: boolean;
    muscleGroup: MuscleGroup;
    dateOfInjury: Time;
}
export interface UserProteinRequirements {
    inCalorieMaintenance: number;
    total: number;
    minimum: number;
    onHighTrainingDays: number;
    inCalorieSurplus: number;
    inCalorieDeficit: number;
    optimal: number;
}
export interface WorkoutLog {
    isBodyWeight: boolean;
    reps: bigint;
    sets: bigint;
    weightKg: number;
    timestamp: Time;
    exerciseName: string;
    muscleGroup: MuscleGroup;
}
export type Time = bigint;
export interface UserProfile {
    age: bigint;
    bodyFat: number;
    heightCm: number;
    goal: Goal;
    weightKg: number;
    gender: Gender;
}
export enum Gender {
    female = "female",
    male = "male"
}
export enum Goal {
    recomposition = "recomposition",
    buildMaxMuscle = "buildMaxMuscle",
    buildLeanMuscle = "buildLeanMuscle"
}
export enum MuscleGroup {
    abs = "abs",
    traps = "traps",
    triceps = "triceps",
    shoulders = "shoulders",
    back = "back",
    chest = "chest",
    lats = "lats",
    neck = "neck",
    hamstrings = "hamstrings",
    quadriceps = "quadriceps",
    glutes = "glutes",
    calves = "calves",
    forearms = "forearms",
    biceps = "biceps"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addInjuryLog(muscleGroup: MuscleGroup, dateOfInjury: Time, description: string): Promise<bigint>;
    addWorkoutLog(log: WorkoutLog): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    deleteCallerWorkoutLogs(): Promise<void>;
    deleteInjuryLog(id: bigint): Promise<void>;
    getAllUserProfiles(): Promise<Array<UserProfile>>;
    getAllWorkoutLogsForCaller(): Promise<Array<WorkoutLog>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getDailyProteinRequirementsForCaller(): Promise<UserProteinRequirements>;
    getInjuryLogsForCaller(): Promise<Array<InjuryLog>>;
    getLeanMassForCaller(): Promise<number | null>;
    getOptimalProteinRangeForCaller(): Promise<[number, number] | null>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    resolveInjuryLog(id: bigint): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
}
