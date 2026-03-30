import ora from "ora";
import { lookupByBBL } from "../services/property-lookup.js";
import { getCurrentOwner } from "../services/owner-synthesis.js";
import { getPlutoRecord } from "../api/pluto-client.js";
import { parseBBLArgs, displayBBL } from "../utils/bbl.js";
import {
  formatPropertyHeader,
  formatTransactionsTable,
} from "../formatters/table.js";
import { formatJSON } from "../formatters/json.js";
import { transactionsToCSV } from "../formatters/csv.js";

interface PropertyOptions {
  type?: string;
  since?: string;
  limit?: string;
  format?: string;
}

export async function propertyCommand(
  args: string[],
  options: PropertyOptions
) {
  let bbl;
  try {
    bbl = parseBBLArgs(args);
  } catch (err) {
    console.error((err as Error).message);
    process.exit(1);
  }

  const spinner = ora(`Looking up BBL ${displayBBL(bbl)}...`).start();

  try {
    const [transactions, owner, pluto] = await Promise.all([
      lookupByBBL(bbl, {
        docType: options.type?.toUpperCase(),
        since: options.since,
        limit: options.limit ? parseInt(options.limit, 10) : undefined,
      }),
      getCurrentOwner(bbl),
      getPlutoRecord(bbl),
    ]);
    spinner.stop();

    const label = pluto?.address
      ? `${pluto.address}, ${pluto.borough}`
      : displayBBL(bbl);

    if (options.format === "json") {
      console.log(formatJSON({ bbl, currentOwner: owner, pluto, transactions }));
      return;
    }

    if (options.format === "csv") {
      console.log(transactionsToCSV(transactions));
      return;
    }

    console.log(formatPropertyHeader(label, bbl, owner, pluto));
    console.log(formatTransactionsTable(transactions));
  } catch (err) {
    spinner.fail((err as Error).message);
    process.exit(1);
  }
}
