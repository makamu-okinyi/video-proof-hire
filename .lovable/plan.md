
# Donjo Transformation: 14-Day Deadline Gap Analysis & Sprint Plan

## Executive Summary

Your strategic directive is comprehensive and well-architected. The good news: **~40% of the foundation is already in place**. The database schema pivot has been executed, the Founder Wizard exists, and the Venture Gallery is functional. However, **critical gaps remain** for the 300+ HackHouse applications.

---

## What's Already Built (Foundation Layer)

| Component | Status | Notes |
|-----------|--------|-------|
| Database Schema | COMPLETE | `ventures`, `venture_founders`, `venture_scores`, `investor_bookmarks`, `intro_requests`, `pitch_decks`, `venture_tech_blocks`, `hackathon_cohorts` |
| RLS Policies | COMPLETE | Role-based access for founders, judges, investors |
| Founder Wizard | COMPLETE | 6-step application wizard with validation |
| Venture Gallery | COMPLETE | Masonry layout with search/filter |
| Auth System | COMPLETE | Email/password + OAuth support |
| User Roles | COMPLETE | `talent`, `employer`, `founder`, `investor`, `judge` |
| Design System | COMPLETE | Minimalist aesthetic with Success Orange (#FF5733) |

---

## Critical Gaps for 300+ Applications

### Priority 1: Application Flow Blockers

| Gap | Impact | Days to Fix |
|-----|--------|-------------|
| No Venture Detail Page | Investors can't deep-dive | 1 day |
| No Pitch Deck Upload | Critical asset missing | 0.5 day |
| No Pitch Video Upload | HLS-ready pipeline missing | 1 day |
| Auth redirect broken | Users can't complete wizard | 0.5 day |

### Priority 2: Investor Experience (Deal Flow)

| Gap | Impact | Days to Fix |
|-----|--------|-------------|
| No Swipe Interface | Can't triage 300+ ventures rapidly | 1.5 days |
| No "Request Intro" button | Double-opt-in workflow missing | 1 day |
| No Investor Dashboard | No bookmark/pass management | 1 day |

### Priority 3: Judge Scoring Engine

| Gap | Impact | Days to Fix |
|-----|--------|-------------|
| No Scoring Interface | Judges can't evaluate | 1.5 days |
| No Leaderboard | No visibility into rankings | 0.5 day |
| No Cohort Assignment | Can't link to HackHouse event | 0.5 day |

### Priority 4: Admin/Client Control Center

| Gap | Impact | Days to Fix |
|-----|--------|-------------|
| No Admin Dashboard | Organizers have no visibility | 2 days |
| No Application Review | Can't manage 300+ submissions | 1 day |
| No Analytics | No funnel/engagement metrics | 1 day |
| No Bulk Actions | Can't feature/approve at scale | 0.5 day |

---

## Revised 14-Day Sprint Roadmap

### Phase 1: Core Application Flow (Days 1-3)

**Goal:** Founders can submit complete applications with video/deck

```text
Day 1:
├── Fix auth redirect after signup
├── Build Venture Detail Page with Framer Motion morph
└── Implement pitch deck upload to Supabase Storage

Day 2:
├── Implement video upload pipeline
├── Add video player with HLS placeholder
└── Create "Edit Venture" capability

Day 3:
├── Add co-founder invite flow
├── Implement "Save Draft" functionality
└── Mobile optimization pass
```

### Phase 2: Investor Experience (Days 4-6)

**Goal:** Investors can rapidly triage and request intros

```text
Day 4:
├── Build Investor Dashboard shell
├── Implement Tinder-style swipe interface
└── Bookmark/Pass persistence

Day 5:
├── Build Venture Deep-Dive view
│   └── Floating video over data layout
├── Implement "Request Intro" button
└── Create intro request notification

Day 6:
├── Founder approval flow for intros
├── Connection confirmation workflow
└── Investor bookmarks management
```

### Phase 3: Judge Scoring Engine (Days 7-9)

**Goal:** Judges can score ventures on the rubric

```text
Day 7:
├── Build Judge Dashboard
├── Create scoring interface
│   └── Impact, Feasibility, Innovation, UX (0-10)
└── Auto-calculate total score

Day 8:
├── Build real-time leaderboard
├── Add qualitative feedback fields
└── Implement "Submit Final Score"

Day 9:
├── Create cohort assignment for HackHouse
├── Judge assignment to ventures
└── Score visibility rules (founders see after event)
```

### Phase 4: Admin Control Center (Days 10-12)

**Goal:** Organizers can manage the entire pipeline

```text
Day 10:
├── Build Admin Dashboard shell
├── Application list with filters
│   └── By stage, industry, score
└── Application detail view

Day 11:
├── Bulk actions (feature, approve, reject)
├── Judge management (invite, assign)
├── Sponsor management

Day 12:
├── Cohort/Event configuration
├── White-label settings (logo, colors)
└── Communication hub (mass notifications)
```

### Phase 5: Analytics & Polish (Days 13-14)

**Goal:** Data-driven insights + production hardening

```text
Day 13:
├── Funnel analytics dashboard
│   └── Draft → Submitted → Reviewed
├── Engagement metrics
│   └── Video watch time, bookmarks, intro requests
└── Sector distribution charts

Day 14:
├── Performance optimization
│   └── SSG for public gallery
├── Error handling + edge cases
├── Final mobile QA pass
└── Load testing for 300+ concurrent users
```

---

## Technical Architecture Decisions

### Video Pipeline (Nairobi-Native Performance)

```text
Upload Flow:
┌─────────────────────────────────────────────────────────┐
│  Founder Device → Supabase Storage → CDN (Edge Cache)  │
└─────────────────────────────────────────────────────────┘

Playback Strategy:
- Progressive download with quality selector (480p/720p/1080p)
- Lazy loading with intersection observer
- Thumbnail preload for gallery view
```

### Role-Based Navigation

```text
Founder:     /apply → /ventures → /ventures/:id/edit
Investor:    /invest → /invest/swipe → /ventures/:id
Judge:       /judge → /judge/score/:ventureId
Admin:       /admin → /admin/applications → /admin/analytics
```

### Database Indexes Needed

```sql
-- For rapid filtering on 300+ applications
CREATE INDEX idx_ventures_stage ON ventures(stage);
CREATE INDEX idx_ventures_industry ON ventures USING GIN(industry);
CREATE INDEX idx_venture_scores_total ON venture_scores(total_score DESC);
```

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Video uploads fail on 3G | Chunked upload with resume capability |
| 300+ concurrent users | CDN caching + connection pooling |
| Judge score manipulation | RLS enforces `judge_id = auth.uid()` |
| Investor spam to founders | Double-opt-in + rate limiting |

---

## What's NOT in Scope (Post-Deadline)

- M-Pesa integration (prize disbursement)
- Africa's Talking SMS gateway
- Post-event momentum tracking
- Advanced white-labeling
- Email domain restrictions

---

## Immediate Next Steps

1. **Fix Venture Detail Page** - Users clicking ventures get 404
2. **Add File Upload** - Pitch decks are the minimum viable asset
3. **Build Investor Swipe** - Core value proposition for deal flow
4. **Create Admin Shell** - Organizers need visibility immediately

---

## Verdict: Can This Ship in 14 Days?

**Yes, but with scope trimming.** The core loop (Apply → Review → Score → Connect) is achievable. Analytics and white-labeling can be MVP-level. The database foundation is solid—it's now an execution sprint.

**Confidence Level:** 85% if we prioritize ruthlessly.
