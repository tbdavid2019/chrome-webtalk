import { Remesh } from 'remesh'
import StatusModule from './modules/Status'
import { LocalStorageExtern } from './externs/Storage'
import { APP_STATUS_STORAGE_KEY } from '@/constants/config'
import StorageEffect from './modules/StorageEffect'
import ChatRoomDomain, { SendType } from '@/domain/ChatRoom'
import { map } from 'rxjs'

export interface AppStatus {
  open: boolean
  unread: number
  buttonsHidden: boolean
}

export const defaultStatusState = {
  open: false, // 修改為 true，使聊天室默認顯示
  unread: 0,
  buttonsHidden: false
}

const AppStatusDomain = Remesh.domain({
  name: 'AppStatusDomain',
  impl: (domain) => {
    const storageEffect = new StorageEffect({
      domain,
      extern: LocalStorageExtern,
      key: APP_STATUS_STORAGE_KEY
    })
    const chatRoomDomain = domain.getDomain(ChatRoomDomain())

    const StatusLoadModule = StatusModule(domain, {
      name: 'AppStatus.LoadStatusModule'
    })

    const StatusLoadIsFinishedQuery = domain.query({
      name: 'AppStatus.StatusLoadIsFinishedQuery',
      impl: ({ get }) => {
        return get(StatusLoadModule.query.IsFinishedQuery())
      }
    })

    const StatusState = domain.state<AppStatus>({
      name: 'AppStatus.StatusState',
      default: defaultStatusState
    })

    const OpenQuery = domain.query({
      name: 'AppStatus.IsOpenQuery',
      impl: ({ get }) => {
        return get(StatusState()).open
      }
    })

    const UnreadQuery = domain.query({
      name: 'AppStatus.UnreadQuery',
      impl: ({ get }) => {
        return get(StatusState()).unread
      }
    })

    const HasUnreadQuery = domain.query({
      name: 'AppStatus.HasUnreadQuery',
      impl: ({ get }) => {
        return get(StatusState()).unread > 0
      }
    })

    const ButtonsHiddenQuery = domain.query({
      name: 'AppStatus.ButtonsHiddenQuery',
      impl: ({ get }) => {
        return get(StatusState()).buttonsHidden
      }
    })

    const UpdateOpenCommand = domain.command({
      name: 'AppStatus.UpdateOpenCommand',
      impl: ({ get }, value: boolean) => {
        const status = get(StatusState())
        return UpdateStatusCommand({
          ...status,
          unread: value ? 0 : status.unread,
          open: value
        })
      }
    })

    const UpdateUnreadCommand = domain.command({
      name: 'AppStatus.UpdateUnreadCommand',
      impl: ({ get }, value: number) => {
        const status = get(StatusState())
        return UpdateStatusCommand({
          ...status,
          unread: value
        })
      }
    })

    const UpdateButtonsHiddenCommand = domain.command({
      name: 'AppStatus.UpdateButtonsHiddenCommand',
      impl: ({ get }, value: boolean) => {
        const status = get(StatusState())
        return UpdateStatusCommand({
          ...status,
          buttonsHidden: value
        })
      }
    })

    const UpdateStatusCommand = domain.command({
      name: 'AppStatus.UpdateStatusCommand',
      impl: (_, value: AppStatus) => {
        return [StatusState().new(value), SyncToStorageEvent()]
      }
    })

    const SyncToStorageEvent = domain.event({
      name: 'UserInfo.SyncToStorageEvent',
      impl: ({ get }) => {
        return get(StatusState())
      }
    })

    storageEffect
      .set(SyncToStorageEvent)
      .get<AppStatus>((value) => [
        UpdateStatusCommand(value ?? defaultStatusState),
        StatusLoadModule.command.SetFinishedCommand()
      ])
      .watch<AppStatus>((value) => [UpdateStatusCommand(value ?? defaultStatusState)])

    domain.effect({
      name: 'OnMessageEffect',
      impl: ({ fromEvent, get }) => {
        const onMessage$ = fromEvent(chatRoomDomain.event.OnMessageEvent).pipe(
          map((message) => {
            const status = get(StatusState())
            if (!status.open && message.type === SendType.Text) {
              return UpdateUnreadCommand(status.unread + 1)
            }
            return null
          })
        )
        return onMessage$
      }
    })

    return {
      query: {
        OpenQuery,
        UnreadQuery,
        HasUnreadQuery,
        StatusLoadIsFinishedQuery,
        ButtonsHiddenQuery
      },
      command: {
        UpdateOpenCommand,
        UpdateUnreadCommand,
        UpdateButtonsHiddenCommand
      },
      event: {
        SyncToStorageEvent
      }
    }
  }
})

export default AppStatusDomain
