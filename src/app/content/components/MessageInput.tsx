import { forwardRef, type ChangeEvent, CompositionEvent, type KeyboardEvent, ClipboardEvent } from 'react'
import { Loader2 } from 'lucide-react'

import { cn } from '@/utils'
import { Textarea } from '@/components/ui/Textarea'
import { ScrollArea } from '@/components/ui/ScrollArea'

export interface MessageInputProps {
  value?: string
  className?: string
  maxLength?: number
  preview?: boolean
  autoFocus?: boolean
  disabled?: boolean
  loading?: boolean
  placeholder?: string
  variant?: 'embedded' | 'standalone'
  onChange?: (e: ChangeEvent<HTMLTextAreaElement>) => void
  onPaste?: (e: ClipboardEvent<HTMLTextAreaElement>) => void
  onKeyDown?: (e: KeyboardEvent<HTMLTextAreaElement>) => void
  onCompositionStart?: (e: CompositionEvent<HTMLTextAreaElement>) => void
  onCompositionEnd?: (e: CompositionEvent<HTMLTextAreaElement>) => void
}

/**
 *  Need @ syntax highlighting? Waiting for textarea to support Highlight API
 *
 * @see https://github.com/w3c/csswg-drafts/issues/4603
 */
const MessageInput = forwardRef<HTMLTextAreaElement, MessageInputProps>(
  (
    {
      value = '',
      className,
      maxLength = 500,
      onChange,
      onPaste,
      onKeyDown,
      onCompositionStart,
      onCompositionEnd,
      autoFocus,
      disabled,
      loading,
      placeholder = 'Type your message here...',
      variant = 'embedded'
    },
    ref
  ) => {
    const currentLength = value?.length ?? 0
    const nearLimit = currentLength >= Math.max(Math.floor(maxLength * 0.9), maxLength - 50)
    const atLimit = currentLength >= maxLength

    return (
      <div className={cn('relative', className)}>
        <Textarea
          ref={ref}
          onPaste={onPaste}
          onKeyDown={onKeyDown}
          autoFocus={autoFocus}
          maxLength={maxLength}
          className={cn(
            'w-full min-h-[44px] max-h-28 resize-none text-[14px] leading-relaxed text-foreground placeholder:text-muted-foreground/70',
            variant === 'embedded'
              ? 'border-0 bg-transparent px-2.5 pt-1.5 pb-6 focus:outline-none focus-visible:ring-0 shadow-none'
              : 'rounded-xl border border-border/60 bg-muted/30 px-3 py-2 pb-6 focus-visible:ring-1 focus-visible:ring-primary/40 focus-visible:ring-offset-0',
            {
              'placeholder:text-amber-500/70': nearLimit,
              'placeholder:text-red-500/70': atLimit,
              'disabled:opacity-100': loading
            }
          )}
          rows={2}
          value={value}
          spellCheck={false}
          onCompositionStart={onCompositionStart}
          onCompositionEnd={onCompositionEnd}
          placeholder={placeholder}
          onChange={onChange}
          disabled={disabled || loading}
        />
        <div
          className={cn('absolute bottom-1 right-2.5 text-[10.5px] font-medium leading-none tabular-nums', {
            'text-muted-foreground/70': !nearLimit,
            'text-amber-600 dark:text-amber-400 font-semibold': nearLimit && !atLimit,
            'text-red-600 dark:text-red-400 font-semibold': atLimit,
            'opacity-50': disabled || loading
          })}
        >
          {currentLength}/{maxLength}
        </div>
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center text-primary rounded-xl after:absolute after:inset-0 after:backdrop-blur-xs">
            <Loader2 className="relative z-10 size-7 animate-spin text-primary" />
          </div>
        )}
      </div>
    )
  }
)

MessageInput.displayName = 'MessageInput'

export default MessageInput
