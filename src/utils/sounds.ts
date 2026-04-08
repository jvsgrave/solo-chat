type AudioMode = 'solo' | 'shh' | 'script'

function makeCtx() {
  return new AudioContext()
}

function tone(
  c: AudioContext,
  type: OscillatorType,
  freqStart: number,
  freqEnd: number | null,
  vol: number,
  dur: number,
  delay = 0,
) {
  const o = c.createOscillator()
  const g = c.createGain()
  o.connect(g)
  g.connect(c.destination)
  o.type = type
  const t = c.currentTime + delay
  o.frequency.setValueAtTime(freqStart, t)
  if (freqEnd !== null) o.frequency.exponentialRampToValueAtTime(freqEnd, t + dur * 0.8)
  g.gain.setValueAtTime(vol, t)
  g.gain.exponentialRampToValueAtTime(0.001, t + dur)
  o.start(t)
  o.stop(t + dur + 0.01)
}

// Message sent
export function playPopSound(mode: AudioMode = 'solo') {
  try {
    const c = makeCtx()
    if (mode === 'shh') tone(c, 'sine', 660, 250, 0.22, 0.15)
    else tone(c, 'sine', 900, 350, 0.26, 0.12)
  } catch {}
}

// AI response received
export function playReceiveSound(mode: AudioMode) {
  try {
    const c = makeCtx()
    if (mode === 'solo') {
      tone(c, 'sine', 660, null, 0.08, 0.55)
      tone(c, 'sine', 880, null, 0.05, 0.60, 0.14)
    } else {
      // Low, dark, descending
      tone(c, 'triangle', 300, 160, 0.10, 0.60)
    }
  } catch {}
}

// Copy button
export function playCopySound(mode: AudioMode) {
  try {
    const c = makeCtx()
    const f = mode === 'shh' ? 560 : 760
    tone(c, 'sine', f, null, 0.11, 0.10)
    tone(c, 'sine', f * 1.5, null, 0.055, 0.13, 0.05)
  } catch {}
}

// Thumbs up
export function playLikeSound() {
  try {
    const c = makeCtx()
    ;[523, 659, 784, 1047].forEach((f, i) => {
      tone(c, 'sine', f, null, 0.08, 0.45, i * 0.09)
    })
  } catch {}
}

// Thumbs down
export function playDislikeSound() {
  try {
    const c = makeCtx()
    tone(c, 'sawtooth', 250, 110, 0.09, 0.40)
  } catch {}
}

// Mode switch (solo ↔ shh ↔ script)
export function playModeSound(to: AudioMode) {
  try {
    const c = makeCtx()
    if (to === 'shh') {
      tone(c, 'sine', 440, 80, 0.12, 0.65)
    } else if (to === 'script') {
      // Digital ascending pair — "entering terminal"
      tone(c, 'square', 320, 640, 0.06, 0.12)
      tone(c, 'square', 640, 1280, 0.04, 0.10, 0.10)
    } else {
      tone(c, 'sine', 110, 520, 0.10, 0.55)
    }
  } catch {}
}

// Sidebar open/close
export function playSidebarSound(opening: boolean) {
  try {
    const c = makeCtx()
    tone(c, 'sine', opening ? 520 : 480, null, 0.055, 0.10)
  } catch {}
}

// Settings open/close
export function playSettingsSound(opening: boolean) {
  try {
    const c = makeCtx()
    tone(c, 'sine', opening ? 700 : 500, null, 0.065, 0.16)
    tone(c, 'sine', opening ? 900 : 360, null, 0.040, 0.24, 0.09)
  } catch {}
}

// New chat created
export function playNewChatSound(mode: AudioMode) {
  try {
    const c = makeCtx()
    if (mode === 'solo') {
      tone(c, 'sine', 880, null, 0.07, 0.28)
      tone(c, 'sine', 1100, null, 0.045, 0.34, 0.10)
    } else {
      tone(c, 'triangle', 360, 180, 0.07, 0.42)
    }
  } catch {}
}

// Intro enter button
export function playEnterSound() {
  try {
    const c = makeCtx()
    ;[261, 329, 392, 523].forEach((f, i) => {
      tone(c, 'sine', f, null, 0.10, 0.90, i * 0.11)
    })
  } catch {}
}
