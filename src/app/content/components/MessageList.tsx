import { FC, useState, type ReactElement } from 'react'
import { SparklesIcon } from 'lucide-react'

import { type MessageItemProps } from './MessageItem'
import { type PromptItemProps } from './PromptItem'
import { ScrollArea } from '@/components/ui/ScrollArea'
import { Virtuoso } from 'react-virtuoso'

export interface MessageListProps {
  children?: Array<ReactElement<MessageItemProps | PromptItemProps>>
}
const MessageList: FC<MessageListProps> = ({ children }) => {
  const [scrollParentRef, setScrollParentRef] = useState<HTMLDivElement | null>(null)

  if (!children || children.length === 0) {
    return (
      <div className="flex size-full items-center justify-center bg-background px-4 py-8">
        <div className="my-auto flex w-full max-w-[310px] flex-col items-center justify-center gap-y-3.5 rounded-2xl border-[1.5px] border-[#d6bc7c] border-l-4 border-l-[#a9471d] bg-[#faefd4]/85 p-7 text-center shadow-[0_8px_22px_rgba(79,58,14,0.08)] dark:border-[#2b4a6b] dark:border-l-4 dark:border-l-[#ffb010] dark:bg-[#13273c] dark:shadow-[0_8px_24px_rgba(0,0,0,0.35)]">
          <div className="flex size-11 items-center justify-center rounded-xl border-2 border-[#17324d] bg-[#ffb010] text-[#2b251a] shadow-[0_2px_0_#17324d] dark:border-[#ffb010] dark:bg-[#ffb010] dark:text-[#0b1826]">
            <SparklesIcon className="size-5 stroke-[1.8]" />
          </div>
          <div className="space-y-1">
            <h4 className="font-sans text-[15px] font-bold tracking-tight text-foreground">目前聊天室尚無訊息</h4>
            <p className="font-sans text-[13px] font-medium leading-relaxed text-muted-foreground">
              輸入訊息並按下 Enter，或點選下方推薦話題開始聊天
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-0 flex-1 bg-background py-2">
      <ScrollArea ref={setScrollParentRef} className="size-full">
        <Virtuoso
          defaultItemHeight={112}
          followOutput={(isAtBottom: boolean) => (isAtBottom ? 'smooth' : 'auto')}
          initialTopMostItemIndex={{ index: 'LAST', align: 'end' }}
          data={children}
          customScrollParent={scrollParentRef!}
          itemContent={(_: any, item: ReactElement<MessageItemProps | PromptItemProps>) => item}
        />
      </ScrollArea>
    </div>
  )
}

MessageList.displayName = 'MessageList'

export default MessageList
