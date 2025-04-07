import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/Avatar'
import { MAX_AVATAR_SIZE } from '@/constants/config'
import MessageListDomain, { Message, MessageType } from '@/domain/MessageList'
import UserInfoDomain, { UserInfo } from '@/domain/UserInfo'
import { generateRandomAvatar, generateRandomName } from '@/utils'
import { UserIcon } from 'lucide-react'
import { nanoid } from 'nanoid'
import { FC, useEffect, useState } from 'react'
import { useRemeshDomain, useRemeshSend } from 'remesh-react'
import Timer from '@resreq/timer'
import ExampleImage from '@/assets/images/example.jpg'
import PulsatingButton from '@/components/magicui/PulsatingButton'
import BlurFade from '@/components/magicui/BlurFade'
import WordPullUp from '@/components/magicui/WordPullUp'
import { motion } from 'framer-motion'

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
    name: generateRandomName(),
    avatar: await generateRandomAvatar(MAX_AVATAR_SIZE),
    createTime: Date.now(),
    themeMode: 'system',
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

  const handleSetup = () => {
    send(messageListDomain.command.ClearListCommand())
    send(userInfoDomain.command.UpdateUserInfoCommand(userInfo!))
  }

  const refreshUserInfo = async () => {
    const userInfo = await generateUserInfo()
    setUserInfo(userInfo)
    return userInfo
  }
  const createMessage = async (userInfo: UserInfo) => {
    const message = await generateMessage(userInfo!)
    send(messageListDomain.command.CreateItemCommand(message))
  }

  useEffect(() => {
    const timer = new Timer(
      async () => {
        if (timer.status !== 'stopped') {
          await createMessage(await refreshUserInfo())
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
    <div className="absolute inset-0 z-50 flex rounded-xl bg-black/10 shadow-2xl  backdrop-blur-sm">
      <div className="m-auto flex flex-col items-center justify-center gap-y-8 pb-40 drop-shadow-lg">
        <BlurFade key={userInfo?.avatar} inView>
          <Avatar className="size-24 cursor-pointer border-4 border-white ">
            <AvatarImage src={userInfo?.avatar} className="size-full" alt="avatar" />
            <AvatarFallback>
              <UserIcon size={30} className="text-slate-400" />
            </AvatarFallback>
          </Avatar>
        </BlurFade>
        <div className="flex" key={userInfo?.name}>
          <motion.div
            className="text-2xl font-bold text-primary"
            initial={{ x: -10, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            @
          </motion.div>
          <WordPullUp className="text-2xl font-bold text-primary" words={`${userInfo?.name || ''.padEnd(10, ' ')}`} />
        </div>
        <PulsatingButton onClick={handleSetup}>Start chatting</PulsatingButton>
      </div>
    </div>
  )
}

Setup.displayName = 'Setup'

export default Setup
