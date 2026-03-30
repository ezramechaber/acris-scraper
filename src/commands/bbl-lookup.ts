import ora from "ora";
import { geocodeAddress } from "../api/geosearch-client.js";
import { formatBBLResult } from "../formatters/table.js";
import { formatJSON } from "../formatters/json.js";

export async function bblLookupCommand(
  address: string,
  options: { format?: string }
) {
  const spinner = ora(`Geocoding "${address}"...`).start();

  try {
    const results = await geocodeAddress(address);
    spinner.stop();

    if (options.format === "json") {
      console.log(formatJSON(results));
      return;
    }

    for (let i = 0; i < results.length; i++) {
      if (i > 0) console.log("");
      if (results.length > 1) {
        console.log(`--- Result ${i + 1} of ${results.length} ---`);
      }
      console.log(formatBBLResult(results[i]));
    }
  } catch (err) {
    spinner.fail((err as Error).message);
    process.exit(1);
  }
}
