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
      className="flex h-8 shrink-0 items-center rounded-[4px] border border-border/80 bg-muted/40 p-0.5"
      role="group"
      aria-label={`${chatLabel} / ${aiLabel}`}
    >
      <button
        type="button"
        onClick={active === 'chat' ? undefined : onChat}
        disabled={active === 'chat'}
        aria-pressed={active === 'chat'}
        className={cn(
          'h-full rounded-[3px] px-2.5 text-xs font-semibold leading-none transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
          active === 'chat'
            ? 'cursor-default bg-background text-foreground shadow-sm disabled:opacity-100'
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
          'h-full rounded-[3px] px-2.5 text-xs font-semibold leading-none transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
          active === 'ai'
            ? 'cursor-default bg-background text-foreground shadow-sm disabled:opacity-100'
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
