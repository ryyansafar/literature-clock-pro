/**
 * Literature Clock — Flip Disc Display Simulator
 *
 * Each disc is a mechanical flip dot: yellow (flipped) or black (unflipped).
 * Text transitions use a column-sweep animation that mimics the cascade
 * of electromagnetic flip discs actuating in sequence.
 *
 *Layout:
 *   Quote area : Literary quote (variable lines, vertically centered)
 *   Attribution: "— Author, Book Title" (2 lines, word-wrapped)
 *   [spacer]
 *   Brand      : "LITERATURE CLOCK" (right-aligned)
 */

(function () {
    'use strict';

    // ---- Error Logging ----
    const bootLogArea = document.getElementById('bootLog');
    function logBoot(text, cls) {
        if (!bootLogArea) return;
        const span = document.createElement('span');
        span.className = cls || '';
        span.textContent = text + '\n';
        bootLogArea.appendChild(span);
        bootLogArea.scrollTop = bootLogArea.scrollHeight;
    }

    window.onerror = function(msg, url, line) {
        logBoot(`[SYS_ERR] ${msg} at line ${line}`, 'log-warn');
        return false;
    };

    // ---- Config ----
    const CSV_PATH = 'literature-clock-hardware/litclock_annotated.csv';
    const UPDATE_INTERVAL_MS = 30000;
    const DISC_PITCH_MM = 8.0;        // 8mm disc, center-to-center

    // Character grid: 6 cols × 8 rows per character (5×7 glyph + 1 spacing each axis)
    const CHAR_W = 5;
    const CHAR_H = 7;
    const CHAR_GAP_X = 1;
    const CHAR_GAP_Y = 1;
    const CELL_W = CHAR_W + CHAR_GAP_X;  // 6
    const CELL_H = CHAR_H + CHAR_GAP_Y;  // 8

    // HI-CAPACITY GRID CONFIG (Fixed for 191x1200)
    // 191 cols / 6 pixels per char = 31 chars per line
    // 1200 rows / 8 pixels per char = 150 lines total
    let COLS_CHARS = 31;
    let QUOTE_LINES = 150; // Extra room for safe margins
    let ATTRIB_LINES = 6;
    let SPACER_PX = 10;

    // Derived — recalculated via recalcLayout()
    let GRID_W, QUOTE_H, ATTRIB_Y, ATTRIB_H, BRAND_Y, BRAND_H, GRID_H;

    function recalcLayout() {
        GRID_W = 191; // FIXED
        QUOTE_H = QUOTE_LINES * CELL_H;
        ATTRIB_Y = QUOTE_H;
        ATTRIB_H = ATTRIB_LINES * CELL_H;
        BRAND_Y = ATTRIB_Y + ATTRIB_H + SPACER_PX;
        BRAND_H = CELL_H;
        GRID_H = BRAND_Y + BRAND_H + 20; // 1200+ pixels total
    }
    recalcLayout();

    // Disc face colors [R, G, B]
    // Blue face = time highlight; White face = all other text
    const COLOR_OFF = [0, 0, 0];             // disc showing black side
    const COLOR_WHITE = [220, 220, 215];     // disc showing white face (quote text)
    const COLOR_BLUE = [30, 140, 255];       // disc showing blue face (time)
    const COLOR_DIM = [180, 180, 175];       // white face, slightly dimmer (attrib)
    const COLOR_BRAND = [200, 200, 195];     // white face (LITERATURE CLOCK)

    // ---- State ----
    let quotesMap = {};
    let currentTimeKey = '';
    let currentEntryIndex = 0;

    let totalLEDs = GRID_W * GRID_H;
    let targetBuffer = new Array(totalLEDs);
    let currentAngles = new Float32Array(totalLEDs);
    let targetAngles = new Float32Array(totalLEDs);

    // Animation state
    let animating = false;
    let animColumn = 0;
    let animFrameId = null;
    let animStartTime = 0;
    let lastAnimTime = 0;

    // Animation sweep configuration
    const FLIP_SPEED = 0.6; // degrees per ms (180 deg in 300ms)
    const COL_DELAY = 12;   // ms between each column starting to flip

    // Canvas
    const canvas = document.getElementById('ledMatrix');
    const ctx = canvas.getContext('2d');

    // ---- 5x7 Bitmap Font ----
    const FONT = {
        ' ': [0b00000, 0b00000, 0b00000, 0b00000, 0b00000, 0b00000, 0b00000],
        '!': [0b00100, 0b00100, 0b00100, 0b00100, 0b00100, 0b00000, 0b00100],
        '"': [0b01010, 0b01010, 0b01010, 0b00000, 0b00000, 0b00000, 0b00000],
        '#': [0b01010, 0b01010, 0b11111, 0b01010, 0b11111, 0b01010, 0b01010],
        '$': [0b00100, 0b01111, 0b10100, 0b01110, 0b00101, 0b11110, 0b00100],
        '%': [0b11000, 0b11001, 0b00010, 0b00100, 0b01000, 0b10011, 0b00011],
        '&': [0b01100, 0b10010, 0b10100, 0b01000, 0b10101, 0b10010, 0b01101],
        "'": [0b00100, 0b00100, 0b00100, 0b00000, 0b00000, 0b00000, 0b00000],
        '(': [0b00010, 0b00100, 0b01000, 0b01000, 0b01000, 0b00100, 0b00010],
        ')': [0b01000, 0b00100, 0b00010, 0b00010, 0b00010, 0b00100, 0b01000],
        '*': [0b00000, 0b00100, 0b10101, 0b01110, 0b10101, 0b00100, 0b00000],
        '+': [0b00000, 0b00100, 0b00100, 0b11111, 0b00100, 0b00100, 0b00000],
        ',': [0b00000, 0b00000, 0b00000, 0b00000, 0b00000, 0b00100, 0b01000],
        '-': [0b00000, 0b00000, 0b00000, 0b11111, 0b00000, 0b00000, 0b00000],
        '.': [0b00000, 0b00000, 0b00000, 0b00000, 0b00000, 0b00000, 0b00100],
        '/': [0b00000, 0b00001, 0b00010, 0b00100, 0b01000, 0b10000, 0b00000],
        '0': [0b01110, 0b10001, 0b10011, 0b10101, 0b11001, 0b10001, 0b01110],
        '1': [0b00100, 0b01100, 0b00100, 0b00100, 0b00100, 0b00100, 0b01110],
        '2': [0b01110, 0b10001, 0b00001, 0b00010, 0b00100, 0b01000, 0b11111],
        '3': [0b11111, 0b00010, 0b00100, 0b00010, 0b00001, 0b10001, 0b01110],
        '4': [0b00010, 0b00110, 0b01010, 0b10010, 0b11111, 0b00010, 0b00010],
        '5': [0b11111, 0b10000, 0b11110, 0b00001, 0b00001, 0b10001, 0b01110],
        '6': [0b00110, 0b01000, 0b10000, 0b11110, 0b10001, 0b10001, 0b01110],
        '7': [0b11111, 0b00001, 0b00010, 0b00100, 0b01000, 0b01000, 0b01000],
        '8': [0b01110, 0b10001, 0b10001, 0b01110, 0b10001, 0b10001, 0b01110],
        '9': [0b01110, 0b10001, 0b10001, 0b01111, 0b00001, 0b00010, 0b01100],
        ':': [0b00000, 0b00000, 0b00100, 0b00000, 0b00100, 0b00000, 0b00000],
        ';': [0b00000, 0b00000, 0b00100, 0b00000, 0b00100, 0b00100, 0b01000],
        '<': [0b00010, 0b00100, 0b01000, 0b10000, 0b01000, 0b00100, 0b00010],
        '=': [0b00000, 0b00000, 0b11111, 0b00000, 0b11111, 0b00000, 0b00000],
        '>': [0b01000, 0b00100, 0b00010, 0b00001, 0b00010, 0b00100, 0b01000],
        '?': [0b01110, 0b10001, 0b00001, 0b00010, 0b00100, 0b00000, 0b00100],
        '@': [0b01110, 0b10001, 0b10111, 0b10101, 0b10110, 0b10000, 0b01110],
        'A': [0b01110, 0b10001, 0b10001, 0b11111, 0b10001, 0b10001, 0b10001],
        'B': [0b11110, 0b10001, 0b10001, 0b11110, 0b10001, 0b10001, 0b11110],
        'C': [0b01110, 0b10001, 0b10000, 0b10000, 0b10000, 0b10001, 0b01110],
        'D': [0b11100, 0b10010, 0b10001, 0b10001, 0b10001, 0b10010, 0b11100],
        'E': [0b11111, 0b10000, 0b10000, 0b11110, 0b10000, 0b10000, 0b11111],
        'F': [0b11111, 0b10000, 0b10000, 0b11110, 0b10000, 0b10000, 0b10000],
        'G': [0b01110, 0b10001, 0b10000, 0b10111, 0b10001, 0b10001, 0b01111],
        'H': [0b10001, 0b10001, 0b10001, 0b11111, 0b10001, 0b10001, 0b10001],
        'I': [0b01110, 0b00100, 0b00100, 0b00100, 0b00100, 0b00100, 0b01110],
        'J': [0b00111, 0b00010, 0b00010, 0b00010, 0b00010, 0b10010, 0b01100],
        'K': [0b10001, 0b10010, 0b10100, 0b11000, 0b10100, 0b10010, 0b10001],
        'L': [0b10000, 0b10000, 0b10000, 0b10000, 0b10000, 0b10000, 0b11111],
        'M': [0b10001, 0b11011, 0b10101, 0b10101, 0b10001, 0b10001, 0b10001],
        'N': [0b10001, 0b10001, 0b11001, 0b10101, 0b10011, 0b10001, 0b10001],
        'O': [0b01110, 0b10001, 0b10001, 0b10001, 0b10001, 0b10001, 0b01110],
        'P': [0b11110, 0b10001, 0b10001, 0b11110, 0b10000, 0b10000, 0b10000],
        'Q': [0b01110, 0b10001, 0b10001, 0b10001, 0b10101, 0b10010, 0b01101],
        'R': [0b11110, 0b10001, 0b10001, 0b11110, 0b10100, 0b10010, 0b10001],
        'S': [0b01111, 0b10000, 0b10000, 0b01110, 0b00001, 0b00001, 0b11110],
        'T': [0b11111, 0b00100, 0b00100, 0b00100, 0b00100, 0b00100, 0b00100],
        'U': [0b10001, 0b10001, 0b10001, 0b10001, 0b10001, 0b10001, 0b01110],
        'V': [0b10001, 0b10001, 0b10001, 0b10001, 0b10001, 0b01010, 0b00100],
        'W': [0b10001, 0b10001, 0b10001, 0b10101, 0b10101, 0b10101, 0b01010],
        'X': [0b10001, 0b10001, 0b01010, 0b00100, 0b01010, 0b10001, 0b10001],
        'Y': [0b10001, 0b10001, 0b01010, 0b00100, 0b00100, 0b00100, 0b00100],
        'Z': [0b11111, 0b00001, 0b00010, 0b00100, 0b01000, 0b10000, 0b11111],
        '[': [0b01110, 0b01000, 0b01000, 0b01000, 0b01000, 0b01000, 0b01110],
        '\\': [0b00000, 0b10000, 0b01000, 0b00100, 0b00010, 0b00001, 0b00000],
        ']': [0b01110, 0b00010, 0b00010, 0b00010, 0b00010, 0b00010, 0b01110],
        '^': [0b00100, 0b01010, 0b10001, 0b00000, 0b00000, 0b00000, 0b00000],
        '_': [0b00000, 0b00000, 0b00000, 0b00000, 0b00000, 0b00000, 0b11111],
        '`': [0b01000, 0b00100, 0b00010, 0b00000, 0b00000, 0b00000, 0b00000],
        'a': [0b00000, 0b00000, 0b01110, 0b00001, 0b01111, 0b10001, 0b01111],
        'b': [0b10000, 0b10000, 0b10110, 0b11001, 0b10001, 0b10001, 0b11110],
        'c': [0b00000, 0b00000, 0b01110, 0b10000, 0b10000, 0b10001, 0b01110],
        'd': [0b00001, 0b00001, 0b01101, 0b10011, 0b10001, 0b10001, 0b01111],
        'e': [0b00000, 0b00000, 0b01110, 0b10001, 0b11111, 0b10000, 0b01110],
        'f': [0b00110, 0b01001, 0b01000, 0b11100, 0b01000, 0b01000, 0b01000],
        'g': [0b00000, 0b01111, 0b10001, 0b10001, 0b01111, 0b00001, 0b01110],
        'h': [0b10000, 0b10000, 0b10110, 0b11001, 0b10001, 0b10001, 0b10001],
        'i': [0b00100, 0b00000, 0b01100, 0b00100, 0b00100, 0b00100, 0b01110],
        'j': [0b00010, 0b00000, 0b00110, 0b00010, 0b00010, 0b10010, 0b01100],
        'k': [0b10000, 0b10000, 0b10010, 0b10100, 0b11000, 0b10100, 0b10010],
        'l': [0b01100, 0b00100, 0b00100, 0b00100, 0b00100, 0b00100, 0b01110],
        'm': [0b00000, 0b00000, 0b11010, 0b10101, 0b10101, 0b10001, 0b10001],
        'n': [0b00000, 0b00000, 0b10110, 0b11001, 0b10001, 0b10001, 0b10001],
        'o': [0b00000, 0b00000, 0b01110, 0b10001, 0b10001, 0b10001, 0b01110],
        'p': [0b00000, 0b00000, 0b11110, 0b10001, 0b11110, 0b10000, 0b10000],
        'q': [0b00000, 0b00000, 0b01101, 0b10011, 0b01111, 0b00001, 0b00001],
        'r': [0b00000, 0b00000, 0b10110, 0b11001, 0b10000, 0b10000, 0b10000],
        's': [0b00000, 0b00000, 0b01110, 0b10000, 0b01110, 0b00001, 0b11110],
        't': [0b01000, 0b01000, 0b11100, 0b01000, 0b01000, 0b01001, 0b00110],
        'u': [0b00000, 0b00000, 0b10001, 0b10001, 0b10001, 0b10011, 0b01101],
        'v': [0b00000, 0b00000, 0b10001, 0b10001, 0b10001, 0b01010, 0b00100],
        'w': [0b00000, 0b00000, 0b10001, 0b10001, 0b10101, 0b10101, 0b01010],
        'x': [0b00000, 0b00000, 0b10001, 0b01010, 0b00100, 0b01010, 0b10001],
        'y': [0b00000, 0b00000, 0b10001, 0b10001, 0b01111, 0b00001, 0b01110],
        'z': [0b00000, 0b00000, 0b11111, 0b00010, 0b00100, 0b01000, 0b11111],
        '{': [0b00010, 0b00100, 0b00100, 0b01000, 0b00100, 0b00100, 0b00010],
        '|': [0b00100, 0b00100, 0b00100, 0b00100, 0b00100, 0b00100, 0b00100],
        '}': [0b01000, 0b00100, 0b00100, 0b00010, 0b00100, 0b00100, 0b01000],
        '~': [0b00000, 0b00000, 0b01000, 0b10101, 0b00010, 0b00000, 0b00000],
        '\u2014': [0b00000, 0b00000, 0b00000, 0b11111, 0b00000, 0b00000, 0b00000],
        '\u2018': [0b00100, 0b01000, 0b00000, 0b00000, 0b00000, 0b00000, 0b00000],
        '\u2019': [0b00100, 0b00010, 0b00000, 0b00000, 0b00000, 0b00000, 0b00000],
        '\u201C': [0b01010, 0b10100, 0b00000, 0b00000, 0b00000, 0b00000, 0b00000],
        '\u201D': [0b01010, 0b00101, 0b00000, 0b00000, 0b00000, 0b00000, 0b00000],
    };

    // ---- Canvas resize ----
    function resizeCanvas() {
        const dpr = window.devicePixelRatio || 1;
        const maxW = window.innerWidth;
        
        const padX = Math.max(20, Math.ceil(maxW * 0.05));
        const padY = 40; 

        // Scaling logic: for the hi-cap 191x1200 grid, we must be careful 
        // with total canvas pixels to avoid browser limits.
        const availW = maxW - (padX * 2);
        let ledSize = Math.max(2, Math.floor(availW / GRID_W)); 
        
        // Cap ledSize to 2 for extremely tall grids to keep height < 8000px
        if (GRID_H > 800) ledSize = Math.min(ledSize, 2);

        // Store for paintDiscs and other functions
        canvas.dataset.ledSize = ledSize;
        canvas.dataset.padX = padX;
        canvas.dataset.padY = padY;

        canvas.width = GRID_W * ledSize * dpr;
        canvas.height = GRID_H * ledSize * dpr;
        canvas.style.width = (GRID_W * ledSize) + 'px';
        canvas.style.height = (GRID_H * ledSize) + 'px';
        
        // Center the canvas horizontally via style
        canvas.style.marginLeft = padX + 'px';
        canvas.style.marginTop = padY + 'px';
        canvas.style.marginBottom = '100px'; 

        ctx.scale(dpr, dpr);
        paintDiscs();
    }

    // ---- LED Buffer Operations ----
    function clearBuffer(buf) {
        // Enforce a hard zero-out of the array to prevent ghosting references
        for (let i = 0; i < totalLEDs; i++) {
            buf[i] = [0, 0, 0];
        }
    }

    function setLED_buf(buf, x, y, color) {
        if (x < 0 || x >= GRID_W || y < 0 || y >= GRID_H) return;
        buf[y * GRID_W + x] = color;
    }

    function drawChar_buf(buf, ch, startX, startY, color) {
        const bitmap = FONT[ch];
        if (!bitmap) return;
        for (let row = 0; row < CHAR_H; row++) {
            const rowBits = bitmap[row];
            for (let col = 0; col < CHAR_W; col++) {
                if (rowBits & (1 << (CHAR_W - 1 - col)))
                    setLED_buf(buf, startX + col, startY + row, color);
            }
        }
    }

    /** Count how many lines a set of spans will occupy at COLS_CHARS width. */
    function countSpanLines(spans) {
        let cursorX = 0, cursorY = 0;
        for (const span of spans) {
            const words = span.text.split(' ');
            for (let wi = 0; wi < words.length; wi++) {
                const word = words[wi];
                if (cursorX > 0 && cursorX + word.length > COLS_CHARS) {
                    cursorX = 0; cursorY++;
                }
                for (let ci = 0; ci < word.length; ci++) {
                    if (cursorX >= COLS_CHARS) { cursorX = 0; cursorY++; }
                    cursorX++;
                }
                if (wi < words.length - 1 && cursorX < COLS_CHARS) cursorX++;
            }
        }
        return cursorY + 1;
    }

    function renderQuoteSpans_buf(buf, spans, yOffsetLines) {
        const yOff = (yOffsetLines || 0);
        let cursorX = 0, cursorY = 0;
        for (const span of spans) {
            const words = span.text.split(' ');
            for (let wi = 0; wi < words.length; wi++) {
                const word = words[wi];
                if (cursorX > 0 && cursorX + word.length > COLS_CHARS) {
                    cursorX = 0; cursorY++;
                    if (cursorY >= QUOTE_LINES) break;
                }
                for (let ci = 0; ci < word.length; ci++) {
                    if (cursorX >= COLS_CHARS) { cursorX = 0; cursorY++; if (cursorY >= QUOTE_LINES) break; }
                    drawChar_buf(buf, word[ci], cursorX * CELL_W, (cursorY + yOff) * CELL_H, span.color);
                    cursorX++;
                }
                if (cursorY >= QUOTE_LINES) break;
                if (wi < words.length - 1 && cursorX < COLS_CHARS) cursorX++;
            }
            if (cursorY >= QUOTE_LINES) break;
        }
    }

    function renderFixedLine_buf(buf, text, pixelY, color, align) {
        let startCharX = 0;
        if (align === 'center') startCharX = Math.max(0, Math.floor((COLS_CHARS - text.length) / 2));
        else if (align === 'right') startCharX = Math.max(0, COLS_CHARS - text.length);
        for (let i = 0; i < text.length && (startCharX + i) < COLS_CHARS; i++) {
            drawChar_buf(buf, text[i], (startCharX + i) * CELL_W, pixelY, color);
        }
    }

    /** Word-wrap text across multiple lines starting at pixelY. */
    function renderWrappedText_buf(buf, text, pixelY, maxLines, color) {
        let cursorX = 0, cursorY = 0;
        const words = text.split(' ');
        for (let wi = 0; wi < words.length; wi++) {
            const word = words[wi];
            if (cursorX > 0 && cursorX + word.length > COLS_CHARS) {
                cursorX = 0; cursorY++;
                if (cursorY >= maxLines) break;
            }
            for (let ci = 0; ci < word.length; ci++) {
                if (cursorX >= COLS_CHARS) { cursorX = 0; cursorY++; if (cursorY >= maxLines) break; }
                drawChar_buf(buf, word[ci], cursorX * CELL_W, pixelY + cursorY * CELL_H, color);
                cursorX++;
            }
            if (cursorY >= maxLines) break;
            if (wi < words.length - 1 && cursorX < COLS_CHARS) cursorX++;
        }
    }

    // ---- Paint flip disc buffer to canvas ----
    // Dual-face flip disc: Side A = blue (time), Side B = white (text), Edge = black
    const DISC_FILL = 0.90;       // disc diameter / cell pitch (8mm disc in 8mm cell)

    function paintDiscs() {
        const cellSize = parseFloat(canvas.dataset.ledSize);
        const padX = parseFloat(canvas.dataset.padX);
        const padY = parseFloat(canvas.dataset.padY);

        const discRadius = cellSize * DISC_FILL / 2;
        const edgeWidth = Math.max(0.5, cellSize * 0.04);  // black edge ring

        // Background: dark metal frame panel
        ctx.fillStyle = '#101012';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw panel face (the area behind all discs)
        const gridPixelW = GRID_W * cellSize;
        const gridPixelH = GRID_H * cellSize;
        ctx.fillStyle = '#1a1a1e';
        ctx.fillRect(padX - 2, padY - 2, gridPixelW + 4, gridPixelH + 4);

        for (let y = 0; y < GRID_H; y++) {
            for (let x = 0; x < GRID_W; x++) {
                const i = y * GRID_W + x;
                const cx = padX + x * cellSize + cellSize / 2;
                const cy = padY + y * cellSize + cellSize / 2;

                const angle = currentAngles[i];

                // Disc cavity (dark hole behind the disc)
                ctx.beginPath();
                ctx.arc(cx, cy, discRadius + edgeWidth, 0, Math.PI * 2);
                ctx.fillStyle = '#080808';
                ctx.fill();

                if (Math.abs(angle - 90) < 1.0) {
                    // Edge resting (90 deg) — disc is off and sideways
                    ctx.beginPath();
                    ctx.moveTo(cx - discRadius, cy);
                    ctx.lineTo(cx + discRadius, cy);
                    ctx.lineWidth = Math.max(1, cellSize * 0.15);
                    ctx.strokeStyle = '#18181b';
                    ctx.stroke();
                } else {
                    // Simulating 3D rotation by scaling the Y axis with cos(angle)
                    const scaleY = Math.max(0.01, Math.abs(Math.cos(angle * Math.PI / 180)));
                    const faceBlue = angle > 90;

                    ctx.beginPath();
                    ctx.ellipse(cx, cy, discRadius, discRadius * scaleY, 0, 0, Math.PI * 2);

                    if (faceBlue) {
                        ctx.fillStyle = '#1a82e6'; // Blue Time Face
                        ctx.fill();

                        // 3D specular highlight based on tilt
                        const grad = ctx.createLinearGradient(cx, cy - discRadius * scaleY, cx, cy + discRadius * scaleY);
                        grad.addColorStop(0, 'rgba(100, 180, 255, 0.4)');
                        grad.addColorStop(0.5, 'rgba(100, 180, 255, 0)');
                        grad.addColorStop(1, 'rgba(0, 0, 40, 0.4)');
                        ctx.fillStyle = grad;
                        ctx.fill();
                    } else {
                        ctx.fillStyle = '#f0eee5'; // White Text Face
                        ctx.fill();

                        // 3D specular highlight
                        const grad = ctx.createLinearGradient(cx, cy - discRadius * scaleY, cx, cy + discRadius * scaleY);
                        grad.addColorStop(0, 'rgba(255, 255, 255, 0.4)');
                        grad.addColorStop(0.5, 'rgba(255, 255, 255, 0)');
                        grad.addColorStop(1, 'rgba(0, 0, 0, 0.25)');
                        ctx.fillStyle = grad;
                        ctx.fill();
                    }

                    // Pivot hinge line (horizontal across the middle)
                    ctx.beginPath();
                    ctx.moveTo(cx - discRadius, cy);
                    ctx.lineTo(cx + discRadius, cy);
                    ctx.lineWidth = 0.5;
                    ctx.strokeStyle = faceBlue ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.15)';
                    ctx.stroke();
                }
            }
        }

        // Draw mechanical dimension annotations around the grid
        drawDimensionAnnotations();
    }

    /** Rebuild all LED buffers after grid dimensions change. */
    function rebuildBuffers() {
        totalLEDs = GRID_W * GRID_H;
        targetBuffer = new Array(totalLEDs);
        currentAngles = new Float32Array(totalLEDs);
        targetAngles = new Float32Array(totalLEDs);

        // Discs rest at 90 degrees (edge-on) when off
        currentAngles.fill(90);
        targetAngles.fill(90);

        for (let i = 0; i < totalLEDs; i++) {
            targetBuffer[i] = COLOR_OFF;
        }
    }

    /**
     * Draw mechanical drawing-style dimension annotations around the LED grid.
     * Thin extension lines, arrows, and measurements in mm.
     */
    function drawDimensionAnnotations() {
        const ledSize = parseFloat(canvas.dataset.ledSize);
        const padX = parseFloat(canvas.dataset.padX);
        const padY = parseFloat(canvas.dataset.padY);

        const gridPixelW = GRID_W * ledSize;
        const gridPixelH = GRID_H * ledSize;
        const physW = (GRID_W * DISC_PITCH_MM).toFixed(0);
        const physH = (GRID_H * DISC_PITCH_MM).toFixed(0);

        const dimColor = 'rgba(100, 140, 180, 0.45)';
        const textColor = 'rgba(120, 160, 200, 0.7)';
        const arrowLen = 6;
        const extGap = 6;
        const extLen = 14;

        ctx.save();
        ctx.strokeStyle = dimColor;
        ctx.fillStyle = textColor;
        ctx.lineWidth = 0.8;
        ctx.font = '10px SF Mono, Menlo, Consolas, monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // ── Width dimension (below grid) ──
        const dimY = padY + gridPixelH + extGap + extLen;

        // Extension lines (vertical ticks at edges)
        ctx.beginPath();
        ctx.moveTo(padX, padY + gridPixelH + extGap);
        ctx.lineTo(padX, dimY + 4);
        ctx.moveTo(padX + gridPixelW, padY + gridPixelH + extGap);
        ctx.lineTo(padX + gridPixelW, dimY + 4);
        ctx.stroke();

        // Dimension line (horizontal)
        ctx.beginPath();
        ctx.moveTo(padX, dimY);
        ctx.lineTo(padX + gridPixelW, dimY);
        ctx.stroke();

        // Arrows (left)
        ctx.beginPath();
        ctx.moveTo(padX, dimY);
        ctx.lineTo(padX + arrowLen, dimY - 3);
        ctx.moveTo(padX, dimY);
        ctx.lineTo(padX + arrowLen, dimY + 3);
        ctx.stroke();
        // Arrows (right)
        ctx.beginPath();
        ctx.moveTo(padX + gridPixelW, dimY);
        ctx.lineTo(padX + gridPixelW - arrowLen, dimY - 3);
        ctx.moveTo(padX + gridPixelW, dimY);
        ctx.lineTo(padX + gridPixelW - arrowLen, dimY + 3);
        ctx.stroke();

        // Width label
        ctx.fillText(physW + ' mm (' + GRID_W + ' discs)', padX + gridPixelW / 2, dimY + 14);

        // ── Height dimension (left of grid) ──
        const dimX = padX - extGap - extLen;

        // Extension lines (horizontal ticks at edges)
        ctx.beginPath();
        ctx.moveTo(padX - extGap, padY);
        ctx.lineTo(dimX - 4, padY);
        ctx.moveTo(padX - extGap, padY + gridPixelH);
        ctx.lineTo(dimX - 4, padY + gridPixelH);
        ctx.stroke();

        // Dimension line (vertical)
        ctx.beginPath();
        ctx.moveTo(dimX, padY);
        ctx.lineTo(dimX, padY + gridPixelH);
        ctx.stroke();

        // Arrows (top)
        ctx.beginPath();
        ctx.moveTo(dimX, padY);
        ctx.lineTo(dimX - 3, padY + arrowLen);
        ctx.moveTo(dimX, padY);
        ctx.lineTo(dimX + 3, padY + arrowLen);
        ctx.stroke();
        // Arrows (bottom)
        ctx.beginPath();
        ctx.moveTo(dimX, padY + gridPixelH);
        ctx.lineTo(dimX - 3, padY + gridPixelH - arrowLen);
        ctx.moveTo(dimX, padY + gridPixelH);
        ctx.lineTo(dimX + 3, padY + gridPixelH - arrowLen);
        ctx.stroke();

        // Height label (rotated)
        ctx.save();
        ctx.translate(dimX - 14, padY + gridPixelH / 2);
        ctx.rotate(-Math.PI / 2);
        ctx.fillText(physH + ' mm (' + GRID_H + ' discs)', 0, 0);
        ctx.restore();

        ctx.restore();
    }

    function updateDimReadout() {
        const w = document.getElementById('dimWidth');
        const h = document.getElementById('dimHeight');
        const l = document.getElementById('dimLEDs');
        const d = document.getElementById('dimDerived');
        if (w) w.textContent = (GRID_W * DISC_PITCH_MM).toFixed(0);
        if (h) h.textContent = (GRID_H * DISC_PITCH_MM).toFixed(0);
        if (l) l.textContent = (GRID_W * GRID_H).toLocaleString();
        if (d) d.textContent = COLS_CHARS + ' chars/line · ' + QUOTE_LINES + ' quote lines';
    }

    // ==================================================================
    // Animation System
    // ==================================================================

    function buildTargetAndMaps(entry) {
        clearBuffer(targetBuffer);

        // 1) Quote with color spans — vertically centered
        const spans = buildColorSpans(entry);
        const usedLines = countSpanLines(spans);
        const yOffset = Math.max(0, Math.floor((QUOTE_LINES - usedLines) / 2));
        renderQuoteSpans_buf(targetBuffer, spans, yOffset);

        // 2) Attribution — full author + book, word-wrapped across 2 lines
        const attribText = '- ' + entry.author + ', ' + entry.title;
        renderWrappedText_buf(targetBuffer, attribText, ATTRIB_Y, ATTRIB_LINES, COLOR_DIM);

        // 3) LITERATURE CLOCK — bottom-right, faint blue-white
        renderFixedLine_buf(targetBuffer, 'LITERATURE CLOCK', BRAND_Y, COLOR_BRAND, 'right');
    }

    function startAnimation() {
        if (animFrameId) cancelAnimationFrame(animFrameId);
        animating = true;
        animColumn = 0;
        animStartTime = performance.now();
        lastAnimTime = animStartTime;
        animLoop();
    }

    function snapToTarget() {
        for (let i = 0; i < totalLEDs; i++) {
            const [r, g, b] = targetBuffer[i];
            const isLit = r > 2 || g > 2 || b > 2;
            if (!isLit) {
                targetAngles[i] = 90; // Edge
            } else {
                const isBlue = b > 200 && r < 100;
                targetAngles[i] = isBlue ? 180 : 0; // Blue or White
            }
            currentAngles[i] = targetAngles[i];
        }
        paintDiscs();
    }

    function animLoop() {
        const now = performance.now();
        const dt = now - lastAnimTime;
        lastAnimTime = now;

        // Wave cascade: activate columns over time
        const elapsed = now - animStartTime;
        const activeCols = Math.floor(elapsed / COL_DELAY);

        if (animColumn <= Math.min(activeCols, GRID_W - 1)) {
            // New columns are activated, define their target angles
            for (let x = animColumn; x <= Math.min(activeCols, GRID_W - 1); x++) {
                for (let y = 0; y < GRID_H; y++) {
                    const i = y * GRID_W + x;
                    const [r, g, b] = targetBuffer[i];
                    const isLit = r > 2 || g > 2 || b > 2;
                    if (!isLit) {
                        targetAngles[i] = 90;
                    } else {
                        const isBlue = b > 200 && r < 100;
                        targetAngles[i] = isBlue ? 180 : 0;
                    }
                }
            }
            animColumn = Math.min(activeCols, GRID_W - 1) + 1;
        }

        // Physics step: move currentAngles towards targetAngles
        let needsPaint = false;
        let anyMoving = false;

        for (let i = 0; i < totalLEDs; i++) {
            const target = targetAngles[i];
            const current = currentAngles[i];
            if (Math.abs(current - target) > 0.1) {
                anyMoving = true;
                needsPaint = true;
                const dist = target - current;
                const step = FLIP_SPEED * dt;

                if (Math.abs(dist) <= step) {
                    currentAngles[i] = target;
                } else {
                    currentAngles[i] += Math.sign(dist) * step;
                }
            }
        }

        if (needsPaint) {
            paintDiscs();
        }

        if (animColumn >= GRID_W && !anyMoving) {
            animating = false;
        } else {
            animFrameId = requestAnimationFrame(animLoop);
        }
    }

    // ==================================================================
    // CSV Loading
    // ==================================================================
    let quotesLoaded = false;

    async function loadCSV() {
        try {
            const response = await fetch(CSV_PATH);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            parseCSV(await response.text());
            quotesLoaded = true;
            updateDisplay(true);
        } catch (err) {
            console.error('CSV load error:', err);
            clearBuffer(targetBuffer);
            renderFixedLine_buf(targetBuffer, 'ERROR LOADING CSV', 0, [255, 0, 0], 'left');
            renderFixedLine_buf(targetBuffer, 'LITERATURE CLOCK', BRAND_Y, COLOR_BRAND, 'right');
            snapToTarget();
        }
    }

    function parseCSV(text) {
        for (const line of text.split('\n')) {
            if (!line.trim()) continue;
            const parts = splitLine(line);
            if (parts.length < 5) continue;
            const [time, timeText, quote, title, authorName, sfw] = parts;
            let cleanQuote = quote.trim()
                .replace(/<br\s*\/?>/gi, ' ').replace(/<[^>]+>/g, '')
                .replace(/&amp;/g, '&').replace(/&quot;/g, '"')
                .replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>');
            if (!quotesMap[time]) quotesMap[time] = [];
            quotesMap[time].push({
                timeText: timeText.trim(), quote: cleanQuote,
                title: title.trim(), author: authorName ? authorName.trim() : 'Unknown',
            });
        }
        console.log(`Loaded ${Object.keys(quotesMap).length} unique times.`);
    }

    function splitLine(line) {
        const parts = []; let current = ''; let count = 0;
        for (let i = 0; i < line.length; i++) {
            if (line[i] === '|' && count < 5) { parts.push(current); current = ''; count++; }
            else current += line[i];
        }
        parts.push(current); return parts;
    }

    // ---- Display Logic ----
    function updateDisplay(forceRefresh) {
        const now = new Date();
        const timeKey = String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');
        if (timeKey !== currentTimeKey || forceRefresh) {
            currentTimeKey = timeKey;
            currentEntryIndex = 0;
            showQuote(timeKey);
        }
    }

    function showQuote(timeKey) {
        const entries = quotesMap[timeKey];
        if (!entries || entries.length === 0) {
            clearBuffer(targetBuffer);
            renderFixedLine_buf(targetBuffer, timeKey + ' - no quote', 0, COLOR_BLUE, 'left');
            renderFixedLine_buf(targetBuffer, 'LITERATURE CLOCK', BRAND_Y, COLOR_BRAND, 'right');
            // No animation needed for "no quote"
            snapToTarget();
            return;
        }
        const entry = entries[Math.floor(Math.random() * entries.length)];
        displayEntryAnimated(entry);
    }

    function displayEntryAnimated(entry) {
        buildTargetAndMaps(entry);
        startAnimation();
    }

    function displayEntryInstant(entry) {
        clearBuffer(targetBuffer);
        const spans = buildColorSpans(entry);
        const usedLines = countSpanLines(spans);
        const yOffset = Math.floor((QUOTE_LINES - usedLines) / 2);
        renderQuoteSpans_buf(targetBuffer, spans, yOffset);
        const attribText = '- ' + entry.author + ', ' + entry.title;
        renderWrappedText_buf(targetBuffer, attribText, ATTRIB_Y, ATTRIB_LINES, COLOR_DIM);
        renderFixedLine_buf(targetBuffer, 'LITERATURE CLOCK', BRAND_Y, COLOR_BRAND, 'right');
        snapToTarget();
    }

    function buildColorSpans(entry) {
        const quote = entry.quote;
        const timeText = entry.timeText;
        if (!timeText) return [{ text: quote, color: COLOR_WHITE }];
        const idx = quote.toLowerCase().indexOf(timeText.toLowerCase());
        if (idx === -1) return [{ text: quote, color: COLOR_WHITE }];
        const spans = [];
        if (idx > 0) spans.push({ text: quote.substring(0, idx), color: COLOR_WHITE });
        spans.push({ text: quote.substring(idx, idx + timeText.length), color: COLOR_BLUE });
        if (idx + timeText.length < quote.length) spans.push({ text: quote.substring(idx + timeText.length), color: COLOR_WHITE });
        return spans;
    }

    // ---- Interaction: click/space to cycle (instant, no animation for cycling) ----
    function cycleQuote() {
        if (!currentTimeKey) return;
        const entries = quotesMap[currentTimeKey];
        if (!entries || entries.length <= 1) return;
        currentEntryIndex = (currentEntryIndex + 1) % entries.length;
        if (animating) {
            // Force immediate finish of previous animation cascade
            for (let i = 0; i < totalLEDs; i++) {
                targetAngles[i] = currentAngles[i]; // freeze
            }
        }
        displayEntryAnimated(entries[currentEntryIndex]);
    }

    canvas.addEventListener('click', cycleQuote);
    document.addEventListener('keydown', (e) => {
        if (e.key === ' ' || e.key === 'ArrowRight') { e.preventDefault(); cycleQuote(); }
    });

    // ---- Init ----
    let powerOn = true;
    let bootActive = false;
    let updateTimer = null;

    window.addEventListener('resize', () => {
        resizeCanvas();
        if (powerOn && quotesLoaded && quotesMap[currentTimeKey]) {
            displayEntryInstant(quotesMap[currentTimeKey][currentEntryIndex % quotesMap[currentTimeKey].length]);
        } else if (!powerOn) {
            paintDiscs(); // repaint off state
        }
    });

    rebuildBuffers(); // Ensure arrays are sized to final GRID_W/H
    resizeCanvas();
    updateDimReadout();
    
    clearBuffer(targetBuffer);
    renderFixedLine_buf(targetBuffer, 'LOADING SYSTEM...', 0, COLOR_BLUE, 'left');
    renderFixedLine_buf(targetBuffer, 'LITERATURE CLOCK', BRAND_Y, COLOR_BRAND, 'right');
    snapToTarget();

    loadCSV().then(() => {
        logBoot('System Core // HI_CAPACITY_GRID Online', 'log-ok');
        logBoot('Ready!', 'log-brand');
        
        updateTimer = setInterval(() => updateDisplay(false), UPDATE_INTERVAL_MS);
        
        // Final layout settle
        requestAnimationFrame(() => {
            resizeCanvas();
            if (quotesLoaded && quotesMap[currentTimeKey]) {
                displayEntryInstant(quotesMap[currentTimeKey][currentEntryIndex % quotesMap[currentTimeKey].length]);
            }
        });
    });

    // ==================================================================
    // System Controls (Hacker Console)
    // ==================================================================
    window.togglePower = function () {
        if (bootActive) return;
        if (powerOn) {
            powerOn = false;
            if (animFrameId) { cancelAnimationFrame(animFrameId); animFrameId = null; }
            animating = false;
            if (updateTimer) { clearInterval(updateTimer); updateTimer = null; }
            currentTimeKey = '';
            clearBuffer(targetBuffer);
            snapToTarget();
            btnPower.textContent = '⏻ POWER ON';
            btnPower.classList.add('power-off');
            btnReboot.disabled = true;
            logBoot('[SYSTEM_HALT] Power Disconnected', 'log-warn');
        } else {
            runBootSequence();
        }
    };

    window.rebootSequence = function () {
        if (bootActive) return;
        powerOn = false;
        if (animFrameId) { cancelAnimationFrame(animFrameId); animFrameId = null; }
        animating = false;
        if (updateTimer) { clearInterval(updateTimer); updateTimer = null; }
        currentTimeKey = '';
        clearBuffer(targetBuffer);
        snapToTarget();
        logBoot('[REBOOTING]', 'log-warn');
        setTimeout(() => runBootSequence(), 600);
    };

    async function runBootSequence() {
        bootActive = true;
        powerOn = true;
        btnPower.textContent = '⏻ BOOTING...';
        btnPower.classList.remove('power-off');
        btnPower.disabled = true;
        btnReboot.disabled = true;

        const wait = (ms) => new Promise(r => setTimeout(r, ms));
        logBoot('Initializing System Core...', 'log-info');
        await wait(800);
        
        logBoot('Allocating 245,626 Disc Buffers...', 'log-info');
        rebuildBuffers();
        resizeCanvas();
        await wait(600);
        
        logBoot('Connecting to Neural Quote Mesh...', 'log-info');
        await loadCSV();
        
        logBoot('Status: ONLINE', 'log-ok');
        logBoot('Ready!', 'log-brand');
        
        btnPower.textContent = '⏻ SYSTEM_OFF';
        btnPower.disabled = false;
        btnReboot.disabled = false;
        bootActive = false;
        
        updateTimer = setInterval(() => updateDisplay(false), UPDATE_INTERVAL_MS);
    }

    const btnPower = document.getElementById('btnPower');
    const btnReboot = document.getElementById('btnReboot');

})();

        clearBuffer(targetBuffer);
        renderFixedLine_buf(targetBuffer, h + ':' + m + ':' + s, 0, [30, 180, 30], 'center');
        snapToTarget();
        await wait(600);

        // ---- Stage 6: Ready — show quote ----
        logBoot('Loading quotes...', 'log-info');
        await wait(300);
        logBoot(`  ${Object.keys(quotesMap).length} unique times loaded`, 'log-ok');
        logBoot('Ready!', 'log-ok');

        clearBuffer(targetBuffer);
        snapToTarget();
        await wait(200);

        // Show the current time's quote with the sweep animation
        currentTimeKey = '';
        updateDisplay(true);
        updateTimer = setInterval(() => updateDisplay(false), UPDATE_INTERVAL_MS);

        // Restore button states
        bootActive = false;
        btnPower.textContent = '⏻ POWER OFF';
        btnPower.disabled = false;
        btnReboot.disabled = false;
    }
})();
