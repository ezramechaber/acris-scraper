import type { BBL } from "../utils/bbl.js";

/** Raw record from Real Property Master dataset */
export interface MasterRecord {
  document_id: string;
  record_type: string;
  crfn: string;
  recorded_borough: string;
  doc_type: string;
  document_date: string;
  document_amt: string;
  recorded_datetime: string;
  modified_date: string;
  reel_yr: string;
  reel_nbr: string;
  reel_pg: string;
  percent_trans: string;
  good_through_date: string;
}

/** Raw record from Real Property Parties dataset */
export interface PartyRecord {
  document_id: string;
  record_type: string;
  party_type: string; // "1" = grantor/seller, "2" = grantee/buyer
  name: string;
  address_1: string;
  address_2: string;
  country: string;
  city: string;
  state: string;
  zip: string;
  good_through_date: string;
}

/** Raw record from Real Property Legals dataset */
export interface LegalRecord {
  document_id: string;
  record_type: string;
  borough: string;
  block: string;
  lot: string;
  easement: string;
  partial_lot: string;
  air_rights: string;
  subterranean_rights: string;
  property_type: string;
  street_number: string;
  street_name: string;
  unit: string;
  good_through_date: string;
}

/** Document Control Code lookup */
export interface DocControlCode {
  doc__type: string;
  doc__type_description: string;
  class_code_description: string;
  party1_type: string;
  party2_type: string;
  party3_type: string;
}

/** Assembled property transaction */
export interface PropertyTransaction {
  documentId: string;
  docType: string;
  docTypeDescription: string;
  documentDate: string;
  recordedDate: string;
  amount: number;
  percentTransferred: number;
  party1: PartyInfo[]; // grantor/seller/borrower
  party2: PartyInfo[]; // grantee/buyer/lender
  properties: PropertyInfo[];
}

export interface PartyInfo {
  name: string;
  role: string;
  address?: string;
  city?: string;
  state?: string;
}

export interface PropertyInfo {
  bbl: BBL;
  streetNumber: string;
  streetName: string;
  unit: string;
  propertyType: string;
}

/** Result from address lookup */
export interface AddressLookupResult {
  address: string;
  bbl: BBL;
  transactions: PropertyTransaction[];
}

/** Result from owner search */
export interface OwnerSearchResult {
  searchName: string;
  results: PropertyTransaction[];
}
