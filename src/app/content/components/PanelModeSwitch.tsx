import { cn } from '@/utils'

export interface PanelModeSwitchProps {
  active: 'chat' | 'ai'
  onChat?: () => void
  onAi?: () => void
  chatLabel: string
  aiLabel: string
}

const PanelModeSwitch = ({ active, onChat, onAi, chatLabel, aiLabel }: PanelModeSwitchProps) => {
  return (
    <div
      className="flex h-8 shrink-0 items-center rounded-lg border border-border/70 bg-muted/40 p-0.5 shadow-2xs"
      role="group"
      aria-label={`${chatLabel} / ${aiLabel}`}
    >
      <button
        type="button"
        onClick={active === 'chat' ? undefined : onChat}
        disabled={active === 'chat'}
        aria-pressed={active === 'chat'}
        className={cn(
          'h-full rounded-md px-2.5 text-xs font-semibold leading-none transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
          active === 'chat'
            ? 'cursor-default bg-background text-foreground shadow-xs disabled:opacity-100'
            : 'text-muted-foreground hover:text-foreground'
        )}
        title={chatLabel}
      >
        {chatLabel}
      </button>
      <button
        type="button"
        onClick={active === 'ai' ? undefined : onAi}
        disabled={active === 'ai'}
        aria-pressed={active === 'ai'}
        className={cn(
          'h-full rounded-md px-2.5 text-xs font-semibold leading-none transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
          active === 'ai'
            ? 'cursor-default bg-background text-foreground shadow-xs disabled:opacity-100'
            : 'text-muted-foreground hover:text-foreground'
        )}
        title={aiLabel}
      >
        {aiLabel}
      </button>
    </div>
  )
}

PanelModeSwitch.displayName = 'PanelModeSwitch'

export default PanelModeSwitch
