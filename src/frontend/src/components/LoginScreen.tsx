import { Button } from "@/components/ui/button";
import { Dumbbell, Loader2, Shield } from "lucide-react";
import { motion } from "motion/react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

export default function LoginScreen() {
  const { login, loginStatus } = useInternetIdentity();
  const isLoggingIn = loginStatus === "logging-in";

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col items-center gap-8 p-8 max-w-sm w-full"
      >
        <div className="flex flex-col items-center gap-3">
          <div className="relative">
            <div
              className="absolute inset-0 rounded-2xl primary-glow-lg"
              style={{ transform: "scale(1.4)", opacity: 0.6 }}
            />
            <div
              className="relative w-20 h-20 rounded-2xl flex items-center justify-center"
              style={{
                background: "oklch(0.63 0.24 27 / 0.15)",
                border: "2px solid oklch(0.63 0.24 27 / 0.4)",
              }}
            >
              <Dumbbell
                className="w-10 h-10"
                style={{ color: "oklch(0.63 0.24 27)" }}
              />
            </div>
          </div>
          <h1 className="font-display text-4xl font-bold tracking-tight text-foreground">
            MuscleMaxx
          </h1>
          <p className="text-muted-foreground text-center text-sm">
            Track your lifts. Rank your muscles. Dominate the iron.
          </p>
        </div>

        <div className="w-full flex flex-col gap-3">
          <Button
            data-ocid="login.primary_button"
            onClick={() => login()}
            disabled={isLoggingIn}
            className="w-full h-12 text-base font-semibold"
            style={{
              background: "oklch(0.63 0.24 27)",
              color: "oklch(0.10 0.010 260)",
            }}
          >
            {isLoggingIn ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Authenticating...
              </>
            ) : (
              "Enter the Gym"
            )}
          </Button>
          <div className="flex items-center gap-2 text-muted-foreground text-xs justify-center">
            <Shield className="w-3 h-3" />
            <span>Secured by Internet Identity</span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 w-full">
          {["24 Ranks", "65+ Exercises", "14 Muscles"].map((feat) => (
            <div
              key={feat}
              className="relative text-center p-3 rounded-lg bg-card border border-border overflow-hidden"
            >
              <div
                className="absolute left-0 top-0 bottom-0 w-0.5 rounded-l-lg"
                style={{ background: "oklch(0.63 0.24 27 / 0.6)" }}
              />
              <p className="text-xs text-muted-foreground">{feat}</p>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
