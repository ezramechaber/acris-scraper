import type { BBL } from "../utils/bbl.js";
import { parseBBL } from "../utils/bbl.js";

const GEOSEARCH_URL = "https://geosearch.planninglabs.nyc/v2/search";

interface GeoSearchFeature {
  type: "Feature";
  properties: {
    label: string;
    borough: string;
    neighbourhood: string;
    postalcode: string;
    addendum: {
      pad: {
        bbl: string;
      };
    };
  };
}

interface GeoSearchResponse {
  type: "FeatureCollection";
  features: GeoSearchFeature[];
}

export interface GeoSearchResult {
  label: string;
  bbl: BBL;
  bblString: string;
  borough: string;
  postalcode: string;
}

export async function geocodeAddress(
  address: string
): Promise<GeoSearchResult[]> {
  const url = new URL(GEOSEARCH_URL);
  url.searchParams.set("text", address);

  const res = await fetch(url.toString());
  if (!res.ok) {
    throw new Error(
      `GeoSearch API error: ${res.status} ${res.statusText}`
    );
  }

  const data = (await res.json()) as GeoSearchResponse;

  if (!data.features || data.features.length === 0) {
    throw new Error(
      `No results found for address: "${address}". Try a more specific NYC address.`
    );
  }

  return data.features.map((f) => {
    const bblString = f.properties.addendum?.pad?.bbl;
    if (!bblString) {
      throw new Error(
        `GeoSearch returned a result without BBL data for "${address}".`
      );
    }
    return {
      label: f.properties.label,
      bbl: parseBBL(bblString),
      bblString,
      borough: f.properties.borough,
      postalcode: f.properties.postalcode,
    };
  });
}
