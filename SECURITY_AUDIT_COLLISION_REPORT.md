# Donjo Security Audit — Admin vs Founder Panel Collision Report

**Audit Date:** February 12, 2026  
**Scope:** Strict separation between Admin Panel and Founder Panel  
**Codebase:** video-proof-hire (Donjo)

---

## Executive Summary

The audit identified **critical security gaps** that allow a Founder to access the Admin Panel by simply typing `/admin` in the browser. There is no route-level role enforcement, shared components with conditional logic create collision risk, and the AuthContext has incomplete role typing. Data fetching currently uses mock data, so backend scope separation is not yet in play—but the architecture does not support it when real data is introduced.

---

## 1. Routing Isolation

### CRITICAL: No Role-Based Route Guards

| File | Issue |
|------|-------|
| `src/App.tsx` | `/admin` and `/founder` routes are declared without any `ProtectedRoute` or role-based wrapper. Both render `AdminPanel` and `FounderDashboard` directly. |
| `src/pages/AdminPanel.tsx` | Only checks `isAuthenticated`; does **not** verify `profile?.user_type === 'employer' \|\| profile?.user_type === 'investor'`. A Founder can access the full Admin Panel. |
| `src/pages/FounderDashboard.tsx` | Same pattern: only `isAuthenticated` is checked. No explicit Founder role check. |

**Attack vector:** A Founder logs in, then manually navigates to `/admin`. The Admin Panel renders in full because there is no role check.

**Evidence (AdminPanel.tsx:58–61):**
```tsx
useEffect(() => {
  if (!isLoading && !isAuthenticated) navigate('/auth');
}, [isAuthenticated, isLoading, navigate]);
// Missing: if (profile?.user_type !== 'employer' && profile?.user_type !== 'investor') navigate('/feed');
```

### Layout Sharing

- Both Admin and Founder pages use the **same** `DashboardLayout` (`src/components/layout/DashboardLayout.tsx`).
- No separate `AdminLayout` or `FounderLayout`; no middleware or route-level wrappers.

---

## 2. Authentication & RBAC

### Role Check Gaps

| File | Issue |
|------|-------|
| `src/pages/AdminPanel.tsx` | No role check on mount or navigation. |
| `src/pages/FounderDashboard.tsx` | No role check on mount or navigation. |
| `src/pages/EmployerDashboard.tsx` | No auth check at all (no `isAuthenticated` or `isLoading` guard). |
| `src/pages/EmployerSettings.tsx` | Needs verification (not audited in depth). |

### AuthContext Role Typing

| File | Issue |
|------|-------|
| `src/context/AuthContext.tsx` | `UserRole` interface only has `'talent' | 'employer'`. The DB `app_role` enum includes `'founder' | 'investor' | 'judge'`. Incomplete typing can hide role-handling bugs. |
| `src/context/AuthContext.tsx` | `fetchProfile` uses `user_roles.maybeSingle()`. If a user has multiple roles, this can return `null` and `profile.user_type` may be wrong. |

### Backend Role Enforcement

- Supabase RLS policies use `has_role(auth.uid(), 'judge')`, `has_role(auth.uid(), 'investor')`, etc., for ventures, scores, and bookmarks.
- There is no admin-specific table or view. AdminPanel uses mock data; once real admin queries are added, RLS must explicitly restrict them to admin roles.

---

## 3. Component Leakage

### Shared Components with Conditional Logic

| Component | Path | Issue |
|-----------|------|-------|
| **DashboardSidebar** | `src/components/layout/DashboardSidebar.tsx` | Same sidebar for Admin and Founder. Uses `isAdmin` and `isFounder` to show/hide nav groups. While nav links are hidden, the sidebar does not block direct URLs. Risk of state collision if future logic depends on the same flags. |
| **DashboardLayout** | `src/components/layout/DashboardLayout.tsx` | Single layout used by Admin, Founder, Employer, Feed, Profile, etc. No separation by role. |
| **Feed** | `src/pages/Feed.tsx` | Shared page with conditional copy: `isAdmin ? "Startup Garage program overview..." : "Here's what's happening with your ventures..."`. Same component serves both Admin and Founder perspectives. |

### Sidebar Logic (DashboardSidebar.tsx:103–111)

```tsx
const isAdmin = profile?.user_type === 'employer' || profile?.user_type === 'investor';
const isFounder = profile?.user_type === 'founder' || profile?.user_type === 'talent';

const navGroups = [
  mainMenuItems,
  ...(isFounder ? [founderItems] : []),
  ...(isAdmin ? [adminItems] : []),
  managementItems,
];
```

This only controls visibility. It does not prevent navigation to `/admin` or `/founder`.

### BottomNav

| File | Issue |
|------|-------|
| `src/components/layout/BottomNav.tsx` | Only distinguishes `employer` vs applicant. No handling for `founder` or `investor`. Founders may see the applicant nav instead of a Founder-specific nav. |

---

## 4. Data Fetching (Hooks)

### Current State

- No `getFounderData` or `getAdminAnalytics` hooks found.
- `AdminPanel` and `FounderDashboard` use hardcoded mock data.
- No React Query or similar patterns for admin vs founder data.

### Risk When Real Data Is Added

- Custom hooks or API calls must be explicitly scoped by role.
- Admin queries should use `has_role` or equivalent backend checks.
- Founder queries should filter by `auth.uid()` and venture ownership.
- Avoid generic hooks that can be reused for both Admin and Founder without role checks.

---

## 5. State Management

### Current Setup

- No Zustand, Redux, or other global store.
- Only `AuthContext` holds `user`, `session`, and `profile` (including `user_type`).

### Assessment

- Single context for auth reduces risk of conflicting admin/founder state.
- On logout, `profile` is cleared, so no obvious cross-session leakage.
- **Recommendation:** When adding admin- or founder-specific state, keep it in separate stores or explicitly namespaced to avoid accidental sharing.

---

## 6. Additional Findings

### Missing Route Labels

| File | Issue |
|------|-------|
| `src/components/layout/DashboardTopBar.tsx` | `routeLabels` lacks `/admin` and `/founder`. Breadcrumbs fall back to generic labels ("Admin", "Founder"). |

### Employer Dashboard Auth

| File | Issue |
|------|-------|
| `src/pages/EmployerDashboard.tsx` | No `isAuthenticated` or `isLoading` check. Unauthenticated users could land on this page if they navigate directly. |

---

## Summary: Files Requiring Refactoring

| Priority | File | Action |
|----------|------|--------|
| **P0** | `src/App.tsx` | Add `AdminRoute` and `FounderRoute` wrappers that enforce role before rendering. |
| **P0** | `src/pages/AdminPanel.tsx` | Add role check: redirect to `/feed` if `profile?.user_type` is not `employer` or `investor`. |
| **P0** | `src/pages/FounderDashboard.tsx` | Add role check: redirect to `/feed` if `profile?.user_type` is not `founder` or `talent`. |
| **P0** | `src/pages/EmployerDashboard.tsx` | Add auth + role check (employer/investor). |
| **P1** | `src/components/layout/DashboardLayout.tsx` | Consider `AdminLayout` and `FounderLayout` variants, or pass a `variant` prop to isolate layout behavior. |
| **P1** | `src/components/layout/DashboardSidebar.tsx` | Split into `AdminSidebar` and `FounderSidebar`, or ensure the shared version never exposes admin links to founders. |
| **P1** | `src/pages/Feed.tsx` | Consider splitting into `AdminFeed` and `FounderFeed` to avoid conditional logic that mixes perspectives. |
| **P1** | `src/context/AuthContext.tsx` | Extend `UserRole` to include `founder`, `investor`, `judge`. Fix `user_roles` query for users with multiple roles. |
| **P2** | `src/components/layout/DashboardTopBar.tsx` | Add `/admin` and `/founder` to `routeLabels`. |
| **P2** | `src/components/layout/BottomNav.tsx` | Add Founder-specific nav items when `profile?.user_type === 'founder'`. |

---

## Recommended Implementation: Route Guards

Create a role-aware route guard:

```tsx
// src/components/auth/AdminRoute.tsx
export function AdminRoute({ children }: { children: React.ReactNode }) {
  const { profile, isLoading, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) {
      navigate('/auth');
      return;
    }
    const isAdmin = profile?.user_type === 'employer' || profile?.user_type === 'investor';
    if (!isAdmin) {
      navigate('/feed');
    }
  }, [profile, isLoading, isAuthenticated, navigate]);

  if (isLoading) return <LoadingSpinner />;
  const isAdmin = profile?.user_type === 'employer' || profile?.user_type === 'investor';
  return isAdmin ? <>{children}</> : null;
}
```

Then wrap the admin route:

```tsx
<Route path="/admin" element={<AdminRoute><AdminPanel /></AdminRoute>} />
```

An equivalent `FounderRoute` should be added for `/founder`.

---

*End of Collision Report*
