# Literature Clock — Flip Disc Simulator

A browser-based simulation of a large-scale electromagnetic flip-disc display, showing a literary quote for every minute of the day.

**Code:** [github.com/ryyansafar/literature-clock-pro](https://github.com/ryyansafar/literature-clock-pro)

---

## Background

This was a company project — a literary clock for an office space. Something that tells the time not with numbers, but with a sentence from a novel.

The first idea was an LED frame: NeoPixel strips packed into a grid, each pixel individually addressable. The concept worked on paper. Then we priced it up. NeoPixel strips are expensive at any meaningful scale, the current draw for a large matrix is significant (a single 5m strip can pull 3A at full brightness — multiply that across a wall-sized grid and you're talking serious power supply hardware, thick cabling, and thermal management), and the result would still just be another glowing screen.

The pivot was flip discs. Electromagnetic mechanical displays where each pixel is a small disc that snaps between a white face and a dark face via a brief magnetic pulse. They hold position with no power. They have a sound. They have a texture. They're physical in a way LEDs aren't.

Before ordering thousands of components, we built this simulator — a browser rendering of exactly what the panel would look like. The simulator mirrors the logic of the ESP32 firmware almost exactly: same 5×7 bitmap font, same word-wrap algorithm, same left-to-right column-sweep flip animation. It's essentially the embedded C display driver ported to JavaScript so you can run it in a browser tab and resize the window to feel out different panel sizes.

It looked good. So here it is.

---

## How to Use

### 1. Start a local server

The page fetches quote data from a CSV file and needs to be served over HTTP — opening `index.html` directly as `file://` won't work in most browsers.

```bash
python3 -m http.server 8080
```

Then open **http://localhost:8080**.

### 2. Watch it boot

The display runs through an ESP32-style boot sequence on the panel itself — WiFi connect, NTP sync, quote load — before flipping to the current minute's quote.

### 3. Resize the window

The panel **scales to fill whatever window size you give it.** Try dragging the browser narrow, wide, tall, small. The disc grid always fits fully in view, with physical dimensions annotated around the edges.

### 4. Interact

| Action | Effect |
|---|---|
| **Click** the panel | Cycle to the next quote for this minute |
| **Space** or **→** | Same as click |
| **⏻ button** (bottom-right) | Power off — all discs flip to black. Click again to reboot. |

### 5. The time highlight

The exact phrase containing the time is rendered in **blue**. Everything else is white.

---

## Simulator Specs

| Parameter | Value |
|---|---|
| Grid | **191 × 278 discs** |
| Total discs | **53,098** |
| Characters per line | **31** |
| Font | 5×7 bitmap, 6×8 disc cell |
| Max quote lines | 24 — sized to fit every entry in the dataset without truncation |
| Physical equivalent | 152.8 cm × 222.4 cm @ 8 mm pitch |

See [FLIP_DISC_SPEC.md](./FLIP_DISC_SPEC.md) for hardware panel size options, cost estimates, and layout analysis.

---

## ESP32 Firmware

The `/esp32_firmware` folder contains the C++ firmware for driving the physical hardware.

1. Open `esp32_firmware/esp32_firmware.ino` in the Arduino IDE.
2. Install libraries: `FastLED`, `LittleFS`, `WiFi`.
3. Configure WiFi credentials in `config.h`.
4. Upload to your ESP32.
5. Upload `litclock_annotated.csv` to LittleFS using the ESP32 LittleFS Data Upload tool.

---

## Credits

Built on the work of **Johannes N. Enevoldsen** — his [Literature Clock](https://literature-clock.jenevoldsen.com) ([github.com/JohannesNE/literature-clock](https://github.com/JohannesNE/literature-clock)) is the original web implementation and the source of the entire quote dataset. This project would not exist without it.

Also indebted to **Jaap Meijers** for the original [E-reader Literary Clock](https://www.instructables.com/id/Literary-Clock-Made-From-E-reader/) concept.

---

## License

See [LICENCE.md](./literature-clock-hardware/LICENCE.md).
