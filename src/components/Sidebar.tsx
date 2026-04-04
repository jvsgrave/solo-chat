import { PlusIcon, MessageSquareIcon, Trash2Icon, PanelLeftIcon, SettingsIcon } from 'lucide-react'
import { useAppStore } from '../store/appStore'

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
  } = useAppStore()

  return (
    <aside style={{
      width: sidebarOpen ? '220px' : '52px',
      minWidth: sidebarOpen ? '220px' : '52px',
      display: 'flex',
      flexDirection: 'column',
      background: 'var(--bg-sidebar)',
      borderRight: '1px solid var(--border)',
      transition: 'width 280ms cubic-bezier(0.4,0,0.2,1), min-width 280ms cubic-bezier(0.4,0,0.2,1)',
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
        <SidebarBtn onClick={toggleSidebar} title={sidebarOpen ? 'Collapse' : 'Expand'}>
          <PanelLeftIcon size={16} />
        </SidebarBtn>

        {/* Brand — only when open */}
        <span style={{
          flex: 1,
          fontSize: '14px',
          fontWeight: 600,
          color: 'var(--text)',
          letterSpacing: '-0.02em',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          opacity: sidebarOpen ? 1 : 0,
          transition: 'opacity 200ms ease',
          paddingLeft: '4px',
        }}>
          Solo
        </span>

        {sidebarOpen && (
          <SidebarBtn onClick={() => createConversation()} title="New chat">
            <PlusIcon size={16} />
          </SidebarBtn>
        )}
      </div>

      {/* ── Conversation list ── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 6px' }}>
        {conversations.length === 0 && sidebarOpen && (
          <p style={{
            color: 'var(--text-3)',
            fontSize: '13px',
            textAlign: 'center',
            padding: '40px 16px',
          }}>
            No chats yet
          </p>
        )}

        {conversations.map(conv => {
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
          onClick={openSettings}
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
        width: '32px', height: '32px', borderRadius: '8px',
        border: 'none', background: 'transparent',
        color: 'var(--text-3)', cursor: 'pointer', flexShrink: 0,
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

function ConvRow({ title, active, showText, onClick, onDelete }: {
  title: string
  active: boolean
  showText: boolean
  onClick: () => void
  onDelete: () => void
}) {
  return (
    <div
      className="group"
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center',
        gap: '8px',
        padding: showText ? '7px 10px' : '7px',
        borderRadius: '8px',
        cursor: 'pointer',
        background: active ? 'var(--accent-soft)' : 'transparent',
        color: active ? 'var(--text)' : 'var(--text-2)',
        marginBottom: '2px',
        transition: 'background 150ms, color 150ms',
        justifyContent: showText ? 'flex-start' : 'center',
      }}
      onMouseEnter={e => {
        if (!active) {
          (e.currentTarget as HTMLElement).style.background = 'var(--bg-surface-2)'
          ;(e.currentTarget as HTMLElement).style.color = 'var(--text)'
        }
      }}
      onMouseLeave={e => {
        if (!active) {
          (e.currentTarget as HTMLElement).style.background = 'transparent'
          ;(e.currentTarget as HTMLElement).style.color = 'var(--text-2)'
        }
      }}
    >
      <MessageSquareIcon size={14} style={{ flexShrink: 0, opacity: 0.65 }} />
      {showText && (
        <>
          <span style={{
            flex: 1, fontSize: '13px', overflow: 'hidden',
            textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {title}
          </span>
          <button
            onClick={e => { e.stopPropagation(); onDelete() }}
            className="opacity-0 group-hover:opacity-100"
            style={{
              display: 'flex', alignItems: 'center',
              padding: '2px', borderRadius: '4px',
              border: 'none', background: 'transparent',
              color: 'var(--text-3)', cursor: 'pointer',
              transition: 'color 150ms',
              flexShrink: 0,
            }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#f87171'}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'var(--text-3)'}
          >
            <Trash2Icon size={12} />
          </button>
        </>
      )}
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
        gap: '8px', width: '100%',
        padding: showText ? '7px 10px' : '7px',
        borderRadius: '8px', border: 'none',
        background: active ? 'var(--accent-soft)' : 'transparent',
        color: active ? 'var(--accent)' : 'var(--text-3)',
        cursor: 'pointer', fontSize: '13px',
        transition: 'background 150ms, color 150ms',
        justifyContent: showText ? 'flex-start' : 'center',
      }}
      onMouseEnter={e => {
        const el = e.currentTarget as HTMLElement
        el.style.background = 'var(--bg-surface-2)'
        el.style.color = 'var(--text)'
      }}
      onMouseLeave={e => {
        const el = e.currentTarget as HTMLElement
        el.style.background = active ? 'var(--accent-soft)' : 'transparent'
        el.style.color = active ? 'var(--accent)' : 'var(--text-3)'
      }}
    >
      {icon}
      {showText && <span>{label}</span>}
    </button>
  )
}
