import ora from "ora";
import { lookupByAddress } from "../services/property-lookup.js";
import { getCurrentOwner } from "../services/owner-synthesis.js";
import { getPlutoRecord } from "../api/pluto-client.js";
import {
  formatPropertyHeader,
  formatTransactionsTable,
} from "../formatters/table.js";
import { formatJSON } from "../formatters/json.js";
import { transactionsToCSV } from "../formatters/csv.js";

interface AddressOptions {
  type?: string;
  since?: string;
  limit?: string;
  format?: string;
}

export async function addressCommand(
  address: string,
  options: AddressOptions
) {
  const spinner = ora(`Looking up "${address}"...`).start();

  try {
    const result = await lookupByAddress(address, {
      docType: options.type?.toUpperCase(),
      since: options.since,
      limit: options.limit ? parseInt(options.limit, 10) : undefined,
    });

    spinner.text = "Fetching property details...";
    const [owner, pluto] = await Promise.all([
      getCurrentOwner(result.bbl),
      getPlutoRecord(result.bbl),
    ]);
    spinner.stop();

    if (options.format === "json") {
      console.log(formatJSON({ ...result, currentOwner: owner, pluto }));
      return;
    }

    if (options.format === "csv") {
      console.log(transactionsToCSV(result.transactions));
      return;
    }

    console.log(formatPropertyHeader(result.address, result.bbl, owner, pluto));
    console.log(formatTransactionsTable(result.transactions));
  } catch (err) {
    spinner.fail((err as Error).message);
    process.exit(1);
  }
}
