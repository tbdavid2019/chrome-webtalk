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
        <div className="my-auto flex w-full max-w-[280px] flex-col items-center justify-center gap-y-3.5 rounded-2xl border border-border/50 bg-muted/30 p-7 text-center shadow-2xs">
          <div className="flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-2xs">
            <SparklesIcon className="size-5 stroke-[1.8]" />
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-semibold text-foreground">目前聊天室尚無訊息</h4>
            <p className="text-xs leading-relaxed text-muted-foreground">
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
