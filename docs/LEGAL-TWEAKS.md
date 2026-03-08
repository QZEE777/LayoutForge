# Legal pages — what to tweak before publish

The Terms, Privacy, and Cookie policies are drafted using competitor/SaaS best practices. **You should review and tweak for your use**; consider legal review before going live.

## Placeholders to replace

| Where | Placeholder | Replace with |
|-------|-------------|-------------|
| **Terms**, **Privacy**, **Cookies** | `Last updated: [DATE — tweak before publish]` | Actual date, e.g. `6 March 2026` |
| **Terms** §13 Governing law | `[Jurisdiction — e.g. the State of Delaware, USA]` | **Recommended:** USA (e.g. Delaware) when most customers are US. See `docs/LEGAL-JURISDICTION-SA-NZ-USA.md` for SA/NZ vs USA. |

## Optional tweaks

- **Terms:** Add or adjust arbitration/class-action waiver if desired; confirm refund section matches your Refund Policy wording.
- **Privacy:** Add specific retention periods (e.g. “files deleted within 24 hours”) if you want to commit to them; add DPA link if you offer one for enterprise.
- **Cookies:** When you add analytics (e.g. Vercel Analytics, Plausible), list them in §2 and add consent mechanism if required (e.g. EU).
- **Contact:** Ensure `/contact` or the linked email is the right address for legal/privacy requests.

## Routes (already linked in footer)

- `/legal` — index of legal docs  
- `/terms` — Terms & Conditions  
- `/privacy` — Privacy Policy  
- `/cookies` — Cookie Policy  
- `/refunds` — Refund Policy (content still “coming soon”; add when ready)
