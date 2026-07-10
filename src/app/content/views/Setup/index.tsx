import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/Avatar'
import { MAX_AVATAR_SIZE } from '@/constants/config'
import MessageListDomain, { Message, MessageType } from '@/domain/MessageList'
import UserInfoDomain, { UserInfo } from '@/domain/UserInfo'
import { generateRandomAvatar } from '@/utils'
import { UserIcon, RefreshCwIcon } from 'lucide-react'
import { nanoid } from 'nanoid'
import { FC, useEffect, useState, useRef } from 'react'
import { useRemeshDomain, useRemeshSend } from 'remesh-react'
import Timer from '@resreq/timer'
import ExampleImage from '@/assets/images/example.jpg'
import PulsatingButton from '@/components/magicui/PulsatingButton'
import BlurFade from '@/components/magicui/BlurFade'
import { motion } from 'framer-motion'
import { Input } from '@/components/ui/Input'

const mockTextList = [
  `大衛888`,
  `這是david888.com的研究`,
  `台灣太左了`,
  `試試看`,
  `大家告訴大家`,
  `![ExampleImage](${ExampleImage})`
]

const generateUserInfo = async (): Promise<UserInfo> => {
  return {
    id: nanoid(),
    name: '',
    avatar: await generateRandomAvatar(MAX_AVATAR_SIZE),
    createTime: Date.now(),
    language: 'auto',
    compatibilityMode: 'legacy',
    themeMode: 'system',
    developerMode: false,
    bannedUserIds: [],
    hideAllAiMessages: false,
    danmakuEnabled: true,
    notificationEnabled: true,
    notificationType: 'all'
  }
}

const generateMessage = async (userInfo: UserInfo): Promise<Message> => {
  const { name: username, avatar: userAvatar, id: userId } = userInfo
  return {
    id: nanoid(),
    body: mockTextList.shift()!,
    sendTime: Date.now(),
    receiveTime: Date.now(),
    type: MessageType.Normal,
    userId,
    username,
    userAvatar,
    likeUsers: mockTextList.length ? [] : [{ userId, username, userAvatar }],
    hateUsers: [],
    atUsers: []
  }
}

const Setup: FC = () => {
  const send = useRemeshSend()
  const userInfoDomain = useRemeshDomain(UserInfoDomain())
  const messageListDomain = useRemeshDomain(MessageListDomain())

  const [userInfo, setUserInfo] = useState<UserInfo>()
  const [isEdited, setIsEdited] = useState(false)
  const isEditedRef = useRef(false)

  const handleSetup = () => {
    if (!userInfo || !userInfo.name.trim()) return
    send(messageListDomain.command.ClearListCommand())
    send(userInfoDomain.command.UpdateUserInfoCommand(userInfo!))
  }

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    isEditedRef.current = true
    setIsEdited(true)
    setUserInfo((prev) => (prev ? { ...prev, name: e.target.value } : undefined))
  }

  const handleRandomizeAvatar = async () => {
    isEditedRef.current = true
    setIsEdited(true)
    const newAvatar = await generateRandomAvatar(MAX_AVATAR_SIZE)
    setUserInfo((prev) => (prev ? { ...prev, avatar: newAvatar } : undefined))
  }

  const createMessage = async (userInfo: UserInfo) => {
    const message = await generateMessage(userInfo!)
    send(messageListDomain.command.CreateItemCommand(message))
  }

  useEffect(() => {
    const timer = new Timer(
      async () => {
        if (timer.status !== 'stopped') {
          const randomUser = await generateUserInfo()
          if (!isEditedRef.current) {
            setUserInfo(randomUser)
          }
          await createMessage(randomUser)
        }
      },
      { delay: 2000, immediate: true, limit: mockTextList.length }
    )
    timer.start()
    return () => {
      timer.stop()
      send(messageListDomain.command.ClearListCommand())
    }
  }, [])

  return (
    <div className="absolute inset-0 z-50 flex bg-background/90 backdrop-blur-md">
      <div className="m-auto flex flex-col items-center justify-center gap-y-6 pb-24">
        <div className="relative group cursor-pointer" onClick={handleRandomizeAvatar}>
          <BlurFade key={userInfo?.avatar} inView>
            <Avatar className="size-20 border-2 border-border shadow-lg transition-transform hover:scale-105 rounded-full">
              <AvatarImage src={userInfo?.avatar} className="size-full" alt="avatar" />
              <AvatarFallback>
                <UserIcon size={24} className="text-muted-foreground" />
              </AvatarFallback>
            </Avatar>
          </BlurFade>
          <div className="absolute -bottom-1 -right-1 bg-background p-1 rounded-full shadow border border-border pointer-events-none group-hover:scale-110 transition-transform">
            <RefreshCwIcon size={10} className="text-muted-foreground" />
          </div>
        </div>

        <div className="flex flex-col items-center gap-y-2">
          <div className="flex items-center gap-x-2 w-60 bg-muted rounded-xl p-1.5 px-3 border border-border shadow-sm focus-within:ring-1 focus-within:ring-primary/60">
            <span className="text-sm font-semibold text-muted-foreground/60">@</span>
            <Input
              type="text"
              value={userInfo?.name || ''}
              onChange={handleNameChange}
              placeholder="輸入你的暱稱..."
              className="border-0 shadow-none bg-transparent p-0 text-foreground font-medium focus-visible:ring-0 text-xs"
              maxLength={20}
            />
          </div>
          <p className="text-[10px] text-muted-foreground font-medium">💡 點擊頭像可以隨機更換頭像</p>
        </div>

        <PulsatingButton
          onClick={handleSetup}
          pulseColor="#C4B4D560"
          className="text-xs font-semibold px-6 h-9 rounded-full bg-primary hover:bg-primary/95 text-primary-foreground shadow shadow-primary/30"
        >
          Start chatting
        </PulsatingButton>
      </div>
    </div>
  )
}

Setup.displayName = 'Setup'

export default Setup
