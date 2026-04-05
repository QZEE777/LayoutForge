/**
 * Ready-to-paste social caption for verify links.
 * Uses newlines so narrow “caption preview” boxes wrap cleanly.
 */
export const VERIFY_SHARE_HASHTAGS = "#KDP #IndieAuthor #SelfPublishing";

export function buildVerifyShareCaption(input: {
  isPass: boolean;
  score: number;
  /** Full verify URL, including ?sh= when tracking referrals */
  verifyUrl: string;
  issuesCount?: number | null;
}): string {
  const { isPass, score, verifyUrl, issuesCount } = input;

  if (isPass) {
    return [
      "Just checked my KDP manuscript on manu2print.com",
      "",
      `Scored ${score}/100 — ready for Amazon. ✅`,
      "",
      "Would yours pass? Free check:",
      verifyUrl,
      "",
      VERIFY_SHARE_HASHTAGS,
    ].join("\n");
  }

  const countPhrase =
    typeof issuesCount === "number" && issuesCount > 0
      ? `${issuesCount} issue${issuesCount === 1 ? "" : "s"}`
      : "several issues";

  return [
    `Caught ${countPhrase} in my KDP PDF before uploading to Amazon. 🛑`,
    "Saved myself a rejection.",
    "",
    "Check yours before you submit:",
    verifyUrl,
    "",
    VERIFY_SHARE_HASHTAGS,
  ].join("\n");
}
