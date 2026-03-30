import { boroughName, isAcrisCovered } from "./borough.js";

export interface BBL {
  borough: number;
  block: number;
  lot: number;
}

/** Parse a 10-digit BBL string into components */
export function parseBBL(bbl: string): BBL {
  const cleaned = bbl.replace(/[-\s]/g, "");
  if (!/^\d{10}$/.test(cleaned)) {
    throw new Error(
      `Invalid BBL "${bbl}". Expected 10 digits (1 borough + 5 block + 4 lot).`
    );
  }
  return {
    borough: parseInt(cleaned[0], 10),
    block: parseInt(cleaned.slice(1, 6), 10),
    lot: parseInt(cleaned.slice(6, 10), 10),
  };
}

/** Build a 10-digit BBL string from components */
export function formatBBL(bbl: BBL): string {
  return `${bbl.borough}${String(bbl.block).padStart(5, "0")}${String(bbl.lot).padStart(4, "0")}`;
}

/** Human-readable display: "1-00835-0041 (MANHATTAN)" */
export function displayBBL(bbl: BBL): string {
  const b = String(bbl.block).padStart(5, "0");
  const l = String(bbl.lot).padStart(4, "0");
  return `${bbl.borough}-${b}-${l} (${boroughName(bbl.borough)})`;
}

/** Parse borough/block/lot from separate CLI args */
export function parseBBLArgs(args: string[]): BBL {
  if (args.length === 1) {
    return parseBBL(args[0]);
  }
  if (args.length === 3) {
    const borough = parseInt(args[0], 10);
    const block = parseInt(args[1], 10);
    const lot = parseInt(args[2], 10);
    if (isNaN(borough) || isNaN(block) || isNaN(lot)) {
      throw new Error("Borough, block, and lot must be numbers.");
    }
    return { borough, block, lot };
  }
  throw new Error(
    "Provide BBL as a single 10-digit string or as three separate args: <borough> <block> <lot>"
  );
}

export function validateBBLForAcris(bbl: BBL): void {
  if (!isAcrisCovered(bbl.borough)) {
    throw new Error(
      `Borough ${bbl.borough} (${boroughName(bbl.borough)}) is not covered by ACRIS. ACRIS covers Manhattan (1), Bronx (2), Brooklyn (3), and Queens (4).`
    );
  }
}
