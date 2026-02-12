# Admin Review Panel — Implementation Summary

## Overview

The Founder video uploads (pitch videos from the Venture Engine application) are now connected to a centralized Admin Review Panel. Admins can view pending ventures, watch pitch videos, and approve or reject applications.

## What Was Implemented

### 1. Data Fetching

- **Admin Dashboard** fetches ventures from the `ventures` table where `review_status` is `'pending'` or `'submitted'`
- **useAdminVentures** hook (`src/hooks/useAdminVentures.ts`) provides:
  - `pendingVentures` — ventures awaiting review
  - `allVentures` — all ventures for overview stats
  - `updateStatus` — mutation to approve/reject

### 2. Review Logic

- **Approve** (Shortlist) and **Reject** buttons on each venture card
- Status updates persist to the database and trigger a re-render via React Query invalidation
- Toast notifications for success/error

### 3. Removed Dummy Data

- **AdminPanel**: Removed `mockApplications` and `applicationData`; replaced with real Supabase data
- **FounderDashboard**: Removed `ventureStatus` mock; replaced with `useFounderVenture` hook fetching the founder's venture from Supabase
- Mentors and announcements remain as placeholders for future features

### 4. Storage & RLS

- **Video URLs**: Founder pitch videos are stored in the Supabase `videos` storage bucket via `useVideoUpload`. The bucket has a public SELECT policy: *"Anyone can view videos"*, so admins can view pitch videos without additional RLS.
- **Admin RLS**: New migration adds:
  - `review_status` column to `ventures` (values: `pending`, `submitted`, `shortlisted`, `rejected`)
  - Policy: *"Admins can view all ventures for review"* (employer/investor roles)
  - Policy: *"Admins can update venture review status"*

### 5. Middleware / Access Control

**Note:** This project does not use `middleware.ts`. It is a React SPA with client-side routing. Access control is enforced by:

- **AdminRoute** (`src/components/auth/AdminRoute.tsx`) — wraps `/admin` and redirects non-admins (user_type !== `employer` && !== `investor`) to `/feed`
- Only users with `employer` or `investor` roles can access the Admin Review Panel

## Database Migration

Run the migration to add `review_status` and admin RLS:

```bash
supabase db push
# or
supabase migration up
```

Migration file: `supabase/migrations/20260212120000_venture_review_status.sql`

## Data Model

| Column        | Type   | Values                                   |
|---------------|--------|------------------------------------------|
| review_status | TEXT   | `pending`, `submitted`, `shortlisted`, `rejected` |

Ventures created via FounderWizard default to `submitted` (migration default). Existing ventures are backfilled with `submitted`.

## Files Changed

| File | Change |
|------|--------|
| `supabase/migrations/20260212120000_venture_review_status.sql` | New migration |
| `src/hooks/useAdminVentures.ts` | New hook for admin venture data |
| `src/hooks/useFounderVenture.ts` | New hook for founder's venture |
| `src/pages/AdminPanel.tsx` | Real data, Approve/Reject to DB |
| `src/pages/FounderDashboard.tsx` | Real venture data from Supabase |
| `src/integrations/supabase/types.ts` | Added `review_status` to ventures |
