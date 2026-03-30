/** NYC Open Data SODA API dataset IDs for ACRIS */
export const DATASETS = {
  /** Core document records (deeds, mortgages, etc.) */
  MASTER: "bnx9-e6tj",
  /** Party names (buyers, sellers, borrowers, lenders) */
  PARTIES: "636b-3b5g",
  /** Property identifiers (BBL, address, unit) */
  LEGALS: "8h5j-fqxa",
  /** Cross-references between documents */
  REFERENCES: "pwkr-dpni",
  /** Free-text remarks */
  REMARKS: "9p4w-7npp",
  /** Document type → description lookup */
  DOC_CONTROL_CODES: "7isb-wh4c",
  /** Property type → description lookup */
  PROPERTY_TYPE_CODES: "94g4-w6xz",
  /** State abbreviation lookup */
  STATE_CODES: "5c9e-33xj",
  /** Country code lookup */
  COUNTRY_CODES: "j2iz-mwzu",
  /** UCC collateral type lookup */
  UCC_COLLATERAL_CODES: "q9kp-jvxv",
} as const;

export const BASE_URL = "https://data.cityofnewyork.us/resource";

export function datasetUrl(datasetId: string): string {
  return `${BASE_URL}/${datasetId}.json`;
}
