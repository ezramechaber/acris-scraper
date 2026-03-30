import { DATASETS } from "../api/datasets.js";
import { sodaQuery } from "../api/soda-client.js";
import { assembleTransactions } from "./property-lookup.js";
import type { PartyRecord, PropertyTransaction } from "../models/types.js";

export interface PartySearchOptions {
  partyType?: "1" | "2"; // 1=grantor/seller, 2=grantee/buyer
  docType?: string;
  since?: string;
  borough?: number;
  limit?: number;
}

export async function searchByPartyName(
  name: string,
  opts: PartySearchOptions = {}
): Promise<PropertyTransaction[]> {
  const sanitized = name.toUpperCase().replace(/'/g, "''");

  let where = `name LIKE '%${sanitized}%'`;
  if (opts.partyType) {
    where += ` AND party_type='${opts.partyType}'`;
  }

  const parties = await sodaQuery<PartyRecord>(DATASETS.PARTIES, {
    $where: where,
    $limit: opts.limit ?? 50,
    $order: "good_through_date DESC",
  });

  if (parties.length === 0) {
    return [];
  }

  const docIds = [...new Set(parties.map((p) => p.document_id))];

  return assembleTransactions(docIds, {
    docType: opts.docType,
    since: opts.since,
  });
}
