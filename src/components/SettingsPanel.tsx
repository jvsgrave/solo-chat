import { useEffect, useRef } from 'react'
import { XIcon, SunIcon, MoonIcon } from 'lucide-react'
import { useAppStore } from '../store/appStore'

export function SettingsModal() {
  const { theme, toggleTheme, scale, setScale, closeSettings } = useAppStore()
  const overlayRef = useRef<HTMLDivElement>(null)

  // Close on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeSettings()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [closeSettings])

  const scalePercent = Math.round(scale * 100)

  return (
    <div
      ref={overlayRef}
      onClick={e => { if (e.target === overlayRef.current) closeSettings() }}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0, 0, 0, 0.5)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        animation: 'fadeInOverlay 160ms ease both',
      }}
    >
      <style>{`
        @keyframes fadeInOverlay {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes modalIn {
          from { opacity: 0; transform: translateY(12px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>

      {/* Card */}
      <div style={{
        width: '100%',
        maxWidth: '440px',
        margin: '24px',
        borderRadius: '20px',
        background: 'var(--bg-surface)',
        border: '1px solid var(--border)',
        boxShadow: '0 32px 96px rgba(0,0,0,0.6)',
        overflow: 'hidden',
        animation: 'modalIn 220ms cubic-bezier(0.34,1.56,0.64,1) both',
      }}>

        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '22px 24px 18px',
          borderBottom: '1px solid var(--border)',
        }}>
          <span style={{
            fontSize: '16px',
            fontWeight: 600,
            color: 'var(--text)',
            letterSpacing: '-0.02em',
          }}>
            Settings
          </span>
          <IconBtn onClick={closeSettings} title="Close">
            <XIcon size={15} />
          </IconBtn>
        </div>

        {/* Body */}
        <div style={{ padding: '6px 0' }}>
          <SectionLabel>Appearance</SectionLabel>

          {/* Theme */}
          <Row
            icon={theme === 'dark' ? <MoonIcon size={15} /> : <SunIcon size={15} />}
            label={theme === 'dark' ? 'Dark mode' : 'Light mode'}
          >
            <PillToggle checked={theme === 'dark'} onChange={toggleTheme} />
          </Row>

          {/* Scale */}
          <Row
            icon={
              <span style={{
                fontSize: '12px', fontWeight: 600,
                color: 'var(--accent)', fontVariantNumeric: 'tabular-nums',
                minWidth: '34px', textAlign: 'center',
              }}>
                {scalePercent}%
              </span>
            }
            label="Interface scale"
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-3)' }}>80</span>
              <input
                type="range"
                min={0.8}
                max={1.2}
                step={0.05}
                value={scale}
                onChange={e => setScale(parseFloat(e.target.value))}
                style={{
                  width: '140px',
                  height: '4px',
                  accentColor: 'var(--accent)',
                  cursor: 'pointer',
                }}
              />
              <span style={{ fontSize: '11px', color: 'var(--text-3)' }}>120</span>
            </div>
          </Row>
        </div>

        {/* Footer */}
        <div style={{
          padding: '18px 24px',
          borderTop: '1px solid var(--border)',
          display: 'flex',
          justifyContent: 'flex-end',
        }}>
          <button
            onClick={closeSettings}
            style={{
              padding: '9px 22px',
              borderRadius: '10px',
              border: '1px solid var(--border)',
              background: 'transparent',
              color: 'var(--text-2)',
              fontSize: '14px',
              fontWeight: 500,
              cursor: 'pointer',
              fontFamily: 'inherit',
              transition: 'background 150ms, color 150ms, border-color 150ms',
            }}
            onMouseEnter={e => {
              const el = e.currentTarget as HTMLElement
              el.style.background = 'var(--bg-surface-2)'
              el.style.color = 'var(--text)'
              el.style.borderColor = 'var(--border-hover)'
            }}
            onMouseLeave={e => {
              const el = e.currentTarget as HTMLElement
              el.style.background = 'transparent'
              el.style.color = 'var(--text-2)'
              el.style.borderColor = 'var(--border)'
            }}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  )
}

/* ── Helpers ─────────────────────────────────────────── */

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p style={{
      fontSize: '10.5px',
      fontWeight: 600,
      letterSpacing: '0.08em',
      textTransform: 'uppercase',
      color: 'var(--text-3)',
      padding: '14px 24px 4px',
    }}>
      {children}
    </p>
  )
}

function Row({ icon, label, children }: {
  icon: React.ReactNode
  label: string
  children: React.ReactNode
}) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      padding: '13px 24px',
      gap: '12px',
    }}>
      <span style={{ color: 'var(--text-3)', display: 'flex', alignItems: 'center', flexShrink: 0 }}>
        {icon}
      </span>
      <span style={{ flex: 1, fontSize: '14px', color: 'var(--text)' }}>
        {label}
      </span>
      {children}
    </div>
  )
}

function PillToggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      style={{
        position: 'relative',
        width: '44px',
        height: '25px',
        borderRadius: '99px',
        border: 'none',
        background: checked ? 'var(--accent)' : 'var(--bg-surface-2)',
        cursor: 'pointer',
        flexShrink: 0,
        transition: 'background 250ms ease',
      }}
    >
      <span style={{
        position: 'absolute',
        top: '3.5px',
        left: '3.5px',
        width: '18px',
        height: '18px',
        borderRadius: '50%',
        background: '#fff',
        boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
        transform: checked ? 'translateX(19px)' : 'translateX(0)',
        transition: 'transform 280ms cubic-bezier(0.34,1.56,0.64,1)',
        display: 'block',
      }} />
    </button>
  )
}

function IconBtn({ onClick, title, children }: {
  onClick: () => void
  title: string
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        width: '30px', height: '30px', borderRadius: '8px',
        border: 'none', background: 'transparent',
        color: 'var(--text-3)', cursor: 'pointer',
        transition: 'background 150ms, color 150ms',
      }}
      onMouseEnter={e => {
        const el = e.currentTarget as HTMLElement
        el.style.background = 'var(--bg-surface-2)'
        el.style.color = 'var(--text)'
      }}
      onMouseLeave={e => {
        const el = e.currentTarget as HTMLElement
        el.style.background = 'transparent'
        el.style.color = 'var(--text-3)'
      }}
    >
      {children}
    </button>
  )
}
