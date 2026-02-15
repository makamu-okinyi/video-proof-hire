# Donjo System Valuation Analysis (Kenya, 4 B2B Customers)

## System Scope Summary

| Dimension            | Count |
| -------------------- | ----- |
| TypeScript/TSX files | 139   |
| Supabase migrations  | 40+   |
| Edge Functions       | 3 (webauthn, notify-status-change, send-notification) |
| Core domain entities | profiles, ventures, jobs, applications, challenges, videos, companies, messaging, notifications |

**Tech stack:** React 18, Vite, Supabase, Tailwind, shadcn/Radix, Framer Motion, Recharts, React PDF, PWA

**Core capabilities:**

- Multi-role auth (employer, founder, investor) with WebAuthn biometric
- Video pitch upload, storage, playback
- Job posting, applications, shortlisting
- Challenges with video submissions
- Real-time messaging, notifications
- Admin "Venture Engine" (review queue, analytics, PDF/CSV export)
- Company profiles, pitch decks, role-based dashboards

---

## Valuation Approach

### 1. Cost-to-Replicate (Development Equivalent)

| Component                                     | Est. effort      | Kenya dev rate (senior) | Cost (KES)        |
| --------------------------------------------- | ---------------- | ----------------------- | ----------------- |
| Frontend (139 files, auth, dashboards, video) | 4–5 months       | KES 180–250K/mo         | 720K–1.25M        |
| Backend (Supabase schema, RLS, migrations)    | 2–3 months       | KES 200–280K/mo         | 400K–840K         |
| Edge functions, integrations                  | 0.5–1 month      | KES 220K/mo             | 110K–220K         |
| Design, QA, DevOps setup                      | 1–1.5 months     | KES 150K/mo             | 150K–225K         |
| **Total replacement cost**                    | **~8–10 months** |                         | **1.38M – 2.54M** |

With overhead (20–30%): **KES 1.7M – 3.3M**

### 2. Revenue Multiple (B2B SaaS, 4 customers)

Assumptions:

- B2B "Startup Garage" style product in Kenya: KES 8,000–25,000/month per company
- Midpoint: KES 15,000/month × 4 = KES 60,000/month
- ARR: **KES 720,000**

Typical early-stage SaaS multiples:

- 2–4× ARR (pre-revenue / early traction)
- 4–6× ARR (with clear growth and retention)

With 4 customers and early stage: **2.5–4× ARR**  
**Range: KES 1.8M – 2.9M**

### 3. Kenyan Market Adjustments

- Local B2B SaaS valuations: typically **30–50%** of comparable US valuations
- 4 customers: early, unproven scale (downward pressure)
- Niche (video hiring) and technical depth (upward pressure)

---

## Valuation Range Summary

| Method                        | Low (KES)     | High (KES)    |
| ----------------------------- | ------------- | ------------- |
| Cost-to-replicate             | 1,700,000     | 3,300,000     |
| Revenue multiple (2.5–4× ARR) | 1,800,000     | 2,900,000     |
| **Combined reasonable range** | **1,800,000** | **3,000,000** |

**Recommended valuation for 4 B2B customers in Kenya: KES 2,000,000 – 2,500,000**

---

## Factors That Increase or Decrease Value

**Increase:**

- Strong contracts (12+ months) with the 4 companies
- Clear pipeline beyond 4 customers
- Unique IP (e.g. WebAuthn integration, analytics)
- Strong founder/team credentials

**Decrease:**

- Monthly or short-term contracts
- High churn risk
- Heavy dependency on a single customer
- No recurring revenue model

---

## Practical Usage

- **Asset sale (codebase + setup):** KES 1.5M – 2.2M  
- **Equity in operating company:** KES 2M – 2.5M (early-stage)  
- **Licensing or white-label:** KES 50K – 150K/month per licensee
