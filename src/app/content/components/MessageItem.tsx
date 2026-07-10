import { type FC } from 'react'
import { BotIcon, CheckIcon, CopyIcon, ThumbsDownIcon, ThumbsUpIcon, UserXIcon } from 'lucide-react'
import FormatDate from './FormatDate'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'

import { Markdown } from '@/components/Markdown'
import { type NormalMessage } from '@/domain/MessageList'
import type { AppLocalePreference } from '@/utils'
import { cn, getUiText } from '@/utils'

export interface MessageItemProps {
  data: NormalMessage
  index?: number
  like: boolean
  hate: boolean
  onLikeChange?: (checked: boolean) => void
  onHateChange?: (checked: boolean) => void
  onCopy?: (message: NormalMessage) => void
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
  let content = props.data.body

  // Check if the field exists, compatible with old data
  if (props.data.atUsers) {
    const atUserPositions = props.data.atUsers.flatMap((user) =>
      user.positions.map((position) => ({ username: user.username, userId: user.userId, position }))
    )

    // Replace from back to front according to position to avoid affecting previous indices
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
      className={cn(
        'group box-border grid grid-cols-[auto_1fr] gap-x-2 px-4 first:pt-4 last:pb-4 dark:text-slate-50 transition-colors duration-200',
        props.data.isPrivate && 'bg-indigo-500/5 dark:bg-indigo-500/10 border-l-2 border-l-indigo-500/70',
        props.isAi &&
          'rounded-xl border border-amber-200/70 bg-amber-50/45 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.45)] dark:border-amber-900/40 dark:bg-amber-950/10',
        props.className
      )}
    >
      <Avatar
        className={cn(props.isAi ? 'cursor-default opacity-90' : 'cursor-pointer')}
        onClick={() => !props.isAi && props.onAvatarClick?.(props.data)}
        title={props.isAi ? text.aiMessageTitle : text.privateChatTitle}
      >
        <AvatarImage src={props.data.userAvatar} className="size-full" alt="avatar" />
        <AvatarFallback>{props.data.username.at(0)}</AvatarFallback>
      </Avatar>
      <div className="overflow-hidden pr-3">
        <div className="grid grid-cols-[1fr_auto] items-center gap-x-2 leading-none mb-1">
          <div className="flex items-center gap-x-1.5 truncate">
            <div className="truncate text-sm font-semibold text-foreground/80">{props.data.username}</div>
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
              <span className="inline-flex items-center gap-x-0.5 rounded bg-indigo-100/80 dark:bg-indigo-950/60 border border-indigo-200/50 dark:border-indigo-900/50 px-1 py-0.5 text-[9px] font-bold text-indigo-600 dark:text-indigo-400 shrink-0">
                🔒{' '}
                {props.data.userId === props.currentUserId ? `私密傳送給 @${props.data.toUser?.username}` : '私密訊息'}
              </span>
            )}
          </div>
          <FormatDate className="text-xs text-muted-foreground" date={props.data.sendTime}></FormatDate>
        </div>
        <div>
          <div className="pb-1.5 text-base text-foreground/95 leading-relaxed">
            <Markdown>{content}</Markdown>
          </div>
          <div className="flex flex-wrap items-center gap-1.5 pb-1 text-muted-foreground opacity-80 transition-opacity group-hover:opacity-100">
            <Button
              type="button"
              variant="ghost"
              size="xs"
              className={cn(
                'h-7 rounded-full px-2 text-xs',
                props.like && 'bg-primary/10 text-primary hover:bg-primary/15 hover:text-primary'
              )}
              onClick={() => props.onLikeChange?.(!props.like)}
              title={text.likeTitle}
            >
              <ThumbsUpIcon size={14} />
              <span className="ml-1 tabular-nums">{props.data.likeUsers.length}</span>
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="xs"
              className={cn(
                'h-7 rounded-full px-2 text-xs',
                props.hate && 'bg-primary/10 text-primary hover:bg-primary/15 hover:text-primary'
              )}
              onClick={() => props.onHateChange?.(!props.hate)}
              title={text.dislikeTitle}
            >
              <ThumbsDownIcon size={14} />
              <span className="ml-1 tabular-nums">{props.data.hateUsers.length}</span>
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="xs"
              className="h-7 rounded-full px-2 text-xs"
              onClick={() => props.onCopy?.(props.data)}
              title={props.copied ? text.copiedTitle : text.copyMessageTitle}
            >
              {props.copied ? <CheckIcon size={14} /> : <CopyIcon size={14} />}
              <span className="ml-1">{props.copied ? text.copied : text.copy}</span>
            </Button>
            {props.onToggleBanUser && (
              <Button
                type="button"
                variant="ghost"
                size="xs"
                className={cn(
                  'h-7 rounded-full px-2 text-xs',
                  props.isBanned && 'bg-destructive/10 text-destructive hover:bg-destructive/15 hover:text-destructive'
                )}
                onClick={props.onToggleBanUser}
                title={props.isBanned ? text.unbanTitle : text.banTitle}
              >
                <UserXIcon size={14} />
                <span className="ml-1">{props.isBanned ? text.unban : text.ban}</span>
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

MessageItem.displayName = 'MessageItem'

export default MessageItem
