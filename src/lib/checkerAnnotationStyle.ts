/**
 * Checker on-page highlights — keep in sync with kdp-preflight-engine
 * `app/tasks/annotate_pdf.py` (_CRITICAL_COLOR, _WARNING_COLOR as RGB 0–1).
 */
export const CHECKER_OVERLAY_CRITICAL_HEX = "#FF0000";
/** ~ rgb(255, 140, 0) — matches PyMuPDF (1.0, 0.55, 0.0) in annotate_pdf.py */
export const CHECKER_OVERLAY_WARNING_HEX = "#FF8C00";

/** Summary page + UI “ready” strip — same as download page `KDP_DISPLAY_PASS_THRESHOLD`. */
export const CHECKER_ANNOTATION_PASS_THRESHOLD = 95;
