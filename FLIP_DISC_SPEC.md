# Flip Disc Literature Clock — Hardware Specification

## Why Flip Disc?

The original concept for this company installation was an LED matrix — NeoPixel strips in a frame, individually addressable pixels. That approach was abandoned for three reasons:

1. **Cost** — NeoPixel strips at wall scale are expensive. A 2m × 2m grid at 8mm pitch requires ~60,000 pixels across ~120 strips.
2. **Power** — NeoPixel draws up to 60mA per pixel at full white. Even at 20% brightness a grid this size needs 15–20A of 5V supply, heavy gauge wiring, and thermal planning.
3. **Aesthetics** — it would still just be a screen. Flip discs are mechanical. They make a sound. They hold their state without power. They look like something.

---

## Display Technology: Flip Disc (Split-Flap Dot Matrix)

Each "pixel" is a small electromagnetic disc that flips between a **white** face (on) and a **dark** face (off). The blue-highlighted time segment uses a second colour face. No power is needed to hold state — discs stay flipped until actively changed.

---

## Font & Character Grid

| Parameter | Value |
|---|---|
| Font glyph size | **5 × 7** discs per character |
| Horizontal gap between characters | 1 disc |
| Vertical gap between rows | 1 disc |
| **Cell size** (glyph + gaps) | **6 × 8** discs |
| **Discs per character cell** | **48** (6 × 8) |
| Max lit discs per character | 35 (5 × 7 active area) |
| Average lit discs per character | ~20 (varies by glyph) |

---

## Display Layout

The display has **3 content zones** stacked vertically:

| Zone | Content | Lines |
|---|---|---|
| **Quote** | Literary quote with time phrase highlighted | Variable — see analysis below |
| **Attribution** | `— Author, Book Title` (word-wrapped) | Up to 4 lines (6 allocated) |
| **Brand** | `LITERATURE CLOCK` (right-aligned) | 1 line |

A 10-disc vertical spacer separates the attribution and brand zones.

---

## Quote Dataset Analysis (3,626 entries)

All analysis at **31 characters per line** — the maximum that fits in 191 discs at 6 discs/char.

### Longest Quote (by wrapped lines)

- **Time:** 09:00
- **Author/Book:** Marsha Mehran, *Pomegranate Soup*
- **Wrapped lines:** 24
- **Characters:** 525

### Longest Attribution

- **Text:** `— Félicien de Saulcy, Narrative of a Journey Round the Dead Sea and in the Bible Lands in 1850 and 1851`
- **Characters:** 103
- **Wrapped lines:** 4

### Quote Length Distribution (@ 31 chars/line)

| Percentile | Quote lines | Total display lines (quote + attrib + brand) |
|---|---|---|
| Median (50%) | ~7 | ~10 |
| 95th percentile | ~14 | ~17 |
| 99th percentile | ~19 | ~22 |
| **Maximum (100%)** | **24** | **~27** |

---

## Web Simulator Parameters

The simulator (`index.html`) is sized to fit the absolute maximum entry without truncation:

| Parameter | Value |
|---|---|
| Grid width | **191 discs** |
| Grid height | **278 discs** |
| Total discs | **53,098** |
| Characters per line | **31** |
| Quote lines allocated | **24** (exact maximum) |
| Attribution lines allocated | **6** (max needed is 4, 2 lines headroom) |
| Spacer | 10 discs |
| Brand line | 1 line (8 discs) |
| Bottom padding | 20 discs |
| Physical equivalent | 152.8 cm × 222.4 cm @ 8 mm pitch |

---

## Hardware Panel Size Options

### Option A — Fits 100% of quotes ⭐ Matches simulator

| Parameter | Value |
|---|---|
| Characters per line | 31 |
| Quote lines | 24 |
| Attribution lines | 4 (actual max) |
| Spacer | 4 discs |
| Brand line | 1 |
| Border (top + bottom) | 8 discs total |
| **Grid (discs)** | **191 × 244** |
| **Total discs** | **46,604** |

#### Physical Size by Disc Pitch

| Disc Size | Pitch | Panel Width | Panel Height | Notes |
|---|---|---|---|---|
| **7 mm** | 7.5 mm | 143 cm | 183 cm | ✅ Wall-mountable |
| 10 mm | 11 mm | 210 cm | 268 cm | Large wall piece |
| 14 mm | 15 mm | 287 cm | 366 cm | ❌ Too large |

---

### Option B — Fits 99% of quotes (compact)

| Parameter | Value |
|---|---|
| Characters per line | 31 |
| Quote lines | 19 |
| Attribution lines | 4 |
| Spacer | 4 discs |
| Brand line | 1 |
| Border (top + bottom) | 8 discs total |
| **Grid (discs)** | **191 × 204** |
| **Total discs** | **38,964** |

#### Physical Size by Disc Pitch

| Disc Size | Pitch | Panel Width | Panel Height | Notes |
|---|---|---|---|---|
| **7 mm** | 7.5 mm | 143 cm | 153 cm | ✅ Nearly square — ideal wall art |
| 10 mm | 11 mm | 210 cm | 224 cm | ~2 m square |
| 14 mm | 15 mm | 287 cm | 306 cm | ❌ Too large |

---

### Option C — Compact (smaller panel, 28-disc-wide font, fits 95%)

Uses a 168-disc-wide panel (28 chars × 6 discs) instead of 191. Shorter panel, roughly square.

| Parameter | Value |
|---|---|
| Characters per line | 28 |
| Panel width | 168 discs |
| Quote lines | 17 |
| Attribution lines | 3 |
| Brand line | 1 |
| **Grid (discs)** | **168 × 176** |
| **Total discs** | **29,568** |

#### Physical Size by Disc Pitch

| Disc Size | Pitch | Panel Width | Panel Height | Notes |
|---|---|---|---|---|
| **7 mm** | 7.5 mm | 126 cm | 132 cm | ✅ Compact, ~4 ft square |
| 10 mm | 11 mm | 185 cm | 194 cm | ~6 ft square |
| 14 mm | 15 mm | 252 cm | 264 cm | Large |

---

## Per-Line Disc Breakdown (Option A, 31 chars/line)

| Element | Chars | Discs wide | Discs tall | Total discs |
|---|---|---|---|---|
| One text line | 31 | 191 | 8 | 1,528 |
| Quote area (24 lines) | 744 max | 191 | 192 | 36,672 |
| Attribution (4 lines) | 124 max | 191 | 32 | 6,112 |
| Spacer | — | 191 | 4 | 764 |
| Brand (`LITERATURE CLOCK`) | 17 | 191 | 8 | 1,528 |
| Border | — | 191 | 8 | 1,528 |
| **Full panel** | — | **191** | **244** | **46,604** |

---

## Cost Estimate (7 mm modules, Option B)

| Item | Qty | Unit Cost | Total |
|---|---|---|---|
| Flip-disc 7×1 modules | ~5,600 | ~$2–3 | $11,200–$16,800 |
| Controller boards | ~20 | ~$25 | $500 |
| ESP32 | 1 | $8 | $8 |
| Power supply (5 V) | 2 | $25 | $50 |
| Frame / mounting | 1 | ~$200 | $200 |
| **Estimated total** | | | **$12,000–$17,600** |

> [!IMPORTANT]
> Flip-disc modules are typically packaged as 7×1 or 28×1 strips.
> The 7 mm disc is the smallest standard size. For smaller discs, costs increase significantly.
> Request bulk pricing for orders >5,000 discs.

---

## Recommended Configuration

> [!TIP]
> **Option B with 7 mm discs** gives a **143 × 153 cm** panel (~5 ft square) using **38,964 discs**, fitting 99% of all quotes with graceful truncation for the remaining 1%.

```
Panel:  143 cm × 153 cm (nearly square)
Discs:  191 × 204 = 38,964 total
Font:   5×7 dot matrix in a 6×8 cell, 31 characters per line
Layout: 19 quote lines + 4 attribution + 1 brand = 24 text lines
```
