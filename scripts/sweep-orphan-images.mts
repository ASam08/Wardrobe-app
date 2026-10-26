import { sweepOrphans } from "../lib/orphan-sweep"

await sweepOrphans({
  dryRun: process.argv.includes("--dry-run") ? true : undefined,
})
process.exit(0)
