import { DATASETS } from "../api/datasets.js";
import { sodaQuery } from "../api/soda-client.js";
import { checkMortgageSatisfactions } from "./mortgage-status.js";
import type {
  MasterRecord,
  PartyRecord,
  LegalRecord,
} from "../models/types.js";
import type { BBL } from "../utils/bbl.js";

export interface CurrentOwnerInfo {
  owners: string[];
  deedDate: string;
  deedAmount: number;
  documentId: string;
  mortgage?: {
    amount: number;
    lender: string;
    date: string;
    documentId: string;
    satisfied: boolean;
    satisfactionDate?: string;
  };
}

/** Deed-like doc types that transfer ownership */
const DEED_TYPES = ["DEED", "DEEDO", "QDEED", "CORRD", "CONDEED", "DEEDP", "TORREN"];

export async function getCurrentOwner(
  bbl: BBL
): Promise<CurrentOwnerInfo | null> {
  const legals = await sodaQuery<LegalRecord>(DATASETS.LEGALS, {
    $where: `borough='${bbl.borough}' AND block=${bbl.block} AND lot=${bbl.lot}`,
    $limit: 200,
    $order: "good_through_date DESC",
  });

  if (legals.length === 0) return null;

  const docIds = [...new Set(legals.map((l) => l.document_id))];
  const inClause = docIds.map((id) => `'${id}'`).join(",");
  const deedTypesClause = DEED_TYPES.map((t) => `'${t}'`).join(",");

  // Find most recent deed
  const deeds = await sodaQuery<MasterRecord>(DATASETS.MASTER, {
    $where: `document_id IN(${inClause}) AND doc_type IN(${deedTypesClause})`,
    $order: "document_date DESC",
    $limit: 1,
  });

  if (deeds.length === 0) return null;

  const deed = deeds[0];

  // Get party2 (buyer/grantee) for this deed
  const parties = await sodaQuery<PartyRecord>(DATASETS.PARTIES, {
    $where: `document_id='${deed.document_id}' AND party_type='2'`,
    $limit: 20,
  });

  const owners = parties.map((p) => p.name).filter(Boolean);

  // Find most recent mortgage
  const mortgages = await sodaQuery<MasterRecord>(DATASETS.MASTER, {
    $where: `document_id IN(${inClause}) AND doc_type IN('MTGE','M&CON','CMTGE')`,
    $order: "document_date DESC",
    $limit: 1,
  });

  let mortgage: CurrentOwnerInfo["mortgage"];
  if (mortgages.length > 0) {
    const mtg = mortgages[0];
    const mtgParties = await sodaQuery<PartyRecord>(DATASETS.PARTIES, {
      $where: `document_id='${mtg.document_id}' AND party_type='2'`,
      $limit: 5,
    });

    // Check satisfaction status
    const satStatus = await checkMortgageSatisfactions(
      [mtg.document_id],
      [mtg.crfn]
    );
    const status = satStatus.get(mtg.document_id);

    mortgage = {
      amount: parseFloat(mtg.document_amt) || 0,
      lender: mtgParties.map((p) => p.name).join(", ") || "UNKNOWN",
      date: mtg.document_date,
      documentId: mtg.document_id,
      satisfied: status?.satisfied ?? false,
      satisfactionDate: status?.satDate,
    };
  }

  return {
    owners,
    deedDate: deed.document_date,
    deedAmount: parseFloat(deed.document_amt) || 0,
    documentId: deed.document_id,
    mortgage,
  };
}
