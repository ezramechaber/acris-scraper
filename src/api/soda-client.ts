import { datasetUrl } from "./datasets.js";

export interface SodaQueryParams {
  $where?: string;
  $select?: string;
  $limit?: number;
  $offset?: number;
  $order?: string;
  $group?: string;
  $q?: string;
}

let appToken: string | undefined;

export function setAppToken(token: string): void {
  appToken = token;
}

export async function sodaQuery<T>(
  datasetId: string,
  params: SodaQueryParams = {}
): Promise<T[]> {
  const url = new URL(datasetUrl(datasetId));

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) {
      url.searchParams.set(key, String(value));
    }
  }

  const token = appToken ?? process.env.ACRIS_APP_TOKEN;
  const headers: Record<string, string> = {
    Accept: "application/json",
  };
  if (token) {
    headers["X-App-Token"] = token;
  }

  const res = await fetch(url.toString(), { headers });

  if (res.status === 429) {
    throw new Error(
      "Rate limited by NYC Open Data. Set an app token with `acris config set token <token>` or env var ACRIS_APP_TOKEN."
    );
  }
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`SODA API error ${res.status}: ${body}`);
  }

  return (await res.json()) as T[];
}

/** Paginate through all results for a query */
export async function sodaQueryAll<T>(
  datasetId: string,
  params: SodaQueryParams = {},
  maxPages = 10
): Promise<T[]> {
  const pageSize = params.$limit ?? 1000;
  const results: T[] = [];

  for (let page = 0; page < maxPages; page++) {
    const pageParams = {
      ...params,
      $limit: pageSize,
      $offset: (params.$offset ?? 0) + page * pageSize,
    };
    const batch = await sodaQuery<T>(datasetId, pageParams);
    results.push(...batch);
    if (batch.length < pageSize) break;
  }

  return results;
}
