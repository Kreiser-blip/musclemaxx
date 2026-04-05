import { createContext, useContext, useState } from "react";

export type UnitPreference = "metric" | "imperial";

interface UnitContextValue {
  unitPreference: UnitPreference;
  setUnitPreference: (u: UnitPreference) => void;
}

const STORAGE_KEY = "musclerank-units";

const UnitContext = createContext<UnitContextValue>({
  unitPreference: "metric",
  setUnitPreference: () => {},
});

export function UnitProvider({ children }: { children: React.ReactNode }) {
  const [unitPreference, setUnitPreferenceState] = useState<UnitPreference>(
    () => {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored === "metric" || stored === "imperial") return stored;
      } catch {}
      return "metric";
    },
  );

  const setUnitPreference = (u: UnitPreference) => {
    setUnitPreferenceState(u);
    try {
      localStorage.setItem(STORAGE_KEY, u);
    } catch {}
  };

  return (
    <UnitContext.Provider value={{ unitPreference, setUnitPreference }}>
      {children}
    </UnitContext.Provider>
  );
}

export function useUnitPreference() {
  return useContext(UnitContext);
}
