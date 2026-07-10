import { useState, type FC } from 'react'
import { BugIcon, Globe2Icon, XIcon } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/Avatar'
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/HoverCard'
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

const PresenceCount: FC<{ count: number; capped?: boolean }> = ({ count, capped }) => {
  const tone =
    count > 1 ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-orange-200 bg-orange-50 text-orange-700'

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2 py-1 text-xs font-medium leading-none tabular-nums dark:border-white/10 dark:bg-white/5 dark:text-slate-100',
        tone
      )}
    >
      <span aria-hidden>👥</span>
      {import.meta.env.FIREFOX ? count : <NumberFlow className="tabular-nums" willChange value={count} />}
      {capped && <span>+</span>}
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
  const [virtualOnlineGroupScrollParentRef, setVirtualOnlineGroupScrollParentRef] = useState<HTMLDivElement | null>(
    null
  )

  const handleClose = () => {
    send(appStatusDomain.command.UpdateOpenCommand(false))
  }

  return (
    <div className="z-10 flex h-12 items-center justify-between border-b border-border bg-background px-4">
      <div className="flex min-w-0 items-center gap-2">
        <Avatar className="size-8 rounded-md">
          <AvatarImage src={siteInfo.icon} alt="favicon" />
          <AvatarFallback>
            <Globe2Icon size="100%" className="text-muted-foreground" />
          </AvatarFallback>
        </Avatar>
        <span className="truncate text-sm font-semibold text-foreground">
          {siteInfo.hostname.replace(/^www\./i, '')}
        </span>
        {developerMode && virtualOnlineGroup.length > 1 && (
          <HoverCard>
            <HoverCardTrigger asChild>
              <Button
                className="h-8 gap-1 rounded-full px-2 text-xs font-medium text-muted-foreground hover:no-underline hover:text-foreground"
                variant="ghost"
              >
                <BugIcon size={14} />
                <span>Sites</span>
              </Button>
            </HoverCardTrigger>
            <HoverCardContent className="w-80 rounded-lg p-0">
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
                      className="grid cursor-pointer grid-cols-[auto_1fr] items-center gap-x-2 rounded-lg px-2 py-1.5 hover:bg-accent hover:text-accent-foreground"
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
                          <PresenceCount count={site.users.length} />
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
      <div className="flex items-center gap-2">
        <HoverCard>
          <HoverCardTrigger asChild>
            <Button className="rounded-full p-0 hover:no-underline animate-in fade-in" variant="link">
              <PresenceCount count={cappedChatOnlineCount} capped={chatOnlineCount > 99} />
            </Button>
          </HoverCardTrigger>
          <HoverCardContent className="w-36 rounded-lg p-0">
            <ScrollArea type="scroll" className="max-h-[204px] min-h-9 p-1" ref={setChatUserListScrollParentRef}>
              <Virtuoso
                data={chatUserList}
                defaultItemHeight={28}
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
                      }}
                      className={cn(
                        'flex items-center gap-x-2 rounded-md px-2 py-1 outline-none select-none my-0.5',
                        !isMe && 'cursor-pointer hover:bg-accent/70 active:bg-accent transition-colors',
                        isSelected &&
                          'bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100/50 dark:border-indigo-900/50'
                      )}
                      title={isMe ? undefined : isSelected ? '取消私聊' : '點擊開始私聊'}
                    >
                      <Avatar className="size-4 shrink-0">
                        <AvatarImage className="size-full" src={user.userAvatar} alt="avatar" />
                        <AvatarFallback>{user.username.at(0)}</AvatarFallback>
                      </Avatar>
                      <div
                        className={cn(
                          'flex-1 truncate text-xs text-slate-500 dark:text-slate-50',
                          isSelected && 'text-indigo-600 dark:text-indigo-400 font-semibold'
                        )}
                      >
                        {user.username} {isMe && '(me)'}
                      </div>
                      {isSelected && (
                        <span className="text-[9px] bg-indigo-100 dark:bg-indigo-900/60 text-indigo-600 dark:text-indigo-400 px-1 py-0.5 rounded font-bold shrink-0">
                          🔒 私聊
                        </span>
                      )}
                    </div>
                  )
                }}
              ></Virtuoso>
            </ScrollArea>
          </HoverCardContent>
        </HoverCard>
        <button
          onClick={handleClose}
          className="flex size-7 items-center justify-center rounded-full border border-border bg-background text-muted-foreground transition hover:bg-muted hover:text-foreground shrink-0"
          title="關閉聊天"
          aria-label="關閉聊天"
        >
          <XIcon size={14} />
        </button>
      </div>
    </div>
  )
}

Header.displayName = 'Header'

export default Header
