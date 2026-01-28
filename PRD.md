# JetBeans - Product Requirements Document

## Vision

JetBeans is evolving into a **multi-tenant SaaS platform** for ecommerce businesses. Starting as a Canadian coffee brand (jetbeans.cafe), the platform will be monetized as a subscription service where merchants get their own isolated dashboard to run their business.

**Primary Domain**: jetbeans.cafe (JetBeans store)
**Admin Domain**: admin.jetbeans.cafe
**Hosting**: Vercel
**Database**: Neon (production) / Docker PostgreSQL (development)
**Team**: Ash, Reese, Lorena, Ashley

---

## Platform Architecture

### Three-Tier System

```
┌─────────────────────────────────────────────────────────────────┐
│                     SUPER ADMIN PANEL                            │
│  (Ash's personal control center for the entire platform)        │
│  - Manage all tenants/users                                      │
│  - Platform-wide analytics                                       │
│  - Subscription management                                       │
│  - Service configuration                                         │
│  - Revenue/billing overview                                      │
└─────────────────────────────────────────────────────────────────┘
                              │
          ┌───────────────────┼───────────────────┐
          ▼                   ▼                   ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│  TENANT A       │ │  TENANT B       │ │  TENANT C       │
│  (JetBeans)     │ │  (Other Biz)    │ │  (Other Biz)    │
│  - Own dashboard│ │  - Own dashboard│ │  - Own dashboard│
│  - Own data     │ │  - Own data     │ │  - Own data     │
│  - Own theme    │ │  - Own theme    │ │  - Own theme    │
└─────────────────┘ └─────────────────┘ └─────────────────┘
```

### Tenant Model (White-Label SaaS)

Each paying customer gets:
- **Isolated dashboard** - Their own admin panel instance
- **Isolated data** - Products, orders, customers scoped to them
- **Custom branding** - Logo, colors, theme
- **Custom domain** - Optional: admin.theirstore.com
- **Full feature access** - Based on subscription tier

### User Tiers

| Tier | Description | Access |
|------|-------------|--------|
| **Super Admin** | Platform owner (Ash) | Everything, all tenants |
| **Tenant Owner** | Paying subscriber | Their dashboard, their team |
| **Tenant Admin** | Team member (admin) | Dashboard, limited settings |
| **Tenant Member** | Team member (staff) | Day-to-day operations |
| **Free Beta** | Hand-picked testers | Full access, no payment |

---

## Authentication & Onboarding Flow

### Invite-Only System

The platform is **invite-only**. No public signup.

```
┌──────────────────────────────────────────────────────────────────┐
│                        INVITE FLOW                                │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  1. Owner/Admin sends invite                                      │
│     └─→ Email with secure token (expires 7 days)                 │
│                                                                   │
│  2. Invitee clicks link                                          │
│     └─→ /invite/[token] - validate token                         │
│                                                                   │
│  3. Onboarding Portal                                            │
│     ├─→ Email pre-filled (locked, from invite)                   │
│     ├─→ Set profile picture                                      │
│     ├─→ Set banner image (profile customization)                 │
│     ├─→ Set display name                                         │
│     ├─→ Set preferences (theme, notifications)                   │
│     └─→ Continue with Google OAuth                               │
│                                                                   │
│  4. Account created                                              │
│     ├─→ User record with role from invite                        │
│     ├─→ Preferences saved (synced across devices)                │
│     └─→ Redirect to dashboard                                    │
│                                                                   │
│  5. Welcome experience                                           │
│     ├─→ Welcome modal                                            │
│     ├─→ Optional product tour                                    │
│     └─→ Getting started checklist                                │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
```

### Default Theme

New users default to **Coffee theme** (warm browns, amber accents) until they set their preference.

### User Preferences (Database-Synced)

Single JSONB column on `users` table for cross-device sync:

```typescript
preferences: jsonb("preferences").$type<{
  theme?: "light" | "dark" | "system" | "coffee"
  sidebarOpen?: boolean
  soundEnabled?: boolean
  desktopNotifications?: boolean
  // Extensible without migrations
}>()
```

---

## Monetization

### Polar Integration

Polar handles all subscription billing:
- Monthly/annual plans
- Payment processing
- Tax handling
- Subscription management (pause, cancel, upgrade)
- Webhook events for provisioning

### Revenue Model

| Tier | Price | Features |
|------|-------|----------|
| **Starter** | $29/mo | 1 user, 100 products, basic features |
| **Growth** | $79/mo | 5 users, unlimited products, API access |
| **Pro** | $199/mo | Unlimited users, white-label, priority support |
| **Enterprise** | Custom | Dedicated infrastructure, SLA, custom features |
| **Free Beta** | $0 | Hand-picked testers, full access |

### Free Beta Users

Manually granted by Super Admin:
- Full Pro-tier access
- No payment required
- For early adopters, friends, strategic partners
- Flag in database: `isBetaTester: true`

---

## Social Features (Planned)

### User Discovery

- Search for users by name/email
- Send connection requests
- View public profiles
- Follow/friend system (optional)

### Use Cases

- Find team members to invite
- Network with other merchants
- Community features (future)

---

## Business Verticals

JetBeans (the flagship store) covers:

### Phase 1: Coffee (Current)
- Resell roasted coffee
- White-label with Latin American suppliers
- Subscriptions (weekly, biweekly, monthly)

### Phase 2: Expand Categories
- **Tea & Matcha** — Premium loose-leaf, ceremonial grade
- **Coffee Gear** — Grinders, french presses, pour-over sets
- **Accessories** — Mugs, tumblers, merchandise

### Future Expansion
- **Skate Gear** — Decks, trucks, wheels, bearings
- **Custom Apparel** — Branded clothing
- **Legal Cannabis** — Canadian market (when licensed)

---

## Core Features (Implemented)

### Admin Panel

- **Products** — CRUD, variants, categories, inventory, SEO
- **Orders** — Management, fulfillment, returns, refunds, tracking
- **Customers** — Profiles, segments, loyalty/rewards, gift cards
- **Subscriptions** — Recurring deliveries, dunning, pause/cancel
- **Marketing** — Discounts, campaigns, referrals
- **Content (CMS)** — Blog posts, static pages, media library
- **Shipping** — Carriers, zones, labels, tracking
- **Suppliers** — Partner management, purchase orders
- **Settings** — Store config, payments, tax, integrations
- **Analytics** — Sales, traffic, customers, subscriptions
- **Activity Log** — Full audit trail

### Real-Time Features (Pusher)

- **Team Messaging** — DMs and channels
- **Live Notifications** — Bell with unread count
- **Presence System** — Who's online, who's viewing what
- **Live Data Updates** — Orders, products, inventory refresh in real-time
- **Incoming Webhooks** — Discord/Slack-style message posting

### Voice/Video Calls (LiveKit)

- 1:1 and group calls (up to 10)
- Voice and video
- Screen sharing
- Custom ringtone (`/sounds/ringtone.mp3`)
- Floating/fullscreen call interface
- Call history

### Webhook System

| Provider | Purpose |
|----------|---------|
| **Polar** | Payment events, subscription lifecycle |
| **Resend** | Email delivery status |
| **Shipping** | Tracking updates (ShipStation, Shippo, EasyPost, generic) |

### Live Dashboard Updates

- Animated stat counters (odometer effect)
- Live revenue charts
- Real-time table updates (products, orders, customers, subscriptions)
- Inventory alerts

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
| Cache | Redis (Upstash prod, Docker dev) |
| Auth | Better Auth (roles: owner, admin, member) |
| Payments | Polar (fiat), Reown (crypto) |
| Real-time | Pusher |
| Calls | LiveKit |
| UI | shadcn/ui (stone theme) |
| Icons | Hugeicons |
| Styling | Tailwind CSS 4 |
| Linting | Biome |
| Images | Vercel Blob |
| Rich Text | TipTap |
| Error Tracking | Sentry |
| Hosting | Vercel |

---

## Recent Updates (Session Log)

### Login Page Redesign
- New shadcn `login-02` component
- Split layout: coffee beans image (left), login form (right)
- JetBeans branding with Rubik Mono font
- Google OAuth integration
- Dev login bypass (development only)

### Call System Fixes
- Added `roomCreate` permission for call initiators
- Better error handling (connection failures reset state)
- Console logging for debugging
- Custom ringtone support

### Database Schema Sync
- Pushed missing tables to production Neon:
  - `notifications`
  - `notification_preferences`
  - `message_channels`
  - `incoming_webhook_urls`
  - `outgoing_webhook_endpoints`
  - `outgoing_webhook_deliveries`
- Added missing columns to `team_messages`:
  - `webhook_id`, `webhook_username`, `webhook_avatar_url`
  - `content_type`, `embeds`, `is_system_message`
  - Made `sender_id` and `body` nullable

### Static Asset Proxy (Next.js 16)
- Created `proxy.ts` (replaces middleware.ts in Next.js 16)
- Allows unauthenticated access to `/images/`, `/logos/`, `/sounds/`, etc.

### Notification Preferences
- New settings page for notification preferences
- Toggle switches for event types and delivery methods

### Presence System
- Global admin presence tracking
- Page-specific viewer indicators
- Online status in sessions page

---

## Database Schema Additions

### User Preferences (Planned)
```sql
-- Add to users table
preferences JSONB DEFAULT '{}'
```

### Webhooks
- `webhook_endpoints` — Registered webhook sources
- `webhook_events` — Event log for debugging/replay
- `webhook_idempotency` — Prevent duplicate processing
- `outgoing_webhook_endpoints` — User-configured destinations
- `outgoing_webhook_deliveries` — Delivery attempt log
- `incoming_webhook_urls` — Discord/Slack-style message webhooks

### Notifications
- `notifications` — In-app notification store
- `notification_preferences` — User notification settings

### Presence
- User presence tracked via Pusher presence channels
- Page viewers via `presence-page-{type}-{id}` channels

---

## Pusher Channel Design

| Channel | Type | Purpose |
|---------|------|---------|
| `private-user-{userId}` | Private | User-specific events |
| `private-orders` | Private | Order broadcasts |
| `private-inventory` | Private | Inventory alerts |
| `private-analytics` | Private | Real-time analytics |
| `private-products` | Private | Product CRUD broadcasts |
| `private-customers` | Private | Customer events |
| `private-subscriptions` | Private | Subscription events |
| `presence-admin` | Presence | Global admin online status |
| `presence-page-{type}-{id}` | Presence | Page-specific viewers |

---

## Implementation Status

### ✅ Completed

**Infrastructure:**
- [x] Neon database (production)
- [x] Pusher (real-time messaging)
- [x] Google OAuth (admin login)
- [x] Vercel deployment
- [x] LiveKit (voice/video calls)
- [x] Sentry (error tracking)
- [x] Polar (payments - configured)

**Admin Panel:**
- [x] Full admin panel UI
- [x] Product/Order/Customer management
- [x] Inventory tracking
- [x] Content CMS
- [x] Team messaging
- [x] Voice/video calls
- [x] Ambient radio (SomaFM)
- [x] Command palette (`⌘K`)
- [x] Keyboard shortcuts
- [x] Activity log
- [x] Settings pages
- [x] Notification preferences
- [x] Login page (shadcn)
- [x] Webhook system (Polar, Resend)
- [x] Live data updates (all tables)
- [x] Presence system

### 🚧 In Progress

- [ ] Invite → Onboarding flow
- [ ] User preferences (JSONB sync)
- [ ] Super Admin Panel
- [ ] Fulfillment pipeline (Dripshipper email ingestion)

### 📋 Planned

**Multi-Tenant SaaS:**
- [ ] Tenant isolation (storeId scoping)
- [ ] Subscription provisioning (Polar webhooks)
- [ ] Super Admin dashboard
- [ ] Free beta user management
- [ ] User discovery/search

**Storefront (apps/web):**
- [ ] Product listing/detail pages
- [ ] Shopping cart + checkout
- [ ] Customer accounts
- [ ] Order tracking

**Native Apps:**
- [ ] Desktop app (Tauri)
- [ ] Mobile app (React Native)

---

## Environment Variables

### Required (Production)
```env
DATABASE_URL=
REDIS_URL=
BETTER_AUTH_SECRET=
BETTER_AUTH_URL=
NEXT_PUBLIC_ADMIN_URL=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
PUSHER_APP_ID=
PUSHER_KEY=
PUSHER_SECRET=
PUSHER_CLUSTER=
NEXT_PUBLIC_PUSHER_KEY=
NEXT_PUBLIC_PUSHER_CLUSTER=
```

### Optional
```env
LIVEKIT_API_KEY=
LIVEKIT_API_SECRET=
LIVEKIT_URL=
POLAR_WEBHOOK_SECRET=
RESEND_WEBHOOK_SECRET=
INITIAL_ADMIN_EMAILS=
```

---

## Development Commands

```bash
# Start local services
pnpm docker:up

# Push schema to database
pnpm db:push

# Seed development data
pnpm db:seed

# Start dev server
pnpm dev

# Type check
npx tsc --noEmit

# Build
pnpm build
```

---

## Future Considerations

- NeoEngine migration for decentralized storage
- Multi-language support (French for Canada)
- Wholesale/B2B portal
- Physical POS integration
- Node-based automation builder (like n8n)
- Custom workflow pipelines
