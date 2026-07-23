import { type FC } from 'react'
import {
  BotIcon,
  CheckIcon,
  CopyIcon,
  ExternalLinkIcon,
  ForwardIcon,
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
  onForwardAi?: (message: NormalMessage) => void
  onOpenPage?: (message: NormalMessage) => void
  onAvatarClick?: (data: NormalMessage) => void
  className?: string
  currentUserId?: string
  copied?: boolean
  isAi?: boolean
  isForwardedAi?: boolean
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
    ? 'text-muted-foreground hover:bg-primary/10 hover:text-primary'
    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
  const activeActionClass = isOwnMessage
    ? 'bg-primary/10 text-primary hover:bg-primary/15'
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
        'group box-border flex w-full px-3 py-2 transition-colors duration-200',
        isOwnMessage ? 'justify-end' : 'justify-start',
        props.className
      )}
    >
      <div
        className={cn('flex w-full max-w-[92%] items-start gap-2 sm:max-w-[86%]', isOwnMessage && 'flex-row-reverse')}
      >
        <Avatar
          className={cn('mt-5 size-7 shrink-0', props.isAi ? 'cursor-default opacity-90' : 'cursor-pointer')}
          onClick={() => !props.isAi && props.onAvatarClick?.(props.data)}
          title={props.isAi ? text.aiMessageTitle : text.privateChatTitle}
        >
          <AvatarImage src={props.data.userAvatar} className="size-full" alt="avatar" />
          <AvatarFallback>{props.data.username.at(0)}</AvatarFallback>
        </Avatar>

        <div className="min-w-0 max-w-[calc(100%_-_2.25rem)] flex-1">
          <div
            className={cn(
              'mb-1 flex min-w-0 items-center gap-1.5 px-0.5 text-xs leading-4 text-muted-foreground',
              isOwnMessage && 'justify-end'
            )}
          >
            {!isOwnMessage && <span className="truncate font-semibold text-foreground">{props.data.username}</span>}
            <div className="flex min-w-0 items-center gap-1.5">
              {props.isAi && (
                <span className="inline-flex shrink-0 items-center gap-1 rounded-[4px] bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-semibold leading-none text-amber-700 dark:text-amber-300">
                  <BotIcon size={10} aria-hidden="true" />
                  AI
                  {props.aiOwnerUsername && (
                    <span className="max-w-24 truncate text-amber-700/80 dark:text-amber-300/80">
                      @{props.aiOwnerUsername}
                    </span>
                  )}
                </span>
              )}
              {props.data.isPrivate && (
                <span className="inline-flex max-w-40 shrink-0 truncate rounded-[4px] bg-indigo-500/10 px-1.5 py-0.5 text-[10px] font-semibold leading-none text-indigo-600 dark:text-indigo-300">
                  {props.data.userId === props.currentUserId
                    ? text.privateMessageTo.replace('{username}', props.data.toUser?.username ?? '')
                    : text.privateMessageIncoming}
                </span>
              )}
            </div>
            <FormatDate
              className="shrink-0 text-[11px] tabular-nums text-muted-foreground"
              date={props.data.sendTime}
              format="MM/dd HH:mm"
            />
          </div>

          <div
            className={cn(
              'overflow-hidden rounded-xl px-3 py-2.5 text-foreground',
              isOwnMessage
                ? 'rounded-tr-sm bg-primary/10 dark:bg-primary/20'
                : props.isAi
                  ? 'rounded-tl-sm bg-amber-500/10 dark:bg-amber-500/15'
                  : 'rounded-tl-sm bg-muted/70'
            )}
          >
            {!isRecalled && props.data.pageContext?.url && (
              <div className="mb-1.5 flex min-w-0 items-center gap-1.5 text-xs leading-4 text-muted-foreground">
                <Link2Icon size={12} className="shrink-0" aria-hidden="true" />
                <span className="truncate">{props.data.pageContext.title || props.data.pageContext.url}</span>
              </div>
            )}
            {isRecalled ? (
              <div
                role="status"
                data-message-state="recalled"
                aria-label={text.messageRecalled}
                className="inline-flex items-center gap-2 py-0.5 text-sm text-muted-foreground"
              >
                <Undo2Icon size={14} aria-hidden="true" />
                <span className="font-medium italic">{text.messageRecalled}</span>
              </div>
            ) : (
              <Markdown className="prose-sm max-w-none text-[15px] leading-6 [&_p]:my-0">{content}</Markdown>
            )}

            {!isRecalled && props.isAi && props.onForwardAi && (
              <p className="mt-2 text-xs leading-5 text-amber-800 dark:text-amber-300">{text.aiLocalOnlyPrompt}</p>
            )}
          </div>

          {!isRecalled && (
            <div
              className={cn(
                'mt-0.5 flex flex-wrap items-center gap-0.5 px-0.5 opacity-60 transition-opacity duration-200 group-hover:opacity-100 group-focus-within:opacity-100',
                isOwnMessage ? 'justify-end' : 'justify-start'
              )}
            >
              <Button
                type="button"
                variant="ghost"
                size="xs"
                className={cn('h-7 rounded-[4px] px-1.5 text-xs', actionClass, props.like && activeActionClass)}
                onClick={() => props.onLikeChange?.(!props.like)}
                title={text.likeTitle}
                aria-label={text.likeTitle}
              >
                <ThumbsUpIcon size={13} />
                <span className="ml-1 tabular-nums">{props.data.likeUsers.length}</span>
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="xs"
                className={cn('h-7 rounded-[4px] px-1.5 text-xs', actionClass, props.hate && activeActionClass)}
                onClick={() => props.onHateChange?.(!props.hate)}
                title={text.dislikeTitle}
                aria-label={text.dislikeTitle}
              >
                <ThumbsDownIcon size={13} />
                <span className="ml-1 tabular-nums">{props.data.hateUsers.length}</span>
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="xs"
                className={cn('size-7 rounded-[4px] p-0 text-xs', actionClass)}
                onClick={() => props.onCopy?.(props.data)}
                title={props.copied ? text.copiedTitle : text.copyWithUrlTitle}
                aria-label={props.copied ? text.copiedTitle : text.copyWithUrlTitle}
              >
                {props.copied ? <CheckIcon size={13} /> : <CopyIcon size={13} />}
              </Button>
              {props.onRecall && (
                <Button
                  type="button"
                  variant="ghost"
                  size="xs"
                  className={cn('size-7 rounded-[4px] p-0 text-xs', actionClass)}
                  onClick={() => props.onRecall?.(props.data)}
                  title={text.recallTitle}
                  aria-label={text.recallTitle}
                >
                  <Undo2Icon size={13} />
                </Button>
              )}
              {props.data.pageContext?.url && (
                <Button
                  type="button"
                  variant="ghost"
                  size="xs"
                  className={cn('size-7 rounded-[4px] p-0 text-xs', actionClass)}
                  onClick={() => props.onOpenPage?.(props.data)}
                  title={text.openPageTitle}
                  aria-label={text.openPageTitle}
                >
                  <ExternalLinkIcon size={13} />
                </Button>
              )}
              {props.isAi && props.onForwardAi && (
                <Button
                  type="button"
                  variant="ghost"
                  size="xs"
                  className={cn(
                    'size-7 rounded-[4px] p-0 text-xs',
                    actionClass,
                    props.isForwardedAi && 'bg-primary/10 text-primary hover:bg-primary/10'
                  )}
                  onClick={() => props.onForwardAi?.(props.data)}
                  disabled={props.isForwardedAi}
                  title={props.isForwardedAi ? text.aiForwardedToRoomTitle : text.aiForwardToRoomTitle}
                  aria-label={props.isForwardedAi ? text.aiForwardedToRoomTitle : text.aiForwardToRoomTitle}
                >
                  <ForwardIcon size={13} />
                </Button>
              )}
              {props.onToggleBanUser && (
                <Button
                  type="button"
                  variant="ghost"
                  size="xs"
                  className={cn(
                    'size-7 rounded-[4px] p-0 text-xs',
                    actionClass,
                    props.isBanned &&
                      'bg-destructive/10 text-destructive hover:bg-destructive/15 hover:text-destructive'
                  )}
                  onClick={props.onToggleBanUser}
                  title={props.isBanned ? text.unbanTitle : text.banTitle}
                  aria-label={props.isBanned ? text.unbanTitle : text.banTitle}
                >
                  <UserXIcon size={13} />
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
