import { sodaQuery } from "./soda-client.js";
import type { BBL } from "../utils/bbl.js";

const PLUTO_DATASET = "64uk-42ks";

export interface PlutoRecord {
  address: string;
  borough: string;
  borocode: string;
  block: string;
  lot: string;
  bbl: string;
  ownername: string;
  bldgclass: string;
  landuse: string;
  zonedist1: string;
  yearbuilt: string;
  numfloors: string;
  numbldgs: string;
  unitsres: string;
  unitstotal: string;
  lotarea: string;
  bldgarea: string;
  resarea: string;
  comarea: string;
  assessland: string;
  assesstot: string;
  exempttot: string;
  fullval: string;
  lotfront: string;
  lotdepth: string;
  latitude: string;
  longitude: string;
  zipcode: string;
}

export async function getPlutoRecord(
  bbl: BBL
): Promise<PlutoRecord | null> {
  const records = await sodaQuery<PlutoRecord>(PLUTO_DATASET, {
    $where: `borocode=${bbl.borough} AND block=${bbl.block} AND lot=${bbl.lot}`,
    $limit: 1,
  });

  return records[0] ?? null;
}
