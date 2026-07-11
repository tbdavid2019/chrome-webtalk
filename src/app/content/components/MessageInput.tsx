import { forwardRef, type ChangeEvent, CompositionEvent, type KeyboardEvent, ClipboardEvent } from 'react'

import { cn } from '@/utils'
import { Textarea } from '@/components/ui/Textarea'
import { ScrollArea } from '@/components/ui/ScrollArea'
import LoadingIcon from '@/assets/images/loading.svg'

export interface MessageInputProps {
  value?: string
  className?: string
  maxLength?: number
  preview?: boolean
  autoFocus?: boolean
  disabled?: boolean
  loading?: boolean
  placeholder?: string
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
      placeholder = 'Type your message here...'
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
            'w-full min-h-[42px] max-h-28 resize-none rounded-xl border border-border bg-muted px-3 py-2.5 text-lg focus-visible:ring-1 focus-visible:ring-primary focus-visible:ring-offset-0 placeholder:text-muted-foreground/50 text-foreground pb-7',
            {
              'border-amber-400/80 focus-visible:ring-amber-500': nearLimit,
              'border-red-400/90 focus-visible:ring-red-500': atLimit,
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
          className={cn('absolute bottom-1.5 right-3 rounded-lg text-sm font-medium tabular-nums', {
            'text-muted-foreground': !nearLimit,
            'text-amber-600 dark:text-amber-400': nearLimit && !atLimit,
            'text-red-600 dark:text-red-400': atLimit,
            'opacity-50': disabled || loading
          })}
        >
          {currentLength}/{maxLength}
        </div>
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center text-slate-800 after:absolute after:inset-0 after:backdrop-blur-xs dark:text-slate-100">
            <LoadingIcon className="relative z-10 size-10"></LoadingIcon>
          </div>
        )}
      </div>
    )
  }
)

MessageInput.displayName = 'MessageInput'

export default MessageInput
