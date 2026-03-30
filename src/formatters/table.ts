import Table from "cli-table3";
import chalk from "chalk";
import type { PropertyTransaction } from "../models/types.js";
import { displayBBL } from "../utils/bbl.js";
import type { BBL } from "../utils/bbl.js";
import type { GeoSearchResult } from "../api/geosearch-client.js";
import type { CurrentOwnerInfo } from "../services/owner-synthesis.js";
import type { PlutoRecord } from "../api/pluto-client.js";

export function formatBBLResult(result: GeoSearchResult): string {
  const lines = [
    chalk.bold("Address: ") + result.label,
    chalk.bold("BBL:     ") + displayBBL(result.bbl),
    chalk.bold("Raw:     ") + result.bblString,
    chalk.bold("Borough: ") + result.borough,
    chalk.bold("Zip:     ") + result.postalcode,
  ];
  return lines.join("\n");
}

export function formatPropertyHeader(
  address: string,
  bbl: BBL,
  owner?: CurrentOwnerInfo | null,
  pluto?: PlutoRecord | null
): string {
  const lines = [
    chalk.bold.underline(`Property: ${address}`),
    chalk.dim(`BBL: ${displayBBL(bbl)}`),
  ];

  if (pluto) {
    const details: string[] = [];
    if (pluto.bldgclass) details.push(`Class: ${pluto.bldgclass}`);
    if (pluto.zonedist1) details.push(`Zoning: ${pluto.zonedist1}`);
    if (pluto.yearbuilt && pluto.yearbuilt !== "0")
      details.push(`Built: ${pluto.yearbuilt}`);
    if (pluto.unitsres && pluto.unitsres !== "0")
      details.push(`Units: ${pluto.unitsres}`);
    if (pluto.lotarea && pluto.lotarea !== "0")
      details.push(`Lot: ${parseInt(pluto.lotarea).toLocaleString()} sqft`);
    if (pluto.bldgarea && pluto.bldgarea !== "0")
      details.push(`Bldg: ${parseInt(pluto.bldgarea).toLocaleString()} sqft`);
    if (details.length > 0) lines.push(chalk.dim(details.join(" | ")));

    const values: string[] = [];
    if (pluto.assesstot && pluto.assesstot !== "0")
      values.push(
        `Assessed: $${parseInt(pluto.assesstot).toLocaleString()}`
      );
    if (pluto.fullval && pluto.fullval !== "0")
      values.push(
        `Market: $${parseInt(pluto.fullval).toLocaleString()}`
      );
    if (values.length > 0) lines.push(chalk.dim(values.join(" | ")));
  }

  if (owner) {
    lines.push("");
    const ownerNames = owner.owners.join(", ") || "UNKNOWN";
    const date = owner.deedDate
      ? new Date(owner.deedDate).toISOString().slice(0, 10)
      : "N/A";
    const amt =
      owner.deedAmount > 0
        ? `$${owner.deedAmount.toLocaleString()}`
        : "N/A";
    lines.push(
      chalk.bold("Current Owner: ") + ownerNames
    );
    lines.push(
      chalk.dim(`  Acquired: ${date} for ${amt}`)
    );

    if (owner.mortgage) {
      const mtgDate = owner.mortgage.date
        ? new Date(owner.mortgage.date).toISOString().slice(0, 10)
        : "N/A";
      const satLabel = owner.mortgage.satisfied
        ? chalk.green(" [SATISFIED]")
        : chalk.yellow(" [ACTIVE]");
      const satDate = owner.mortgage.satisfactionDate
        ? ` discharged ${new Date(owner.mortgage.satisfactionDate).toISOString().slice(0, 10)}`
        : "";
      lines.push(
        chalk.dim(
          `  Mortgage: $${owner.mortgage.amount.toLocaleString()} from ${owner.mortgage.lender} (${mtgDate})`
        ) + satLabel + chalk.dim(satDate)
      );
    }
  }

  lines.push("");
  return lines.join("\n");
}

export function formatTransactionsTable(
  transactions: PropertyTransaction[]
): string {
  if (transactions.length === 0) {
    return chalk.yellow("No transactions found.");
  }

  const table = new Table({
    head: [
      chalk.cyan("Date"),
      chalk.cyan("Type"),
      chalk.cyan("Amount"),
      chalk.cyan("% Trans"),
      chalk.cyan("From"),
      chalk.cyan("To"),
    ],
    colWidths: [13, 22, 16, 9, 28, 28],
    wordWrap: true,
  });

  for (const tx of transactions) {
    const date = tx.documentDate
      ? new Date(tx.documentDate).toISOString().slice(0, 10)
      : "N/A";

    const amount =
      tx.amount > 0
        ? `$${tx.amount.toLocaleString()}`
        : chalk.dim("$0");

    const pct = tx.percentTransferred
      ? `${tx.percentTransferred}%`
      : "";

    const from = tx.party1.map((p) => p.name).join(", ") || chalk.dim("—");
    const to = tx.party2.map((p) => p.name).join(", ") || chalk.dim("—");

    table.push([
      date,
      `${tx.docType} ${chalk.dim(`(${tx.docTypeDescription})`)}`,
      amount,
      pct,
      from,
      to,
    ]);
  }

  return table.toString();
}

export function formatOwnerResults(
  name: string,
  transactions: PropertyTransaction[]
): string {
  if (transactions.length === 0) {
    return chalk.yellow(`No records found for "${name}".`);
  }

  const header = chalk.bold.underline(
    `Records for "${name}" (${transactions.length} found)`
  );

  const table = new Table({
    head: [
      chalk.cyan("Date"),
      chalk.cyan("Type"),
      chalk.cyan("Property"),
      chalk.cyan("Amount"),
      chalk.cyan("Role"),
      chalk.cyan("Counterparty"),
    ],
    colWidths: [13, 10, 30, 16, 12, 24],
    wordWrap: true,
  });

  for (const tx of transactions) {
    const date = tx.documentDate
      ? new Date(tx.documentDate).toISOString().slice(0, 10)
      : "N/A";

    const amount =
      tx.amount > 0
        ? `$${tx.amount.toLocaleString()}`
        : chalk.dim("$0");

    const prop = tx.properties
      .map((p) => {
        const addr = [p.streetNumber, p.streetName].filter(Boolean).join(" ");
        return addr || displayBBL(p.bbl);
      })
      .join("; ");

    // Determine if the searched name is party1 or party2
    const upperName = name.toUpperCase();
    const isParty1 = tx.party1.some((p) =>
      p.name.toUpperCase().includes(upperName)
    );
    const role = isParty1
      ? tx.party1[0]?.role ?? "PARTY 1"
      : tx.party2[0]?.role ?? "PARTY 2";
    const counterparties = isParty1
      ? tx.party2.map((p) => p.name).join(", ")
      : tx.party1.map((p) => p.name).join(", ");

    table.push([
      date,
      tx.docType,
      prop,
      amount,
      role,
      counterparties || chalk.dim("—"),
    ]);
  }

  return header + "\n" + table.toString();
}

export function formatDocumentDetail(tx: PropertyTransaction): string {
  const lines: string[] = [
    chalk.bold.underline(`Document: ${tx.documentId}`),
    "",
    chalk.bold("Type:     ") +
      `${tx.docType} (${tx.docTypeDescription})`,
    chalk.bold("Date:     ") +
      (tx.documentDate
        ? new Date(tx.documentDate).toISOString().slice(0, 10)
        : "N/A"),
    chalk.bold("Recorded: ") +
      (tx.recordedDate
        ? new Date(tx.recordedDate).toISOString().slice(0, 10)
        : "N/A"),
    chalk.bold("Amount:   ") +
      (tx.amount > 0 ? `$${tx.amount.toLocaleString()}` : "$0"),
    chalk.bold("% Trans:  ") +
      (tx.percentTransferred ? `${tx.percentTransferred}%` : "N/A"),
    "",
  ];

  if (tx.party1.length > 0) {
    lines.push(
      chalk.bold(`${tx.party1[0].role}(s):`),
      ...tx.party1.map(
        (p) =>
          `  ${p.name}${p.address ? ` — ${p.address}` : ""}${p.city ? `, ${p.city}` : ""}${p.state ? ` ${p.state}` : ""}`
      ),
      ""
    );
  }

  if (tx.party2.length > 0) {
    lines.push(
      chalk.bold(`${tx.party2[0].role}(s):`),
      ...tx.party2.map(
        (p) =>
          `  ${p.name}${p.address ? ` — ${p.address}` : ""}${p.city ? `, ${p.city}` : ""} ${p.state ? ` ${p.state}` : ""}`
      ),
      ""
    );
  }

  if (tx.properties.length > 0) {
    lines.push(
      chalk.bold("Properties:"),
      ...tx.properties.map((p) => {
        const addr = [p.streetNumber, p.streetName].filter(Boolean).join(" ");
        return `  ${displayBBL(p.bbl)}${addr ? ` — ${addr}` : ""}${p.unit ? ` Unit ${p.unit}` : ""}${p.propertyType ? ` [${p.propertyType}]` : ""}`;
      })
    );
  }

  return lines.join("\n");
}
