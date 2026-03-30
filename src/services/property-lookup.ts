import { DATASETS } from "../api/datasets.js";
import { sodaQuery } from "../api/soda-client.js";
import { geocodeAddress } from "../api/geosearch-client.js";
import { resolveDocType, getPartyRoles } from "./code-resolver.js";
import { validateBBLForAcris, type BBL } from "../utils/bbl.js";
import type {
  MasterRecord,
  PartyRecord,
  LegalRecord,
  PropertyTransaction,
  PartyInfo,
  PropertyInfo,
  AddressLookupResult,
} from "../models/types.js";

export interface LookupOptions {
  docType?: string; // filter: "DEED", "MTGE", etc.
  since?: string; // ISO date
  limit?: number;
}

export async function lookupByAddress(
  address: string,
  opts: LookupOptions = {}
): Promise<AddressLookupResult> {
  const geoResults = await geocodeAddress(address);
  const top = geoResults[0];

  validateBBLForAcris(top.bbl);

  const transactions = await lookupByBBL(top.bbl, opts);
  return {
    address: top.label,
    bbl: top.bbl,
    transactions,
  };
}

export async function lookupByBBL(
  bbl: BBL,
  opts: LookupOptions = {}
): Promise<PropertyTransaction[]> {
  validateBBLForAcris(bbl);

  // Step 1: Find all document_ids for this property
  const legals = await sodaQuery<LegalRecord>(DATASETS.LEGALS, {
    $where: `borough='${bbl.borough}' AND block=${bbl.block} AND lot=${bbl.lot}`,
    $limit: opts.limit ?? 50,
    $order: "good_through_date DESC",
  });

  if (legals.length === 0) {
    return [];
  }

  const docIds = [...new Set(legals.map((l) => l.document_id))];

  return assembleTransactions(docIds, opts);
}

export async function assembleTransactions(
  docIds: string[],
  opts: LookupOptions = {}
): Promise<PropertyTransaction[]> {
  if (docIds.length === 0) return [];

  // Batch document IDs for queries (SODA has URL length limits)
  const batchSize = 50;
  const batches: string[][] = [];
  for (let i = 0; i < docIds.length; i += batchSize) {
    batches.push(docIds.slice(i, i + batchSize));
  }

  const allMaster: MasterRecord[] = [];
  const allParties: PartyRecord[] = [];
  const allLegals: LegalRecord[] = [];

  for (const batch of batches) {
    const inClause = batch.map((id) => `'${id}'`).join(",");

    let masterWhere = `document_id IN(${inClause})`;
    if (opts.docType) {
      masterWhere += ` AND doc_type='${opts.docType}'`;
    }
    if (opts.since) {
      masterWhere += ` AND document_date>='${opts.since}'`;
    }

    const [master, parties, legals] = await Promise.all([
      sodaQuery<MasterRecord>(DATASETS.MASTER, {
        $where: masterWhere,
        $limit: 1000,
        $order: "document_date DESC",
      }),
      sodaQuery<PartyRecord>(DATASETS.PARTIES, {
        $where: `document_id IN(${inClause})`,
        $limit: 2000,
      }),
      sodaQuery<LegalRecord>(DATASETS.LEGALS, {
        $where: `document_id IN(${inClause})`,
        $limit: 1000,
      }),
    ]);

    allMaster.push(...master);
    allParties.push(...parties);
    allLegals.push(...legals);
  }

  // Group parties and legals by document_id
  const partiesByDoc = groupBy(allParties, "document_id");
  const legalsByDoc = groupBy(allLegals, "document_id");

  // Assemble transactions
  const transactions: PropertyTransaction[] = [];
  for (const doc of allMaster) {
    const docParties = partiesByDoc.get(doc.document_id) ?? [];
    const docLegals = legalsByDoc.get(doc.document_id) ?? [];
    const roles = getPartyRoles(doc.doc_type);

    const party1: PartyInfo[] = docParties
      .filter((p) => p.party_type === "1")
      .map((p) => ({
        name: p.name,
        role: roles.party1Role,
        address: [p.address_1, p.address_2].filter(Boolean).join(", "),
        city: p.city,
        state: p.state,
      }));

    const party2: PartyInfo[] = docParties
      .filter((p) => p.party_type === "2")
      .map((p) => ({
        name: p.name,
        role: roles.party2Role,
        address: [p.address_1, p.address_2].filter(Boolean).join(", "),
        city: p.city,
        state: p.state,
      }));

    const properties: PropertyInfo[] = docLegals.map((l) => ({
      bbl: {
        borough: parseInt(l.borough, 10),
        block: parseInt(l.block, 10),
        lot: parseInt(l.lot, 10),
      },
      streetNumber: l.street_number ?? "",
      streetName: l.street_name ?? "",
      unit: l.unit ?? "",
      propertyType: l.property_type ?? "",
    }));

    transactions.push({
      documentId: doc.document_id,
      docType: doc.doc_type,
      docTypeDescription: resolveDocType(doc.doc_type),
      documentDate: doc.document_date,
      recordedDate: doc.recorded_datetime,
      amount: parseFloat(doc.document_amt) || 0,
      percentTransferred: parseFloat(doc.percent_trans) || 0,
      party1,
      party2,
      properties,
    });
  }

  // Sort by date descending
  transactions.sort(
    (a, b) =>
      new Date(b.documentDate).getTime() -
      new Date(a.documentDate).getTime()
  );

  return transactions;
}

function groupBy<T>(arr: T[], key: keyof T): Map<string, T[]> {
  const map = new Map<string, T[]>();
  for (const item of arr) {
    const k = String(item[key]);
    const group = map.get(k);
    if (group) {
      group.push(item);
    } else {
      map.set(k, [item]);
    }
  }
  return map;
}
