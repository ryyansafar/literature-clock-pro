# Literature Clock — Flip Disc Simulator

A hardware simulation and design tool for a large-scale electromagnetic flip-disc clock that displays literary quotes tied to the current minute.

**Repository:** [https://github.com/ryyansafar/literature-clock-pro](https://github.com/ryyansafar/literature-clock-pro)

---

## What This Is

The **Literature Clock** is a physical installation concept: a wall-mounted panel of electromagnetic flip-disc modules, each disc flipping between a white face and a dark face to render text. Every minute, a new literary quote containing the exact time is displayed — with the time portion highlighted in blue.

This repository contains:
- **A web simulator** (`index.html`) that renders a high-fidelity canvas simulation of the flip-disc panel, sized precisely to show every entry in the dataset without truncation.
- **ESP32 firmware** (`/esp32_firmware`) for driving the physical hardware.
- **Hardware specifications** ([FLIP_DISC_SPEC.md](./FLIP_DISC_SPEC.md)) with panel size options, cost estimates, and layout analysis.

---

## Features

- **Accurately sized grid** — the panel dimensions are derived from a full scan of the CSV dataset: the simulator fits the longest possible quote (24 wrapped lines at 31 chars/line) plus attribution and branding with no truncation.
- **Responsive canvas** — scales to fill the browser window on any screen size, constrained by both width and height so the full panel is always visible.
- **Flip animation** — each update triggers a left-to-right column sweep animating each disc from its current face to its target face, mimicking real electromagnetic actuation.
- **5×7 bitmap font** — a full ASCII + typographic punctuation glyph set rendered directly in disc pixels.
- **Cinematic boot console** — a glassmorphic terminal UI with power/reboot controls and live status logging.
- **CSV dataset** — 3,626 literary quotes from classic and contemporary fiction, each mapped to a specific minute of the day.

---

## Simulator Grid

| Parameter | Value |
|---|---|
| Grid width | **191 discs** |
| Grid height | **278 discs** |
| Total discs simulated | **53,098** |
| Font cell size | 6 × 8 discs (5×7 glyph + 1 gap each axis) |
| Characters per line | **31** |
| Quote lines (max) | 24 |
| Attribution lines | 6 |
| Brand line | 1 |
| Physical equivalent | 152.8 cm × 222.4 cm @ 8mm pitch |

---

## Running the Simulator

1. Clone this repository.
2. Open `index.html` in any modern web browser.
   - The CSV is loaded via `fetch`, so you need a local server or a browser that allows local file access. From the project directory: `python3 -m http.server 8080` then open `http://localhost:8080`.
3. The simulator loads the quote dataset and immediately displays the quote for the current minute.
4. **Click** the canvas or press **Space / →** to cycle through alternate quotes for the same minute.

---

## Hardware

The physical clock uses a matrix of electromagnetic flip-disc modules. See [FLIP_DISC_SPEC.md](./FLIP_DISC_SPEC.md) for:
- Font and cell geometry
- CSV quote analysis (line distribution, longest entries)
- Panel size options with physical dimensions and cost estimates
- Recommended configuration

### ESP32 Firmware

1. Open `esp32_firmware/esp32_firmware.ino` in the Arduino IDE.
2. Install libraries: `FastLED`, `LittleFS`, `WiFi`.
3. Configure WiFi credentials in `config.h`.
4. Upload to your ESP32 board.
5. Upload `litclock_annotated.csv` to LittleFS using the "ESP32 LittleFS Data Upload" tool.

---

## Credits

- **Concept & dataset**: Inspired by [Jaap Meijers' E-reader Literary Clock](https://www.instructables.com/id/Literary-Clock-Made-From-E-reader/).
- **Quote data**: Derived from [JohannesNE/literature-clock](https://github.com/JohannesNE/literature-clock).
- **Hardware implementation**: Developed as a large-scale flip-disc adaptation of the literary clock concept.

---

## License

See [LICENCE.md](./literature-clock-hardware/LICENCE.md).
