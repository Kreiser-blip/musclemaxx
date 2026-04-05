// kg <-> lbs
export const kgToLbs = (kg: number): number =>
  Math.round(kg * 2.20462 * 10) / 10;
export const lbsToKg = (lbs: number): number =>
  Math.round((lbs / 2.20462) * 10) / 10;

// cm -> ft+in display string e.g. "5'11""
export const cmToFtIn = (cm: number): string => {
  const totalInches = cm / 2.54;
  const ft = Math.floor(totalInches / 12);
  const inches = Math.round(totalInches % 12);
  if (inches === 12) return `${ft + 1}'0"`;
  return `${ft}'${inches}"`;
};

// ft+in -> cm
export const ftInToCm = (ft: number, inches: number): number =>
  Math.round((ft * 12 + inches) * 2.54 * 10) / 10;

// parse ft+in input string like "5'11" or "5 11" -> { ft, inches }
export const parseFtIn = (s: string): { ft: number; inches: number } => {
  // Support formats: "5'11", "5'11"", "5 11"
  const cleaned = s.replace(/"/g, "").trim();
  const match = cleaned.match(/^(\d+)[' ](\d+)$/);
  if (match) {
    return { ft: Number.parseInt(match[1]), inches: Number.parseInt(match[2]) };
  }
  // Just feet, no inches
  const ftOnly = cleaned.match(/^(\d+)'?$/);
  if (ftOnly) {
    return { ft: Number.parseInt(ftOnly[1]), inches: 0 };
  }
  return { ft: 0, inches: 0 };
};
