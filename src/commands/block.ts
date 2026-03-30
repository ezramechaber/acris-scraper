import ora from "ora";
import Table from "cli-table3";
import chalk from "chalk";
import { DATASETS } from "../api/datasets.js";
import { sodaQuery } from "../api/soda-client.js";
import { resolveDocType, getPartyRoles } from "../services/code-resolver.js";
import { parseBoroughCode, boroughName } from "../utils/borough.js";
import { formatJSON } from "../formatters/json.js";
import type { MasterRecord, PartyRecord, LegalRecord } from "../models/types.js";

interface BlockOptions {
  type?: string;
  since?: string;
  limit?: string;
  format?: string;
}

export async function blockCommand(
  boroughArg: string,
  blockArg: string,
  options: BlockOptions
) {
  const boroughCode = parseBoroughCode(boroughArg);
  if (!boroughCode || boroughCode > 4) {
    console.error(
      `Invalid borough: "${boroughArg}". Use: manhattan/mn/1, bronx/bx/2, brooklyn/bk/3, queens/qn/4`
    );
    process.exit(1);
  }

  const block = parseInt(blockArg, 10);
  if (isNaN(block)) {
    console.error(`Invalid block number: "${blockArg}"`);
    process.exit(1);
  }

  const spinner = ora(
    `Searching block ${block} in ${boroughName(boroughCode)}...`
  ).start();

  try {
    // Find all documents for this block
    let legalWhere = `borough='${boroughCode}' AND block=${block}`;
    const limit = options.limit ? parseInt(options.limit, 10) : 30;

    const legals = await sodaQuery<LegalRecord>(DATASETS.LEGALS, {
      $where: legalWhere,
      $limit: limit * 2, // over-fetch since multiple legals per doc
      $order: "good_through_date DESC",
    });

    if (legals.length === 0) {
      spinner.stop();
      console.log(chalk.yellow("No records found for this block."));
      return;
    }

    const docIds = [...new Set(legals.map((l) => l.document_id))].slice(
      0,
      limit
    );
    const inClause = docIds.map((id) => `'${id}'`).join(",");

    let masterWhere = `document_id IN(${inClause})`;
    if (options.type) {
      masterWhere += ` AND doc_type='${options.type.toUpperCase()}'`;
    }
    if (options.since) {
      masterWhere += ` AND document_date>='${options.since}'`;
    }

    const [master, parties] = await Promise.all([
      sodaQuery<MasterRecord>(DATASETS.MASTER, {
        $where: masterWhere,
        $limit: 500,
        $order: "document_date DESC",
      }),
      sodaQuery<PartyRecord>(DATASETS.PARTIES, {
        $where: `document_id IN(${inClause})`,
        $limit: 1000,
      }),
    ]);

    spinner.stop();

    // Build a lot→address lookup from legals
    const legalsByDoc = new Map<string, LegalRecord[]>();
    for (const l of legals) {
      const arr = legalsByDoc.get(l.document_id) ?? [];
      arr.push(l);
      legalsByDoc.set(l.document_id, arr);
    }

    const partiesByDoc = new Map<string, PartyRecord[]>();
    for (const p of parties) {
      const arr = partiesByDoc.get(p.document_id) ?? [];
      arr.push(p);
      partiesByDoc.set(p.document_id, arr);
    }

    if (options.format === "json") {
      const results = master.map((doc) => ({
        documentId: doc.document_id,
        docType: doc.doc_type,
        date: doc.document_date,
        amount: parseFloat(doc.document_amt) || 0,
        parties: partiesByDoc.get(doc.document_id) ?? [],
        properties: legalsByDoc.get(doc.document_id) ?? [],
      }));
      console.log(formatJSON(results));
      return;
    }

    console.log(
      chalk.bold.underline(
        `Block ${block}, ${boroughName(boroughCode)} — ${master.length} records`
      )
    );
    console.log("");

    const table = new Table({
      head: [
        chalk.cyan("Date"),
        chalk.cyan("Type"),
        chalk.cyan("Address"),
        chalk.cyan("Lot"),
        chalk.cyan("Amount"),
        chalk.cyan("From"),
        chalk.cyan("To"),
      ],
      colWidths: [13, 10, 22, 6, 16, 22, 22],
      wordWrap: true,
    });

    for (const doc of master) {
      const date = doc.document_date
        ? new Date(doc.document_date).toISOString().slice(0, 10)
        : "N/A";

      const amount =
        parseFloat(doc.document_amt) > 0
          ? `$${parseFloat(doc.document_amt).toLocaleString()}`
          : chalk.dim("$0");

      const docLegals = legalsByDoc.get(doc.document_id) ?? [];
      const addr = docLegals
        .map((l) =>
          [l.street_number, l.street_name].filter(Boolean).join(" ")
        )
        .filter(Boolean)[0] || chalk.dim("—");
      const lot = docLegals[0]?.lot ?? "";

      const docParties = partiesByDoc.get(doc.document_id) ?? [];
      const roles = getPartyRoles(doc.doc_type);
      const from =
        docParties
          .filter((p) => p.party_type === "1")
          .map((p) => p.name)
          .join(", ") || chalk.dim("—");
      const to =
        docParties
          .filter((p) => p.party_type === "2")
          .map((p) => p.name)
          .join(", ") || chalk.dim("—");

      table.push([date, doc.doc_type, addr, lot, amount, from, to]);
    }

    console.log(table.toString());
  } catch (err) {
    spinner.fail((err as Error).message);
    process.exit(1);
  }
}
