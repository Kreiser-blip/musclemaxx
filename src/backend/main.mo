import Time "mo:core/Time";
import Iter "mo:core/Iter";
import Text "mo:core/Text";
import Order "mo:core/Order";
import Float "mo:core/Float";
import Nat "mo:core/Nat";
import Map "mo:core/Map";
import List "mo:core/List";
import Runtime "mo:core/Runtime";
import Principal "mo:core/Principal";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";



actor {
  // Authorization State
  type UserRole = AccessControl.UserRole;
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  // User Profile Types
  type Gender = { #male; #female };
  type Goal = { #buildLeanMuscle; #buildMaxMuscle; #recomposition };
  type LeanMassMultiplier = { #buildLeanMuscle; #buildMaxMuscle; #recomposition };
  type MuscleRankLevel = {
    #bronzeI;
    #bronzeII;
    #bronzeIII;
    #silverI;
    #silverII;
    #silverIII;
    #goldI;
    #goldII;
    #goldIII;
    #platinumI;
    #platinumII;
    #platinumIII;
    #diamondI;
    #diamondII;
    #diamondIII;
    #eliteI;
    #eliteII;
    #eliteIII;
    #mastersI;
    #mastersII;
    #mastersIII;
    #legendaryI;
    #legendaryII;
    #legendaryIII;
  };

  type MuscleGroup = {
    #chest;
    #back;
    #shoulders;
    #biceps;
    #triceps;
    #quadriceps;
    #hamstrings;
    #calves;
    #glutes;
    #abs;
    #forearms;
    #traps;
    #lats;
    #neck;
  };

  type UserProfile = {
    age : Nat;
    gender : Gender;
    weightKg : Float;
    heightCm : Float;
    bodyFat : Float;
    goal : Goal;
  };
  type WorkoutLog = {
    exerciseName : Text;
    muscleGroup : MuscleGroup;
    sets : Nat;
    reps : Nat;
    weightKg : Float;
    isBodyWeight : Bool;
    timestamp : Time.Time;
  };

  // Injury Log Types
  type InjuryLog = {
    id : Nat;
    muscleGroup : MuscleGroup;
    dateOfInjury : Time.Time;
    description : Text;
    isResolved : Bool;
  };

  var nextInjuryLogId = 1;

  type UserProteinRequirements = {
    total : Float;
    minimum : Float;
    optimal : Float;
    onHighTrainingDays : Float;
    inCalorieSurplus : Float;
    inCalorieDeficit : Float;
    inCalorieMaintenance : Float;
  };

  module UserProfile {
    public func compare(a : UserProfile, b : UserProfile) : Order.Order {
      Nat.compare(a.age, b.age);
    };
  };

  // Muscle Rank State
  type MuscleRank = {
    #untrained;
    #rank : MuscleRankLevel;
  };
  type MuscleRanks = {
    chest : MuscleRank;
    back : MuscleRank;
    shoulders : MuscleRank;
    biceps : MuscleRank;
    triceps : MuscleRank;
    quadriceps : MuscleRank;
    hamstrings : MuscleRank;
    calves : MuscleRank;
    glutes : MuscleRank;
    abs : MuscleRank;
    forearms : MuscleRank;
    traps : MuscleRank;
    lats : MuscleRank;
    neck : MuscleRank;
  };

  // Store user profiles with principal as key
  let userProfiles = Map.empty<Principal, UserProfile>();

  // Store workout logs
  let workoutLogs = Map.empty<Principal, List.List<WorkoutLog>>();

  // Store muscle ranks with principal as key
  let muscleRankState = Map.empty<Principal, MuscleRanks>();

  // Store injury logs with principal as key
  let injuryLogs = Map.empty<Principal, List.List<InjuryLog>>();

  // Helper function to get default protein multiplier based on lean mass multiplier
  func getDefaultMultiplier(multiplier : LeanMassMultiplier) : Float {
    switch (multiplier) {
      case (#buildMaxMuscle) { 2.2 };
      case (#recomposition) { 2.5 };
      case (#buildLeanMuscle) { 2.2 };
    };
  };

  // Authorization helper checks
  func assertUser(caller : Principal) {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can perform this action");
    };
  };

  func assertAdminAccess(caller : Principal) {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can view all user profiles");
    };
  };

  func assertCallerOwnsResource(caller : Principal, resourceOwner : Principal) {
    if (caller != resourceOwner and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own resource");
    };
  };

  // Save user profile
  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    assertUser(caller);
    userProfiles.add(caller, profile);
  };

  // Get user profile
  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    assertCallerOwnsResource(caller, user);
    userProfiles.get(user);
  };

  // Get current user's profile
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    assertUser(caller);
    userProfiles.get(caller);
  };

  // Add workout log
  public shared ({ caller }) func addWorkoutLog(log : WorkoutLog) : async () {
    assertUser(caller);

    // Store workout log in persistent storage
    let logs = switch (workoutLogs.get(caller)) {
      case (null) { List.empty<WorkoutLog>() };
      case (?existing) { existing };
    };
    logs.add(log);
    workoutLogs.add(caller, logs);
  };

  // Add injury log
  public shared ({ caller }) func addInjuryLog(muscleGroup : MuscleGroup, dateOfInjury : Time.Time, description : Text) : async Nat {
    assertUser(caller);
    let id = nextInjuryLogId;
    nextInjuryLogId += 1;

    let injury : InjuryLog = {
      id;
      muscleGroup;
      dateOfInjury;
      description;
      isResolved = false;
    };

    let logs = switch (injuryLogs.get(caller)) {
      case (null) { List.empty<InjuryLog>() };
      case (?existing) { existing };
    };
    logs.add(injury);
    injuryLogs.add(caller, logs);

    id;
  };

  // Get all workout logs for current user
  public query ({ caller }) func getAllWorkoutLogsForCaller() : async [WorkoutLog] {
    assertUser(caller);
    switch (workoutLogs.get(caller)) {
      case (null) { [] };
      case (?logs) { logs.toArray() };
    };
  };

  // Get all injury logs for current user
  public query ({ caller }) func getInjuryLogsForCaller() : async [InjuryLog] {
    assertUser(caller);
    switch (injuryLogs.get(caller)) {
      case (null) { [] };
      case (?logs) { logs.toArray() };
    };
  };

  // Calculate daily protein requirements from user profile
  public query ({ caller }) func getDailyProteinRequirementsForCaller() : async UserProteinRequirements {
    assertUser(caller);
    let profile = getUserProfileInternal(caller);
    let leanMass = profile.weightKg * (1.0 - profile.bodyFat / 100.0);
    let multiplier = getDefaultMultiplier(#buildLeanMuscle);
    let recommendedGrams = leanMass * multiplier;

    {
      total = recommendedGrams;
      minimum = leanMass * 1.2;
      optimal = leanMass * 2.2;
      onHighTrainingDays = leanMass * 2.5;
      inCalorieSurplus = leanMass * 2.0;
      inCalorieDeficit = leanMass * 2.5;
      inCalorieMaintenance = leanMass * 2.2;
    };
  };

  // Helper function to get lean mass
  public query ({ caller }) func getLeanMassForCaller() : async ?Float {
    assertUser(caller);
    switch (userProfiles.get(caller)) {
      case (null) { null };
      case (?profile) {
        let leanMass = profile.weightKg * (1.0 - profile.bodyFat / 100.0);
        ?leanMass;
      };
    };
  };

  func getUserProfileInternal(user : Principal) : UserProfile {
    switch (userProfiles.get(user)) {
      case (null) { Runtime.trap("No profile found for user") };
      case (?profile) { profile };
    };
  };

  // Helper function to calculate optimal protein range (grams)
  func calculateOptimalRange(base : Float) : (Float, Float) {
    let lowerBound = base * 0.9;
    let upperBound = base * 1.1;
    (lowerBound, upperBound);
  };

  public shared ({ caller }) func deleteCallerWorkoutLogs() : async () {
    assertUser(caller);
    workoutLogs.remove(caller);
  };

  public query ({ caller }) func getOptimalProteinRangeForCaller() : async ?(Float, Float) {
    assertUser(caller);
    switch (userProfiles.get(caller)) {
      case (null) { null };
      case (?profile) {
        let leanMass = profile.weightKg * (1.0 - profile.bodyFat / 100.0);
        let multiplier = getDefaultMultiplier(#buildLeanMuscle);
        let recommendedGrams = leanMass * multiplier;
        ?calculateOptimalRange(recommendedGrams);
      };
    };
  };

  // Resolve injury log by id
  public shared ({ caller }) func resolveInjuryLog(id : Nat) : async () {
    assertUser(caller);
    let logs = switch (injuryLogs.get(caller)) {
      case (null) { Runtime.trap("Injury log not found") };
      case (?logs) {
        logs.map<InjuryLog, InjuryLog>(
          func(log) {
            if (log.id == id) { { log with isResolved = true } } else { log };
          }
        );
      };
    };
    injuryLogs.add(caller, logs);
  };

  // Delete injury log by id
  public shared ({ caller }) func deleteInjuryLog(id : Nat) : async () {
    assertUser(caller);
    let logs = switch (injuryLogs.get(caller)) {
      case (null) { Runtime.trap("Injury log not found") };
      case (?logs) {
        logs.filter(
          func(log) { log.id != id }
        );
      };
    };
    injuryLogs.add(caller, logs);
  };

  public query ({ caller }) func getAllUserProfiles() : async [UserProfile] {
    assertAdminAccess(caller);
    userProfiles.values().toArray().sort();
  };
};
