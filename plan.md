# Channels / Servers Implementation Plan

## Context

The messages page has a server sidebar (`servers-sidebar.tsx`) that previously had fake placeholder stores (Coffee Store, Matcha Store, Skate Shop). Those were already removed. Now we need to build the actual Discord/Slack-style server system: users can create servers, and within servers they can create categories and channels. This is completely separate from the workspace system used on the dashboard.

## Current State

- `servers-sidebar.tsx` has full UI scaffolding (HomeButton, ServerIcon, AddServerButton, NotificationBadge) but SERVERS array is empty and AddServerButton has a TODO
- `messageChannels` table exists but is workspace-scoped (not server-scoped) - will repurpose/evolve this
- No `servers`, `server_members`, or `server_categories` tables exist
- Current team messages use `channel: text("channel").default("general")` as a flat string
- Messaging uses Pusher WebSocket for real-time updates
- Workspace pattern (`workspaces`/`workspaceMembers`) is a good template

## Implementation

### Step 1: Database Schema

Create `packages/db/src/schema/servers.ts`:

**`servers` table:**
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | defaultRandom |
| name | text | NOT NULL |
| icon | text | nullable, URL to server icon |
| ownerId | text FK -> users.id | NOT NULL, cascade delete |
| createdAt | timestamp | defaultNow |
| updatedAt | timestamp | defaultNow |

**`serverMembers` table:**
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | defaultRandom |
| serverId | uuid FK -> servers.id | NOT NULL, cascade delete |
| userId | text FK -> users.id | NOT NULL, cascade delete |
| role | text | "owner" / "admin" / "member", default "member" |
| joinedAt | timestamp | defaultNow |

Unique constraint on (serverId, userId). Index on userId and serverId.

**`serverCategories` table:**
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | defaultRandom |
| serverId | uuid FK -> servers.id | NOT NULL, cascade delete |
| name | text | NOT NULL |
| sortOrder | integer | default 0 |
| createdAt | timestamp | defaultNow |

Index on serverId.

**`serverChannels` table:**
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | defaultRandom |
| serverId | uuid FK -> servers.id | NOT NULL, cascade delete |
| categoryId | uuid FK -> serverCategories.id | nullable (uncategorized channels), set null on delete |
| name | text | NOT NULL |
| slug | text | NOT NULL |
| description | text | nullable |
| type | text | "text" / "voice" / "announcements", default "text" |
| sortOrder | integer | default 0 |
| createdAt | timestamp | defaultNow |

Index on serverId, categoryId.

Export from `packages/db/src/schema/index.ts`.

### Step 2: Migration

Run `npx drizzle-kit generate` then `npx drizzle-kit push` from `packages/db/` to create the tables in local Docker Postgres.

### Step 3: Server Actions

Create `apps/admin/app/(dashboard)/messages/server-actions.ts`:

- `getUserServers()` - Get all servers the current user is a member of (with unread counts)
- `createServer(name: string, icon?: string)` - Create server, auto-create "General" category + "#general" channel, add creator as owner
- `deleteServer(serverId: string)` - Owner only
- `updateServer(serverId: string, data)` - Update name/icon
- `getServerDetails(serverId: string)` - Get categories and channels for a server
- `createCategory(serverId: string, name: string)` - Admin+ only
- `deleteCategory(categoryId: string)` - Move channels to uncategorized
- `createChannel(serverId: string, categoryId: string | null, name: string, type?: string)` - Admin+ only
- `deleteChannel(channelId: string)` - Admin+ only
- `joinServer(serverId: string)` - Add current user as member
- `leaveServer(serverId: string)` - Remove self (can't leave if owner)
- `sendServerMessage(serverId: string, channelId: string, body: string, attachments?)` - Send message to a server channel
- `getServerChannelMessages(serverId: string, channelId: string)` - Fetch messages for a channel

### Step 4: Create Server Dialog

Create `apps/admin/app/(dashboard)/messages/create-server-dialog.tsx`:

- Dialog with form: server name (required), icon upload (optional)
- On submit: calls `createServer()` action
- Auto-creates "General" category with "#general" channel
- Returns to server list with new server selected

### Step 5: Update Servers Sidebar

Modify `apps/admin/components/servers-sidebar.tsx`:

- Accept `servers` prop (fetched from DB) instead of hardcoded array
- Accept `activeServerId` and `onServerSelect` props
- Wire AddServerButton to open CreateServerDialog
- Show unread badge counts per server
- "Home" button goes back to DMs/Team/Friends/Inbox view (current behavior)
- Selecting a server updates the main content area to show that server's channels

### Step 6: Server Channel List View

When a server is selected in the servers sidebar, the main chat sidebar (`chat-sidebar.tsx`) should show:
- Server name header with settings gear icon
- Categories as collapsible groups
- Channels listed under their categories with # prefix
- Uncategorized channels at the top
- "Create Channel" button (admin+ only)

This replaces the team members / friends / inbox list when a server is active.

### Step 7: Server Channel Chat

When a channel within a server is selected:
- The main chat area (`chat-tab.tsx`) renders messages for that specific channel
- Messages are scoped to `serverId + channelId` (not workspace)
- Pusher channel: `private-server-{serverId}-channel-{channelId}`
- All server members receive messages in that channel

### Step 8: Wire Everything Together

- `messages-client.tsx` - Fetch user's servers on mount, pass to context
- `chat-context.tsx` - Add `activeServer` state, `servers` list, server channel management
- `workspace-sidebar-wrapper.tsx` - Pass server data to ServersSidebar
- `messages/page.tsx` - Server component fetches servers and passes to client

## Files to Create
- `packages/db/src/schema/servers.ts` - New DB tables
- `apps/admin/app/(dashboard)/messages/server-actions.ts` - Server CRUD actions
- `apps/admin/app/(dashboard)/messages/create-server-dialog.tsx` - Create server UI

## Files to Modify
- `packages/db/src/schema/index.ts` - Add `export * from "./servers"`
- `apps/admin/components/servers-sidebar.tsx` - Real servers from DB, props-driven
- `apps/admin/components/messages/chat-sidebar.tsx` - Show channel list when server active
- `apps/admin/components/messages/chat-context.tsx` - Add server state management
- `apps/admin/app/(dashboard)/messages/messages-client.tsx` - Fetch/pass server data
- `apps/admin/app/(dashboard)/messages/page.tsx` - Server query in server component
- `apps/admin/app/(dashboard)/messages/chat-tab.tsx` - Support server channel messaging
- `apps/admin/app/(dashboard)/messages/actions.ts` - Add server-scoped message queries
- `apps/admin/components/workspace-sidebar-wrapper.tsx` - Pass server data through

## Existing Code to Reuse
- `workspaces` / `workspaceMembers` pattern in `packages/db/src/schema/workspaces.ts` for membership tables
- `ServerIcon`, `HomeButton`, `AddServerButton`, `NotificationBadge` components already in `servers-sidebar.tsx`
- `sendTeamMessage()` pattern in `actions.ts` for server channel messages
- Pusher real-time pattern from `chat-tab.tsx` for server channels
- `messageChannels` table structure (existing, workspace-scoped) as reference for `serverChannels`

## Verification
1. `npx drizzle-kit push` succeeds - tables created in local Postgres
2. `npx turbo run build --filter=@jetbeans/admin` passes
3. Navigate to /messages, servers sidebar shows empty state with Add button
4. Click "Add a Server" - dialog opens, create a server
5. Server appears in sidebar with initials avatar
6. Click server - channel list shows "General" category with "#general" channel
7. Click #general - chat area loads, can send/receive messages
8. Create additional categories and channels
9. Messages are scoped correctly per channel
