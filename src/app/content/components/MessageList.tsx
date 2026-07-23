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
      <div className="flex size-full items-center justify-center bg-background px-4 py-6">
        <div className="my-auto flex w-full max-w-[320px] flex-col items-center justify-center gap-y-3 rounded-3xl border border-dashed border-border/80 bg-muted/40 px-6 py-8 text-center shadow-sm">
          <span className="text-3xl">✨</span>
          <p className="text-sm font-medium leading-6 text-muted-foreground">
            目前聊天室沒有人發言。
            <br />
            輸入訊息並按下 Enter 開始聊天。
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-0 flex-1 bg-background px-2 py-2 sm:px-3 sm:py-3">
      <ScrollArea ref={setScrollParentRef} className="size-full rounded-2xl bg-muted/20">
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
