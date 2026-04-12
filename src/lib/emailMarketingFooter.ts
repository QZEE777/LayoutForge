/** Required footer for marketing / lifecycle nurture emails (Phase 2). */
export const MARKETING_UNSUBSCRIBE_FOOTER_TEXT =
  "You're receiving this because you used manu2print.com — unsubscribe at https://www.manu2print.com/unsubscribe";

export function marketingUnsubscribeFooterHtml(): string {
  return `<p style="font-size:12px;color:#9B8E7E;line-height:1.6;margin:24px 0 0;border-top:1px solid #E0D8C4;padding-top:16px;">
  You're receiving this because you used manu2print.com —
  <a href="https://www.manu2print.com/unsubscribe" style="color:#F05A28;">unsubscribe</a>.
</p>`;
}
