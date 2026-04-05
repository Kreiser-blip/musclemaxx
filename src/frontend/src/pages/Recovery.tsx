import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  Home,
  Stethoscope,
} from "lucide-react";
import type { InjuryLog } from "../backend.d";
import { MuscleGroup } from "../backend.d";
import { useGetInjuryLogs } from "../hooks/useQueries";

// --- Types ---
type RecoveryProtocol = {
  injuryName: string;
  homeTreatment: string[];
  timeline: string;
  needsProfessional: boolean;
  professionalNote?: string;
};

// --- Label maps (mirrored from Injuries.tsx) ---
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

// --- Recovery Protocols ---
const RECOVERY_PROTOCOLS: Record<string, RecoveryProtocol> = {
  // WRIST
  "Wrist Sprain": {
    injuryName: "Wrist Sprain",
    homeTreatment: [
      "Rest the wrist for 24–72 hours, avoiding activities that cause pain.",
      "Apply ice wrapped in cloth for 15–20 minutes every 2–3 hours for the first 48 hours.",
      "Compress the wrist with an elastic bandage to reduce swelling.",
      "Elevate the wrist above heart level when resting.",
      "After 48 hours, begin gentle wrist circles and slow flexion/extension stretches.",
      "Gradually reintroduce light grip exercises (squeezing a soft ball) as pain subsides.",
    ],
    timeline: "Mild: 1–2 weeks. Moderate: 3–6 weeks.",
    needsProfessional: false,
  },
  "Carpal Tunnel Syndrome": {
    injuryName: "Carpal Tunnel Syndrome",
    homeTreatment: [
      "Wear a wrist splint at night to keep the wrist in a neutral position.",
      "Take regular breaks during repetitive hand activities every 30 minutes.",
      "Stretch fingers and wrist: extend arm, bend wrist back, hold 15 seconds; repeat.",
      "Apply ice to the wrist for 10–15 minutes after activity to reduce inflammation.",
      "Avoid activities that involve prolonged gripping or vibration.",
      "Strengthen forearm muscles gradually with light resistance exercises.",
    ],
    timeline:
      "Mild to moderate: 4–6 weeks with consistent splinting and stretching.",
    needsProfessional: true,
    professionalNote:
      "If numbness or weakness persists beyond 4 weeks, see a doctor. Nerve conduction tests and possible corticosteroid injection or surgery may be needed.",
  },
  "Wrist Tendinitis": {
    injuryName: "Wrist Tendinitis",
    homeTreatment: [
      "Rest the wrist and avoid the movement that caused pain for 3–5 days.",
      "Apply ice for 15 minutes, 3 times daily, to reduce inflammation.",
      "After 72 hours, apply a warm compress before gentle range-of-motion exercises.",
      "Perform wrist flexor and extensor stretches: hold each for 20–30 seconds, 3 sets.",
      "Gradually introduce light resistance exercises with a resistance band.",
      "Ensure proper ergonomics for any desk or repetitive work.",
    ],
    timeline:
      "2–6 weeks depending on how consistently you rest and rehabilitate.",
    needsProfessional: false,
  },
  "De Quervain's": {
    injuryName: "De Quervain's",
    homeTreatment: [
      "Immobilize the thumb and wrist with a thumb spica splint during activities.",
      "Apply ice to the base of the thumb for 15 minutes, 2–3 times daily.",
      "Avoid pinching, gripping, or twisting motions that trigger pain.",
      "Perform the Finkelstein stretch: make a fist with thumb inside, then slowly bend the wrist toward the pinky side.",
      "Massage gently along the thumb tendons with a circular motion.",
      "Gradually reduce splint use as pain decreases and strengthen with light resistance.",
    ],
    timeline: "4–8 weeks with splinting and rest.",
    needsProfessional: true,
    professionalNote:
      "If pain does not improve in 4 weeks, a corticosteroid injection is highly effective. Surgery is a last resort but reliably curative.",
  },

  // KNEE
  "Meniscus Tear": {
    injuryName: "Meniscus Tear",
    homeTreatment: [
      "Stop all activity immediately and rest the knee.",
      "Apply ice for 20 minutes every 2–3 hours for the first 48 hours.",
      "Compress the knee with a bandage and keep the leg elevated.",
      "Avoid squatting, twisting, or heavy impact on the knee.",
      "Once acute pain subsides, perform gentle quad sets: tighten quads while sitting, hold 5 seconds.",
      "Progress to straight leg raises and gentle range-of-motion work when pain allows.",
    ],
    timeline:
      "Requires professional assessment. Minor tears: 6–8 weeks. Significant tears may require surgery with 3–6 months recovery.",
    needsProfessional: true,
    professionalNote:
      "Meniscus tears must be evaluated by an orthopedic specialist. MRI is typically required. Some tears heal with physical therapy; others require surgery.",
  },
  "Runner's Knee": {
    injuryName: "Runner's Knee",
    homeTreatment: [
      "Reduce running mileage or switch to low-impact activities (swimming, cycling).",
      "Apply ice behind the kneecap for 15–20 minutes after exercise.",
      "Strengthen the hip abductors: perform clamshells and lateral band walks daily.",
      "Strengthen the VMO (inner quad): do terminal knee extensions with a resistance band.",
      "Stretch hip flexors and IT band: pigeon pose and standing quad stretch.",
      "Ensure proper footwear and correct running form (avoid overstriding).",
    ],
    timeline: "4–8 weeks with strength training and reduced impact.",
    needsProfessional: false,
  },
  "ACL Strain": {
    injuryName: "ACL Strain",
    homeTreatment: [
      "Stop all activity immediately and rest the knee.",
      "Apply ice for 20 minutes every 2–3 hours to reduce swelling.",
      "Use a compression bandage and keep the leg elevated.",
      "Avoid any weight-bearing on the affected leg if unstable.",
      "Use crutches if walking is required to prevent further damage.",
    ],
    timeline:
      "Requires professional assessment. Full recovery typically 6–12 months with proper treatment.",
    needsProfessional: true,
    professionalNote:
      "ACL injuries require immediate medical evaluation. Partial tears may heal with physical therapy; full tears typically require surgery. Do not attempt to train through this injury.",
  },
  "Patellar Tendinitis": {
    injuryName: "Patellar Tendinitis",
    homeTreatment: [
      "Reduce or eliminate jumping and deep squatting activities.",
      "Apply ice below the kneecap for 15 minutes after any exercise.",
      "Perform eccentric decline squats: stand on a 25° decline board, slowly lower in 3 seconds.",
      "Stretch the quad: stand on one leg, pull heel to glute, hold 30 seconds each side.",
      "Use a patellar tendon strap during activity to offload the tendon.",
      "Gradually progress loading over 6–12 weeks; patience is essential with tendon injuries.",
    ],
    timeline:
      "6–12 weeks of consistent eccentric training. Chronic cases may take 3–6 months.",
    needsProfessional: false,
  },
  "IT Band Syndrome": {
    injuryName: "IT Band Syndrome",
    homeTreatment: [
      "Reduce running volume; replace with swimming or cycling for cardio.",
      "Foam roll the outer thigh (not directly on the IT band) for 60–90 seconds each side.",
      "Stretch the IT band: cross the injured leg behind the other and lean to the opposite side.",
      "Strengthen hip abductors: side-lying leg raises and clamshells, 3 × 15 daily.",
      "Apply ice to the outer knee for 15 minutes post-exercise.",
      "Check running shoes for excessive wear and consider gait analysis.",
    ],
    timeline: "4–8 weeks with hip strengthening and reduced impact activity.",
    needsProfessional: false,
  },

  // SHOULDER JOINT
  "Rotator Cuff Strain": {
    injuryName: "Rotator Cuff Strain",
    homeTreatment: [
      "Rest the shoulder and avoid overhead lifting for 3–5 days.",
      "Apply ice for 15–20 minutes, 3 times daily, for the first 48 hours.",
      "Begin pendulum exercises: lean forward, let arm hang, make small circles.",
      "Perform external rotation with a resistance band at low resistance.",
      "Stretch the posterior capsule: pull the affected arm across the chest with the other hand.",
      "Gradually reintroduce pressing movements at reduced weight.",
    ],
    timeline: "Mild: 2–4 weeks. Moderate: 6–8 weeks.",
    needsProfessional: false,
  },
  "Shoulder Impingement": {
    injuryName: "Shoulder Impingement",
    homeTreatment: [
      "Avoid overhead movements and any exercise that causes pain.",
      "Apply ice to the shoulder for 15 minutes, 3 times daily.",
      "Strengthen rotator cuff: perform internal/external band rotations with elbow at 90°.",
      "Strengthen lower trapezius: prone Y raises lying face-down, squeezing shoulder blades.",
      "Stretch the chest and pec minor: door frame stretch, hold 30 seconds.",
      "Improve scapular positioning with wall slides: back against wall, arms slide up.",
    ],
    timeline:
      "6–12 weeks of consistent rotator cuff and scapular strengthening.",
    needsProfessional: false,
  },
  "Shoulder Dislocation": {
    injuryName: "Shoulder Dislocation",
    homeTreatment: [
      "Do NOT attempt to relocate the shoulder yourself.",
      "Immobilize the arm in a sling in the most comfortable position.",
      "Apply ice gently around the shoulder to reduce swelling.",
      "Seek emergency medical care immediately for relocation.",
      "After medical relocation, keep in sling as directed (typically 2–4 weeks).",
      "Begin gentle pendulum and passive range-of-motion exercises only after medical clearance.",
    ],
    timeline:
      "Initial relocation is a medical emergency. Rehabilitation takes 3–6 months. Return to sport takes 6+ months.",
    needsProfessional: true,
    professionalNote:
      "A shoulder dislocation requires immediate emergency care for safe relocation. Repeated dislocations may require surgical stabilization.",
  },
  "Labrum Tear": {
    injuryName: "Labrum Tear",
    homeTreatment: [
      "Rest the shoulder and avoid all overhead and behind-the-head exercises.",
      "Apply ice for 15 minutes, 3 times daily.",
      "Gentle pendulum exercises in pain-free range only.",
      "Perform rotator cuff strengthening at neutral (elbow at side) only.",
      "Avoid end-range positions that cause instability.",
    ],
    timeline:
      "Professional assessment required. Conservative treatment: 3–6 months. Surgical repair: 6–12 months.",
    needsProfessional: true,
    professionalNote:
      "A labrum tear requires imaging (MRI arthrogram) and orthopedic evaluation. Many tears require surgical repair for full return to activity.",
  },
  Bursitis: {
    injuryName: "Bursitis",
    homeTreatment: [
      "Rest the shoulder and avoid repetitive overhead motions.",
      "Apply ice for 15 minutes, 3–4 times daily for the first 48 hours.",
      "Gentle range-of-motion exercises: arm circles and pendulums within pain-free range.",
      "Take anti-inflammatory measures (ibuprofen if not contraindicated).",
      "Perform rotator cuff and scapular stabilizer exercises as pain subsides.",
      "Modify activity to avoid the aggravating movement pattern.",
    ],
    timeline: "2–6 weeks with rest and anti-inflammatory management.",
    needsProfessional: false,
  },

  // ELBOW
  "Tennis Elbow": {
    injuryName: "Tennis Elbow",
    homeTreatment: [
      "Rest from gripping and forearm-intensive activities for 3–5 days.",
      "Apply ice to the outer elbow for 15 minutes, 3 times daily.",
      "Perform eccentric wrist extensions: rest arm on table, slowly lower a light weight over 3 seconds.",
      "Stretch wrist extensors: extend arm, use other hand to press fingers down gently, hold 30 seconds.",
      "Use a forearm counterforce brace during activities.",
      "Gradually increase grip and forearm exercises over 6–8 weeks.",
    ],
    timeline: "6–12 weeks. Chronic cases may take 3–6 months.",
    needsProfessional: false,
  },
  "Golfer's Elbow": {
    injuryName: "Golfer's Elbow",
    homeTreatment: [
      "Rest from gripping, curling, and throwing activities for 3–5 days.",
      "Apply ice to the inner elbow for 15 minutes, 3 times daily.",
      "Perform eccentric wrist flexion: rest arm on table, slowly lower a light weight over 3 seconds.",
      "Stretch wrist flexors: extend arm with palm up, press fingers down gently with other hand.",
      "Strengthen the forearm supinators and pronators with light resistance.",
      "Check form on any pulling exercises to reduce medial elbow stress.",
    ],
    timeline: "6–12 weeks with consistent eccentric strengthening.",
    needsProfessional: false,
  },
  "Elbow Bursitis": {
    injuryName: "Elbow Bursitis",
    homeTreatment: [
      "Pad the elbow to prevent further irritation from hard surfaces.",
      "Apply ice for 15–20 minutes, 3 times daily.",
      "Avoid leaning on the elbow and repetitive bending.",
      "Compress the elbow with a soft bandage to limit further swelling.",
      "Keep the elbow elevated when resting.",
      "Gentle range-of-motion exercises once acute swelling subsides.",
    ],
    timeline: "2–4 weeks. Persistent cases may need medical drainage.",
    needsProfessional: false,
  },
  "UCL Sprain": {
    injuryName: "UCL Sprain",
    homeTreatment: [
      "Rest from all throwing, pushing, and pulling activities.",
      "Apply ice to the inner elbow for 20 minutes, every 2–3 hours initially.",
      "Compress and elevate the elbow to reduce swelling.",
      "Perform gentle forearm pronation/supination exercises within pain-free range.",
      "Strengthen wrist flexors and forearm muscles progressively as pain allows.",
    ],
    timeline:
      "Mild: 3–6 weeks. Moderate to severe: may require surgical reconstruction (Tommy John surgery).",
    needsProfessional: true,
    professionalNote:
      "UCL sprains require medical imaging. Severe tears in throwing athletes often require surgical reconstruction for full return to sport.",
  },

  // ANKLE
  "Ankle Sprain": {
    injuryName: "Ankle Sprain",
    homeTreatment: [
      "Follow RICE: Rest, Ice (20 min every 2–3 hours), Compression, Elevation.",
      "Avoid weight-bearing for the first 24–48 hours if pain is significant.",
      "Once walking is pain-free, perform ankle alphabet: trace A–Z in the air with your foot.",
      "Perform calf raises on both feet, progressing to single-leg as strength returns.",
      "Practice single-leg balance: stand on the injured foot for 30 seconds, 3 sets daily.",
      "Progress to agility exercises (side shuffles, figure-8 walking) before returning to sport.",
    ],
    timeline: "Mild: 1–2 weeks. Moderate: 3–6 weeks. Severe: 8–12 weeks.",
    needsProfessional: false,
  },
  "Achilles Tendinitis": {
    injuryName: "Achilles Tendinitis",
    homeTreatment: [
      "Reduce running and jumping; switch to swimming or cycling.",
      "Apply ice to the back of the heel for 15 minutes after any exercise.",
      "Perform eccentric heel drops: stand on edge of step, rise on both feet, lower on one leg.",
      "Stretch the calf: straight-leg and bent-knee stretches, holding 30 seconds each.",
      "Avoid barefoot walking on hard surfaces; use supportive footwear with a heel lift.",
      "Progress load gradually — tendon adaptations take 6–12 weeks.",
    ],
    timeline: "6–12 weeks of eccentric training. Chronic cases: 3–6 months.",
    needsProfessional: false,
  },
  "Achilles Tear": {
    injuryName: "Achilles Tear",
    homeTreatment: [
      "Do not bear weight on the foot — immobilize immediately.",
      "Apply ice wrapped in cloth and elevate the leg.",
      "Use crutches to avoid any pressure on the tendon.",
      "Seek medical care the same day or go to the emergency room.",
    ],
    timeline:
      "Surgical repair: 6–12 months rehabilitation. Non-surgical management: 6–9 months in a boot.",
    needsProfessional: true,
    professionalNote:
      "An Achilles tendon rupture is a serious injury requiring immediate medical evaluation. Both surgical and conservative approaches require specialist guidance.",
  },
  "Plantar Fasciitis": {
    injuryName: "Plantar Fasciitis",
    homeTreatment: [
      "Stretch the plantar fascia first thing in the morning: pull toes back before taking your first step.",
      "Roll a frozen water bottle or tennis ball under the arch for 5 minutes daily.",
      "Perform calf stretches (straight and bent leg) against a wall, 3 × 30 seconds each.",
      "Strengthen intrinsic foot muscles: towel toe curls and marble pickups.",
      "Wear supportive shoes with arch support; avoid flat shoes or going barefoot on hard surfaces.",
      "Reduce high-impact activities until morning pain subsides significantly.",
    ],
    timeline: "3–6 months with consistent daily stretching and loading.",
    needsProfessional: false,
  },

  // HIP
  "Hip Flexor Strain": {
    injuryName: "Hip Flexor Strain",
    homeTreatment: [
      "Rest from running, kicking, and high-knee movements for 3–5 days.",
      "Apply ice to the front of the hip for 15 minutes, 3 times daily.",
      "Stretch the hip flexors: low lunge (kneeling), posterior tilt, hold 30 seconds each side.",
      "Strengthen the hip: glute bridges and clamshells to correct muscle imbalances.",
      "Gradually progress to walking lunges and light resistance hip flexion exercises.",
      "Return to full activity only when pain-free through full range of motion.",
    ],
    timeline: "Mild: 1–2 weeks. Moderate: 3–6 weeks.",
    needsProfessional: false,
  },
  "Hip Bursitis": {
    injuryName: "Hip Bursitis",
    homeTreatment: [
      "Reduce activities that involve direct pressure or repetitive hip movement.",
      "Apply ice to the outer hip for 15 minutes, 2–3 times daily.",
      "Avoid sleeping on the affected side; use a pillow between knees.",
      "Stretch the IT band and tensor fasciae latae: cross-leg standing stretch.",
      "Strengthen hip abductors: side-lying leg raises, clamshells.",
      "Avoid running on banked surfaces; check for leg length discrepancies.",
    ],
    timeline: "4–8 weeks with rest and hip strengthening.",
    needsProfessional: false,
  },
  "Hip Labrum Tear": {
    injuryName: "Hip Labrum Tear",
    homeTreatment: [
      "Avoid deep hip flexion, external rotation, and impact activities.",
      "Apply ice to the groin/hip area for 15 minutes, 2–3 times daily.",
      "Perform gentle hip mobility exercises within pain-free range only.",
      "Strengthen the glutes and core to offload the hip joint.",
      "Avoid any clicking or locking movements that provoke pain.",
    ],
    timeline:
      "Requires professional assessment. Conservative: 3–6 months. Surgical repair: 6–12 months.",
    needsProfessional: true,
    professionalNote:
      "Hip labrum tears require MRI arthrogram for diagnosis. Many benefit from physical therapy, but significant tears may require arthroscopic surgery.",
  },
  "Groin Pull": {
    injuryName: "Groin Pull",
    homeTreatment: [
      "Rest completely from running, kicking, and lateral movements for 3–5 days.",
      "Apply ice to the inner thigh/groin for 15–20 minutes every 2–3 hours initially.",
      "Compress with a groin wrap or compression shorts.",
      "Perform gentle groin stretches: butterfly stretch sitting, gentle adductor stretch.",
      "Strengthen adductors: squeeze a pillow between knees while lying, 3 × 15.",
      "Gradually progress to walking, jogging, then lateral movements.",
    ],
    timeline: "Mild: 1–2 weeks. Moderate: 4–6 weeks. Severe: 8–12 weeks.",
    needsProfessional: false,
  },

  // LOWER BACK
  "Lower Back Muscle Strain": {
    injuryName: "Lower Back Muscle Strain",
    homeTreatment: [
      "Rest for 1–2 days; avoid prolonged bed rest as movement aids recovery.",
      "Apply ice for the first 48 hours (15 minutes, 3 times daily), then switch to heat.",
      "Perform gentle knee-to-chest stretches: lie on back, pull each knee gently to chest.",
      "Cat-cow stretches on hands and knees to restore spinal mobility.",
      "Core activation: gentle pelvic tilts and dead bug exercises.",
      "Gradually return to normal activities; avoid heavy lifting until pain-free.",
    ],
    timeline: "Mild: 1–2 weeks. Moderate: 3–6 weeks.",
    needsProfessional: false,
  },
  "Muscle Strain": {
    injuryName: "Muscle Strain",
    homeTreatment: [
      "Rest for 1–2 days and avoid the movement that caused the injury.",
      "Apply ice for the first 48 hours (15 minutes, 3 times daily), then switch to heat.",
      "Gently stretch the affected muscle within a pain-free range.",
      "Gradually reintroduce light strengthening exercises as pain allows.",
      "Perform core and stabilization exercises to support the injured area.",
      "Return to full activity progressively — avoid rushing back.",
    ],
    timeline: "Mild: 1–2 weeks. Moderate: 3–6 weeks.",
    needsProfessional: false,
  },
  "Herniated Disc": {
    injuryName: "Herniated Disc",
    homeTreatment: [
      "Avoid sitting for long periods; take walking breaks every 30 minutes.",
      "Apply ice for the first 48 hours, then alternate with heat.",
      "Perform gentle extension exercises (McKenzie press-ups): lie face-down, press up gently on forearms.",
      "Avoid bending, twisting, or any movement that causes leg pain (sciatica).",
      "Perform core strengthening: bird-dog and dead bug exercises in pain-free range.",
      "Sleep on your side with a pillow between knees to maintain neutral spine.",
    ],
    timeline:
      "Most disc herniations improve in 4–12 weeks with conservative care.",
    needsProfessional: true,
    professionalNote:
      "If you experience radiating leg pain, numbness, or weakness, seek medical evaluation promptly. Nerve compression may require imaging and specialist management.",
  },
  Sciatica: {
    injuryName: "Sciatica",
    homeTreatment: [
      "Stay as active as possible — prolonged rest worsens sciatica.",
      "Perform piriformis stretches: lie on back, cross ankle over opposite knee, pull both toward chest.",
      "Apply heat to the lower back and ice to the buttock/leg as needed.",
      "Perform neural flossing: sit upright, extend the affected leg and flex the foot 10 times.",
      "Strengthen the core and glutes: bird-dog, clamshells, gentle hip hinges.",
      "Avoid prolonged sitting; use a lumbar support cushion.",
    ],
    timeline:
      "Most cases resolve in 4–8 weeks. Severe cases may take 3 months.",
    needsProfessional: true,
    professionalNote:
      "If pain is severe, persistent, or accompanied by bowel/bladder changes, seek immediate medical care. Imaging and specialist care may be needed.",
  },
  "Lumbar Sprain": {
    injuryName: "Lumbar Sprain",
    homeTreatment: [
      "Apply ice to the lower back for 15–20 minutes every 2–3 hours for the first 48 hours.",
      "After 48 hours, switch to heat to relax the muscles.",
      "Perform gentle knee-to-chest stretches and cat-cow movements.",
      "Remain active with walking; avoid bed rest beyond 1–2 days.",
      "Strengthen the core: gentle pelvic tilts and transverse abdominis activation.",
      "Avoid heavy lifting and forward bending until pain is fully resolved.",
    ],
    timeline: "2–4 weeks with rest, mobility work, and gentle strengthening.",
    needsProfessional: false,
  },

  // SHOULDERS (MUSCLE)
  "Muscle Tear": {
    injuryName: "Muscle Tear",
    homeTreatment: [
      "Stop training immediately and apply ice for 20 minutes.",
      "Rest and immobilize if pain is severe.",
      "Apply ice every 2–3 hours for the first 48 hours.",
      "After 48 hours, begin gentle range-of-motion exercises within pain-free range.",
      "Gradually reintroduce loading over 4–6 weeks.",
    ],
    timeline: "Minor tears: 4–8 weeks. Significant tears: 8–16 weeks or more.",
    needsProfessional: true,
    professionalNote:
      "Muscle tears should be evaluated to determine severity. Major tears may require surgical repair.",
  },
  DOMS: {
    injuryName: "DOMS",
    homeTreatment: [
      "Continue light activity — gentle movement increases blood flow and speeds recovery.",
      "Take a warm bath or apply heat to reduce stiffness.",
      "Perform light stretching of the affected muscles.",
      "Stay hydrated and ensure adequate protein intake (1.6–2.2g per kg bodyweight).",
      "Get adequate sleep — most muscle repair happens during sleep.",
      "Return to normal training when soreness is below 4/10 pain.",
    ],
    timeline: "24–72 hours. Usually peaks at 48 hours post-exercise.",
    needsProfessional: false,
  },

  // CHEST
  "Pec Strain": {
    injuryName: "Pec Strain",
    homeTreatment: [
      "Stop pressing exercises and rest for 3–5 days.",
      "Apply ice to the chest for 15 minutes, 3 times daily.",
      "Gently stretch the pec: doorway stretch, hold 20 seconds, 3 times daily.",
      "After one week, begin light cable fly movements through a partial range.",
      "Progress to dumbbell press at 50% of normal weight, increasing over 2–4 weeks.",
    ],
    timeline: "Mild: 2–4 weeks. Moderate: 4–8 weeks.",
    needsProfessional: false,
  },
  "Pec Tear": {
    injuryName: "Pec Tear",
    homeTreatment: [
      "Stop all pressing and chest activity immediately.",
      "Apply ice to the chest and shoulder junction for 20 minutes.",
      "Immobilize the arm in a sling if shoulder movement causes pain.",
      "Seek medical evaluation immediately.",
    ],
    timeline:
      "Surgical repair required for significant tears: 4–6 months rehabilitation.",
    needsProfessional: true,
    professionalNote:
      "A pec tear requires urgent orthopedic evaluation. Full-thickness tears (especially at the tendon) require surgical repair to restore full strength.",
  },

  // BACK
  Spasm: {
    injuryName: "Spasm",
    homeTreatment: [
      "Apply heat to the affected area for 15–20 minutes to relax the muscle.",
      "Gently stretch with a knee-to-chest pull or cat-cow stretches.",
      "Massage the spasming muscle with gentle circular pressure.",
      "Stay moving with gentle walks; avoid complete bed rest.",
      "Ensure proper hydration and electrolyte intake (magnesium deficiency can cause cramps).",
      "Return to normal activity when pain is below 3/10.",
    ],
    timeline:
      "Acute spasms resolve in 3–10 days. Recurring spasms need further investigation.",
    needsProfessional: false,
  },

  // BICEPS
  "Bicep Strain": {
    injuryName: "Bicep Strain",
    homeTreatment: [
      "Rest from all curling and elbow flexion exercises for 3–5 days.",
      "Apply ice to the bicep muscle for 15 minutes, 3 times daily.",
      "Gently stretch the bicep: extend the arm behind you at shoulder height, hold 20 seconds.",
      "Reintroduce with hammer curls using light weight, progress over 2–3 weeks.",
      "Eccentric curls (slow negative): lower the weight in 4–5 seconds for rehab.",
    ],
    timeline: "Mild: 1–2 weeks. Moderate: 3–6 weeks.",
    needsProfessional: false,
  },
  "Bicep Tendon Tear": {
    injuryName: "Bicep Tendon Tear",
    homeTreatment: [
      "Stop all activity and rest the arm immediately.",
      "Apply ice and keep the arm elevated.",
      "Avoid all elbow flexion and supination movements.",
      "Seek medical evaluation urgently.",
    ],
    timeline:
      "Surgical repair (distal tendon): 4–6 months rehabilitation. Proximal tears: may heal non-surgically in 3–4 months.",
    needsProfessional: true,
    professionalNote:
      "A bicep tendon tear requires orthopedic evaluation. Distal ruptures almost always require surgery to restore full strength. Proximal ruptures may be managed conservatively.",
  },

  // TRICEPS
  "Tricep Strain": {
    injuryName: "Tricep Strain",
    homeTreatment: [
      "Rest from pressing, dips, and tricep isolation exercises for 3–5 days.",
      "Apply ice to the back of the arm for 15 minutes, 3 times daily.",
      "Stretch the tricep: raise arm overhead, bend elbow, use other hand to push elbow gently.",
      "Reintroduce with light tricep pushdowns using bands or cables.",
      "Progress to close-grip press and dips over 3–4 weeks.",
    ],
    timeline: "Mild: 1–2 weeks. Moderate: 3–6 weeks.",
    needsProfessional: false,
  },

  // QUADS
  "Quad Strain": {
    injuryName: "Quad Strain",
    homeTreatment: [
      "Rest from running and squatting for 3–5 days.",
      "Apply ice to the front thigh for 20 minutes, 3 times daily.",
      "Compress the thigh with a compression bandage.",
      "Gently stretch the quad: standing quad stretch (pull heel to glute), hold 30 seconds.",
      "Perform isometric quad sets: press back of knee into floor, hold 5 seconds, 15 reps.",
      "Progress to leg press at reduced weight, then squats.",
    ],
    timeline: "Mild: 1–2 weeks. Moderate: 3–6 weeks.",
    needsProfessional: false,
  },
  "Quad Contusion": {
    injuryName: "Quad Contusion",
    homeTreatment: [
      "Apply ice immediately for 20 minutes, wrapped in cloth.",
      "Bend the knee gently and hold in a flexed position (RICE in flexion) for first 24 hours.",
      "Compress with a bandage and elevate the leg.",
      "Avoid massage for the first 48 hours to prevent myositis ossificans.",
      "Begin gentle range-of-motion exercises after 48 hours.",
      "Progress to strengthening as range of motion returns fully.",
    ],
    timeline: "Mild: 1–2 weeks. Moderate to severe: 3–8 weeks.",
    needsProfessional: false,
  },

  // HAMSTRINGS
  "Hamstring Strain": {
    injuryName: "Hamstring Strain",
    homeTreatment: [
      "Stop activity and apply ice to the back of the thigh for 20 minutes.",
      "Rest for 2–3 days; use crutches if walking is painful.",
      "After 48 hours, begin gentle hamstring stretches in a pain-free range.",
      "Perform prone hip extension: lie face down, lift straight leg slightly, hold 5 seconds.",
      "Progress to Nordic curls (eccentric hamstring exercise) starting at 50% range.",
      "Gradually reintroduce jogging before returning to sprinting.",
    ],
    timeline: "Grade 1: 1–3 weeks. Grade 2: 4–8 weeks. Grade 3: 3–6 months.",
    needsProfessional: false,
  },
  "Hamstring Tear": {
    injuryName: "Hamstring Tear",
    homeTreatment: [
      "Stop all activity and rest with the leg elevated.",
      "Apply ice for 20 minutes every 2–3 hours for the first 48 hours.",
      "Avoid stretching the hamstring aggressively in the first 72 hours.",
      "Use crutches to offload the leg if walking causes pain.",
      "Seek medical evaluation to determine grade and appropriate treatment.",
    ],
    timeline: "Grade 3 tears: 3–6 months. May require surgical evaluation.",
    needsProfessional: true,
    professionalNote:
      "A complete hamstring tear (proximal avulsion) may require surgical reattachment, particularly for active individuals. MRI and orthopedic evaluation are needed.",
  },

  // CALVES
  "Calf Strain": {
    injuryName: "Calf Strain",
    homeTreatment: [
      "Apply ice immediately for 20 minutes and rest with the leg elevated.",
      "Use a heel lift in your shoe to reduce tension on the calf muscle.",
      "After 48 hours, gently stretch: stand on a step, heel drop with a straight knee.",
      "Perform seated calf raises with light weight to rebuild strength.",
      "Progress to standing calf raises, then single-leg calf raises.",
      "Return to running only when single-leg calf raise is equal to the other side.",
    ],
    timeline: "Grade 1: 1–2 weeks. Grade 2: 3–6 weeks.",
    needsProfessional: false,
  },
  "Calf Cramp": {
    injuryName: "Calf Cramp",
    homeTreatment: [
      "Immediately stretch the calf: flex the foot up (dorsiflexion) and hold.",
      "Massage the cramping muscle with firm strokes toward the heart.",
      "Apply heat once the cramp passes to relax the muscle.",
      "Hydrate with water and electrolytes (sodium, potassium, magnesium).",
      "Perform regular calf stretches and foam rolling to prevent recurrence.",
      "If cramps are frequent, review training load, hydration, and mineral intake.",
    ],
    timeline:
      "Acute cramp resolves in minutes. Recurrent cramps need lifestyle adjustments.",
    needsProfessional: false,
  },

  // GLUTES
  "Glute Strain": {
    injuryName: "Glute Strain",
    homeTreatment: [
      "Rest from squats, deadlifts, and hip-thrust exercises for 3–5 days.",
      "Apply ice to the buttock for 15–20 minutes, 3 times daily.",
      "Gently stretch: figure-4 stretch lying on back, pull knee toward opposite shoulder.",
      "Perform gentle glute activation: clamshells and side-lying abductions.",
      "Progress to glute bridges and then hip thrusts over 2–3 weeks.",
    ],
    timeline: "Mild: 1–2 weeks. Moderate: 3–5 weeks.",
    needsProfessional: false,
  },
  "Piriformis Syndrome": {
    injuryName: "Piriformis Syndrome",
    homeTreatment: [
      "Avoid prolonged sitting and any activity that triggers buttock or leg pain.",
      "Stretch the piriformis: lying figure-4 stretch, hold 60 seconds per side, 3 times daily.",
      "Foam roll the glutes and piriformis: sit on a foam roller, cross one ankle over knee, roll the outer hip.",
      "Strengthen hip abductors: clamshells and banded side-steps.",
      "Apply heat to the buttock before stretching and ice after exercise.",
      "Check for leg length differences or running gait issues.",
    ],
    timeline: "4–8 weeks of consistent stretching and strengthening.",
    needsProfessional: false,
  },

  // FOREARMS
  "Forearm Strain": {
    injuryName: "Forearm Strain",
    homeTreatment: [
      "Rest from gripping, lifting, and wrist-intensive activities for 2–4 days.",
      "Apply ice to the forearm for 15 minutes, 3 times daily.",
      "After 48 hours, perform wrist flexion/extension stretches.",
      "Eccentric wrist curls: slowly lower a light weight over 3 seconds.",
      "Gradually reintroduce grip training with a stress ball or grip trainer.",
    ],
    timeline: "1–3 weeks.",
    needsProfessional: false,
  },
  "Forearm Tendinitis": {
    injuryName: "Forearm Tendinitis",
    homeTreatment: [
      "Rest from the aggravating activity for 3–5 days.",
      "Apply ice to the affected forearm for 15 minutes, 3 times daily.",
      "Stretch wrist flexors and extensors: hold each 30 seconds, 3 times daily.",
      "Perform eccentric forearm exercises: slow lowering phase under control.",
      "Use a forearm compression sleeve during activities.",
      "Modify technique or grip to reduce tendon load.",
    ],
    timeline: "3–6 weeks.",
    needsProfessional: false,
  },
};

// --- Helpers ---
const ALL_INJURY_NAMES = Object.keys(RECOVERY_PROTOCOLS);

function extractInjuryName(description: string): string | null {
  const lower = description.toLowerCase();
  for (const name of ALL_INJURY_NAMES) {
    if (lower.startsWith(name.toLowerCase())) return name;
  }
  // Also check if any injury name appears at the start (before a dash or comma)
  const firstWord = description.split(/[—\-,]/)[0].trim();
  for (const name of ALL_INJURY_NAMES) {
    if (firstWord.toLowerCase() === name.toLowerCase()) return name;
  }
  return null;
}

function getProtocol(injury: InjuryLog): RecoveryProtocol | null {
  // Try to extract from description
  const extracted = extractInjuryName(injury.description);
  if (extracted && RECOVERY_PROTOCOLS[extracted])
    return RECOVERY_PROTOCOLS[extracted];

  // Fallback: generic protocol by muscle group
  const muscleLabel = MUSCLE_LABELS[injury.muscleGroup] ?? "";
  // Try to find any protocol matching the muscle label
  for (const key of ALL_INJURY_NAMES) {
    if (key.toLowerCase().includes(muscleLabel.toLowerCase()))
      return RECOVERY_PROTOCOLS[key];
  }
  return null;
}

function getAreaLabel(injury: InjuryLog): string {
  return MUSCLE_LABELS[injury.muscleGroup] ?? String(injury.muscleGroup);
}

function formatDate(nanoseconds: bigint): string {
  const ms = Number(nanoseconds / BigInt(1_000_000));
  return new Date(ms).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

// --- Recovery Card ---
function RecoveryCard({ injury }: { injury: InjuryLog }) {
  const protocol = getProtocol(injury);
  const areaLabel = getAreaLabel(injury);
  const injuryName = extractInjuryName(injury.description);

  return (
    <Card
      data-ocid="recovery.item.1"
      className="border-border bg-card overflow-hidden"
    >
      <CardHeader className="pb-2">
        <div className="flex flex-col gap-1">
          <CardTitle className="text-base font-bold">
            {areaLabel}
            {injuryName ? ` — ${injuryName}` : ""}
          </CardTitle>
          <span className="text-xs text-muted-foreground">
            {formatDate(injury.dateOfInjury)}
          </span>
        </div>
      </CardHeader>

      <CardContent className="pt-0 flex flex-col gap-4">
        {protocol ? (
          <>
            {/* Professional warning */}
            {protocol.needsProfessional && (
              <div
                data-ocid="recovery.error_state"
                className="flex items-start gap-2 rounded-md p-3 text-sm"
                style={{
                  background: "oklch(0.18 0.06 27)",
                  border: "1px solid oklch(0.50 0.22 27)",
                  color: "oklch(0.88 0.08 27)",
                }}
              >
                <AlertTriangle
                  className="w-4 h-4 mt-0.5 shrink-0"
                  style={{ color: "oklch(0.63 0.24 27)" }}
                />
                <div className="flex flex-col gap-0.5">
                  <span className="font-semibold">
                    Professional consultation strongly recommended
                  </span>
                  {protocol.professionalNote && (
                    <span className="text-xs opacity-90">
                      {protocol.professionalNote}
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Home Treatment */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-1.5">
                <Home
                  className="w-3.5 h-3.5"
                  style={{ color: "oklch(0.63 0.24 27)" }}
                />
                <span
                  className="text-xs font-bold uppercase tracking-wider"
                  style={{ color: "oklch(0.63 0.24 27)" }}
                >
                  Home Treatment
                </span>
              </div>
              <ol className="flex flex-col gap-2">
                {protocol.homeTreatment.map((step, idx) => (
                  <li
                    key={step.slice(0, 40)}
                    className="flex gap-2.5 text-sm leading-relaxed"
                  >
                    <span
                      className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold mt-0.5"
                      style={{
                        background: "oklch(0.63 0.24 27)",
                        color: "oklch(0.98 0 0)",
                      }}
                    >
                      {idx + 1}
                    </span>
                    <span className="text-foreground/90">{step}</span>
                  </li>
                ))}
              </ol>
            </div>

            <Separator className="opacity-30" />

            {/* Recovery Timeline */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-1.5">
                <Clock
                  className="w-3.5 h-3.5"
                  style={{ color: "oklch(0.63 0.24 27)" }}
                />
                <span
                  className="text-xs font-bold uppercase tracking-wider"
                  style={{ color: "oklch(0.63 0.24 27)" }}
                >
                  Recovery Timeline
                </span>
              </div>
              <p className="text-sm leading-relaxed text-foreground/90">
                {protocol.timeline}
              </p>
            </div>
          </>
        ) : (
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-1.5">
              <Home
                className="w-3.5 h-3.5"
                style={{ color: "oklch(0.63 0.24 27)" }}
              />
              <span
                className="text-xs font-bold uppercase tracking-wider"
                style={{ color: "oklch(0.63 0.24 27)" }}
              >
                General Recovery
              </span>
            </div>
            <ol className="flex flex-col gap-2">
              {[
                "Rest the injured area and avoid the aggravating movement for 2–5 days.",
                "Apply ice for 15 minutes, 3 times daily for the first 48 hours.",
                "After 48 hours, apply heat to relax the muscle.",
                "Perform gentle range-of-motion exercises within a pain-free range.",
                "Gradually reintroduce load over 2–4 weeks.",
                "Seek professional guidance if pain persists beyond 2 weeks.",
              ].map((step, idx) => (
                <li
                  key={step.slice(0, 40)}
                  className="flex gap-2.5 text-sm leading-relaxed"
                >
                  <span
                    className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold mt-0.5"
                    style={{
                      background: "oklch(0.63 0.24 27)",
                      color: "oklch(0.98 0 0)",
                    }}
                  >
                    {idx + 1}
                  </span>
                  <span className="text-foreground/90">{step}</span>
                </li>
              ))}
            </ol>
          </div>
        )}

        {/* Injury description */}
        {injury.description && (
          <p
            className="text-xs text-muted-foreground italic border-l-2 pl-3"
            style={{ borderColor: "oklch(0.63 0.24 27 / 0.4)" }}
          >
            {injury.description}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

// --- Main page ---
export default function Recovery() {
  const { data: injuries = [], isLoading } = useGetInjuryLogs();
  const active = injuries.filter((i) => !i.isResolved);

  return (
    <div className="flex flex-col gap-6 px-4 py-6 pb-24 max-w-lg mx-auto">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <Stethoscope
            className="w-5 h-5"
            style={{ color: "oklch(0.63 0.24 27)" }}
          />
          <h1 className="font-display text-2xl font-bold">Recovery</h1>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          Your active injury recovery plans.
        </p>
      </div>

      {isLoading ? (
        <div
          data-ocid="recovery.loading_state"
          className="flex justify-center py-12"
        >
          <div
            className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin"
            style={{
              borderColor: "oklch(0.63 0.24 27)",
              borderTopColor: "transparent",
            }}
          />
        </div>
      ) : active.length === 0 ? (
        <div
          data-ocid="recovery.empty_state"
          className="flex flex-col items-center gap-3 py-16 text-center"
        >
          <CheckCircle
            className="w-12 h-12"
            style={{ color: "oklch(0.55 0.15 145)" }}
          />
          <div>
            <p className="font-semibold text-foreground">No active injuries</p>
            <p className="text-sm text-muted-foreground mt-0.5">
              Keep training safely!
            </p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {active.map((injury) => (
            <RecoveryCard key={String(injury.id)} injury={injury} />
          ))}
        </div>
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
