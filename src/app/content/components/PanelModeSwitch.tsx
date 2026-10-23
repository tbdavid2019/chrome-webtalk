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
      className="flex h-8.5 shrink-0 items-center rounded-full border-[1.5px] border-[#17324d] bg-[#fff0cc] p-0.5 dark:border-[#2b4a6b] dark:bg-[#0c1927]"
      role="group"
      aria-label={`${chatLabel} / ${aiLabel}`}
    >
      <button
        type="button"
        onClick={active === 'chat' ? undefined : onChat}
        disabled={active === 'chat'}
        aria-pressed={active === 'chat'}
        className={cn(
          'h-full rounded-full transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
          active === 'chat'
            ? 'cursor-default rounded-full bg-[#17324d] px-3 font-sans text-xs font-bold text-[#fff9e8] shadow-2xs disabled:opacity-100 dark:bg-[#ffb010] dark:text-[#0b1826]'
            : 'rounded-full px-3 font-sans text-xs font-bold text-[#2b251a]/75 hover:text-[#2b251a] dark:text-[#cbd5e1] dark:hover:text-[#fff9e8]'
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
          'h-full rounded-full transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
          active === 'ai'
            ? 'cursor-default rounded-full bg-[#17324d] px-3 font-sans text-xs font-bold text-[#fff9e8] shadow-2xs disabled:opacity-100 dark:bg-[#ffb010] dark:text-[#0b1826]'
            : 'rounded-full px-3 font-sans text-xs font-bold text-[#2b251a]/75 hover:text-[#2b251a] dark:text-[#cbd5e1] dark:hover:text-[#fff9e8]'
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
