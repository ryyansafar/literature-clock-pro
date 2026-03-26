# Literature Clock Hardware (Pro Edition)

A cinematic, high-capacity flip-disc display controller and web simulator for literary quotes. This is a standalone, performance-optimized version for technical portfolios.

**Repository:** [https://github.com/ryyansafar/literature-clock-pro](https://github.com/ryyansafar/literature-clock-pro)

![Literature Clock Simulator](https://raw.githubusercontent.com/ryyansafar/literature-clock-hardware/main/docs/preview_placeholder.png)
*(Note: Replace with actual GIF/Image of the hardware or simulator)*

## 📖 Overview

The **Literature Clock** is an immersive hardware installation and digital simulation. It uses a high-density grid of flip-discs to render literary quotes in real-time. This project includes both the ESP32-based firmware for physical hardware and a high-fidelity web-based simulator.

### ✨ Features
- **Genericized Branding**: All original company names removed for a clean, open-source template.
- **High-Capacity Grid**: Hardcoded 191x1200 grid supporting quotes up to 5,000 characters.
- **Cinematic Interface**: Premium glassmorphic hacker console with real-time status logging.
- **Web Simulator**: High-fidelity mechanical simulation of electromagnetic flip discs.
- **ESP32 Firmware**: Industrial-grade C++ logic for physical hardware integration.
- **Dynamic Formatting**: Automatic word-wrapping and layout optimization for quotes and attributions.

---

## 🛠️ Hardware Specifications

The physical clock is designed to use a custom matrix of flip-disc modules.

- **Grid Resolution**: 191 discs (Width) × 72 discs (Height)
- **Total Discs**: 13,752
- **Controller**: ESP32 (S3 or similar)
- **Display Driver**: Custom SPI/PWM driver for flip-disc modules (e.g., Flip-disc module manufacturer 7mm discs).
- **Layout Zones**:
  - **Quote Area**: Centered 6-line block for the literary text.
  - **Attribution**: Bottom-aligned author and book credit.
  - **Brand Line**: "LITERATURE CLOCK" branding in the bottom-right corner.

See [FLIP_DISC_SPEC.md](./FLIP_DISC_SPEC.md) for detailed hardware calculations and [HARDWARE_GUIDE.md](./esp32_firmware/HARDWARE_GUIDE.md) for wiring.

---

## 💻 Software Architecture

### ESP32 Firmware (`/esp32_firmware`)
The firmware handles time synchronization via NTP, SD card/LittleFS data management, and the high-speed rendering logic for the FastLED-compatible matrix.
- **Time Sync**: Connects to WiFi and synchronizes with NTP servers.
- **Data Handling**: Reads `litclock_annotated.csv` line-by-line using a fast lookup index.
- **Graphics**: Custom font rendering and buffer management for the large grid.

### Web Simulator (`/`)
An interactive HTML5/JavaScript simulation that replicates the hardware behavior.
- **Rendering**: Canvas-based disc rendering with simulated "flip" transitions.
- **Physics**: Subtle disc jitter and lighting effects to mimic the physical look.
- **Boot Sequence**: Includes a nostalgic terminal-style boot sequence.

---

## 🚀 Getting Started

### Running the Simulator
1. Clone this repository.
2. Open `index.html` in any modern web browser.
3. The simulator will automatically load the CSV data and begin displaying quotes based on your local time.

### Deploying the Firmware
1. Open `esp32_firmware/esp32_firmware.ino` in the Arduino IDE.
2. Install the necessary libraries: `FastLED`, `LittleFS`, `WiFi`.
3. Configure your WiFi credentials in `config.h`.
4. Upload to your ESP32 board.
5. Upload the `litclock_annotated.csv` to the LittleFS filesystem using the "ESP32 LittleFS Data Upload" tool.

---

## 🙏 Credits & Acknowledgments

This project is a hardware-focused fork and extension of the original Literature Clock concepts.

- **Concept & Dataset**: Inspired by the work of **Jaap Meijers** ([E-reader Literary Clock](https://www.instructables.com/id/Literary-Clock-Made-From-E-reader/)).
- **Original Software Logic**: Based on the [JohannesNE/literature-clock](https://github.com/JohannesNE/literature-clock) repository.
- **Hardware Integration**: Developed as a high-scale flip-disc implementation of the literary clock concept.
- **Quotes Cache**: The dataset is derived from various open-source contributions to the original Literature Clock project.

---

## ⚖️ License

See [LICENCE.md](./literature-clock-hardware/LICENCE.md) for license details.
