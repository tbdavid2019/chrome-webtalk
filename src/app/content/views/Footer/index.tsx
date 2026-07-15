import { ChangeEvent, useMemo, useRef, useState, KeyboardEvent, type FC, ClipboardEvent, useEffect } from 'react'
import { CornerDownLeftIcon, LinkIcon, BotIcon } from 'lucide-react'
import { useRemeshDomain, useRemeshQuery, useRemeshSend } from 'remesh-react'
import MessageInput from '../../components/MessageInput'
import EmojiButton from '../../components/EmojiButton'
import { Button } from '@/components/ui/Button'
import MessageInputDomain from '@/domain/MessageInput'
import { MESSAGE_MAX_LENGTH, WEB_RTC_MAX_MESSAGE_SIZE } from '@/constants/config'
import ChatRoomDomain from '@/domain/ChatRoom'
import useCursorPosition from '@/hooks/useCursorPosition'
import useShareRef from '@/hooks/useShareRef'
import { Presence } from '@radix-ui/react-presence'
import { Portal } from '@radix-ui/react-portal'
import useTriggerAway from '@/hooks/useTriggerAway'
import { ScrollArea } from '@/components/ui/ScrollArea'
import { Virtuoso, VirtuosoHandle } from 'react-virtuoso'
import UserInfoDomain from '@/domain/UserInfo'
import {
  blobToBase64,
  cn,
  compressImage,
  getRootNode,
  getTextByteSize,
  getTextSimilarity,
  getUiText,
  requestPageSuggestions,
  type PageSuggestion
} from '@/utils'
import { Avatar, AvatarFallback } from '@/components/ui/Avatar'
import { AvatarImage } from '@radix-ui/react-avatar'
import ToastDomain from '@/domain/Toast'
import ImageButton from '../../components/ImageButton'
import { nanoid } from 'nanoid'
import type { AtUser } from '@/domain/MessageList'
import { requestAiChatReply } from '@/utils'
import { ToastImpl } from '@/domain/impls/Toast'
import PanelModeSwitch from '@/app/content/components/PanelModeSwitch'

interface AutoCompleteAiItem {
  kind: 'ai'
  username: 'ai'
  label: string
  description: string
}

interface AutoCompleteUserItem {
  kind: 'user'
  userId: string
  username: string
  userAvatar: string
  similarity: number
}

type AutoCompleteItem = AutoCompleteAiItem | AutoCompleteUserItem

const Footer: FC<{ enableAi?: boolean }> = ({ enableAi = true }) => {
  const send = useRemeshSend()
  const toastDomain = useRemeshDomain(ToastDomain())
  const chatRoomDomain = useRemeshDomain(ChatRoomDomain())
  const messageInputDomain = useRemeshDomain(MessageInputDomain())
  const message = useRemeshQuery(messageInputDomain.query.MessageQuery())
  const userInfoDomain = useRemeshDomain(UserInfoDomain())
  const userInfo = useRemeshQuery(userInfoDomain.query.UserInfoQuery())
  const text = getUiText(userInfo?.language)
  const userList = useRemeshQuery(chatRoomDomain.query.UserListQuery())
  const privateChatTarget = useRemeshQuery(chatRoomDomain.query.PrivateChatTargetQuery())

  const inputRef = useRef<HTMLTextAreaElement>(null)
  const { x, y, selectionStart, selectionEnd, setRef } = useCursorPosition()

  const [autoCompleteListShow, setAutoCompleteListShow] = useState(false)
  const [scrollParentRef, setScrollParentRef] = useState<HTMLDivElement | null>(null)
  const autoCompleteListRef = useRef<HTMLDivElement>(null)
  const { setRef: setAutoCompleteListRef } = useTriggerAway(['click'], () => setAutoCompleteListShow(false))
  const shareAutoCompleteListRef = useShareRef(setAutoCompleteListRef, autoCompleteListRef)
  const isComposing = useRef(false)
  const virtuosoRef = useRef<VirtuosoHandle>(null)
  const [inputLoading, setInputLoading] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [pageSuggestions, setPageSuggestions] = useState<PageSuggestion[]>([])
  const [pageSuggestionsLoading, setPageSuggestionsLoading] = useState(false)
  const maxLengthWarnedRef = useRef(false)
  const aiRequestInFlightRef = useRef(false)
  const aiLastTriggeredAtRef = useRef(0)

  const shareRef = useShareRef(inputRef, setRef)
  const aiTopicSuggestionsEnabled = enableAi && userInfo?.aiTopicSuggestionsEnabled !== false

  /**
   * When inserting a username using the @ syntax, record the username's position information and the mapping relationship between the position information and userId to distinguish between users with the same name.
   */
  const atUserRecord = useRef<Map<string, Set<[number, number]>>>(new Map())
  const imageRecord = useRef<Map<string, string>>(new Map())

  const updateAtUserAtRecord = useMemo(
    () => (message: string, start: number, end: number, offset: number, atUserId?: string) => {
      const positions: [number, number] = [start, end]

      // If the editing position is before the end position of @user, update the editing position.
      // "@user" => "E@user"
      // "@user" => "@useEr"
      // "@user" => "@user @user"
      atUserRecord.current.forEach((item, userId) => {
        const positionList = [...item].map<[number, number]>((item) => {
          const inBefore = Math.min(start, end) <= item[1]
          return inBefore ? [item[0] + offset + (end - start), item[1] + offset + (end - start)] : item
        })
        atUserRecord.current.set(userId, new Set(positionList))
      })

      // Insert a new @user record
      if (atUserId) {
        atUserRecord.current.set(atUserId, atUserRecord.current.get(atUserId)?.add(positions) ?? new Set([positions]))
      }

      // After moving, check if the @user in the message matches the saved position record. If not, it means the @user has been edited, so delete that record.
      // Filter out records where the stored position does not match the actual position.
      atUserRecord.current.forEach((item, userId) => {
        // Pre-calculate the offset after InputCommand
        const positionList = [...item].filter((item) => {
          const username = message.slice(item[0], item[1] + 1)
          return username === `@${userList.find((user) => user.userId === userId)?.username}`
        })
        if (positionList.length) {
          atUserRecord.current.set(userId, new Set(positionList))
        } else {
          atUserRecord.current.delete(userId)
        }
      })
    },
    [userList]
  )

  const [selectedUserIndex, setSelectedUserIndex] = useState(0)
  const [searchNameKeyword, setSearchNameKeyword] = useState('')

  const autoCompleteList = useMemo(() => {
    const keyword = searchNameKeyword.toLowerCase()
    const aiItem: AutoCompleteAiItem = {
      kind: 'ai',
      username: 'ai',
      label: text.aiInvokeLabel,
      description: text.aiInvokeDescription
    }

    const matchedUsers: AutoCompleteUserItem[] = userList
      .filter((user) => user.userId !== userInfo?.id)
      .map((item) => ({
        kind: 'user' as const,
        ...item,
        similarity: getTextSimilarity(keyword, item.username.toLowerCase())
      }))
      .toSorted((a, b) => b.similarity - a.similarity)

    if (enableAi && (!keyword || 'ai'.includes(keyword) || keyword.includes('ai'))) {
      return [aiItem, ...matchedUsers]
    }

    return matchedUsers
  }, [enableAi, searchNameKeyword, userList, userInfo])

  useEffect(() => {
    let active = true

    if (!aiTopicSuggestionsEnabled || privateChatTarget) {
      setPageSuggestions([])
      setPageSuggestionsLoading(false)
      return
    }

    setPageSuggestionsLoading(true)

    requestPageSuggestions({
      pageTitle: document.title,
      pageUrl: window.location.href,
      pageText: document.body.innerText,
      language: userInfo?.language
    })
      .then((result) => {
        if (!active) return
        setPageSuggestions(result.chat)
      })
      .finally(() => {
        if (!active) return
        setPageSuggestionsLoading(false)
      })

    return () => {
      active = false
    }
  }, [aiTopicSuggestionsEnabled, privateChatTarget, userInfo?.language])

  const selectedUser = autoCompleteList.find((_, index) => index === selectedUserIndex)!

  // Replace the hash URL in ![Image](hash:${hash}) with base64 and update the atUserRecord.
  const transformMessage = async (message: string) => {
    let newMessage = message
    const matchList = [...message.matchAll(/!\[Image\]\(hash:([^\s)]+)\)/g)]
    matchList?.forEach((match) => {
      const base64 = imageRecord.current.get(match[1])
      if (base64) {
        const base64Syntax = `![Image](${base64})`
        const hashSyntax = match[0]
        const startIndex = match.index
        const endIndex = startIndex + base64Syntax.length - hashSyntax.length
        newMessage = newMessage.replace(hashSyntax, base64Syntax)
        updateAtUserAtRecord(newMessage, startIndex, endIndex, 0)
      }
    })
    return newMessage
  }

  const handleSend = async () => {
    if (isSending) return

    const currentMessage = message

    if (!`${currentMessage}`.trim()) {
      return send(toastDomain.command.WarningCommand(text.emptyMessage))
    }

    setIsSending(true)

    const atUsers = [...atUserRecord.current]
      .map(([userId, positions]) => {
        const user = userList.find((user) => user.userId === userId)
        return user ? { ...user, positions: [...positions] } : undefined
      })
      .filter(Boolean) as AtUser[]

    const atUserSnapshot = new Map(atUserRecord.current)
    const imageSnapshot = new Map(imageRecord.current)
    let inputCleared = false

    try {
      const transformedMessage = await transformMessage(currentMessage)
      const isAiPrompt = enableAi && /^@ai(?:\s|$)/i.test(transformedMessage.trim())
      const aiPrompt = transformedMessage
        .trim()
        .replace(/^@ai\s*/i, '')
        .trim()
      const triggerMessageId = nanoid()
      const pageContext = {
        url: window.location.href,
        title: document.title
      }
      const newMessage = { id: triggerMessageId, body: transformedMessage, atUsers, pageContext }
      const byteSize = getTextByteSize(JSON.stringify(newMessage))

      if (byteSize > WEB_RTC_MAX_MESSAGE_SIZE) {
        send(toastDomain.command.WarningCommand(text.messageTooLarge))
        return
      }

      if (isAiPrompt) {
        if (privateChatTarget) {
          send(toastDomain.command.WarningCommand(text.aiUnsupportedInPrivate))
          return
        }

        if (!aiPrompt) {
          send(toastDomain.command.WarningCommand(text.aiPromptRequired))
          return
        }

        if (aiRequestInFlightRef.current) {
          send(toastDomain.command.WarningCommand(text.aiBusy))
          return
        }

        if (Date.now() - aiLastTriggeredAtRef.current < 30000) {
          send(toastDomain.command.WarningCommand(text.aiCooldown))
          return
        }
      }

      send(messageInputDomain.command.ClearCommand())
      setAutoCompleteListShow(false)
      inputCleared = true
      atUserRecord.current.clear()
      imageRecord.current.clear()
      requestAnimationFrame(() => {
        inputRef.current?.focus()
      })

      // 發送消息
      send(chatRoomDomain.command.SendTextMessageCommand(newMessage))

      if (isAiPrompt && userInfo) {
        aiRequestInFlightRef.current = true
        aiLastTriggeredAtRef.current = Date.now()
        const loadingToastId = ToastImpl.value.loading(text.aiLoading, 30000)

        try {
          const result = await requestAiChatReply({
            prompt: aiPrompt,
            pageTitle: document.title,
            pageUrl: window.location.href,
            pageText: document.body.innerText,
            language: userInfo.language
          })

          send(
            chatRoomDomain.command.SendTextMessageCommand({
              body: result.content,
              atUsers: [],
              senderType: 'ai',
              username: 'AI',
              userAvatar: userInfo.avatar,
              pageContext,
              aiMeta: {
                ownerUserId: userInfo.id,
                ownerUsername: userInfo.name,
                triggerMessageId,
                model: result.model
              }
            })
          )

          ToastImpl.value.cancel(loadingToastId)
          send(toastDomain.command.SuccessCommand({ message: text.aiReplied, duration: 2000 }))
        } catch (error) {
          ToastImpl.value.cancel(loadingToastId)
          send(toastDomain.command.ErrorCommand(error instanceof Error ? error.message : text.aiReplyFailed))
        } finally {
          aiRequestInFlightRef.current = false
        }
      }
    } catch (error) {
      console.error('[WebTalk] Failed to send message', error)
      if (inputCleared) {
        atUserRecord.current = new Map(atUserSnapshot)
        imageRecord.current = new Map(imageSnapshot)
        send(messageInputDomain.command.InputCommand(currentMessage))
        requestAnimationFrame(() => {
          inputRef.current?.focus()
        })
      }
      send(
        toastDomain.command.ErrorCommand(
          error instanceof Error ? error.message : 'Failed to send message. Please try again.'
        )
      )
    } finally {
      setIsSending(false)
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (autoCompleteListShow && autoCompleteList.length) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        const length = autoCompleteList.length
        const prevIndex = selectedUserIndex

        if (e.key === 'ArrowDown') {
          const index = (prevIndex + 1) % length
          setSelectedUserIndex(index)
          virtuosoRef.current?.scrollIntoView({ index })
          e.preventDefault()
        }
        if (e.key === 'ArrowUp') {
          const index = (prevIndex - 1 + length) % length
          setSelectedUserIndex(index)
          virtuosoRef.current?.scrollIntoView({ index })
          e.preventDefault()
        }
      }

      if (['Escape', 'Backspace', 'Delete', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        if (e.key === 'Delete' || e.key === 'Backspace') {
          const isDeleteAt = message.at(selectionStart - 1) === '@'
          setAutoCompleteListShow(!isDeleteAt)
        } else {
          setAutoCompleteListShow(false)
        }
        setSelectedUserIndex(0)
      }
    }

    if (e.key === 'Enter' && !(e.shiftKey || e.ctrlKey || e.altKey || e.metaKey)) {
      if (isSending) {
        e.preventDefault()
        return
      }
      if (isComposing.current) return

      if (autoCompleteListShow && autoCompleteList.length) {
        handleInjectAtSyntax(selectedUser)
      } else {
        handleSend()
      }
      e.preventDefault()
    }
  }

  const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    const currentMessage = e.target.value

    if (autoCompleteListShow) {
      const target = e.target as HTMLTextAreaElement
      if (target.value) {
        const atIndex = target.value.lastIndexOf('@', selectionEnd - 1)
        if (atIndex !== -1) {
          const keyword = target.value.slice(atIndex + 1, selectionEnd)
          setSearchNameKeyword(keyword)
          setSelectedUserIndex(0)
          virtuosoRef.current?.scrollIntoView({ index: 0 })
        }
      } else {
        setAutoCompleteListShow(false)
      }
    }

    const event = e.nativeEvent as InputEvent

    if (event.data === '@' && autoCompleteList.length) {
      setAutoCompleteListShow(true)
    }

    // Pre-calculate the offset after InputCommand
    const start = selectionStart
    const end = selectionStart + currentMessage.length - message.length

    updateAtUserAtRecord(currentMessage, start, end, 0)

    if (currentMessage.length >= MESSAGE_MAX_LENGTH) {
      if (!maxLengthWarnedRef.current) {
        send(toastDomain.command.WarningCommand(`Message length limit reached (${MESSAGE_MAX_LENGTH} chars).`))
        maxLengthWarnedRef.current = true
      }
    } else {
      maxLengthWarnedRef.current = false
    }

    send(messageInputDomain.command.InputCommand(currentMessage))
  }

  const handlePaste = async (e: ClipboardEvent<HTMLTextAreaElement>) => {
    const file = e.nativeEvent.clipboardData?.files[0]
    if (['image/png', 'image/jpeg', 'image/webp'].includes(file?.type ?? '')) {
      handleInjectImage(file!)
    }
  }

  const handleCompositionStart = () => {
    isComposing.current = true
  }

  const handleCompositionEnd = () => {
    isComposing.current = false
  }

  const handleInjectEmoji = (emoji: string) => {
    const newMessage = `${message.slice(0, selectionEnd)}${emoji}${message.slice(selectionEnd)}`

    // Pre-calculate the offset after InputCommand
    const start = selectionStart
    const end = selectionEnd + newMessage.length - message.length

    updateAtUserAtRecord(newMessage, start, end, 0)

    send(messageInputDomain.command.InputCommand(newMessage))

    requestIdleCallback(() => {
      inputRef.current?.setSelectionRange(end, end)
      inputRef.current?.focus()
    })
  }

  const handleInsertPageUrl = () => {
    const url = window.location.href
    if (!url) return
    const newMessage = `${message.slice(0, selectionEnd)}${url}${message.slice(selectionEnd)}`

    const start = selectionStart
    const end = selectionEnd + newMessage.length - message.length

    updateAtUserAtRecord(newMessage, start, end, 0)
    send(messageInputDomain.command.InputCommand(newMessage))

    requestIdleCallback(() => {
      inputRef.current?.setSelectionRange(end, end)
      inputRef.current?.focus()
    })
  }

  const handleInsertSuggestedPrompt = (prompt: string) => {
    const trimmedPrompt = prompt.trim()
    if (!trimmedPrompt) return

    const before = message.slice(0, selectionStart)
    const after = message.slice(selectionEnd)
    const spacerBefore = before && !/\s$/.test(before) ? ' ' : ''
    const spacerAfter = after && !/^\s/.test(after) ? ' ' : ''
    const newMessage = `${before}${spacerBefore}${trimmedPrompt}${spacerAfter}${after}`
    const cursor = before.length + spacerBefore.length + trimmedPrompt.length

    updateAtUserAtRecord(newMessage, selectionStart, selectionEnd, 0)
    send(messageInputDomain.command.InputCommand(newMessage))

    requestIdleCallback(() => {
      inputRef.current?.setSelectionRange(cursor, cursor)
      inputRef.current?.focus()
    })
  }

  const handleAskAi = () => {
    const event = new CustomEvent('open-ai-summary-panel')
    window.dispatchEvent(event)
  }

  const handleInjectAiPrompt = () => {
    const before = message.slice(0, selectionEnd)
    const after = message.slice(selectionEnd)
    const needsLeadingSpace = before.length > 0 && !/\s$/.test(before)
    const aiPrompt = `${needsLeadingSpace ? ' ' : ''}@ai `
    const newMessage = `${before}${aiPrompt}${after}`
    const cursor = before.length + aiPrompt.length

    updateAtUserAtRecord(newMessage, selectionStart, cursor, 0)
    send(messageInputDomain.command.InputCommand(newMessage))
    setAutoCompleteListShow(false)
    setSearchNameKeyword('')
    setSelectedUserIndex(0)

    requestIdleCallback(() => {
      inputRef.current?.setSelectionRange(cursor, cursor)
      inputRef.current?.focus()
    })
  }

  const handleInjectImage = async (file: File) => {
    try {
      setInputLoading(true)

      const blob = await compressImage({
        input: file,
        targetSize: 30 * 1024,
        outputType: file.size > 30 * 1024 ? 'image/webp' : undefined
      })

      const base64 = await blobToBase64(blob)
      const hash = nanoid()
      const newMessage = `${message.slice(0, selectionEnd)}![Image](hash:${hash})${message.slice(selectionEnd)}`

      const start = selectionStart
      const end = selectionEnd + newMessage.length - message.length

      updateAtUserAtRecord(newMessage, start, end, 0)
      send(messageInputDomain.command.InputCommand(newMessage))

      imageRecord.current.set(hash, base64)

      requestIdleCallback(() => {
        inputRef.current?.setSelectionRange(end, end)
        inputRef.current?.focus()
      })
    } catch (error) {
      send(toastDomain.command.ErrorCommand((error as Error).message))
    } finally {
      setInputLoading(false)
    }
  }

  const handleInjectAtSyntax = (item: AutoCompleteItem) => {
    const atIndex = message.lastIndexOf('@', selectionEnd - 1)
    // Determine if there is a space before @
    const hasBeforeSpace = message.slice(atIndex - 1, atIndex) === ' '
    const hasAfterSpace = message.slice(selectionEnd, selectionEnd + 1) === ' '

    const username = item.kind === 'ai' ? 'ai' : item.username
    const atText = `${hasBeforeSpace ? '' : ' '}@${username}${hasAfterSpace ? '' : ' '}`
    const newMessage = message.slice(0, atIndex) + `${atText}` + message.slice(selectionEnd)

    setAutoCompleteListShow(false)

    // Pre-calculate the offset after InputCommand
    const start = atIndex
    const end = selectionStart + newMessage.length - message.length

    const atUserPosition: [number, number] = [start + (hasBeforeSpace ? 0 : +1), end - 1 + (hasAfterSpace ? 0 : -1)]

    // Calculate the difference after replacing @text with @user
    const offset = newMessage.length - message.length - (atUserPosition[1] - atUserPosition[0])

    if (item.kind === 'user') {
      updateAtUserAtRecord(newMessage, ...atUserPosition, offset, item.userId)
    } else {
      updateAtUserAtRecord(newMessage, ...atUserPosition, offset)
    }

    send(messageInputDomain.command.InputCommand(newMessage))
    requestIdleCallback(() => {
      inputRef.current!.setSelectionRange(end, end)
      inputRef.current!.focus()
    })
  }

  const root = getRootNode()

  return (
    <div className="relative grid gap-y-3 border-t border-border bg-background px-4 pb-4 pt-3 before:pointer-events-none before:absolute before:inset-x-4 before:-top-2 before:h-2 before:bg-gradient-to-t before:from-background before:from-30% before:to-transparent before:dark:from-background">
      <Presence present={autoCompleteListShow}>
        <Portal
          container={root}
          ref={shareAutoCompleteListRef}
          className="fixed z-infinity w-44 -translate-y-full overflow-hidden rounded-lg border bg-popover text-popover-foreground shadow-md duration-300 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
          style={{ left: `min(${x}px, 100vw - 192px)`, top: `${y}px` }}
        >
          <ScrollArea className="max-h-[204px] min-h-9 p-1" ref={setScrollParentRef}>
            <Virtuoso
              ref={virtuosoRef}
              data={autoCompleteList}
              defaultItemHeight={28}
              context={{ currentItemIndex: selectedUserIndex }}
              customScrollParent={scrollParentRef!}
              itemContent={(index, item) => (
                <div
                  key={item.kind === 'ai' ? 'ai-assistant' : item.userId}
                  onClick={() => handleInjectAtSyntax(item)}
                  onMouseEnter={() => setSelectedUserIndex(index)}
                  className={cn(
                    'flex cursor-pointer select-none items-center gap-x-2 rounded-md px-2 py-1.5 outline-none',
                    {
                      'bg-accent text-accent-foreground': index === selectedUserIndex
                    }
                  )}
                >
                  <Avatar className="size-4 shrink-0">
                    {item.kind === 'user' && <AvatarImage className="size-full" src={item.userAvatar} alt="avatar" />}
                    <AvatarFallback>{item.kind === 'ai' ? <BotIcon size={12} /> : item.username.at(0)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-xs text-slate-500 dark:text-slate-50">
                      {item.kind === 'ai' ? item.label : item.username}
                    </div>
                    {item.kind === 'ai' && (
                      <div className="truncate text-[10px] text-muted-foreground">{item.description}</div>
                    )}
                  </div>
                </div>
              )}
            ></Virtuoso>
          </ScrollArea>
        </Portal>
      </Presence>
      {privateChatTarget && (
        <div className="mb-1.5 flex items-center justify-between rounded-2xl border border-indigo-100 bg-indigo-50 px-3 py-2 text-sm font-semibold text-indigo-600 shadow-sm animate-in fade-in-0 slide-in-from-bottom-1 dark:border-indigo-950/50 dark:bg-indigo-950/30 dark:text-indigo-400">
          <div className="flex items-center gap-1.5 truncate">
            <span className="relative flex h-2 w-2 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
            </span>
            <span className="truncate">私密對話中 (僅傳送給 @{privateChatTarget.username})</span>
          </div>
          <button
            onClick={() => send(chatRoomDomain.command.SelectPrivateChatTargetCommand(null))}
            className="text-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-300 font-bold ml-2 shrink-0 transition-colors"
          >
            取消
          </button>
        </div>
      )}
      {aiTopicSuggestionsEnabled && !privateChatTarget && (
        <div className="rounded-3xl border border-border bg-muted/30 px-3 py-3 shadow-sm">
          <div className="mb-1 flex items-center justify-between gap-2">
            <div className="text-sm font-semibold text-foreground">{text.chatSuggestionsTitle}</div>
            {pageSuggestionsLoading && (
              <div className="text-xs text-muted-foreground">{text.chatSuggestionsLoading}</div>
            )}
          </div>
          <div className="mb-3 text-xs text-muted-foreground">{text.chatSuggestionsDescription}</div>
          <div className="flex flex-wrap gap-2">
            {pageSuggestions.map((item, index) => (
              <Button
                key={`${item.label}-${index}`}
                type="button"
                variant="outline"
                size="xs"
                className="h-auto rounded-full bg-background px-3 py-1.5 text-left text-sm whitespace-normal hover:bg-muted"
                onClick={() => handleInsertSuggestedPrompt(item.prompt)}
                title={item.prompt}
              >
                {item.label}
              </Button>
            ))}
          </div>
        </div>
      )}
      <div className="rounded-3xl border border-border bg-muted/20 p-3 shadow-sm">
        <MessageInput
          ref={shareRef}
          value={message}
          onChange={handleChange}
          onCompositionStart={handleCompositionStart}
          onCompositionEnd={handleCompositionEnd}
          loading={inputLoading}
          onPaste={handlePaste}
          onKeyDown={handleKeyDown}
          maxLength={MESSAGE_MAX_LENGTH}
          placeholder={
            privateChatTarget
              ? text.privateChatPlaceholder.replace('{username}', privateChatTarget.username)
              : enableAi
                ? text.aiPromptPlaceholder
                : text.chatPlaceholder
          }
        ></MessageInput>
        <div className="mt-3 flex items-center justify-between gap-1">
          <div className="flex min-w-0 flex-1 items-center gap-1">
            {enableAi && (
              <PanelModeSwitch active="chat" onAi={handleAskAi} chatLabel={text.chatTab} aiLabel={text.aiTab} />
            )}
            <div className="flex items-center gap-0.5">
              <EmojiButton onSelect={handleInjectEmoji}></EmojiButton>
              <ImageButton disabled={inputLoading} onSelect={handleInjectImage}></ImageButton>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="rounded-full text-muted-foreground hover:text-foreground shrink-0"
                onClick={handleInsertPageUrl}
                title={text.insertPageLink}
              >
                <LinkIcon size={20} />
              </Button>
              {enableAi && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="rounded-full text-muted-foreground hover:text-foreground shrink-0"
                  onClick={handleInjectAiPrompt}
                  title={text.aiInsertTitle}
                >
                  <BotIcon size={20} />
                </Button>
              )}
            </div>
          </div>
          <Button
            className="shrink-0 rounded-full bg-primary px-4 py-2 text-sm font-bold text-primary-foreground hover:bg-primary/95 flex items-center justify-center"
            size="sm"
            disabled={isSending || inputLoading}
            onClick={handleSend}
          >
            <span className="mr-1">{text.sendMessage}</span>
            <CornerDownLeftIcon className="text-primary-foreground/75" size={10}></CornerDownLeftIcon>
          </Button>
        </div>
      </div>
    </div>
  )
}

Footer.displayName = 'Footer'

export default Footer
