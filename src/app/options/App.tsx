import { useEffect, useState } from 'react'
import { Toaster } from 'sonner'
import Main from './components/Main'
import ProfileForm from './components/ProfileForm'
import BadgeList from './components/BadgeList'
import Layout from './components/Layout'
import VersionLink from './components/VersionLink'
import { useRemeshDomain, useRemeshQuery } from 'remesh-react'
import UserInfoDomain from '@/domain/UserInfo'
import ApiSettingsForm from './components/ApiSettingsForm'
import { checkDarkMode, subscribeDarkModeChange } from '@/utils'

function App() {
  const userInfoDomain = useRemeshDomain(UserInfoDomain())
  const userInfo = useRemeshQuery(userInfoDomain.query.UserInfoQuery())
  const [systemIsDark, setSystemIsDark] = useState(() => checkDarkMode())

  useEffect(() => {
    return subscribeDarkModeChange(setSystemIsDark)
  }, [])

  const resolvedTheme =
    userInfo?.themeMode === 'system'
      ? systemIsDark
        ? 'dark'
        : 'light'
      : (userInfo?.themeMode ?? (systemIsDark ? 'dark' : 'light'))

  return (
    <div className={resolvedTheme}>
      <Layout>
        <VersionLink></VersionLink>
        <Main>
          <ProfileForm></ProfileForm>
          <ApiSettingsForm />
          <Toaster
            richColors
            theme={resolvedTheme}
            position="top-center"
          />
        </Main>
        <BadgeList></BadgeList>
      </Layout>
    </div>
  )
}

export default App
