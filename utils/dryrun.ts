export function dryRunLog(dryrun: boolean): string {
  return `${dryrun ? "DRY RUN " : ""}`;
}
