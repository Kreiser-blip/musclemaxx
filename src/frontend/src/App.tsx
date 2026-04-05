import { Skeleton } from "@/components/ui/skeleton";
import { Toaster } from "@/components/ui/sonner";
import {
  Dumbbell,
  HeartPulse,
  PersonStanding,
  Salad,
  Stethoscope,
  User,
} from "lucide-react";
import { useState } from "react";
import LoginScreen from "./components/LoginScreen";
import Onboarding from "./components/Onboarding";
import { UnitProvider, useUnitPreference } from "./context/UnitContext";
import { useInternetIdentity } from "./hooks/useInternetIdentity";
import { useGetCallerUserProfile, useGetInjuryLogs } from "./hooks/useQueries";
import { kgToLbs } from "./lib/units";
import BodyDiagram from "./pages/BodyDiagram";
import Dashboard from "./pages/Dashboard";
import Injuries from "./pages/Injuries";
import Nutrition from "./pages/Nutrition";
import Profile from "./pages/Profile";
import Recovery from "./pages/Recovery";

type Tab =
  | "dashboard"
  | "nutrition"
  | "profile"
  | "body"
  | "injuries"
  | "recovery";

const BASE_NAV_ITEMS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: "body", label: "Body", icon: <PersonStanding className="w-5 h-5" /> },
  { id: "nutrition", label: "Nutrition", icon: <Salad className="w-5 h-5" /> },
  {
    id: "injuries",
    label: "Injuries",
    icon: <HeartPulse className="w-5 h-5" />,
  },
  { id: "profile", label: "Profile", icon: <User className="w-5 h-5" /> },
];

const RECOVERY_NAV_ITEM: { id: Tab; label: string; icon: React.ReactNode } = {
  id: "recovery",
  label: "Recovery",
  icon: <Stethoscope className="w-5 h-5" />,
};

function AppInner() {
  const [activeTab, setActiveTab] = useState<Tab>("body");
  const { identity } = useInternetIdentity();
  const isAuthenticated = !!identity;
  const { unitPreference } = useUnitPreference();

  const {
    data: profile,
    isLoading: profileLoading,
    isFetched,
  } = useGetCallerUserProfile();

  const { data: injuryLogs = [] } = useGetInjuryLogs();
  const hasActiveInjuries = injuryLogs.some((i) => !i.isResolved);

  const showProfileSetup =
    isAuthenticated && !profileLoading && isFetched && profile === null;

  if (!isAuthenticated) {
    return (
      <>
        <LoginScreen />
        <Toaster />
      </>
    );
  }

  if (profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Dumbbell
            className="w-10 h-10 animate-pulse"
            style={{ color: "oklch(0.63 0.24 27)" }}
          />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
    );
  }

  if (showProfileSetup) {
    return (
      <>
        <Onboarding />
        <Toaster />
      </>
    );
  }

  const navItems = hasActiveInjuries
    ? [
        BASE_NAV_ITEMS[0],
        BASE_NAV_ITEMS[1],
        BASE_NAV_ITEMS[2],
        RECOVERY_NAV_ITEM,
        BASE_NAV_ITEMS[3],
      ]
    : BASE_NAV_ITEMS;

  const colCount = navItems.length;

  const renderPage = () => {
    switch (activeTab) {
      case "dashboard":
        return <Dashboard />;
      case "body":
        return <BodyDiagram />;
      case "nutrition":
        return <Nutrition />;
      case "injuries":
        return <Injuries />;
      case "recovery":
        return <Recovery />;
      case "profile":
        return <Profile />;
      default:
        return <BodyDiagram />;
    }
  };

  const displayWeight = profile
    ? unitPreference === "imperial"
      ? kgToLbs(profile.weightKg)
      : profile.weightKg
    : null;
  const weightUnit = unitPreference === "imperial" ? "lbs" : "kg";

  return (
    <div
      className={`flex flex-col min-h-screen bg-background${hasActiveInjuries ? " light" : ""}`}
    >
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur-md">
        <div className="flex items-center justify-between px-4 h-14">
          <div className="flex items-center gap-2">
            <Dumbbell
              className="w-5 h-5"
              style={{ color: "oklch(0.63 0.24 27)" }}
            />
            <span className="font-display font-bold text-xl">MuscleMaxx</span>
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: "oklch(0.63 0.24 27)", marginLeft: "1px" }}
            />
          </div>
          {displayWeight !== null && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="font-medium text-foreground">
                {displayWeight}
              </span>
              <span>{weightUnit}</span>
            </div>
          )}
        </div>
      </header>

      <main className="flex-1 overflow-y-auto">{renderPage()}</main>

      <nav className="sticky bottom-0 z-40 border-t border-border bg-background/95 backdrop-blur-md">
        <div
          className="grid h-16"
          style={{ gridTemplateColumns: `repeat(${colCount}, minmax(0, 1fr))` }}
        >
          {navItems.map(({ id, label, icon }) => {
            const isActive = activeTab === id;
            return (
              <button
                type="button"
                key={id}
                data-ocid={`nav.${id}.link`}
                onClick={() => setActiveTab(id)}
                className={`relative flex flex-col items-center justify-center gap-0.5 transition-all ${
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                style={isActive ? { color: "oklch(0.63 0.24 27)" } : undefined}
              >
                {icon}
                <span className="text-xs font-medium">{label}</span>
                {isActive && (
                  <span
                    className="absolute bottom-1 h-0.5 w-6 rounded-full"
                    style={{ background: "oklch(0.63 0.24 27)" }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </nav>

      <Toaster />
    </div>
  );
}

export default function App() {
  return (
    <UnitProvider>
      <AppInner />
    </UnitProvider>
  );
}
