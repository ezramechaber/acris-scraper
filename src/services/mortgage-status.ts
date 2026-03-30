import { DATASETS } from "../api/datasets.js";
import { sodaQuery } from "../api/soda-client.js";
import type { MasterRecord } from "../models/types.js";

/** Satisfaction/discharge doc types */
const SAT_TYPES = ["SAT", "SATI"];

interface ReferenceRecord {
  document_id: string;
  reference_by_crfn_: string;
  reference_by_doc_id: string;
}

export interface MortgageStatus {
  documentId: string;
  crfn: string;
  amount: number;
  date: string;
  satisfied: boolean;
  satisfactionDate?: string;
  satisfactionDocId?: string;
}

/**
 * Given a list of mortgage document IDs, check which have been satisfied
 * by looking for SAT documents that reference them.
 */
export async function checkMortgageSatisfactions(
  mortgageDocIds: string[],
  mortgageCrfns: string[]
): Promise<Map<string, { satisfied: boolean; satDate?: string; satDocId?: string }>> {
  const result = new Map<string, { satisfied: boolean; satDate?: string; satDocId?: string }>();

  if (mortgageDocIds.length === 0) return result;

  // Initialize all as unsatisfied
  for (const id of mortgageDocIds) {
    result.set(id, { satisfied: false });
  }

  // Search references for any document that references our mortgage doc IDs
  const docIdClause = mortgageDocIds.map((id) => `'${id}'`).join(",");
  const refsByDocId = await sodaQuery<ReferenceRecord>(DATASETS.REFERENCES, {
    $where: `reference_by_doc_id IN(${docIdClause})`,
    $limit: 500,
  });

  // Also search by CRFN if available
  const validCrfns = mortgageCrfns.filter((c) => c && c !== "0");
  let refsByCrfn: ReferenceRecord[] = [];
  if (validCrfns.length > 0) {
    const crfnClause = validCrfns.map((c) => `'${c}'`).join(",");
    refsByCrfn = await sodaQuery<ReferenceRecord>(DATASETS.REFERENCES, {
      $where: `reference_by_crfn_ IN(${crfnClause})`,
      $limit: 500,
    });
  }

  // Collect all referencing document IDs
  const allRefs = [...refsByDocId, ...refsByCrfn];
  if (allRefs.length === 0) return result;

  const refDocIds = [...new Set(allRefs.map((r) => r.document_id))];
  const refDocIdClause = refDocIds.map((id) => `'${id}'`).join(",");
  const satTypesClause = SAT_TYPES.map((t) => `'${t}'`).join(",");

  // Check which referencing documents are satisfactions
  const satDocs = await sodaQuery<MasterRecord>(DATASETS.MASTER, {
    $where: `document_id IN(${refDocIdClause}) AND doc_type IN(${satTypesClause})`,
    $limit: 500,
  });

  // Map satisfaction docs back to the original mortgage
  const satDocIdSet = new Set(satDocs.map((d) => d.document_id));

  for (const ref of allRefs) {
    if (!satDocIdSet.has(ref.document_id)) continue;

    const satDoc = satDocs.find((d) => d.document_id === ref.document_id);

    // Find which mortgage this satisfaction references
    const referencedDocId = ref.reference_by_doc_id;
    const referencedCrfn = ref.reference_by_crfn_;

    // Match by doc_id
    if (referencedDocId && result.has(referencedDocId)) {
      result.set(referencedDocId, {
        satisfied: true,
        satDate: satDoc?.document_date,
        satDocId: ref.document_id,
      });
    }

    // Match by CRFN
    if (referencedCrfn) {
      const matchIdx = mortgageCrfns.indexOf(referencedCrfn);
      if (matchIdx !== -1) {
        const matchedDocId = mortgageDocIds[matchIdx];
        result.set(matchedDocId, {
          satisfied: true,
          satDate: satDoc?.document_date,
          satDocId: ref.document_id,
        });
      }
    }
  }

  return result;
}
