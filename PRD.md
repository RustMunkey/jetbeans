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

## Implementation Status

### ✅ Completed

**Infrastructure:**
- [x] Neon database (production)
- [x] Pusher (realtime messaging)
- [x] Google OAuth (admin login)
- [x] Vercel deployment
- [x] LiveKit (voice/video calls)
- [x] Cloudinary (image CDN)
- [x] Algolia (search)
- [x] Polar (payments - configured)
- [x] Sentry (error tracking)

**Admin Panel Features:**
- [x] Full admin panel UI
- [x] Product management
- [x] Order management
- [x] Customer management
- [x] Inventory tracking
- [x] Content CMS (blog, pages)
- [x] Team messaging (Pusher)
- [x] Voice/video calls (LiveKit)
- [x] Ambient radio (SomaFM)
- [x] Keyboard shortcuts system
- [x] Command palette (`⌘K`)
- [x] Activity log
- [x] Settings pages

### 🚧 In Progress / Pending Setup

**Integrations:**
- [ ] **Resend** — Verify `jetbeans.cafe` domain. API key ready: `re_Pkv4QSj6_H54zwkerbATTHZNA55mKJCRa`
- [ ] **EasyPost** — Requires billing info for shipping labels

**Features:**
- [ ] Email notifications (Resend integration)
- [ ] SMS alerts (email-to-SMS gateway)
- [ ] Web Push notifications
- [ ] Notification preferences UI

### 📋 Planned (Not Started)

**Storefront (apps/web):**
- [ ] Product listing pages
- [ ] Product detail pages
- [ ] Shopping cart
- [ ] Checkout flow
- [ ] Customer accounts
- [ ] Order tracking

**Admin Enhancements:**
- [ ] Team invite system refinement
- [ ] Role-based access control (granular)
- [ ] Post-signup onboarding tour
- [ ] Getting started checklist
- [ ] Header/toolbar redesign
- [ ] Help button + popover
- [ ] Custom keybinding settings
- [ ] Data export controls
- [ ] GDPR data request handling

**Native Apps:**
- [ ] Desktop app (Tauri)
- [ ] Mobile app (React Native)

**SaaS Platform (Phase 2):**
- [ ] Multi-tenancy (storeId scoping)
- [ ] Storefront API
- [ ] Merchant onboarding
- [ ] Subscription billing
- [ ] API key management

---

## Future Considerations
- NeoEngine migration for decentralized file storage
- Multi-language support (French for Canadian market)
- Wholesale/B2B portal
- Cannabis product compliance system
- Physical POS integration for cafe locations

---

## Native Apps (Tauri + Mobile)

Package the admin panel as native desktop and mobile apps for merchants.

### Desktop App (Tauri)

**Why Tauri over Electron:**
- ~10MB vs ~150MB bundle size
- Native system webview (no bundled Chromium)
- Rust backend for performance
- Better memory usage

**Platforms:** macOS, Windows, Linux

**Features:**
- Native window management
- System notifications (new order, low stock, messages)
- Menu bar quick actions
- Auto-updates via Tauri updater
- Offline detection + sync queue
- Deep links (`jetbeans://orders/123`)

**Structure:**
```
apps/desktop/
├── src-tauri/
│   ├── src/main.rs       # Rust backend
│   ├── Cargo.toml
│   └── tauri.conf.json   # App config
├── src/                   # Points to admin app
└── package.json
```

### Mobile App (React Native)

**Why React Native:**
- Mature ecosystem, battle-tested
- Huge plugin library
- Share components/logic with web via shared packages
- Better native feel than webview wrappers
- Expo for faster development

**Platforms:** iOS, Android

**Structure:**
```
apps/mobile/
├── src/
│   ├── screens/          # Screen components
│   ├── components/       # Shared UI
│   ├── navigation/       # React Navigation
│   ├── hooks/            # Shared hooks
│   └── api/              # API client
├── ios/
├── android/
├── app.json
└── package.json
```

**Features:**
- Push notifications (FCM/APNs) for:
  - New orders
  - Low stock alerts
  - Customer messages
  - Call notifications (ties into LiveKit)
- Biometric auth (Face ID, fingerprint)
- Camera access for product photos
- Share extension for quick product creation
- Home screen widgets (daily sales, pending orders)

**Mobile-Specific UI:**
- Bottom tab navigation
- Pull-to-refresh on lists
- Swipe actions (archive, delete, fulfill)
- Haptic feedback
- Native date/time pickers
- Optimized for thumb reach zones

### Implementation Order

1. **Desktop first** — Tauri is more mature for desktop
2. **Test with JetBeans team** — internal dogfooding
3. **Mobile second** — after desktop is stable
4. **SaaS offering** — include native apps in Pro/Enterprise tiers

### Distribution

**Desktop:**
- macOS: DMG + App Store (optional)
- Windows: MSI + Microsoft Store (optional)
- Linux: AppImage, .deb, .rpm

**Mobile:**
- iOS: TestFlight → App Store
- Android: Internal testing → Play Store
- Enterprise: MDM distribution for large merchants

---

## Phase 2: SaaS Platform (Post-JetBeans Launch)

After JetBeans business is operational and profitable, the platform can be monetized as a multi-tenant headless commerce SaaS — essentially a self-hosted Shopify alternative.

### Vision
Offer the same admin panel and backend infrastructure to other merchants as a subscription service. Merchants bring their own storefront (or use a provided template) and connect to our hosted backend.

### Multi-Store Architecture

**Database Changes:**
- Add `stores` table (id, name, slug, domain, plan, settings, createdAt)
- Add `storeId` foreign key to all merchant-scoped tables (products, orders, customers, etc.)
- Scope all queries by `storeId` for data isolation

**Admin Panel Changes:**
- Store selector in header for platform admins managing multiple stores
- Store-scoped authentication (merchants only see their store)
- Store settings page for branding, domain, API keys

### Storefront API

Expose RESTful/GraphQL API for merchant storefronts to consume:

| Endpoint | Purpose |
|----------|---------|
| `GET /api/storefront/products` | List products with filtering, pagination |
| `GET /api/storefront/products/:slug` | Single product with variants |
| `GET /api/storefront/collections` | Product categories/collections |
| `POST /api/storefront/cart` | Create cart session |
| `PUT /api/storefront/cart/:id` | Update cart (add/remove items) |
| `POST /api/storefront/checkout` | Create order, calculate tax/shipping |
| `POST /api/storefront/checkout/:id/pay` | Process payment |
| `GET /api/storefront/orders/:id` | Order status (authenticated) |

**Authentication:**
- Public endpoints (products, collections) — API key only
- Cart/Checkout — session token or API key
- Customer endpoints — JWT auth

### Webhook System

| Event | Trigger |
|-------|---------|
| `order.created` | New order placed |
| `order.paid` | Payment confirmed |
| `order.fulfilled` | Order shipped |
| `inventory.low` | Stock below threshold |
| `subscription.renewed` | Subscription payment processed |
| `subscription.failed` | Payment failed, entering dunning |

### Subscription Tiers

| Tier | Price | Features |
|------|-------|----------|
| **Starter** | $29/mo | 1 store, 100 products, API access, email support |
| **Growth** | $79/mo | 1 store, unlimited products, webhooks, priority support |
| **Pro** | $199/mo | 3 stores, white-label admin, custom domain, phone support |
| **Enterprise** | Custom | Unlimited stores, dedicated infrastructure, SLA |

### Required Infrastructure

1. **Multi-tenant Auth** — Store-scoped Better Auth, merchant invites
2. **API Gateway** — Rate limiting, API key management, usage tracking
3. **Billing Integration** — Polar subscriptions for merchant billing
4. **Onboarding Flow** — Store creation wizard, Stripe Connect for payments
5. **Merchant Dashboard** — API keys, usage stats, billing management
6. **Storefront Templates** — Optional hosted storefronts (Next.js templates)

### Implementation Order

1. **Storefront API** — Build API routes for JetBeans storefront first
2. **Multi-tenancy** — Add `storeId` scoping after JetBeans is live
3. **Merchant Onboarding** — Signup, store creation, billing
4. **API Management** — Keys, rate limits, usage dashboard
5. **Templates** — Hosted storefront option for non-technical merchants

### Competitive Positioning

| Competitor | Weakness | Our Advantage |
|------------|----------|---------------|
| Shopify | Expensive, locked ecosystem | Lower cost, open API, own your data |
| BigCommerce | Complex, enterprise-focused | Simpler, indie-friendly |
| Medusa/Saleor | Self-hosted complexity | Fully managed, no DevOps needed |
| WooCommerce | PHP, plugin hell | Modern stack, clean architecture |

---

## Storefront Requirements (JetBeans)

Before SaaS expansion, complete the JetBeans customer storefront:

### Critical Path (MVP)
- [ ] Product listing pages (grid, filters, search)
- [ ] Product detail page (variants, images, add to cart)
- [ ] Cart page (quantities, remove, promo codes)
- [ ] Checkout flow (shipping, payment, confirmation)
- [ ] Order confirmation page + email
- [ ] Inventory decrement on purchase

### Post-MVP
- [ ] Customer accounts (order history, addresses, subscriptions)
- [ ] Subscription management (pause, cancel, update)
- [ ] Wishlist
- [ ] Reviews display
- [ ] Blog/content pages

### API Routes Needed

```
apps/web/app/api/
├── products/
│   ├── route.ts          # List products
│   └── [slug]/route.ts   # Single product
├── cart/
│   ├── route.ts          # Create cart
│   └── [id]/route.ts     # Update cart
├── checkout/
│   ├── route.ts          # Create checkout
│   └── [id]/
│       ├── route.ts      # Get checkout
│       └── pay/route.ts  # Process payment
├── orders/
│   └── [id]/route.ts     # Order status
└── webhooks/
    ├── polar/route.ts    # Payment webhooks
    └── reown/route.ts    # Crypto payment webhooks
```

### Payment Flow

1. Customer adds items to cart
2. Proceeds to checkout → creates pending order
3. Selects payment method (Polar fiat / Reown crypto)
4. Payment processed → webhook confirms
5. Order status updated → confirmation email sent
6. Inventory decremented → fulfillment queue updated

---

## Notification System

### Email (Resend)

**Sending:** `noreply@jetbeans.cafe`
**Receiving:** `support@jetbeans.cafe` (forwards to team inbox)

| Email Type | Trigger | Recipient |
|------------|---------|-----------|
| Order Confirmation | Order placed | Customer |
| Shipping Update | Status change | Customer |
| Password Reset | User request | Customer |
| Low Stock Alert | Inventory threshold | Team |
| New Order Alert | Order placed | Team |
| New Message | Customer contact | Team |

**Implementation:**
- Resend SDK for sending
- Rich HTML templates stored in `emailTemplates` table
- Template variables: `{{order_number}}`, `{{customer_name}}`, etc.
- Storefront contact form → creates message record + emails team

### SMS (Free via Email-to-SMS Gateway)

For team alerts only — zero cost solution using carrier email gateways.

| Carrier | Gateway Email |
|---------|---------------|
| AT&T | `number@txt.att.net` |
| T-Mobile | `number@tmomail.net` |
| Verizon | `number@vtext.com` |
| Rogers 🇨🇦 | `number@pcs.rogers.com` |
| Bell 🇨🇦 | `number@txt.bell.ca` |
| Telus 🇨🇦 | `number@msg.telus.com` |
| Fido 🇨🇦 | `number@fido.ca` |
| Koodo 🇨🇦 | `number@msg.koodomobile.com` |

**Database Changes:**
- Add `phone` field to users table (already exists)
- Add `phoneCarrier` enum field to users table
- Add `smsAlertsEnabled` boolean to users table

**Settings UI:**
- Phone number input in Account Settings
- Carrier dropdown selector
- Toggle for SMS alerts on/off
- Test SMS button

**Alert Types (SMS):**
- New order (high-value orders only, configurable threshold)
- Critical low stock
- Incoming call missed

### Web Push Notifications (Admin Panel)

Browser-native push notifications for instant alerts.

**Implementation:**
- Service Worker registration on admin panel load
- Push subscription stored in database per user
- Web Push API (VAPID keys)

**Supported:**
- Chrome, Firefox, Edge (desktop + Android)
- Safari (macOS + iOS 16.4+)

**Alert Types:**
- New orders
- New messages
- Low stock
- Missed calls

**Settings UI:**
- Enable/disable push in Account Settings
- Per-alert-type toggles
- Browser permission request flow

### Notification Preferences (Account Settings)

```
Notifications
├── Email Alerts
│   ├── New Orders          [on/off]
│   ├── Low Stock           [on/off]
│   ├── New Messages        [on/off]
│   └── Daily Summary       [on/off]
├── SMS Alerts (Team Only)
│   ├── Phone Number        [input]
│   ├── Carrier             [dropdown]
│   ├── Critical Orders     [on/off] (orders > $X)
│   └── Test SMS            [button]
└── Push Notifications
    ├── Enable Push         [on/off]
    ├── New Orders          [on/off]
    ├── Messages            [on/off]
    └── Missed Calls        [on/off]
```

---

## Team Invite & Onboarding System

### Invite Flow

1. **Owner/Admin sends invite**
   - Enter email address
   - Select role (admin, member)
   - Optional: set department, permissions
   - System generates secure invite token (expires in 7 days)

2. **Invite email sent**
   - From: `noreply@jetbeans.cafe`
   - Contains: Invite link with token
   - Shows: Who invited them, role assigned

3. **Invitee clicks link**
   - Redirected to `/invite/[token]` (hidden page, not in nav)
   - Token validated (not expired, not used)
   - If invalid → error page with "request new invite" option

4. **Onboarding form**
   - Full name
   - Profile photo (optional)
   - Phone number
   - Phone carrier (for SMS alerts)
   - Password (if not using OAuth)
   - Or: "Continue with Google" OAuth

5. **Account created**
   - User record created with assigned role
   - Invite marked as used
   - Redirected to admin dashboard
   - Welcome modal with quick tour

### Database Schema

```sql
-- invites table (already exists, enhance)
invites:
  - id
  - email
  - role (admin | member)
  - invitedBy (userId)
  - token (unique, secure random)
  - expiresAt (7 days from creation)
  - usedAt (null until accepted)
  - createdAt
```

### Invite Management UI (Settings → Team)

- List all team members with roles
- Pending invites section
- Resend invite button
- Revoke invite button
- Edit member role (owner only)
- Remove team member (owner only)

### Security

- Invite tokens are single-use
- Tokens expire after 7 days
- Rate limit: max 10 invites per hour
- Only owner/admin can send invites
- Audit log entry for all invite actions

### Post-Signup Onboarding

After account creation, new team members see:

**1. Welcome Modal**
- Personalized greeting
- Brief explanation of their role
- "Get Started" button

**2. Product Tour (Optional)**
- Step-by-step walkthrough of key features
- Highlight: sidebar navigation, search, notifications
- Role-specific tour (admin sees more than member)
- "Skip tour" option, can replay from Settings

**3. Getting Started Checklist**
- Persistent sidebar widget (dismissable)
- Tasks based on role:

| Task | Role |
|------|------|
| Complete your profile | All |
| Set up notifications | All |
| Add your phone number | All |
| Learn keyboard shortcuts | All |
| Create your first product | Admin |
| Process your first order | Admin |
| Explore analytics | Admin |

**4. Contextual Tooltips**
- First-time hints on key actions
- "Did you know?" tips
- Dismiss permanently option

**5. Help Resources**
- `?` shortcut → keyboard shortcuts
- `⌘K` → search anything
- Help link → documentation (future)
- In-app chat support (future)

---

## Header & Toolbar Redesign

### Current Header
Everything in one header bar — getting crowded.

### Proposed: Split into Header + Toolbar

**Header (Top Bar):**
- Logo / Store name
- Breadcrumb navigation
- Search bar (`⌘K`)
- User avatar + dropdown

**Toolbar (Secondary Bar or Floating):**
Essential quick actions grouped logically:

```
┌─────────────────────────────────────────────────────────────┐
│ [+ New ▾]  [Messages 3]  [Calls]  [Radio]  │  [🔔]  [?]  [⚙]  │
└─────────────────────────────────────────────────────────────┘
```

| Section | Items |
|---------|-------|
| **Create** | New dropdown (Product, Order, Customer, Discount, Post) |
| **Communication** | Messages (with unread badge), Calls, Radio |
| **Utilities** | Notifications, Help (?), Settings |

### Help Button

Circle question mark button in toolbar. **Required** because keyboard shortcut `?` doesn't work reliably (needs Shift key, conflicts with inputs).

**Why a dedicated button:**
- `?` shortcut requires Shift+/ which is awkward
- Doesn't work when focused on inputs/textareas
- Users may not know the shortcut exists
- Button provides discoverability

**Click → Help Popover:**
```
┌─────────────────────────────┐
│ Help & Resources            │
├─────────────────────────────┤
│ 🎹 Keyboard Shortcuts       │
│ 📖 Documentation       →    │
│ 💬 Contact Support     →    │
│ 🎓 Watch Tutorial      →    │
├─────────────────────────────┤
│ What's New             →    │
│ Report a Bug           →    │
└─────────────────────────────┘
```

**Features:**
- Opens keyboard shortcuts modal directly
- Link to documentation site (future)
- Contact support (opens email or chat)
- Video tutorials (future)
- Changelog / What's New modal
- Bug report form (creates GitHub issue or internal ticket)
- Quick links to settings sections (integrations setup, etc.)

### Toolbar Placement Options

**Option A: Fixed Secondary Bar**
- Below header, always visible
- Clean separation of concerns
- Takes vertical space

**Option B: Floating Action Bar**
- Bottom-right floating bar (like Figma)
- Expandable/collapsible
- Doesn't take header space
- Mobile-friendly

**Option C: Sidebar Footer**
- Actions in sidebar footer area
- Context-aware (changes per page)
- Keeps header minimal

**Recommendation:** Option A for desktop, Option B for mobile.

### Mobile Toolbar

On mobile, toolbar becomes:
- Bottom navigation bar (iOS/Android style)
- Core actions: Home, Orders, Products, Messages, More
- "More" expands to full action sheet

---

## Role-Based Access Control (RBAC)

### Roles

| Role | Description | Count Limit |
|------|-------------|-------------|
| `owner` | Full access, can delete store, manage billing | 1 per store |
| `admin` | Full access except billing, can manage team | Unlimited |
| `member` | Limited access, day-to-day operations | Unlimited |

### Permission Matrix

| Permission | Owner | Admin | Member |
|------------|-------|-------|--------|
| **Products** |
| View products | ✅ | ✅ | ✅ |
| Create/edit products | ✅ | ✅ | ✅ |
| Delete products | ✅ | ✅ | ❌ |
| **Orders** |
| View orders | ✅ | ✅ | ✅ |
| Process orders | ✅ | ✅ | ✅ |
| Issue refunds | ✅ | ✅ | ❌ |
| **Customers** |
| View customers | ✅ | ✅ | ✅ |
| Edit customers | ✅ | ✅ | ❌ |
| Delete customers | ✅ | ✅ | ❌ |
| Export customer data | ✅ | ✅ | ❌ |
| **Team** |
| View team | ✅ | ✅ | ✅ |
| Invite members | ✅ | ✅ | ❌ |
| Remove members | ✅ | ❌ | ❌ |
| Change roles | ✅ | ❌ | ❌ |
| **Settings** |
| View settings | ✅ | ✅ | ✅ |
| Edit store settings | ✅ | ✅ | ❌ |
| Manage payments | ✅ | ❌ | ❌ |
| Manage billing | ✅ | ❌ | ❌ |
| Delete store | ✅ | ❌ | ❌ |
| **Analytics** |
| View analytics | ✅ | ✅ | ✅ |
| Export reports | ✅ | ✅ | ❌ |
| **Content** |
| View content | ✅ | ✅ | ✅ |
| Edit content | ✅ | ✅ | ✅ |
| Publish content | ✅ | ✅ | ❌ |
| **Activity Log** |
| View own activity | ✅ | ✅ | ✅ |
| View all activity | ✅ | ✅ | ❌ |

### Implementation

**Middleware check:**
```typescript
// Every protected action checks permission
async function requirePermission(permission: Permission) {
  const user = await getCurrentUser()
  if (!hasPermission(user.role, permission)) {
    throw new Error("Forbidden")
  }
}
```

**UI hiding:**
- Hide buttons/links user can't access
- Show disabled state with tooltip for transparency
- Never rely solely on UI hiding — always validate server-side

### Future: Granular Permissions

For SaaS multi-tenant, add custom permission sets:
- Store owners can create custom roles
- Per-feature permission toggles
- Permission inheritance

---

## Security & Compliance

### Data Protection Principles

1. **Minimize data collection** — Only collect what's necessary
2. **Encrypt at rest** — Database encryption via Neon
3. **Encrypt in transit** — HTTPS everywhere, TLS 1.3
4. **Access control** — RBAC, principle of least privilege
5. **Audit logging** — Track all data access and changes
6. **Data retention** — Clear policies, auto-deletion options

### GDPR Compliance (EU Customers)

**Rights implemented:**

| Right | Implementation |
|-------|----------------|
| Right to access | Customer can view all their data in account |
| Right to rectification | Customer can edit their profile |
| Right to erasure | "Delete my account" button, cascading delete |
| Right to portability | Export data as JSON/CSV |
| Right to object | Unsubscribe from marketing, opt-out toggles |
| Right to restrict | Pause account without deletion |

**Data Subject Requests (DSR):**
- Admin panel: Settings → Privacy → Data Requests
- View pending DSR requests
- One-click fulfill: export data, delete account
- Audit log of all DSR actions
- 30-day response SLA tracking

**Cookie Consent:**
- Cookie banner on storefront
- Granular consent: necessary, analytics, marketing
- Consent stored, revocable anytime
- No tracking before consent

### PIPEDA Compliance (Canadian Privacy Law)

- Similar to GDPR but Canadian jurisdiction
- Privacy policy link in footer
- Consent for marketing communications
- Data breach notification (72 hours)

### Admin Panel Data Security

**Customer Data Viewing:**
- Mask sensitive data by default (email: `a***@***.com`)
- "Reveal" button with audit log entry
- Auto-hide after 30 seconds
- Screenshot detection warning (optional)

**Session Security:**
- Sessions expire after 24 hours of inactivity
- Force logout on password change
- Active sessions list in Account Settings
- "Log out all devices" button
- Session location/device tracking

**Export Controls:**
- All exports logged in audit trail
- CSV/JSON exports password-protected (optional)
- Export limits per day for non-owners
- Watermark exports with user info

### Customer Data Handling

**Storefront:**
- Passwords hashed with Argon2
- Payment data never stored (handled by Polar/Reown)
- Address data encrypted at rest
- Session tokens HTTP-only, secure, SameSite

**Admin Panel:**
- View customer data: audit logged
- Edit customer data: audit logged
- Delete customer: soft delete, then hard delete after 30 days
- Export customer list: audit logged, requires confirmation

### Security Headers

```
Content-Security-Policy: default-src 'self'; ...
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
```

### Incident Response

1. **Detection** — Error monitoring via Sentry, anomaly alerts
2. **Containment** — Ability to disable features, lock accounts
3. **Investigation** — Audit logs, session logs
4. **Notification** — Email affected users within 72 hours
5. **Remediation** — Fix, document, prevent recurrence

---

## Keyboard Shortcuts

Global keyboard shortcuts for power users. Press `?` anywhere to view all shortcuts.

### Navigation

| Shortcut | Action |
|----------|--------|
| `⌘ K` | Open search / command palette |
| `⌘ B` | Toggle sidebar |
| `⌘ ⇧ H` | Go to Dashboard |
| `⌘ ⇧ O` | Go to Orders |
| `⌘ ⇧ P` | Go to Products |
| `⌘ ⇧ C` | Go to Customers |
| `⌘ ⇧ A` | Go to Analytics |
| `⌘ ⇧ M` | Go to Messages |
| `⌘ ,` | Go to Settings |
| `⌘ [` | Go back |
| `⌘ ]` | Go forward |

### Actions

| Shortcut | Action |
|----------|--------|
| `⌘ ⇧ N` | New product |
| `⌥ ⇧ O` | New order |
| `⌘ S` | Save current form |
| `Esc` | Close modal / cancel |

### View

| Shortcut | Action |
|----------|--------|
| `⌘ ⇧ L` | Toggle light/dark mode |
| `?` | Show keyboard shortcuts help |

**Note:** Windows/Linux users use `Ctrl` instead of `⌘`

### Future: Custom Keybindings

- Settings → Account → Keyboard Shortcuts
- View all shortcuts
- Customize any shortcut
- Reset to defaults
- Import/export keybinding profiles

---

## Internal Communication

### Team Messaging (Implemented)

Real-time chat between team members via Pusher.

**Features:**
- Direct messages (1:1)
- Channel messages (team-wide)
- Message history
- Unread indicators
- Desktop notifications
- Sound notifications (configurable)

### Voice & Video Calls (Implemented)

Internal calling via LiveKit WebRTC.

**Features:**
- 1:1 voice calls
- 1:1 video calls
- Group calls (up to 10 participants)
- Screen sharing
- Incoming call modal with ringtone
- Outgoing dial tone
- Call controls (mute, camera, screen share, hang up)
- Floating/fullscreen call interface
- Call history page

**Call Flow:**
1. User initiates call → Pusher notifies recipients
2. Recipients see incoming call modal
3. Accept → LiveKit room connection
4. Connected → real-time audio/video
5. End call → update database, notify participants

### Ambient Radio (Implemented)

SomaFM integration for background music while working.

**Stations:**
- Drone Zone (ambient)
- Groove Salad (chill)
- Space Station Soma
- Deep Space One
- Lush (downtempo)

**Controls:**
- Radio button in header toolbar
- Click to toggle play/pause
- Dropdown to switch stations
- Volume controlled by station (0.3)

---

## Scheduling System

Internal scheduling and calendar system for team coordination.

### Calendar Widget (Implemented)

Floating, draggable calendar widget accessible from the header toolbar.

**Features:**
- Quick date picker
- Draggable/minimizable widget (like Music Player)
- Today highlight
- Date selection

### Scheduled Events (Planned)

| Event Type | Description |
|------------|-------------|
| `shift` | Team member work shifts |
| `meeting` | Internal team meetings |
| `task` | Scheduled tasks/reminders |
| `delivery` | Supplier delivery windows |
| `promotion` | Marketing campaign schedules |

### Database Schema (Planned)

```sql
-- scheduled_events table
- id
- title
- description
- type (shift | meeting | task | delivery | promotion)
- startAt (timestamp)
- endAt (timestamp)
- allDay (boolean)
- recurrence (none | daily | weekly | monthly)
- assignedTo (userId[], nullable)
- createdBy (userId)
- createdAt
- updatedAt

-- event_reminders table
- id
- eventId
- userId
- reminderAt (timestamp)
- notificationType (push | email | sms)
- sent (boolean)
```

### UI Components (Planned)

**Calendar Views:**
- Day view
- Week view
- Month view (default)
- Agenda/list view

**Event Creation:**
- Quick add from calendar click
- Full form with recurrence options
- Assign to team members
- Set reminders

**Integrations:**
- Google Calendar sync (future)
- iCal export
- Slack/Discord notifications (future)

---

## Utility Widgets

Floating toolbar widgets for quick access to common tools.

### Calculator Widget (Planned)

Quick calculator accessible from header toolbar.

**Features:**
- Basic arithmetic (+, -, ×, ÷)
- Percentage calculations
- Memory functions (M+, M-, MR, MC)
- History of recent calculations
- Copy result to clipboard
- Draggable/minimizable widget

### Widget System

All utility widgets share common behavior:

**Common Features:**
- Floating, draggable positioning
- Minimize to pill/icon
- Remember position across sessions
- Keyboard shortcuts to toggle
- Z-index management (active widget on top)

**Header Toolbar Icons:**
- Calendar (Calendar03Icon)
- Calculator (CalculateIcon)
- Radio/Music (Radio02Icon)
