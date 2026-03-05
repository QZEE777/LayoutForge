# Migrate layoutforge (manu2print) to a New Laptop

Use this to move the project without losing work. Do **old laptop** steps first, then **new laptop** steps.

---

## On the OLD laptop (before you switch)

### 1. Make sure everything is pushed

```bash
cd c:\Users\qqfs7\Desktop\layoutforge   # or your project path
git status
git log -1 --oneline
```

- If `git status` shows uncommitted changes, commit and push:
  ```bash
  git add -A
  git commit -m "Pre-migration: save current work"
  git push
  ```
- If you see "Your branch is ahead of 'origin/main'", run `git push`.

### 2. Export your environment variables (secrets)

Your app uses **`.env.local`** (or `.env`). It is **not** in the repo (gitignored). You must carry secrets to the new machine yourself.

**Option A – Copy the file (simplest)**  
- Copy the whole file: `layoutforge\.env.local` (or `.env`) to a **secure** place (USB, password manager, encrypted backup).  
- **Do not** put it in a public repo or chat.

**Option B – Recreate from a list**  
If you prefer not to copy the file, on the new laptop you’ll recreate `.env.local` from the list below (get values from your password manager or Vercel).

Required / used by the app:

| Variable | Where to get it | Used for |
|----------|-----------------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project → Settings → API | Auth, DB |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Same (anon/public key) | Auth (client) |
| `SUPABASE_SERVICE_ROLE_KEY` | Same (service_role, keep secret) | Server APIs, webhooks |
| `ANTHROPIC_API_KEY` | console.anthropic.com | Keyword research, description generator |
| `CLOUDCONVERT_API_KEY` | cloudconvert.com/dashboard | Paid PDF/EPUB conversions |
| `LEMONSQUEEZY_API_KEY` | Lemon Squeezy dashboard | Checkout |
| `LEMONSQUEEZY_STORE_ID` | Same | Checkout |
| `LEMONSQUEEZY_SINGLE_USE_VARIANT_ID` | Product variant (e.g. $7 one-time) | Checkout |
| `LEMONSQUEEZY_SUBSCRIPTION_VARIANT_ID` | Product variant (e.g. 6‑month) | Checkout |
| `LEMONSQUEEZY_WEBHOOK_SECRET` | Lemon Squeezy → Settings → Webhooks | Webhook verification |
| `NEXT_PUBLIC_APP_URL` | Your live URL (e.g. https://layout-forge.vercel.app) | Redirects, auth callback |
| `ADMIN_PASSWORD_MANU2` | You choose | /admin and admin API |
| `ADMIN_SECRET` | You choose | Admin API header auth |
| `BETA_ACCESS_CODE` | You choose (e.g. MANU2PRINT-BETA) | Beta bypass |
| `ENCRYPTION_KEY` | 32‑char string (e.g. `node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"`) | Download tokens / encryption |
| `PAYWALL_ACTIVE` | `false` or `true` | Enforce usage limits |
| `NEXT_PUBLIC_PAYWALL_ACTIVE` | `false` or `true` | Show upgrade banner |

Use **`.env.example`** in the repo as the template; it has the same variable names and short notes.

### 3. Optional: backup Cursor rules

The repo already contains `.cursor/rules/` (scribestack-working-style.mdc, layoutforge-stack-and-security.mdc). If you use **other** Cursor rules or settings that live **outside** the repo (e.g. under your user folder), back those up too so you can restore them on the new machine.

---

## On the NEW laptop

### 1. Install prerequisites

- **Node.js** – LTS (v20 or v22). Check: `node -v`
- **npm** – comes with Node. Check: `npm -v`
- **Git** – Check: `git --version`

### 2. Clone the repo

```bash
git clone https://github.com/QZEE777/LayoutForge.git
cd LayoutForge
```

(If you use SSH: `git clone git@github.com:QZEE777/LayoutForge.git`)

### 3. Install dependencies

```bash
npm install
```

### 4. Environment variables

- **If you copied `.env.local`:** put it in the project root: `LayoutForge\.env.local`
- **If you’re recreating:** copy `.env.example` to `.env.local` and fill in every value (see table above). Get live values from Vercel (Project → Settings → Environment Variables) or your password manager.

Never commit `.env.local` or paste secrets into the repo.

### 5. Run the app

```bash
npm run dev
```

Open `http://localhost:3000`. If you see the manu2print home page and can open Tools, env is wired.

### 6. Vercel (production)

- The same GitHub repo is already connected to Vercel; pushes to `main` will keep deploying.
- If you use the Vercel CLI (`vercel link`, `vercel env pull`), run `vercel link` in the project and, if you want local env from Vercel, `vercel env pull .env.local` (back up existing `.env.local` first).

### 7. Restore AI/project context in Cursor

- Open the project in Cursor: **File → Open Folder → LayoutForge**.
- The repo’s `.cursor/rules` will apply (manu2print working style, stack & security).
- To give the AI full project context in a new chat, open **`docs/CONTINUE-PROJECT.md`** and paste the “Prompt for Cursor” block into the first message (see that file).

---

## Checklist

**Old laptop**  
- [ ] `git status` clean, all changes pushed  
- [ ] `.env.local` (or full env list) saved somewhere secure  

**New laptop**  
- [ ] Node, npm, Git installed  
- [ ] Repo cloned, `npm install`, `npm run dev` runs  
- [ ] `.env.local` in project root and app loads  
- [ ] Opened project in Cursor, optionally used `docs/CONTINUE-PROJECT.md` in a new chat  

---

## If something goes wrong

- **Build errors:** Run `npm run build` and fix TypeScript/ESLint errors; ensure Node version is LTS.
- **Auth/DB errors:** Check Supabase URL and keys; ensure Supabase project is running and migrations applied (see README / Supabase docs).
- **Missing env:** Compare your `.env.local` to `.env.example`; every variable listed in the table above should be set for full functionality.
