# acris-cli

CLI for querying NYC ACRIS (Automated City Register Information System) property records. Uses the NYC Open Data SODA API — no scraping, no API key required.

## Install

```sh
npm install
npm run build
npm link  # makes `acris` available globally
```

## Commands

### Look up a property by address

```sh
acris address "350 Fifth Avenue, Manhattan"
acris address "113 3rd Place, Brooklyn" --type DEED --limit 10
```

Shows: current owner, acquisition price, mortgage status (active/satisfied), PLUTO data (zoning, year built, assessed value, sq ft), and full transaction history.

### Convert address to BBL

```sh
acris bbl "350 Fifth Avenue, New York"
```

Returns Borough/Block/Lot for geocoded address.

### Look up by BBL directly

```sh
acris property 1 835 41
acris property 1008350041  # 10-digit BBL string
```

### Search by owner name

```sh
acris owner "SMITH, JOHN"
acris owner "EMPIRE STATE BUILDING" --limit 20
acris owner "SMITH" --type buyer --doc-type DEED
```

### View all transactions on a block

```sh
acris block brooklyn 415 --type DEED
acris block mn 835 --since 2020-01-01
```

### Get full document details

```sh
acris document 2024061300728001
```

## Options

All commands support:

| Flag | Description |
|---|---|
| `-f, --format <fmt>` | Output format: `table`, `json`, `csv` |
| `-t, --type <type>` | Filter by doc type (`DEED`, `MTGE`, etc.) or party role (`buyer`, `seller`) |
| `-s, --since <date>` | Only show documents after date (`YYYY-MM-DD`) |
| `-l, --limit <n>` | Max results |

## Data sources

- **ACRIS** via [NYC Open Data](https://data.cityofnewyork.us) SODA API — deeds, mortgages, parties, satisfactions, liens
- **PLUTO** — zoning, building class, year built, assessed value, lot/building area, units
- **NYC GeoSearch** — address to BBL geocoding

## Coverage

ACRIS covers Manhattan, Bronx, Brooklyn, and Queens. Staten Island uses a separate recording system and is not available.

Pre-2003 records are sparse. Pre-1966 records may have no dollar amounts or addresses.

## App token

Works without an app token (throttled to ~1000 requests/hour). For heavier use, register for a free token at [NYC Open Data](https://data.cityofnewyork.us/profile/edit/developer_settings) and set it:

```sh
export ACRIS_APP_TOKEN=your_token_here
```
