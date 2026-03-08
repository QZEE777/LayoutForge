# ROE Protocol — Rules of Engagement

Step-by-step protocol for working on manu2print. Follow in order unless a step says otherwise.

---

## 1. Before any change

| Step | Action |
|------|--------|
| 1.1 | **Security first.** No hardcoded secrets, no logging of keys/tokens. User input validated; no path traversal or injection. |
| 1.2 | **Conflicts.** For large or design-wide changes: detect conflicts (existing behavior, routes, data), document in a short plan, **integrate only after your confirmation.** |
| 1.3 | **Scope.** Don’t over-engineer. Prefer clarity, trust, and working tools. |

---

## 2. Making changes

| Step | Action |
|------|--------|
| 2.1 | Change only what’s needed. Prefer editing existing files over new ones. |
| 2.2 | Keep existing technical architecture (routes, auth, payment, storage) unless you explicitly ask to change it. |
| 2.3 | After edits: run linter on changed files; fix any new errors. |

---

## 3. After changes — push (you run locally)

Terminal from this environment may not run; run these on your machine:

| Step | Command / action |
|------|------------------|
| 3.1 | `cd` to project root (e.g. `C:\Dev\LayoutForge-main` or your path). |
| 3.2 | `git status` — see what’s modified. |
| 3.3 | `git add <files>` or `git add .` (never add `.env`). |
| 3.4 | `git commit -m "Short description of change"`. |
| 3.5 | `git push origin main`. |

---

## 4. Sign-off (CYA)

When you say **“cya”** (or similar goodbye):

| Step | Action |
|------|--------|
| 4.1 | Remind: **Move project folder from OneDrive to C:\Dev** if you haven’t yet (security + avoid sync issues). |
| 4.2 | Keep the reminder to one short sentence unless you ask for steps again. |

*(Rule in `.cursor/rules/user-cya-reminder.mdc` triggers this.)*

---

## 5. References

| Topic | Where |
|-------|--------|
| Security checklist | `docs/SECURITY.md` |
| Legal tweaks / jurisdiction | `docs/LEGAL-TWEAKS.md`, `docs/LEGAL-JURISDICTION-SA-NZ-USA.md` |
| Beta directive / conflicts | `docs/BETA-DIRECTIVE-CONFLICTS-AND-PLAN.md` |
| Manny (bot) | `docs/AI-ASSISTANT-NAME-AND-SETUP.md`, `docs/FAQ-FOR-BOT.md` |
| Product facts for bot | `docs/PRODUCT-FACTS.md` |

---

## 6. Homepage design freeze (MVP beta)

**Do not redesign the homepage again.** The homepage layout and sections are locked for MVP beta. Next priority: stabilize and perfect MVP tool functionality (e.g. Print Ready Check). Content placeholders (testimonials, comparison table) may be replaced with real copy later without changing structure.

---

## 7. Quick ROE summary

1. **Security-driven** — no secrets in code, validate input, safe auth.  
2. **Confirm before big/design changes** — detect conflicts, plan, then integrate on your say-so.  
3. **Push is local** — you run `git add` / `commit` / `push` on your machine.  
4. **CYA** — when you say cya, remind about moving folder off OneDrive if needed.  
5. **Clarity over cleverness** — clear, trustworthy, working tools first.  
6. **Homepage design freeze** — no homepage redesign; focus on tool reliability.
