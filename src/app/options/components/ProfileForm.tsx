import * as v from 'valibot'
import { useForm } from 'react-hook-form'
import { valibotResolver } from '@hookform/resolvers/valibot'
import { useRemeshDomain, useRemeshQuery, useRemeshSend } from 'remesh-react'
import { nanoid } from 'nanoid'
import { useEffect, type FC } from 'react'
import AvatarSelect from './AvatarSelect'
import { Button } from '@/components/ui/Button'
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/Form'
import { Input } from '@/components/ui/Input'
import UserInfoDomain, { type UserInfo } from '@/domain/UserInfo'
import AppStatusDomain from '@/domain/AppStatus'
import { cn, generateRandomAvatar } from '@/utils'
import { RadioGroup, RadioGroupItem } from '@/components/ui/RadioGroup'
import { Label } from '@/components/ui/Label'
import { RefreshCcwIcon } from 'lucide-react'
import { MAX_AVATAR_SIZE } from '@/constants/config'
import { ToastImpl } from '@/domain/impls/Toast'
import BlurFade from '@/components/magicui/BlurFade'
import { Checkbox } from '@/components/ui/Checkbox'
import Link from '@/components/Link'
import { getUiText } from '@/utils'

const defaultUserInfo: UserInfo = {
  id: nanoid(),
  name: '',
  avatar: '',
  createTime: Date.now(),
  language: 'auto',
  compatibilityMode: 'legacy',
  themeMode: 'system',
  developerMode: false,
  bannedUserIds: [],
  hideAllAiMessages: false,
  aiTopicSuggestionsEnabled: true,
  danmakuEnabled: true,
  danmakuOpacity: 0.8,
  danmakuSpeed: 'normal',
  notificationEnabled: true,
  notificationType: 'at',
  roomAvatarsEnabled: true,
  globalAvatar: '',
  roomAvatars: {}
}

const formSchema = v.object({
  id: v.string(),
  // Pure numeric strings will be converted to number
  // Issues: https://github.com/unjs/unstorage/issues/277
  createTime: v.number(),
  name: v.pipe(
    v.string(),
    v.trim(),
    v.minBytes(1, 'Please enter your username. / 請輸入暱稱'),
    v.maxBytes(20, 'Your username cannot exceed 20 bytes. / 暱稱長度最多 20 位元組')
  ),
  avatar: v.pipe(
    v.string(),
    v.notLength(0, 'Please select your avatar. / 請選擇頭像'),
    v.maxBytes(8 * 1024, `Your avatar cannot exceed 8kb. / 頭像檔案不可超過 8KB`)
  ),
  language: v.pipe(
    v.string(),
    v.union(
      [v.literal('auto'), v.literal('zh_TW'), v.literal('zh_CN'), v.literal('en')],
      'Please select interface language. / 請選擇介面語言'
    )
  ),
  compatibilityMode: v.optional(v.union([v.literal('legacy'), v.literal('upstream')])),
  themeMode: v.pipe(
    v.string(),
    v.union(
      [v.literal('system'), v.literal('light'), v.literal('dark')],
      'Please select extension theme mode. / 請選擇擴充主題模式'
    )
  ),
  developerMode: v.optional(v.boolean()),
  bannedUserIds: v.optional(v.array(v.string())),
  hideAllAiMessages: v.optional(v.boolean()),
  aiTopicSuggestionsEnabled: v.optional(v.boolean()),
  danmakuEnabled: v.boolean(),
  danmakuOpacity: v.optional(v.pipe(v.number(), v.minValue(0.1), v.maxValue(1.0))),
  danmakuSpeed: v.optional(v.pipe(v.string(), v.union([v.literal('slow'), v.literal('normal'), v.literal('fast')]))),
  notificationEnabled: v.boolean(),
  notificationType: v.pipe(
    v.string(),
    v.union([v.literal('all'), v.literal('at')], 'Please select notification type. / 請選擇通知種類')
  ),
  roomAvatarsEnabled: v.optional(v.boolean()),
  globalAvatar: v.optional(v.string()),
  roomAvatars: v.optional(v.any())
})
const ProfileForm: FC = () => {
  const send = useRemeshSend()
  const toast = ToastImpl.value

  const userInfoDomain = useRemeshDomain(UserInfoDomain())
  const userInfo = useRemeshQuery(userInfoDomain.query.UserInfoQuery())

  const appStatusDomain = useRemeshDomain(AppStatusDomain())
  const buttonsHidden = useRemeshQuery(appStatusDomain.query.ButtonsHiddenQuery())

  const form = useForm({
    resolver: valibotResolver(formSchema),
    defaultValues: userInfo ? { ...defaultUserInfo, ...userInfo } : defaultUserInfo
  })

  // Update defaultValues
  useEffect(() => {
    userInfo && form.reset({ ...defaultUserInfo, ...userInfo })
  }, [userInfo, form])

  const text = getUiText(form.watch('language'))

  const handleSubmit = (userInfo: UserInfo) => {
    const updated = { ...userInfo }
    updated.globalAvatar = userInfo.avatar
    if (!userInfo.roomAvatarsEnabled) {
      updated.avatar = userInfo.avatar
    }
    send(userInfoDomain.command.UpdateUserInfoCommand(updated))
    toast.success('Saved successfully! / 儲存成功！')
  }

  const handleWarning = (error: Error) => {
    toast.warning(error.message)
  }

  const handleError = (error: Error) => {
    toast.error(error.message)
  }

  const handleRefreshAvatar = async () => {
    const avatarBase64 = await generateRandomAvatar(MAX_AVATAR_SIZE)
    form.setValue('avatar', avatarBase64)
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleSubmit)}
        autoComplete="off"
        className="relative w-[450px] space-y-8 p-14 pt-20"
      >
        <FormField
          control={form.control}
          name="avatar"
          render={({ field }) => (
            <FormItem className="absolute inset-x-1 top-0 mx-auto grid w-fit -translate-y-1/3 justify-items-center">
              <FormControl>
                <div className="flex flex-col items-center gap-2">
                  <BlurFade key={form.getValues().avatar} duration={0.1}>
                    <AvatarSelect
                      compressSize={MAX_AVATAR_SIZE}
                      onError={handleError}
                      onWarning={handleWarning}
                      className="shadow-lg"
                      {...field}
                    ></AvatarSelect>
                  </BlurFade>
                  <Button
                    type="button"
                    size="xs"
                    className="mx-auto flex items-center gap-x-2"
                    onClick={handleRefreshAvatar}
                  >
                    <RefreshCcwIcon size={14} />
                    Random Avatar 隨機頭像
                  </Button>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="font-semibold">Username 使用者名稱</FormLabel>
              <FormControl>
                <Input placeholder="Please enter your username / 請輸入暱稱" {...field} />
              </FormControl>
              <FormDescription>This is your public display name. / 這是顯示給其他人的暱稱。</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="roomAvatarsEnabled"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="enable-room-avatars"
                    onCheckedChange={field.onChange}
                    checked={field.value}
                  />
                  <FormLabel className="cursor-pointer font-semibold" htmlFor="enable-room-avatars">
                    Different avatar per website 不同網站使用不同頭像
                  </FormLabel>
                </div>
              </FormControl>
              <FormDescription>
                When enabled, you will automatically use a different randomly generated avatar on different websites. The avatar chosen above will be your default. /
                開啟後，在不同網站聊天的頭像會自動隨機不同。上方設定的頭像會作為預設頭像。
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="language"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="font-semibold">{text.languageLabel}</FormLabel>
              <FormControl>
                <RadioGroup className="flex flex-wrap gap-x-4 gap-y-2" onValueChange={field.onChange} value={field.value}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="auto" id="language-auto" />
                    <Label className="cursor-pointer" htmlFor="language-auto">
                      {text.languageAuto}
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="zh_TW" id="language-zh-tw" />
                    <Label className="cursor-pointer" htmlFor="language-zh-tw">
                      {text.languageZhTw}
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="zh_CN" id="language-zh-cn" />
                    <Label className="cursor-pointer" htmlFor="language-zh-cn">
                      {text.languageZhCn}
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="en" id="language-en" />
                    <Label className="cursor-pointer" htmlFor="language-en">
                      {text.languageEn}
                    </Label>
                  </div>
                </RadioGroup>
              </FormControl>
              <FormDescription>{text.languageDescription}</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="compatibilityMode"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="font-semibold">{text.compatibilityLabel}</FormLabel>
              <FormControl>
                <RadioGroup className="flex gap-x-4" onValueChange={field.onChange} value={field.value ?? 'legacy'}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="legacy" id="compatibility-legacy" />
                    <Label className="cursor-pointer" htmlFor="compatibility-legacy">
                      {text.compatibilityLegacy}
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="upstream" id="compatibility-upstream" />
                    <Label className="cursor-pointer" htmlFor="compatibility-upstream">
                      {text.compatibilityUpstream}
                    </Label>
                  </div>
                </RadioGroup>
              </FormControl>
              <FormDescription>{text.compatibilityDescription}</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="danmakuEnabled"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    defaultChecked={false}
                    id="enable-danmaku"
                    onCheckedChange={field.onChange}
                    checked={field.value}
                  />
                  <FormLabel className="cursor-pointer font-semibold" htmlFor="enable-danmaku">
                    Enable Danmaku 開啟彈幕
                  </FormLabel>
                </div>
              </FormControl>
              <FormDescription>
                Enabling this option will display scrolling messages on the website. / 開啟後會在頁面上顯示彈幕訊息。
                <Link className="ml-2 text-primary" href="https://en.wikipedia.org/wiki/Danmaku_subtitling">
                  Wikipedia
                </Link>
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {form.watch('danmakuEnabled') && (
          <div className="pl-6 space-y-4 border-l-2 border-slate-200 dark:border-slate-800">
            <FormField
              control={form.control}
              name="danmakuOpacity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-semibold text-xs text-slate-500 dark:text-slate-400">
                    Danmaku Opacity 彈幕透明度
                  </FormLabel>
                  <FormControl>
                    <RadioGroup
                      className="flex gap-x-4"
                      onValueChange={(val) => field.onChange(parseFloat(val))}
                      value={String(field.value ?? 0.8)}
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="0.3" id="op-30" />
                        <Label className="cursor-pointer text-xs" htmlFor="op-30">
                          30%
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="0.5" id="op-50" />
                        <Label className="cursor-pointer text-xs" htmlFor="op-50">
                          50%
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="0.8" id="op-80" />
                        <Label className="cursor-pointer text-xs" htmlFor="op-80">
                          80%
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="1" id="op-100" />
                        <Label className="cursor-pointer text-xs" htmlFor="op-100">
                          100%
                        </Label>
                      </div>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="danmakuSpeed"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-semibold text-xs text-slate-500 dark:text-slate-400">
                    Danmaku Speed 彈幕速度
                  </FormLabel>
                  <FormControl>
                    <RadioGroup className="flex gap-x-4" onValueChange={field.onChange} value={field.value ?? 'normal'}>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="slow" id="sp-slow" />
                        <Label className="cursor-pointer text-xs" htmlFor="sp-slow">
                          Slow 慢
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="normal" id="sp-normal" />
                        <Label className="cursor-pointer text-xs" htmlFor="sp-normal">
                          Normal 正常
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="fast" id="sp-fast" />
                        <Label className="cursor-pointer text-xs" htmlFor="sp-fast">
                          Fast 快
                        </Label>
                      </div>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        )}

        <FormItem>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="show-floating-buttons"
              onCheckedChange={(checked) => {
                send(appStatusDomain.command.UpdateButtonsHiddenCommand(!checked))
              }}
              checked={!buttonsHidden}
            />
            <Label className="cursor-pointer font-semibold" htmlFor="show-floating-buttons">
              Show Floating Button 顯示右側懸浮按鈕
            </Label>
          </div>
          <FormDescription>
            Show the floating chat and AI buttons on the right side of the screen. / 在螢幕右側顯示聊天和 AI
            摘要的懸浮按鈕。如果隱藏，你也可以點擊瀏覽器工具列上的擴充功能圖示來重新顯示。
          </FormDescription>
        </FormItem>

        <FormField
          control={form.control}
          name="developerMode"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <div className="flex items-center space-x-2">
                  <Checkbox id="developer-mode" onCheckedChange={field.onChange} checked={field.value ?? false} />
                  <FormLabel className="cursor-pointer font-semibold" htmlFor="developer-mode">
                    {text.profileDeveloperMode}
                  </FormLabel>
                </div>
              </FormControl>
              <FormDescription>{text.profileDeveloperModeDescription}</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="hideAllAiMessages"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <div className="flex items-center space-x-2">
                  <Checkbox id="hide-all-ai-messages" onCheckedChange={field.onChange} checked={field.value ?? false} />
                  <FormLabel className="cursor-pointer font-semibold" htmlFor="hide-all-ai-messages">
                    {text.profileHideAllAiMessages}
                  </FormLabel>
                </div>
              </FormControl>
              <FormDescription>{text.profileHideAllAiMessagesDescription}</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="aiTopicSuggestionsEnabled"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="ai-topic-suggestions-enabled"
                    onCheckedChange={field.onChange}
                    checked={field.value ?? true}
                  />
                  <FormLabel className="cursor-pointer font-semibold" htmlFor="ai-topic-suggestions-enabled">
                    {text.profileAiTopicSuggestions}
                  </FormLabel>
                </div>
              </FormControl>
              <FormDescription>{text.profileAiTopicSuggestionsDescription}</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="notificationType"
          render={({ field }) => (
            <FormItem>
              <FormField
                control={form.control}
                name="notificationEnabled"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          defaultChecked={false}
                          id="enable-notification"
                          onCheckedChange={field.onChange}
                          checked={field.value}
                        />
                        <FormLabel className="cursor-pointer font-semibold" htmlFor="enable-notification">
                          Enable Notification 開啟桌面通知
                        </FormLabel>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormControl className="pl-6">
                <RadioGroup
                  disabled={!form.getValues('notificationEnabled')}
                  className="flex gap-x-4"
                  onValueChange={field.onChange}
                  value={field.value}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="all" id="all" />
                    <Label
                      className={cn(
                        'cursor-pointer',
                        !form.getValues('notificationEnabled') && 'cursor-not-allowed opacity-50'
                      )}
                      htmlFor="all"
                    >
                      All message 全部訊息
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="at" id="at" />
                    <Label
                      className={cn(
                        'cursor-pointer',
                        !form.getValues('notificationEnabled') && 'cursor-not-allowed opacity-50'
                      )}
                      htmlFor="at"
                    >
                      Only @self 只在 @ 我時
                    </Label>
                  </div>
                </RadioGroup>
              </FormControl>
              <FormDescription>
                Enabling this option will display desktop notifications for messages. / 開啟後會顯示桌面通知。
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="themeMode"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="font-semibold">Theme Mode 主題模式</FormLabel>
              <FormControl>
                <RadioGroup className="flex gap-x-4" onValueChange={field.onChange} value={field.value}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="system" id="system" />
                    <Label className="cursor-pointer" htmlFor="system">
                      System 系統
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="light" id="light" />
                    <Label className="cursor-pointer" htmlFor="light">
                      Light 亮色
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="dark" id="dark" />
                    <Label className="cursor-pointer" htmlFor="dark">
                      Dark 暗色
                    </Label>
                  </div>
                </RadioGroup>
              </FormControl>
              <FormDescription>
                The theme mode of the extension. If you choose the system, will follow the system theme. /
                套件顯示的主題模式；選擇「系統」即跟隨作業系統設定。
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button className="w-full" type="submit">
          Save 保存
        </Button>
      </form>
    </Form>
  )
}

ProfileForm.displayName = 'ProfileForm'

export default ProfileForm
