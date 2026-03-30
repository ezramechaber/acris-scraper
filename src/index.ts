import { Command } from "commander";
import { addressCommand } from "./commands/address.js";
import { bblLookupCommand } from "./commands/bbl-lookup.js";
import { propertyCommand } from "./commands/property.js";
import { ownerCommand } from "./commands/owner.js";
import { documentCommand } from "./commands/document.js";
import { blockCommand } from "./commands/block.js";

const program = new Command();

program
  .name("acris")
  .description("CLI for querying NYC ACRIS property records")
  .version("0.1.0");

// Address → BBL converter
program
  .command("bbl")
  .description("Convert a NYC address to Borough/Block/Lot (BBL)")
  .argument("<address>", "NYC street address to geocode")
  .option("-f, --format <format>", "Output format: table, json", "table")
  .action(bblLookupCommand);

// Address → property records
program
  .command("address")
  .description("Look up property records by street address")
  .argument("<address>", "NYC street address")
  .option("-t, --type <type>", "Filter by doc type: DEED, MTGE, etc.")
  .option("-s, --since <date>", "Only show documents after date (YYYY-MM-DD)")
  .option("-l, --limit <n>", "Max results", "20")
  .option("-f, --format <format>", "Output format: table, json, csv", "table")
  .action(addressCommand);

// BBL → property records
program
  .command("property")
  .description("Look up property records by BBL (Borough/Block/Lot)")
  .argument("<args...>", "BBL as 10-digit string or <borough> <block> <lot>")
  .option("-t, --type <type>", "Filter by doc type: DEED, MTGE, etc.")
  .option("-s, --since <date>", "Only show documents after date (YYYY-MM-DD)")
  .option("-l, --limit <n>", "Max results", "20")
  .option("-f, --format <format>", "Output format: table, json, csv", "table")
  .action(propertyCommand);

// Owner/party name search
program
  .command("owner")
  .description("Search property records by owner/party name")
  .argument("<name>", "Person or entity name to search")
  .option(
    "-t, --type <type>",
    "Party role: buyer, seller, borrower, lender"
  )
  .option("-d, --doc-type <type>", "Filter by doc type: DEED, MTGE, etc.")
  .option("-s, --since <date>", "Only show documents after date (YYYY-MM-DD)")
  .option("-l, --limit <n>", "Max results", "20")
  .option("-f, --format <format>", "Output format: table, json, csv", "table")
  .action(ownerCommand);

// Block-level search
program
  .command("block")
  .description("Show all recent transactions on a block")
  .argument("<borough>", "Borough: manhattan/mn/1, bronx/bx/2, brooklyn/bk/3, queens/qn/4")
  .argument("<block>", "Block number")
  .option("-t, --type <type>", "Filter by doc type: DEED, MTGE, etc.")
  .option("-s, --since <date>", "Only show documents after date (YYYY-MM-DD)")
  .option("-l, --limit <n>", "Max results", "30")
  .option("-f, --format <format>", "Output format: table, json", "table")
  .action(blockCommand);

// Document detail
program
  .command("document")
  .description("Get full details for a specific ACRIS document")
  .argument("<document_id>", "ACRIS document ID")
  .option("-f, --format <format>", "Output format: table, json", "table")
  .action(documentCommand);

program.parse();
