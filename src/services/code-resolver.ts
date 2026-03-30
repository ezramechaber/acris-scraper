/**
 * The ACRIS Document Control Codes dataset (7isb-wh4c) has doc__type and
 * doc__type_description columns in its schema, but the SODA API returns them
 * as empty/missing. So we maintain a local map of common doc types.
 */

interface DocTypeInfo {
  description: string;
  party1Role: string;
  party2Role: string;
}

const DOC_TYPE_MAP: Record<string, DocTypeInfo> = {
  // Deeds & Conveyances
  DEED:     { description: "DEED",                        party1Role: "SELLER",    party2Role: "BUYER" },
  DEEDO:    { description: "DEED, OTHER",                 party1Role: "GRANTOR",   party2Role: "GRANTEE" },
  QDEED:    { description: "QUIT CLAIM DEED",             party1Role: "GRANTOR",   party2Role: "GRANTEE" },
  CORRD:    { description: "CORRECTIVE DEED",             party1Role: "GRANTOR",   party2Role: "GRANTEE" },
  CONDEED:  { description: "CONDO UNIT DEED",             party1Role: "SELLER",    party2Role: "BUYER" },
  DEEDP:    { description: "DEED, PRE RPT TAX",           party1Role: "SELLER",    party2Role: "BUYER" },
  TORREN:   { description: "TORRENS DEED",                party1Role: "SELLER",    party2Role: "BUYER" },
  LEAS:     { description: "LEASE",                       party1Role: "LESSOR",    party2Role: "LESSEE" },
  MLEA:     { description: "MEMORANDUM OF LEASE",         party1Role: "LESSOR",    party2Role: "LESSEE" },
  AALR:     { description: "ASSIGNMENT OF LEASE & RENTS", party1Role: "ASSIGNOR",  party2Role: "ASSIGNEE" },

  // Mortgages & Instruments
  MTGE:     { description: "MORTGAGE",                    party1Role: "BORROWER",  party2Role: "LENDER" },
  "M&CON":  { description: "MORTGAGE & CONSOLIDATION",    party1Role: "BORROWER",  party2Role: "LENDER" },
  CMTGE:    { description: "CONDO MORTGAGE",              party1Role: "BORROWER",  party2Role: "LENDER" },
  SAT:      { description: "SATISFACTION OF MORTGAGE",    party1Role: "LENDER",    party2Role: "BORROWER" },
  SMTGE:    { description: "SUBORDINATION OF MORTGAGE",   party1Role: "LENDER",    party2Role: "BORROWER" },
  ASST:     { description: "ASSIGNMENT OF MORTGAGE",      party1Role: "OLD LENDER", party2Role: "NEW LENDER" },
  ASSTO:    { description: "ASSIGNMENT, OTHER",           party1Role: "ASSIGNOR",  party2Role: "ASSIGNEE" },
  SPRD:     { description: "SPREADER",                    party1Role: "BORROWER",  party2Role: "LENDER" },
  AGMT:     { description: "AGREEMENT",                   party1Role: "PARTY 1",   party2Role: "PARTY 2" },
  CORR:     { description: "CORRECTION",                  party1Role: "PARTY 1",   party2Role: "PARTY 2" },

  // Tax & Transfer docs
  RPTT:     { description: "REAL PROPERTY TRANSFER TAX",  party1Role: "SELLER",    party2Role: "BUYER" },
  "RPTT&RET": { description: "RPTT & REAL ESTATE TAX",   party1Role: "SELLER",    party2Role: "BUYER" },
  RETT:     { description: "REAL ESTATE TRANSFER TAX",    party1Role: "SELLER",    party2Role: "BUYER" },

  // Liens & Judgments
  LIEN:     { description: "LIEN",                        party1Role: "DEBTOR",    party2Role: "CREDITOR" },
  FJDG:     { description: "FEDERAL JUDGMENT",            party1Role: "DEBTOR",    party2Role: "CREDITOR" },
  LP:       { description: "LIS PENDENS",                 party1Role: "DEFENDANT", party2Role: "PLAINTIFF" },

  // UCC
  UCCS:     { description: "UCC FILING STATEMENT",        party1Role: "DEBTOR",    party2Role: "SECURED PARTY" },
  UCCA:     { description: "UCC AMENDMENT",               party1Role: "DEBTOR",    party2Role: "SECURED PARTY" },
  UCCT:     { description: "UCC TERMINATION",             party1Role: "DEBTOR",    party2Role: "SECURED PARTY" },

  // Power of Attorney & Other
  PAT:      { description: "POWER OF ATTORNEY",           party1Role: "PRINCIPAL", party2Role: "ATTORNEY" },
  DECL:     { description: "DECLARATION",                 party1Role: "DECLARANT", party2Role: "PARTY 2" },
  CERT:     { description: "CERTIFICATE",                 party1Role: "PARTY 1",   party2Role: "PARTY 2" },
};

export function resolveDocType(docType: string): string {
  return DOC_TYPE_MAP[docType.trim()]?.description ?? docType;
}

export function getPartyRoles(
  docType: string
): { party1Role: string; party2Role: string } {
  const info = DOC_TYPE_MAP[docType.trim()];
  return {
    party1Role: info?.party1Role ?? "PARTY 1",
    party2Role: info?.party2Role ?? "PARTY 2",
  };
}
