# LuxStay Web — Design & Style Guide (StyleH.md)
throughout `src/app/` and `src/components/`.
Design system: **"Design System v3 — Liquid Glass + Swiss Minimalism & Modern Luxury"**
Defined in `src/app/globals.css` (Tailwind CSS v4 `@theme inline` tokens) and applied via utility classes 

---

## 1. Color Palette

### Brand Colors

| Token | Hex | Usage |
|---|---|---|
| `--color-primary` | `#0F2942` | **Sapphire Navy** — the dominant brand color. Hero sections, headers, primary buttons, navbars, dark panels. (561 usages) |
| `--color-primary-hover` | `#163859` | Hover state for primary surfaces |
| `--color-secondary` | `#1E3A8A` | Deep interactive navy (links, secondary actions) |
| `--color-accent` | `#D4AF37` | **Champagne Gold** — the luxury signature. CTAs, focus rings, icons, kickers, badges, scrollbars. (476 usages) |
| `--color-accent-hover` | `#C5A028` | Gold hover |
| `--color-accent-subtle` | `#FEF9E7` | Subtle gold tint backgrounds |
| `--color-accent-foreground` | `#0B0F17` | Text on gold surfaces |
| `#B8860B` / `#E5C158` | — | Darker / lighter gold variants used inline for gradient accents and hover text |

### Surface & Text (Slate scale)

| Token | Hex | Usage |
|---|---|---|
| `--color-background` | `#F8FAFC` | Light page canvas |
| `--color-background-dark` | `#0B0F17` | Dark-mode canvas |
| `--color-foreground` | `#0F172A` | Primary body text |
| `--color-foreground-muted` | `#475569` | Muted body text |
| `--color-muted-foreground` | `#64748B` | Secondary text, descriptions |
| `--color-card` | `#FFFFFF` | Cards, modals, sheets |
| `--color-border` | `rgba(15,41,66,.08)` | Hairline card borders |
| `--color-border-gold` | `rgba(212,175,55,.35)` | Gold hover borders |

### Semantic Feedback

| Token | Hex | Meaning |
|---|---|---|
| `--color-success` | `#10B981` Emerald | Verified badges, success toasts |
| `--color-warning` | `#F59E0B` Amber | Deposits, guest notices, stale data |
| `--color-danger` | `#EF4444` Crimson | Emergency, cancel, errors |
| `--color-info` | `#3B82F6` Sky Blue | Informational banners |
| `--color-ring` | `#D4AF37` | Gold focus ring on all inputs |

### Signature combinations
- **Navy + Gold on white** is the identity: `bg-[#0F2942] text-white` panels with `text-[#D4AF37]` kickers/labels.
- Editorial hero: navy gradient overlay (`from-[#0F2942] via-[#0F2942]/60`) over photography with gold uppercase tracking-wide eyebrow text.
- Dark cream canvas on Discover pages: `#FAF8F5`.

---

## 2. Typography

Loaded in `src/app/layout.tsx` via `next/font/google`:

| Font | Role | Notes |
|---|---|---|
| **Playfair Display** (`font-serif`) | All headings, display text, section titles, prices | Classic luxury serif; 167+ usages. Often `font-serif text-2xl/3xl font-bold` |
| **Plus Jakarta Sans** (`font-sans`) | Body, UI, labels, buttons | Default on `body` |
| **Noto Sans Ethiopic** (`font-ethiopic`) | Amharic (ግዕዝ) glyphs | Ensures correct rendering of `am` locale content |

Typographic patterns:
- **Eyebrow/kicker**: `text-xs font-bold uppercase tracking-[0.2em–0.25em] text-[#D4AF37]` above serif headings.
- **Hero display**: `font-serif text-4xl → text-7xl font-bold uppercase tracking-tight` (occasionally `italic font-light lowercase` for contrast).
- **Body**: 16px, line-height 1.6, antialiased.

---

## 3. Shape, Radius & Shadows

Radius scale (generously rounded, "soft luxury"):

```
--radius-sm: 8px · --radius: 12px · --radius-md: 14px
--radius-lg: 20px · --radius-xl: 28px · --radius-full: 9999px
```

Common: cards use `rounded-2xl`/`rounded-3xl`; chips and tags use `rounded-full`.

Shadow profiles (Liquid Glass):
- `--shadow-card` — subtle default card elevation
- `--shadow-elevated` — hover lift on cards
- `--shadow-glass` — glassmorphism panels (`bg-white/10 backdrop-blur-md` over photos)
- `--shadow-gold` — gold CTA glow

---

## 4. Components (src/components/ui/)

`Button` (variants: primary, gold, outline, ghost; min-h 44px touch targets), `Badge`, `StatusBadge`, `Input`, `Modal`, `Drawer`, `Toast`, `Skeleton`, `EmptyState`, `ErrorState`, `IconButton`.

Consistent card recipe:
```
rounded-3xl border border-slate-200/80 bg-white shadow-sm
hover:-translate-y-1 hover:border-[#D4AF37]/60 hover:shadow-xl transition
```

---

## 5. Layout & Spacing

- Max width container: `mx-auto max-w-7xl px-4 sm:px-6` (discover) / `max-w-6xl` (transportation).
- Section rhythm: `space-y-16` between editorial sections; `py-12` padding.
- Sections open with kicker + serif heading + bottom border (`border-b border-slate-200 pb-4`).
- Grids: destination `sm:grid-cols-2 lg:grid-cols-4` (first card spans 2×1 featured); places `md:grid-cols-2 lg:grid-cols-3`.
- Touch targets: `min-h-11` (44px) on buttons/tabs.

---

## 6. Motion

- Card hover: `-translate-y-1` lift + shadow grow + gold border reveal.
- Image hover: slow scale `duration-500 group-hover:scale-105`.
- Gradients fade photos into navy (`bg-gradient-to-t from-[#0F2942]`).
- Modals: `animate-in fade-in zoom-in-95`.
- Smooth scrolling via `scrollIntoView({ behavior: 'smooth' })`.

---

## 7. Dark Mode

Tailwind v4 custom variant: `@custom-variant dark (&:where(.dark, .dark *))`.
Implemented with CSS overrides in `globals.css` (`html.dark` rules remapping white/slate surfaces to `#0B0F17`, `#111827`, `#1E293B` and text to gray scale) plus inline `dark:` classes on components.

---

## 8. Internationalization & Ethiopian Context

- **Languages**: English (`en`) + Amharic (`am`) via `src/lib/i18n.ts`; 13 namespaces under `src/locales/{en,am}/`.
- **Amharic-first content**: heritage pages prefer curated Amharic copy (`heritage-content.am.ts`); places carry `amharicName`/`amharicDescription` from the API.
- Gold accents echo Ethiopian heritage aesthetics; images lean on Ethiopian landmarks (Lalibela, Gondar, Entoto).

---

## 9. Iconography & Imagery

- **Icons**: `lucide-react` only — outline style, 3.5–5px sizing, frequently gold-tinted (`text-[#D4AF37]`).
- **Images**: `next/image` with `fill` + `object-cover`; photography always gradient-masked into navy; Wikimedia-based fallbacks via `src/lib/images.ts` (`localImage`).

## 10. Do / Don't

- ✅ Use sapphire `#0F2942` for structure, gold `#D4AF37` only as accent (kickers, rings, CTAs, highlights).
- ✅ Serif for headings, sans for everything else.
- ✅ Rounded-3xl cards, soft shadows, glass overlays over photos.
- ❌ No pure black; dark surfaces are `#0B0F17`/`#0F2942`.
- ❌ Don't hardcode UI copy — route through `t(namespace, key)`; add keys to **both** `en` and `am` locale files.
