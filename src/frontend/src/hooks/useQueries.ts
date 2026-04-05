import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  InjuryLog,
  MuscleGroup,
  UserProfile,
  UserProteinRequirements,
  WorkoutLog,
} from "../backend.d";
import { useActor } from "./useActor";

export function useGetCallerUserProfile() {
  const { actor, isFetching: actorFetching } = useActor();
  const query = useQuery<UserProfile | null>({
    queryKey: ["currentUserProfile"],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not available");
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !actorFetching,
    retry: false,
  });
  return {
    ...query,
    isLoading: actorFetching || query.isLoading,
    isFetched: !!actor && query.isFetched,
  };
}

export function useSaveCallerUserProfile() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      if (!actor) throw new Error("Actor not available");
      await actor.saveCallerUserProfile(profile);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["currentUserProfile"] });
      qc.invalidateQueries({ queryKey: ["proteinRequirements"] });
    },
  });
}

export function useGetAllWorkoutLogs() {
  const { actor, isFetching: actorFetching } = useActor();
  return useQuery<WorkoutLog[]>({
    queryKey: ["workoutLogs"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllWorkoutLogsForCaller();
    },
    enabled: !!actor && !actorFetching,
  });
}

export function useAddWorkoutLog() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (log: WorkoutLog) => {
      if (!actor) throw new Error("Actor not available");
      await actor.addWorkoutLog(log);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["workoutLogs"] });
    },
  });
}

export function useGetProteinRequirements() {
  const { actor, isFetching: actorFetching } = useActor();
  return useQuery<UserProteinRequirements>({
    queryKey: ["proteinRequirements"],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not available");
      return actor.getDailyProteinRequirementsForCaller();
    },
    enabled: !!actor && !actorFetching,
  });
}

export function useGetInjuryLogs() {
  const { actor, isFetching: actorFetching } = useActor();
  return useQuery<InjuryLog[]>({
    queryKey: ["injuryLogs"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getInjuryLogsForCaller();
    },
    enabled: !!actor && !actorFetching,
  });
}

export function useAddInjuryLog() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      muscleGroup: MuscleGroup;
      dateOfInjury: bigint;
      description: string;
    }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.addInjuryLog(
        params.muscleGroup,
        params.dateOfInjury,
        params.description,
      );
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["injuryLogs"] });
    },
  });
}

export function useResolveInjuryLog() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("Actor not available");
      await actor.resolveInjuryLog(id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["injuryLogs"] });
    },
  });
}

export function useDeleteInjuryLog() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("Actor not available");
      await actor.deleteInjuryLog(id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["injuryLogs"] });
    },
  });
}
