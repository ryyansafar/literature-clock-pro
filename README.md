# Literature Clock — Flip Disc Simulator

A web-based simulation of a large-scale electromagnetic flip-disc display that shows a literary quote for every minute of the day.

**Live project:** [literature-clock-pro on GitHub](https://github.com/ryyansafar/literature-clock-pro)

---

## What Is This?

Every minute of the day has a literary quote that contains the exact time as it appears in a novel. This project simulates how that collection would look displayed on a physical **flip-disc panel** — a wall-mounted matrix of small electromagnetic discs that each flip between a white face and a dark face to render text.

The simulator renders the full 191 × 278 disc grid in the browser, complete with a column-sweep flip animation on each update that mimics real electromagnetic actuation.

---

## How to Use

### 1. Start a local server

The page fetches quote data from a CSV file, so it needs to be served over HTTP — opening `index.html` directly as a `file://` URL won't work in most browsers.

From the project folder, run:

```bash
python3 -m http.server 8080
```

Then open **http://localhost:8080** in your browser.

### 2. Watch it load

The console panel at the bottom runs a brief boot sequence and loads 3,626 quotes. Once ready the display animates to the quote for the current minute.

### 3. Resize the window

The flip-disc panel **automatically scales to fill your window** — try resizing the browser to any shape. Wider windows show larger discs; narrower ones pack in tighter. The whole panel always stays fully visible with the dimensions annotated around the edge.

### 4. Interact

| Action | Effect |
|---|---|
| **Click** the panel | Cycle to the next quote for this minute |
| **Space** or **→** | Same as click |
| **SYSTEM_OFF** button | Powers down all discs |
| **REBOOT_CLK** button | Replays the boot animation |

### 5. The time highlight

The portion of the quote that contains the actual time is rendered in **blue** — every other word is white.

---

## Simulator Specs

| Parameter | Value |
|---|---|
| Grid | **191 × 278 discs** |
| Total discs | **53,098** |
| Characters per line | **31** |
| Font | 5×7 bitmap, 6×8 disc cell |
| Max quote lines | 24 (fits every entry in the dataset) |
| Physical equivalent | 152.8 cm × 222.4 cm @ 8 mm pitch |

See [FLIP_DISC_SPEC.md](./FLIP_DISC_SPEC.md) for hardware panel size options, cost estimates, and layout analysis.

---

## Hardware (ESP32 Firmware)

The `/esp32_firmware` folder contains firmware for driving the physical flip-disc hardware.

1. Open `esp32_firmware/esp32_firmware.ino` in the Arduino IDE.
2. Install libraries: `FastLED`, `LittleFS`, `WiFi`.
3. Configure WiFi credentials in `config.h`.
4. Upload the sketch to your ESP32.
5. Upload `litclock_annotated.csv` to LittleFS using the ESP32 LittleFS Data Upload tool.

---

## Credits & Thanks

This project would not exist without the work of:

- **[Johannes N. Evolvoldsen](https://literature-clock.jenevoldsen.com)** — creator of the Literature Clock ([github.com/JohannesNE/literature-clock](https://github.com/JohannesNE/literature-clock)), the original web clock and dataset that powers this entire project. Thank you.
- **Jaap Meijers** — the [E-reader Literary Clock](https://www.instructables.com/id/Literary-Clock-Made-From-E-reader/) that inspired the original concept.

---

## License

See [LICENCE.md](./literature-clock-hardware/LICENCE.md).
