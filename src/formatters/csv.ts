import type { PropertyTransaction } from "../models/types.js";
import { formatBBL } from "../utils/bbl.js";

export function transactionsToCSV(
  transactions: PropertyTransaction[]
): string {
  const headers = [
    "document_id",
    "doc_type",
    "doc_type_description",
    "document_date",
    "recorded_date",
    "amount",
    "percent_transferred",
    "party1_names",
    "party1_role",
    "party2_names",
    "party2_role",
    "bbl",
    "address",
  ];

  const rows = transactions.map((tx) => {
    const bbl = tx.properties[0]
      ? formatBBL(tx.properties[0].bbl)
      : "";
    const address = tx.properties
      .map((p) =>
        [p.streetNumber, p.streetName].filter(Boolean).join(" ")
      )
      .join("; ");

    return [
      tx.documentId,
      tx.docType,
      tx.docTypeDescription,
      tx.documentDate ? new Date(tx.documentDate).toISOString().slice(0, 10) : "",
      tx.recordedDate ? new Date(tx.recordedDate).toISOString().slice(0, 10) : "",
      tx.amount,
      tx.percentTransferred,
      csvEscape(tx.party1.map((p) => p.name).join("; ")),
      tx.party1[0]?.role ?? "",
      csvEscape(tx.party2.map((p) => p.name).join("; ")),
      tx.party2[0]?.role ?? "",
      bbl,
      csvEscape(address),
    ].join(",");
  });

  return [headers.join(","), ...rows].join("\n");
}

function csvEscape(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
