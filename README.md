# TYPE | SPEED — Terminal Typing Test

> A retro dark-terminal typing speed test that runs entirely in the browser. No frameworks, no backend, no build step — just one HTML file.

![TYPE//SPEED preview](https://img.shields.io/badge/status-ready--to--deploy-39ff14?style=flat-square&labelColor=0a0e0a&color=39ff14)
![License](https://img.shields.io/badge/license-MIT-39ff14?style=flat-square&labelColor=0a0e0a)
![HTML](https://img.shields.io/badge/built%20with-HTML%20%2F%20CSS%20%2F%20JS-39ff14?style=flat-square&labelColor=0a0e0a)

---

## Table of Contents

- [Demo](#demo)
- [Features](#features)
- [Screenshots](#screenshots)
- [Getting Started](#getting-started)
- [Deployment](#deployment)
- [How It Works](#how-it-works)
- [Project Structure](#project-structure)
- [Customization](#customization)
- [Keyboard Shortcuts](#keyboard-shortcuts)
- [Grading System](#grading-system)
- [Browser Support](#browser-support)
- [Contributing](#contributing)
- [License](#license)

---

## Demo

**[Live Demo →](https://your-username.github.io/type-speed)**

*(Replace the link above with your GitHub Pages URL after deployment.)*

---

## Features

### Core
- Real-time character-by-character feedback — correct chars highlight green, errors highlight red
- WPM calculated live as you type using the standard 5-characters-per-word formula
- Adjusted WPM (penalized by accuracy) and Raw WPM both displayed on results
- Accuracy percentage tracked per keystroke

### Test Modes
| Mode | Duration | Description |
|---|---|---|
| Quick | 15 seconds | Sprint — type as fast as possible |
| Standard | 30 seconds | Default practice mode |
| Long | 60 seconds | Endurance run |
| Quote | No limit | Type the full quote, accuracy focused |

### Quote Library
- 20+ built-in quotes: motivational, coding/tech, literary excerpts, famous sayings
- Quotes range from short (~20 words) to long (100+ words) with real punctuation and capitals
- New Quote button picks a random different quote without resetting your session stats

### Results Dashboard
After each test you see:
- Adjusted WPM, Raw WPM, Accuracy %, Time, Characters typed, Error count
- Letter grade (S / A / B / C / F) with a glitch animation on reveal

### History & Personal Bests
- Last 10 results saved to `localStorage` — persist across sessions
- Best WPM and Best Accuracy tracked separately
- Clear History button wipes all stored data

### Visual & UX
- Dark Terminal theme — CRT scanlines, phosphor-green glow, VT323 / Orbitron / Share Tech Mono fonts
- On-screen keyboard highlights the next key to press
- Live character counter and error counter below the quote
- Caps Lock warning banner
- Sound toggle — error beep via Web Audio API (off by default)
- Paste disabled in the typing field (prevents cheating)
- Auto-focus on page load and after each reset
- Mobile warning banner on small screens

---

## Getting Started

### Option 1 — Open Directly

No installation needed. Clone or download the repo, then open `typing-speed-test.html` in any modern browser:

```bash
git clone https://github.com/your-username/type-speed.git
cd type-speed
open typing-speed-test.html   # macOS
# or double-click the file in your file manager
```

### Option 2 — Local Dev Server

If you prefer a server (e.g., to avoid browser CORS quirks with local fonts):

```bash
# Python 3
python -m http.server 8080

# Node (npx)
npx serve .

# VS Code
# Install "Live Server" extension → right-click the file → Open with Live Server
```

Then visit `http://localhost:8080/typing-speed-test.html`.

---

## Deployment

### GitHub Pages (recommended — free & instant)

1. Push the repo to GitHub.
2. Go to **Settings → Pages**.
3. Under **Source**, select `main` branch and `/ (root)`.
4. Click **Save**.
5. GitHub Pages will publish the site at `https://your-username.github.io/type-speed/typing-speed-test.html`.

To serve it at the root URL, rename the file to `index.html` before pushing:

```bash
mv typing-speed-test.html index.html
git add .
git commit -m "rename to index.html for GitHub Pages"
git push
```

Your site will now be live at `https://your-username.github.io/type-speed/`.

### Netlify (drag & drop)

1. Go to [netlify.com](https://netlify.com) and sign in.
2. Drag the project folder onto the Netlify dashboard.
3. Done — live in seconds with a random subdomain (e.g., `https://type-speed-abc.netlify.app`).

### Vercel

```bash
npm i -g vercel
vercel --prod
```

### Any Static Host

Upload `typing-speed-test.html` (or `index.html`) to any host that serves static files:
Cloudflare Pages, Surge.sh, Firebase Hosting, Amazon S3 + CloudFront, etc.

---

## How It Works

### Timer

The timer uses `setInterval` at 50 ms ticks with `performance.now()` timestamps for drift-free elapsed time. Pausing records the accumulated milliseconds so resuming continues from the exact same point.

```
elapsedMs = (performance.now() - timerStart) + timerElapsed
```

### WPM Formula

```
Raw WPM      = (totalCharactersTyped / 5) / elapsedMinutes
Adjusted WPM = rawWPM × (accuracy / 100)
```

The industry-standard "word" is 5 characters, regardless of actual word length. Adjusted WPM penalizes errors so it reflects real typing productivity.

### Accuracy

```
accuracy = (correctKeystrokes / totalKeystrokes) × 100
```

`correctKeystrokes` is the count of typed characters that match the quote at the same position. Backspace does not count as a keystroke or an error.

### localStorage Schema

Two keys are stored:

```js
// Array of up to 10 result objects
localStorage['typespeed_history'] = JSON.stringify([
  { date, mode, wpm, rawWpm, accuracy, grade }
]);

// Personal bests
localStorage['typespeed_best'] = JSON.stringify({ wpm, accuracy });
```

---

## Project Structure

```
type-speed/
├── typing-speed-test.html   ← entire application (HTML + CSS + JS)
└── README.md
```

Everything is self-contained in a single HTML file:

| Section | Description |
|---|---|
| `<style>` | All CSS — variables, layout, animations, keyboard, results overlay |
| `QUOTES` array | 20+ built-in quote strings |
| `state` object | Single source of truth for all runtime state |
| `KB_ROWS` array | Key labels used to render the on-screen keyboard |
| Timer functions | `startTimer`, `tickTimer`, `stopTimer`, `getElapsedMs` |
| Input handler | `handleInput` — diff typed vs quote, update highlights, track stats |
| Results | `finishTest`, `calcGrade` |
| History | `saveResult`, `getHistory`, `getBest`, `renderHistory`, `clearHistory` |
| Sound | `playBeep` via Web Audio API |
| Keyboard | `buildKeyboard`, `highlightKey` |

---

## Customization

### Adding Quotes

Open `typing-speed-test.html` and add strings to the `QUOTES` array near the top of the `<script>` block:

```js
const QUOTES = [
  "Your new quote goes here, with real punctuation.",
  // ... existing quotes
];
```

Keep quotes between 20 and 150 words for best playability. Include commas, periods, apostrophes, and capitals — they make for realistic practice.

### Changing Colors

All colors are CSS custom properties at the top of `<style>`. Edit them to retheme the entire app:

```css
:root {
  --bg:    #0a0e0a;   /* page background */
  --green: #39ff14;   /* primary accent / correct color */
  --red:   #ff3131;   /* error color */
  --cyan:  #00e5ff;   /* S-grade / personal best color */
  /* ...etc */
}
```

### Changing Default Mode

Change the initial `mode` value in the `state` object:

```js
const state = {
  mode: 30,   // 15 | 30 | 60 | 0 (quote)
  // ...
};
```

### Adjusting Grade Thresholds

Edit `calcGrade()` to raise or lower the bar:

```js
function calcGrade(wpm, acc) {
  if (wpm >= 80 && acc >= 95) return 'S';
  if (wpm >= 60 && acc >= 90) return 'A';
  if (wpm >= 40 && acc >= 85) return 'B';
  if (wpm >= 20 && acc >= 75) return 'C';
  return 'F';
}
```

---

## Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `Enter` | Restart test (when not typing) |
| `Ctrl + N` | Load a new random quote |
| `Ctrl + P` | Pause / resume current test |

---

## Grading System

Grades are based on **Adjusted WPM** (accuracy-penalized) combined with accuracy percentage:

| Grade | Min WPM | Min Accuracy |
|---|---|---|
| S | 80 | 95% |
| A | 60 | 90% |
| B | 40 | 85% |
| C | 20 | 75% |
| F | below C thresholds | — |

Average professional typists score 55–80 WPM. Average person types 40–55 WPM. Touch-typists with practice commonly exceed 80 WPM.

---

## Browser Support

| Browser | Support |
|---|---|
| Chrome 90+ | ✅ Full |
| Firefox 88+ | ✅ Full |
| Safari 15+ | ✅ Full |
| Edge 90+ | ✅ Full |
| Mobile browsers | ⚠️ Works, physical keyboard recommended |

Requires: `localStorage`, `performance.now()`, CSS custom properties, `AudioContext` (optional — for sound only).

---

## Contributing

Contributions are welcome! Ideas for improvement:

- Additional themes (Minimal Light, Cyberpunk)
- Custom quote import (paste your own text)
- Multiplayer race mode
- More detailed per-key error analytics
- Internationalization / non-English quote packs

To contribute:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit your changes: `git commit -m "add my feature"`
4. Push to the branch: `git push origin feature/my-feature`
5. Open a Pull Request

Please keep everything in the single-file format and avoid adding external dependencies.

---

## License

MIT License — see [LICENSE](LICENSE) for details.

```
MIT License

Copyright (c) 2026 your-username

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

<p align="center">
  Built with ♥ and a terminal aesthetic &nbsp;·&nbsp;
  <a href="https://your-username.github.io/type-speed">Live Demo</a> &nbsp;·&nbsp;
  <a href="https://github.com/your-username/type-speed/issues">Report a Bug</a>
</p>
