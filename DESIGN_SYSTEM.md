# Donjo Design System

One cohesive visual language shared across **donjoafrica.com** (landing) and
**hr.donjoafrica.com** (app). Direction: clean, formal, confident B2B.
Neomorphic surfaces used *precisely* (not everywhere), generous spacing, and one
restrained brand accent. **Light theme is primary.**

> Implementation lives in `src/index.css` (CSS variables + utilities) and
> `tailwind.config.ts` (token → utility mapping). Restyle shadcn/ui primitives
> through these tokens — don't fork the components.

## Color tokens (HSL)

All colors are CSS variables consumed as `hsl(var(--token))`.

### Neutrals — warm-gray neomorphic base
| Token | Value | Use |
|---|---|---|
| `--background` | `220 16% 88%` | App surface (the neomorphic base) |
| `--foreground` | `220 15% 13%` | Primary text (12.3:1 on background) |
| `--muted-foreground` | `220 12% 38%` | Secondary text — **4.94:1 on background (WCAG AA ✓)** |
| `--card` / `--popover` | `220 16% 88–90%` | Raised surfaces |
| `--border` / `--input` | `220 14% 82%` | Hairlines, field borders |

> ⚠️ `--muted-foreground` was darkened from the original `46%` to `38%` so
> secondary text passes AA on the light base. Don't lighten it past ~40%.

### Brand accent — "Success Orange"
| Token | Value | Use |
|---|---|---|
| `--brand` | `14 100% 60%` | Vivid display tone — **decoration only** (focus ring, borders). Fails AA as text on light. |
| `--brand-strong` | `14 88% 44%` | Accessible fill — primary CTA background. **White text = 4.76:1 (AA ✓)** |
| `--brand-foreground` | `0 0% 100%` | Text on `--brand-strong` |
| `--ring` | `14 100% 60%` | Focus ring (brand) |

**Accent usage rule (important):** the brand orange is reserved for **primary
CTAs and focus states**, plus the occasional decorative border (e.g. the
"recommended" pricing card ring). It is **not** used for large fills or as body
/ label text on the light background (orange can't reach 4.5:1 on an 88%-light
surface). Keep eyebrows, labels, and body copy in the neutral tokens.

Tailwind mapping: `bg-brand`, `bg-brand-strong`, `text-brand-foreground`,
`ring-brand`, `border-brand`.

## Surfaces — neomorphism (use sparingly)

Shadow tokens (light source top-left):
```
--neo-shadow         : 12px 12px 24px #d1d9e6, -12px -12px 24px #ffffff
--neo-shadow-sm      :  6px  6px 12px #d1d9e6,  -6px  -6px 12px #ffffff
--neo-shadow-inset   : inset 6px 6px 12px ...,  inset -6px -6px 12px ...
--neo-shadow-pressed : inset 4px 4px  8px ...,  inset -4px -4px  8px ...
```

Utility classes (`src/index.css`):
| Class | Purpose |
|---|---|
| `.neo-extruded` / `.neo-extruded-sm` | Raised cards / panels |
| `.neo-inset` | Recessed inputs |
| `.neo-pressed` | Pressed pills, active nav, small chips |
| `.neo-pill` | **Primary CTA** — brand-strong fill, white text, neomorphic shadow, brand focus ring. Color is constant across hover/active (state shown via shadow + 1–2px translate) so contrast never drops. |
| `.squircle-icon` | 22%-radius icon tile |

## Radius

`--radius: 2rem` base. Tailwind: `rounded-lg/md/sm` derive from it. Pills use
`9999px`. Inputs/pressed elements use `calc(var(--radius) - 0.5rem)`.

## Type

- **Landing:** DM Sans (display + body), loaded from Google Fonts in `index.css`.
- **App:** Inter (body) + JetBrains Mono (code/metrics).
- Headings: bold, tight tracking (`tracking-tight`), `leading-[1.1]` on heroes.
- Eyebrows: `text-sm font-medium uppercase tracking-widest text-muted-foreground`.

## Motion

Subtle and professional. One staggered page-load reveal
(`animate-fade-in-up`, 0.6s) with small per-item `animationDelay`. Gentle hover
(shadow + 1px translate). No bouncing/confetti.

## Accessibility

- Target **WCAG AA** (4.5:1 normal text, 3:1 large/UI).
- Verified pairings: body `12.3:1`, secondary text `4.94:1`, CTA white-on-orange
  `4.76:1`.
- Focus states are always visible (brand outline with offset).

---

*Keep this file in sync between the two repos so the brand stays unified.*
