import { useState, useRef, useCallback } from 'react'
import { SendHorizonal, SquareIcon, FolderOpenIcon } from 'lucide-react'
import { useAppStore } from '../../store/appStore'
import { ScriptCommandPalette } from './ScriptCommandPalette'
import { ScriptFileMention } from './ScriptFileMention'
import { ScriptModelDialog } from './ScriptModelDialog'

declare global {
  interface Window {
    electronAPI?: {
      selectFolder: () => Promise<string | null>
      restartOpenCode: (dir: string) => Promise<boolean>
      onOpenCodeStatus?: (cb: (status: string) => void) => () => void
    }
  }
}

const PERMISSION_MODES = ['default', 'accept-edits', 'plan'] as const
const PERMISSION_COLORS: Record<string, string> = {
  'default':      '#9999a2',
  'accept-edits': '#fbbf24',
  'plan':         '#60a5fa',
}

interface Props {
  isStreaming: boolean
  isConnected: boolean
  onSend: (text: string) => void
  onInterrupt: () => void
  onSlashCommand: (cmd: string) => void
}

export function ScriptInput({ isStreaming, isConnected, onSend, onInterrupt, onSlashCommand }: Props) {
  const {
    scriptModel,
    scriptPermissionMode,
    setScriptPermissionMode,
    scriptTokens,
    scriptWorkingDir,
    setScriptWorkingDir,
    toggleShowThinking,
  } = useAppStore()

  const [value, setValue] = useState('')
  const [showCmdPalette, setShowCmdPalette] = useState(false)
  const [showFileMention, setShowFileMention] = useState(false)
  const [showModelDialog, setShowModelDialog] = useState(false)
  const [cmdQuery, setCmdQuery] = useState('')
  const [mentionQuery, setMentionQuery] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const modelLabel = scriptModel.split('/').pop() ?? scriptModel
  const tokenPercent = scriptTokens.limit > 0 ? (scriptTokens.used / scriptTokens.limit) * 100 : 0

  // Short display for working dir
  const shortDir = scriptWorkingDir
    ? scriptWorkingDir.replace(/\\/g, '/').split('/').pop() ?? scriptWorkingDir
    : null

  const cyclePermissionMode = () => {
    const idx = PERMISSION_MODES.indexOf(scriptPermissionMode as any)
    setScriptPermissionMode(PERMISSION_MODES[(idx + 1) % PERMISSION_MODES.length])
  }

  const handleSelectFolder = async () => {
    if (window.electronAPI?.selectFolder) {
      const dir = await window.electronAPI.selectFolder()
      if (dir) {
        setScriptWorkingDir(dir)
        // Restart OpenCode in the new directory
        window.electronAPI.restartOpenCode?.(dir)
      }
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const v = e.target.value
    setValue(v)

    const lastSlash = v.lastIndexOf('/')
    const lastAt = v.lastIndexOf('@')

    if (lastSlash >= 0) {
      const after = v.slice(lastSlash)
      if (/^\/\w*$/.test(after) || after === '/') {
        setShowCmdPalette(true)
        setShowFileMention(false)
        setCmdQuery(after)
        return
      }
    }

    if (lastAt >= 0) {
      const after = v.slice(lastAt)
      if (/^@[\w./]*$/.test(after) || after === '@') {
        setShowFileMention(true)
        setShowCmdPalette(false)
        setMentionQuery(after)
        return
      }
    }

    setShowCmdPalette(false)
    setShowFileMention(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      if (showCmdPalette || showFileMention) return
      e.preventDefault()
      submit()
    }
  }

  const submit = useCallback(() => {
    const text = value.trim()
    if (!text || !isConnected || isStreaming) return
    setValue('')
    setShowCmdPalette(false)
    setShowFileMention(false)
    onSend(text)
  }, [value, isConnected, isStreaming, onSend])

  const handleCommandSelect = (cmd: string) => {
    setShowCmdPalette(false)
    setValue('')
    if (cmd === '/thinking') { toggleShowThinking(); return }
    onSlashCommand(cmd)
  }

  const handleFileMentionSelect = (path: string) => {
    setShowFileMention(false)
    const lastAt = value.lastIndexOf('@')
    setValue(value.slice(0, lastAt) + `@${path} `)
    textareaRef.current?.focus()
  }

  const canSend = value.trim() && isConnected && !isStreaming

  return (
    <div style={{
      borderTop: '1px solid var(--border)',
      background: '#242426',
      padding: '10px 14px 12px',
      flexShrink: 0,
    }}>
      {/* Toolbar row */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        marginBottom: '8px',
      }}>
        {/* Folder selector */}
        <button
          onClick={handleSelectFolder}
          title={scriptWorkingDir || 'Select project folder'}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            fontSize: '11px',
            padding: '3px 8px',
            borderRadius: '5px',
            border: '1px solid var(--border)',
            background: 'transparent',
            color: shortDir ? 'var(--text-2)' : 'var(--text-3)',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            maxWidth: '160px',
            overflow: 'hidden',
            transition: 'color 150ms, border-color 150ms',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.color = 'var(--text)'
            e.currentTarget.style.borderColor = 'var(--border-hover)'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.color = shortDir ? 'var(--text-2)' : 'var(--text-3)'
            e.currentTarget.style.borderColor = 'var(--border)'
          }}
        >
          <FolderOpenIcon size={11} style={{ flexShrink: 0 }} />
          <span style={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            fontFamily: 'var(--font-mono, monospace)',
            fontSize: '11px',
          }}>
            {shortDir ?? 'Open folder…'}
          </span>
        </button>

        <div style={{ width: '1px', height: '14px', background: 'var(--border)' }} />

        {/* Permission mode */}
        <button
          onClick={cyclePermissionMode}
          title={`Permission: ${scriptPermissionMode}`}
          style={{
            fontSize: '10px',
            fontWeight: 500,
            padding: '3px 8px',
            borderRadius: '4px',
            border: `1px solid ${PERMISSION_COLORS[scriptPermissionMode]}28`,
            background: 'transparent',
            color: PERMISSION_COLORS[scriptPermissionMode],
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            transition: 'border-color 150ms, background 150ms',
          }}
          onMouseEnter={e => (e.currentTarget.style.background = `${PERMISSION_COLORS[scriptPermissionMode]}10`)}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
        >
          {scriptPermissionMode} ▾
        </button>

        {/* Model selector */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowModelDialog(s => !s)}
            title="Switch model"
            style={{
              fontSize: '10px',
              padding: '3px 8px',
              borderRadius: '4px',
              border: '1px solid var(--border)',
              background: 'transparent',
              color: 'var(--text-3)',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'color 150ms, border-color 150ms',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.color = 'var(--text-2)'
              e.currentTarget.style.borderColor = 'var(--border-hover)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.color = 'var(--text-3)'
              e.currentTarget.style.borderColor = 'var(--border)'
            }}
          >
            {modelLabel} ▾
          </button>
          {showModelDialog && (
            <ScriptModelDialog onClose={() => setShowModelDialog(false)} />
          )}
        </div>
      </div>

      {/* Input area */}
      <div style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'flex-end',
        gap: '8px',
        border: '1px solid var(--border)',
        borderRadius: '10px',
        background: '#1e1e20',
        padding: '6px 6px 6px 12px',
        transition: 'border-color 200ms',
      }}
        onFocusCapture={e => {
          const el = e.currentTarget
          el.style.borderColor = 'rgba(255,255,255,0.14)'
        }}
        onBlurCapture={e => {
          const el = e.currentTarget
          el.style.borderColor = 'var(--border)'
        }}
      >
        {showCmdPalette && (
          <ScriptCommandPalette
            query={cmdQuery}
            onSelect={handleCommandSelect}
            onClose={() => setShowCmdPalette(false)}
          />
        )}
        {showFileMention && (
          <ScriptFileMention
            query={mentionQuery}
            onSelect={handleFileMentionSelect}
            onClose={() => setShowFileMention(false)}
          />
        )}

        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={isConnected ? 'Message… (@file  /command)' : 'Connecting to OpenCode…'}
          disabled={!isConnected}
          style={{
            flex: 1,
            background: 'transparent',
            border: 'none',
            outline: 'none',
            color: 'var(--text)',
            fontSize: '13px',
            fontFamily: 'var(--font-ui, sans-serif)',
            lineHeight: 1.6,
            padding: '2px 0',
            resize: 'none',
            minHeight: '32px',
            maxHeight: '160px',
            opacity: isConnected ? 1 : 0.5,
            letterSpacing: '-0.003em',
          }}
        />

        {isStreaming ? (
          <button
            onClick={onInterrupt}
            title="Stop generation"
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: '30px', height: '30px', borderRadius: '7px',
              border: 'none',
              background: 'rgba(248,113,113,0.12)',
              color: '#f87171',
              cursor: 'pointer',
              flexShrink: 0,
              transition: 'background 150ms',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(248,113,113,0.20)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'rgba(248,113,113,0.12)')}
          >
            <SquareIcon size={11} />
          </button>
        ) : (
          <button
            onClick={submit}
            disabled={!canSend}
            title="Send (Enter)"
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: '30px', height: '30px', borderRadius: '7px',
              border: 'none',
              background: canSend ? 'var(--accent)' : 'rgba(255,255,255,0.06)',
              color: canSend ? '#fff' : 'var(--text-3)',
              cursor: canSend ? 'pointer' : 'default',
              flexShrink: 0,
              transition: 'background 150ms',
            }}
          >
            <SendHorizonal size={13} />
          </button>
        )}
      </div>

      {/* Token bar */}
      {scriptTokens.used > 0 && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginTop: '6px',
          padding: '0 2px',
        }}>
          <div style={{
            flex: 1, height: '2px',
            background: 'rgba(255,255,255,0.05)',
            borderRadius: '1px', overflow: 'hidden',
          }}>
            <div style={{
              height: '100%',
              width: `${Math.min(tokenPercent, 100)}%`,
              background: tokenPercent > 80 ? '#f87171' : 'var(--accent)',
              borderRadius: '1px',
              transition: 'width 600ms cubic-bezier(0.16,1,0.3,1)',
            }} />
          </div>
          <span style={{
            fontSize: '10px',
            color: tokenPercent > 80 ? '#f87171' : 'var(--text-3)',
            fontFamily: 'var(--font-mono, monospace)',
            whiteSpace: 'nowrap',
            flexShrink: 0,
          }}>
            {(scriptTokens.used / 1000).toFixed(1)}k / {(scriptTokens.limit / 1000).toFixed(0)}k
          </span>
        </div>
      )}
    </div>
  )
}
