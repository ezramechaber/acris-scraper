import ora from "ora";
import { searchByPartyName } from "../services/party-search.js";
import { formatOwnerResults } from "../formatters/table.js";
import { formatJSON } from "../formatters/json.js";
import { transactionsToCSV } from "../formatters/csv.js";

interface OwnerOptions {
  type?: string;
  docType?: string;
  since?: string;
  limit?: string;
  format?: string;
}

const PARTY_TYPE_MAP: Record<string, "1" | "2"> = {
  seller: "1",
  grantor: "1",
  borrower: "1",
  buyer: "2",
  grantee: "2",
  lender: "2",
};

export async function ownerCommand(
  name: string,
  options: OwnerOptions
) {
  const spinner = ora(`Searching for "${name}"...`).start();

  try {
    const results = await searchByPartyName(name, {
      partyType: options.type
        ? PARTY_TYPE_MAP[options.type.toLowerCase()]
        : undefined,
      docType: options.docType?.toUpperCase(),
      since: options.since,
      limit: options.limit ? parseInt(options.limit, 10) : undefined,
    });
    spinner.stop();

    if (options.format === "json") {
      console.log(formatJSON(results));
      return;
    }

    if (options.format === "csv") {
      console.log(transactionsToCSV(results));
      return;
    }

    console.log(formatOwnerResults(name, results));
  } catch (err) {
    spinner.fail((err as Error).message);
    process.exit(1);
  }
}
