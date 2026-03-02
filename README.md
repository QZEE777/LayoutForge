# 🎯 Manu2Print - The Complete Author Publishing Platform

**Transform how authors publish on Amazon KDP** — Professional formatting, metadata optimization, AI analysis, and publishing tools all in one platform.

---

## 📊 Project Status

```
PHASE 1: ✅ COMPLETE - Security Foundation
├── Authentication (Clerk)
├── Encryption (AES-256-GCM)
├── Rate Limiting
├── Protected Dashboard
└── Database Schema

PHASE 2: ⏳ READY - AI Features (Revenue Core)
├── AI Metadata Optimization
├── Competitor Analysis
├── Export for KDP
└── $2.99 per analysis

PHASE 3-5: 📋 PLANNED - Premium Features
```

**Manu2Print KDP (shipped formatter):** One template, one pipeline — [`docs/MANU2PRINT-KDP.md`](docs/MANU2PRINT-KDP.md)  
**Smart Format (AI formatter, future):** Spec and API flow → [`docs/SMART-FORMAT-SPEC.md`](docs/SMART-FORMAT-SPEC.md)

---

## 🚀 Quick Start

### For Development:

```bash
# Install
npm install

# Setup environment (see .env.example)
cp .env.example .env.local

# Run dev server
npm run dev
```

Visit: `http://localhost:3000`

### For Production:

Push to GitHub → Auto-deploys to Vercel

---

## 🔐 Security First

- ✅ Clerk OAuth authentication
- ✅ AES-256-GCM file encryption
- ✅ Rate limiting (100 req/min per IP)
- ✅ Security headers (XSS, CSRF, Clickjacking protection)
- ✅ Input validation & sanitization
- ✅ Audit logging
- ✅ GDPR-compliant

---

## 💡 What Authors Get

### Free Tier
- Upload manuscripts (PDF, DOCX)
- Generate KDP-ready PDF
- Preview text content
- Configure trim sizes & fonts

### Pro Tier ($2.99 per analysis)
- **AI-optimized descriptions** (analyzes full manuscript)
- **Keyword suggestions** (competitor research)
- **Hidden KDP categories** (auto-matched)
- **Copy-paste export** (direct to Amazon)

### Pro+ Tier ($4.99/month)
- Unlimited analyses
- Priority processing
- Cover generator (Phase 5)
- Series management
- Marketing assets generator

---

## 🛠️ Tech Stack

- **Frontend:** Next.js 15, React 19, Tailwind CSS
- **Backend:** Next.js API routes, TypeScript
- **Database:** PostgreSQL with Prisma ORM
- **Authentication:** Clerk (OAuth, 2FA)
- **Payments:** Stripe
- **AI:** Google Gemini (free tier)
- **Deployment:** Vercel
- **Security:** AES-256-GCM encryption, Rate limiting

---

## 📁 Project Structure

```
layoutforge/
├── src/
│   ├── app/              # Pages & API routes
│   │   ├── api/         # Protected API endpoints
│   │   ├── dashboard/   # User dashboard
│   │   ├── upload/      # Manuscript upload
│   │   ├── preview/     # Manuscript preview
│   │   ├── metadata/    # AI metadata editor
│   │   └── download/    # File downloads
│   ├── lib/             # Core utilities
│   │   ├── encryption.ts
│   │   ├── rate-limit.ts
│   │   ├── security.ts
│   │   └── storage.ts
│   └── middleware.ts    # Global security
├── prisma/
│   └── schema.prisma    # Database schema
├── public/              # Static assets
└── docs/               # Documentation
    ├── GITHUB_PUSH_INSTRUCTIONS.md
    ├── VERCEL_DEPLOYMENT.md
    ├── PHASE_1_SUMMARY.md
    ├── ACTION_CHECKLIST.md
    └── IMMEDIATE_NEXT_STEPS.md
```

---

## 🚀 Deployment

### 1. Push to GitHub
```bash
git add .
git commit -m "Phase 1: Security Foundation"
git push origin main
```

### 2. Deploy to Vercel
- Go to vercel.com
- Import GitHub repository
- Add environment variables
- Deploy (1 click)

### 3. Live Production
- Auto-deploys on every push
- SSL/HTTPS included
- Global CDN
- Performance monitoring

---

## 💰 Revenue Model

| Tier | Price | Monthly Users | ARR |
|------|-------|---------------|-----|
| Free | $0 | 1,000 | $0 |
| Pro (Pay-per-use) | $2.99/analysis | 500 × 3 books | $4,485 |
| Pro+ (Subscription) | $4.99/month | 100 | $5,988 |
| **TOTAL** | - | **1,600** | **$10,473** |

At scale (10K users): **$150K+/year potential**

---

## 📚 Documentation

- **[Immediate Next Steps](./IMMEDIATE_NEXT_STEPS.md)** - Start here
- **[GitHub Push Instructions](./GITHUB_PUSH_INSTRUCTIONS.md)** - Push code
- **[Vercel Deployment](./VERCEL_DEPLOYMENT.md)** - Deploy live
- **[Phase 1 Summary](./PHASE_1_SUMMARY.md)** - What was built
- **[Action Checklist](./ACTION_CHECKLIST.md)** - Setup checklist

---

## 🎯 Next Phases

### Phase 2: AI Features (2-3 weeks)
- AI metadata optimization (using Gemini)
- Competitor analysis (Amazon scraper)
- Copy-paste KDP export
- **Revenue:** $2.99 per analysis

### Phase 3: Manuscript Intelligence (3-4 weeks)
- Table of Contents generator
- Marketing assets generator
- Series management
- Reading level analysis

### Phase 4: Business Tools (3-4 weeks)
- Pricing calculator
- Sales dashboard
- Competitor price tracker
- Batch processing

### Phase 5: Premium Features (4-6 weeks)
- AI Cover generator
- Print-on-Demand integration
- Author website builder
- Audiobook setup assistant

---

## 🔗 Links

- **Repository:** https://github.com/QZEE777/LayoutForge
- **Live App:** (deployed to Vercel)
- **Clerk:** https://clerk.com
- **Vercel:** https://vercel.com
- **Stripe:** https://stripe.com

---

## 📝 Environment Setup

Copy `.env.example` to `.env.local` and fill in:

```env
# Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=

# Database
DATABASE_URL=

# Payments
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_SECRET_KEY=

# Security
ENCRYPTION_KEY=

# API
NEXT_PUBLIC_API_URL=http://localhost:3000
```

---

## 👤 Author

Built for independent authors publishing on Amazon KDP.

---

## 📄 License

MIT

---

## 🚀 Get Started

**[Start with Immediate Next Steps →](./IMMEDIATE_NEXT_STEPS.md)**

Push to GitHub → Deploy to Vercel → Phase 2 AI Features → Revenue

**Total time to live revenue:** ~1 week

---

**Last Updated:** February 2026
**Status:** Phase 1 Complete - Ready for Production
**Next:** Phase 2 AI Features
