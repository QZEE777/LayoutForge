import type { ValidationReport } from "../types";

interface ErrorPanelProps {
  report: ValidationReport;
}

export function ErrorPanel({ report }: ErrorPanelProps) {
  const { page_issues } = report;
  const byPage = new Map<number, typeof page_issues>();
  for (const issue of page_issues) {
    const list = byPage.get(issue.page) ?? [];
    list.push(issue);
    byPage.set(issue.page, list);
  }
  const pages = Array.from(byPage.keys()).sort((a, b) => a - b);

  return (
    <div className="error-panel">
      <h3>Issues by page</h3>
      {pages.length === 0 ? (
        <p style={{ margin: 0, color: "#666" }}>No issues reported.</p>
      ) : (
        pages.map((pageNum) => (
          <div key={pageNum}>
            <div className="page-num" style={{ marginTop: pageNum > 1 ? "0.75rem" : 0 }}>
              Page {pageNum}
            </div>
            {(byPage.get(pageNum) ?? []).map((issue, idx) => (
              <div
                key={`${pageNum}-${issue.rule_id}-${idx}`}
                className={`issue-item ${issue.severity.toLowerCase()}`}
              >
                <span className="rule-id">{issue.rule_id}</span>
                {" — "}
                {issue.message}
              </div>
            ))}
          </div>
        ))
      )}
    </div>
  );
}
