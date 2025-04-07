import { type FC, useState, type MouseEvent } from 'react'
import { SettingsIcon, MoonIcon, SunIcon } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

import { useRemeshDomain, useRemeshQuery, useRemeshSend } from 'remesh-react'
import { EyeIcon, EyeOffIcon } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { EVENT } from '@/constants/event'
import UserInfoDomain from '@/domain/UserInfo'
import useTriggerAway from '@/hooks/useTriggerAway'
import { checkDarkMode, cn } from '@/utils'
import LogoIcon0 from '@/assets/images/logo-0.svg'
import LogoIcon1 from '@/assets/images/logo-1.svg'
import LogoIcon2 from '@/assets/images/logo-2.svg'
import LogoIcon3 from '@/assets/images/logo-3.svg'
import LogoIcon4 from '@/assets/images/logo-4.svg'
import LogoIcon5 from '@/assets/images/logo-5.svg'
import LogoIcon6 from '@/assets/images/logo-6.svg'
import AppStatusDomain from '@/domain/AppStatus'
import { getDay } from 'date-fns'
import { messenger } from '@/messenger'

export interface AppButtonProps {
  className?: string
}

const AppButton: FC<AppButtonProps> = ({ className }) => {
  const send = useRemeshSend()
  const appStatusDomain = useRemeshDomain(AppStatusDomain())
  const appOpenStatus = useRemeshQuery(appStatusDomain.query.OpenQuery())
  const buttonsHidden = useRemeshQuery(appStatusDomain.query.ButtonsHiddenQuery())
  const hasUnreadQuery = useRemeshQuery(appStatusDomain.query.HasUnreadQuery())
  const userInfoDomain = useRemeshDomain(UserInfoDomain())
  const userInfo = useRemeshQuery(userInfoDomain.query.UserInfoQuery())

  const DayLogo = [LogoIcon0, LogoIcon1, LogoIcon2, LogoIcon3, LogoIcon4, LogoIcon5, LogoIcon6][getDay(Date())]

  const isDarkMode = userInfo?.themeMode === 'dark' ? true : userInfo?.themeMode === 'light' ? false : checkDarkMode()

  const [menuOpen, setMenuOpen] = useState(false)

  const { setRef: appMenuRef } = useTriggerAway(['click'], () => setMenuOpen(false))

  const handleToggleMenu = (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    setMenuOpen(!menuOpen)
  }

  const handleSwitchTheme = () => {
    if (userInfo) {
      send(userInfoDomain.command.UpdateUserInfoCommand({ ...userInfo, themeMode: isDarkMode ? 'light' : 'dark' }))
    } else {
      handleOpenOptionsPage()
    }
  }

  const handleOpenOptionsPage = () => {
    messenger.sendMessage(EVENT.OPTIONS_PAGE_OPEN, undefined)
  }

  const handleToggleApp = () => {
    send(appStatusDomain.command.UpdateOpenCommand(!appOpenStatus))
  }

  const handleToggleButtonsVisibility = () => {
    send(appStatusDomain.command.UpdateButtonsHiddenCommand(!buttonsHidden))
    setMenuOpen(false)
  }

  return (
    <div
      ref={appMenuRef}
      className={cn('fixed top-1/2 right-0 z-infinity transform -translate-y-1/2 grid gap-y-3 select-none', className)}
    >
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            className="z-10 mr-2 grid gap-y-3"
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 12 }}
            transition={{ duration: 0.1 }}
          >
            <Button
              onClick={handleSwitchTheme}
              variant="outline"
              className="relative size-10 overflow-hidden rounded-full p-0 shadow dark:border-slate-600"
            >
              <div
                className={cn(
                  'absolute grid grid-rows-[repeat(2,minmax(0,2.5rem))] w-full justify-center items-center transition-all duration-300',
                  isDarkMode ? 'top-0' : '-top-10',
                  isDarkMode ? 'bg-slate-950 text-white' : 'bg-white text-orange-400'
                )}
              >
                <MoonIcon size={20} />
                <SunIcon size={20} />
              </div>
            </Button>

            <Button
              onClick={handleToggleButtonsVisibility}
              variant="outline"
              className="size-10 rounded-full p-0 shadow dark:border-slate-600"
            >
              {buttonsHidden ? <EyeIcon size={20} /> : <EyeOffIcon size={20} />}
            </Button>

            <Button
              onClick={handleOpenOptionsPage}
              variant="outline"
              className="size-10 rounded-full p-0 shadow dark:border-slate-600"
            >
              <SettingsIcon size={20} />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
      <Button
        onClick={handleToggleApp}
        onContextMenu={handleToggleMenu}
        className="relative z-20 size-11 rounded-l-full rounded-r-none p-0 text-xs shadow-lg shadow-slate-500/50 after:absolute after:-inset-0.5 after:z-10 after:animate-[shimmer_2s_linear_infinite] after:rounded-l-full after:rounded-r-none after:bg-[conic-gradient(from_var(--shimmer-angle),theme(colors.slate.500)_0%,theme(colors.white)_10%,theme(colors.slate.500)_20%)]"
      >
        <AnimatePresence>
          {hasUnreadQuery && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.1 }}
              className="absolute -right-1 -top-1 z-30 flex size-5 items-center justify-center"
            >
              <span
                className={cn('absolute inline-flex size-full animate-ping rounded-full opacity-75', 'bg-orange-400')}
              ></span>
              <span className={cn('relative inline-flex size-3 rounded-full', 'bg-orange-500')}></span>
            </motion.div>
          )}
        </AnimatePresence>

        <DayLogo className="relative z-20 max-h-full max-w-full overflow-hidden"></DayLogo>
      </Button>
    </div>
  )
}

AppButton.displayName = 'AppButton'

export default AppButton
