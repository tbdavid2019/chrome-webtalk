import { useState, type FC } from 'react'
import { BugIcon, Globe2Icon, LockIcon, XIcon } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/Avatar'
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/HoverCard'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/Popover'
import { Button } from '@/components/ui/Button'
import { cn, getSiteInfo } from '@/utils'
import { useRemeshDomain, useRemeshQuery, useRemeshSend } from 'remesh-react'
import ChatRoomDomain from '@/domain/ChatRoom'
import VirtualRoomDomain, { FromInfo, RoomUser } from '@/domain/VirtualRoom'
import { ScrollArea } from '@/components/ui/ScrollArea'
import { Virtuoso } from 'react-virtuoso'
import AvatarCircles from '@/components/magicui/AvatarCircles'
import Link from '@/components/Link'
import NumberFlow from '@number-flow/react'
import AppStatusDomain from '@/domain/AppStatus'
import UserInfoDomain from '@/domain/UserInfo'
import { getUiText } from '@/utils'

const PresenceCount: FC<{ count: number; capped?: boolean; label?: string }> = ({ count, capped, label }) => {
  const displayCount = capped ? `${count}+` : String(count)

  return (
    <span
      role="status"
      aria-label={`${label ? `${label}: ` : ''}${displayCount}`}
      className="inline-flex h-8 items-center gap-1.5 rounded-full border border-border/70 bg-background/80 hover:bg-muted/70 px-2.5 text-xs font-medium text-foreground transition-all shadow-2xs"
    >
      <span className="relative flex size-2 shrink-0">
        <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-500/70 opacity-75"></span>
        <span className="relative inline-flex size-2 rounded-full bg-emerald-500"></span>
      </span>
      <span className="inline-flex items-center font-semibold text-foreground/90">
        {import.meta.env.FIREFOX ? displayCount : <NumberFlow className="tabular-nums" willChange value={count} />}
        {capped && import.meta.env.FIREFOX === false && <span>+</span>}
      </span>
    </span>
  )
}

const Header: FC = () => {
  const send = useRemeshSend()
  const siteInfo = getSiteInfo()
  const chatRoomDomain = useRemeshDomain(ChatRoomDomain())
  const virtualRoomDomain = useRemeshDomain(VirtualRoomDomain())
  const appStatusDomain = useRemeshDomain(AppStatusDomain())
  const userInfoDomain = useRemeshDomain(UserInfoDomain())
  const chatUserList = useRemeshQuery(chatRoomDomain.query.UserListQuery())
  const virtualUserList = useRemeshQuery(virtualRoomDomain.query.UserListQuery())
  const userInfo = useRemeshQuery(userInfoDomain.query.UserInfoQuery())
  const text = getUiText(userInfo?.language)
  const privateChatTarget = useRemeshQuery(chatRoomDomain.query.PrivateChatTargetQuery())
  const chatOnlineCount = chatUserList.length
  const developerMode = userInfo?.developerMode === true
  const cappedChatOnlineCount = Math.min(chatOnlineCount, 99)

  const virtualOnlineGroup = virtualUserList
    .flatMap((user) => user.fromInfos.map((from) => ({ from, user })))
    .reduce<(FromInfo & { users: RoomUser[] })[]>((acc, item) => {
      const existSite = acc.find((group) => group.origin === item.from.origin)
      if (existSite) {
        const existUser = existSite.users.find((user) => user.userId === item.user.userId)
        !existUser && existSite.users.push(item.user)
      } else {
        acc.push({ ...item.from, users: [item.user] })
      }
      return acc
    }, [])
    .sort((a, b) => b.users.length - a.users.length)

  const [chatUserListScrollParentRef, setChatUserListScrollParentRef] = useState<HTMLDivElement | null>(null)
  const [chatUserListOpen, setChatUserListOpen] = useState(false)
  const [virtualOnlineGroupScrollParentRef, setVirtualOnlineGroupScrollParentRef] = useState<HTMLDivElement | null>(
    null
  )

  const handleClose = () => {
    send(appStatusDomain.command.UpdateOpenCommand(false))
  }

  return (
    <div className="z-10 flex h-14 items-center justify-between border-b border-border/60 bg-background/95 backdrop-blur-xs px-4">
      <div className="flex min-w-0 items-center gap-2.5">
        <div className="relative flex size-9 shrink-0 items-center justify-center rounded-xl border border-border/60 bg-muted/30 p-1 shadow-2xs">
          <Avatar className="size-full rounded-lg">
            <AvatarImage src={siteInfo.icon} alt="favicon" className="size-full object-contain" />
            <AvatarFallback className="bg-transparent">
              <Globe2Icon className="size-4 text-muted-foreground" />
            </AvatarFallback>
          </Avatar>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <h3
              className="truncate text-[13.5px] font-semibold tracking-tight text-foreground"
              title={siteInfo.hostname}
            >
              {siteInfo.hostname.replace(/^www\./i, '')}
            </h3>
            {privateChatTarget && (
              <span className="inline-flex shrink-0 items-center gap-0.5 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                <LockIcon size={9} />
                私聊
              </span>
            )}
          </div>
          <p
            className="truncate text-[11.5px] leading-tight text-muted-foreground mt-0.5"
            title={privateChatTarget ? `私聊對象: @${privateChatTarget.username}` : (siteInfo.title || siteInfo.hostname)}
          >
            {privateChatTarget ? `與 @${privateChatTarget.username} 私聊` : (siteInfo.title || '網頁即時聊天室')}
          </p>
        </div>
        {developerMode && virtualOnlineGroup.length > 1 && (
          <HoverCard>
            <HoverCardTrigger asChild>
              <Button
                className="h-8 gap-1 rounded-md px-2 text-xs font-medium text-muted-foreground hover:no-underline hover:text-foreground"
                variant="ghost"
              >
                <BugIcon size={14} />
                <span>Sites</span>
              </Button>
            </HoverCardTrigger>
            <HoverCardContent className="w-80 rounded-2xl p-0">
              <ScrollArea
                type="scroll"
                className="max-h-96 min-h-[72px] p-2"
                ref={setVirtualOnlineGroupScrollParentRef}
              >
                <Virtuoso
                  data={virtualOnlineGroup}
                  defaultItemHeight={56}
                  customScrollParent={virtualOnlineGroupScrollParentRef!}
                  itemContent={(_index, site) => (
                    <Link
                      underline={false}
                      href={site.origin}
                      className="grid cursor-pointer grid-cols-[auto_1fr] items-center gap-x-2 rounded-xl px-2 py-2 hover:bg-accent hover:text-accent-foreground"
                    >
                      <Avatar className="size-10 rounded-sm">
                        <AvatarImage src={site.icon} alt="favicon" />
                        <AvatarFallback>
                          <Globe2Icon size="100%" className="text-muted-foreground" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="grid items-center gap-y-1">
                        <div className="flex items-center gap-x-2 overflow-hidden">
                          <h4 className="flex-1 truncate text-sm font-semibold text-foreground">
                            {site.hostname.replace(/^www\./i, '')}
                          </h4>
                          <PresenceCount count={site.users.length} label={text.peopleOnline} />
                        </div>
                        <AvatarCircles max={9} size="xs" avatarUrls={site.users.map((user) => user.userAvatar)} />
                      </div>
                    </Link>
                  )}
                ></Virtuoso>
              </ScrollArea>
            </HoverCardContent>
          </HoverCard>
        )}
      </div>
      <div className="flex items-center gap-1.5">
        <Popover open={chatUserListOpen} onOpenChange={setChatUserListOpen}>
          <PopoverTrigger asChild>
            <button
              type="button"
              className="rounded-full p-0 transition hover:opacity-90 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label={text.peopleOnline}
              title={`${text.peopleOnline} (${cappedChatOnlineCount}) - 點擊查看在線名單`}
            >
              <PresenceCount count={cappedChatOnlineCount} capped={chatOnlineCount > 99} label={text.peopleOnline} />
            </button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-48 rounded-xl border border-border/80 bg-popover p-1.5 shadow-lg">
            <div className="flex items-center justify-between border-b border-border/40 px-2 py-1.5 text-xs font-semibold text-muted-foreground mb-1">
              <span>在線成員</span>
              <span className="tabular-nums text-[11px] font-normal">{chatUserList.length} 人</span>
            </div>
            <ScrollArea type="scroll" className="max-h-[220px] min-h-9" ref={setChatUserListScrollParentRef}>
              <Virtuoso
                data={chatUserList}
                defaultItemHeight={32}
                customScrollParent={chatUserListScrollParentRef!}
                itemContent={(_index, user) => {
                  const isMe = user.userId === userInfo?.id
                  const isSelected = privateChatTarget?.userId === user.userId
                  return (
                    <div
                      onClick={() => {
                        if (isMe) return
                        if (isSelected) {
                          send(chatRoomDomain.command.SelectPrivateChatTargetCommand(null))
                        } else {
                          send(chatRoomDomain.command.SelectPrivateChatTargetCommand(user))
                        }
                        setChatUserListOpen(false)
                      }}
                      className={cn(
                        'my-0.5 flex items-center gap-x-2 rounded-lg px-2 py-1.5 outline-none select-none transition-colors text-xs',
                        !isMe && 'cursor-pointer hover:bg-muted/70 active:bg-muted',
                        isSelected && 'bg-primary/10 border border-primary/20 text-primary font-semibold'
                      )}
                      title={isMe ? undefined : isSelected ? '取消私聊' : '點擊開始私聊'}
                    >
                      <Avatar className="size-5 shrink-0 rounded-full">
                        <AvatarImage className="size-full" src={user.userAvatar} alt="avatar" />
                        <AvatarFallback>{user.username.at(0)}</AvatarFallback>
                      </Avatar>
                      <div
                        className={cn(
                          'flex-1 truncate font-medium text-foreground/80',
                          isSelected && 'text-primary font-semibold'
                        )}
                      >
                        {user.username} {isMe && <span className="text-[10px] text-muted-foreground font-normal">(我)</span>}
                      </div>
                      {isSelected && (
                        <span className="text-[10px] bg-primary/15 text-primary px-1.5 py-0.5 rounded-full font-semibold shrink-0">
                          私聊中
                        </span>
                      )}
                    </div>
                  )
                }}
              ></Virtuoso>
            </ScrollArea>
          </PopoverContent>
        </Popover>
        <button
          onClick={handleClose}
          className="flex size-8 shrink-0 items-center justify-center rounded-full border border-border/70 bg-background/80 text-muted-foreground transition-all hover:bg-muted/80 hover:text-foreground active:scale-95 shadow-2xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          title="關閉聊天"
          aria-label="關閉聊天"
        >
          <XIcon size={15} strokeWidth={2} />
        </button>
      </div>
    </div>
  )
}

Header.displayName = 'Header'

export default Header
