# Donjo Architecture Fixes — Summary

## 1. Role-Based Data Isolation ✅

- **Founder Dashboard** (`/founder`): Uses `useFounderVenture(userId)` — displays only the founder's venture. Shows "Get Started" when no venture exists.
- **Feed** (`/feed`): Redirects admins to `/admin` and founders to `/founder`. Only "talent" or users without a role see Feed, with **their own** stats from `useFeedStats(userId, false)`.
- **Admin Panel** (`/admin`): Fetches full venture list from `ventures` table via `useAdminVentures`.

## 2. Dynamic Data Fetching ✅

- **Admin Panel**: Real data from `ventures` table (useAdminVentures). No mock data.
- **Founder Dashboard**: Real data from `useFounderVenture` (user's venture via venture_founders).
- **Feed**: Real stats from `useFeedStats` — admin gets global venture counts, founder/talent gets their venture count.
- **Storage**: Venture applications live in the `ventures` table. Pitch videos are in `ventures.pitch_video_url` (Supabase `videos` bucket). There is no separate "applications" table.

## 3. Routing Logic ✅

- **Index** (`/`): Role-based redirect — admin → `/admin`, founder → `/founder`, others → `/feed`.
- **Feed** (`/feed`): Redirects admin/founder to their dashboard via `useRoleBasedRedirect`.
- **Dashboard link** (sidebar): Role-aware — `/admin` for admin, `/founder` for founder, `/feed` for others.
- **Route aliases**: `/admin/dashboard` → `/admin`, `/founder/dashboard` → `/founder`.
- **Protected routes**: `AdminRoute`, `FounderRoute`, `EmployerRoute` wrap role-specific pages.

## 4. Mobile UI/UX ✅

- **Global**: `overflow-x: hidden` on html/body; `body` uses `min-height: 100dvh`, safe-area padding.
- **DashboardLayout**: `overflow-x-hidden`, `min-w-0`, `max-w-full` on main content.
- **Pages**: `overflow-x-hidden`, `w-full max-w-full`, responsive padding (`px-1 sm:px-0`), `min-w-0` on quick action buttons.
- **Responsive typography**: `text-xl sm:text-2xl lg:text-3xl` for headings.
- **index.html**: `viewport-fit=cover` for safe-area.
- **Utilities**: `safe-area-pb`, `safe-area-pt` in index.css.

## 5. Storage & Table Verification ✅

- **Applications**: Stored in `ventures` table (not a separate "applications" table).
- **Pitch videos**: `ventures.pitch_video_url` (Supabase `videos` bucket).
- **Admin**: Fetches from `ventures` with `venture_founders` and `profiles` join.
- **Founder**: Fetches from `ventures` via `venture_founders` filtered by `user_id`.

## 6. Middleware & Role Persistence ✅

- **No middleware.ts**: Donjo is a React SPA. Role checks are enforced by:
  - `AdminRoute`, `FounderRoute`, `EmployerRoute` (route wrappers)
  - `AuthContext` (profile, user_type from `user_roles` + `profiles`)
  - `useRoleBasedRedirect` (redirects when role users hit /feed)
- **Role persistence**: AuthContext fetches `user_roles` and `profiles` on auth change. Profile persists across route changes.
- **DashboardLayout**: Shared layout; sidebar uses `profile?.user_type` for role-aware navigation.
