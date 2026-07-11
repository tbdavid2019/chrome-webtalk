import { MessageCircleMoreIcon, SparklesIcon } from 'lucide-react'
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
    <div className="shrink-0 rounded-full border border-border bg-muted/40 p-0.5 shadow-xs flex items-center gap-0.5">
      <button
        type="button"
        onClick={active === 'chat' ? undefined : onChat}
        disabled={active === 'chat'}
        className={cn(
          'flex size-8 items-center justify-center rounded-full transition-all shrink-0',
          active === 'chat'
            ? 'cursor-default bg-primary text-primary-foreground shadow-sm'
            : 'text-muted-foreground hover:text-foreground'
        )}
        title={chatLabel}
      >
        <MessageCircleMoreIcon size={15} />
      </button>
      <button
        type="button"
        onClick={active === 'ai' ? undefined : onAi}
        disabled={active === 'ai'}
        className={cn(
          'flex size-8 items-center justify-center rounded-full transition-all shrink-0',
          active === 'ai'
            ? 'cursor-default bg-primary text-primary-foreground shadow-sm'
            : 'text-muted-foreground hover:text-foreground'
        )}
        title={aiLabel}
      >
        <SparklesIcon size={15} />
      </button>
    </div>
  )
}

PanelModeSwitch.displayName = 'PanelModeSwitch'

export default PanelModeSwitch
