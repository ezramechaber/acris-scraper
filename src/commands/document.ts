import ora from "ora";
import { assembleTransactions } from "../services/property-lookup.js";
import { formatDocumentDetail } from "../formatters/table.js";
import { formatJSON } from "../formatters/json.js";

interface DocumentOptions {
  format?: string;
}

export async function documentCommand(
  documentId: string,
  options: DocumentOptions
) {
  const spinner = ora(`Fetching document ${documentId}...`).start();

  try {
    const transactions = await assembleTransactions([documentId]);
    spinner.stop();

    if (transactions.length === 0) {
      console.log(`No document found with ID: ${documentId}`);
      process.exit(1);
    }

    if (options.format === "json") {
      console.log(formatJSON(transactions[0]));
      return;
    }

    console.log(formatDocumentDetail(transactions[0]));
  } catch (err) {
    spinner.fail((err as Error).message);
    process.exit(1);
  }
}
