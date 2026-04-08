import { useState } from 'react'
import { PlusIcon, MessageSquareIcon, Trash2Icon, PanelLeftIcon, SettingsIcon } from 'lucide-react'
import { useAppStore } from '../store/appStore'
import { playModeSound, playSidebarSound, playSettingsSound, playNewChatSound } from '../utils/sounds'

export function Sidebar() {
  const {
    conversations,
    currentConversationId,
    createConversation,
    setCurrentConversation,
    deleteConversation,
    sidebarOpen,
    toggleSidebar,
    openSettings,
    settingsOpen,
    mode,
    setMode,
    setModeTransitioning,
  } = useAppStore()

  // Track displayed logo text separately so animation can lag behind the store
  const [displayMode, setDisplayMode] = useState<'solo' | 'shh' | 'script'>(mode)
  const [logoPhase, setLogoPhase] = useState<'idle' | 'out' | 'in'>('idle')

  const handleLogoClick = () => {
    if (!sidebarOpen || logoPhase !== 'idle') return
    const next: 'solo' | 'shh' | 'script' =
      mode === 'solo' ? 'shh' : mode === 'shh' ? 'script' : 'solo'
    playModeSound(next)
    setLogoPhase('out')
    setModeTransitioning(true)
    setTimeout(() => {
      setMode(next)
      setDisplayMode(next)
      setLogoPhase('in')
      setModeTransitioning(false)
      setTimeout(() => setLogoPhase('idle'), 1000)
    }, 500)
  }

  const handleToggleSidebar = () => {
    playSidebarSound(!sidebarOpen)
    toggleSidebar()
  }

  const handleOpenSettings = () => {
    playSettingsSound(true)
    openSettings()
  }

  const handleNewChat = () => {
    playNewChatSound(mode)
    createConversation()
  }

  // Only show conversations for the current mode
  const modeConversations = conversations.filter(c => (c.mode ?? 'solo') === mode)

  const logoClass =
    logoPhase === 'out' ? 'logo-switching-out' :
    logoPhase === 'in'  ? 'logo-switching-in'  : ''

  return (
    <aside style={{
      width: sidebarOpen ? '240px' : '54px',
      minWidth: sidebarOpen ? '240px' : '54px',
      display: 'flex',
      flexDirection: 'column',
      background: 'var(--glass-bg)',
      backdropFilter: 'blur(24px) saturate(160%)',
      WebkitBackdropFilter: 'blur(24px) saturate(160%)',
      borderRight: '1px solid var(--glass-border)',
      boxShadow: 'var(--glass-glow), var(--shadow-sidebar)',
      transition: 'width 600ms cubic-bezier(0.16, 1, 0.3, 1), min-width 600ms cubic-bezier(0.16, 1, 0.3, 1)',
      overflow: 'hidden',
      flexShrink: 0,
      position: 'relative',
    }}>

      {/* ── Header row ── */}
      <div style={{
        height: '52px',
        display: 'flex',
        alignItems: 'center',
        padding: '0 10px',
        gap: '4px',
        borderBottom: '1px solid var(--border)',
        flexShrink: 0,
      }}>
        <SidebarBtn onClick={handleToggleSidebar} title={sidebarOpen ? 'Collapse' : 'Expand'}>
          <PanelLeftIcon
            size={16}
            style={{
              transform: sidebarOpen ? 'rotate(0deg)' : 'rotate(180deg)',
              transition: 'transform 600ms cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          />
        </SidebarBtn>

        {/* Brand — only when open. Click to toggle mode. */}
        <span
          className={logoClass}
          onClick={handleLogoClick}
          title={
            mode === 'solo' ? 'Switch to shh mode' :
            mode === 'shh'  ? 'Switch to Script mode' :
            'Switch to Solo mode'
          }
          style={{
            flex: 1,
            fontFamily: 'var(--font-logo)',
            fontSize: '22px',
            fontWeight: 400,
            color: mode === 'shh' ? 'var(--accent)' : mode === 'script' ? 'var(--script-accent)' : 'var(--text)',
            letterSpacing: '0.02em',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            opacity: sidebarOpen ? 1 : 0,
            transition: 'opacity 500ms cubic-bezier(0.25, 0.46, 0.45, 0.94), color 700ms cubic-bezier(0.25, 0.46, 0.45, 0.94), transform 350ms cubic-bezier(0.16, 1, 0.3, 1)',
            paddingLeft: '4px',
            lineHeight: 1.6,
            cursor: sidebarOpen ? 'pointer' : 'default',
            userSelect: 'none',
          }}
          onMouseEnter={e => {
            if (sidebarOpen) (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px) scale(1.02)'
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLElement).style.transform = 'translateY(0) scale(1)'
          }}
        >
          {displayMode === 'script' ? 'Script' : displayMode === 'shh' ? 'shh' : 'Solo'}
        </span>

        <div style={{
          maxWidth: sidebarOpen ? '40px' : '0px',
          overflow: 'hidden',
          opacity: sidebarOpen ? 1 : 0,
          transition: 'max-width 600ms cubic-bezier(0.16, 1, 0.3, 1), opacity 500ms cubic-bezier(0.25, 0.46, 0.45, 0.94)',
          flexShrink: 0,
        }}>
          <SidebarBtn onClick={handleNewChat} title="New chat">
            <PlusIcon size={16} />
          </SidebarBtn>
        </div>
      </div>

      {/* ── Conversation list (hidden in script mode) ── */}
      {mode !== 'script' && (
        <div style={{ flex: 1, overflowY: 'auto', padding: '8px 6px' }}>
          {modeConversations.length === 0 && sidebarOpen && (
            <p style={{
              color: 'var(--text-3)',
              fontSize: '13px',
              textAlign: 'center',
              padding: '40px 16px',
            }}>
              No chats yet
            </p>
          )}

          {modeConversations.map(conv => {
            const active = conv.id === currentConversationId
            return (
              <ConvRow
                key={conv.id}
                title={conv.title}
                active={active}
                showText={sidebarOpen}
                onClick={() => setCurrentConversation(conv.id)}
                onDelete={() => deleteConversation(conv.id)}
              />
            )
          })}
        </div>
      )}

      {/* ── Script mode: sidebar shows nothing (files are in the main panel) ── */}
      {mode === 'script' && (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {sidebarOpen && (
            <p style={{
              color: 'var(--text-3)',
              fontSize: '11px',
              textAlign: 'center',
              padding: '16px',
              fontFamily: 'var(--font-mono, monospace)',
              lineHeight: 1.6,
            }}>
              Files &amp; sessions<br />in the main panel
            </p>
          )}
        </div>
      )}

      {/* ── Footer / Settings ── */}
      <div style={{
        borderTop: '1px solid var(--border)',
        padding: '8px 6px',
        position: 'relative',
      }}>
        <SidebarRow
          icon={<SettingsIcon size={15} />}
          label="Settings"
          showText={sidebarOpen}
          active={settingsOpen}
          onClick={handleOpenSettings}
          title="Settings"
        />
      </div>
    </aside>
  )
}

/* ── Sub-components ──────────────────────────────────────────── */

function SidebarBtn({ onClick, title, children }: {
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
        width: '34px', height: '34px', borderRadius: '11px',
        border: 'none', background: 'transparent',
        color: 'var(--text-3)', cursor: 'pointer', flexShrink: 0,
        transition: 'background 280ms cubic-bezier(0.25, 0.46, 0.45, 0.94), color 280ms cubic-bezier(0.25, 0.46, 0.45, 0.94), transform 350ms cubic-bezier(0.16, 1, 0.3, 1)',
      }}
      onMouseEnter={e => {
        const el = e.currentTarget as HTMLElement
        el.style.background = 'var(--glass-bg-hover)'
        el.style.color = 'var(--text)'
        el.style.transform = 'scale(1.08)'
      }}
      onMouseLeave={e => {
        const el = e.currentTarget as HTMLElement
        el.style.background = 'transparent'
        el.style.color = 'var(--text-3)'
        el.style.transform = 'scale(1)'
      }}
    >
      {children}
    </button>
  )
}

function ConvRow({ title, active, showText, onClick, onDelete }: {
  title: string
  active: boolean
  showText: boolean
  onClick: () => void
  onDelete: () => void
}) {
  const [hovered, setHovered] = useState(false)

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex', alignItems: 'center',
        gap: '8px',
        padding: '7px 10px',
        borderRadius: '14px',
        cursor: 'pointer',
        background: active ? 'var(--accent-soft)' : hovered ? 'var(--glass-bg-hover)' : 'transparent',
        borderLeft: active ? '2px solid var(--accent)' : '2px solid transparent',
        backdropFilter: active ? 'blur(8px)' : 'none',
        color: active ? 'var(--text)' : hovered ? 'var(--text)' : 'var(--text-2)',
        marginBottom: '2px',
        transition: 'background 280ms cubic-bezier(0.25, 0.46, 0.45, 0.94), color 280ms cubic-bezier(0.25, 0.46, 0.45, 0.94), border-color 280ms cubic-bezier(0.25, 0.46, 0.45, 0.94), transform 450ms cubic-bezier(0.16, 1, 0.3, 1)',
        transform: hovered && !active ? 'translateX(3px)' : 'translateX(0)',
        overflow: 'hidden',
      }}
    >
      <MessageSquareIcon size={14} style={{ flexShrink: 0, opacity: 0.65 }} />
      <span style={{
        flex: 1, fontSize: '13px',
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        maxWidth: showText ? '200px' : '0px',
        opacity: showText ? 1 : 0,
        transition: 'max-width 600ms cubic-bezier(0.16, 1, 0.3, 1), opacity 500ms cubic-bezier(0.25, 0.46, 0.45, 0.94)',
      }}>
        {title}
      </span>
      <button
        onClick={e => { e.stopPropagation(); onDelete() }}
        style={{
          display: 'flex', alignItems: 'center',
          padding: '2px', borderRadius: '4px',
          border: 'none', background: 'transparent',
          color: 'var(--text-3)', cursor: 'pointer',
          transition: 'color 280ms cubic-bezier(0.25, 0.46, 0.45, 0.94), max-width 600ms cubic-bezier(0.16, 1, 0.3, 1), opacity 400ms cubic-bezier(0.25, 0.46, 0.45, 0.94), transform 350ms cubic-bezier(0.16, 1, 0.3, 1)',
          flexShrink: 0,
          maxWidth: showText ? '20px' : '0px',
          overflow: 'hidden',
          opacity: hovered && showText ? 1 : 0,
        }}
        onMouseEnter={e => {
          const el = e.currentTarget as HTMLElement
          el.style.color = '#f87171'
          el.style.transform = 'scale(1.12) translateY(-1px)'
        }}
        onMouseLeave={e => {
          const el = e.currentTarget as HTMLElement
          el.style.color = 'var(--text-3)'
          el.style.transform = 'scale(1) translateY(0)'
        }}
      >
        <Trash2Icon size={12} />
      </button>
    </div>
  )
}

function SidebarRow({ icon, label, showText, active, onClick, title }: {
  icon: React.ReactNode
  label: string
  showText: boolean
  active: boolean
  onClick: () => void
  title: string
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        display: 'flex', alignItems: 'center',
        gap: showText ? '8px' : '0px', width: '100%',
        padding: '7px 10px',
        borderRadius: '14px', border: 'none',
        background: active ? 'var(--accent-soft)' : 'transparent',
        color: active ? 'var(--accent)' : 'var(--text-3)',
        cursor: 'pointer', fontSize: '13px',
        transition: 'background 280ms cubic-bezier(0.25, 0.46, 0.45, 0.94), color 280ms cubic-bezier(0.25, 0.46, 0.45, 0.94), gap 600ms cubic-bezier(0.16, 1, 0.3, 1)',
        justifyContent: 'flex-start',
      }}
      onMouseEnter={e => {
        const el = e.currentTarget as HTMLElement
        el.style.background = 'var(--glass-bg-hover)'
        el.style.color = 'var(--text)'
      }}
      onMouseLeave={e => {
        const el = e.currentTarget as HTMLElement
        el.style.background = active ? 'var(--accent-soft)' : 'transparent'
        el.style.color = active ? 'var(--accent)' : 'var(--text-3)'
      }}
    >
      <span style={{ flexShrink: 0, display: 'flex', alignItems: 'center' }}>{icon}</span>
      <span style={{
        overflow: 'hidden',
        maxWidth: showText ? '160px' : '0px',
        opacity: showText ? 1 : 0,
        whiteSpace: 'nowrap',
        transition: 'max-width 600ms cubic-bezier(0.16, 1, 0.3, 1), opacity 500ms cubic-bezier(0.25, 0.46, 0.45, 0.94)',
      }}>
        {label}
      </span>
    </button>
  )
}
