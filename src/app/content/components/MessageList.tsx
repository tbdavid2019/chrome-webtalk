import { FC, useState, type ReactElement } from 'react'

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
      <div className="flex size-full items-center justify-center p-6 bg-background">
        <div className="flex flex-col items-center justify-center py-10 px-6 text-center gap-y-3 bg-muted/40 rounded-2xl border border-dashed border-border/80 w-full max-w-[280px] my-auto">
          <span className="text-3xl animate-bounce">🐰</span>
          <p className="text-sm text-muted-foreground font-semibold leading-relaxed">
            目前聊天室沒有人發言。
            <br />
            輸入訊息並按下 Enter 開始彈幕聊天！
          </p>
        </div>
      </div>
    )
  }

  return (
    <ScrollArea ref={setScrollParentRef} className="size-full bg-background">
      <Virtuoso
        defaultItemHeight={108}
        followOutput={(isAtBottom: boolean) => (isAtBottom ? 'smooth' : 'auto')}
        initialTopMostItemIndex={{ index: 'LAST', align: 'end' }}
        data={children}
        customScrollParent={scrollParentRef!}
        itemContent={(_: any, item: ReactElement<MessageItemProps | PromptItemProps>) => item}
      />
    </ScrollArea>
  )
}

MessageList.displayName = 'MessageList'

export default MessageList
