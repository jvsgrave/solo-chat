import { useEffect, useState } from 'react'
import { playEnterSound } from '../utils/sounds'

interface IntroScreenProps {
  onDone: () => void
}

function playIntroChime() {
  try {
    const ctx = new AudioContext()
    const notes = [523, 659, 784] // C5, E5, G5
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.type = 'sine'
      osc.frequency.value = freq
      const start = ctx.currentTime + i * 0.14
      gain.gain.setValueAtTime(0, start)
      gain.gain.linearRampToValueAtTime(0.12, start + 0.06)
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.9)
      osc.start(start)
      osc.stop(start + 0.9)
    })
  } catch {}
}

export function IntroScreen({ onDone }: IntroScreenProps) {
  const [phase, setPhase] = useState<'in' | 'ready' | 'exiting'>('in')

  useEffect(() => {
    const t0 = setTimeout(() => playIntroChime(), 200)
    const t1 = setTimeout(() => setPhase('ready'), 1100)
    return () => { clearTimeout(t0); clearTimeout(t1) }
  }, [])

  const handleEnter = () => {
    if (phase !== 'ready') return
    playEnterSound()
    setPhase('exiting')
    setTimeout(onDone, 950)
  }

  const isExiting = phase === 'exiting'

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 9999,
      background: '#000000',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '52px',
    }}>

      {/* "solo" — gradient shimmer through text */}
      <span
        className={phase === 'ready' ? 'intro-shimmer' : undefined}
        style={{
          fontFamily: "'Great Vibes', cursive",
          fontSize: '96px',
          fontWeight: 400,
          letterSpacing: '0.04em',
          // Symmetric gradient — 0% and 100% match so the loop is seamless
          background: 'linear-gradient(90deg, rgba(255,255,255,0.38) 0%, rgba(255,255,255,0.90) 25%, rgba(255,255,255,0.38) 50%, rgba(255,255,255,0.90) 75%, rgba(255,255,255,0.38) 100%)',
          backgroundSize: '200% 100%',
          WebkitBackgroundClip: 'text',
          backgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          userSelect: 'none',
          opacity: phase === 'in' ? 0 : isExiting ? 0 : 1,
          transform: phase === 'in'
            ? 'translateY(18px) scale(0.96)'
            : isExiting
              ? 'translateY(-22px) scale(1.1)'
              : 'translateY(0) scale(1)',
          filter: isExiting ? 'blur(16px)' : 'blur(0px)',
          transition: phase === 'in'
            ? 'opacity 1000ms ease, transform 1100ms cubic-bezier(0.16,1,0.3,1)'
            : 'opacity 620ms ease, transform 720ms cubic-bezier(0.4,0,1,1), filter 620ms ease',
        }}
      >
        solo
      </span>

      {/* Enter button */}
      <button
        onClick={handleEnter}
        style={{
          padding: '13px 44px',
          borderRadius: '99px',
          border: '1px solid rgba(255,255,255,0.22)',
          background: 'rgba(255,255,255,0.07)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          color: 'rgba(255,255,255,0.75)',
          fontSize: '13px',
          fontWeight: 500,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          cursor: 'pointer',
          fontFamily: 'inherit',
          opacity: phase === 'ready' ? 1 : 0,
          transform: phase === 'ready' ? 'translateY(0)' : 'translateY(12px)',
          transition: isExiting
            ? 'opacity 400ms ease'
            : 'opacity 850ms ease, transform 900ms cubic-bezier(0.16, 1, 0.3, 1), background 280ms cubic-bezier(0.25, 0.46, 0.45, 0.94), border-color 280ms cubic-bezier(0.25, 0.46, 0.45, 0.94), color 280ms cubic-bezier(0.25, 0.46, 0.45, 0.94)',
          pointerEvents: phase === 'ready' ? 'auto' : 'none',
        }}
        onMouseEnter={e => {
          const el = e.currentTarget as HTMLElement
          el.style.background = 'rgba(255,255,255,0.15)'
          el.style.borderColor = 'rgba(255,255,255,0.52)'
          el.style.color = '#ffffff'
        }}
        onMouseLeave={e => {
          const el = e.currentTarget as HTMLElement
          el.style.background = 'rgba(255,255,255,0.07)'
          el.style.borderColor = 'rgba(255,255,255,0.22)'
          el.style.color = 'rgba(255,255,255,0.75)'
          el.style.transform = phase === 'ready' ? 'translateY(0) scale(1)' : 'translateY(12px)'
        }}
        onMouseDown={e => {
          (e.currentTarget as HTMLElement).style.transform = 'scale(0.96)'
        }}
        onMouseUp={e => {
          (e.currentTarget as HTMLElement).style.transform = 'scale(1)'
        }}
      >
        Enter
      </button>
    </div>
  )
}
