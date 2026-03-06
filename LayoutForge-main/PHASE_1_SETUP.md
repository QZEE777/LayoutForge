# Phase 1: Security Foundation Setup Instructions

## Prerequisites
- Node.js 18+ installed
- npm or yarn

## Step 1: Install Clerk Authentication

```bash
npm install @clerk/nextjs @clerk/backend
```

## Step 2: Environment Variables (.env.local)

```env
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key

# Database (Prisma)
DATABASE_URL=your_database_url

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
STRIPE_SECRET_KEY=your_stripe_secret_key

# Encryption
ENCRYPTION_KEY=your_32_character_encryption_key

# API
NEXT_PUBLIC_API_URL=http://localhost:3000
```

## Step 3: Database Setup (Prisma with PostgreSQL)

```bash
npm install @prisma/client
npm install -D prisma
npx prisma init
```

## Step 4: Install Security Dependencies

```bash
npm install crypto-js bcryptjs rate-limiter-flexible dotenv helmet cors
```

## Step 5: Create Prisma Schema
File: prisma/schema.prisma

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id                String    @id @default(cuid())
  clerkId           String    @unique
  email             String    @unique
  name              String?
  tier              String    @default("free") // free, pro, pro_plus
  subscriptionId    String?
  subscriptionStatus String?
  apiKey            String    @unique @default(cuid())
  apiKeyHash        String    @unique
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
  manuscripts       Manuscript[]
  apiUsage          ApiUsage[]
  billingHistory    BillingHistory[]
  
  @@index([clerkId])
  @@index([apiKey])
}

model Manuscript {
  id                String    @id @default(cuid())
  userId            String
  user              User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  filename          String
  originalName      String
  mimeType          String
  size              BigInt
  encryptedPath     String    @unique
  encryptionIv      String
  wordCount         Int?
  chapterCount      Int?
  uploadedAt        DateTime  @default(now())
  expiresAt         DateTime  @default(dbgenerated("now() + interval '24 hours'"))
  
  @@index([userId])
  @@index([expiresAt])
}

model ApiUsage {
  id                String    @id @default(cuid())
  userId            String
  user              User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  endpoint          String
  requestCount      Int       @default(1)
  tokenCount        Int
  costUsd           Float
  timestamp         DateTime  @default(now())
  
  @@index([userId])
  @@index([timestamp])
}

model BillingHistory {
  id                String    @id @default(cuid())
  userId            String
  user              User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  stripeId          String    @unique
  amount            Float
  currency          String    @default("USD")
  status            String
  invoiceUrl        String?
  createdAt         DateTime  @default(now())
  
  @@index([userId])
  @@index([stripeId])
}

model AuditLog {
  id                String    @id @default(cuid())
  userId            String?
  action            String
  resource          String
  resourceId        String?
  ipAddress         String
  userAgent         String?
  status            String    @default("success")
  details           String?
  createdAt         DateTime  @default(now())
  
  @@index([userId])
  @@index([createdAt])
}
```

## Next Steps
1. Set up PostgreSQL database (local or cloud)
2. Get Clerk API keys from clerk.com
3. Get Stripe API keys from stripe.com
4. Run: `npx prisma migrate dev --name init`
5. Proceed to Phase 1 implementation files

