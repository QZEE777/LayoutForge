/**
 * Shared KDP checker scoring logic.
 * Mirrors the calculatedScore algorithm on the download page so that
 * verify, card, and OG card all show the same number as the report page.
 *
 * Only applies to checker flow (outputType === "checker") scans that have
 * issuesEnriched populated. Returns null otherwise — callers fall back to
 * stored readinessScore100 or DB readiness_score.
 */
export function computeCheckerScore(
  issuesEnriched:
    | Array<{ humanMessage: string; fixDifficulty?: string; severity?: string }>
    | undefined
    | null
): number | null {
  if (!issuesEnriched) return null;

  // Deduplicate by humanMessage — same issue on many pages counts once
  const uniqueByMessage = new Map<string, { fixDifficulty?: string; severity?: string }>();
  for (const i of issuesEnriched) {
    if (!uniqueByMessage.has(i.humanMessage)) {
      uniqueByMessage.set(i.humanMessage, {
        fixDifficulty: i.fixDifficulty,
        severity: i.severity,
      });
    }
  }

  const unique = Array.from(uniqueByMessage.values());
  const criticalCount = unique.filter(
    (i) => i.fixDifficulty === "advanced" || i.severity === "critical" || i.severity === "error"
  ).length;
  const moderateCount = unique.filter((i) => i.fixDifficulty === "moderate").length;
  const easyCount = unique.length - criticalCount - moderateCount;

  return unique.length === 0
    ? 95
    : Math.max(5, Math.min(100, 100 - criticalCount * 15 - moderateCount * 8 - easyCount * 3));
}
