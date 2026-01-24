# JetBeans - Product Requirements Document

## Vision

JetBeans is a Canadian ecommerce brand and cafe concept — a "mom-pop shop for everything coffee" that expands into adjacent lifestyle categories. The platform operates as a single-brand retailer with mixed sourcing (resell, white-label, dropship).

**Domain**: jetbeans.cafe
**Hosting**: Vercel
**Database**: Neon (production) / Docker PostgreSQL (development)
**Team**: Ash, Reese, Lorena, Ashley

---

## Business Phases

### Phase 1: Resell Coffee (Fastest Revenue)
- Source roasted coffee from existing distributors
- Sell under JetBeans branding with minimal upfront cost
- Validate demand and build customer base

### Phase 2: White-Label
- Partner with Latin American suppliers (Mexico, Colombia, etc.)
- Own-branded coffee and matcha products
- Higher margins, unique product identity

### Phase 3: Expand Categories
- **Tea & Matcha** — premium loose-leaf and ceremonial grade
- **Coffee Gear** — grinders, french presses, moka pots, filters, pour-over sets
- **Accessories** — mugs, tumblers, branded merchandise

### Future Expansion
- **Legal Cannabis** — Canadian market (when licensing secured)
- **Skate Gear** — decks, trucks, wheels, bearings
- **Custom Apparel** — JetBeans branded clothing

---

## Products & Sourcing

| Source Type | Description | Examples |
|-------------|-------------|----------|
| `owned` | Purchased inventory, stored/shipped by JetBeans | Bulk coffee beans |
| `white_label` | Manufactured by partner, branded as JetBeans | Custom roasts, matcha blends |
| `dropship` | Fulfilled directly by supplier | Coffee gear, accessories |

---

## Core Features

### Storefront (jetbeans.cafe)
- Custom Next.js storefront (not a template/framework)
- Product catalog with categories and variants
- Shopping cart + checkout (fiat via Polar, crypto via Reown)
- User accounts: order history, subscriptions, addresses, payment methods
- All content (hero, banners, pages, blog) rendered from admin-managed CMS data

### Admin Panel (admin.jetbeans.cafe)
- **Products** — CRUD, variants, categories, inventory, SEO
- **Orders** — Management, fulfillment, returns, refunds, tracking
- **Customers** — Profiles, segments, loyalty/rewards, gift cards
- **Subscriptions** — Recurring deliveries, dunning, pause/cancel
- **Marketing** — Discounts, campaigns, referrals, SEO management
- **Content (CMS)** — Blog posts, static pages, media library, site content
- **Shipping** — Carriers, zones, labels, tracking
- **Suppliers** — Partner management, purchase orders
- **Notifications** — Email templates (rich HTML editor), messages, alert rules
- **Settings** — Store config, payments, tax, integrations
- **Analytics** — Sales, traffic, customers, subscriptions
- **Activity Log** — Full audit trail

### CMS Approach
- Structured fields + rich text (not a block-based page builder)
- Site content as key-value pairs (hero_headline, banner_text, etc.)
- Blog posts with rich text editor, cover images, SEO fields
- Static pages (About, FAQ, Contact) with rich text content
- Media library with drag-and-drop upload + URL paste
- All content editable from admin, consumed by storefront via server actions

### Subscriptions
- Recurring coffee/matcha deliveries
- Frequencies: weekly, biweekly, monthly
- Pause/resume/cancel, dunning management

### Discounts
- Type-based: Veteran, Senior, Developer, Subscription
- Promo codes for campaigns
- Stackable and non-stackable options

### Payments
- **Fiat** — Polar (subscriptions, one-time, tax handling)
- **Crypto** — Reown/WalletConnect (EVM chains, wallet connect, on-ramp)

### Real-Time
- Pusher WebSockets for instant updates
- Inventory changes reflect on storefront immediately
- Order status updates pushed to users

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router, React 19) |
| Language | TypeScript (strict) |
| Monorepo | pnpm + Turborepo |
| ORM | Drizzle ORM |
| Database (prod) | Neon PostgreSQL |
| Database (dev) | Docker PostgreSQL 17 |
| Cache | Redis (Docker locally, Upstash in prod) |
| Auth | Better Auth (roles: owner, admin, customer) |
| Payments (fiat) | Polar |
| Payments (crypto) | Reown (AppKit) |
| Real-time | Pusher |
| UI | shadcn/ui (stone theme, base-nova style) |
| Icons | Hugeicons |
| Styling | Tailwind CSS 4 |
| Linting | Biome |
| Image Storage | Vercel Blob (drag-and-drop + URL paste) |
| Rich Text | TipTap |
| Hosting | Vercel |

---

## Architecture

```
jetbeans/
├── apps/
│   ├── web/          # Customer storefront
│   └── admin/        # Admin panel
├── packages/
│   ├── db/           # Drizzle schema, migrations, client
│   ├── ui/           # Shared shadcn/ui components
│   ├── auth/         # Better Auth config
│   ├── types/        # Shared TypeScript types
│   └── config/       # Shared tsconfig
└── docker/           # Local dev services (PostgreSQL, Redis)
```

---

## Database Schema

### Products & Catalog
- **products** — Name, description, pricing, source type, images (Vercel Blob), SEO meta
- **productVariants** — SKU, variant-specific pricing, attributes (size, roast, color)
- **categories** — Hierarchical (parent/child), slugs, sort order

### Inventory
- **inventory** — Per-variant stock levels, reserved quantities, low-stock thresholds
- **inventoryLogs** — Audit trail of all stock changes

### Users & Auth
- **users** — Better Auth compatible + custom fields (role, discount type, wallet address)
- **sessions**, **accounts**, **verifications** — Better Auth tables
- **invites** — Team member invitations

### Commerce
- **orders** — Order numbers (JB-XXXXXX), status tracking, totals, shipping
- **orderItems** — Price snapshots at time of purchase
- **payments** — Dual method support (fiat + crypto), provider data, tx hashes
- **addresses** — User shipping/billing addresses

### Subscriptions
- **subscriptions** — Frequency, status (active/paused/cancelled/dunning), delivery schedule
- **subscriptionItems** — Products in each subscription

### Marketing
- **discounts** — Type-based, promo codes, stacking rules, usage limits
- **campaigns** — Email/banner/social campaigns with performance metrics
- **referralCodes** / **referrals** — Referral tracking and rewards

### Customers
- **customerSegments** / **customerSegmentMembers** — Manual and rule-based segmentation
- **loyaltyProgram** / **loyaltyPoints** / **loyaltyTransactions** — Points, tiers, redemption
- **giftCards** / **giftCardTransactions** — Gift card lifecycle
- **reviews** — Product reviews with moderation workflow

### Content (CMS)
- **blogPosts** — Title, slug, rich text content, cover image, SEO, tags
- **sitePages** — Static pages with rich text content
- **siteContent** — Key-value structured content (hero text, banners, etc.)
- **mediaItems** — Uploaded files with metadata (URL, alt, mime type, size)

### Notifications
- **emailTemplates** — Transactional email templates with rich HTML editor (verify, reset password, order confirmation, etc.)
- **messages** — Sent message log (customer communications)
- **alertRules** — Automated notification rules (low stock, new order, etc.)

### Settings
- **storeSettings** — Key-value store config grouped by section

### Shipping & Suppliers
- **shippingCarriers** / **shippingRates** — Carrier configuration
- **shippingZones** / **shippingZoneRates** — Geographic rate zones
- **shippingLabels** — Generated shipping labels
- **suppliers** / **purchaseOrders** / **purchaseOrderItems** — Supplier management

### System
- **analytics** — Event tracking
- **auditLog** — Full action audit trail

---

## Development Pipeline

### Local Development
1. `pnpm docker:up` — Start PostgreSQL + Redis containers
2. `pnpm db:push` — Push schema to local database
3. `pnpm db:seed` — Seed development data
4. `pnpm dev` — Start all apps (web :3000, admin :3001)

### Production
- Vercel auto-deploys from main branch
- Neon database with connection pooling
- Upstash Redis for caching
- Vercel Blob for image/video storage
- Environment variables managed in Vercel dashboard

---

## Future Considerations
- NeoEngine migration for decentralized file storage
- Mobile app (React Native)
- Multi-language support (French for Canadian market)
- Wholesale/B2B portal
- Cannabis product compliance system
- Physical POS integration for cafe locations
