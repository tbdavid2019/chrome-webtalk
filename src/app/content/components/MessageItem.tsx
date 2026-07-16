import { type FC } from 'react'
import {
  BotIcon,
  CheckIcon,
  CopyIcon,
  ExternalLinkIcon,
  Link2Icon,
  ThumbsDownIcon,
  ThumbsUpIcon,
  Undo2Icon,
  UserXIcon
} from 'lucide-react'
import FormatDate from './FormatDate'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'

import { Markdown } from '@/components/Markdown'
import { type NormalMessage } from '@/domain/MessageList'
import type { AppLocalePreference } from '@/utils'
import { cn, getUiText } from '@/utils'
import { isRecalledMessage } from '@/utils/messageRecall'

export interface MessageItemProps {
  data: NormalMessage
  index?: number
  like: boolean
  hate: boolean
  onLikeChange?: (checked: boolean) => void
  onHateChange?: (checked: boolean) => void
  onRecall?: (message: NormalMessage) => void
  onCopy?: (message: NormalMessage) => void
  onOpenPage?: (message: NormalMessage) => void
  onAvatarClick?: (data: NormalMessage) => void
  className?: string
  currentUserId?: string
  copied?: boolean
  isAi?: boolean
  aiOwnerUsername?: string
  isBanned?: boolean
  onToggleBanUser?: () => void
  locale?: AppLocalePreference
}

const MessageItem: FC<MessageItemProps> = (props) => {
  const text = getUiText(props.locale)
  const isRecalled = isRecalledMessage(props.data)
  const isOwnMessage = !props.isAi && Boolean(props.currentUserId) && props.currentUserId === props.data.userId
  const actionClass = isOwnMessage
    ? 'text-primary-foreground/75 hover:bg-primary-foreground/15 hover:text-primary-foreground'
    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
  const activeActionClass = isOwnMessage
    ? 'bg-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/25'
    : 'bg-primary/10 text-primary hover:bg-primary/15 hover:text-primary'
  let content = props.data.body

  // Check if the field exists, compatible with old data.
  if (props.data.atUsers) {
    const atUserPositions = props.data.atUsers.flatMap((user) =>
      user.positions.map((position) => ({ username: user.username, userId: user.userId, position }))
    )

    // Replace from back to front according to position to avoid affecting previous indices.
    atUserPositions
      .sort((a, b) => b.position[0] - a.position[0])
      .forEach(({ position, username }) => {
        const [start, end] = position
        content = `${content.slice(0, start)} **@${username}** ${content.slice(end + 1)}`
      })
  }

  return (
    <div
      data-index={props.index}
      data-message-owner={isOwnMessage ? 'self' : 'other'}
      className={cn(
        'group box-border flex w-full px-2 py-1.5 transition-colors duration-200 sm:px-3',
        isOwnMessage ? 'justify-end' : 'justify-start',
        props.className
      )}
    >
      <div className={cn('flex w-full max-w-[92%] items-end gap-2 sm:max-w-[84%]', isOwnMessage && 'flex-row-reverse')}>
        <Avatar
          className={cn('size-8', props.isAi ? 'cursor-default opacity-90' : 'cursor-pointer')}
          onClick={() => !props.isAi && props.onAvatarClick?.(props.data)}
          title={props.isAi ? text.aiMessageTitle : text.privateChatTitle}
        >
          <AvatarImage src={props.data.userAvatar} className="size-full" alt="avatar" />
          <AvatarFallback>{props.data.username.at(0)}</AvatarFallback>
        </Avatar>

        <div
          className={cn(
            'min-w-0 max-w-[calc(100%_-_2.5rem)] flex-1 overflow-hidden rounded-2xl border px-3.5 py-2.5 shadow-sm',
            isOwnMessage
              ? 'rounded-br-md border-primary/80 bg-primary text-primary-foreground'
              : props.isAi
                ? 'rounded-bl-md border-amber-200/70 bg-amber-50/70 text-foreground dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-slate-50'
                : 'rounded-bl-md border-border/80 bg-card/80 text-foreground'
          )}
        >
          <div className={cn('flex min-w-0 items-baseline gap-2 leading-tight', isOwnMessage && 'justify-end')}>
            <div className={cn('flex min-w-0 items-center gap-1.5', isOwnMessage && 'flex-row-reverse')}>
              <div className="truncate text-sm font-semibold">{props.data.username}</div>
              {isOwnMessage && (
                <span className="shrink-0 rounded-full bg-primary-foreground/15 px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-primary-foreground/90">
                  你
                </span>
              )}
              {props.isAi && (
                <span className="inline-flex items-center gap-x-1 rounded-full border border-amber-300/70 bg-amber-100/80 px-2 py-0.5 text-[10px] font-semibold text-amber-700 dark:border-amber-800/60 dark:bg-amber-950/40 dark:text-amber-300">
                  <BotIcon size={11} />
                  AI
                  {props.aiOwnerUsername && (
                    <span className="text-[10px] text-amber-700/80 dark:text-amber-300/80">
                      by @{props.aiOwnerUsername}
                    </span>
                  )}
                </span>
              )}
              {props.data.isPrivate && (
                <span className="inline-flex shrink-0 items-center gap-x-0.5 rounded border border-indigo-200/50 bg-indigo-100/80 px-1 py-0.5 text-[9px] font-bold text-indigo-600 dark:border-indigo-900/50 dark:bg-indigo-950/60 dark:text-indigo-400">
                  🔒{' '}
                  {props.data.userId === props.currentUserId
                    ? text.privateMessageTo.replace('{username}', props.data.toUser?.username ?? '')
                    : text.privateMessageIncoming}
                </span>
              )}
            </div>
            <FormatDate
              className={cn(
                'shrink-0 text-[11px]',
                isOwnMessage ? 'text-primary-foreground/70' : 'text-muted-foreground'
              )}
              date={props.data.sendTime}
            />
          </div>

          {!isRecalled && props.data.pageContext?.url && (
            <div
              className={cn(
                'mt-1.5 flex min-w-0 items-center gap-1.5 text-xs',
                isOwnMessage ? 'text-primary-foreground/75' : 'text-muted-foreground'
              )}
            >
              <Link2Icon size={13} className="shrink-0" />
              <span className="shrink-0 font-medium">{text.pageLabel}</span>
              <span className="truncate">{props.data.pageContext.title || props.data.pageContext.url}</span>
            </div>
          )}

          <div className={cn('pt-1.5 text-[15px] leading-6', isOwnMessage ? 'text-primary-foreground' : 'text-foreground')}>
            {isRecalled ? (
              <div
                role="status"
                data-message-state="recalled"
                aria-label={text.messageRecalled}
                className={cn(
                  'inline-flex items-center gap-2 rounded-lg border border-dashed px-3 py-2 text-sm',
                  isOwnMessage
                    ? 'border-primary-foreground/40 bg-primary-foreground/10 text-primary-foreground/80'
                    : 'border-muted-foreground/40 bg-muted/30 text-muted-foreground'
                )}
              >
                <Undo2Icon size={15} aria-hidden="true" />
                <span className="font-medium italic">{text.messageRecalled}</span>
              </div>
            ) : (
              <Markdown className={cn('prose-sm max-w-none', isOwnMessage && 'prose-invert')}>{content}</Markdown>
            )}
          </div>

          {!isRecalled && (
            <div
              className={cn(
                'mt-1 flex flex-wrap items-center gap-0.5 opacity-80 transition-opacity group-hover:opacity-100',
                isOwnMessage ? 'justify-end' : 'justify-start'
              )}
            >
              <Button
                type="button"
                variant="ghost"
                size="xs"
                className={cn('h-7 rounded-full px-2 text-xs', actionClass, props.like && activeActionClass)}
                onClick={() => props.onLikeChange?.(!props.like)}
                title={text.likeTitle}
              >
                <ThumbsUpIcon size={13} />
                <span className="ml-1 tabular-nums">{props.data.likeUsers.length}</span>
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="xs"
                className={cn('h-7 rounded-full px-2 text-xs', actionClass, props.hate && activeActionClass)}
                onClick={() => props.onHateChange?.(!props.hate)}
                title={text.dislikeTitle}
              >
                <ThumbsDownIcon size={13} />
                <span className="ml-1 tabular-nums">{props.data.hateUsers.length}</span>
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="xs"
                className={cn('h-7 rounded-full px-2 text-xs', actionClass)}
                onClick={() => props.onCopy?.(props.data)}
                title={props.copied ? text.copiedTitle : text.copyWithUrlTitle}
              >
                {props.copied ? <CheckIcon size={13} /> : <CopyIcon size={13} />}
              </Button>
              {props.onRecall && (
                <Button
                  type="button"
                  variant="ghost"
                  size="xs"
                  className={cn('h-7 rounded-full px-2.5 text-xs', actionClass)}
                  onClick={() => props.onRecall?.(props.data)}
                  title={text.recallTitle}
                >
                  <Undo2Icon size={13} />
                  <span className="ml-1">{text.recall}</span>
                </Button>
              )}
              {props.data.pageContext?.url && (
                <Button
                  type="button"
                  variant="ghost"
                  size="xs"
                  className={cn('h-7 rounded-full px-2 text-xs', actionClass)}
                  onClick={() => props.onOpenPage?.(props.data)}
                  title={text.openPageTitle}
                >
                  <ExternalLinkIcon size={13} />
                </Button>
              )}
              {props.onToggleBanUser && (
                <Button
                  type="button"
                  variant="ghost"
                  size="xs"
                  className={cn(
                    'h-7 rounded-full px-2.5 text-xs',
                    actionClass,
                    props.isBanned &&
                      'bg-destructive/10 text-destructive hover:bg-destructive/15 hover:text-destructive'
                  )}
                  onClick={props.onToggleBanUser}
                  title={props.isBanned ? text.unbanTitle : text.banTitle}
                >
                  <UserXIcon size={13} />
                  <span className="ml-1">{props.isBanned ? text.unban : text.ban}</span>
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

MessageItem.displayName = 'MessageItem'

export default MessageItem
