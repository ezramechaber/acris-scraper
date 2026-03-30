export const BOROUGH_CODES: Record<number, string> = {
  1: "MANHATTAN",
  2: "BRONX",
  3: "BROOKLYN",
  4: "QUEENS",
  5: "STATEN ISLAND",
};

const BOROUGH_ALIASES: Record<string, number> = {
  manhattan: 1,
  mn: 1,
  "new york": 1,
  "1": 1,
  bronx: 2,
  bx: 2,
  "the bronx": 2,
  "2": 2,
  brooklyn: 3,
  bk: 3,
  kings: 3,
  "3": 3,
  queens: 4,
  qn: 4,
  "4": 4,
  "staten island": 5,
  si: 5,
  richmond: 5,
  "5": 5,
};

export function parseBoroughCode(input: string): number | null {
  return BOROUGH_ALIASES[input.toLowerCase().trim()] ?? null;
}

export function boroughName(code: number): string {
  return BOROUGH_CODES[code] ?? `UNKNOWN (${code})`;
}

export function isAcrisCovered(boroughCode: number): boolean {
  return boroughCode >= 1 && boroughCode <= 4;
}
