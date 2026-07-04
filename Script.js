
const QUOTES = [
  // Coding/Tech
  "Any fool can write code that a computer can understand. Good programmers write code that humans can understand.",
  "First, solve the problem. Then, write the code.",
  "Experience is the name everyone gives to their mistakes.",
  "In order to be irreplaceable, one must always be different.",
  "Java is to JavaScript what car is to carpet.",
  "Code is like humor. When you have to explain it, it's bad.",
  "The best error message is the one that never shows up.",
  "Simplicity is the soul of efficiency.",
  "Programs must be written for people to read, and only incidentally for machines to execute.",
  "There are only two hard things in computer science: cache invalidation and naming things.",
  // Motivational
  "The only way to do great work is to love what you do. If you haven't found it yet, keep looking. Don't settle.",
  "Success is not final, failure is not fatal: it is the courage to continue that counts.",
  "It does not matter how slowly you go as long as you do not stop.",
  "Everything you've ever wanted is on the other side of fear.",
  "Do not wait to strike till the iron is hot, but make it hot by striking.",
  // Famous / Book excerpts
  "It was the best of times, it was the worst of times, it was the age of wisdom, it was the age of foolishness.",
  "Not all those who wander are lost. The old that is strong does not wither, deep roots are not reached by the frost.",
  "To be, or not to be, that is the question: whether 'tis nobler in the mind to suffer the slings and arrows of outrageous fortune, or to take arms against a sea of troubles.",
  "It is a truth universally acknowledged, that a single man in possession of a good fortune, must be in want of a wife.",
  "The sky above the port was the color of television, tuned to a dead channel.",
  "All happy families are alike; each unhappy family is unhappy in its own way.",
  "We are all just walking each other home.",
  "Two roads diverged in a wood, and I took the one less traveled by, and that has made all the difference.",
];

/* ============================================================
   STATE
   ============================================================ */
const state = {
  mode:          15,      // seconds; 0 = quote mode
  quote:         '',
  started:       false,
  finished:      false,
  paused:        false,
  timerStart:    null,    // timestamp when timer began
  timerElapsed:  0,       // accumulated ms before pause
  timerInterval: null,
  totalKeystrokes: 0,
  correctKeystrokes: 0,
  errors:        0,       // cumulative errors
  quoteIndex:    -1,
  soundOn:       false,
  audioCtx:      null,
};

/* ============================================================
   KEYBOARD LAYOUT (display only)
   ============================================================ */
const KB_ROWS = [
  ['`','1','2','3','4','5','6','7','8','9','0','-','=','⌫'],
  ['⇥','Q','W','E','R','T','Y','U','I','O','P','[',']','\\'],
  ['⇪','A','S','D','F','G','H','J','K','L',';',"'",'↵'],
  ['⇧','Z','X','C','V','B','N','M',',','.','/','⇧'],
  ['SPACE'],
];

const KB_WIDTHS = {
  '⌫': 'wide-2', '⇥': 'wide-1-5', '⇪': 'wide-2', '↵': 'wide-2',
  '⇧': 'wide-2-5', 'SPACE': 'wide-6',
};

/* ============================================================
   DOM REFS
   ============================================================ */
const $ = id => document.getElementById(id);
const quoteDisplay  = $('quoteDisplay');
const typingInput   = $('typingInput');
const timerDisplay  = $('timerDisplay');
const timerLabel    = $('timerLabel');
const progressFill  = $('progressFill');
const liveWpm       = $('liveWpm');
const charCounter   = $('charCounter');
const errorCounter  = $('errorCounter');
const accuracyLive  = $('accuracyLive');
const resultsOverlay= $('resultsOverlay');
const capsWarning   = $('capsWarning');

/* ============================================================
   INIT
   ============================================================ */
function init() {
  buildKeyboard();
  loadHistory();
  pickRandomQuote();
  renderQuote();
  updateTimerDisplay();
  typingInput.focus();
}

/* ============================================================
   QUOTE MANAGEMENT
   ============================================================ */
function pickRandomQuote() {
  let idx;
  do { idx = Math.floor(Math.random() * QUOTES.length); }
  while (idx === state.quoteIndex && QUOTES.length > 1);
  state.quoteIndex = idx;
  state.quote = QUOTES[idx];
}

function renderQuote() {
  quoteDisplay.innerHTML = '';
  for (let i = 0; i < state.quote.length; i++) {
    const span = document.createElement('span');
    span.className = 'char' + (i === 0 ? ' current' : '');
    span.dataset.index = i;
    span.textContent = state.quote[i] === ' ' ? '\u00a0' : state.quote[i];
    quoteDisplay.appendChild(span);
  }
}

/* ============================================================
   MODE SELECTION
   ============================================================ */
function setMode(btn, seconds) {
  document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  state.mode = seconds;
  restartTest();
}

/* ============================================================
   TIMER LOGIC
   ============================================================ */
function startTimer() {
  state.timerStart   = performance.now();
  state.timerElapsed = 0;
  state.timerInterval = setInterval(tickTimer, 50);
}

function tickTimer() {
  if (state.paused || state.finished) return;

  const now     = performance.now();
  const elapsed = (now - state.timerStart) + state.timerElapsed; // ms

  // Update live WPM
  const minutesElapsed = elapsed / 60000;
  if (minutesElapsed > 0 && state.totalKeystrokes > 0) {
    const rawWpm = Math.round((state.totalKeystrokes / 5) / minutesElapsed);
    liveWpm.textContent = rawWpm;
  }

  if (state.mode === 0) {
    // Quote mode — count up
    const secs = Math.floor(elapsed / 1000);
    timerDisplay.textContent = formatTime(secs);
    timerLabel.textContent = 'ELAPSED';
    progressFill.style.width = '0%';
    $('progressBar').style.display = 'none';
  } else {
    // Countdown
    const remaining = Math.max(0, state.mode * 1000 - elapsed);
    const secs      = Math.ceil(remaining / 1000);
    timerDisplay.textContent = secs;
    timerLabel.textContent = 'REMAINING';
    $('progressBar').style.display = 'block';
    progressFill.style.width = ((1 - remaining / (state.mode * 1000)) * 100) + '%';

    // Danger color at 5s
    if (secs <= 5) timerDisplay.classList.add('danger');
    else           timerDisplay.classList.remove('danger');

    if (remaining <= 0) {
      finishTest(elapsed);
    }
  }
}

function formatTime(secs) {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return m > 0 ? `${m}:${String(s).padStart(2,'0')}` : `${s}`;
}

function stopTimer() {
  if (state.timerInterval) {
    clearInterval(state.timerInterval);
    state.timerInterval = null;
  }
}

function getElapsedMs() {
  if (!state.started) return 0;
  if (state.paused)   return state.timerElapsed;
  return (performance.now() - state.timerStart) + state.timerElapsed;
}

function updateTimerDisplay() {
  if (state.mode === 0) {
    timerDisplay.textContent = '∞';
    timerLabel.textContent   = 'QUOTE MODE';
    $('progressBar').style.display = 'none';
  } else {
    timerDisplay.textContent = state.mode;
    timerLabel.textContent   = 'READY';
    $('progressBar').style.display = 'block';
    progressFill.style.width = '0%';
  }
  timerDisplay.classList.remove('danger');
  liveWpm.textContent = '--';
}


typingInput.addEventListener('input', handleInput);
typingInput.addEventListener('paste', e => e.preventDefault()); // disable paste
typingInput.addEventListener('keydown', handleKeydown);

function handleKeydown(e) {
  // Keyboard shortcuts
  if (e.key === 'Enter' && !e.ctrlKey && !e.shiftKey) {
    // Allow newline only if inside textarea — actually we want Enter = restart
    // Only restart when test not started or finished
    if (!state.started || state.finished) { e.preventDefault(); restartTest(); return; }
  }
  if (e.ctrlKey && e.key === 'n') { e.preventDefault(); newQuote(); return; }
  if (e.ctrlKey && e.key === 'p') { e.preventDefault(); pauseTest(); return; }

  // Caps lock detection
  if (e.getModifierState && e.getModifierState('CapsLock')) {
    capsWarning.classList.add('visible');
  } else {
    capsWarning.classList.remove('visible');
  }
}

/**
 * MAIN INPUT HANDLER
 * Compares textarea value character-by-character against the quote.
 */
function handleInput(e) {
  if (state.finished || state.paused) {
    typingInput.value = typingInput.value.slice(0, -1); // reject input
    return;
  }

  const typed  = typingInput.value;
  const quote  = state.quote;

  // Clamp to quote length — ignore extra chars
  if (typed.length > quote.length) {
    typingInput.value = typed.slice(0, quote.length);
    return;
  }

  // Start timer on first character
  if (!state.started && typed.length > 0) {
    state.started = true;
    startTimer();
  }

  // Track keystrokes (length increase = new char typed)
  // We track via totalKeystrokes incremented on each input event
  // For accuracy: correct = chars matching quote, total = chars typed
  state.totalKeystrokes = typed.length > state.totalKeystrokes
    ? state.totalKeystrokes + 1
    : state.totalKeystrokes;

  // Count errors cumulatively
  let currentErrors = 0;
  for (let i = 0; i < typed.length; i++) {
    if (typed[i] !== quote[i]) currentErrors++;
  }

  // Update state
  state.errors = currentErrors;
  state.correctKeystrokes = typed.length - currentErrors;

  // Update quote character coloring
  const chars = quoteDisplay.querySelectorAll('.char');
  for (let i = 0; i < chars.length; i++) {
    chars[i].classList.remove('correct', 'incorrect', 'current');
    if (i < typed.length) {
      chars[i].classList.add(typed[i] === quote[i] ? 'correct' : 'incorrect');
    } else if (i === typed.length) {
      chars[i].classList.add('current');
    }
  }

  // Highlight keyboard
  if (typed.length < quote.length) {
    highlightKey(quote[typed.length]);
  }

  // Update counters
  const acc = typed.length > 0
    ? Math.round((state.correctKeystrokes / typed.length) * 100)
    : 100;

  charCounter.textContent    = `CHARS: ${typed.length}/${quote.length}`;
  errorCounter.textContent   = `ERRORS: ${currentErrors}`;
  accuracyLive.textContent   = `ACC: ${acc}%`;

  // Error sound
  if (state.soundOn && e.inputType === 'insertText') {
    const lastChar = typed[typed.length - 1];
    const expected = quote[typed.length - 1];
    if (lastChar && lastChar !== expected) playBeep(400, 0.08, 'square');
  }

  // Error flash on input
  if (currentErrors > 0 && typed.length > 0 && typed[typed.length-1] !== quote[typed.length-1]) {
    typingInput.classList.add('error');
    setTimeout(() => typingInput.classList.remove('error'), 120);
  }

  // Check completion (quote mode finishes when full quote typed correctly)
  if (typed === quote) {
    finishTest(getElapsedMs());
    return;
  }

  // Timed modes: if quote is fully typed (correctly or not) before time is up, continue (user keeps typing beyond is blocked)
}

/* ============================================================
   FINISH / RESULTS
   ============================================================ */
/**
 * WPM Formula:
 *   Raw WPM = (totalCharactersTyped / 5) / (elapsedMinutes)
 *   Adjusted WPM = rawWPM × (accuracy / 100)
 * Standard: 5 chars = 1 "word"
 */
function finishTest(elapsedMs) {
  if (state.finished) return;
  state.finished = true;
  stopTimer();
  typingInput.setAttribute('readonly', true);

  const typed         = typingInput.value;
  const elapsedSecs   = elapsedMs / 1000;
  const elapsedMin    = elapsedMs / 60000;

  const totalTyped    = typed.length;
  const correctTyped  = state.correctKeystrokes;
  const accuracy      = totalTyped > 0 ? (correctTyped / totalTyped) * 100 : 0;

  const rawWpm        = elapsedMin > 0 ? (totalTyped / 5) / elapsedMin : 0;
  const adjWpm        = rawWpm * (accuracy / 100);

  const grade         = calcGrade(adjWpm, accuracy);

  // Populate results
  $('resultGrade').textContent  = grade;
  $('resultGrade').className    = 'grade-display grade-' + grade;
  $('resWpm').textContent       = Math.round(adjWpm);
  $('resRawWpm').textContent    = Math.round(rawWpm);
  $('resAccuracy').textContent  = Math.round(accuracy) + '%';
  $('resTime').textContent      = formatTime(Math.round(elapsedSecs)) + 's';
  $('resChars').textContent     = totalTyped + '/' + state.quote.length;
  $('resErrors').textContent    = state.errors;

  // Glitch effect on grade
  $('resultGrade').classList.add('glitch-anim');
  setTimeout(() => $('resultGrade').classList.remove('glitch-anim'), 900);

  // Show overlay
  resultsOverlay.classList.add('show');

  // Save to history
  saveResult({
    date:     new Date().toLocaleDateString(),
    mode:     state.mode === 0 ? 'QT' : state.mode + 's',
    wpm:      Math.round(adjWpm),
    rawWpm:   Math.round(rawWpm),
    accuracy: Math.round(accuracy),
    grade,
  });

  // Play completion sound
  if (state.soundOn) playBeep(880, 0.15, 'sine');
}

/**
 * GRADE CALCULATION
 * Based on adjusted WPM + accuracy.
 * S: >80 WPM + >95% accuracy
 * A: >60 WPM + >90%
 * B: >40 WPM + >85%
 * C: >20 WPM + >75%
 * F: else
 */
function calcGrade(wpm, acc) {
  if (wpm >= 80 && acc >= 95) return 'S';
  if (wpm >= 60 && acc >= 90) return 'A';
  if (wpm >= 40 && acc >= 85) return 'B';
  if (wpm >= 20 && acc >= 75) return 'C';
  return 'F';
}

/* ============================================================
   CONTROLS
   ============================================================ */
function restartTest() {
  stopTimer();
  state.started      = false;
  state.finished     = false;
  state.paused       = false;
  state.timerStart   = null;
  state.timerElapsed = 0;
  state.totalKeystrokes    = 0;
  state.correctKeystrokes  = 0;
  state.errors       = 0;

  typingInput.removeAttribute('readonly');
  typingInput.value = '';
  typingInput.classList.remove('error');
  resultsOverlay.classList.remove('show');

  renderQuote();
  updateTimerDisplay();
  highlightKey(state.quote[0]);

  charCounter.textContent  = `CHARS: 0/${state.quote.length}`;
  errorCounter.textContent = 'ERRORS: 0';
  accuracyLive.textContent = 'ACC: —';

  typingInput.focus();
}

function newQuote() {
  pickRandomQuote();
  restartTest();
}

function pauseTest() {
  if (!state.started || state.finished) return;
  if (!state.paused) {
    // Pause
    state.paused = true;
    state.timerElapsed += performance.now() - state.timerStart;
    stopTimer();
    typingInput.setAttribute('readonly', true);
    timerLabel.textContent = 'PAUSED';
  } else {
    // Resume
    state.paused = false;
    state.timerStart = performance.now();
    typingInput.removeAttribute('readonly');
    timerLabel.textContent = state.mode === 0 ? 'ELAPSED' : 'REMAINING';
    state.timerInterval = setInterval(tickTimer, 50);
    typingInput.focus();
  }
}

function closeResults() {
  resultsOverlay.classList.remove('show');
}

/* ============================================================
   localStorage — HISTORY
   Keys used: typespeed_history, typespeed_best
   ============================================================ */
function saveResult(result) {
  // Load existing history
  let history = getHistory();
  history.unshift(result); // prepend newest
  if (history.length > 10) history = history.slice(0, 10);
  localStorage.setItem('typespeed_history', JSON.stringify(history));

  // Update personal bests
  let best = getBest();
  let changed = false;
  if (result.wpm > (best.wpm || 0))         { best.wpm = result.wpm; changed = true; }
  if (result.accuracy > (best.accuracy || 0)){ best.accuracy = result.accuracy; changed = true; }
  if (changed) localStorage.setItem('typespeed_best', JSON.stringify(best));

  renderHistory(history, best);
}

function getHistory() {
  try { return JSON.parse(localStorage.getItem('typespeed_history') || '[]'); }
  catch { return []; }
}

function getBest() {
  try { return JSON.parse(localStorage.getItem('typespeed_best') || '{}'); }
  catch { return {}; }
}

function loadHistory() {
  const history = getHistory();
  const best    = getBest();
  renderHistory(history, best);
}

function renderHistory(history, best) {
  // Best scores
  $('bestWpm').textContent = best.wpm     ? best.wpm + '' : '—';
  $('bestAcc').textContent = best.accuracy? best.accuracy + '%' : '—';

  // History list
  const list = $('historyList');
  if (!history || history.length === 0) {
    list.innerHTML = '<div class="no-history">No tests yet.</div>';
    return;
  }
  list.innerHTML = history.map(r => `
    <div class="history-item">
      <div class="history-grade grade-${r.grade}">${r.grade}</div>
      <div>
        <div class="history-date">${r.date} · ${r.mode}</div>
      </div>
      <div class="history-wpm">${r.wpm}</div>
      <div class="history-acc">${r.accuracy}%</div>
    </div>
  `).join('');
}

function clearHistory() {
  localStorage.removeItem('typespeed_history');
  localStorage.removeItem('typespeed_best');
  loadHistory();
}

/* ============================================================
   SOUND
   ============================================================ */
function toggleSound() {
  state.soundOn = !state.soundOn;
  const btn = $('soundBtn');
  btn.textContent = state.soundOn ? 'SND: ON' : 'SND: OFF';
  btn.classList.toggle('active', state.soundOn);

  if (state.soundOn && !state.audioCtx) {
    state.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (state.soundOn) playBeep(660, 0.08, 'sine');
}

/**
 * Play a short beep using Web Audio API.
 */
function playBeep(freq = 440, duration = 0.07, type = 'square') {
  if (!state.audioCtx) return;
  const osc  = state.audioCtx.createOscillator();
  const gain = state.audioCtx.createGain();
  osc.connect(gain);
  gain.connect(state.audioCtx.destination);
  osc.frequency.value = freq;
  osc.type = type;
  gain.gain.setValueAtTime(0.15, state.audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, state.audioCtx.currentTime + duration);
  osc.start(state.audioCtx.currentTime);
  osc.stop(state.audioCtx.currentTime + duration);
}

/* ============================================================
   ON-SCREEN KEYBOARD
   ============================================================ */
function buildKeyboard() {
  const container = $('kbRows');
  KB_ROWS.forEach(row => {
    const rowDiv = document.createElement('div');
    rowDiv.className = 'kb-row';
    row.forEach(key => {
      const keyDiv = document.createElement('div');
      keyDiv.className = 'kb-key' + (KB_WIDTHS[key] ? ' ' + KB_WIDTHS[key] : '');
      keyDiv.textContent = key;
      keyDiv.dataset.key = key.toLowerCase();
      rowDiv.appendChild(keyDiv);
    });
    container.appendChild(rowDiv);
  });
}

function highlightKey(char) {
  // Clear all highlights
  document.querySelectorAll('.kb-key').forEach(k => {
    k.classList.remove('active-next', 'active-press');
  });
  if (!char) return;

  // Map character to key label
  let target = char.toLowerCase();
  if (char === ' ') target = 'space';

  document.querySelectorAll('.kb-key').forEach(k => {
    if (k.dataset.key === target) k.classList.add('active-next');
  });
}

/* ============================================================
   GLOBAL KEYBOARD SHORTCUTS (outside textarea)
   ============================================================ */
document.addEventListener('keydown', e => {
  if (document.activeElement !== typingInput) {
    if (e.key === 'Enter') { restartTest(); return; }
  }
  if (e.ctrlKey && e.key === 'n') { e.preventDefault(); newQuote(); }
  if (e.ctrlKey && e.key === 'p') { e.preventDefault(); pauseTest(); }
});

/* ============================================================
   AUTO-FOCUS on click anywhere
   ============================================================ */
document.addEventListener('click', e => {
  if (!e.target.closest('button') && !e.target.closest('.results-overlay button')) {
    typingInput.focus();
  }
});

/* ============================================================
   BOOT
   ============================================================ */
init();
